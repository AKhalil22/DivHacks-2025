import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./EarthStartThread.css";
import earthImg from "../../images/earth.png";

export default function EarthStartThread() {
  const navigate = useNavigate();
  const [threadName, setThreadName] = useState("");
  const [body, setBody] = useState("");

  const username = localStorage.getItem("username") || "Anonymous";
  const canSend = threadName.trim().length > 0 && body.trim().length > 0;

  const onSend = (e) => {
    e.preventDefault();
    if (!canSend) return;

    // Save custom title + single first post for Earth
    localStorage.setItem("planetTitle:earth", threadName.trim());
    const firstPost = {
      id: `p${Date.now()}`,
      author: username,
      body: body.trim(),
      score: 0,
      avatar: null,
      ts: "now",
      image: null,
      comments: [],
    };
    localStorage.setItem("planetThread:earth", JSON.stringify([firstPost]));

    // Go to planet forum page
    navigate("/planet/earth");
  };

  return (
    <div className="earth-wrap">
      <header className="earth-header">
        <button
          className="back-btn"
          aria-label="Back to home"
          onClick={() => navigate("/home")}
        >
          {/* left arrow icon */}
          <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
            <path fill="currentColor" d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
        </button>

        <h1 className="earth-title">Start my own thread</h1>
      </header>

      <section className="composer">
        {/* Thread name */}
        <label htmlFor="earth-name" className="composer-label">
          Enter thread name:
        </label>
        <input
          id="earth-name"
          className="thread-name-input"
          type="text"
          value={threadName}
          onChange={(e) => setThreadName(e.target.value)}
          maxLength={100}
        />

        {/* First post */}
        <label htmlFor="earth-textarea" className="composer-label">
          Write the first post:
        </label>
        <div className="composer-row">
          <textarea
            id="earth-textarea"
            className="composer-input"
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
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
      </section>

      <div className="earth-hero">
        <img src={earthImg} alt="" />
      </div>

      <footer className="brand">TechSpace</footer>
    </div>
  );
}
