/**
 * Carga las publicaciones desde la API y las muestra agrupadas por apartado en pestañas.
 * @param {Object} settings - Configuración del módulo de publicaciones.
 */
export function muestra(settings = {}) {
    $.ajax({
        url: settings.url_apiPublicaciones || settings.url_api,
        method: 'GET',
        dataType: 'json',
        success: function (data) {
            renderPublicaciones(data, settings);
        },
        error: function () {
            renderPublicaciones([], settings, {
                mensaje: 'No fue posible cargar las publicaciones en este momento.'
            });
        }
    });
}

/**
 * Construye la vista de publicaciones agrupadas por apartado.
 * @param {Array} data - Información recibida desde la API.
 * @param {Object} settings - Configuración del módulo.
 * @param {Object} [estado] - Estado adicional para mostrar mensajes.
 */
function renderPublicaciones(data, settings, estado = {}) {
    const publicaciones = Array.isArray(data) ? data : [];
    const publicacionesActivas = publicaciones.filter((publicacion) => publicacion.activo !== false);
    const $mainContainer = $('#' + settings.main_container);

    $mainContainer.empty();

    const titulo = settings.title || 'Publicaciones';

    if (publicacionesActivas.length === 0) {
        const mensaje = estado.mensaje || 'No hay publicaciones disponibles en este momento.';
        const $contenidoVacio = $(`
            <header class="major">
                <h2 class="modulo-nombre">${titulo}</h2>
            </header>
            <div class="alert alert-info" role="alert">
                ${mensaje}
            </div>
        `);

        $mainContainer.append($contenidoVacio);
        return;
    }

    const grupos = agruparPorApartado(publicacionesActivas);

    const $encabezado = $(`
        <header class="major">
            <h2 class="modulo-nombre">${titulo}</h2>
        </header>
    `);

    const $tabsWrapper = $(`
        <div class="publicaciones-tabs">
            <ul class="nav nav-tabs" id="publicaciones-tab" role="tablist"></ul>
            <div class="tab-content pt-3" id="publicaciones-tabContent"></div>
        </div>
    `);

    const $tabList = $tabsWrapper.find('#publicaciones-tab');
    const $tabContent = $tabsWrapper.find('#publicaciones-tabContent');

    const apartados = Object.keys(grupos);

    apartados.forEach((apartado, index) => {
        const tabId = generarIdApartado(apartado, index);
        const esActivo = index === 0;
        const $tab = $(`
            <li class="nav-item" role="presentation">
                <button class="nav-link${esActivo ? ' active' : ''}" id="${tabId}-tab" data-bs-toggle="tab"
                    data-bs-target="#${tabId}" type="button" role="tab" aria-controls="${tabId}"
                    aria-selected="${esActivo}">
                    ${apartado}
                </button>
            </li>
        `);

        const publicacionesDelApartado = grupos[apartado];
        const $pane = $(`
            <div class="tab-pane fade${esActivo ? ' show active' : ''}" id="${tabId}" role="tabpanel"
                aria-labelledby="${tabId}-tab">
            </div>
        `);

        const contenido = publicacionesDelApartado
            .map((publicacion) => crearTarjetaPublicacion(publicacion, settings))
            .join('');

        $pane.html(contenido || crearMensajeSinArchivos());

        $tabList.append($tab);
        $tabContent.append($pane);
    });

    $mainContainer.append($encabezado, $tabsWrapper);
}

/**
 * Agrupa las publicaciones por su apartado.
 * @param {Array} publicaciones - Lista de publicaciones activas.
 * @returns {Object} Objeto donde las claves son los apartados y el valor es un array de publicaciones.
 */
function agruparPorApartado(publicaciones) {
    return publicaciones.reduce((grupos, publicacion) => {
        const apartado = formatearApartado(publicacion.apartado);
        if (!grupos[apartado]) {
            grupos[apartado] = [];
        }
        grupos[apartado].push(publicacion);
        return grupos;
    }, {});
}

/**
 * Genera el contenido HTML de una tarjeta de publicación con sus archivos.
 * @param {Object} publicacion - Publicación a renderizar.
 * @param {Object} settings - Configuración del módulo.
 * @returns {string} HTML generado.
 */
