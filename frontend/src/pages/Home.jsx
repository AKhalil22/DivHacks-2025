import React from "react";

export default function Home({ navigate }) {
  return (
    <div style={{ padding: 24 }}>
      <h1>👽 TechSpace Home</h1>
      <p>Choose where to go:</p>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => navigate("/planet/test")}>Go to a Planet</button>
        <button onClick={() => navigate("/profile")}>Go to Profile</button>
      </div>
    </div>
  );
}
