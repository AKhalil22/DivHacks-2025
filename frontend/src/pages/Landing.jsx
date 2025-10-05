import React from 'react'
import '../App.css'

//import './images/Earth.css'

export default function App() {
  return (
    <main className='page'>
      <h1 className='title'>Hello World...</h1>

      <div className='scene' aria-hidden='true'>
        <img
          className='earth'
          src='/images/earth.png'
          width='180'
          height='180'
          alt=''
        />
        <div className='shadow' />
      </div>
    </main>
  )
}
