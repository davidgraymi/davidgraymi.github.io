<template>
  <canvas ref="canvas" class="confetti-canvas"></canvas>
</template>

<script setup>
import { onMounted, ref, onBeforeUnmount } from 'vue'

const canvas = ref(null)
let ctx
let particles = []
let animationId

class Particle {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.size = Math.random() * 8 + 4
    this.speedY = Math.random() * 1 + 0.5
    this.speedX = Math.random() * 2 - 1
    this.rotation = Math.random() * 360
    this.rotationSpeed = Math.random() * 4 - 2
    
    // Google-style colors: blues, teals, and grays
    const colors = [
      '#1a73e8', // Google Blue
      '#34a853', // Google Green  
      '#fbbc04', // Google Yellow
      '#ea4335', // Google Red
      '#4285f4', // Light Blue
      '#5f6368', // Gray
    ]
    this.color = colors[Math.floor(Math.random() * colors.length)]
    this.opacity = Math.random() * 0.5 + 0.3
    
    // Shape: 0 = circle, 1 = square, 2 = triangle
    this.shape = Math.floor(Math.random() * 3)
  }
  
  update() {
    this.y += this.speedY
    this.x += this.speedX
    this.rotation += this.rotationSpeed
    
    // Wrap around
    if (this.y > canvas.value.height + 20) {
      this.y = -20
      this.x = Math.random() * canvas.value.width
    }
    if (this.x > canvas.value.width + 20) {
      this.x = -20
    }
    if (this.x < -20) {
      this.x = canvas.value.width + 20
    }
  }
  
  draw() {
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.rotation * Math.PI / 180)
    ctx.globalAlpha = this.opacity
    ctx.fillStyle = this.color
    
    if (this.shape === 0) {
      // Circle
      ctx.beginPath()
      ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2)
      ctx.fill()
    } else if (this.shape === 1) {
      // Square
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size)
    } else {
      // Triangle
      ctx.beginPath()
      ctx.moveTo(0, -this.size / 2)
      ctx.lineTo(this.size / 2, this.size / 2)
      ctx.lineTo(-this.size / 2, this.size / 2)
      ctx.closePath()
      ctx.fill()
    }
    
    ctx.restore()
  }
}

onMounted(() => {
  ctx = canvas.value.getContext('2d')
  resizeCanvas()
  
  // Create particles
  for (let i = 0; i < 80; i++) {
    particles.push(new Particle(
      Math.random() * canvas.value.width,
      Math.random() * canvas.value.height
    ))
  }
  
  animate()
  window.addEventListener('resize', resizeCanvas)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', resizeCanvas)
})

function resizeCanvas() {
  canvas.value.width = window.innerWidth
  canvas.value.height = window.innerHeight
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
.confetti-canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
