import React, { useEffect, useState } from "react";
import Landing from "./pages/Landing.jsx";
import Home from "./pages/Home.jsx";
import Planet from "./pages/Planet.jsx";
import Profile from "./pages/Profile.jsx";
import "./index.css"; // global css
// 👇 NEW: auth flow pages
/*
import AuthStart from "./pages/auth/AuthStart.jsx";
import EmailStep from "./pages/auth/EmailStep.jsx";
import PasswordStep from "./pages/auth/PasswordStep.jsx";
import UsernameStep from "./pages/auth/UsernameStep.jsx";
import BioStep from "./pages/auth/BioStep.jsx";
*/

export default function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = (to) => {
    window.history.pushState({}, "", to);
    setPath(to);
  };

  const parts = path.split("/").filter(Boolean);
  const [first, second] = parts;

  // Landing
  if (!first) return <Landing navigate={navigate} />;

  // 👇 NEW: Auth routes
  if (first === "auth" && !second)       return <AuthStart   navigate={navigate} />;
  if (first === "auth" && second === "email")     return <EmailStep   navigate={navigate} />;
  if (first === "auth" && second === "password")  return <PasswordStep navigate={navigate} />;
  if (first === "auth" && second === "username")  return <UsernameStep navigate={navigate} />;
  if (first === "auth" && second === "bio")       return <BioStep      navigate={navigate} />;

  // Core app routes
  if (first === "home")    return <Home navigate={navigate} />;
  if (first === "profile") return <Profile />;
  if (first === "planet" && second)
    return <Planet planetId={second} navigate={navigate} />;

  // Fallback
  return <Landing navigate={navigate} />;
}
