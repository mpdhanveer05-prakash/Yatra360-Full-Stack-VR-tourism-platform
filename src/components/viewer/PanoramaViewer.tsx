import { useEffect, useState, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { Sky } from '@react-three/drei'
import * as THREE from 'three'

interface Props {
  url:         string
  fallbackUrl: string
}

type LoadState = 'loading' | 'loaded' | 'failed'

function usePanoramaTexture(url: string, fallbackUrl: string) {
  const [texture, setTexture]       = useState<THREE.Texture | null>(null)
  const [loadState, setLoadState]   = useState<LoadState>('loading')
  const prevRef                     = useRef<THREE.Texture | null>(null)

  useEffect(() => {
    if (!url && !fallbackUrl) { setLoadState('failed'); return }

    let cancelled = false
    setLoadState('loading')
    setTexture(null)

    const loader = new THREE.TextureLoader()
    loader.setCrossOrigin('anonymous')

    function applySettings(tex: THREE.Texture): THREE.Texture {
      tex.wrapS    = THREE.RepeatWrapping
      tex.repeat.x = -1
      tex.colorSpace = THREE.SRGBColorSpace
      tex.needsUpdate = true
      return tex
    }

    function tryLoad(src: string, onFail?: () => void) {
      loader.load(
        src,
        (tex) => {
          if (cancelled) { tex.dispose(); return }
          prevRef.current?.dispose()
          prevRef.current = tex
          setTexture(applySettings(tex))
          setLoadState('loaded')
        },
        undefined,
        () => { if (!cancelled) onFail?.() },
      )
    }

    tryLoad(url, () => {
      if (fallbackUrl && fallbackUrl !== url) {
        tryLoad(fallbackUrl, () => { if (!cancelled) setLoadState('failed') })
      } else {
        setLoadState('failed')
      }
    })

    return () => { cancelled = true }
  }, [url, fallbackUrl])

  useEffect(() => () => { prevRef.current?.dispose() }, [])

  return { texture, loadState }
}

// Fallback sky rendered when no panorama image is available
function SkyFallback() {
  return (
    <>
      <Sky sunPosition={[0.4, 0.08, -1]} turbidity={10} rayleigh={0.5} mieCoefficient={0.005} mieDirectionalG={0.8} />
      {/* ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <planeGeometry args={[2000, 2000]} />
        <meshStandardMaterial color="#3a3010" roughness={1} />
      </mesh>
    </>
  )
}

export default function PanoramaViewer({ url, fallbackUrl }: Props) {
  const { texture, loadState } = usePanoramaTexture(url, fallbackUrl)
  const { gl } = useThree()

  useEffect(() => { gl.setClearColor(new THREE.Color('#0D0F1A')) }, [gl])

  if (loadState === 'failed') return <SkyFallback />
  if (!texture) return null   // still loading — canvas stays transparent (loading spinner in HTML)

  return (
    /*
     * scale={[-1,1,1]} flips the sphere so its inner surface faces the camera.
     * texture.repeat.x = -1 un-mirrors the image so text reads correctly.
     */
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[500, 64, 40]} />
      <meshBasicMaterial map={texture} side={THREE.FrontSide} />
    </mesh>
  )
}
