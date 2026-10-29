# 🌸 AnimeCostura - Tienda Online de Moda Anime & Textil

Plataforma web moderna de moda otaku, confección personalizada y cosplay, con fondos de video anime fluidos, diseño glassmorphism de alta estética y **motor de almacenamiento ilimitado (IndexedDB)** optimizado para desplegar en **GitHub** y alojar en **Vercel**.

---

## 🚀 Guía de Despliegue en GitHub y Vercel

### Paso 1: Subir el proyecto a GitHub
Abre tu terminal (PowerShell o Git Bash) y ejecuta los siguientes comandos:

```bash
cd "C:\Users\DIOS ES AMOR\OneDrive\Desktop\m\costura"

# Inicializar repositorio Git
git init

# Agregar todos los archivos
git add .

# Crear el primer commit
git commit -m "AnimeCostura - Lanzamiento oficial listo para Vercel"

# Crear la rama principal
git branch -M main

# Conectar con tu repositorio de GitHub (reemplaza con tu URL de GitHub)
git remote add origin https://github.com/TU_USUARIO/animecostura.git

# Subir los archivos a GitHub
git push -u origin main
```

---

### Paso 2: Desplegar en Vercel (En 1 minuto)
1. Entra a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **"Add New..."** y luego en **"Project"**.
3. Busca tu repositorio recién subido (`animecostura`) y haz clic en **"Import"**.
4. En la configuración del proyecto:
   - **Framework Preset**: Déjalo en `Other` o `Plain HTML/JS`.
   - **Root Directory**: `./` (la raíz del proyecto).
5. Haz clic en **"Deploy"**.
6. ¡Listo! Vercel te dará un enlace público y seguro (por ejemplo: `https://animecostura.vercel.app`) que puedes compartir con tus clientes.

---

## 💎 Sistema de Almacenamiento Ilimitado para Fotos (IndexedDB)

### ¿Por qué nunca más verás el error de "Almacenamiento Lleno"?
- Los navegadores convencionales limitan el almacenamiento tradicional (`localStorage`) a tan solo **5 Megabytes**, provocando que al subir 3 o 4 fotos de alta calidad aparezca el cartel de "almacenamiento lleno".
- **AnimeCostura cuenta con el motor `storage.js` basado en IndexedDB**:
  - Utiliza la base de datos nativa del navegador, la cual permite almacenar **decenas de Gigabytes** (hasta el 80% del disco de tu equipo).
  - Incluye compresión adaptativa en Canvas (WebP/JPEG a 1200px) que mantiene la nitidez en monitores 4K y pantallas Retina sin consumir gigabytes innecesarios.
  - Guarda automáticamente en segundo plano sin bloquear la interfaz.

---

## 🔄 ¿Cómo Actualizar los Productos en Vercel para Todo el Mundo?

Cuando agregues nuevos productos o fotos desde tu panel de administración:

1. Ve a la página de **Inventario** (`pages/inventario.html`).
2. Agrega todos los productos y fotos que quieras (no hay límite).
3. En la barra superior, haz clic en el botón verde:  
   **📥 Descargar inventory.json**
4. Mueve el archivo descargado a la carpeta `data/` del proyecto, reemplazando el `inventory.json` anterior.
5. Ejecuta en tu terminal:
   ```bash
   git add data/inventory.json
   git commit -m "Actualizar catálogo de productos"
   git push
   ```
6. **Vercel detectará el cambio y actualizará la tienda automáticamente en segundos** para todos los visitantes que entren a tu web en cualquier parte del mundo.

---

## 🎨 Características Destacadas
- **Fondos de Video Anime**: Videos en bucle optimizados con máscaras oscuras para garantizar 100% de legibilidad en todos los textos y tarjetas.
- **Tienda Dinámica**: Transición cinematográfica crossfade Ken-Burns entre imágenes de productos, puntos interactivos e indicador de vistas.
- **Quiénes Somos y Galería**: Frases inspiradoras de costura, esfuerzo y dedicación con modal interactivo de zoom.
- **Gestión de Roles**: Vista de administrador automática para gestionar clientes, pedidos, finanzas e inventario.
