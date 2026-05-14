export interface Journey {
  id:          string
  title:       string
  subtitle:    string
  description: string
  tone:        string   // category-ish tag for styling
  icon:        string
  duration:    string
  stops:       string[]   // location IDs in order
}
