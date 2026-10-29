// ====================================================================
// PRODUCT-DETAIL.JS - Detalle de Prenda AnimeCostura
// Apple Dark Design System (Series 12 Reference)
// Carga Asíncrona Robusta & Prevención de Errores de Producto
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

    if (prodTitle) prodTitle.textContent = 'Cargando prenda...';

    // 1. Esperar a que el motor IndexedDB / Servidor termine de inicializarse
    if (window.AnimeStorage && window.AnimeStorage.ready) {
        await window.AnimeStorage.ready();
    }

    let inventory = window.AnimeStorage ? window.AnimeStorage.getInventory() : [];
    let product = inventory.find(p => String(p.id).trim() === String(productId).trim() || p.id == productId);

    // 2. Si no se encuentra de inmediato, forzar revalidación con el servidor
    if (!product && window.AnimeStorage && window.AnimeStorage.autoRevalidateServer) {
        try {
            await window.AnimeStorage.autoRevalidateServer();
            inventory = window.AnimeStorage.getInventory();
            product = inventory.find(p => String(p.id).trim() === String(productId).trim() || p.id == productId);
        } catch (e) {}
    }

    // 3. Fallback directo a data/inventory.json por si la caché local no lo cargó aún
    if (!product) {
        try {
            const res = await fetch('../data/inventory.json?t=' + Date.now(), { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    product = data.find(p => String(p.id).trim() === String(productId).trim() || p.id == productId);
                    if (product && window.AnimeStorage) {
                        window.AnimeStorage.cache['anime_inventory'] = data;
                    }
                }
            }
        } catch (e) {}
    }

    // 4. Fallback directo a localStorage
    if (!product) {
        try {
            const raw = localStorage.getItem('anime_inventory');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    product = parsed.find(p => String(p.id).trim() === String(productId).trim() || p.id == productId);
                }
            }
        } catch (e) {}
    }

    // Si después de todas las comprobaciones no existe, mostrar tarjeta estética dentro de la página
    if (!product) {
        const container = document.querySelector('.product-detail-container') || document.querySelector('.product-detail-section');
        if (container) {
            container.innerHTML = `
                <div style="background: #111111; border-radius: 28px; padding: 4rem 2rem; text-align: center; border: 1px solid rgba(255, 255, 255, 0.08); max-width: 600px; margin: 3rem auto;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
                    <h2 style="font-family: 'Inter', -apple-system, sans-serif; font-size: 1.75rem; font-weight: 600; color: #f5f5f7; margin-bottom: 0.8rem; letter-spacing: -0.28px;">
                        Prenda no encontrada
                    </h2>
                    <p style="color: #86868b; font-size: 1rem; line-height: 1.5; margin-bottom: 2rem;">
                        La prenda solicitada no está disponible en este momento o fue actualizada en el catálogo.
                    </p>
                    <a href="tienda.html" class="btn-primary" style="display: inline-block; background: #0071e3; color: #ffffff; padding: 12px 28px; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 0.95rem;">
                        Volver al Catálogo
                    </a>
                </div>
            `;
        }
        return;
    }

    const rawImages = (product.img && product.img.length > 0) ? product.img : ['../assets/media/marin.jpg'];
    const formattedImages = rawImages.map(img => window.formatImagePath ? window.formatImagePath(img) : img);

    // Tipografía Apple Porcelain & SF Pro Display (Inter)
    if (prodTitle) prodTitle.textContent = product.name;
    if (prodPrice) prodPrice.textContent = `$${product.price}`;
    if (prodDesc) prodDesc.textContent = product.desc || 'Prenda exclusiva confeccionada con los más altos estándares textiles inspirada en el arte anime.';
    if (mainImg) mainImg.src = formattedImages[0];

    // Miniaturas estilo Apple (radius 10px, clean 1px border)
    if (thumbGrid) {
        thumbGrid.innerHTML = '';
        formattedImages.forEach((imgSrc, idx) => {
            const img = document.createElement('img');
            img.src = imgSrc;
            img.className = `thumb-img ${idx === 0 ? 'active' : ''}`;
            img.style.borderRadius = '10px';
            img.style.cursor = 'pointer';
            img.style.border = idx === 0 ? '2px solid #0071e3' : '1px solid rgba(255, 255, 255, 0.15)';
            img.style.width = '70px';
            img.style.height = '70px';
            img.style.objectFit = 'cover';
            img.onclick = () => {
                if (mainImg) mainImg.src = imgSrc;
                document.querySelectorAll('.thumb-img').forEach(t => {
                    t.classList.remove('active');
                    t.style.border = '1px solid rgba(255, 255, 255, 0.15)';
                });
                img.classList.add('active');
                img.style.border = '2px solid #0071e3';
            };
            thumbGrid.appendChild(img);
        });
    }

    // --- Configuración de Pedido Estilo Apple (Charcoal Stage, Pill Inputs) ---
    const availableSizes = product.sizes ? product.sizes.split(',').map(s => s.trim()) : ['S', 'M', 'L', 'XL'];

    if (configContainer) {
        configContainer.innerHTML = '';
        formattedImages.forEach((imgSrc, index) => {
            const colorSection = document.createElement('div');
            colorSection.className = 'color-option-group';
            colorSection.style.background = '#111111';
            colorSection.style.borderRadius = '20px';
            colorSection.style.padding = '1.25rem 1.5rem';
            colorSection.style.marginBottom = '1.2rem';
            colorSection.style.border = '1px solid rgba(255, 255, 255, 0.08)';

            colorSection.innerHTML = `
                <div class="color-header" style="display:flex; align-items:center; gap:14px; margin-bottom:1rem;">
                    <img src="${imgSrc}" class="color-thumb" style="width:48px; height:48px; border-radius:10px; object-fit:cover; border:1px solid rgba(255,255,255,0.2);">
                    <div>
                        <span style="color:#f5f5f7; font-weight:600; font-size:0.95rem; display:block;">Foto / Variante #${index + 1}</span>
                        <small style="color:#86868b; font-size:0.8rem;">Selecciona las unidades por talla</small>
                    </div>
                </div>
                <div class="sizes-grid" style="display:flex; gap:12px; flex-wrap:wrap;">
                    ${availableSizes.map(size => `
                        <div class="size-input-group" style="display:flex; flex-direction:column; align-items:center; background:rgba(255,255,255,0.04); padding:8px 14px; border-radius:16px; border:1px solid #6e6e73;">
                            <label style="color:#86868b; font-size:0.8rem; font-weight:600; margin-bottom:4px;">${size}</label>
                            <input type="number" min="0" value="0"
                                   class="size-qty"
                                   data-variant="${index}"
                                   data-size="${size}"
                                   style="width:50px; text-align:center; background:transparent; color:#f5f5f7; border:none; font-weight:600; font-size:1.05rem; outline:none;"
                                   oninput="updateOrderTotals()">
                        </div>
                    `).join('')}
                </div>
            `;
            configContainer.appendChild(colorSection);
        });
    }

    // Función para calcular totales con precisión
    window.updateOrderTotals = () => {
        let totalQty = 0;
        const inputs = document.querySelectorAll('.size-qty');
        inputs.forEach(input => {
            totalQty += parseInt(input.value) || 0;
        });

        const rawPriceClean = (product.price || '0').toString().replace(/[^0-9.]/g, '');
        const unitPrice = parseFloat(rawPriceClean) || 0;
        const totalCost = totalQty * unitPrice;

        if (totalCountEl) totalCountEl.textContent = totalQty;
        if (totalPriceEl) totalPriceEl.textContent = `$${totalCost.toLocaleString('es-CO')}`;
    };

    // --- Botón Añadir al Carrito (Apple Blue Purchase Pill) ---
    if (btnAddCart) {
        btnAddCart.onclick = () => {
            const selections = [];
            const inputs = document.querySelectorAll('.size-qty');

            inputs.forEach(input => {
                const qty = parseInt(input.value) || 0;
                if (qty > 0) {
                    selections.push({
                        variant: input.dataset.variant,
                        size: input.dataset.size,
                        quantity: qty
                    });
                }
            });

            if (selections.length === 0) {
                alert('Por favor, indica al menos 1 unidad en la talla deseada.');
                return;
            }

            const cartItem = {
                productId: product.id,
                name: product.name,
                price: product.price,
                img: formattedImages[0],
                details: selections,
                totalQty: selections.reduce((sum, item) => sum + item.quantity, 0)
            };

            const cart = JSON.parse(localStorage.getItem('anime_cart')) || [];
            cart.push(cartItem);
            try {
                localStorage.setItem('anime_cart', JSON.stringify(cart));
            } catch (e) {}

            alert(`✨ ¡${cartItem.totalQty} prenda(s) de "${product.name}" añadidas a tu carrito!`);
            window.location.href = 'carrito.html';
        };
    }
});
