const header = document.querySelector('.persistent-header');
const heroSection = document.querySelector('.hero-section');

window.addEventListener('scroll', () => {
    const heroBottom = heroSection.getBoundingClientRect().bottom;
    if (heroBottom <= 0) {
        header.classList.add('visible');
    } else {
        header.classList.remove('visible');
    }
});