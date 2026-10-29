document.addEventListener('DOMContentLoaded', () => {
    const cartBody = document.getElementById('cart-body');
    const totalQtyEl = document.getElementById('cart-total-qty');
    const totalPriceEl = document.getElementById('cart-total-price');
    const btnCheckout = document.getElementById('btn-checkout');

    // Elementos del Zoom
    const zoomModal = document.getElementById('img-zoom-modal');
    const zoomedImg = document.getElementById('zoomed-img');
    const closeZoom = document.querySelector('.close-zoom');

    // Elementos del Checkout
    const checkoutModal = document.getElementById('checkout-modal');
    const closeCheckout = document.getElementById('close-checkout');
    const step1 = document.getElementById('checkout-step-1');
    const step2 = document.getElementById('checkout-step-2');
    const infoEnvio = document.getElementById('delivery-info-envio');
    const infoLocal = document.getElementById('delivery-info-local');
    const paymentMethod = document.getElementById('payment-method');
    const transferInfo = document.getElementById('payment-transfer-info');
    const cashInfo = document.getElementById('payment-cash-info');
    const nequiInfoEl = document.getElementById('admin-nequi-info');
    const btnConfirmOrder = document.getElementById('btn-confirm-order');

    let deliveryType = '';

    function renderCart() {
        const cart = JSON.parse(localStorage.getItem('anime_cart')) || [];
        cartBody.innerHTML = '';

        let grandTotal = 0;
        let grandQty = 0;

        if (cart.length === 0) {
            cartBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">Tu carrito está vacío 🛒</td></tr>';
        } else {
            cart.forEach((item, index) => {
                let itemSubtotal = 0;
                const detailsHtml = item.details.map(d => {
                    const sub = d.quantity * parseFloat(item.price);
                    itemSubtotal += sub;
                    return `<div>${d.size} (x${d.quantity})</div>`;
                }).join('');

                grandTotal += itemSubtotal;
                grandQty += item.totalQty;

                const inventory = window.AnimeStorage ? window.AnimeStorage.getInventory() : (JSON.parse(localStorage.getItem('anime_inventory')) || []);
                const prodData = inventory.find(p => p.id == item.productId);
                const rawImg = (prodData && prodData.img && prodData.img[0]) ? prodData.img[0] : (item.img || '../assets/media/marin.jpg');
                const imgUrl = window.formatImagePath ? window.formatImagePath(rawImg) : rawImg;

                cartBody.innerHTML += `
                    <tr>
                        <td>
                            <img src="${imgUrl}"
                                 onclick="zoomImage('${imgUrl}')"
                                 style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px; cursor: pointer; transition: 0.3s;"
                                 onmouseover="this.style.opacity='0.7'"
                                 onmouseout="this.style.opacity='1'">
                        </td>
                        <td><strong>${item.name}</strong></td>
                        <td>${detailsHtml}</td>
                        <td>${item.totalQty}</td>
                        <td>$${itemSubtotal.toFixed(2)}</td>
                        <td><button class="btn-danger" onclick="removeFromCart(${index})">Eliminar</button></td>
                    </tr>
                `;
            });
        }

        totalQtyEl.textContent = grandQty;
        totalPriceEl.textContent = `$${grandTotal.toFixed(2)}`;
    }

    window.zoomImage = (url) => {
        zoomedImg.src = url;
        zoomModal.style.display = 'block';
    };

    if (closeZoom) {
        closeZoom.onclick = () => {
            zoomModal.style.display = 'none';
        };
    }

    window.onclick = (event) => {
        if (event.target == zoomModal) {
            zoomModal.style.display = 'none';
        }
    };

    window.removeFromCart = (index) => {
        const cart = JSON.parse(localStorage.getItem('anime_cart')) || [];
        cart.splice(index, 1);
        localStorage.setItem('anime_cart', JSON.stringify(cart));
        renderCart();
    };

    btnCheckout.onclick = () => {
        const cart = JSON.parse(localStorage.getItem('anime_cart')) || [];
        if (cart.length === 0) {
            alert('El carrito está vacío.');
            return;
        }
        checkoutModal.style.display = 'block';
        step1.style.display = 'block';
        step2.style.display = 'none';
    };

    if (closeCheckout) {
        closeCheckout.onclick = () => {
            checkoutModal.style.display = 'none';
        };
    }

    window.setDelivery = (type) => {
        deliveryType = type;
        step1.style.display = 'none';
        step2.style.display = 'block';

        if (type === 'envio') {
            infoEnvio.style.display = 'block';
            infoLocal.style.display = 'none';
        } else {
            infoEnvio.style.display = 'none';
            infoLocal.style.display = 'block';
        }
        updatePaymentView();
        loadNequiInfo();
    };

    const updatePaymentView = () => {
        const method = paymentMethod.value;
        if (method === 'transferencia') {
            transferInfo.style.display = 'block';
            cashInfo.style.display = 'none';
        } else {
            transferInfo.style.display = 'none';
            cashInfo.style.display = 'block';
        }
    };

    paymentMethod.onchange = updatePaymentView;

    const loadNequiInfo = () => {
        const users = JSON.parse(localStorage.getItem('anime_users')) || [];
        const rootUser = users.find(u => u.role === 'root');
        if (rootUser) {
            const settings = JSON.parse(localStorage.getItem(`anime_settings_${rootUser.doc}`)) || {};
            const key = settings.nequiKey;
            if (key) {
                nequiInfoEl.textContent = `Nequi / Llave: ${key}`;
            } else {
                nequiInfoEl.textContent = 'El administrador no ha configurado Nequi.';
            }
        } else {
            nequiInfoEl.textContent = 'No se encontró un usuario administrador.';
        }
    };

    btnConfirmOrder.onclick = () => {
        const cart = JSON.parse(localStorage.getItem('anime_cart')) || [];
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const method = paymentMethod.value;

        if (method === 'transferencia') {
            const screenshot = document.getElementById('payment-screenshot').files[0];
            if (!screenshot) {
                alert('Por favor, sube la captura de pantalla del pago.');
                return;
            }
        } else if (method === 'efectivo') {
            const amount = document.getElementById('payment-cash-amount').value;
            if (!amount || amount <= 0) {
                alert('Por favor, indica con cuánto vas to pagar.');
                return;
            }
        }

        if (deliveryType === 'envio') {
            const city = document.getElementById('delivery-city').value;
            const addr = document.getElementById('delivery-address').value;
            if (!city || !addr) {
                alert('Por favor, completa los datos de envío.');
                return;
            }
        }

        // Crear el pedido
        const order = {
            id: 'ORD-' + Date.now(),
            user: currentUser ? currentUser.name : 'Invitado',
            userPhone: currentUser ? currentUser.phone : 'No disponible',
            items: cart,
            delivery: {
                type: deliveryType,
                city: document.getElementById('delivery-city').value,
                address: document.getElementById('delivery-address').value,
                reference: document.getElementById('delivery-ref').value
            },
            payment: {
                method: method,
                cashAmount: document.getElementById('payment-cash-amount').value,
                screenshot: 'Adjunta'
            },
            status: 'Pendiente',
            date: new Date().toLocaleString()
        };

        // Guardar en la lista de pedidos globales
        const allOrders = JSON.parse(localStorage.getItem('anime_orders')) || [];
        allOrders.push(order);
        localStorage.setItem('anime_orders', JSON.stringify(allOrders));

        alert('¡Tu pedido ha sido confirmado! El administrador recibirá una notificación y te contactará por WhatsApp.');
        localStorage.removeItem('anime_cart');
        checkoutModal.style.display = 'none';
        window.location.href = 'tienda.html';
    };

    renderCart();
});