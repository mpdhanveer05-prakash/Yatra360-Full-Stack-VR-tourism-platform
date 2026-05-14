import { useEffect } from 'react'
import { useUIStore } from '../store/uiStore'

/**
 * Mirrors persisted a11y preferences onto `<html>` data attributes so global
 * CSS can react. Mount once at the app root.
 */
export function useAccessibility(): void {
  const highContrast = useUIStore(s => s.highContrast)
  const reduceMotion = useUIStore(s => s.reduceMotion)

  useEffect(() => {
    const root = document.documentElement
    if (highContrast) root.setAttribute('data-contrast', 'high')
    else root.removeAttribute('data-contrast')
  }, [highContrast])

  useEffect(() => {
    const root = document.documentElement
    if (reduceMotion) root.setAttribute('data-reduce-motion', 'true')
    else root.removeAttribute('data-reduce-motion')
  }, [reduceMotion])
}

/**
 * True if the user has either toggled reduce-motion in-app or set it at OS level.
 * Safe to call from any component / R3F frame loop.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  const inApp = document.documentElement.getAttribute('data-reduce-motion') === 'true'
  const os    = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  return inApp || os
}
