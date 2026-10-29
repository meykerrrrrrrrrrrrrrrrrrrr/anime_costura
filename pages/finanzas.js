// --- Lógica de Finanzas ---
document.addEventListener('DOMContentLoaded', () => {
    // VERIFICACIÓN DE SESIÓN Y ROL
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role !== 'root') {
        window.location.href = 'auth.html';
        return;
    }

    const statIncome = document.getElementById('stat-income');
    const statExpenses = document.getElementById('stat-expenses');
    const statNet = document.getElementById('stat-net');
    const statStock = document.getElementById('stat-stock');
    const bestSellersList = document.getElementById('best-sellers-list');
    const financeTableBody = document.querySelector('#finance-table tbody');

    const addMoveBtn = document.getElementById('add-move-btn');

    // Datos simulados para ventas (en un sistema real vendrían de una DB)
    let salesData = JSON.parse(localStorage.getItem('anime_sales')) || [
        { product: 'Naruto Uzumaki Tee', qty: 15 },
        { product: 'One Piece Hoodie', qty: 8 },
        { product: 'Attack on Titan Cap', qty: 20 },
    ];

    let financeLogs = JSON.parse(localStorage.getItem('anime_finance_logs')) || [
        { desc: 'Venta Inicial', type: 'income', amount: 500 },
        { desc: 'Compra de Telas', type: 'expense', amount: 200 },
    ];

    function getInventoryCount() {
        const inv = window.AnimeStorage ? window.AnimeStorage.getInventory() : (JSON.parse(localStorage.getItem('anime_inventory')) || []);
        return inv.length;
    }

    function calculateStats() {
        let totalIncome = 0;
        let totalExpenses = 0;

        financeLogs.forEach(log => {
            if (log.type === 'income') totalIncome += parseFloat(log.amount);
            else totalExpenses += parseFloat(log.amount);
        });

        statIncome.textContent = `$${totalIncome.toFixed(2)}`;
        statExpenses.textContent = `$${totalExpenses.toFixed(2)}`;
        statNet.textContent = `$${(totalIncome - totalExpenses).toFixed(2)}`;
        statStock.textContent = getInventoryCount();
    }

    function renderBestSellers() {
        bestSellersList.innerHTML = '';
        // Ordenar por cantidad descendente
        const sorted = [...salesData].sort((a, b) => b.qty - a.qty);

        sorted.forEach(item => {
            bestSellersList.innerHTML += `<li><span>${item.product}</span> <strong>${item.qty} vendidas</strong></li>`;
        });
    }

    function renderLogs() {
        financeTableBody.innerHTML = '';
        financeLogs.forEach(log => {
            financeTableBody.innerHTML += `
                <tr>
                    <td>${log.desc}</td>
                    <td style="color: ${log.type === 'income' ? '#2ecc71' : '#e74c3c'}">${log.type === 'income' ? 'Ingreso' : 'Egreso'}</td>
                    <td>$${parseFloat(log.amount).toFixed(2)}</td>
                </tr>
            `;
        });
    }

    addMoveBtn.addEventListener('click', () => {
        const desc = document.getElementById('move-desc').value;
        const amount = document.getElementById('move-amount').value;
        const type = document.getElementById('move-type').value;

        if (desc && amount) {
            financeLogs.push({ desc, amount: parseFloat(amount), type });
            localStorage.setItem('anime_finance_logs', JSON.stringify(financeLogs));

            calculateStats();
            renderLogs();

            document.getElementById('move-desc').value = '';
            document.getElementById('move-amount').value = '';
        }
    });

    // Inicialización
    calculateStats();
    renderBestSellers();
    renderLogs();
});