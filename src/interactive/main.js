import { createApp } from 'vue'
import Hero from './Hero.vue'
import ProjectGrid from './ProjectGrid.vue'

// Mount Hero if element exists
const heroEl = document.getElementById('hero-interactive')
if (heroEl) {
    createApp(Hero).mount(heroEl)
}

// Mount Project Grid
const gridEl = document.getElementById('project-grid-interactive')
if (gridEl) {
    createApp(ProjectGrid).mount(gridEl)
}

// We can add more islands here
