from __future__ import annotations
from fastapi import APIRouter, HTTPException, Depends
from google.cloud import firestore
import time

from ..deps import get_current_user, UserContext
from ..firebase import get_db
from ..schemas import ProfileIn, ProfileOut

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.post(
    "",
    response_model=ProfileOut,
    responses={409: {"description": "Username exists"}},
)
async def create_or_update_profile(
    payload: ProfileIn, user: UserContext = Depends(get_current_user)
):
    db = get_db()
    username_lower = payload.username.lower()
    users_ref = db.collection("users")

    # Check uniqueness
    existing = list(
        users_ref.where("username_lower", "==", username_lower).limit(1).stream()
    )
    if existing:
        doc = existing[0]
        if doc.id != user["uid"]:
            raise HTTPException(status_code=409, detail="Username already taken")

    doc_ref = users_ref.document(user["uid"])
    now = time.time()
    data = {
        "display_name": payload.display_name,
        "username": payload.username,
        "username_lower": username_lower,
        "allow_anonymous": (
            True if payload.allow_anonymous is None else payload.allow_anonymous
        ),
        "resume_url": payload.resume_url,
        "updated_at": now,
    }

    created_new = False

    def txn(transaction: firestore.Transaction):
        nonlocal created_new
        snapshot = doc_ref.get(transaction=transaction)
        if snapshot.exists:
            transaction.update(doc_ref, data)
            created_at_local = snapshot.get("created_at")
        else:
            data_with_create = data | {"created_at": now}
            transaction.set(doc_ref, data_with_create)
            created_at_local = now
            created_new = True
        return created_at_local

    transaction = db.transaction()
    created_at = transaction.call(txn)

    out = ProfileOut(
        uid=user["uid"],
        display_name=data["display_name"],
        username=data["username"],
        allow_anonymous=data["allow_anonymous"],
        resume_url=data["resume_url"],
        created_at=created_at,
        updated_at=data["updated_at"],
    )
    # FastAPI will infer 200; manually override if created
    if created_new:
        from fastapi import Response

        return Response(
            content=out.json(), media_type="application/json", status_code=201
        )
    return out
