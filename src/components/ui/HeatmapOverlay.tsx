import { useTourStore } from '../../store/tourStore'
import { useAIStore } from '../../store/aiStore'

function engagementColor(score: number): string {
  // 0 = cool blue, 0.5 = gold, 1 = hot saffron
  if (score < 0.2) return '#3B5BDB'
  if (score < 0.4) return '#7950F2'
  if (score < 0.6) return '#D4A017'
  if (score < 0.8) return '#FF8C42'
  return '#FF6B1A'
}

export default function HeatmapOverlay() {
  const activeLocation = useTourStore(s => s.activeLocation)
  const currentNode    = useTourStore(s => s.currentNode)
  const heatmap        = useAIStore(s => s.heatmap)

  if (!activeLocation || activeLocation.nodes.length === 0) return null

  const nodes = activeLocation.nodes

  return (
    <div className="bg-bg-surface/80 backdrop-blur-sm border border-gold/20 rounded-sm p-2.5 min-w-[140px]">
      <p className="font-cinzel text-[9px] tracking-widest text-text-muted uppercase mb-2">
        Node Map
      </p>

      <div className="flex flex-col gap-1.5">
        {nodes.map(node => {
          const score    = heatmap[node.id] ?? 0
          const isActive = node.id === currentNode?.id
          const color    = engagementColor(score)

          return (
            <div key={node.id} className="flex items-center gap-2">
              {/* dot indicator */}
              <div
                className={`w-2.5 h-2.5 rounded-full flex-none transition-all duration-300 ${isActive ? 'scale-125' : ''}`}
                style={{
                  backgroundColor: isActive ? '#FF6B1A' : color,
                  boxShadow: isActive ? '0 0 6px #FF6B1A' : `0 0 4px ${color}40`,
                }}
              />
              {/* label + bar */}
              <div className="flex-1 min-w-0">
                <p className={`font-mono text-[9px] truncate leading-tight ${isActive ? 'text-saffron' : 'text-text-muted'}`}>
                  {node.label}
                </p>
                {score > 0 && (
                  <div className="h-0.5 bg-bg-elevated rounded-full mt-0.5">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${score * 100}%`, backgroundColor: color }}
                    />
                  </div>
                )}
              </div>
              {/* score */}
              {score > 0 && (
                <span className="font-mono text-[9px] text-text-muted flex-none">
                  {Math.round(score * 100)}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
