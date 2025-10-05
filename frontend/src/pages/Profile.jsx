import React, { useState } from "react";

export default function Profile() {
  const [form, setForm] = useState({ name: "", email: "", username: "", bio: "" });
  const onChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto", padding: 16 }}>
      <h2>👤 Create Your TechSpace Profile</h2>
      <input name="name" placeholder="Full name" value={form.name} onChange={onChange} />
      <input name="email" placeholder="Email" value={form.email} onChange={onChange} />
      <input name="username" placeholder="Username" value={form.username} onChange={onChange} />
      <textarea name="bio" placeholder="Short bio" rows={3} value={form.bio} onChange={onChange} />
    </div>
  );
}

