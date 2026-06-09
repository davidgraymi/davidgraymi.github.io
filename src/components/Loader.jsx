import { useProgress } from '@react-three/drei'
import { useEffect, useState } from 'react'

export default function Loader() {
  const { progress, active } = useProgress()
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    if (!active && progress >= 100) {
      const t = setTimeout(() => setHidden(true), 600)
      return () => clearTimeout(t)
    }
  }, [active, progress])

  if (hidden) return null

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#05070b] transition-opacity duration-700"
      style={{ opacity: !active && progress >= 100 ? 0 : 1 }}
    >
      <div className="tag mb-6">Spooling turbines</div>
      <div className="h-px w-56 overflow-hidden bg-white/10">
        <div
          className="h-full bg-ice transition-[width] duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-4 font-mono text-xs text-white/40">
        {Math.round(progress)}%
      </div>
    </div>
  )
}
