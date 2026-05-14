import type { LocationCategory } from '../../types/location'

type FilterValue = LocationCategory | 'all'

interface Props {
  selected:  FilterValue
  onChange:  (v: FilterValue) => void
  counts?:   Partial<Record<FilterValue, number>>
}

const CATEGORIES: { value: FilterValue; label: string; icon: string }[] = [
  { value: 'all',          label: 'All',          icon: '◉' },
  { value: 'heritage',     label: 'Heritage',     icon: '🏛' },
  { value: 'fort',         label: 'Forts',        icon: '🏰' },
  { value: 'temple',       label: 'Temples',      icon: '⛩' },
  { value: 'spiritual',    label: 'Spiritual',    icon: '🕌' },
  { value: 'nature',       label: 'Nature',       icon: '🌿' },
  { value: 'museum',       label: 'Museums',      icon: '🎭' },
  { value: 'hill-station', label: 'Hill Stations',icon: '⛰' },
]

export default function CategoryFilter({ selected, onChange, counts }: Props) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
      {CATEGORIES.map(({ value, label, icon }) => {
        const active = selected === value
        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-cinzel
              tracking-wider uppercase transition-all duration-150 border
              ${active
                ? 'bg-saffron border-saffron text-cream shadow-[0_0_10px_rgba(255,107,26,0.35)]'
                : 'bg-bg-card border-gold/20 text-text-secondary hover:border-gold/50 hover:text-cream'
              }
            `}
          >
            <span>{icon}</span>
            <span>{label}</span>
            {counts?.[value] !== undefined && (
              <span className={`font-mono ${active ? 'text-cream/70' : 'text-text-muted'}`}>
                {counts[value]}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