function crearTarjetaPublicacion(publicacion, settings) {
    const titulo = publicacion.nombre || publicacion.titulo || 'Publicación';
    const descripcion = publicacion.descripcion || publicacion.resumen || '';
    const archivos = obtenerArchivos(publicacion);

    const listaArchivos = archivos
        .map((archivo) => crearElementoArchivo(archivo, settings))
        .join('');

    return `
        <div class="card mb-3">
            <div class="card-body">
                <h5 class="card-title">${titulo}</h5>
                ${descripcion ? `<p class="card-text">${descripcion}</p>` : ''}
                ${listaArchivos ? `<ul class="list-unstyled mb-0">${listaArchivos}</ul>` : crearMensajeSinArchivos()}
            </div>
        </div>
    `;
}

/**
 * Devuelve la marca HTML para un archivo individual de la publicación.
 * @param {Object} archivo - Información del archivo.
 * @param {Object} settings - Configuración del módulo.
 * @returns {string} HTML generado.
 */
function crearElementoArchivo(archivo, settings) {
    const href = construirRutaArchivo(archivo.archivo || archivo.url || archivo.enlace, settings);

    if (!href) {
        return '';
    }

    const nombre = archivo.nombre || archivo.titulo || archivo.descripcion || obtenerNombreArchivo(href);
    const descripcion = archivo.descripcion && archivo.descripcion !== nombre ? `<small class="text-muted d-block">${archivo.descripcion}</small>` : '';

    return `
        <li class="mb-2">
            <a href="${href}" target="_blank" rel="noopener" class="link-primary">${nombre}</a>
            ${descripcion}
        </li>
    `;
}

/**
 * Obtiene todos los archivos relacionados con una publicación.
 * @param {Object} publicacion - Publicación de la cual obtener los archivos.
 * @returns {Array} Lista de archivos.
 */
function obtenerArchivos(publicacion) {
    const archivosDirectos = [];

    if (publicacion.archivo || publicacion.url || publicacion.enlace) {
        archivosDirectos.push({
            archivo: publicacion.archivo || publicacion.url || publicacion.enlace,
            nombre: publicacion.nombre_archivo || publicacion.nombreArchivo || publicacion.tituloArchivo
        });
    }

    const items = Array.isArray(publicacion.items) ? publicacion.items : [];

    return [...archivosDirectos, ...items];
}

/**
 * Genera el mensaje que se muestra cuando no hay archivos que listar.
 * @returns {string} HTML con el mensaje.
 */
function crearMensajeSinArchivos() {
    return '<div class="alert alert-secondary mb-0" role="alert">No hay archivos disponibles.</div>';
}

/**
 * Construye la ruta completa hacia un archivo, agregando la ruta base si es necesario.
 * @param {string} ruta - Ruta o URL del archivo.
 * @param {Object} settings - Configuración del módulo.
 * @returns {string|null} Ruta completa o null si no existe.
 */
function construirRutaArchivo(ruta, settings) {
    if (!ruta) {
        return null;
    }

    if (/^https?:\/\//i.test(ruta)) {
        return ruta;
    }

    const base = settings.url_filesPublicaciones || settings.url_files || '';
    const baseConSlash = base && !base.endsWith('/') ? `${base}/` : base;

    return `${baseConSlash}${ruta}`;
}

/**
 * Obtiene un nombre amigable para mostrar a partir de la ruta del archivo.
 * @param {string} ruta - Ruta o URL del archivo.
 * @returns {string} Nombre del archivo.
 */
function obtenerNombreArchivo(ruta) {
    try {
        const partes = ruta.split('/');
        return partes[partes.length - 1] || 'Archivo';
    } catch (error) {
        return 'Archivo';
    }
}

/**
 * Genera un identificador único y legible para el apartado.
 * @param {string} apartado - Nombre del apartado.
 * @param {number} index - Índice del apartado.
 * @returns {string} Identificador.
 */
function generarIdApartado(apartado, index) {
    const slug = apartado
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return `publicacion-${slug || index}`;
}

/**
 * Devuelve el nombre del apartado en un formato legible.
 * @param {string} apartado - Apartado original.
 * @returns {string} Apartado formateado.
 */
function formatearApartado(apartado) {
    if (!apartado) {
        return 'General';
    }

    if (typeof apartado !== 'string') {
        return apartado.toString();
    }

    return apartado.trim() || 'General';
}

export default { muestra };