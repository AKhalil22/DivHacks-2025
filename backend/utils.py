"""Utility helpers: content sanitization, future scoring placeholders."""

from __future__ import annotations
import bleach

ALLOWED_TAGS = [
    "b",
    "i",
    "em",
    "strong",
    "code",
    "pre",
    "a",
    "ul",
    "ol",
    "li",
    "p",
    "br",
    "blockquote",
]
ALLOWED_ATTRS = {"a": ["href", "title", "rel"]}


def sanitize_markdown(text: str) -> str:
    """Sanitize user-supplied markdown/HTML snippet.

    We accept a conservative set of tags; all scripts/events removed.
    """
    return bleach.clean(text, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRS, strip=True)


__all__ = ["sanitize_markdown"]
