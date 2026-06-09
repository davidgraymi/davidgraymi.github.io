import { Canvas } from '@react-three/fiber'
import { useGLTF, AdaptiveDpr, PerspectiveCamera } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { Suspense, useMemo, useRef, useLayoutEffect } from 'react'
import {
  Box3,
  Vector3,
  Group,
  EdgesGeometry,
  LineSegments,
  LineBasicMaterial,
  Color,
} from 'three'
import { useScrollCamera } from '../hooks/useScrollCamera'

const MODEL_URL = '/models/f22.glb'
const TARGET_SIZE = 4 // normalize the model's largest dimension to this many world units

// Background matches brand --bg token; lines stay crisp off-white
const BG = '#0B0F17' // brand near-black
const LINE = '#dfeaf5' // off-white wireframe lines
// Only draw an edge where two faces meet above this angle (degrees). Higher =
// fewer, cleaner lines (just real panel/silhouette edges); lower = busier.
const EDGE_THRESHOLD_DEG = 16

function JetWireframe() {
  const { scene } = useGLTF(MODEL_URL)
  const ref = useRef()

  // Build a fresh group of white edge LineSegments from every mesh's geometry.
  const wire = useMemo(() => {
    const group = new Group()
    const mat = new LineBasicMaterial({ color: new Color(LINE), transparent: true, opacity: 0.9 })
    scene.traverse((c) => {
      if (c.isMesh && c.geometry) {
        const edges = new EdgesGeometry(c.geometry, EDGE_THRESHOLD_DEG)
        const seg = new LineSegments(edges, mat)
        // Bake the mesh's world transform so edges sit exactly on the airframe.
        c.updateWorldMatrix(true, false)
        seg.applyMatrix4(c.matrixWorld)
        group.add(seg)
      }
    })
    return group
  }, [scene])

  // Auto-center + auto-scale so camera keyframes are independent of the model's
  // native units and pivot.
  useLayoutEffect(() => {
    const obj = ref.current
    if (!obj) return
    // Rotate so the nose (native +X) faces world +Z (screen-up with camera.up=(0,0,1)).
    obj.rotation.set(0, -Math.PI / 2, 0)
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
    obj.position.set(-center.x * s, -center.y * s, -center.z * s)
  }, [wire])

  return (
    <group ref={ref} rotation={[0, 0, 0]}>
      <primitive object={wire} />
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
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
      onCreated={({ gl }) => gl.setClearColor(new Color(BG), 1)}
    >
      <PerspectiveCamera
        makeDefault
        position={[0, 9, 0]}
        up={[0, 0, 1]}
        fov={42}
        near={0.1}
        far={100}
        onUpdate={(c) => c.lookAt(0, 0, 0)}
      />
      <AdaptiveDpr pixelated />

      <Suspense fallback={null}>
        <JetWireframe />
      </Suspense>

      {/* Very subtle bloom so the white lines glow faintly against the blue. */}
      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.5} intensity={0.35} mipmapBlur />
      </EffectComposer>

      <CameraRig />
    </Canvas>
  )
}

useGLTF.preload(MODEL_URL)
