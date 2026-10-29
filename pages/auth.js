// --- Lógica de Autenticación y Perfiles ---
document.addEventListener('DOMContentLoaded', () => {
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // Alternar entre Login y Registro
    tabLogin.onclick = () => {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
    };

    tabRegister.onclick = () => {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
    };

    // Registro de Usuario
    registerForm.onsubmit = (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const doc = document.getElementById('reg-doc').value;
        const whatsapp = document.getElementById('reg-whatsapp').value;
        const pass = document.getElementById('reg-pass').value;

        const users = JSON.parse(localStorage.getItem('anime_users')) || [];
        if (users.find(u => u.doc === doc)) {
            alert('Este documento ya está registrado.');
            return;
        }

        const newUser = {
            name,
            doc,
            whatsapp,
            pass,
            role: 'user',
            credits: 0,
            purchases: 0,
            status: 'Nuevo' // Nuevo -> Casual -> Reconocido
        };

        users.push(newUser);
        localStorage.setItem('anime_users', JSON.stringify(users));
        alert('Registro exitoso. Ahora puedes iniciar sesión.');
        tabLogin.click();
    };

    // Login de Usuario
    loginForm.onsubmit = (e) => {
        e.preventDefault();
        const doc = document.getElementById('login-doc').value;
        const pass = document.getElementById('login-pass').value;

        // Caso especial: Usuario ROOT
        if (doc === 'root' && pass === '326247878') {
            localStorage.setItem('currentUser', JSON.stringify({
                name: 'Administrador ROOT',
                doc: 'root',
                role: 'root',
                credits: 9999,
                status: 'Administrador'
            }));
            window.location.href = '../index.html';
            return;
        }

        const users = JSON.parse(localStorage.getItem('anime_users')) || [];
        const user = users.find(u => u.doc === doc && u.pass === pass);

        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            window.location.href = '../index.html';
        } else {
            alert('Documento o contraseña incorrectos.');
        }
    };

    window.autoLoginRoot = () => {
        localStorage.setItem('currentUser', JSON.stringify({
            name: 'Administrador ROOT',
            doc: 'root',
            role: 'root',
            credits: 9999,
            status: 'Administrador'
        }));
        alert('Sesión iniciada como Administrador ROOT');
        window.location.href = 'inventario.html';
    };
});