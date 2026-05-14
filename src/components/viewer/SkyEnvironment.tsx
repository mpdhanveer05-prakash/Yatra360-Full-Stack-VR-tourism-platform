// Ambient + point light for hotspot meshes. No sky — the panorama sphere is the environment.
export default function SkyEnvironment() {
  return (
    <>
      <ambientLight intensity={0.6} color="#FFFFFF" />
      <pointLight position={[0, 0, 0]} intensity={0.4} color="#FF8C42" />
    </>
  )
}
