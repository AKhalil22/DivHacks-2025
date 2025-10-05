import React from "react";

export default function Planet({ planetId, navigate }) {
  return (
    <div style={{ padding: 24 }}>
      <button onClick={() => navigate("/")}>← back</button>
      <h2>Planet • {planetId}</h2>
      <p>Posts for this planet will show here.</p>
    </div>
  );
}
