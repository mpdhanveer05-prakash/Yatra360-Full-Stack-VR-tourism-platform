export interface Classroom {
  _id?:               string
  code:               string
  name:               string
  teacherId:          string
  teacherName:        string
  studentIds:         string[]
  assignedLocationId: string
  notes:              string
  createdAt?:         string
  updatedAt?:         string
}

export interface ClassroomHeatmap {
  heatmap:   Record<string, number>
  students:  number
  sessions:  number
  assignedLocationId?: string
}
