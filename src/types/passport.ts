// Yatra Passport — stamps & badges earned through exploration.

export interface Stamp {
  locationId:   string
  locationName: string
  category:     string
  state:        string
  visitedAt:    number   // epoch ms (first visit)
  visits:       number   // total visit count
}

export interface Badge {
  id:          string   // e.g. "unesco-10"
  name:        string
  description: string
  icon:        string   // emoji / glyph
  earnedAt:    number   // epoch ms
}

export interface Streak {
  current:     number   // consecutive days
  longest:     number
  lastVisitYmd: string | null   // "YYYY-MM-DD"
}
