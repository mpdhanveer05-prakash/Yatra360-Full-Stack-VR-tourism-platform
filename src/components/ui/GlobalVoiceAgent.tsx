import { useNavigate, useLocation } from 'react-router-dom'
import { useTourStore } from '../../store/tourStore'
import { useUserStore } from '../../store/userStore'
import { useAuthStore } from '../../store/authStore'
import { useWikipediaData } from '../../hooks/useWikipediaData'
import { useVoiceAgent } from '../../hooks/useVoiceAgent'
import VoiceAgentButton from './VoiceAgentButton'
import locations from '../../data/indiaLocations.json'
import type { IndiaLocation } from '../../types/location'

const allLocations = locations as IndiaLocation[]

/**
 * Mounted in AppShell so the mic is available on every page.
 *  - Outside a tour: only navigation intents (e.g. "take me to Eiffel Tower")
 *  - Inside a tour:  navigation + guide questions about the current location
 *
 * Hidden on /login and /signup so it doesn't sit on top of auth forms.
 */
export default function GlobalVoiceAgent() {
  const navigate       = useNavigate()
  const routeLocation  = useLocation()
  const activeLocation = useTourStore(s => s.activeLocation)
  const currentNode    = useTourStore(s => s.currentNode)
  const anonUserId     = useUserStore(s => s.userId)
  const authUser       = useAuthStore(s => s.user)
  const userId         = authUser?.id ?? anonUserId

  const { summary } = useWikipediaData(activeLocation?.wikiSlug ?? null)

  const voice = useVoiceAgent({
    locationSlug: activeLocation?.wikiSlug ?? '',
    nodeLabel:    currentNode?.label       ?? activeLocation?.name ?? '',
    locationId:   activeLocation?.id,
    userId,
    locations:    allLocations,
    onNavigate:   (locId) => navigate(`/tour/${locId}`),
    getFallbackContext: () => activeLocation
      ? {
          locationName: activeLocation.name,
          description:  activeLocation.description,
          city:         activeLocation.city,
          state:        activeLocation.state,
          category:     activeLocation.category,
          established:  activeLocation.established,
          unescoStatus: activeLocation.unescoStatus,
          wikiExtract:  summary?.extract,
        }
      : null,
  })

  // Hide on auth pages so the mic doesn't sit over login / signup form
  const path = routeLocation.pathname
  if (path === '/login' || path === '/signup') return null

  // Position above the tour-page guide chat (which lives at bottom-4 left-4)
  const isTourPage = path.startsWith('/tour/')
  const positionClass = isTourPage
    ? 'fixed bottom-24 left-4 z-40'
    : 'fixed bottom-6 left-6 z-40'

  return (
    <div className={positionClass}>
      <VoiceAgentButton
        state={voice.state}
        transcript={voice.transcript}
        answer={voice.answer}
        errorMsg={voice.errorMsg}
        supported={voice.supported}
        onStart={voice.start}
        onStop={voice.stop}
        onReset={voice.reset}
        bubbleSide="right"
      />
    </div>
  )
}
