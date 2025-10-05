import React from "react";

export default function Landing({ navigate }) {
  return (
    <div className="landing-wrap">
      <div className="landing-card">
        <h1 className="landing-title">Hello World...</h1>
        <div className="earth-emoji">🌍</div>

        {/* go to the auth flow */}
        <button className="skip" onClick={() => navigate("/auth")}>
          Continue
        </button>
      </div>
    </div>
  );
}
