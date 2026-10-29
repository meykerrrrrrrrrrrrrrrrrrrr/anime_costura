// --- Lógica Global de Navegación y Roles ---
function handleNavigationRoles() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const isRoot = currentUser && currentUser.role === 'root';

    // Buscamos todos los enlaces que llevan a inventario, finanzas o diseño pro
    const adminLinks = document.querySelectorAll('a[href*="inventario.html"], a[href*="finanzas.html"], a[href*="diseno.html"]');

    adminLinks.forEach(link => {
        if (!isRoot) {
            // Si no es root, eliminamos el elemento de la lista (li) para que desaparezca el botón
            const listItem = link.closest('li');
            if (listItem) {
                listItem.style.display = 'none';
            }
        }
    });
}

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    handleNavigationRoles();
});
