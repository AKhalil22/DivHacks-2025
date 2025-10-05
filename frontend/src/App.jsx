// src/App.jsx
import React from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"

import Landing from "./pages/Landing.jsx"
import AuthStart from "./pages/auth/AuthStart.jsx"
import EmailStep from "./pages/auth/EmailStep.jsx"
import PasswordStep from "./pages/auth/PasswordStep.jsx"
import UsernameStep from "./pages/auth/UsernameStep.jsx"

import Home from "./pages/Home.jsx"
import Profile from "./pages/Profile.jsx"
import PlanetRouter from "./pages/PlanetRouter.jsx"

import "./App.css"
import "./index.css"

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<AuthStart />} />
        <Route path="/auth/EmailStep" element={<EmailStep />} />
        <Route path="/auth/PasswordStep" element={<PasswordStep />} />
        <Route path="/auth/username" element={<UsernameStep />} />
        <Route path="/home" element={<Home />} />
        <Route path="/profile" element={<Profile />} />

        {/* All planets go to the thread UI */}
        <Route path="/planet/:planetId" element={<PlanetRouter />} />
      </Routes>
    </Router>
  )
}
