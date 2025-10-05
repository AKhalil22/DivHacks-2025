// Imports

// Initialize async method to update/insert user profile
export async function upsertProfile(profileData) {
  const token = localStorage.getItem("idToken");
  const res = await fetch("http://localhost:8000/profiles", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(profileData),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText);
  }

  return res.json();
}