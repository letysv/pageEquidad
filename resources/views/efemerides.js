let estilosIncrustados = false;

const MESES = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre'
];

/**
 * Carga las efemérides desde la API y las muestra agrupadas por mes.
 * @param {Object} settings - Configuración del módulo de efemérides.
 */
export function muestra(settings = {}) {
    insertarEstilos();

    $.ajax({
        url: settings.url_apiEfemerides || settings.url_api,
        method: 'GET',
        dataType: 'json',
        success: function (data) {
            renderEfemerides(data, settings);
        },
        error: function () {
            renderEfemerides([], settings, {
                mensaje: 'No fue posible cargar las efemérides en este momento.'
            });
        }
    });
}

/**
 * Renderiza el módulo de efemérides con los datos recibidos.
 * @param {Array} data - Lista de efemérides obtenidas desde la API.
 * @param {Object} settings - Configuración del módulo.
 * @param {Object} [estado] - Estado adicional para mostrar mensajes personalizados.
 */
function renderEfemerides(data, settings, estado = {}) {
    const efemerides = Array.isArray(data) ? data : [];
    const efemeridesActivas = efemerides.filter((efemeride) => efemeride?.activo !== false);
    const efemeridesConImagen = efemeridesActivas.filter((efemeride) => Boolean(obtenerImagen(efemeride, settings)));

    const $mainContainer = $('#' + (settings.main_container || 'main_container'));
    $mainContainer.empty();

    const titulo = settings.title || 'Efemérides';

    if (efemeridesConImagen.length === 0) {
        const mensaje = estado.mensaje || 'No hay efemérides disponibles en este momento.';
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

    const mesActual = obtenerMesActual();
    const mapaPorMes = agruparPorMes(efemeridesConImagen);
    const mesInicial = mapaPorMes.has(mesActual) ? mesActual : obtenerPrimerMesConContenido(mapaPorMes) || mesActual;

    const $encabezado = $(`
        <header class="major">
            <h2 class="modulo-nombre">${titulo}</h2>
        </header>
    `);

    const $controles = $(`
        <div class="efemerides-controles mb-4">
            <label for="efemerides-select" class="form-label">Selecciona un mes</label>
            <select id="efemerides-select" class="form-select efemerides-select">
                ${generarOpcionesMeses(mesInicial)}
            </select>
        </div>
    `);

    const $contenido = $('<div id="efemerides-contenido" class="efemerides-contenido"></div>');

    $mainContainer.append($encabezado, $controles, $contenido);

    const actualizarContenido = (mesSeleccionado) => {
        const eventos = mapaPorMes.get(mesSeleccionado) || [];
        mostrarEfemeridesDelMes(eventos, $contenido, settings, mesSeleccionado);
    };

    $controles.find('#efemerides-select').on('change', function () {
        const mesSeleccionado = Number.parseInt($(this).val(), 10);
        actualizarContenido(mesSeleccionado);
    });

    actualizarContenido(mesInicial);
}

/**
 * Muestra las efemérides correspondientes al mes seleccionado.
 * @param {Array} efemeridesDelMes - Efemérides del mes actual.
 * @param {jQuery} $contenedor - Contenedor donde se renderizarán las tarjetas.
 * @param {Object} settings - Configuración del módulo.
 * @param {number} mesSeleccionado - Mes seleccionado.
 */
function mostrarEfemeridesDelMes(efemeridesDelMes, $contenedor, settings, mesSeleccionado) {
    $contenedor.empty();

    if (efemeridesDelMes.length === 0) {
        const nombreMes = MESES[mesSeleccionado - 1] || 'este mes';
        $contenedor.append(`
            <div class="alert alert-secondary" role="alert">
                No hay efemérides registradas para ${nombreMes}.
            </div>
        `);
        return;
    }

    const $card = $('<div class="card efemerides-card"></div>');
    const $cardBody = $('<div class="card-body"></div>');
    const $grid = $('<div class="efemerides-items-grid"></div>');

    inicializarVisorDeImagenes();

    efemeridesDelMes.forEach((efemeride) => {
        const titulo = obtenerTitulo(efemeride);
        const imagen = obtenerImagen(efemeride, settings);

        if (!imagen) {
            return;
        }

        const $item = $('<div class="efemerides-item text-center"></div>');
        const $imagen = $('<img class="img-fluid efemerides-imagen">');
        $imagen.attr('src', imagen);
        $imagen.attr('alt', titulo || 'Imagen de efeméride');
        $imagen.on('click', () => {
            mostrarImagenEnVisor({
                src: imagen,
                titulo
            });
        });

        $item.append($imagen);
        $grid.append($item);
    });

    $cardBody.append($grid);
    $card.append($cardBody);
    $contenedor.append($card);
}

/**
 * Agrupa las efemérides por el mes al que pertenecen.
 * @param {Array} efemerides - Lista de efemérides.
 * @returns {Map<number, Array>} Mapa de mes a efemérides.
 */
function agruparPorMes(efemerides) {
    const mapa = new Map();

    efemerides.forEach((efemeride) => {
        const mes = obtenerMesDeEfemeride(efemeride);

        if (!mes) {
            return;
        }

        if (!mapa.has(mes)) {
            mapa.set(mes, []);
        }

        mapa.get(mes).push(efemeride);
    });

    return mapa;
}

/**
 * Obtiene el primer mes que contiene efemérides.
 * @param {Map<number, Array>} mapa - Mapa de meses y efemérides.
 * @returns {number|null} Mes disponible o null si no existe.
 */
function obtenerPrimerMesConContenido(mapa) {
    const mesesOrdenados = Array.from(mapa.keys()).sort((a, b) => a - b);
    return mesesOrdenados.length ? mesesOrdenados[0] : null;
}

/**
 * Devuelve el mes actual como número (1-12).
 * @returns {number} Mes actual.
 */
function obtenerMesActual() {
    return new Date().getMonth() + 1;
}

/**
 * Genera las opciones del select de meses.
 * @param {number} mesSeleccionado - Mes que debe aparecer seleccionado.
 * @returns {string} HTML con las opciones del select.
 */
function generarOpcionesMeses(mesSeleccionado) {
    return MESES.map((mes, indice) => {
        const valor = indice + 1;
        const seleccionado = valor === mesSeleccionado ? 'selected' : '';
        return `<option value="${valor}" ${seleccionado}>${mes}</option>`;
    }).join('');
}

/**
 * Obtiene el mes correspondiente a una efeméride.
 * @param {Object} efemeride - Efeméride de origen.
 * @returns {number|null} Mes de la efeméride (1-12) o null si no se puede determinar.
 */
function obtenerMesDeEfemeride(efemeride) {
    if (!efemeride) {
        return null;
    }

    if (typeof efemeride.mes === 'number') {
        return normalizarMesNumero(efemeride.mes);
    }

    if (typeof efemeride.mes === 'string') {
        return normalizarMesTexto(efemeride.mes);
    }

    const posiblesFechas = [
        efemeride.fecha,
        efemeride.fecha_evento,
        efemeride.fecha_efemeride,
        efemeride.fecha_publicacion
    ].filter(Boolean);

    for (const fecha of posiblesFechas) {
        const mes = obtenerMesDesdeFecha(fecha);
        if (mes) {
            return mes;
        }
    }

    return null;
}

/**
 * Convierte un número de mes en un valor válido (1-12).
 * @param {number} mes - Mes a normalizar.
 * @returns {number|null} Mes normalizado o null si es inválido.
 */
function normalizarMesNumero(mes) {
    const numero = Number.parseInt(mes, 10);

    if (Number.isNaN(numero)) {
        return null;
    }

    if (numero < 1 || numero > 12) {
        return null;
    }

    return numero;
}

/**
 * Convierte un texto de mes en su número correspondiente.
 * @param {string} mesTexto - Texto que representa el mes.
 * @returns {number|null} Número de mes o null si no coincide.
 */
function normalizarMesTexto(mesTexto) {
    const textoNormalizado = eliminarDiacriticos(String(mesTexto).trim().toLowerCase());

    const indice = MESES.findIndex((mes) => eliminarDiacriticos(mes.toLowerCase()) === textoNormalizado);

    if (indice !== -1) {
        return indice + 1;
    }

    const numero = Number.parseInt(textoNormalizado, 10);
    return normalizarMesNumero(numero);
}

/**
 * Obtiene el mes a partir de una fecha.
 * @param {string|Date} fecha - Fecha de origen.
 * @returns {number|null} Mes correspondiente o null si es inválido.
 */
function obtenerMesDesdeFecha(fecha) {
    if (!fecha) {
        return null;
    }

    const fechaObjeto = fecha instanceof Date ? fecha : new Date(fecha);

    if (Number.isNaN(fechaObjeto.getTime())) {
        return null;
    }

    return fechaObjeto.getMonth() + 1;
}

/**
 * Obtiene la ruta de la imagen asociada a una efeméride.
 * @param {Object} efemeride - Efeméride de origen.
 * @param {Object} settings - Configuración del módulo.
 * @returns {string|null} Ruta de la imagen o null si no existe.
 */
function obtenerImagen(efemeride, settings) {
    const posiblesCampos = [
        efemeride.imagen,
        efemeride.image,
        efemeride.archivo,
        efemeride.url_imagen,
        efemeride?.archivo?.ruta,
        efemeride?.items?.[0]?.archivo
    ].filter(Boolean);

    if (!posiblesCampos.length) {
        return null;
    }

    const nombreArchivo = posiblesCampos[0];

    if (/^https?:\/\//i.test(nombreArchivo)) {
        return nombreArchivo;
    }

    const base = settings.url_filesEfemerides || settings.url_files || '';
    const baseConSlash = base && !base.endsWith('/') ? `${base}/` : base;

    return `${baseConSlash}${nombreArchivo}`;
}

/**
 * Obtiene el título de una efeméride.
 * @param {Object} efemeride - Efeméride de origen.
 * @returns {string} Título a mostrar.
 */
function obtenerTitulo(efemeride) {
    return (
        efemeride.titulo ||
        efemeride.nombre ||
        efemeride.encabezado ||
        'Efeméride'
    );
}

/**
 * Inserta los estilos necesarios para el módulo si aún no se han agregado.
 */
function insertarEstilos() {
    if (estilosIncrustados) {
        return;
    }

    const estilos = `
        <style id="efemerides-estilos">
            .efemerides-select {
                max-width: 280px;
            }

            .efemerides-card {
                border: 1px solid #e0e0e0;
                box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.05);
            }

            .efemerides-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.75rem;
                width: 100%;
                max-width: 220px;
                margin: 0 auto;
            }

            .efemerides-items-grid {
                display: grid;
                grid-template-columns: repeat(1, minmax(0, 1fr));
                gap: 1.5rem;
                justify-items: center;
            }

            @media (min-width: 576px) {
                .efemerides-items-grid {
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                }
            }

            @media (min-width: 992px) {
                .efemerides-items-grid {
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                }
            }

            .efemerides-imagen {
                width: 100%;
                max-width: 160px;
                max-height: 160px;
                object-fit: cover;
                border-radius: 0.5rem;
                cursor: pointer;
                transition: transform 0.2s ease;
            }

            .efemerides-imagen:hover {
                transform: scale(1.02);
            }

            .efemerides-visor {
                position: fixed;
                inset: 0;
                display: none;
                justify-content: center;
                align-items: center;
                background: rgba(0, 0, 0, 0.75);
                z-index: 1050;
                padding: 1.5rem;
            }

            .efemerides-visor.activo {
                display: flex;
            }

            .efemerides-visor-contenido {
                position: relative;
                max-width: min(720px, 100%);
                max-height: 90vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 1rem;
                background: #ffffff;
                padding: 1.5rem;
                border-radius: 0.75rem;
                box-shadow: 0 1.5rem 3rem rgba(0, 0, 0, 0.35);
            }

            .efemerides-visor-imagen {
                width: 100%;
                height: auto;
                max-height: 60vh;
                object-fit: contain;
                border-radius: 0.5rem;
            }

            .efemerides-visor-cerrar {
                position: absolute;
                top: 0.75rem;
                right: 0.75rem;
                background: transparent;
                border: none;
                font-size: 1.5rem;
                line-height: 1;
                color: #495057;
                cursor: pointer;
            }

            .efemerides-visor-cerrar:focus {
                outline: 2px solid #495057;
                outline-offset: 2px;
            }
        </style>
    `;

    $('head').append(estilos);
    estilosIncrustados = true;
}

let visorInicializado = false;
let $visorContenedor = null;
let $visorImagen = null;

function inicializarVisorDeImagenes() {
    if (visorInicializado) {
        return;
    }

    $visorContenedor = $(`
        <div class="efemerides-visor" role="dialog" aria-modal="true" aria-hidden="true">
            <div class="efemerides-visor-contenido">
                <button type="button" class="efemerides-visor-cerrar" aria-label="Cerrar">&times;</button>
                <img class="efemerides-visor-imagen" alt="Detalle de efeméride">
            </div>
        </div>
    `);

    $visorImagen = $visorContenedor.find('.efemerides-visor-imagen');

    const cerrarVisor = () => {
        $visorContenedor.removeClass('activo');
        $visorContenedor.attr('aria-hidden', 'true');
    };

    $visorContenedor.on('click', (evento) => {
        if ($(evento.target).is('.efemerides-visor, .efemerides-visor-cerrar')) {
            cerrarVisor();
        }
    });

    $(document).on('keydown', (evento) => {
        if (evento.key === 'Escape' && $visorContenedor.hasClass('activo')) {
            cerrarVisor();
        }
    });

    $('body').append($visorContenedor);

    visorInicializado = true;
}

function mostrarImagenEnVisor({ src, titulo }) {
    if (!visorInicializado || !src) {
        return;
    }

    $visorImagen.attr('src', src);
    $visorImagen.attr('alt', titulo || 'Detalle de efeméride');

    $visorContenedor.addClass('activo');
    $visorContenedor.attr('aria-hidden', 'false');
}

/**
 * Elimina acentos y diacríticos de un texto.
 * @param {string} texto - Texto de entrada.
 * @returns {string} Texto sin diacríticos.
 */
function eliminarDiacriticos(texto) {
    return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}