/**
 * Muestra la sección de Biblioteca Virtual.
 * Renderiza un selector de categorías y tarjetas de libros filtradas por la categoría seleccionada.
 * @param {Object} settings - Configuración del módulo de biblioteca.
 */
export function muestra(settings = {}) {
    $.ajax({
        url: settings.url_apiBiblioteca || settings.url_api,
        method: 'GET',
        dataType: 'json',
        success: function (data) {
            renderBiblioteca(data, settings);
        },
        error: function () {
            renderBiblioteca([], settings, {
                mensaje: 'No fue posible cargar la biblioteca en este momento.'
            });
        }
    });
}

/**
 * Construye la vista principal de la biblioteca.
 * @param {Array} data - Datos recibidos desde la API.
 * @param {Object} settings - Configuración del módulo.
 * @param {Object} [estado] - Estado adicional para mostrar mensajes.
 */
function renderBiblioteca(data, settings, estado = {}) {
    const libros = Array.isArray(data) ? data : [];
    const librosActivos = libros.filter((libro) => libro.activo !== false);
    const categorias = agruparPorCategoria(librosActivos);
    const $mainContainer = $('#' + settings.main_container);

    $mainContainer.empty();

    const titulo = settings.title || 'Biblioteca';

    const $encabezado = $(`
        <header class="major">
            <h2 class="modulo-nombre">${titulo}</h2>
        </header>
    `);

    if (!categorias.length) {
        const mensaje = estado.mensaje || 'No hay libros disponibles en este momento.';
        const $contenidoVacio = $(`
            <div class="alert alert-info" role="alert">
                ${mensaje}
            </div>
        `);

        $mainContainer.append($encabezado, $contenidoVacio);
        return;
    }

    const { $wrapper: $selectorWrapper, $select } = crearSelectorCategorias(categorias);
    const $contenedorLibros = $('<div class="row g-4" id="biblioteca-libros"></div>');

    $mainContainer.append($encabezado, $selectorWrapper, $contenedorLibros);

    const mostrarLibros = (categoriaSeleccionada) => {
        const librosDeCategoria = buscarLibrosPorCategoria(categorias, categoriaSeleccionada);
        actualizarTarjetas(librosDeCategoria, $contenedorLibros, settings);
    };

    $select.on('change', function () {
        const categoriaSeleccionada = $(this).val();
        mostrarLibros(categoriaSeleccionada);
    });

    const primeraCategoria = $select.val();
    mostrarLibros(primeraCategoria);
}

/**
 * Crea un elemento select con las categorías disponibles.
 * @param {Array} categorias - Lista de categorías disponibles.
 * @returns {{ $wrapper: jQuery, $select: jQuery }} Selector y su contenedor.
 */
function crearSelectorCategorias(categorias) {
    const $wrapper = $('<div class="mb-4"></div>');
    const $label = $('<label class="form-label fw-bold" for="biblioteca-categorias">Selecciona una categoría</label>');
    const $select = $('<select class="form-select" id="biblioteca-categorias"></select>');

    categorias.forEach((categoria, index) => {
        const $option = $(`<option value="${categoria.id}">${categoria.nombre}</option>`);
        if (index === 0) {
            $option.prop('selected', true);
        }
        $select.append($option);
    });

    $wrapper.append($label, $select);
    return { $wrapper, $select };
}

/**
 * Actualiza las tarjetas de libros mostradas en pantalla.
 * @param {Array} libros - Libros a mostrar.
 * @param {jQuery} $contenedor - Contenedor donde se renderizan las tarjetas.
 * @param {Object} settings - Configuración del módulo.
 */
function actualizarTarjetas(libros, $contenedor, settings) {
    $contenedor.empty();

    if (!libros.length) {
        const $mensaje = $(`
            <div class="col-12">
                <div class="alert alert-secondary" role="alert">
                    No hay libros disponibles en esta categoría.
                </div>
            </div>
        `);
        $contenedor.append($mensaje);
        return;
    }

    const tarjetas = libros
        .map((libro) => crearTarjetaLibro(libro, settings))
        .join('');

    $contenedor.html(tarjetas);
}

