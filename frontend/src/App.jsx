// src/App.jsx
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"

import Landing from "./pages/Landing.jsx"
import AuthStart from "./pages/auth/AuthStart.jsx"
import EmailStep from "./pages/auth/EmailStep.jsx"
import PasswordStep from "./pages/auth/PasswordStep.jsx"
import UsernameStep from "./pages/auth/UsernameStep.jsx"

import Home from "./pages/Home.jsx"
import Profile from "./pages/Profile.jsx"
import PlanetRouter from "./pages/PlanetRouter.jsx"
import EarthStartThread from "./pages/EarthStartThread.jsx";


import "./App.css"
import "./index.css"

export default function App() {
  // Init: Default user's name
  const [userName, setUserName] = useState("LambOverRice");

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<AuthStart />} />
        <Route path="/auth/EmailStep" element={<EmailStep />} />
        <Route path="/auth/PasswordStep" element={<PasswordStep />} />
        <Route path="/auth/username" element={<UsernameStep userName={userName} setUserName={setUserName} />}/>
        <Route path="/home" element={<Home userName={userName} setUserName={setUserName} />}/>
  
        <Route path="/profile" element={<Profile />} />
        {/* All planets go to the thread UI */}
        <Route path="/planet/:planetId" element={<PlanetRouter />} />
        <Route path="/planet/earth" element={<EarthStartThread />} />
      </Routes>
    </Router>
  )
}
