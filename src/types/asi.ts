export interface AsiMonument {
  asiId:    string
  name:     string
  category: string
  state:    string
  district: string
  lat:      number
  lng:      number
  circle:   string
  /** Optional pointer back to the Yatra360 location dataset. */
  yatraLocationId?: string
}