/**
 * Construye el HTML de una tarjeta de libro.
 * @param {Object} libro - Información del libro.
 * @param {Object} settings - Configuración del módulo.
 * @returns {string} HTML generado.
 */
function crearTarjetaLibro(libro, settings) {
    const titulo = libro.titulo || libro.nombre || 'Libro';
    const imagen = construirRutaArchivo(libro.imagen || libro.portada || libro.cover, settings) || obtenerImagenFallback();
    const enlace = construirRutaArchivo(libro.archivo || libro.url || libro.enlace, settings);
    const descripcion = libro.descripcion || libro.resumen || '';

    const tituloEnlace = enlace
        ? `<a href="${enlace}" target="_blank" rel="noopener" class="stretched-link">${titulo}</a>`
        : titulo;

    const descripcionHtml = descripcion ? `<p class="card-text">${descripcion}</p>` : '';

    return `
        <div class="col-12 col-sm-6 col-lg-4">
            <div class="card h-100 shadow-sm position-relative overflow-hidden">
                <div class="bg-light" style="aspect-ratio: 3 / 4;">
                    <img src="${imagen}" class="w-100 h-100 object-fit-cover" alt="Portada de ${titulo}" onerror="this.onerror=null;this.src='${obtenerImagenFallback()}';" />
                </div>
                <div class="card-body">
                    <h5 class="card-title">${tituloEnlace}</h5>
                    ${descripcionHtml}
                </div>
            </div>
        </div>
    `;
}

/**
 * Agrupa los libros por categoría.
 * @param {Array} libros - Libros activos de la biblioteca.
 * @returns {Array} Lista de categorías con sus libros.
 */
function agruparPorCategoria(libros) {
    const grupos = new Map();

    libros.forEach((libro) => {
        const nombreCategoria = obtenerNombreCategoria(libro);
        const idCategoria = generarIdCategoria(nombreCategoria);

        if (!grupos.has(idCategoria)) {
            grupos.set(idCategoria, {
                id: idCategoria,
                nombre: nombreCategoria,
                libros: []
            });
        }

        grupos.get(idCategoria).libros.push(libro);
    });

    return Array.from(grupos.values());
}

/**
 * Obtiene el nombre de la categoría de un libro.
 * @param {Object} libro - Libro del cual obtener la categoría.
 * @returns {string} Nombre de la categoría.
 */
function obtenerNombreCategoria(libro) {
    const categoria = libro.categoria || libro.categoria_nombre || libro.apartado || libro.area || 'Sin categoría';
    return String(categoria).trim() || 'Sin categoría';
}

/**
 * Genera un identificador seguro para una categoría.
 * @param {string} nombre - Nombre de la categoría.
 * @returns {string} Identificador generado.
 */
function generarIdCategoria(nombre) {
    const normalizado = nombre
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    const id = normalizado
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return id || 'categoria';
}

/**
 * Busca los libros asociados a una categoría específica.
 * @param {Array} categorias - Lista de categorías agrupadas.
 * @param {string} idCategoria - Identificador de la categoría seleccionada.
 * @returns {Array} Libros de la categoría seleccionada.
 */
function buscarLibrosPorCategoria(categorias, idCategoria) {
    const categoria = categorias.find((item) => item.id === idCategoria);
    return categoria ? categoria.libros : [];
}

/**
 * Construye la ruta completa de un archivo o recurso.
 * @param {string} ruta - Ruta proporcionada por la API.
 * @param {Object} settings - Configuración del módulo.
 * @returns {string} Ruta absoluta del recurso.
 */
function construirRutaArchivo(ruta, settings) {
    if (!ruta) {
        return '';
    }

    if (/^https?:\/\//i.test(ruta)) {
        return ruta;
    }

    const base = settings.url_filesBiblioteca || settings.url_files || '';
    if (!base) {
        return ruta;
    }

    const separador = base.endsWith('/') ? '' : '/';
    return `${base}${separador}${ruta.replace(/^\/+/, '')}`;
}

/**
 * Devuelve una imagen de respaldo cuando no existe portada.
 * @returns {string} URL de la imagen de respaldo.
 */
function obtenerImagenFallback() {
    return 'https://via.placeholder.com/300x400?text=Sin+imagen';
}