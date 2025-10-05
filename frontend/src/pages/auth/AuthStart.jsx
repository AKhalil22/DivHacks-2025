import React from "react";

export default function AuthStart({ navigate }) {
  return (
    <div className="full-center dark-stage">
      <div style={{ textAlign: "center" }}>
        <h1 className="pixel-title">TechSpace</h1>
        <div style={{ display: "grid", gap: 12 }}>
          <button className="cta" onClick={() => navigate("/auth/email")}>
            create account
          </button>
          <button className="link-btn" onClick={() => navigate("/auth/signin")}>
            sign in
          </button>
        </div>
      </div>
    </div>
  );
}

