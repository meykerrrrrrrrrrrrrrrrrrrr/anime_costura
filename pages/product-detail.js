// ====================================================================
// PRODUCT-DETAIL.JS - Detalle de Prenda AnimeCostura
// Apple Dark Design System & Experiencia Móvil de Alta Fidelidad
// Galería Adaptable con Carrusel Táctil & Configuración Compacta
// ====================================================================

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    const mainImg = document.getElementById('main-product-img');
    const thumbGrid = document.getElementById('thumbnail-grid');
    const prodTitle = document.getElementById('prod-title');
    const prodPrice = document.getElementById('prod-price');
    const prodDesc = document.getElementById('prod-desc');
    const configContainer = document.getElementById('config-container');
    const totalCountEl = document.getElementById('total-count');
    const totalPriceEl = document.getElementById('total-price');
    const btnAddCart = document.getElementById('btn-add-cart');

    if (!productId) {
        window.location.href = 'tienda.html';
        return;
    }

    // 1. Obtener producto de inmediato de la memoria o caché
    let inventory = window.AnimeStorage ? window.AnimeStorage.getInventory() : [];
    let product = inventory.find(p => String(p.id).trim() === String(productId).trim() || p.id == productId);

    // 2. Si aún no está listo el motor, esperar a ready()
    if (!product && window.AnimeStorage && window.AnimeStorage.ready) {
        await window.AnimeStorage.ready();
        inventory = window.AnimeStorage.getInventory();
        product = inventory.find(p => String(p.id).trim() === String(productId).trim() || p.id == productId);
    }

    // 3. Fallback directo a data/inventory.json solo si no existe en local
    if (!product) {
        try {
            const res = await fetch('../data/inventory.json?t=' + Date.now(), { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    product = data.find(p => String(p.id).trim() === String(productId).trim() || p.id == productId);
                }
            }
        } catch (e) {}
    }

    // Si después de todas las comprobaciones no existe
    if (!product) {
        const container = document.querySelector('.product-detail-container') || document.querySelector('.product-detail-section');
        if (container) {
            container.innerHTML = `
                <div style="background: #111111; border-radius: 28px; padding: 3rem 1.5rem; text-align: center; border: 1px solid rgba(255, 255, 255, 0.08); max-width: 520px; margin: 2rem auto;">
                    <div style="font-size: 2.8rem; margin-bottom: 0.8rem;">👕</div>
                    <h2 style="font-size: 1.5rem; font-weight: 600; color: #f5f5f7; margin-bottom: 0.6rem; letter-spacing: -0.28px;">
                        Prenda no encontrada
                    </h2>
                    <p style="color: #86868b; font-size: 0.95rem; line-height: 1.5; margin-bottom: 1.8rem;">
                        La prenda solicitada no está disponible en este momento.
                    </p>
                    <a href="tienda.html" class="btn-primary" style="display: inline-block; padding: 12px 28px;">
                        Volver a la Tienda
                    </a>
                </div>
            `;
        }
        return;
    }

    const rawImages = (product.img && product.img.length > 0) ? product.img : ['../assets/media/marin.jpg'];
    const formattedImages = rawImages.map(img => window.formatImagePath ? window.formatImagePath(img) : img);

    // Tipografía Apple Porcelain
    if (prodTitle) prodTitle.textContent = product.name;
    if (prodPrice) prodPrice.textContent = `$${product.price}`;
    if (prodDesc) prodDesc.textContent = product.desc || 'Prenda exclusiva confeccionada con estándares de alta costura inspirada en el anime.';
    if (mainImg) mainImg.src = formattedImages[0];

    // ====================================================================
    // GALERÍA MULTIMEDIA ADAPTABLE PARA MÓVIL Y ESCRITORIO
    // ====================================================================
    let currentPhotoIndex = 0;

    // Badge contador de fotos
    const galleryContainer = document.querySelector('.product-gallery');
    let photoCounter = document.getElementById('photo-counter-badge');
    if (!photoCounter && galleryContainer) {
        photoCounter = document.createElement('div');
        photoCounter.id = 'photo-counter-badge';
        photoCounter.style.display = formattedImages.length > 1 ? 'inline-flex' : 'none';
        photoCounter.style.alignItems = 'center';
        photoCounter.style.gap = '6px';
        photoCounter.style.background = '#311400';
        photoCounter.style.color = '#ff791b';
        photoCounter.style.fontSize = '12px';
        photoCounter.style.fontWeight = '600';
        photoCounter.style.padding = '4px 10px';
        photoCounter.style.borderRadius = '5px';
        photoCounter.style.width = 'fit-content';
        photoCounter.style.marginBottom = '8px';
        galleryContainer.insertBefore(photoCounter, galleryContainer.firstChild);
    }

    function updatePhotoView(index) {
        if (index < 0) index = formattedImages.length - 1;
        if (index >= formattedImages.length) index = 0;
        currentPhotoIndex = index;

        if (mainImg) {
            mainImg.style.opacity = '0.6';
            mainImg.src = formattedImages[currentPhotoIndex];
            setTimeout(() => { mainImg.style.opacity = '1'; }, 100);
        }

        if (photoCounter) {
            photoCounter.textContent = `📷 Foto ${currentPhotoIndex + 1} de ${formattedImages.length}`;
        }

        // Actualizar miniaturas activas
        if (thumbGrid) {
            const thumbs = thumbGrid.querySelectorAll('.thumb-img');
            thumbs.forEach((t, i) => {
                if (i === currentPhotoIndex) {
                    t.classList.add('active');
                    t.style.borderColor = '#0071e3';
                    t.style.transform = 'scale(1.05)';
                    t.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                } else {
                    t.classList.remove('active');
                    t.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                    t.style.transform = 'scale(1)';
                }
            });
        }
    }

    // Renderizar miniaturas táctiles en cinta horizontal
    if (thumbGrid) {
        thumbGrid.innerHTML = '';
        if (formattedImages.length > 1) {
            formattedImages.forEach((imgSrc, idx) => {
                const img = document.createElement('img');
                img.src = imgSrc;
                img.className = `thumb-img ${idx === 0 ? 'active' : ''}`;
                img.alt = `${product.name} - Foto ${idx + 1}`;
                img.style.width = '64px';
                img.style.height = '64px';
                img.style.borderRadius = '12px';
                img.style.objectFit = 'cover';
                img.style.cursor = 'pointer';
                img.style.border = idx === 0 ? '2px solid #0071e3' : '1px solid rgba(255, 255, 255, 0.12)';
                img.style.flexShrink = '0';
                img.style.transition = 'transform 0.2s, border-color 0.2s';

                img.onclick = () => updatePhotoView(idx);
                thumbGrid.appendChild(img);
            });
        } else {
            thumbGrid.style.display = 'none';
        }
    }

    updatePhotoView(0);

    // ====================================================================
    // CONFIGURACIÓN DE PEDIDO COMPACTA Y ULTRA LIMPIA (APPLE SYSTEM)
    // ====================================================================
    const availableSizes = product.sizes ? product.sizes.split(',').map(s => s.trim()).filter(Boolean) : ['S', 'M', 'L', 'XL'];
    let selectedSize = availableSizes[0] || 'Única';
    let selectedQuantity = 1;

    if (configContainer) {
        configContainer.innerHTML = '';

        const configWrapper = document.createElement('div');
        configWrapper.style.display = 'flex';
        configWrapper.style.flexDirection = 'column';
        configWrapper.style.gap = '1.4rem';

        // 1. Selector de Tallas con Píldoras Interactivas
        const sizeBlock = document.createElement('div');
        sizeBlock.innerHTML = `
            <label style="color:#86868b; font-size:0.85rem; font-weight:600; text-transform:uppercase; letter-spacing:-0.12px; margin-bottom:8px; display:block;">
                Talla: <span id="label-selected-size" style="color:#f5f5f7; font-weight:600;">${selectedSize}</span>
            </label>
            <div id="size-pills-row" style="display:flex; gap:10px; flex-wrap:wrap;">
                ${availableSizes.map(size => `
                    <button type="button" class="size-pill-btn ${size === selectedSize ? 'active' : ''}" data-size="${size}"
                        style="padding: 10px 20px; border-radius: 9999px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s;
                        background: ${size === selectedSize ? '#0071e3' : 'rgba(255,255,255,0.05)'};
                        color: ${size === selectedSize ? '#ffffff' : '#f5f5f7'};
                        border: 1px solid ${size === selectedSize ? '#0071e3' : '#6e6e73'};">
                        ${size}
                    </button>
                `).join('')}
            </div>
        `;

        // 2. Selector de Cantidad con Stepper Apple
        const qtyBlock = document.createElement('div');
        qtyBlock.innerHTML = `
            <label style="color:#86868b; font-size:0.85rem; font-weight:600; text-transform:uppercase; letter-spacing:-0.12px; margin-bottom:8px; display:block;">
                Cantidad de Unidades
            </label>
            <div style="display:inline-flex; align-items:center; background:rgba(255,255,255,0.05); border:1px solid #6e6e73; border-radius:9999px; padding:4px 6px;">
                <button type="button" id="btn-qty-minus" style="width:36px; height:36px; border-radius:50%; background:transparent; border:none; color:#f5f5f7; font-size:18px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center;">−</button>
                <span id="qty-display" style="width:48px; text-align:center; font-size:16px; font-weight:600; color:#f5f5f7;">1</span>
                <button type="button" id="btn-qty-plus" style="width:36px; height:36px; border-radius:50%; background:transparent; border:none; color:#f5f5f7; font-size:18px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center;">+</button>
            </div>
        `;

        configWrapper.appendChild(sizeBlock);
        configWrapper.appendChild(qtyBlock);
        configContainer.appendChild(configWrapper);

        // Eventos de selección de talla
        const sizeButtons = configContainer.querySelectorAll('.size-pill-btn');
        sizeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                sizeButtons.forEach(b => {
                    b.classList.remove('active');
                    b.style.background = 'rgba(255,255,255,0.05)';
                    b.style.color = '#f5f5f7';
                    b.style.borderColor = '#6e6e73';
                });
                btn.classList.add('active');
                btn.style.background = '#0071e3';
                btn.style.color = '#ffffff';
                btn.style.borderColor = '#0071e3';

                selectedSize = btn.dataset.size;
                const sizeLabel = document.getElementById('label-selected-size');
                if (sizeLabel) sizeLabel.textContent = selectedSize;
                updateTotals();
            });
        });

        // Eventos de cantidad
        const btnMinus = document.getElementById('btn-qty-minus');
        const btnPlus = document.getElementById('btn-qty-plus');
        const qtyDisplay = document.getElementById('qty-display');

        if (btnMinus) {
            btnMinus.addEventListener('click', () => {
                if (selectedQuantity > 1) {
                    selectedQuantity--;
                    if (qtyDisplay) qtyDisplay.textContent = selectedQuantity;
                    updateTotals();
                }
            });
        }

        if (btnPlus) {
            btnPlus.addEventListener('click', () => {
                selectedQuantity++;
                if (qtyDisplay) qtyDisplay.textContent = selectedQuantity;
                updateTotals();
            });
        }
    }

    // Actualizar resumen y total
    function updateTotals() {
        const rawPriceClean = (product.price || '0').toString().replace(/[^0-9.]/g, '');
        const unitPrice = parseFloat(rawPriceClean) || 0;
        const total = selectedQuantity * unitPrice;

        if (totalCountEl) totalCountEl.textContent = `${selectedQuantity} (${selectedSize})`;
        if (totalPriceEl) totalPriceEl.textContent = `$${total.toLocaleString('es-CO')}`;
    }

    updateTotals();

    // ====================================================================
    // BOTÓN AÑADIR AL CARRITO (APPLE BLUE PURCHASE PILL)
    // ====================================================================
    if (btnAddCart) {
        btnAddCart.onclick = () => {
            const cartItem = {
                productId: product.id,
                name: product.name,
                price: product.price,
                img: formattedImages[currentPhotoIndex] || formattedImages[0],
                details: [{
                    size: selectedSize,
                    quantity: selectedQuantity,
                    variant: currentPhotoIndex
                }],
                totalQty: selectedQuantity
            };

            const cart = JSON.parse(localStorage.getItem('anime_cart')) || [];
            cart.push(cartItem);
            try {
                localStorage.setItem('anime_cart', JSON.stringify(cart));
            } catch (e) {}

            alert(`✨ ¡${selectedQuantity} unidad(es) de "${product.name}" (Talla ${selectedSize}) añadidas a tu carrito!`);
            window.location.href = 'carrito.html';
        };
    }
});
