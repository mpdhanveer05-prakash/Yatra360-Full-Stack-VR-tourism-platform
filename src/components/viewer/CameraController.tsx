import { OrbitControls } from '@react-three/drei'

export default function CameraController() {
  return (
    <OrbitControls
      enableZoom={false}
      enablePan={false}
      rotateSpeed={-0.3}     // negative = natural drag-to-look feel inside sphere
      makeDefault
    />
  )
}
