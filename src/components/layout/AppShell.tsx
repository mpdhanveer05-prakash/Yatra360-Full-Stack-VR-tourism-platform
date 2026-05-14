import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import StampToast from '../ui/StampToast'
import UpdateToast from '../ui/UpdateToast'
import { useAccessibility } from '../../hooks/useAccessibility'

export default function AppShell() {
  useAccessibility()

  return (
    <div className="min-h-dvh flex flex-col bg-bg-base">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Navbar />
      <main id="main-content" className="flex-1" tabIndex={-1}>
        <Outlet />
      </main>
      <StampToast />
      <UpdateToast />
    </div>
  )
}
