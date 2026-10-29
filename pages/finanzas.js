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

    // Registros financieros limpios (sin datos demo)
    let salesData = JSON.parse(localStorage.getItem('anime_sales')) || [];
    let financeLogs = JSON.parse(localStorage.getItem('anime_finance_logs')) || [];

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
        if (salesData.length === 0) {
            bestSellersList.innerHTML = '<li style="padding: 1rem; color: #888; text-align: center;">No hay ventas registradas aún.</li>';
            return;
        }
        const sorted = [...salesData].sort((a, b) => b.qty - a.qty);
        sorted.forEach(item => {
            bestSellersList.innerHTML += `<li><span>${item.product}</span> <strong>${item.qty} vendidas</strong></li>`;
        });
    }

    function renderLogs() {
        financeTableBody.innerHTML = '';
        if (financeLogs.length === 0) {
            financeTableBody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 2rem; color: #888;">No hay movimientos registrados aún.</td></tr>';
            return;
        }
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