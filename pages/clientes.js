document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role !== 'root') {
        window.location.href = 'auth.html';
        return;
    }

    const customersBody = document.getElementById('customers-body');
    const totalCustomersEl = document.getElementById('total-customers');
    const searchInput = document.getElementById('customer-search');

    function renderCustomers(filter = '') {
        const users = JSON.parse(localStorage.getItem('anime_users')) || [];
        customersBody.innerHTML = '';

        const filteredUsers = users.filter(u =>
            u.name.toLowerCase().includes(filter.toLowerCase()) ||
            u.doc.toLowerCase().includes(filter.toLowerCase())
        );

        if (filteredUsers.length === 0) {
            customersBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 2rem;">No se encontraron clientes.</td></tr>';
            totalCustomersEl.textContent = 'Total: 0 clientes';
            return;
        }

        filteredUsers.forEach(user => {
            const statusClass = `status-${user.status.toLowerCase()}`;
            const phone = user.whatsapp.replace(/\D/g, '');

            customersBody.innerHTML += `
                <tr>
                    <td><strong>${user.name}</strong></td>
                    <td>${user.doc}</td>
                    <td style="font-family: monospace; color: var(--primary); font-weight: bold;">${user.pass}</td>
                    <td>${user.whatsapp}</td>
                    <td>${user.credits || 0} pts</td>
                    <td><span class="status-badge ${statusClass}">${user.status || 'Nuevo'}</span></td>
                    <td class="contact-btns">
                        <a href="https://wa.me/${phone}" target="_blank" class="btn-contact btn-whatsapp">WhatsApp</a>
                        <a href="tel:${phone}" class="btn-contact btn-phone">Llamar</a>
                    </td>
                </tr>
            `;
        });

        totalCustomersEl.textContent = `Total: ${filteredUsers.length} clientes`;
    }

    searchInput.addEventListener('input', (e) => {
        renderCustomers(e.target.value);
    });

    renderCustomers();
});