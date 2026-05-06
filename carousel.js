const carouselData = [
    {
        src: 'image/header1.PNG',
        title: 'Streamlined Freight Management',
        caption: 'Move more cargo with a smarter, faster logistics platform built for modern business.'
    },
    {
        src: 'image/header2.PNG',
        title: 'Trusted Last-Mile Delivery',
        caption: 'Full visibility from pickup to delivery with premium tracking and support.'
    },
    {
        src: 'image/header3.PNG',
        title: 'Operations Designed for Scale',
        caption: 'A responsive logistics experience that adapts to every shipment and route.'
    }
];

let carouselIndex = 0;
let carouselTimer = null;

function buildCarousel() {
    const carousel = document.querySelector('.carousel-shell');
    if (!carousel) return;

    const inner = document.createElement('div');
    inner.className = 'carousel-inner';

    carouselData.forEach((slide, index) => {
        const slideEl = document.createElement('div');
        slideEl.className = `carousel-slide ${index === 0 ? 'active' : ''}`;
        slideEl.innerHTML = `
            <img src="${slide.src}" alt="${slide.title}" />
            <div class="carousel-overlay">
                <h3>${slide.title}</h3>
                <p>${slide.caption}</p>
            </div>
        `;
        inner.appendChild(slideEl);
    });

    const nav = document.createElement('div');
    nav.className = 'carousel-nav';
    nav.innerHTML = `
        <button class="carousel-button carousel-prev" aria-label="Previous slide">&#10094;</button>
        <button class="carousel-button carousel-next" aria-label="Next slide">&#10095;</button>
    `;

    const dots = document.createElement('div');
    dots.className = 'carousel-dots';
    carouselData.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.className = `carousel-dot ${index === 0 ? 'active' : ''}`;
        dot.type = 'button';
        dot.setAttribute('aria-label', `Show slide ${index + 1}`);
        dot.dataset.index = index;
        dots.appendChild(dot);
    });

    carousel.appendChild(inner);
    carousel.appendChild(nav);
    carousel.appendChild(dots);

    nav.querySelector('.carousel-prev').addEventListener('click', () => {
        goToSlide(carouselIndex - 1);
        resetCarouselTimer();
    });
    nav.querySelector('.carousel-next').addEventListener('click', () => {
        goToSlide(carouselIndex + 1);
        resetCarouselTimer();
    });

    dots.addEventListener('click', (event) => {
        const target = event.target;
        if (!target.matches('.carousel-dot')) return;
        const index = Number(target.dataset.index);
        goToSlide(index);
        resetCarouselTimer();
    });
}

function goToSlide(index) {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.carousel-dot');
    carouselIndex = (index + slides.length) % slides.length;

    slides.forEach((slide, idx) => {
        slide.classList.toggle('active', idx === carouselIndex);
    });

    dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === carouselIndex);
    });
}

function startCarouselTimer() {
    carouselTimer = setInterval(() => {
        goToSlide(carouselIndex + 1);
    }, 3000);
}

function resetCarouselTimer() {
    if (carouselTimer) {
        clearInterval(carouselTimer);
    }
    startCarouselTimer();
}

window.addEventListener('DOMContentLoaded', () => {
    buildCarousel();
    startCarouselTimer();
});
