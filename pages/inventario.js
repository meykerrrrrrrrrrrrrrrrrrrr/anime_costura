// --- Lógica del Inventario Profesional con Almacenamiento Ilimitado (IndexedDB) ---
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Asegurar sesión de administrador para gestión de tienda
    let currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role !== 'root') {
        currentUser = {
            name: 'Administrador ROOT',
            doc: 'root',
            role: 'root',
            credits: 9999,
            status: 'Administrador'
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }

    const inventoryBody = document.getElementById('inventory-body');
    const addProdBtn = document.getElementById('add-prod-btn');
    const newProdFilesInput = document.getElementById('new-prod-files');
    const newProdPreviews = document.getElementById('new-prod-previews');
    const searchInput = document.getElementById('inventory-search');
    const inventoryCountEl = document.getElementById('inventory-count');

    // Botones de Sincronización GitHub & Vercel
    const btnExport = document.getElementById('btn-export-catalog');
    const btnImportTrigger = document.getElementById('btn-import-trigger');
    const fileImportCatalog = document.getElementById('file-import-catalog');
    const btnSyncServer = document.getElementById('btn-sync-server');

    // Elementos del Modal de Edición
    const editModal = document.getElementById('edit-modal');
    const closeModal = document.querySelector('.close-modal');
    const saveEditBtn = document.getElementById('save-edit-btn');
    const editImgPreview = document.getElementById('edit-img-preview');

    let currentEditId = null;
    let currentEditImages = [];
    let pendingNewImages = [];

    // Compresión inteligente con Canvas para mantener nitidez HD/4K y agilidad
    function compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.82) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    let width = img.width;
                    let height = img.height;
                    if (width > height) {
                        if (width > maxWidth) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = Math.round((width * maxHeight) / height);
                            height = maxHeight;
                        }
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.onerror = () => resolve(e.target.result);
                img.src = e.target.result;
            };
            reader.onerror = () => resolve('../assets/media/marin.jpg');
            reader.readAsDataURL(file);
        });
    }

    // Previsualización interactiva de imágenes seleccionadas para nuevo producto
    if (newProdFilesInput) {
        newProdFilesInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            if (files.length === 0) return;

            newProdPreviews.innerHTML = '<span style="color:#a29bfe; font-size:0.85rem;">Procesando imágenes en alta definición...</span>';
            const compressedList = await Promise.all(files.map(f => compressImage(f)));
            pendingNewImages = [...pendingNewImages, ...compressedList];
            renderNewProductPreviews();
        });
    }

    function renderNewProductPreviews() {
        if (!newProdPreviews) return;
        newProdPreviews.innerHTML = '';
        pendingNewImages.forEach((src, idx) => {
            const wrap = document.createElement('div');
            wrap.style.position = 'relative';
            wrap.style.display = 'inline-block';
            wrap.innerHTML = `
                <img src="${src}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; border: 1px solid #6c5ce7;">
                <button type="button" onclick="removePendingImage(${idx})" style="position: absolute; top: -6px; right: -6px; background: #e74c3c; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center;">×</button>
            `;
            newProdPreviews.appendChild(wrap);
        });
    }

    window.removePendingImage = function(index) {
        pendingNewImages.splice(index, 1);
        renderNewProductPreviews();
    };

    // 2. Renderizar la tabla del inventario con buscador en tiempo real
    window.renderInventory = function(filterQuery = null) {
        const query = (filterQuery !== null ? filterQuery : (searchInput ? searchInput.value : '')).toLowerCase().trim();
        const fullInventory = window.AnimeStorage ? window.AnimeStorage.getInventory() : (JSON.parse(localStorage.getItem('anime_inventory')) || []);

        const filtered = fullInventory.filter(prod => {
            if (!query) return true;
            const name = (prod.name || '').toLowerCase();
            const desc = (prod.desc || '').toLowerCase();
            const sizes = (prod.sizes || '').toLowerCase();
            const colors = (prod.colors || '').toLowerCase();
            const price = (prod.price || '').toString().toLowerCase();
            return name.includes(query) || desc.includes(query) || sizes.includes(query) || colors.includes(query) || price.includes(query);
        });

        if (inventoryCountEl) {
            inventoryCountEl.textContent = query 
                ? `(${filtered.length} de ${fullInventory.length})` 
                : `(${fullInventory.length} prendas)`;
        }

        inventoryBody.innerHTML = '';

        if (filtered.length === 0) {
            inventoryBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 3rem; color: #cbd5e1; font-size: 1.15rem; background: rgba(0,0,0,0.3); border-radius: 12px;">
                        ${query ? `No se encontraron prendas que coincidan con "${query}". 🔍` : 'El inventario está actualmente vacío. Agrega un nuevo diseño en el formulario izquierdo. ✨'}
                    </td>
                </tr>
            `;
            return;
        }

        filtered.forEach((prod) => {
            const rawSrc = (prod.img && prod.img[0]) ? prod.img[0] : '../assets/media/marin.jpg';
            const imgSrc = window.formatImagePath ? window.formatImagePath(rawSrc) : rawSrc;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <img src="${imgSrc}" width="60" height="60" style="object-fit: cover; border-radius: 10px; border: 2px solid #6c5ce7; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
                </td>
                <td>
                    <div style="font-weight: 700; color: #ffffff; font-size: 1.05rem; margin-bottom: 3px;">${prod.name}</div>
                    <small style="color: #cbd5e1; font-size: 0.82rem; display: block; max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${prod.desc || 'Prenda exclusiva'}</small>
                </td>
                <td>
                    <span style="color: #00cec9; font-weight: 800; font-family: 'Permanent Marker', cursive; font-size: 1.25rem; text-shadow: 0 2px 8px rgba(0,206,201,0.3);">$${prod.price}</span>
                </td>
                <td>
                    <span style="background: rgba(108, 92, 231, 0.25); color: #ffffff; padding: 5px 12px; border-radius: 8px; font-weight: 600; font-size: 0.85rem; border: 1px solid rgba(108, 92, 231, 0.5);">${prod.sizes || 'S, M, L'}</span>
                </td>
                <td style="white-space: nowrap;">
                    <button class="btn-secondary" style="padding: 8px 16px; font-size: 13px; margin-right: 6px; border-radius: 8px; cursor: pointer; background: #6c5ce7; border: 1px solid #a29bfe; color: #ffffff; font-weight: 700; box-shadow: 0 4px 12px rgba(108, 92, 231, 0.4);" onclick="openEditModal(${prod.id})">✏️ Editar</button>
                    <button class="btn-danger" style="padding: 8px 16px; font-size: 13px; border-radius: 8px; cursor: pointer; background: #e74c3c; border: 1px solid #ff7675; color: #ffffff; font-weight: 700; box-shadow: 0 4px 12px rgba(231, 76, 60, 0.4);" onclick="deleteProduct(${prod.id})">🗑️ Eliminar</button>
                </td>
            `;
            inventoryBody.appendChild(row);
        });
    };

    // 3. Eliminar producto de forma definitiva
    window.deleteProduct = function(id) {
        if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
            let inventory = window.AnimeStorage ? window.AnimeStorage.getInventory() : [];
            inventory = inventory.filter(p => p.id != id);

            if (window.AnimeStorage) {
                window.AnimeStorage.saveInventory(inventory);
            } else {
                localStorage.setItem('anime_inventory', JSON.stringify(inventory));
            }
            window.renderInventory();
        }
    };

    // 4. Agregar nuevo producto con capacidad ilimitada
    addProdBtn.addEventListener('click', async () => {
        const nameInput = document.getElementById('new-prod-name');
        const priceInput = document.getElementById('new-prod-price');
        const descInput = document.getElementById('new-prod-desc');
        const sizesInput = document.getElementById('new-prod-sizes');
        const colorsInput = document.getElementById('new-prod-colors');
        const presetSelect = document.getElementById('new-prod-preset');

        const name = nameInput.value.trim();
        const rawPrice = priceInput.value.trim();
        const desc = descInput.value.trim();
        const sizes = sizesInput.value.trim();
        const colors = colorsInput.value.trim();
        const presetVal = presetSelect ? presetSelect.value : '';

        if (!name || !rawPrice) {
            alert('Por favor ingresa al menos el Nombre del Diseño y el Precio.');
            return;
        }

        const cleanPrice = rawPrice.replace(/[^0-9.]/g, '') || rawPrice;

        addProdBtn.disabled = true;
        addProdBtn.textContent = 'Guardando en Almacenamiento Ilimitado...';

        try {
            let finalImages = [...pendingNewImages];

            // Si no subió archivos manuales pero seleccionó un preajuste
            if (finalImages.length === 0 && presetVal) {
                finalImages = [presetVal];
            }

            // Imagen por defecto si no eligió nada
            if (finalImages.length === 0) {
                finalImages = ['../assets/media/marin.jpg'];
            }

            const inventory = window.AnimeStorage ? window.AnimeStorage.getInventory() : [];
            const newProduct = {
                id: Date.now(),
                name: name,
                price: cleanPrice,
                desc: desc || 'Prenda exclusiva confeccionada por AnimeCostura con materiales de máxima calidad textil.',
                sizes: sizes || 'S, M, L, XL',
                colors: colors || 'Negro, Blanco',
                img: finalImages
            };

            inventory.unshift(newProduct);

            if (window.AnimeStorage) {
                window.AnimeStorage.saveInventory(inventory);
            } else {
                localStorage.setItem('anime_inventory', JSON.stringify(inventory));
            }

            window.renderInventory();

            // Limpiar formulario y fotos pendientes
            nameInput.value = '';
            priceInput.value = '';
            descInput.value = '';
            sizesInput.value = '';
            colorsInput.value = '';
            if (presetSelect) presetSelect.value = '';
            if (newProdFilesInput) newProdFilesInput.value = '';
            pendingNewImages = [];
            renderNewProductPreviews();

            alert(`✨ ¡"${name}" guardado exitosamente con ${finalImages.length} foto(s)!`);
        } catch (error) {
            console.error("Error al agregar producto:", error);
            alert("No se pudo agregar el producto. Revisa la consola.");
        } finally {
            addProdBtn.disabled = false;
            addProdBtn.textContent = 'Guardar en Inventario';
        }
    });

    // 5. Modal de Edición
    window.openEditModal = function(id) {
        currentEditId = id;
        const inventory = window.AnimeStorage ? window.AnimeStorage.getInventory() : [];
        const prod = inventory.find(p => p.id == id);

        if (!prod) {
            alert('No se encontró el producto a editar.');
            return;
        }

        document.getElementById('edit-prod-name').value = prod.name;
        document.getElementById('edit-prod-price').value = prod.price;
        document.getElementById('edit-prod-desc').value = prod.desc || '';
        document.getElementById('edit-prod-sizes').value = prod.sizes || '';
        document.getElementById('edit-prod-colors').value = prod.colors || '';

        currentEditImages = [...(prod.img || [])];
        renderEditImages();

        editModal.style.display = 'block';
    };

    function renderEditImages() {
        editImgPreview.innerHTML = '';
        currentEditImages.forEach((rawSrc, index) => {
            const imgSrc = window.formatImagePath ? window.formatImagePath(rawSrc) : rawSrc;
            const div = document.createElement('div');
            div.className = 'img-preview-item';
            div.style.position = 'relative';
            div.style.display = 'inline-block';
            div.style.margin = '4px';
            div.innerHTML = `
                <img src="${imgSrc}" style="width:70px; height:70px; object-fit:cover; border-radius:6px; border:1px solid #6c5ce7;">
                <button type="button" onclick="removeEditImage(${index})" style="position:absolute; top:-5px; right:-5px; background:#e74c3c; color:white; border:none; border-radius:50%; width:22px; height:22px; cursor:pointer; font-weight:bold;">×</button>
            `;
            editImgPreview.appendChild(div);
        });
    }

    window.removeEditImage = function(index) {
        currentEditImages.splice(index, 1);
        renderEditImages();
    };

    if (closeModal) {
        closeModal.onclick = () => {
            editModal.style.display = 'none';
            currentEditId = null;
        };
    }

    window.onclick = (event) => {
        if (event.target == editModal) {
            editModal.style.display = 'none';
            currentEditId = null;
        }
    };

    saveEditBtn.addEventListener('click', async () => {
        const name = document.getElementById('edit-prod-name').value.trim();
        const rawPrice = document.getElementById('edit-prod-price').value.trim();
        const desc = document.getElementById('edit-prod-desc').value.trim();
        const sizes = document.getElementById('edit-prod-sizes').value.trim();
        const colors = document.getElementById('edit-prod-colors').value.trim();
        const fileInput = document.getElementById('edit-prod-files');
        const files = fileInput ? fileInput.files : [];

        if (!name || !rawPrice) {
            alert('Nombre y Precio son obligatorios.');
            return;
        }

        const cleanPrice = rawPrice.replace(/[^0-9.]/g, '') || rawPrice;

        saveEditBtn.disabled = true;
        saveEditBtn.textContent = 'Guardando Cambios...';

        try {
            let newImages = [];
            if (files && files.length > 0) {
                newImages = await Promise.all(Array.from(files).map(file => compressImage(file)));
            }

            const updatedImages = [...currentEditImages, ...newImages];
            if (updatedImages.length === 0) {
                updatedImages.push('../assets/media/marin.jpg');
            }

            const inventory = window.AnimeStorage ? window.AnimeStorage.getInventory() : [];
            const prodIndex = inventory.findIndex(p => p.id == currentEditId);

            if (prodIndex !== -1) {
                inventory[prodIndex] = {
                    ...inventory[prodIndex],
                    name,
                    price: cleanPrice,
                    desc,
                    sizes,
                    colors,
                    img: updatedImages
                };

                if (window.AnimeStorage) {
                    window.AnimeStorage.saveInventory(inventory);
                } else {
                    localStorage.setItem('anime_inventory', JSON.stringify(inventory));
                }

                window.renderInventory();
                editModal.style.display = 'none';
                if (fileInput) fileInput.value = '';
                alert('¡Producto actualizado con éxito!');
            }
        } catch (error) {
            console.error("Error al actualizar producto:", error);
            alert("Hubo un error al actualizar el producto.");
        } finally {
            saveEditBtn.disabled = false;
            saveEditBtn.textContent = 'Guardar Cambios';
        }
    });

    // 6. Botones de Sincronización GitHub & Vercel
    if (btnExport) {
        btnExport.addEventListener('click', () => {
            if (window.AnimeStorage) {
                window.AnimeStorage.exportInventory();
                alert("📥 Archivo 'inventory.json' descargado.\n\nColócalo en la carpeta 'data/' de tu proyecto y súbelo a GitHub para que Vercel actualice tu tienda en vivo.");
            }
        });
    }

    if (btnImportTrigger && fileImportCatalog) {
        btnImportTrigger.addEventListener('click', () => fileImportCatalog.click());
        fileImportCatalog.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                if (window.AnimeStorage) {
                    await window.AnimeStorage.importInventory(file);
                    window.renderInventory();
                    alert("📤 ¡Catálogo importado exitosamente desde JSON!");
                }
            } catch (err) {
                alert("Error al importar: " + err.message);
            } finally {
                fileImportCatalog.value = '';
            }
        });
    }

    if (btnSyncServer) {
        btnSyncServer.addEventListener('click', async () => {
            try {
                btnSyncServer.textContent = 'Recargando...';
                if (window.AnimeStorage) {
                    await window.AnimeStorage.syncFromServer();
                    window.renderInventory();
                    alert("🔄 ¡Catálogo sincronizado exitosamente con el servidor!");
                }
            } catch (err) {
                alert("No se pudo sincronizar directamente desde el servidor: " + err.message);
            } finally {
                btnSyncServer.textContent = '🔄 Recargar de Servidor';
            }
        });
    }

    // Buscador en tiempo real de productos
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            window.renderInventory(e.target.value);
        });
    }

    // Escuchar actualizaciones en tiempo real del motor AnimeStorage
    window.addEventListener('animeInventoryUpdated', () => {
        window.renderInventory();
    });

    // Render inicial
    window.renderInventory();
});
