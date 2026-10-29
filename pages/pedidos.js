document.addEventListener('DOMContentLoaded', () => {
    const ordersList = document.getElementById('orders-list');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (!currentUser || currentUser.role !== 'root') {
        alert('Acceso restringido. Solo el administrador puede gestionar pedidos.');
        window.location.href = '../index.html';
        return;
    }

    function renderOrders() {
        const orders = JSON.parse(localStorage.getItem('anime_orders')) || [];
        ordersList.innerHTML = '';

        if (orders.length === 0) {
            ordersList.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">No hay pedidos recibidos aún. 📦</p>';
            return;
        }

        orders.forEach((order, index) => {
            const card = document.createElement('div');
            card.className = 'order-card';

            // Calcular total del pedido
            let orderTotal = 0;
            const itemsHtml = order.items.map(item => {
                const inventory = window.AnimeStorage ? window.AnimeStorage.getInventory() : (JSON.parse(localStorage.getItem('anime_inventory')) || []);
                const prodData = inventory.find(p => p.id == item.productId);
                const rawImg = (prodData && prodData.img && prodData.img[0]) ? prodData.img[0] : (item.img || '../assets/media/marin.jpg');
                const imgUrl = window.formatImagePath ? window.formatImagePath(rawImg) : rawImg;

                let itemSum = 0;
                const details = item.details.map(d => {
                    itemSum += d.quantity * parseFloat(item.price);
                    return `${d.size} (x${d.quantity})`;
                }).join(', ');

                orderTotal += itemSum;

                return `
                    <div class="item-row">
                        <img src="${imgUrl}" class="item-img">
                        <span><strong>${item.name}</strong> - ${details}</span>
                    </div>
                `;
            }).join('');

            const statusClass = order.status === 'Pendiente' ? 'status-pendiente' : 'status-confirmado';

            card.innerHTML = `
                <div class="order-header">
                    <span class="order-id">${order.id}</span>
                    <span class="order-status ${statusClass}">${order.status}</span>
                </div>
                <div class="order-items">
                    ${itemsHtml}
                    <p style="text-align:right; font-weight:bold; margin-top:0.5rem;">Total: $${orderTotal.toFixed(2)}</p>
                </div>
                <div class="order-details">
                    <p><strong>Cliente:</strong> ${order.user}</p>
                    <p><strong>Teléfono:</strong> ${order.userPhone}</p>
                    <p><strong>Entrega:</strong> ${order.delivery.type === 'envio' ? 'Envío' : 'Local'}</p>
                    ${order.delivery.type === 'envio' ? `<p><strong>Destino:</strong> ${order.delivery.city}, ${order.delivery.address}</p>` : ''}
                    <p><strong>Pago:</strong> ${order.payment.method} ${order.payment.cashAmount ? `(Paga con: $${order.payment.cashAmount})` : ''}</p>
                    <p><strong>Fecha:</strong> ${order.date}</p>
                </div>
                ${order.status === 'Pendiente' ? `<button class="btn-confirm" onclick="confirmOrder(${index})">Confirmar y Notificar</button>` : ''}
                <a href="${generateWhatsAppLink(order)}" target="_blank" class="btn-whatsapp">Notificar por WhatsApp ✅</a>
            `;
            ordersList.appendChild(card);
        });
    }

    window.confirmOrder = (index) => {
        const orders = JSON.parse(localStorage.getItem('anime_orders')) || [];
        orders[index].status = 'Confirmado';
        localStorage.setItem('anime_orders', JSON.stringify(orders));
        renderOrders();
    };

    function generateWhatsAppLink(order) {
        const phone = order.userPhone.replace(/\D/g, '');
        const message = `Hola ${order.user}! 👋 Tu pedido ${order.id} en *AnimeCostura* ha sido CONFIRMADO. ✅\n\n📦 *Estado:* Atendido\n⏳ *Tiempo estimado de entrega:* 2 a 5 días hábiles.\n\n¡Gracias por tu compra! ✨`;
        return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    }

    renderOrders();
});