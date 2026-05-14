import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import HomePage from './components/pages/HomePage'
import ExplorePage from './components/pages/ExplorePage'
import TourPage from './components/pages/TourPage'
import DashboardPage from './components/pages/DashboardPage'
import AboutPage from './components/pages/AboutPage'
import JourneysPage from './components/pages/JourneysPage'
import JourneyPage from './components/pages/JourneyPage'
import ComparePage from './components/pages/ComparePage'
import ClassroomPage from './components/pages/ClassroomPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="explore" element={<ExplorePage />} />
          <Route path="tour/:locationId" element={<TourPage />} />
          <Route path="journeys" element={<JourneysPage />} />
          <Route path="journey/:journeyId" element={<JourneyPage />} />
          <Route path="compare" element={<ComparePage />} />
          <Route path="classroom" element={<ClassroomPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
