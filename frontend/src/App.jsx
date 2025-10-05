// src/App.jsx (merged)
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Public / landing & auth flow (multi-step + traditional forms)
import Landing from "./pages/Landing.jsx";
import AuthStart from "./pages/auth/AuthStart.jsx";
import EmailStep from "./pages/auth/EmailStep.jsx";
import PasswordStep from "./pages/auth/PasswordStep.jsx";
import UsernameStep from "./pages/auth/UsernameStep.jsx";
import SignIn from "./pages/SignIn.jsx";
import CreateAccount from "./pages/CreateAccount.jsx";

// Core app pages
import Home from "./pages/Home.jsx";
import Profile from "./pages/Profile.jsx";

// Planet / thread routing additions from main branch
import PlanetRouter from "./pages/PlanetRouter.jsx";
import EarthStartThread from "./pages/EarthStartThread.jsx";

// Auth route guards
import { RequireAuth, PublicOnly } from "./context/RouteGuards.jsx";

import "./App.css";
import "./index.css";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Landing & multi-step auth wizard */}
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<AuthStart />} />
        <Route path="/auth/EmailStep" element={<EmailStep />} />
        <Route path="/auth/PasswordStep" element={<PasswordStep />} />
        <Route path="/auth/username" element={<UsernameStep />} />

        {/* Traditional auth pages (guarded so authenticated users can't revisit) */}
        <Route path="/signin" element={<PublicOnly><SignIn /></PublicOnly>} />
        <Route path="/register" element={<PublicOnly><CreateAccount /></PublicOnly>} />

        {/* Auth-protected application areas */}
        <Route path="/home" element={<RequireAuth><Home /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />

        {/* Planet / thread routes (left public for now; wrap with RequireAuth if needed later) */}
        <Route path="/planet/earth" element={<EarthStartThread />} />
        <Route path="/planet/:planetId" element={<PlanetRouter />} />
      </Routes>
    </Router>
  );
}
