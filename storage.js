// ====================================================================
// STORAGE.JS - MOTOR DE ALMACENAMIENTO INFINITO (IndexedDB)
// Con Sincronización Automática Servidor / Móvil en Tiempo Real
// ====================================================================

const AnimeStorage = {
    dbName: 'AnimeCostura_DB',
    dbVersion: 2,
    storeName: 'store',
    db: null,
    cache: {},
    readyPromise: null,
    listeners: [],

    // Detectar si la página actual está dentro de la carpeta /pages/
    isInPagesFolder() {
        return window.location.pathname.includes('/pages/') || window.location.href.includes('/pages/');
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

    // Inicialización del motor IndexedDB
    init() {
        if (this.readyPromise) return this.readyPromise;

        // Limpieza de datos antiguos y preservación exclusiva de la cuenta ROOT
        this.applyCleanStateReset();

        this.readyPromise = new Promise((resolve) => {
            this.loadFromLocalStorage();

            if (!window.indexedDB) {
                console.warn("[AnimeStorage] IndexedDB no soportado en este navegador. Usando localStorage.");
                this.autoRevalidateServer();
                resolve(false);
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
                // Revalidar en segundo plano contra el servidor sin bloquear
                this.autoRevalidateServer();
                resolve(true);
            };

            req.onerror = (e) => {
                console.warn("[AnimeStorage] Error al abrir IndexedDB:", e);
                this.autoRevalidateServer();
                resolve(false);
            };
        });

        // Revalidar automáticamente cuando el usuario regresa a la pestaña en su móvil
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    this.autoRevalidateServer();
                }
            });
        }

        return this.readyPromise;
    },

    // Borrado definitivo de bases de datos demo, dejando únicamente la cuenta ROOT
    applyCleanStateReset() {
        const CLEAN_KEY = 'anime_db_cleaned_v5';
        if (!localStorage.getItem(CLEAN_KEY)) {
            // Eliminar registros de productos antiguos
            localStorage.removeItem('anime_inventory');
            localStorage.removeItem('anime_sales');
            localStorage.removeItem('anime_finance_logs');
            localStorage.removeItem('anime_orders');
            localStorage.removeItem('anime_cart');

            // Dejar exclusivamente la cuenta ROOT
            const rootAccount = {
                name: 'Administrador ROOT',
                doc: 'root',
                pass: '326247878',
                whatsapp: '573000000000',
                role: 'root',
                credits: 9999,
                status: 'Administrador'
            };

            localStorage.setItem('anime_users', JSON.stringify([rootAccount]));
            localStorage.setItem('currentUser', JSON.stringify(rootAccount));

            // Marcar limpieza realizada
            localStorage.setItem(CLEAN_KEY, 'true');
            console.log("[AnimeStorage] Base de datos restablecida a estado limpio. Solo cuenta ROOT activa.");
        }
    },

    loadFromLocalStorage() {
        try {
            const raw = localStorage.getItem('anime_inventory');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    this.cache['anime_inventory'] = parsed;
                }
            }
        } catch (e) {}
    },

    async syncFromDB() {
        return new Promise(async (resolve) => {
            if (!this.db) return resolve();
            try {
                const tx = this.db.transaction(this.storeName, 'readonly');
                const os = tx.objectStore(this.storeName);
                const req = os.get('anime_inventory');

                req.onsuccess = async () => {
                    if (req.result && Array.isArray(req.result)) {
                        this.cache['anime_inventory'] = req.result;
                        this.notifyUpdate();
                        resolve();
                    } else if (this.cache['anime_inventory']) {
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

    // Cargar data/inventory.json con evasión de caché para móviles (cache: 'no-store')
    async fetchBaseFromJSON() {
        try {
            const jsonPath = this.isInPagesFolder() ? '../data/inventory.json' : 'data/inventory.json';
            const res = await fetch(jsonPath + '?t=' + Date.now(), {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
            });

            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    this.cache['anime_inventory'] = data;
                    await this.setInDB('anime_inventory', data);
                    try { localStorage.setItem('anime_inventory', JSON.stringify(data)); } catch(e){}
                    this.notifyUpdate();
                    return data;
                }
            }
        } catch (e) {
            // Ignorado en entorno local sin servidor
        }

        const base = this.getBaseInventory(); // Base vacía []
        this.cache['anime_inventory'] = base;
        await this.setInDB('anime_inventory', base);
        return base;
    },

    // Revalidación inteligente de catálogo en segundo plano
    // Resuelve el problema de que el móvil no se actualice al cambiar productos en el PC
    async autoRevalidateServer() {
        try {
            const jsonPath = this.isInPagesFolder() ? '../data/inventory.json' : 'data/inventory.json';
            const res = await fetch(jsonPath + '?v=' + Date.now(), {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' }
            });

            if (res.ok) {
                const serverData = await res.json();
                if (Array.isArray(serverData)) {
                    const currentLocal = this.getInventory();
                    // Comparar si el servidor tiene cambios respecto a la copia local
                    if (JSON.stringify(serverData) !== JSON.stringify(currentLocal)) {
                        console.log("[AnimeStorage] Catálogo actualizado detectado desde el servidor. Sincronizando dispositivo...");
                        this.cache['anime_inventory'] = serverData;
                        await this.setInDB('anime_inventory', serverData);
                        try { localStorage.setItem('anime_inventory', JSON.stringify(serverData)); } catch(e){}
                        this.notifyUpdate();
                    }
                }
            }
        } catch (e) {}
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

    // Catálogo inicial limpio: base de datos completamente vacía
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

        const base = this.getBaseInventory();
        this.cache['anime_inventory'] = base;
        return base;
    },

    // Guardar inventario de forma ilimitada y sincronizada
    saveInventory(data) {
        if (!Array.isArray(data)) return false;

        this.cache['anime_inventory'] = data;

        // 1. Guardar en IndexedDB
        this.setInDB('anime_inventory', data);

        // 2. Guardar en localStorage
        try {
            localStorage.setItem('anime_inventory', JSON.stringify(data));
        } catch (e) {}

        this.notifyUpdate();
        return true;
    },

    // Notificar cambios para auto-recargar cualquier pantalla abierta
    notifyUpdate() {
        window.dispatchEvent(new CustomEvent('animeInventoryUpdated', {
            detail: this.cache['anime_inventory']
        }));
    },

    // Exportar catálogo completo en un archivo inventory.json listo para subir a GitHub / Vercel
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
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (Array.isArray(data)) {
                        this.saveInventory(data);
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
        const jsonPath = this.isInPagesFolder() ? '../data/inventory.json' : 'data/inventory.json';
        const res = await fetch(jsonPath + '?force=' + Date.now(), {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache, no-store' }
        });
        if (!res.ok) throw new Error("No se pudo obtener el archivo desde el servidor.");
        const data = await res.json();
        if (Array.isArray(data)) {
            this.saveInventory(data);
            return data;
        }
        throw new Error("Formato inválido del servidor.");
    }
};

// Iniciar automáticamente
AnimeStorage.init();

// Exportar al ámbito global para compatibilidad total
window.AnimeStorage = AnimeStorage;
window.getInventory = () => AnimeStorage.getInventory();
window.saveInventory = (data) => AnimeStorage.saveInventory(data);
window.formatImagePath = (path) => AnimeStorage.formatImagePath(path);
