document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('currentUser'));

    if (!user) {
        window.location.href = 'auth.html';
        return;
    }

    // Llenar datos del perfil
    document.getElementById('user-name').textContent = user.name;
    document.getElementById('user-credits').textContent = user.credits || 0;
    document.getElementById('user-purchases').textContent = user.purchases || 0;
    document.getElementById('user-level').textContent = user.status || 'Nuevo';
    document.getElementById('user-status').textContent = user.role === 'root' ? 'ADMINISTRADOR ROOT' : 'CLIENTE';

    // Beneficios según nivel
    const benefits = document.getElementById('user-benefits');
    if (user.role === 'root') {
        benefits.textContent = 'Acceso Total + Créditos Infinitos';
    } else if (user.status === 'Reconocido') {
        benefits.textContent = 'Prioridad de Atención + Bonos de Descuento';
    } else if (user.status === 'Casual') {
        benefits.textContent = 'Descuento en segunda compra';
    } else {
        benefits.textContent = 'Básico';
    }

    // --- Personalización del Perfil ---

    const avatarEl = document.getElementById('user-avatar');
    const bannerContainer = document.getElementById('banner-container');
    const colorInput = document.getElementById('profile-color');
    const bannerPosInput = document.getElementById('banner-position');
    const editPanel = document.getElementById('edit-panel');

    const fullBgVideo = document.getElementById('full-page-bg-video');
    const fullBgImg = document.getElementById('full-page-bg-img');

    // Función para alternar modo edición
    window.toggleEditMode = () => {
        const isVisible = editPanel.style.display === 'block';
        editPanel.style.display = isVisible ? 'none' : 'block';
    };

    // Cargar personalizaciones guardadas
    const loadCustomizations = () => {
        const userSettings = JSON.parse(localStorage.getItem(`anime_settings_${user.doc}`)) || {};

        // Cargar Avatar
        if (userSettings.avatar) {
            avatarEl.innerHTML = `<img src="${userSettings.avatar}" style="width:100%; height:100%; object-fit:cover;">`;
        } else {
            avatarEl.textContent = user.name.charAt(0).toUpperCase();
        }

        // 1. Barra Superior (Banner)
        const bannerData = userSettings.banner || '../assets/media/marin.jpg';
        const bannerType = userSettings.bannerType || 'image';
        const position = userSettings.bannerPosition || 'center';

        bannerContainer.innerHTML = `<div class="banner-overlay"></div>`;
        if (bannerData) {
            if (bannerType === 'video') {
                bannerContainer.innerHTML = `<div class="banner-overlay"></div><video src="${bannerData}" autoplay muted loop playsinline style="width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0; z-index:1; object-position: ${position};"></video>`;
            } else {
                bannerContainer.innerHTML = `<div class="banner-overlay"></div><img src="${bannerData}" style="width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0; z-index:1; object-position: ${position};">`;
            }
        }

        // 2. Fondo de Pantalla Completa
        const fullBgData = userSettings.fullBg || '../assets/media/video-hero.mp4';
        const fullBgType = userSettings.fullBgType || 'video';
        fullBgVideo.style.display = 'none';
        fullBgImg.style.display = 'none';

        if (fullBgData) {
            if (fullBgType === 'video') {
                fullBgVideo.src = fullBgData;
                fullBgVideo.style.display = 'block';
                fullBgVideo.muted = true;
                fullBgVideo.defaultMuted = true;
                fullBgVideo.loop = true;
                fullBgVideo.playsInline = true;
                fullBgVideo.setAttribute('muted', '');
                fullBgVideo.setAttribute('playsinline', '');
                fullBgVideo.setAttribute('webkit-playsinline', '');
                fullBgVideo.setAttribute('preload', 'auto');
                fullBgVideo.style.objectPosition = position;
                fullBgVideo.play().catch(e => console.log("Autoplay prevented: ", e));
            } else {
                fullBgImg.src = fullBgData;
                fullBgImg.style.display = 'block';
                fullBgImg.style.objectPosition = position;
            }
        }

        // Cargar Color
        if (userSettings.themeColor) {
            document.documentElement.style.setProperty('--primary', userSettings.themeColor);
            colorInput.value = userSettings.themeColor;
        }

        // Cargar Posición
        if (userSettings.bannerPosition) {
            bannerPosInput.value = userSettings.bannerPosition;
        }
    };

    // Aplicar Preajustes Oficiales Anime
    window.applyAnimePreset = (key) => {
        const userSettings = JSON.parse(localStorage.getItem(`anime_settings_${user.doc}`)) || {};
        if (key === 'video1') {
            userSettings.fullBg = '../assets/media/video-hero.mp4';
            userSettings.fullBgType = 'video';
        } else if (key === 'video2') {
            userSettings.fullBg = '../assets/media/video-secondary.mp4';
            userSettings.fullBgType = 'video';
        } else if (key === 'marin') {
            userSettings.banner = '../assets/media/marin.jpg';
            userSettings.bannerType = 'image';
            userSettings.themeColor = '#e84393';
        } else if (key === 'musashi') {
            userSettings.banner = '../assets/media/musashi.jpg';
            userSettings.bannerType = 'image';
            userSettings.themeColor = '#e17055';
        } else if (key === 'noir') {
            userSettings.fullBg = '../assets/media/wallpaper-bw.jpg';
            userSettings.fullBgType = 'image';
            userSettings.themeColor = '#2d3436';
        }
        localStorage.setItem(`anime_settings_${user.doc}`, JSON.stringify(userSettings));
        loadCustomizations();
    };

    // Función para guardar ajustes generales
    const saveAllSettings = () => {
        const userSettings = JSON.parse(localStorage.getItem(`anime_settings_${user.doc}`)) || {};
        userSettings.themeColor = colorInput.value;
        userSettings.bannerPosition = bannerPosInput.value;
        localStorage.setItem(`anime_settings_${user.doc}`, JSON.stringify(userSettings));
        loadCustomizations();
        editPanel.style.display = 'none';
    };

    // Guardar archivos inmediatamente al seleccionar
    const saveFileSetting = (key, value, typeKey, typeValue) => {
        const userSettings = JSON.parse(localStorage.getItem(`anime_settings_${user.doc}`)) || {};
        userSettings[key] = value;
        userSettings[typeKey] = typeValue;
        localStorage.setItem(`anime_settings_${user.doc}`, JSON.stringify(userSettings));
        loadCustomizations();
    };

    // Evento Avatar
    document.getElementById('upload-avatar').onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const userSettings = JSON.parse(localStorage.getItem(`anime_settings_${user.doc}`)) || {};
                userSettings.avatar = ev.target.result;
                localStorage.setItem(`anime_settings_${user.doc}`, JSON.stringify(userSettings));
                loadCustomizations();
            };
            reader.readAsDataURL(file);
        }
    };

    // Evento Barra Superior
    document.getElementById('upload-banner').onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const type = file.type.startsWith('video') ? 'video' : 'image';
            const reader = new FileReader();
            reader.onload = (ev) => saveFileSetting('banner', ev.target.result, 'bannerType', type);
            reader.readAsDataURL(file);
        }
    };

    // Evento Fondo Completo
    document.getElementById('upload-full-bg').onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const type = file.type.startsWith('video') ? 'video' : 'image';
            const reader = new FileReader();
            reader.onload = (ev) => saveFileSetting('fullBg', ev.target.result, 'fullBgType', type);
            reader.readAsDataURL(file);
        }
    };

    document.getElementById('btn-save-profile').onclick = saveAllSettings;
    loadCustomizations();

    document.getElementById('btn-logout').onclick = () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'auth.html';
    };
});