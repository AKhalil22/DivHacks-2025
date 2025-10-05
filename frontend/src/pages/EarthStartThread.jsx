import React, { useEffect, useState } from "react";
import "./EarthStartThread.css";

// If your image is elsewhere, adjust the path:
import earthImg from "../../images/earth.png";

// tiny inline tag icon (white ticket)
const TagIcon = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    aria-hidden="true"
    fill="currentColor"
  >
    <path d="M21.41 11.58 12.42 2.59A2 2 0 0 0 11 2H4a2 2 0 0 0-2 2v7c0 .53.21 1.04.59 1.41l8.99 8.99a2 2 0 0 0 2.83 0l7.99-7.99a2 2 0 0 0 0-2.83ZM6.5 7.5A1.5 1.5 0 1 1 8 6a1.5 1.5 0 0 1-1.5 1.5Z" />
  </svg>
);

export default function EarthStartThread() {
  const [text, setText] = useState("");
  const [tags, setTags] = useState([]);
  const [addingTag, setAddingTag] = useState(false);
  const [tagInput, setTagInput] = useState("");

  // simple persistence for draft on this screen
  useEffect(() => {
    const saved = localStorage.getItem("earth:draft");
    const savedTags = localStorage.getItem("earth:tags");
    if (saved) setText(saved);
    if (savedTags) {
      try {
        setTags(JSON.parse(savedTags));
      } catch {}
    }
  }, []);
  useEffect(() => {
    localStorage.setItem("earth:draft", text);
  }, [text]);
  useEffect(() => {
    localStorage.setItem("earth:tags", JSON.stringify(tags));
  }, [tags]);

  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    if (!tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
    setAddingTag(false);
  };

  const removeTag = (t) => setTags((prev) => prev.filter((x) => x !== t));

  const onSend = () => {
    if (!text.trim()) return;
    // For now—just a placeholder action. Hook this up to your backend later.
    alert(`Your Earth thread was created!\n\nTags: ${tags.join(", ") || "none"}`);
    setText("");
    setTags([]);
    localStorage.removeItem("earth:draft");
    localStorage.removeItem("earth:tags");
  };

  const canSend = text.trim().length > 0;

  return (
    <div className="earth-wrap">
      <header className="earth-header">
        <h1 className="earth-title">Start my own thread:</h1>
      </header>

      <section className="composer">
        <label htmlFor="earth-textarea" className="composer-label">
          Type here:
        </label>

        <div className="composer-row">
          <textarea
            id="earth-textarea"
            className="composer-input"
            rows={5}
            value={text}
            placeholder=""
            onChange={(e) => setText(e.target.value)}
          />

        {/* right-side send column */}
          <div className="composer-side">
            <button
              className={`send-btn ${canSend ? "ready" : ""}`}
              disabled={!canSend}
              onClick={onSend}
            >
              Send
            </button>
          </div>
        </div>

        {/* tag area */}
        <div className="tagbar">
          <button
            type="button"
            className="tag-add"
            onClick={() => setAddingTag((v) => !v)}
          >
            <TagIcon className="tag-icon" />
            <span>Click here to add tags</span>
          </button>

          {/* chips */}
          {tags.length > 0 && (
            <ul className="tag-list">
              {tags.map((t) => (
                <li key={t} className="tag-chip">
                  <span className="chip-text">#{t}</span>
                  <button
                    className="chip-x"
                    aria-label={`remove ${t}`}
                    onClick={() => removeTag(t)}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}

          {addingTag && (
            <div className="tag-input-row">
              <input
                className="tag-input"
                placeholder="new tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  } else if (e.key === "Escape") {
                    setAddingTag(false);
                    setTagInput("");
                  }
                }}
              />
              <button className="tag-save" onClick={addTag}>
                add
              </button>
            </div>
          )}
        </div>
      </section>

      {/* big earth illustration */}
      <div className="earth-hero">
        <img src={earthImg} alt="" />
      </div>

      <footer className="brand">TechSpace</footer>
    </div>
  );
}
