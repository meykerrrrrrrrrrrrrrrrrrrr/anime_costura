// ====================================================================
// INVENTARIO.JS - Gestión Profesional de Inventario AnimeCostura
// Apple Dark Design System (Series 12 Reference)
// Almacenamiento Ilimitado (IndexedDB) & Sincronización Automática
// ====================================================================

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Asegurar sesión de administrador ROOT para gestión
    let currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role !== 'root') {
        currentUser = {
            name: 'Administrador ROOT',
            doc: 'root',
            role: 'root',
            credits: 9999,
            status: 'Administrador'
        };
        try {
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        } catch(e) {}
    }

    const inventoryBody = document.getElementById('inventory-body');
    const addProdBtn = document.getElementById('add-prod-btn');
    const newProdFilesInput = document.getElementById('new-prod-files');
    const newProdPreviews = document.getElementById('new-prod-previews');
    const searchInput = document.getElementById('inventory-search');
    const inventoryCountEl = document.getElementById('inventory-count');

    // Botones de Sincronización & Respaldo
    const btnExport = document.getElementById('btn-export-catalog');
    const btnImportTrigger = document.getElementById('btn-import-trigger');
    const fileImportCatalog = document.getElementById('file-import-catalog');
    const btnSyncServer = document.getElementById('btn-sync-server');

    // Modal de Edición
    const editModal = document.getElementById('edit-modal');
    const closeModal = document.querySelector('.close-modal');
    const saveEditBtn = document.getElementById('save-edit-btn');
    const editImgPreview = document.getElementById('edit-img-preview');

    let currentEditId = null;
    let currentEditImages = [];
    let pendingNewImages = [];

    // 2. Esperar a que el motor IndexedDB / Cloud termine de inicializarse
    if (window.AnimeStorage && window.AnimeStorage.ready) {
        await window.AnimeStorage.ready();
    }

    // Compresión inteligente con Canvas: balance perfecto entre nitidez Retina y agilidad web
    function compressImage(file, maxWidth = 760, maxHeight = 760, quality = 0.72) {
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

    // Previsualización interactiva de imágenes seleccionadas
    if (newProdFilesInput) {
        newProdFilesInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            if (files.length === 0) return;

            newProdPreviews.innerHTML = '<span style="color:#86868b; font-size:0.85rem;">Procesando imágenes en alta definición...</span>';
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
                <img src="${src}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 10px; border: 1px solid rgba(255,255,255,0.2);">
                <button type="button" onclick="removePendingImage(${idx})" style="position: absolute; top: -6px; right: -6px; background: #ff3037; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: bold;">×</button>
            `;
            newProdPreviews.appendChild(wrap);
        });
    }

    window.removePendingImage = function(index) {
        pendingNewImages.splice(index, 1);
        renderNewProductPreviews();
    };

    // 3. Renderizar la tabla del inventario con buscador en tiempo real
    window.renderInventory = function(filterQuery = null) {
        if (!inventoryBody) return;
        const query = (filterQuery !== null ? filterQuery : (searchInput ? searchInput.value : '')).toLowerCase().trim();
        const fullInventory = window.AnimeStorage ? window.AnimeStorage.getInventory() : [];

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
                : `(${fullInventory.length} prendas registradas)`;
        }

        inventoryBody.innerHTML = '';

        if (filtered.length === 0) {
            inventoryBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 3rem; color: #86868b; font-size: 1rem; background: #111111;">
                        ${query ? `No se encontraron prendas que coincidan con "${query}".` : 'El catálogo está actualmente vacío. Añade una nueva prenda en el panel de la izquierda.'}
                    </td>
                </tr>
            `;
            return;
        }

        filtered.forEach((prod) => {
            const rawSrc = (prod.img && prod.img[0]) ? prod.img[0] : '../assets/media/marin.jpg';
            const imgSrc = window.formatImagePath ? window.formatImagePath(rawSrc) : rawSrc;
            const row = document.createElement('tr');
            row.style.borderBottom = '1px solid rgba(255, 255, 255, 0.08)';

            row.innerHTML = `
                <td style="padding: 14px 16px;">
                    <img src="${imgSrc}" width="54" height="54" style="object-fit: cover; border-radius: 10px; border: 1px solid rgba(255,255,255,0.15);">
                </td>
                <td style="padding: 14px 16px;">
                    <div style="font-weight: 600; color: #f5f5f7; font-size: 0.95rem; margin-bottom: 2px;">${prod.name}</div>
                    <small style="color: #86868b; font-size: 0.8rem; display: block; max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${prod.desc || 'Prenda exclusiva'}</small>
                </td>
                <td style="padding: 14px 16px;">
                    <span style="color: #0071e3; font-weight: 600; font-size: 1.1rem; letter-spacing: -0.2px;">$${prod.price}</span>
                </td>
                <td style="padding: 14px 16px;">
                    <span style="background: rgba(255, 255, 255, 0.05); color: #f5f5f7; padding: 4px 10px; border-radius: 980px; font-weight: 500; font-size: 0.8rem; border: 1px solid #6e6e73;">${prod.sizes || 'S, M, L'}</span>
                </td>
                <td style="padding: 14px 16px; white-space: nowrap;">
                    <button class="btn-action-edit" style="padding: 6px 14px; font-size: 12px; margin-right: 6px; border-radius: 9999px; cursor: pointer; background: transparent; border: 1px solid #ffffff; color: #ffffff; font-weight: 500;" onclick="openEditModal(${prod.id})">Editar</button>
                    <button class="btn-action-delete" style="padding: 6px 14px; font-size: 12px; border-radius: 9999px; cursor: pointer; background: rgba(255, 48, 55, 0.15); border: 1px solid #ff3037; color: #ff3037; font-weight: 500;" onclick="deleteProduct(${prod.id})">Eliminar</button>
                </td>
            `;
            inventoryBody.appendChild(row);
        });
    };

    // 4. Eliminar producto
    window.deleteProduct = async function(id) {
        if (confirm('¿Estás seguro de que deseas eliminar este producto del inventario?')) {
            let inventory = window.AnimeStorage ? window.AnimeStorage.getInventory() : [];
            inventory = inventory.filter(p => p.id != id);

            if (window.AnimeStorage) {
                await window.AnimeStorage.saveInventory(inventory);
            }
            window.renderInventory();
        }
    };

    // 5. Agregar nuevo producto con capacidad ilimitada
    if (addProdBtn) {
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
                alert('Por favor ingresa al menos el Nombre de la Prenda y el Precio.');
                return;
            }

            const cleanPrice = rawPrice.replace(/[^0-9.]/g, '') || rawPrice;

            addProdBtn.disabled = true;
            addProdBtn.textContent = 'Guardando en Catálogo...';

            try {
                let finalImages = [...pendingNewImages];

                if (finalImages.length === 0 && presetVal) {
                    finalImages = [presetVal];
                }

                if (finalImages.length === 0) {
                    finalImages = ['../assets/media/marin.jpg'];
                }

                const inventory = window.AnimeStorage ? window.AnimeStorage.getInventory() : [];
                const newProduct = {
                    id: Date.now(),
                    name: name,
                    price: cleanPrice,
                    desc: desc || 'Prenda exclusiva confeccionada por AnimeCostura con estándares de alta costura.',
                    sizes: sizes || 'S, M, L, XL',
                    colors: colors || 'Negro, Blanco',
                    img: finalImages
                };

                inventory.unshift(newProduct);

                if (window.AnimeStorage) {
                    await window.AnimeStorage.saveInventory(inventory);
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

                alert(`✨ ¡Prenda "${name}" registrada exitosamente con ${finalImages.length} foto(s)!`);
            } catch (error) {
                console.error("Error al registrar prenda:", error);
                alert("No se pudo agregar la prenda. Revisa la consola.");
            } finally {
                addProdBtn.disabled = false;
                addProdBtn.textContent = 'Guardar en Catálogo';
            }
        });
    }

    // 6. Modal de Edición
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

        if (editModal) editModal.style.display = 'block';
    };

    function renderEditImages() {
        if (!editImgPreview) return;
        editImgPreview.innerHTML = '';
        currentEditImages.forEach((rawSrc, index) => {
            const imgSrc = window.formatImagePath ? window.formatImagePath(rawSrc) : rawSrc;
            const div = document.createElement('div');
            div.className = 'img-preview-item';
            div.style.position = 'relative';
            div.style.display = 'inline-block';
            div.style.margin = '4px';
            div.innerHTML = `
                <img src="${imgSrc}" style="width:65px; height:65px; object-fit:cover; border-radius:10px; border:1px solid rgba(255,255,255,0.2);">
                <button type="button" onclick="removeEditImage(${index})" style="position:absolute; top:-5px; right:-5px; background:#ff3037; color:white; border:none; border-radius:50%; width:20px; height:20px; cursor:pointer; font-weight:bold; font-size:12px;">×</button>
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
            if (editModal) editModal.style.display = 'none';
            currentEditId = null;
        };
    }

    window.onclick = (event) => {
        if (event.target == editModal) {
            editModal.style.display = 'none';
            currentEditId = null;
        }
    };

    if (saveEditBtn) {
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
                        await window.AnimeStorage.saveInventory(inventory);
                    }

                    window.renderInventory();
                    if (editModal) editModal.style.display = 'none';
                    if (fileInput) fileInput.value = '';
                    alert('¡Prenda actualizada con éxito!');
                }
            } catch (error) {
                console.error("Error al actualizar prenda:", error);
                alert("Hubo un error al actualizar la prenda.");
            } finally {
                saveEditBtn.disabled = false;
                saveEditBtn.textContent = 'Guardar Cambios';
            }
        });
    }

    // 7. Botones de Sincronización & Respaldo
    if (btnExport) {
        btnExport.addEventListener('click', () => {
            if (window.AnimeStorage) {
                window.AnimeStorage.exportInventory();
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
                    alert("📤 ¡Catálogo importado exitosamente!");
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
                btnSyncServer.textContent = 'Sincronizando...';
                if (window.AnimeStorage) {
                    await window.AnimeStorage.syncFromServer();
                    window.renderInventory();
                    alert("🔄 ¡Catálogo sincronizado exitosamente!");
                }
            } catch (err) {
                alert("No se pudo sincronizar: " + err.message);
            } finally {
                btnSyncServer.textContent = '🔄 Revalidar Catálogo';
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
