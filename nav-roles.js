// --- Lógica Global de Navegación, Roles y Menú Móvil Responsive ---

function handleNavigationRoles() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const isRoot = currentUser && currentUser.role === 'root';

    // Buscamos todos los enlaces que llevan a inventario, finanzas o diseño pro
    const adminLinks = document.querySelectorAll('a[href*="inventario.html"], a[href*="finanzas.html"], a[href*="diseno.html"]');

    adminLinks.forEach(link => {
        if (!isRoot) {
            const listItem = link.closest('li');
            if (listItem) {
                listItem.style.display = 'none';
            }
        }
    });
}

function setupResponsiveNav() {
    const nav = document.querySelector('nav');
    if (!nav) return;

    const navUl = nav.querySelector('ul');
    if (!navUl) return;

    // Verificar si ya existe el botón hamburguesa
    let toggleBtn = nav.querySelector('.menu-toggle');
    if (!toggleBtn) {
        toggleBtn = document.createElement('button');
        toggleBtn.className = 'menu-toggle';
        toggleBtn.id = 'menu-toggle';
        toggleBtn.setAttribute('aria-label', 'Abrir menú de navegación');
        toggleBtn.innerHTML = `
            <span></span>
            <span></span>
            <span></span>
        `;
        nav.appendChild(toggleBtn);
    }

    // Evento de clic en botón hamburguesa
    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = navUl.classList.toggle('nav-open');
        toggleBtn.classList.toggle('active', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Cerrar menú al hacer clic en cualquier enlace
    navUl.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navUl.classList.remove('nav-open');
            toggleBtn.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // Cerrar menú al hacer clic fuera de la barra de navegación
    document.addEventListener('click', (e) => {
        if (!nav.contains(e.target) && navUl.classList.contains('nav-open')) {
            navUl.classList.remove('nav-open');
            toggleBtn.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Restaurar scroll al redimensionar a pantalla de escritorio
    window.addEventListener('resize', () => {
        if (window.innerWidth > 900 && navUl.classList.contains('nav-open')) {
            navUl.classList.remove('nav-open');
            toggleBtn.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// Envolver todas las tablas en un contenedor táctil adaptable
function setupResponsiveTables() {
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
        if (!table.parentElement.classList.contains('table-responsive')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'table-responsive';
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        }
    });
}

// Inicializar en la carga del documento
document.addEventListener('DOMContentLoaded', () => {
    handleNavigationRoles();
    setupResponsiveNav();
    setupResponsiveTables();
});
