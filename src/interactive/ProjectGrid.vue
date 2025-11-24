<template>
  <div class="interactive-grid">
    <div class="filters">
      <button 
        v-for="filter in filters" 
        :key="filter"
        :class="{ active: currentFilter === filter }"
        @click="currentFilter = filter"
      >
        {{ filter }}
      </button>
    </div>

    <div class="grid" ref="gridRef">
      <div 
        v-for="project in filteredProjects" 
        :key="project.title"
        class="project-card-vue"
      >
        <h3><a :href="project.link">{{ project.title }}</a></h3>
        <span class="tag">{{ project.type }}</span>
        <p>{{ project.description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  projects: {
    type: Array,
    default: () => []
  }
})

// We will hydrate this from the static HTML data attributes or a JSON object
// For now, let's try to parse the existing static grid if we can, or just use a hardcoded list for demo
// A better approach for "islands" is to pass data via window object or data attributes.
// Let's assume we read from a global variable set by Hugo.

const projectsData = ref(window.projectData || [])
const filters = ['All', 'Personal', 'School', 'Work']
const currentFilter = ref('All')

const filteredProjects = computed(() => {
  if (currentFilter.value === 'All') return projectsData.value
  return projectsData.value.filter(p => p.type === currentFilter.value)
})

onMounted(() => {
  // If no data passed, try to scrape it from the DOM (progressive enhancement)
  if (projectsData.value.length === 0) {
    const staticCards = document.querySelectorAll('.project-card')
    const scraped = []
    staticCards.forEach(card => {
      scraped.push({
        title: card.querySelector('h3 a').innerText,
        link: card.querySelector('h3 a').getAttribute('href'),
        type: card.getAttribute('data-type'),
        description: card.querySelector('.content-body').innerText
      })
    })
    projectsData.value = scraped
    
    // Hide static grid
    const staticGrid = document.querySelector('.static-grid')
    if (staticGrid) staticGrid.style.display = 'none'
  }
})
</script>

<style scoped>
.filters {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  justify-content: center;
}

button {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #aaa;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
}

button.active, button:hover {
  background: var(--secondary-color, #7000ff);
  color: #fff;
  border-color: var(--secondary-color, #7000ff);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 30px;
}

.project-card-vue {
  background: #1a1a1a;
  padding: 30px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.tag {
  display: inline-block;
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  margin-bottom: 15px;
}
</style>
