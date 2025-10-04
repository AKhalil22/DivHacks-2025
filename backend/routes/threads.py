from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Query
from google.cloud import firestore
import time
from typing import Optional, List

from ..deps import get_current_user, rate_limit, UserContext
from ..firebase import get_db
from ..schemas import (
    ThreadCreate,
    ThreadOut,
    ThreadsPage,
    encode_cursor,
    decode_cursor,
    mask_author_uid,
)
from ..utils import sanitize_markdown

router = APIRouter(prefix="/threads", tags=["threads"])


@router.post("", response_model=ThreadOut, status_code=201)
async def create_thread(
    payload: ThreadCreate,
    user: UserContext = Depends(get_current_user),
    _=Depends(rate_limit),
):
    db = get_db()
    threads_ref = db.collection("threads")
    now = time.time()
    data = {
        "title": sanitize_markdown(payload.title.strip()),
        "body": sanitize_markdown(payload.body.strip()),
        "tags": payload.tags,
        "author_uid": user["uid"],
        "author_mode": payload.author_mode,
        "comment_count": 0,
        "last_activity": now,
        "created_at": now,
        "updated_at": now,
    }
    doc_ref = threads_ref.document()
    doc_ref.set(data)
    return ThreadOut(
        id=doc_ref.id,
        **{
            **data,
            "author_uid": mask_author_uid(data["author_mode"], data["author_uid"]),
        },
    )


@router.get("", response_model=ThreadsPage)
async def list_threads(
    tag: Optional[str] = None,
    limit: int = Query(20, le=50),
    page_token: Optional[str] = None,
):
    db = get_db()
    threads_ref = db.collection("threads").order_by(
        "last_activity", direction=firestore.Query.DESCENDING
    )
    if tag:
        tag = tag.lower()
        threads_ref = threads_ref.where("tags", "array_contains", tag)

    cursor = decode_cursor(page_token) if page_token else None
    if cursor:
        # Firestore needs field ordering; we use last_activity only here
        last_activity = cursor.get("ts")
        doc_id = cursor.get("id")
        # Use start_after with a synthetic doc snapshot requires fetching the doc
        doc_snapshot = db.collection("threads").document(doc_id).get()
        threads_ref = (
            threads_ref.start_after({"last_activity": last_activity})
            if not doc_snapshot.exists
            else threads_ref.start_after(doc_snapshot)
        )

    docs = list(threads_ref.limit(limit + 1).stream())
    items: List[ThreadOut] = []
    for d in docs[:limit]:
        data = d.to_dict()
        items.append(
            ThreadOut(
                id=d.id,
                title=data.get("title"),
                body=data.get("body"),
                tags=data.get("tags", []),
                author_mode=data.get("author_mode"),
                author_uid=mask_author_uid(
                    data.get("author_mode"), data.get("author_uid")
                ),
                comment_count=data.get("comment_count", 0),
                last_activity=data.get("last_activity"),
                created_at=data.get("created_at"),
                updated_at=data.get("updated_at"),
            )
        )
    next_token = None
    if len(docs) > limit:
        last = docs[limit - 1]
        ld = last.to_dict()
        next_token = encode_cursor(last.id, ld.get("last_activity"))
    return ThreadsPage(items=items, next_page_token=next_token)


@router.get("/{thread_id}", response_model=ThreadOut)
async def get_thread(thread_id: str):
    db = get_db()
    snap = db.collection("threads").document(thread_id).get()
    if not snap.exists:
        raise HTTPException(status_code=404, detail="Thread not found")
    data = snap.to_dict()
    return ThreadOut(
        id=snap.id,
        **{
            **data,
            "author_uid": mask_author_uid(
                data.get("author_mode"), data.get("author_uid")
            ),
        },
    )
