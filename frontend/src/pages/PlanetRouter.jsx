// src/pages/PlanetRouter.jsx
import React from 'react'
import { useParams } from 'react-router-dom'
import PlanetThread from './PlanetThread.jsx'

export default function PlanetRouter() {
  const { planetId } = useParams()
  // pass planetId down if PlanetThread needs it (handy for header/title, fetching, etc.)
  return <PlanetThread key={planetId} planetId={planetId} />
}
