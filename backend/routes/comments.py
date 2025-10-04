from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Query
from google.cloud import firestore
import time
from typing import Optional, List

from ..deps import get_current_user, rate_limit, UserContext
from ..firebase import get_db
from ..schemas import (
    CommentCreate,
    CommentOut,
    CommentsPage,
    encode_cursor,
    decode_cursor,
    encode_comment_cursor,
    decode_comment_cursor,
    mask_author_uid,
)
from ..utils import sanitize_markdown

router = APIRouter(prefix="/threads/{thread_id}/comments", tags=["comments"])


@router.post("", response_model=CommentOut, status_code=201)
async def add_comment(
    thread_id: str,
    payload: CommentCreate,
    user: UserContext = Depends(get_current_user),
    _=Depends(rate_limit),
):
    db = get_db()
    thread_ref = db.collection("threads").document(thread_id)
    comment_ref = thread_ref.collection("comments").document()
    now = time.time()

    def txn(transaction: firestore.Transaction):
        snap = thread_ref.get(transaction=transaction)
        if not snap.exists:
            raise HTTPException(status_code=404, detail="Thread not found")
        thread_data = snap.to_dict()
        new_count = int(thread_data.get("comment_count", 0)) + 1
        transaction.update(
            thread_ref,
            {"comment_count": new_count, "last_activity": now, "updated_at": now},
        )
        transaction.set(
            comment_ref,
            {
                "body": sanitize_markdown(payload.body.strip()),
                "author_uid": user["uid"],
                "author_mode": payload.author_mode,
                "created_at": now,
                "score": 0.0,
            },
        )

    transaction = db.transaction()
    try:
        transaction.call(txn)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Failed to add comment") from exc

    return CommentOut(
        id=comment_ref.id,
        body=sanitize_markdown(payload.body.strip()),
        author_uid=mask_author_uid(payload.author_mode, user["uid"]),
        author_mode=payload.author_mode,
        created_at=now,
        score=0.0,
    )


@router.get("", response_model=CommentsPage)
async def list_comments(
    thread_id: str,
    sort: str = Query("new", regex="^(new|top)$"),
    limit: int = Query(20, le=100),
    page_token: Optional[str] = None,
):
    db = get_db()
    thread_ref = db.collection("threads").document(thread_id)
    thread_snap = thread_ref.get()
    if not thread_snap.exists:
        raise HTTPException(status_code=404, detail="Thread not found")

    base_query = thread_ref.collection("comments")
    if sort == "new":
        base_query = base_query.order_by(
            "created_at", direction=firestore.Query.DESCENDING
        )
    else:
        # For now also order by created_at; placeholder for score ordering
        base_query = base_query.order_by(
            "score", direction=firestore.Query.DESCENDING
        ).order_by("created_at", direction=firestore.Query.DESCENDING)

    cursor = decode_comment_cursor(page_token) if page_token else None
    if cursor:
        if sort == "new":
            last_ts = cursor.get("ts")
            base_query = base_query.start_after({"created_at": last_ts})
        else:
            # For top we order by score desc, created_at desc: need both to paginate
            last_score = cursor.get("score", 0.0)
            last_ts = cursor.get("ts")
            # Firestore start_after expects field values in order-of-order_by
            base_query = base_query.start_after((last_score, last_ts))

    docs = list(base_query.limit(limit + 1).stream())
    items: List[CommentOut] = []
    for d in docs[:limit]:
        data = d.to_dict()
        items.append(
            CommentOut(
                id=d.id,
                body=data.get("body"),
                author_mode=data.get("author_mode"),
                author_uid=mask_author_uid(
                    data.get("author_mode"), data.get("author_uid")
                ),
                created_at=data.get("created_at"),
                score=data.get("score", 0.0),
            )
        )
    next_token = None
    if len(docs) > limit:
        last = docs[limit - 1]
        ld = last.to_dict()
        if sort == "new":
            next_token = encode_cursor(last.id, ld.get("created_at"))
        else:
            next_token = encode_comment_cursor(
                last.id, ld.get("created_at"), sort, ld.get("score", 0.0)
            )
    return CommentsPage(items=items, next_page_token=next_token)
