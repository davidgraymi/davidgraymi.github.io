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

    // Size based on distance from mouse
    this.radiusX = this.smoothRadiusX(distance)
    this.radiusY = this.radiusX / 3
    
    // Update position
    // this.x += this.vx
    // this.y += this.vy
  }
  
  draw() {
    ctx.beginPath()
    ctx.ellipse(this.x, this.y, this.radiusX, this.radiusY, this.rotation, 0, 2 * Math.PI);
    const red = Math.floor(Math.random() * 256);
    ctx.fillStyle = 'rgb(' + red + ', ' + Math.floor(Math.random() * 256) + ', ' + Math.floor(Math.random() * 256) + ')'
    ctx.fill()
  }

  smoothRadiusX(distance) { 
    const maxRadiusX = 5
    let raw = -((((distance - 250) / 100))**2) + maxRadiusX
    return Math.max(1, raw)
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
      const x = i * spacing
      const y = j * spacing
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
      const x = i * spacing
      const y = j * spacing
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
