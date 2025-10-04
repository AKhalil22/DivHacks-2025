from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
import time
from typing import Literal

from ..deps import get_current_user, UserContext, rate_limit
from ..firebase import get_db

router = APIRouter(prefix="", tags=["moderation"])


class ReportIn(BaseModel):
    target_type: Literal["thread", "comment"]
    target_id: str = Field(min_length=1)
    reason: str = Field(min_length=3, max_length=500)


class ReportOut(BaseModel):
    id: str
    target_type: str
    target_id: str
    reason: str
    created_at: float


class BlockIn(BaseModel):
    blocked_uid: str = Field(min_length=1)


class BlockOut(BaseModel):
    blocked_uid: str
    created_at: float


@router.post("/reports", response_model=ReportOut, status_code=202)
async def create_report(
    payload: ReportIn,
    user: UserContext = Depends(get_current_user),
    _=Depends(rate_limit),
):
    # For MVP we just persist to a collection; moderation system can process async.
    db = get_db()
    now = time.time()
    doc_ref = db.collection("reports").document()
    data = {
        "reporter_uid": user["uid"],
        "target_type": payload.target_type,
        "target_id": payload.target_id,
        "reason": payload.reason.strip(),
        "created_at": now,
        "status": "open",
    }
    doc_ref.set(data)
    return ReportOut(
        id=doc_ref.id,
        target_type=data["target_type"],
        target_id=data["target_id"],
        reason=data["reason"],
        created_at=now,
    )


@router.post("/blocks", response_model=BlockOut, status_code=201)
async def block_user(
    payload: BlockIn,
    user: UserContext = Depends(get_current_user),
    _=Depends(rate_limit),
):
    if payload.blocked_uid == user["uid"]:
        raise HTTPException(status_code=422, detail="Cannot block yourself")
    db = get_db()
    now = time.time()
    doc_ref = db.collection("blocks").document(f"{user['uid']}__{payload.blocked_uid}")
    doc_ref.set(
        {
            "blocker_uid": user["uid"],
            "blocked_uid": payload.blocked_uid,
            "created_at": now,
        }
    )
    return BlockOut(blocked_uid=payload.blocked_uid, created_at=now)
