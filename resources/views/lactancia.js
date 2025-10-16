/**
 * Módulo encargado de renderizar la información de la sala de lactancia.
 * Muestra la descripción, la imagen y el archivo descargable expuestos por la API.
 */
export function muestra(settings = {}) {
    const url = settings.url_apiLactancia || settings.url_api;

    if (!url) {
        renderLactancia(null, settings, {
            mensaje: 'No hay una URL configurada para consultar la sala de lactancia.'
        });
        return;
    }

    $.ajax({
        url,
        method: 'GET',
        dataType: 'json',
        success: function (data) {
            renderLactancia(data, settings);
        },
        error: function () {
            renderLactancia(null, settings, {
                mensaje: 'No fue posible cargar la información de la sala de lactancia en este momento.'
            });
        }
    });
}

/**
 * Renderiza el contenido de la sala de lactancia.
 */
function renderLactancia(data, settings, estado = {}) {
    const $mainContainer = $('#' + (settings.main_container || 'main_container'));
    const titulo = settings.title || 'Sala de lactancia';

    $mainContainer.empty();

    const $encabezado = $(`
        <header class="major">
            <h2 class="modulo-nombre">${titulo}</h2>
        </header>
    `);

    $mainContainer.append($encabezado);

    const registro = seleccionarRegistro(data);

    if (!registro) {
        const mensaje = estado.mensaje || 'No hay información disponible para mostrar.';
        const $alerta = $(`
            <div class="alert alert-info" role="alert">
                ${mensaje}
            </div>
        `);

        $mainContainer.append($alerta);
        return;
    }

    const descripcion = obtenerDescripcion(registro);
    const archivoUrl = obtenerArchivo(registro, settings);
    const imagenUrl = obtenerImagen(registro, settings);

    const $tarjeta = $('<div class="lactancia-contenido card shadow-sm"></div>');
    const $cuerpo = $('<div class="card-body"></div>');

    if (imagenUrl) {
        const $contenedorImagen = $(`
            <div class="lactancia-imagen text-center mb-4">
                <img src="${imagenUrl}"
                     alt="${titulo}"
                     class="img-fluid"
                     loading="lazy"
                     onerror="this.style.display='none'">
            </div>
        `);

        $cuerpo.append($contenedorImagen);
    }

    if (descripcion) {
        const $descripcion = $('<div class="lactancia-descripcion"></div>');
        $descripcion.html(descripcion);
        $cuerpo.append($descripcion);
    } else {
        $cuerpo.append(`
            <p class="text-muted">No hay descripción disponible en este momento.</p>
        `);
    }

    if (archivoUrl) {
        const nombreArchivo = obtenerNombreArchivo(archivoUrl);
        const $archivo = $(`
            <div class="lactancia-archivo mt-4">
                <a class="btn btn-primary" href="${archivoUrl}" target="_blank" rel="noopener">
                    Descargar ${nombreArchivo}
                </a>
            </div>
        `);

        $cuerpo.append($archivo);
    }

    $tarjeta.append($cuerpo);
    $mainContainer.append($tarjeta);
}

/**
 * Selecciona el registro a mostrar.
 */
function seleccionarRegistro(data) {
    if (!data) {
        return null;
    }

    if (Array.isArray(data)) {
        const activos = data.filter((item) => item && item.activo !== false);
        if (activos.length) {
            return activos[0];
        }

        return data[0] || null;
    }

    if (typeof data === 'object') {
        if (Array.isArray(data.data)) {
            return seleccionarRegistro(data.data);
        }

        return data;
    }

    return null;
}

/**
 * Obtiene la descripción del registro.
 */
function obtenerDescripcion(registro) {
    if (!registro || typeof registro !== 'object') {
        return '';
    }

    const candidatos = [
        registro.descripcion,
        registro.description,
        registro.detalle,
        registro.contenido,
        registro.texto,
        registro.body
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
 * Obtiene la URL del archivo asociado al registro.
 */
function obtenerArchivo(registro, settings) {
    if (!registro || typeof registro !== 'object') {
        return '';
    }

    const base = settings.url_filesLactancia || settings.url_files || '';
    const candidatos = [
        registro.archivo,
        registro.file,
        registro.documento,
        registro.ruta_archivo,
        registro.url_archivo,
        registro.link
    ];

    for (const candidato of candidatos) {
        const ruta = normalizarTexto(candidato);
        const url = construirUrl(base, ruta);
        if (url) {
            return url;
        }
    }

    return '';
}

/**
 * Obtiene la URL de la imagen del registro.
 */
function obtenerImagen(registro, settings) {
    if (!registro || typeof registro !== 'object') {
        return '';
    }

    const base = settings.url_filesLactancia || settings.url_files || '';
    const candidatos = [
        registro.imagen,
        registro.image,
        registro.foto,
        registro.url_imagen,
        registro.ruta_imagen,
        registro.portada
    ];

    for (const candidato of candidatos) {
        const ruta = normalizarTexto(candidato);
        const url = construirUrl(base, ruta);
        if (url) {
            return url;
        }
    }

    return '';
}

/**
 * Devuelve el nombre legible del archivo.
 */
function obtenerNombreArchivo(url) {
    if (!url) {
        return 'archivo';
    }

    try {
        const partes = url.split('/');
        const nombre = partes[partes.length - 1] || 'archivo';
        return nombre;
    } catch (e) {
        return 'archivo';
    }
}

/**
 * Normaliza un valor a texto plano.
 */
function normalizarTexto(valor) {
    if (valor === null || valor === undefined) {
        return '';
    }

    if (typeof valor === 'string') {
        return valor.trim();
    }

    if (typeof valor === 'number') {
        return String(valor);
    }

    if (typeof valor === 'object') {
        if (valor.descripcion) {
            return normalizarTexto(valor.descripcion);
        }

        if (valor.texto) {
            return normalizarTexto(valor.texto);
        }

        if (valor.url) {
            return normalizarTexto(valor.url);
        }
    }

    return '';
}

/**
 * Construye una URL absoluta en base a una ruta y un prefijo.
 */
function construirUrl(base, ruta) {
    if (!ruta) {
        return '';
    }

    if (/^https?:\/\//i.test(ruta)) {
        return ruta;
    }

    if (!base) {
        return ruta;
    }

    if (!base.endsWith('/') && ruta[0] !== '/') {
        return `${base}/${ruta}`;
    }

    return `${base}${ruta}`;
}