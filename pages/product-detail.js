document.addEventListener('DOMContentLoaded', () => {
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

    const inventory = window.AnimeStorage ? window.AnimeStorage.getInventory() : (JSON.parse(localStorage.getItem('anime_inventory')) || []);
    const product = inventory.find(p => p.id == productId);

    if (!product) {
        alert('Producto no encontrado en el catálogo.');
        window.location.href = 'tienda.html';
        return;
    }

    const rawImages = (product.img && product.img.length > 0) ? product.img : ['../assets/media/marin.jpg'];
    const formattedImages = rawImages.map(img => window.formatImagePath ? window.formatImagePath(img) : img);

    // Datos básicos
    prodTitle.textContent = product.name;
    prodPrice.textContent = `$${product.price}`;
    prodDesc.textContent = product.desc || 'Sin descripción disponible.';
    mainImg.src = formattedImages[0];

    // Render miniaturas
    thumbGrid.innerHTML = '';
    formattedImages.forEach((imgSrc) => {
        const img = document.createElement('img');
        img.src = imgSrc;
        img.className = 'thumb-img';
        img.onclick = () => { mainImg.src = imgSrc; };
        thumbGrid.appendChild(img);
    });

    // --- Lógica de Configuración de Pedido ---
    const availableSizes = product.sizes ? product.sizes.split(',').map(s => s.trim()) : ['Única'];

    if (configContainer) {
        configContainer.innerHTML = '';
        formattedImages.forEach((imgSrc, index) => {
            const colorSection = document.createElement('div');
            colorSection.className = 'color-option-group';

            colorSection.innerHTML = `
                <div class="color-header">
                    <img src="${imgSrc}" class="color-thumb">
                    <span>Variante ${index + 1}</span>
                </div>
                <div class="sizes-grid">
                    ${availableSizes.map(size => `
                        <div class="size-input-group">
                            <label>${size}</label>
                            <input type="number" min="0" value="0"
                                   class="size-qty"
                                   data-variant="${index}"
                                   data-size="${size}"
                                   oninput="updateOrderTotals()">
                        </div>
                    `).join('')}
                </div>
            `;
            configContainer.appendChild(colorSection);
        });
    }

    // Función para sumar totales
    window.updateOrderTotals = () => {
        let totalQty = 0;
        const inputs = document.querySelectorAll('.size-qty');
        inputs.forEach(input => {
            totalQty += parseInt(input.value) || 0;
        });

        const unitPrice = parseFloat(product.price) || 0;
        const totalCost = totalQty * unitPrice;

        if (totalCountEl) totalCountEl.textContent = totalQty;
        if (totalPriceEl) totalPriceEl.textContent = `$${totalCost.toFixed(2)}`;
    };

    // --- Botón Añadir al Carrito ---
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
                alert('Por favor, selecciona al menos una talla y cantidad.');
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
            localStorage.setItem('anime_cart', JSON.stringify(cart));

            alert('¡Producto añadido al carrito exitosamente!');
        };
    }
});
