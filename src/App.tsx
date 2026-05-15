import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import RequireAuth from './components/layout/RequireAuth'
import HomePage from './components/pages/HomePage'
import ExplorePage from './components/pages/ExplorePage'
import TourPage from './components/pages/TourPage'
import DashboardPage from './components/pages/DashboardPage'
import AboutPage from './components/pages/AboutPage'
import JourneysPage from './components/pages/JourneysPage'
import JourneyPage from './components/pages/JourneyPage'
import ComparePage from './components/pages/ComparePage'
import LoginPage from './components/pages/LoginPage'
import SignupPage from './components/pages/SignupPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="login"  element={<LoginPage />} />
          <Route path="signup" element={<SignupPage />} />
          <Route path="about"  element={<AboutPage />} />

          {/* Protected — require login */}
          <Route path="explore"             element={<RequireAuth><ExplorePage /></RequireAuth>} />
          <Route path="tour/:locationId"    element={<RequireAuth><TourPage /></RequireAuth>} />
          <Route path="journeys"            element={<RequireAuth><JourneysPage /></RequireAuth>} />
          <Route path="journey/:journeyId"  element={<RequireAuth><JourneyPage /></RequireAuth>} />
          <Route path="compare"             element={<RequireAuth><ComparePage /></RequireAuth>} />
          <Route path="dashboard"           element={<RequireAuth><DashboardPage /></RequireAuth>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
