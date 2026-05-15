import { useNavigate } from 'react-router-dom'

const TECH_STACK = [
  { label: 'React 18 + Vite',         role: 'Frontend framework + build tool'      },
  { label: 'TypeScript',               role: 'Type safety across all layers'         },
  { label: 'React Three Fiber',        role: '3D panorama viewer + WebXR support'   },
  { label: 'Three.js',                 role: 'WebGL renderer for immersive scenes'  },
  { label: 'Tailwind CSS v3',          role: 'Design system + utility styling'       },
  { label: 'Zustand',                  role: 'Lightweight state management'          },
  { label: 'React Router v6',          role: 'Client-side navigation'               },
  { label: 'Node.js + Express',        role: 'REST API + session persistence'        },
  { label: 'MongoDB Atlas',            role: 'Free-tier cloud database'             },
  { label: 'Python FastAPI',           role: 'AI recommendation + guide engine'     },
]

const DATA_SOURCES = [
  { name: 'Wikipedia REST API',   url: 'https://en.wikipedia.org/api/rest_v1/', note: 'Location summaries + AI guide context' },
  { name: 'Wikimedia Commons',    url: 'https://commons.wikimedia.org/w/api.php', note: 'Real photographs for every monument' },
  { name: 'OpenStreetMap (Nominatim)', url: 'https://nominatim.openstreetmap.org/', note: 'Geocoding + nearby POIs' },
  { name: 'Unsplash Source',      url: 'https://unsplash.com', note: 'Panorama fallback images' },
  { name: 'ASI Open Data',        url: 'https://data.gov.in', note: 'Archaeological Survey of India monument list' },
]

const LOCATIONS_BY_CATEGORY = [
  { label: 'Heritage / UNESCO',   count: 10, icon: '🏛' },
  { label: 'Forts & Palaces',     count: 10, icon: '🏰' },
  { label: 'Temples & Spiritual', count: 10, icon: '⛩' },
  { label: 'Nature & Landscapes', count: 10, icon: '🌿' },
  { label: 'Museums & Landmarks', count: 10, icon: '🎭' },
]

export default function AboutPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-14">

        {/* hero */}
        <div className="space-y-5">
          <p className="font-mono text-xs tracking-[0.4em] text-saffron uppercase">Open Source Project</p>
          <h1 className="font-cinzel font-black text-4xl text-cream">
            About <span className="text-gold">Yatra360</span>
          </h1>
          <p className="font-proza text-base text-text-secondary leading-relaxed max-w-2xl">
            <em>Yatra</em> means journey in Hindi and Sanskrit. Yatra360 is a browser-native virtual
            reality tourism platform that brings 25 real Indian heritage sites, forts, temples, and
            landscapes to anyone with a web browser — no headset, no download, no cost.
          </p>
          <p className="font-proza text-base text-text-secondary leading-relaxed max-w-2xl">
            AI adapts your tour in real-time: as you dwell on details, click hotspots, and explore
            nodes, the recommendation engine builds a picture of your interests and guides you toward
            the sites you'll find most compelling.
          </p>
        </div>

        <div className="gold-divider" />

        {/* what we cover */}
        <div className="space-y-6">
          <h2 className="font-cinzel text-xl text-cream">What We Cover</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {LOCATIONS_BY_CATEGORY.map(cat => (
              <div key={cat.label} className="card p-4 space-y-2">
                <div className="text-2xl">{cat.icon}</div>
                <p className="font-cinzel text-sm text-cream">{cat.label}</p>
                <p className="font-mono text-xs text-gold">{cat.count} locations</p>
              </div>
            ))}
            <div className="card p-4 space-y-2 flex flex-col justify-center items-center text-center">
              <p className="font-cinzel font-black text-3xl text-gold">25</p>
              <p className="font-mono text-[10px] tracking-widest text-text-muted uppercase">Total Sites</p>
              <p className="font-mono text-[10px] text-text-muted">With walkable Street View</p>
            </div>
          </div>
        </div>

        <div className="gold-divider" />

        {/* tech stack */}
        <div className="space-y-6">
          <h2 className="font-cinzel text-xl text-cream">Technology</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TECH_STACK.map(t => (
              <div key={t.label} className="flex items-start gap-3 p-3 bg-bg-surface border border-[var(--border)]">
                <span className="text-gold mt-0.5 flex-none">▸</span>
                <div>
                  <p className="font-mono text-xs text-cream">{t.label}</p>
                  <p className="font-proza text-[11px] text-text-secondary">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="gold-divider" />

        {/* data sources */}
        <div className="space-y-6">
          <div>
            <h2 className="font-cinzel text-xl text-cream">Data Sources</h2>
            <p className="font-proza text-sm text-text-secondary mt-1">
              All data is sourced from free, open APIs. No paid keys required.
            </p>
          </div>
          <div className="space-y-3">
            {DATA_SOURCES.map(ds => (
              <div key={ds.name} className="flex items-start gap-4 p-3 bg-bg-surface border border-[var(--border)]">
                <div className="flex-1">
                  <p className="font-mono text-xs text-gold">{ds.name}</p>
                  <p className="font-proza text-[11px] text-text-secondary mt-0.5">{ds.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="gold-divider" />

        {/* ai engine */}
        <div className="space-y-4">
          <h2 className="font-cinzel text-xl text-cream">AI Engine</h2>
          <div className="space-y-3 font-proza text-sm text-text-secondary leading-relaxed">
            <p>
              <strong className="text-cream">Engagement Scoring</strong> — every tour node is scored
              continuously based on dwell time (up to 2 minutes), hotspot interactions (up to 5 clicks),
              and whether you revisit a node.
            </p>
            <p>
              <strong className="text-cream">Content-Based Recommendations</strong> — each location has a
              12-dimension FeatureVector (historical, architectural, religious, natural…). After each node
              navigation your preference vector updates as a weighted average of visited locations, and
              cosine similarity ranks the unvisited ones.
            </p>
            <p>
              <strong className="text-cream">RL Navigator</strong> — a tabular Q-learning agent learns the
              best within-location path from aggregated session data, using engagement score as the reward
              signal.
            </p>
            <p>
              <strong className="text-cream">Virtual Guide</strong> — answers questions about any location
              using Wikipedia article sections as RAG context, returning attributed 2–4 sentence answers.
            </p>
          </div>
        </div>

        <div className="gold-divider" />

        {/* call to action */}
        <div className="text-center space-y-4 pb-4">
          <h2 className="font-cinzel text-2xl text-cream">
            Begin Your <span className="text-gold">Yatra</span>
          </h2>
          <div className="flex gap-4 justify-center flex-wrap">
            <button onClick={() => navigate('/explore')} className="btn-primary text-sm">
              Explore All 25 Destinations →
            </button>
            <button onClick={() => navigate('/tour/taj-mahal-agra')} className="btn-secondary text-sm">
              Try Taj Mahal
            </button>
          </div>
        </div>

        <div className="text-center border-t border-[var(--border)] pt-6">
          <p className="font-mono text-[10px] tracking-widest text-text-muted uppercase">
            Yatra360 · Open Source · Powered by Wikipedia &amp; Wikimedia Commons
          </p>
        </div>
      </div>
    </div>
  )
}
