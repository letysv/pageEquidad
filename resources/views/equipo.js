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
    for (let i = 0; i < integrantesActivos.length; i += 3) {
        const grupo = integrantesActivos.slice(i, i + 3);

        const miembrosMarkup = grupo
            .map((integrante) => {
                const nombre = integrante.nombre || integrante.titulo || 'Integrante del equipo';
                const cargo = integrante.cargo || integrante.puesto || '';
                const descripcion = integrante.descripcion || integrante.resenia || '';
                const foto = obtenerFoto(integrante, settings);
                const iniciales = !foto ? obtenerIniciales(nombre) : '';

                return `
                    <div class="team-member text-center">
                        ${foto ? `
                            <div class="team-avatar mx-auto">
                                <img src="${foto}" class="team-avatar-image" alt="${nombre}">
                            </div>
                        ` : `
                            <div class="team-avatar team-avatar-placeholder mx-auto">${iniciales}</div>
                        `}
                        <div class="team-member-info">
                            <h5 class="team-member-name">${nombre}</h5>
                            ${cargo ? `<p class="team-member-role text-muted mb-1">${cargo}</p>` : ''}
                            ${descripcion ? `<p class="team-member-description">${descripcion}</p>` : ''}
                        </div>
                    </div>
                `;
            })
            .join('');

        const $card = $(`
            <div class="col-12">
                <div class="card team-group-card border-0">
                    <div class="card-body">
                        <div class="team-group-row justify-content-center">
                            ${miembrosMarkup}
                        </div>
                    </div>
                </div>
            </div>
                            </div>
                    </div>
                </div>
            </div>
        `);

        $cardsContainer.append($card);
    }
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

function obtenerIniciales(nombre) {
    if (!nombre) {
        return '';
    }

    return nombre
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte[0].toUpperCase())
        .join('');
}