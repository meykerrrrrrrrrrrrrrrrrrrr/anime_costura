// --- Lógica de la Tienda AnimeCostura con Almacenamiento Ilimitado ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Verificación de Sesión
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'auth.html';
        return;
    }

    const productDisplay = document.getElementById('product-display');
    const searchInput = document.getElementById('shop-search');
    const navCartCount = document.getElementById('nav-cart-count');

    function getCatalog() {
        return window.AnimeStorage ? window.AnimeStorage.getInventory() : (JSON.parse(localStorage.getItem('anime_inventory')) || []);
    }

    function updateCartCount() {
        const cart = JSON.parse(localStorage.getItem('anime_cart')) || [];
        const totalItems = cart.reduce((sum, item) => sum + item.totalQty, 0);
        if (navCartCount) navCartCount.textContent = totalItems;
    }

    // 2. Renderizar productos en la tienda
    window.renderProducts = function(filterText = '') {
        productDisplay.innerHTML = '';
        const inventory = getCatalog();
        const query = filterText.toLowerCase().trim();

        const filtered = inventory.filter(prod => {
            if (!query) return true;
            const name = (prod.name || '').toLowerCase();
            const desc = (prod.desc || '').toLowerCase();
            return name.includes(query) || desc.includes(query);
        });

        if (filtered.length === 0) {
            productDisplay.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 4rem 2rem; font-size: 1.15rem; color: #fff; background: rgba(20,20,30,0.85); border-radius: 24px; backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.15);">
                    ${query ? `No se encontraron prendas que coincidan con "${filterText}"` : 'No hay prendas disponibles en el inventario actualmente.'} 🔍
                </div>
            `;
            return;
        }

        filtered.forEach(prod => {
            const card = document.createElement('div');
            card.className = 'product-card glass-panel';
            card.style.borderRadius = '20px';
            card.style.overflow = 'hidden';
            card.style.boxShadow = '0 15px 35px rgba(0,0,0,0.2)';
            card.style.border = '1px solid rgba(255,255,255,0.4)';
            card.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
            card.style.cursor = 'pointer';

            card.onmouseenter = () => {
                card.style.transform = 'translateY(-6px)';
                card.style.boxShadow = '0 20px 45px rgba(108, 92, 231, 0.3)';
            };
            card.onmouseleave = () => {
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = '0 15px 35px rgba(0,0,0,0.2)';
            };
            card.onclick = () => {
                window.location.href = `product-detail.html?id=${prod.id}`;
            };

            const rawImages = (prod.img && prod.img.length > 0) ? prod.img : ['../assets/media/marin.jpg'];
            const images = rawImages.map(img => window.formatImagePath ? window.formatImagePath(img) : img);

            // Contenedor multimedia con animación cinematográfica suave
            const mediaContainer = document.createElement('div');
            mediaContainer.className = 'product-media-container';

            // Capa A de imagen
            const imgA = document.createElement('img');
            imgA.className = 'prod-slide-img active';
            imgA.src = images[0];
            imgA.alt = prod.name;
            mediaContainer.appendChild(imgA);

            if (images.length > 1) {
                // Capa B para crossfade fluido sin saltos bruscos
                const imgB = document.createElement('img');
                imgB.className = 'prod-slide-img exiting';
                imgB.src = images[1] || images[0];
                imgB.alt = prod.name;
                mediaContainer.appendChild(imgB);

                // Badge animado indicador de fotos disponibles
                const viewsBadge = document.createElement('div');
                viewsBadge.className = 'product-badge-views';
                viewsBadge.innerHTML = `<span>✨ 1/${images.length}</span>`;
                mediaContainer.appendChild(viewsBadge);

                // Puntos interactivos animados tipo píldora
                const dotsContainer = document.createElement('div');
                dotsContainer.className = 'product-slider-dots';
                images.forEach((_, idx) => {
                    const dot = document.createElement('span');
                    dot.className = `slider-dot ${idx === 0 ? 'active' : ''}`;
                    dot.title = `Ver foto ${idx + 1}`;
                    dot.onclick = (e) => {
                        e.stopPropagation();
                        goToSlide(idx);
                    };
                    dotsContainer.appendChild(dot);
                });
                mediaContainer.appendChild(dotsContainer);

                let currentSlideIdx = 0;
                let showingA = true;
                let autoSlideTimer = null;

                function goToSlide(nextIdx) {
                    if (nextIdx === currentSlideIdx) return;
                    currentSlideIdx = nextIdx;

                    const incoming = showingA ? imgB : imgA;
                    const outgoing = showingA ? imgA : imgB;

                    incoming.src = images[currentSlideIdx];
                    incoming.className = 'prod-slide-img entering';

                    void incoming.offsetWidth; // Forzar reflujo

                    incoming.className = 'prod-slide-img active';
                    outgoing.className = 'prod-slide-img exiting';

                    showingA = !showingA;

                    viewsBadge.innerHTML = `<span>✨ ${currentSlideIdx + 1}/${images.length}</span>`;
                    dotsContainer.querySelectorAll('.slider-dot').forEach((d, i) => {
                        d.className = `slider-dot ${i === currentSlideIdx ? 'active' : ''}`;
                    });
                }

                function startSlideTimer() {
                    if (autoSlideTimer) clearInterval(autoSlideTimer);
                    autoSlideTimer = setInterval(() => {
                        const next = (currentSlideIdx + 1) % images.length;
                        goToSlide(next);
                    }, 3600);
                }

                function stopSlideTimer() {
                    if (autoSlideTimer) clearInterval(autoSlideTimer);
                }

                startSlideTimer();
                card.addEventListener('mouseenter', stopSlideTimer);
                card.addEventListener('mouseleave', startSlideTimer);
            }

            const infoDiv = document.createElement('div');
            infoDiv.className = 'product-info';
            infoDiv.style.background = 'transparent';
            infoDiv.style.padding = '1.5rem';
            infoDiv.innerHTML = `
                <h3 style="font-size: 1.1rem; color: #1a1a1a; margin-bottom: 0.5rem; font-weight: 700;">${prod.name}</h3>
                <p style="font-size: 1.3rem; color: var(--primary); font-family: 'Permanent Marker', cursive; margin-bottom: 1rem;">$${prod.price}</p>
                <button class="btn-add" style="width: 100%; border-radius: 12px; padding: 0.8rem; font-weight: 700; background: var(--secondary);">Ver Detalles</button>
            `;

            card.appendChild(mediaContainer);
            card.appendChild(infoDiv);
            productDisplay.appendChild(card);
        });
    };

    // Buscador en tiempo real
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            window.renderProducts(e.target.value);
        });
    }

    // Auto-actualizar si el inventario cambia
    window.addEventListener('animeInventoryUpdated', () => {
        window.renderProducts(searchInput ? searchInput.value : '');
    });

    updateCartCount();
    window.renderProducts();
});
