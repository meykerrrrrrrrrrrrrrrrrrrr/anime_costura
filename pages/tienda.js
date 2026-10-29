// ====================================================================
// TIENDA.JS - Catálogo de Prendas AnimeCostura
// Apple Dark Design System (Series 12 Reference)
// Carga Asíncrona Robusta & Sincronización Automática
// ====================================================================

document.addEventListener('DOMContentLoaded', async () => {
    const productDisplay = document.getElementById('product-display');
    const searchInput = document.getElementById('shop-search');
    const navCartCount = document.getElementById('nav-cart-count');
    const btnRefresh = document.getElementById('btn-refresh-shop');

    function updateCartCount() {
        const cart = JSON.parse(localStorage.getItem('anime_cart')) || [];
        const totalItems = cart.reduce((sum, item) => sum + item.totalQty, 0);
        if (navCartCount) navCartCount.textContent = totalItems;
    }

    function getCatalog() {
        return window.AnimeStorage ? window.AnimeStorage.getInventory() : [];
    }

    // Renderizar productos con estilo Apple Dark (Charcoal Stage, 28px cards, Blue Purchase Pill)
    window.renderProducts = function(filterText = '') {
        if (!productDisplay) return;
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
                <div style="grid-column: 1/-1; text-align: center; padding: 4rem 2rem; background: #111111; border-radius: 28px; border: 1px solid rgba(255,255,255,0.08);">
                    <div style="font-size: 2.5rem; margin-bottom: 0.8rem;">👕</div>
                    <h3 style="font-family: 'Inter', -apple-system, sans-serif; font-size: 1.4rem; font-weight: 600; color: #f5f5f7; margin-bottom: 0.5rem; letter-spacing: -0.28px;">
                        ${query ? `No se encontraron prendas para "${filterText}"` : 'El catálogo está actualmente vacío'}
                    </h3>
                    <p style="color: #86868b; font-size: 0.95rem;">
                        ${query ? 'Prueba con otra búsqueda o limpia el filtro.' : 'Pronto se añadirán nuevos lanzamientos exclusivos.'}
                    </p>
                </div>
            `;
            return;
        }

        filtered.forEach(prod => {
            const card = document.createElement('div');
            card.className = 'product-card apple-merch-card';
            card.style.background = '#111111';
            card.style.borderRadius = '28px';
            card.style.overflow = 'hidden';
            card.style.border = '1px solid rgba(255,255,255,0.08)';
            card.style.transition = 'transform 0.25s ease, border-color 0.25s ease';
            card.style.cursor = 'pointer';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';

            card.onmouseenter = () => {
                card.style.transform = 'translateY(-4px)';
                card.style.borderColor = 'rgba(255,255,255,0.2)';
            };
            card.onmouseleave = () => {
                card.style.transform = 'translateY(0)';
                card.style.borderColor = 'rgba(255,255,255,0.08)';
            };

            const rawImages = (prod.img && prod.img.length > 0) ? prod.img : ['../assets/media/marin.jpg'];
            const images = rawImages.map(img => window.formatImagePath ? window.formatImagePath(img) : img);

            // Contenedor multimedia Gallery Black (#000000)
            const mediaContainer = document.createElement('div');
            mediaContainer.className = 'product-media-container';
            mediaContainer.style.background = '#000000';
            mediaContainer.style.position = 'relative';
            mediaContainer.style.width = '100%';
            mediaContainer.style.height = '320px';
            mediaContainer.style.overflow = 'hidden';

            // Capa A de imagen
            const imgA = document.createElement('img');
            imgA.className = 'prod-slide-img active';
            imgA.src = images[0];
            imgA.alt = prod.name;
            imgA.style.width = '100%';
            imgA.style.height = '100%';
            imgA.style.objectFit = 'cover';
            imgA.style.transition = 'opacity 0.4s ease';
            mediaContainer.appendChild(imgA);

            if (images.length > 1) {
                // Capa B para crossfade suave
                const imgB = document.createElement('img');
                imgB.className = 'prod-slide-img exiting';
                imgB.src = images[1] || images[0];
                imgB.alt = prod.name;
                imgB.style.width = '100%';
                imgB.style.height = '100%';
                imgB.style.objectFit = 'cover';
                imgB.style.position = 'absolute';
                imgB.style.top = '0';
                imgB.style.left = '0';
                imgB.style.opacity = '0';
                imgB.style.transition = 'opacity 0.4s ease';
                mediaContainer.appendChild(imgB);

                // Badge de fotos disponibles (Signal Orange / Burnt Badge Wash de DESIGN.md)
                const viewsBadge = document.createElement('div');
                viewsBadge.style.position = 'absolute';
                viewsBadge.style.top = '14px';
                viewsBadge.style.right = '14px';
                viewsBadge.style.background = '#311400';
                viewsBadge.style.color = '#ff791b';
                viewsBadge.style.borderRadius = '5px';
                viewsBadge.style.padding = '4px 8px';
                viewsBadge.style.fontSize = '11px';
                viewsBadge.style.fontWeight = '600';
                viewsBadge.style.letterSpacing = '-0.12px';
                viewsBadge.style.zIndex = '5';
                viewsBadge.innerHTML = `<span>1/${images.length} fotos</span>`;
                mediaContainer.appendChild(viewsBadge);

                // Puntos interactivos tipo píldora
                const dotsContainer = document.createElement('div');
                dotsContainer.className = 'product-slider-dots';
                dotsContainer.style.position = 'absolute';
                dotsContainer.style.bottom = '12px';
                dotsContainer.style.left = '50%';
                dotsContainer.style.transform = 'translateX(-50%)';
                dotsContainer.style.display = 'flex';
                dotsContainer.style.gap = '6px';
                dotsContainer.style.zIndex = '5';

                images.forEach((_, idx) => {
                    const dot = document.createElement('span');
                    dot.className = `slider-dot ${idx === 0 ? 'active' : ''}`;
                    dot.style.width = idx === 0 ? '16px' : '6px';
                    dot.style.height = '6px';
                    dot.style.borderRadius = '9999px';
                    dot.style.background = idx === 0 ? '#ffffff' : 'rgba(255,255,255,0.4)';
                    dot.style.cursor = 'pointer';
                    dot.style.transition = 'width 0.2s ease, background 0.2s ease';
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
                    incoming.style.opacity = '1';
                    outgoing.style.opacity = '0';

                    showingA = !showingA;

                    viewsBadge.innerHTML = `<span>${currentSlideIdx + 1}/${images.length} fotos</span>`;
                    dotsContainer.querySelectorAll('span').forEach((d, i) => {
                        d.style.width = i === currentSlideIdx ? '16px' : '6px';
                        d.style.background = i === currentSlideIdx ? '#ffffff' : 'rgba(255,255,255,0.4)';
                    });
                }

                function startSlideTimer() {
                    if (autoSlideTimer) clearInterval(autoSlideTimer);
                    autoSlideTimer = setInterval(() => {
                        const next = (currentSlideIdx + 1) % images.length;
                        goToSlide(next);
                    }, 4000);
                }

                function stopSlideTimer() {
                    if (autoSlideTimer) clearInterval(autoSlideTimer);
                }

                startSlideTimer();
                card.addEventListener('mouseenter', stopSlideTimer);
                card.addEventListener('mouseleave', startSlideTimer);
            }

            // Cuerpo de información del producto
            const infoDiv = document.createElement('div');
            infoDiv.className = 'product-info';
            infoDiv.style.background = 'transparent';
            infoDiv.style.padding = '1.5rem';
            infoDiv.style.display = 'flex';
            infoDiv.style.flexDirection = 'column';
            infoDiv.style.flex = '1';
            infoDiv.style.justifyContent = 'space-between';

            infoDiv.innerHTML = `
                <div>
                    <h3 style="font-family: 'Inter', -apple-system, sans-serif; font-size: 1.05rem; font-weight: 600; color: #f5f5f7; margin-bottom: 0.4rem; letter-spacing: -0.224px; text-transform: uppercase;">
                        ${prod.name}
                    </h3>
                    <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 0.88rem; color: #86868b; line-height: 1.4; margin-bottom: 1rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                        ${prod.desc || 'Prenda exclusiva confeccionada con estándares de alta costura inspirada en el anime.'}
                    </p>
                </div>
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1rem;">
                        <span style="font-size: 0.82rem; color: #86868b; text-transform: uppercase; font-weight: 500;">Precio</span>
                        <span style="font-family: 'Inter', -apple-system, sans-serif; font-size: 1.25rem; font-weight: 600; color: #f5f5f7; letter-spacing: -0.28px;">
                            $${prod.price}
                        </span>
                    </div>
                    <button class="btn-detail-link" style="width: 100%; border-radius: 9999px; padding: 10px 20px; font-weight: 600; font-size: 0.9rem; background: #0071e3; color: #ffffff; border: none; cursor: pointer; transition: background 0.2s; letter-spacing: -0.12px;">
                        Ver Detalles
                    </button>
                </div>
            `;

            // Navegación limpia al hacer clic en cualquier parte de la tarjeta o en el botón
            card.onclick = () => {
                window.location.href = `product-detail.html?id=${prod.id}`;
            };

            card.appendChild(mediaContainer);
            card.appendChild(infoDiv);
            productDisplay.appendChild(card);
        });
    };

    // 1. Esperar a que el motor IndexedDB / Cloud termine de inicializarse
    if (window.AnimeStorage && window.AnimeStorage.ready) {
        await window.AnimeStorage.ready();
    }

    // 2. Revalidar en segundo plano para asegurar que los últimos cambios se muestren
    if (window.AnimeStorage && window.AnimeStorage.autoRevalidateServer) {
        window.AnimeStorage.autoRevalidateServer().then(() => {
            window.renderProducts(searchInput ? searchInput.value : '');
        });
    }

    // Buscador en tiempo real
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            window.renderProducts(e.target.value);
        });
    }

    // Botón de sincronización manual para usuarios
    if (btnRefresh) {
        btnRefresh.addEventListener('click', async () => {
            btnRefresh.textContent = '🔄 Sincronizando...';
            try {
                if (window.AnimeStorage) {
                    await window.AnimeStorage.syncFromServer();
                }
                window.renderProducts(searchInput ? searchInput.value : '');
            } catch (e) {
                console.warn(e);
            } finally {
                btnRefresh.textContent = '🔄 Sincronizar Catálogo';
            }
        });
    }

    // Auto-actualizar si el inventario cambia
    window.addEventListener('animeInventoryUpdated', () => {
        window.renderProducts(searchInput ? searchInput.value : '');
    });

    updateCartCount();
    window.renderProducts();
});
