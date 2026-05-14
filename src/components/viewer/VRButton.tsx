import { useVRMode } from '../../hooks/useVRMode'

interface Props {
  sessionId:  string
  locationId: string
}

export default function VRButton({ sessionId, locationId }: Props) {
  const { vrSupported, vrActive, enterVR, exitVR } = useVRMode(sessionId, locationId)

  if (!vrSupported) return null

  return (
    <button
      onClick={vrActive ? exitVR : enterVR}
      className="
        absolute top-4 right-4 z-30
        flex items-center gap-2 px-3 py-2
        bg-bg-surface/80 backdrop-blur-sm
        border border-gold/40 hover:border-gold/80
        text-gold font-cinzel text-xs tracking-widest uppercase
        transition-all duration-200
        hover:bg-bg-elevated/90 hover:shadow-[0_0_12px_rgba(212,160,23,0.3)]
      "
      aria-label={vrActive ? 'Exit VR' : 'Enter VR'}
    >
      <span className="text-base leading-none">{vrActive ? '⊠' : '⊞'}</span>
      {vrActive ? 'Exit VR' : 'Enter VR'}
    </button>
  )
}
