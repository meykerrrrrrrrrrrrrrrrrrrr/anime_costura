// ====================================================================
// STORAGE.JS - MOTOR DE ALMACENAMIENTO INFINITO (IndexedDB)
// Preparado para GitHub & Vercel sin límites de 5MB de localStorage
// ====================================================================

const AnimeStorage = {
    dbName: 'AnimeCostura_DB',
    dbVersion: 1,
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

        this.readyPromise = new Promise((resolve) => {
            // 1. Cargar copia síncrona inicial de localStorage a memoria por si IndexedDB demora unos milisegundos
            this.loadFromLocalStorage();

            if (!window.indexedDB) {
                console.warn("[AnimeStorage] IndexedDB no soportado en este navegador. Usando memoria/localStorage.");
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
                // Sincronizar catálogo desde IndexedDB a la memoria
                await this.syncFromDB();
                resolve(true);
            };

            req.onerror = (e) => {
                console.warn("[AnimeStorage] Error al abrir IndexedDB:", e);
                resolve(false);
            };
        });

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
                    if (req.result && Array.isArray(req.result) && req.result.length > 0) {
                        this.cache['anime_inventory'] = req.result;
                        this.notifyUpdate();
                        resolve();
                    } else if (this.cache['anime_inventory'] && this.cache['anime_inventory'].length > 0) {
                        // Si IndexedDB estaba vacío pero había datos en memoria/localStorage, migrarlos a IndexedDB
                        await this.setInDB('anime_inventory', this.cache['anime_inventory']);
                        resolve();
                    } else {
                        // Intentar cargar el catálogo base de GitHub/Vercel (data/inventory.json)
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

    // Cargar data/inventory.json (Ideal para Vercel cuando un cliente nuevo entra a la web)
    async fetchBaseFromJSON() {
        try {
            const jsonPath = this.isInPagesFolder() ? '../data/inventory.json' : 'data/inventory.json';
            const res = await fetch(jsonPath);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    this.cache['anime_inventory'] = data;
                    await this.setInDB('anime_inventory', data);
                    this.notifyUpdate();
                    return data;
                }
            }
        } catch (e) {
            // En modo archivo local (file://) fetch puede dar CORS, se usa el catálogo base incorporado
        }

        const base = this.getBaseInventory();
        this.cache['anime_inventory'] = base;
        await this.setInDB('anime_inventory', base);
        this.notifyUpdate();
        return base;
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

    // Catálogo inicial predeterminado
    getBaseInventory() {
        const prefix = this.isInPagesFolder() ? '../assets/media/' : 'assets/media/';
        return [
            {
                id: 101,
                name: 'Kitagawa Marín Hoodie Cosplay',
                price: '48.00',
                img: [prefix + 'marin.jpg', prefix + 'about-2.jpg'],
                desc: 'Sudadera premium edición especial My Dress-Up Darling con acabados de alta costura.',
                sizes: 'S, M, L, XL',
                colors: 'Rosa, Negro, Blanco'
            },
            {
                id: 102,
                name: 'Miyamoto Musashi Vagabond Oversized Tee',
                price: '32.00',
                img: [prefix + 'musashi.jpg', prefix + 'about-3.jpg'],
                desc: 'Camiseta oversize de algodón peinado con estampado gráfico de alta definición del legendario espadachín.',
                sizes: 'M, L, XL, XXL',
                colors: 'Negro, Carbón'
            },
            {
                id: 103,
                name: 'Noir Streetwear 4K Minimalist Hoodie',
                price: '45.00',
                img: [prefix + 'wallpaper-bw.jpg', prefix + 'about-1.jpg'],
                desc: 'Sudadera urbana monocromática en blanco y negro con corte moderno y capucha forrada.',
                sizes: 'S, M, L, XL',
                colors: 'Negro, Blanco'
            },
            {
                id: 1,
                name: 'Naruto Uzumaki Tee',
                price: '25.00',
                img: ['https://images.unsplash.com/photo-1576566588028-59b5effec076?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'],
                desc: 'Tee premium de Naruto confeccionada en algodón transpirable de alta densidad.',
                sizes: 'S, M, L',
                colors: 'Blanco'
            },
            {
                id: 2,
                name: 'One Piece Hoodie',
                price: '45.00',
                img: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'],
                desc: 'Sudadera temática de Luffy con forro térmico y estampado resistente a lavados.',
                sizes: 'M, L, XL',
                colors: 'Rojo'
            },
            {
                id: 3,
                name: 'Attack on Titan Cap',
                price: '20.00',
                img: ['https://images.unsplash.com/photo-1588850561417-57ca80785662?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'],
                desc: 'Gorra bordada con el emblema de las Alas de la Libertad.',
                sizes: 'Única',
                colors: 'Marrón'
            }
        ];
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
        this.saveInventory(base);
        return base;
    },

    // Guardar inventario de forma ilimitada sin avisos de "almacenamiento lleno"
    saveInventory(data) {
        if (!Array.isArray(data)) return false;

        this.cache['anime_inventory'] = data;

        // 1. Guardar en IndexedDB (Capacidad de Gigabytes, almacenamiento ilimitado)
        this.setInDB('anime_inventory', data);

        // 2. Intentar guardar en localStorage silenciosamente
        try {
            localStorage.setItem('anime_inventory', JSON.stringify(data));
        } catch (e) {
            // Ignorado intencionalmente: Si excede los 5MB de localStorage, IndexedDB ya lo tiene seguro.
        }

        this.notifyUpdate();
        return true;
    },

    // Notificar cambios para auto-recargar componentes
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

    // Sincronizar catálogo fresco desde el archivo data/inventory.json desplegado en Vercel
    async syncFromServer() {
        const jsonPath = this.isInPagesFolder() ? '../data/inventory.json' : 'data/inventory.json';
        const res = await fetch(jsonPath + '?t=' + Date.now());
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
