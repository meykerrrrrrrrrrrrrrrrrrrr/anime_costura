// ====================================================================
// STORAGE.JS - MOTOR DE ALMACENAMIENTO INFINITO (IndexedDB)
// Sincronización Automática en Tiempo Real (PC <-> Móvil)
// Soporte Apple Dark Design System & Vercel Serverless
// ====================================================================

const AnimeStorage = {
    dbName: 'AnimeCostura_DB',
    dbVersion: 3,
    storeName: 'store',
    db: null,
    cache: {},
    readyPromise: null,
    listeners: [],
    isRevalidating: false,

    // Detectar si la página actual está dentro de la subcarpeta /pages/
    isInPagesFolder() {
        return window.location.pathname.includes('/pages/') || window.location.href.includes('/pages/');
    },

    // Obtener la ruta base relativa al archivo o endpoint
    getRelativePath(target) {
        return this.isInPagesFolder() ? `../${target}` : target;
    },

    // Formatear rutas de imágenes para que funcionen tanto en la raíz como en /pages/
    formatImagePath(path) {
        if (!path || typeof path !== 'string') {
            return this.isInPagesFolder() ? '../assets/media/marin.jpg' : 'assets/media/marin.jpg';
        }

        // Si es Base64, URL externa o blob, se mantiene exactamente igual
        if (path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) {
            return path;
        }

        const inPages = this.isInPagesFolder();
        if (inPages) {
            if (path.startsWith('../assets/')) return path;
            if (path.startsWith('assets/')) return '../' + path;
            return path;
        } else {
            if (path.startsWith('../assets/')) return path.replace(/^\.\.\//, '');
            return path;
        }
    },

    // Promesa de disponibilidad para evitar condiciones de carrera (Race Conditions)
    ready() {
        if (this.readyPromise) return this.readyPromise;
        return this.init();
    },

    // Inicialización del motor IndexedDB
    init() {
        if (this.readyPromise) return this.readyPromise;

        this.readyPromise = new Promise((resolve) => {
            // 1. Cargar primero de localStorage a memoria para disponibilidad inmediata
            this.loadFromLocalStorage();

            if (!window.indexedDB) {
                console.warn("[AnimeStorage] IndexedDB no soportado. Usando fallback en memoria y servidor.");
                this.autoRevalidateServer().then(() => resolve(true));
                return;
            }

            const req = indexedDB.open(this.dbName, this.dbVersion);

            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };

            req.onsuccess = async (e) => {
                this.db = e.target.result;
                await this.syncFromDB();
                // Revalidar en segundo plano contra el servidor / Vercel API
                this.autoRevalidateServer().finally(() => {
                    resolve(true);
                });
            };

            req.onerror = (e) => {
                console.warn("[AnimeStorage] Error al abrir IndexedDB:", e);
                this.autoRevalidateServer().then(() => resolve(true));
            };
        });

        // Revalidar automáticamente cuando el usuario regresa a la pestaña o app en su móvil
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    this.autoRevalidateServer();
                }
            });
            window.addEventListener('pageshow', () => {
                this.autoRevalidateServer();
            });
        }

        return this.readyPromise;
    },

    loadFromLocalStorage() {
        try {
            const raw = localStorage.getItem('anime_inventory');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    this.cache['anime_inventory'] = parsed;
                }
            }
        } catch (e) {
            // Ignorar errores de cuota o parseo
        }
    },

    async syncFromDB() {
        return new Promise(async (resolve) => {
            if (!this.db) return resolve();
            try {
                const tx = this.db.transaction(this.storeName, 'readonly');
                const os = tx.objectStore(this.storeName);
                const req = os.get('anime_inventory');

                req.onsuccess = async () => {
                    if (req.result && Array.isArray(req.result) && req.result.length > 0) {
                        this.cache['anime_inventory'] = req.result;
                        this.notifyUpdate();
                        resolve();
                    } else if (this.cache['anime_inventory'] && this.cache['anime_inventory'].length > 0) {
                        await this.setInDB('anime_inventory', this.cache['anime_inventory']);
                        resolve();
                    } else {
                        await this.fetchBaseFromJSON();
                        resolve();
                    }
                };

                req.onerror = () => resolve();
            } catch (err) {
                resolve();
            }
        });
    },

    // Cargar data/inventory.json con evasión de caché estricta para móviles
    async fetchBaseFromJSON() {
        try {
            const jsonPath = this.getRelativePath('data/inventory.json');
            const res = await fetch(jsonPath + '?t=' + Date.now(), {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
            });

            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    this.cache['anime_inventory'] = data;
                    await this.setInDB('anime_inventory', data);
                    try { localStorage.setItem('anime_inventory', JSON.stringify(data)); } catch(e){}
                    this.notifyUpdate();
                    return data;
                }
            }
        } catch (e) {
            console.warn('[AnimeStorage] Error cargando data/inventory.json:', e);
        }

        return this.cache['anime_inventory'] || [];
    },

    // Revalidación inteligente en tiempo real: consulta Vercel API o data/inventory.json
    async autoRevalidateServer() {
        if (this.isRevalidating) return this.getInventory();
        this.isRevalidating = true;

        try {
            // 1. Intentar endpoint de API de Vercel /api/inventory
            const apiPath = this.getRelativePath('api/inventory');
            try {
                const apiRes = await fetch(apiPath + '?v=' + Date.now(), {
                    cache: 'no-store',
                    headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
                });

                if (apiRes.ok) {
                    const serverData = await apiRes.json();
                    if (Array.isArray(serverData) && serverData.length > 0) {
                        const current = this.getInventory();
                        // Si hay cambios en cantidad o contenido, actualizar
                        if (serverData.length !== current.length || JSON.stringify(serverData.map(p=>p.id)) !== JSON.stringify(current.map(p=>p.id))) {
                            this.cache['anime_inventory'] = serverData;
                            await this.setInDB('anime_inventory', serverData);
                            try { localStorage.setItem('anime_inventory', JSON.stringify(serverData)); } catch(e){}
                            this.notifyUpdate();
                            return serverData;
                        }
                    }
                }
            } catch (apiErr) {
                // Si la API no está montada o estamos en un host estático, continuar con el JSON
            }

            // 2. Consulta de data/inventory.json
            const jsonPath = this.getRelativePath('data/inventory.json');
            const res = await fetch(jsonPath + '?v=' + Date.now(), {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
            });

            if (res.ok) {
                const serverData = await res.json();
                if (Array.isArray(serverData) && serverData.length > 0) {
                    const currentLocal = this.getInventory();
                    // Si el servidor tiene datos y nuestro local está vacío o tiene IDs distintos
                    if (currentLocal.length === 0 || serverData.length !== currentLocal.length || JSON.stringify(serverData.map(p=>p.id)) !== JSON.stringify(currentLocal.map(p=>p.id))) {
                        console.log("[AnimeStorage] 🔄 Catálogo actualizado recibido desde el servidor.");
                        this.cache['anime_inventory'] = serverData;
                        await this.setInDB('anime_inventory', serverData);
                        try { localStorage.setItem('anime_inventory', JSON.stringify(serverData)); } catch(e){}
                        this.notifyUpdate();
                        return serverData;
                    }
                }
            }
        } catch (e) {
            // Ignorar errores de red temporales
        } finally {
            this.isRevalidating = false;
        }

        return this.getInventory();
    },

    setInDB(key, value) {
        return new Promise((resolve) => {
            if (!this.db) return resolve(false);
            try {
                const tx = this.db.transaction(this.storeName, 'readwrite');
                const os = tx.objectStore(this.storeName);
                const req = os.put(value, key);
                req.onsuccess = () => resolve(true);
                req.onerror = () => resolve(false);
            } catch (e) {
                resolve(false);
            }
        });
    },

    // Catálogo inicial vacío si no hay datos
    getBaseInventory() {
        return [];
    },

    // Obtener inventario de forma síncrona inmediata
    getInventory() {
        if (this.cache['anime_inventory'] && Array.isArray(this.cache['anime_inventory'])) {
            return this.cache['anime_inventory'];
        }

        try {
            const raw = localStorage.getItem('anime_inventory');
            if (raw !== null) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    this.cache['anime_inventory'] = parsed;
                    return parsed;
                }
            }
        } catch (e) {}

        return [];
    },

    // Guardar inventario con almacenamiento ilimitado y sincronización automática
    async saveInventory(data) {
        if (!Array.isArray(data)) return false;

        this.cache['anime_inventory'] = data;

        // 1. Guardar en IndexedDB local (capacidad ilimitada de gigabytes)
        await this.setInDB('anime_inventory', data);

        // 2. Guardar en localStorage (de forma segura, ignorando errores de cuota de 5MB)
        try {
            localStorage.setItem('anime_inventory', JSON.stringify(data));
        } catch (e) {
            // Si la cuota de localStorage se excede debido a fotos HD en base64, IndexedDB lo respalda
        }

        // 3. Notificar a las pantallas abiertas localmente
        this.notifyUpdate();

        // 4. Intentar guardar en la API de Vercel / servidor en segundo plano
        try {
            const apiPath = this.getRelativePath('api/inventory');
            fetch(apiPath, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            }).catch(() => {});
        } catch (err) {}

        return true;
    },

    // Notificar cambios para auto-recargar cualquier pantalla abierta
    notifyUpdate() {
        window.dispatchEvent(new CustomEvent('animeInventoryUpdated', {
            detail: this.cache['anime_inventory'] || []
        }));
    },

    // Exportar catálogo completo en un archivo inventory.json
    exportInventory() {
        const data = this.getInventory();
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'inventory.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    // Importar catálogo JSON subido por el usuario
    importInventory(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (Array.isArray(data)) {
                        await this.saveInventory(data);
                        resolve(data);
                    } else {
                        reject(new Error("El archivo no contiene un catálogo válido."));
                    }
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    },

    // Forzar sincronización fresca directa desde el servidor
    async syncFromServer() {
        return await this.autoRevalidateServer();
    }
};

// Iniciar automáticamente
AnimeStorage.init();

// Exportar al ámbito global para compatibilidad total
window.AnimeStorage = AnimeStorage;
window.getInventory = () => AnimeStorage.getInventory();
window.saveInventory = (data) => AnimeStorage.saveInventory(data);
window.formatImagePath = (path) => AnimeStorage.formatImagePath(path);
