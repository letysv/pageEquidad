// Carga la información del equipo desde la API y la muestra en el contenedor
// principal definido en la configuración.
// @param {Object} settings - Configuración del módulo de equipo.


export function muestra(settings) {
    $.ajax({
        url: settings.url_apiEquipos || settings.url_api,
        method: "GET",
        dataType: "json",
        success: function (data) {
            renderEquipo(data, settings);
        },
        error: function () {
            renderEquipo([], settings, {
                mensaje: 'No fue posible cargar la información del equipo en este momento.'
            });
        }
    });
}

/**
 * Construye las tarjetas del equipo dentro del contenedor indicado.
 * @param {Array} data - Lista de personas que integran el equipo.
 * @param {Object} settings - Configuración del módulo.
 * @param {Object} [estado] - Estado adicional para mostrar mensajes personalizados.
 */

function renderEquipo(data, settings, estado = {}) {
    const integrantes = Array.isArray(data) ? data : [];
    const integrantesActivos = integrantes.filter((integrante) => integrante.activo !== false);
    const $mainContainer = $("#" + settings.main_container);
    $mainContainer.empty();

    const titulo = settings.title || 'Equipo';

    // Actualizar el título si se proporciona
     if (integrantesActivos.length === 0) {
        const mensaje = estado.mensaje || 'No hay integrantes del equipo disponibles en este momento.';
        const $contenidoVacio = $(`
            <header class="major">
                <h2 class="modulo-nombre">No hay notas disponibles en este momento.</h2>
                <div class="modulo-secciones"></div>
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
            <div class="modulo-secciones row g-4"></div>
        </header>
    `);
    
    const $cardsContainer = $encabezado.find('.modulo-secciones');
    integrantesActivos.forEach((integrante) => {
        const nombre = integrante.nombre || integrante.titulo || 'Integrante del equipo';
        const cargo = integrante.cargo || integrante.puesto || '';
        const descripcion = integrante.descripcion || integrante.resenia || '';
        const foto = obtenerFoto(integrante, settings);

        const $card = $(`
            <div class="col-12 col-sm-6 col-lg-4">
                <div class="card h-100 text-center">
                    ${foto ? `<img src="${foto}" class="card-img-top object-fit-cover" alt="${nombre}">` : ''}
                    <div class="card-body">
                        <h5 class="card-title">${nombre}</h5>
                        ${cargo ? `<p class="text-muted mb-2">${cargo}</p>` : ''}
                        ${descripcion ? `<p class="card-text">${descripcion}</p>` : ''}
                    </div>
                </div>
            </div>
        `);

        $cardsContainer.append($card);
    });
     $mainContainer.append($encabezado);
}

/**
 * Obtiene la ruta absoluta de la fotografía asociada al integrante.
 * @param {Object} integrante - Información del integrante.
 * @param {Object} settings - Configuración del módulo.
 * @returns {string|null} Ruta de la imagen o null si no existe.
 */
function obtenerFoto(integrante, settings) {
    const posiblesCampos = [
        integrante.foto,
        integrante.fotografia,
        integrante.imagen,
        integrante.archivo,
        integrante.url_foto,
        integrante?.items?.[0]?.archivo
    ].filter(Boolean);

    if (posiblesCampos.length === 0) {
        return null;
    }

    const base = settings.url_filesEquipo || settings.url_files || '';
    const baseConSlash = base && !base.endsWith('/') ? `${base}/` : base;
    return `${baseConSlash}${posiblesCampos[0]}`;
}