import React from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Landing from "./pages/Landing.jsx"
import AuthStart from './pages/auth/AuthStart.jsx'
import EmailStep from "./pages/auth/EmailStep.jsx"
import './App.css'

import Home from "./pages/Home.jsx"
import Planet from "./pages/Planet.jsx"
import Profile from "./pages/Profile.jsx"
import PasswordStep from "./pages/auth/PasswordStep.jsx"
import UsernameStep from './pages/auth/UsernameStep.jsx'


import "./index.css" // global css

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
        <Route path="/planet/:planetId" element={<Planet />} />
      </Routes>
    </Router>
  )
}


