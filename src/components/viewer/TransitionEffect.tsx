import { useEffect, useState } from 'react'
import { useTourStore } from '../../store/tourStore'

export default function TransitionEffect() {
  const isTransitioning  = useTourStore(s => s.isTransitioning)
  const setTransitioning = useTourStore(s => s.setTransitioning)
  const [visible, setVisible] = useState(false)
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    if (!isTransitioning) return

    // fade in
    setVisible(true)
    requestAnimationFrame(() => setOpacity(1))

    const fadeOut = setTimeout(() => {
      setOpacity(0)
      setTransitioning(false)
    }, 450)

    const hide = setTimeout(() => setVisible(false), 750)

    return () => { clearTimeout(fadeOut); clearTimeout(hide) }
  }, [isTransitioning, setTransitioning])

  if (!visible) return null

  return (
    <div
      aria-hidden
      className="absolute inset-0 z-40 bg-bg-base pointer-events-none"
      style={{ opacity, transition: 'opacity 300ms ease' }}
    />
  )
}
