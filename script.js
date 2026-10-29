document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const garmentType = document.getElementById('garment-type');
    const garmentColor = document.getElementById('garment-color');
    const customText = document.getElementById('custom-text');
    const textColor = document.getElementById('text-color');
    const textSize = document.getElementById('text-size');
    const imageUpload = document.getElementById('image-upload');
    const saveDesign = document.getElementById('save-design');

    const garmentPreview = document.getElementById('garment-preview');
    const textOverlay = document.getElementById('text-overlay');
    const imageOverlay = document.getElementById('image-overlay');

    // Update Garment Type (Shape)
    garmentType.addEventListener('change', () => {
        garmentPreview.className = 'garment-preview ' + garmentType.value;
    });

    // Update Garment Color
    garmentColor.addEventListener('input', () => {
        garmentPreview.style.backgroundColor = garmentColor.value;
    });

    // Update Text
    customText.addEventListener('input', () => {
        textOverlay.textContent = customText.value || 'Tu Texto Aquí';
    });

    textColor.addEventListener('input', () => {
        textOverlay.style.color = textColor.value;
    });

    textSize.addEventListener('input', () => {
        textOverlay.style.fontSize = textSize.value + 'px';
    });

    // Handle Image Upload
    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                imageOverlay.src = event.target.result;
                imageOverlay.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });

    // Save Design Action
    saveDesign.addEventListener('click', () => {
        const design = {
            garment: garmentType.value,
            color: garmentColor.value,
            text: customText.value,
            textColor: textColor.value,
            textSize: textSize.value,
            image: imageOverlay.src
        };

        console.log('Pedido de diseño guardado:', design);
        alert('¡Tu diseño ha sido enviado con éxito! Pronto nos pondremos en contacto contigo.');
    });

    // Add to cart simple simulation
    document.querySelectorAll('.btn-add').forEach(button => {
        button.addEventListener('click', () => {
            alert('Producto añadido al carrito de compras');
        });
    });
});