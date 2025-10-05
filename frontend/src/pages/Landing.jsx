import React, { useEffect, useRef } from 'react'


/**
 * HelloWorldEarth
 * - Earth sprite bobs up/down
 * - Shadow grows/shrinks accordingly
 * - All styles inline so you don't need a separate CSS file
 */

export default function HelloWorldEarth({
  earthSrc = './images/earth.png',   // put earth.png in /public or adjust path
  amplitudePx = 18,          // bob height
  cyclesPerSecond = 1.1,     // bob speed
  shadowScaleRange = 0.28,   // shadow growth/shrink around 1.0
  spinPerSecond = 0          // set to e.g. 0.05 for a slow rotation
}) {
  const earthRef = useRef(null)
  const shadowRef = useRef(null)
  const startRef = useRef(null)
  const rafRef = useRef(0)

  useEffect(() => {
    const earth = earthRef.current
    const shadow = shadowRef.current
    if (!earth || !shadow) return

    const TAU = Math.PI * 2

    const lerp = (a, b, t) => a + (b - a) * t

    const animate = ts => {
      if (startRef.current == null) startRef.current = ts
      const t = (ts - startRef.current) / 1000
      const y = Math.sin(t * TAU * cyclesPerSecond)

      const translateY = -amplitudePx * y
      const rotationDeg = (t * 360 * spinPerSecond) % 360

      // Earth up/down (and optional slow spin)
      earth.style.transform = `translateY(${translateY}px) rotate(${rotationDeg}deg)`

      // Shadow smaller when Earth is higher, larger when lower
      const scaleX = 1 + shadowScaleRange * (-y)
      const scaleY = 1 + (shadowScaleRange * 0.35) * (-y)
      shadow.style.transform = `scale(${scaleX}, ${scaleY})`

      // Slight opacity change to sell depth
      const opacity = lerp(0.55, 0.9, (1 - y) / 2)
      shadow.style.opacity = String(opacity)

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [amplitudePx, cyclesPerSecond, shadowScaleRange, spinPerSecond])

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Hello World...</h1>

      <img
        ref={earthRef}
        src={earthSrc}
        alt='Earth'
        style={styles.earth}
        draggable={false}
      />

      <div ref={shadowRef} style={styles.shadow} />
    </div>
  )
}

const styles = {
  page: {
    backgroundColor: '#0d0000',
    color: 'white',
    height: '100vh',
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    overflow: 'hidden'
  },
  title: {
    fontWeight: 400,
    margin: '0 0 32px',
    fontSize: '48px',
    lineHeight: 1.2
  },
  earth: {
    width: 180,
    imageRendering: 'pixelated',
    transformOrigin: 'center',
    willChange: 'transform'
  },
  shadow: {
    width: 160,
    height: 40,
    backgroundColor: 'rgba(0, 50, 70, 0.8)',
    borderRadius: '50%',
    marginTop: 16,
    transformOrigin: 'center',
    willChange: 'transform, opacity'
  }
}
