<template>
  <canvas ref="canvas" class="particle-canvas"></canvas>
</template>

<script setup>
import { onMounted, ref, onBeforeUnmount } from 'vue'

const canvas = ref(null)
let ctx
let particles = []
let animationId
let mouse = { x: -1000, y: -1000 }

class Particle {
  constructor(x, y) {
    this.homeX = x
    this.homeY = y
    this.x = x
    this.y = y
    this.vx = 0
    this.vy = 0
    this.radiusX = 6
    this.radiusY = 2
    this.rotation = 0
    
    // Animation properties
    this.time = Math.random() * Math.PI * 2
    this.floatSpeed = 0.02 + Math.random() * 0.02
    this.floatRadius = 15 + Math.random() * 10
    this.floatOffsetX = Math.random() * Math.PI * 2
    this.floatOffsetY = Math.random() * Math.PI * 2
    
    // Blue shades like Google Antigravity
    const blues = [
      'rgba(26, 115, 232, 0.6)',   // Google Blue
      'rgba(66, 133, 244, 0.5)',   // Light Blue
      'rgba(26, 115, 232, 0.4)',   // Lighter
      'rgba(66, 133, 244, 0.3)',   // Even lighter
    ]
    this.color = blues[Math.floor(Math.random() * blues.length)]
  }
  
  update() {
    // Increment time for animation
    this.time += this.floatSpeed
    
    // Calculate floating offset using sine/cosine for smooth circular motion
    const floatX = Math.cos(this.time + this.floatOffsetX) * this.floatRadius
    const floatY = Math.sin(this.time + this.floatOffsetY) * this.floatRadius
    
    // Calculate distance from mouse
    const dx = this.x - mouse.x
    const dy = this.y - mouse.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const repelRadius = 150

    // Always point at cursor (angle from particle to mouse)
    this.rotation = Math.atan2(dy, dx)
    this.radiusX = this.smoothRadiusX(distance)
    this.radiusY = this.radiusX / 3
    
    // Repel from cursor
    if (distance < repelRadius) {
      const force = (repelRadius - distance) / repelRadius
      const angle = Math.atan2(dy, dx)
      this.vx += Math.cos(angle) * force * 0.8
      this.vy += Math.sin(angle) * force * 0.8
    }
    
    // Return to home position with floating offset (spring force)
    const homeForce = 0.05
    const targetX = this.homeX + floatX
    const targetY = this.homeY + floatY
    this.vx += (targetX - this.x) * homeForce
    this.vy += (targetY - this.y) * homeForce
    
    // Apply damping
    this.vx *= 0.92
    this.vy *= 0.92
    
    // Update position
    this.x += this.vx
    this.y += this.vy
  }
  
  draw() {
    ctx.beginPath()
    ctx.ellipse(this.x, this.y, this.radiusX, this.radiusY, this.rotation, 0, 2 * Math.PI);
    ctx.fillStyle = this.color
    ctx.fill()
  }

  smoothRadiusX(distance) {
    const maxRadiusX = 6
    let raw = -((((distance - 300) / 100))**2) + maxRadiusX
    return Math.max(0, raw)
  }
}

onMounted(() => {
  ctx = canvas.value.getContext('2d')
  resizeCanvas()
  
  // Create particle grid
  const spacing = 40
  const cols = Math.ceil(canvas.value.width / spacing)
  const rows = Math.ceil(canvas.value.height / spacing)
  
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      // Add some randomness to position
      const x = i * spacing + Math.random() * 20 - 10
      const y = j * spacing + Math.random() * 20 - 10
      particles.push(new Particle(x, y))
    }
  }
  
  animate()
  
  // Track mouse movement
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('resize', resizeCanvas)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('resize', resizeCanvas)
})

function handleMouseMove(e) {
  const rect = canvas.value.getBoundingClientRect()
  mouse.x = e.clientX - rect.left
  mouse.y = e.clientY - rect.top
}

function resizeCanvas() {
  canvas.value.width = window.innerWidth
  canvas.value.height = window.innerHeight
  
  // Recreate particles on resize
  particles = []
  const spacing = 40
  const cols = Math.ceil(canvas.value.width / spacing)
  const rows = Math.ceil(canvas.value.height / spacing)
  
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x = i * spacing + Math.random() * 20 - 10
      const y = j * spacing + Math.random() * 20 - 10
      particles.push(new Particle(x, y))
    }
  }
}

function animate() {
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
  
  particles.forEach(particle => {
    particle.update()
    particle.draw()
  })
  
  animationId = requestAnimationFrame(animate)
}
</script>

<style scoped>
.particle-canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
