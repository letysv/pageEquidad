/**
 * Carga los enlaces recomendados desde la API y los muestra como tarjetas.
 * @param {Object} settings - Configuración del módulo de enlaces.
 */
export function muestra(settings = {}) {
    const url = settings.url_apiEnlaces || settings.url_api;

    if (!url) {
        renderEnlaces([], settings, {
            mensaje: 'No hay una URL configurada para consultar los enlaces recomendados.'
        });
        return;
    }

    $.ajax({
        url,
        method: 'GET',
        dataType: 'json',
        success: function (data) {
            renderEnlaces(data, settings);
        },
        error: function () {
            renderEnlaces([], settings, {
                mensaje: 'No fue posible cargar los enlaces recomendados en este momento.'
            });
        }
    });
}

/**
 * Renderiza el listado de enlaces en el contenedor principal.
 * @param {Array} data - Información recibida desde la API.
 * @param {Object} settings - Configuración del módulo.
 * @param {Object} [estado] - Estado adicional para mostrar mensajes personalizados.
 */
function renderEnlaces(data, settings, estado = {}) {
    const enlaces = Array.isArray(data) ? data : [];
    const enlacesActivos = enlaces.filter((enlace) => estaActivo(enlace));
    const $mainContainer = $('#' + (settings.main_container || 'main_container'));

    $mainContainer.empty();

    const titulo = settings.title || 'Enlaces Recomendados';

    if (!enlacesActivos.length) {
        const mensaje = estado.mensaje || 'No hay enlaces recomendados disponibles en este momento.';
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

    const $encabezado = $(`
        <header class="major">
            <h2 class="modulo-nombre">${titulo}</h2>
        </header>
    `);

    const $lista = $('<div class="row row-cols-1 row-cols-md-2 g-4 enlaces-lista"></div>');

    enlacesActivos.forEach((enlace) => {
        const tituloEnlace = obtenerTitulo(enlace);
        const descripcion = obtenerDescripcion(enlace);
        const href = obtenerUrl(enlace);
        const textoBoton = obtenerTextoBoton(enlace);

        const $columna = $('<div class="col"></div>');
        const $tarjeta = $('<div class="card h-100 shadow-sm enlaces-card"></div>');
        const $cuerpo = $('<div class="card-body d-flex flex-column"></div>');
        const $titulo = $('<h5 class="card-title"></h5>').text(tituloEnlace);

        $cuerpo.append($titulo);

        if (descripcion) {
            const $descripcion = $('<p class="card-text flex-grow-1"></p>').html(descripcion);
            $cuerpo.append($descripcion);
        } else {
            $cuerpo.append('<p class="card-text flex-grow-1 text-muted">Sin descripción disponible.</p>');
        }

        if (href) {
            const $link = $('<a class="btn btn-outline-primary mt-3 align-self-start" target="_blank" rel="noopener"></a>');
            $link.attr('href', href);
            $link.text(textoBoton || 'Visitar enlace');
            $cuerpo.append($link);
        } else {
            $cuerpo.append('<span class="badge bg-secondary align-self-start mt-3">Enlace no disponible</span>');
        }

        $tarjeta.append($cuerpo);
        $columna.append($tarjeta);
        $lista.append($columna);
    });

    $mainContainer.append($encabezado, $lista);
}

/**
 * Determina si un enlace debe mostrarse considerando su estado de activación.
 * @param {Object} enlace - Objeto del enlace.
 * @returns {boolean} `true` si el enlace está activo.
 */
function estaActivo(enlace) {
    if (!enlace || typeof enlace !== 'object') {
        return false;
    }

    const candidatos = [
        enlace.activo,
        enlace.activo_enlace,
        enlace.habilitado,
        enlace.visible,
        enlace.estado,
        enlace.estatus,
        enlace.enabled
    ];

    for (const candidato of candidatos) {
        if (candidato === undefined || candidato === null) {
            continue;
        }

        if (typeof candidato === 'boolean') {
            return candidato;
        }

        if (typeof candidato === 'number') {
            return candidato !== 0;
        }

        if (typeof candidato === 'string') {
            const valor = candidato.trim().toLowerCase();

            if (!valor) {
                continue;
            }

            if (['1', 'true', 'sí', 'si', 'activo', 'habilitado'].includes(valor)) {
                return true;
            }

            if (['0', 'false', 'no', 'inactivo', 'deshabilitado'].includes(valor)) {
                return false;
            }
        }
    }

    return true;
}

/**
 * Obtiene el título a mostrar para un enlace.
 * @param {Object} enlace - Objeto del enlace.
 * @returns {string} Título del enlace.
 */
function obtenerTitulo(enlace) {
    const candidatos = [
        enlace?.titulo,
        enlace?.nombre,
        enlace?.titulo_enlace,
        enlace?.tituloEnlace,
        enlace?.etiqueta,
        enlace?.heading,
        enlace?.tema
    ];

    for (const candidato of candidatos) {
        const texto = normalizarTexto(candidato);

        if (texto) {
            return texto;
        }
    }

    return 'Enlace recomendado';
}

/**
 * Obtiene la descripción asociada al enlace.
 * @param {Object} enlace - Objeto del enlace.
 * @returns {string} Descripción a mostrar.
 */
function obtenerDescripcion(enlace) {
    const candidatos = [
        enlace?.descripcion,
        enlace?.descripcion_corta,
        enlace?.resumen,
        enlace?.detalle,
        enlace?.contenido,
        enlace?.descripcionEnlace,
        enlace?.descripcion_larga
    ];

    for (const candidato of candidatos) {
        const texto = normalizarTexto(candidato, { permitirHTML: true });

        if (texto) {
            return texto;
        }
    }

    return '';
}

/**
 * Obtiene la URL del enlace.
 * @param {Object} enlace - Objeto del enlace.
 * @returns {string} URL normalizada o cadena vacía.
 */
function obtenerUrl(enlace) {
    const candidatos = [
        enlace?.url,
        enlace?.enlace,
        enlace?.liga,
        enlace?.link,
        enlace?.direccion,
        enlace?.href,
        enlace?.ruta
    ];

    for (const candidato of candidatos) {
        const url = normalizarUrl(candidato);

        if (url) {
            return url;
        }
    }

    return '';
}

/**
 * Obtiene el texto del botón para visitar el enlace.
 * @param {Object} enlace - Objeto del enlace.
 * @returns {string} Texto del botón.
 */
function obtenerTextoBoton(enlace) {
    const candidatos = [
        enlace?.texto_boton,
        enlace?.textoBoton,
        enlace?.etiqueta_boton,
        enlace?.etiquetaBoton,
        enlace?.cta,
        enlace?.llamadoAccion
    ];

    for (const candidato of candidatos) {
        const texto = normalizarTexto(candidato);

        if (texto) {
            return texto;
        }
    }

    return '';
}

/**
 * Normaliza un valor potencialmente textual.
 * @param {*} valor - Valor a normalizar.
 * @param {Object} [opciones] - Opciones adicionales.
 * @param {boolean} [opciones.permitirHTML=false] - Indica si debe conservar etiquetas HTML.
 * @returns {string} Cadena normalizada.
 */
function normalizarTexto(valor, opciones = {}) {
    if (valor === undefined || valor === null) {
        return '';
    }

    if (typeof valor === 'string') {
        const texto = valor.trim();
        return texto;
    }

    if (typeof valor === 'number') {
        return String(valor);
    }

    if (opciones.permitirHTML && typeof valor === 'object' && 'toString' in valor) {
        return String(valor);
    }

    return '';
}

/**
 * Normaliza una URL proveniente de diferentes campos.
 * @param {*} valor - Valor a evaluar.
 * @returns {string} URL normalizada.
 */
function normalizarUrl(valor) {
    if (valor === undefined || valor === null) {
        return '';
    }

    if (typeof valor === 'string') {
        const texto = valor.trim();
        return texto;
    }

    if (typeof valor === 'object' && 'url' in valor) {
        return normalizarUrl(valor.url);
    }

    return '';
}