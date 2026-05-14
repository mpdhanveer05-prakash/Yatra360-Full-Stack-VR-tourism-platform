export interface Era {
  id:        string
  label:     string
  yearLabel: string
  yearStart: number
  yearEnd:   number
  filter:    string   // CSS filter
  vignette:  string   // overlay color
  tone:      string   // descriptive prose
}

export interface LocationEraSet {
  locationId: string
  eras:       string[]    // era ids available, ordered oldest → newest
  context?:   Record<string, string>   // era id → location-specific description
}
