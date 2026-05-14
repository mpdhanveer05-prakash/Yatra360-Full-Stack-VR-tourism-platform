export interface Annotation {
  _id?:       string
  locationId: string
  nodeId?:    string
  azimuth:    number
  elevation:  number
  text:       string
  authorId:   string
  authorName: string
  flags?:     number
  hidden?:    boolean
  createdAt?: string
}
