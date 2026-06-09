import { Canvas } from '@react-three/fiber'
import {
  useGLTF,
  Environment,
  ContactShadows,
  AdaptiveDpr,
  PerspectiveCamera,
} from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { Suspense, useMemo, useRef, useLayoutEffect } from 'react'
import { Box3, Vector3 } from 'three'
import { useScrollCamera } from '../hooks/useScrollCamera'

const MODEL_URL = '/models/f22.glb'
const TARGET_SIZE = 4 // normalize the model's largest dimension to this many world units

function JetModel() {
  const { scene } = useGLTF(MODEL_URL)
  const ref = useRef()

  // Clone so HMR / strict-mode double-mount doesn't mutate the cached scene twice.
  const cloned = useMemo(() => scene.clone(true), [scene])

  // Auto-center + auto-scale so camera keyframes are independent of the model's
  // native units and pivot. Also orient nose toward -Z.
  useLayoutEffect(() => {
    const obj = ref.current
    if (!obj) return
    obj.rotation.set(0, 0, 0)
    obj.scale.setScalar(1)
    obj.position.set(0, 0, 0)
    obj.updateWorldMatrix(true, true)

    const box = new Box3().setFromObject(obj)
    const size = new Vector3()
    const center = new Vector3()
    box.getSize(size)
    box.getCenter(center)

    const maxDim = Math.max(size.x, size.y, size.z) || 1
    const s = TARGET_SIZE / maxDim
    obj.scale.setScalar(s)
    // Recenter at origin after scaling.
    obj.position.set(-center.x * s, -center.y * s, -center.z * s)

    cloned.traverse((c) => {
      if (c.isMesh) {
        c.castShadow = true
        c.receiveShadow = true
      }
    })
  }, [cloned])

  return (
    <group ref={ref} rotation={[0, Math.PI, 0]}>
      <primitive object={cloned} />
    </group>
  )
}

function CameraRig() {
  useScrollCamera()
  return null
}

export default function JetScene() {
  return (
    <Canvas
      style={{ position: 'fixed', inset: 0, zIndex: 0 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
    >
      <PerspectiveCamera makeDefault position={[0, 1.4, 8]} fov={42} near={0.1} far={100} />
      <AdaptiveDpr pixelated />

      {/* Lighting rig for a metallic airframe */}
      <ambientLight intensity={0.25} />
      <directionalLight position={[5, 10, 5]} intensity={1.6} castShadow />
      <pointLight position={[-10, -4, -6]} intensity={1.2} color="#00d4ff" />
      <pointLight position={[10, 5, -8]} intensity={0.5} color="#ff4d1c" />

      <Suspense fallback={null}>
        <Environment preset="night" />
        <JetModel />
        <ContactShadows
          position={[0, -2.1, 0]}
          opacity={0.35}
          scale={14}
          blur={2.4}
          far={5}
          color="#00d4ff"
        />
      </Suspense>

      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={0.65} luminanceSmoothing={0.4} intensity={0.7} mipmapBlur />
        <Vignette eskil={false} offset={0.15} darkness={0.7} />
      </EffectComposer>

      <CameraRig />
    </Canvas>
  )
}

useGLTF.preload(MODEL_URL)
