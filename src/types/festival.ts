export interface Festival {
  id:         string
  name:       string
  subtitle:   string
  month:      number   // 1–12
  day:        number   // 1–31, approximate start
  duration:   number   // days
  color:      string
  particle:   'diya' | 'color' | 'marigold' | 'tricolor'
  regions:    string[]   // "all" or LocationRegion values
  categories: string[]   // categories where the overlay applies
  blurb:      string
}
