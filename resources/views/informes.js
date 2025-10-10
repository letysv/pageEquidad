/**
 * Muestra los informes legislativos agrupados por ejercicio en pestañas.
 * @param {Object} settings - Configuración del módulo de informes.
 */
export function muestra(settings = {}) {
    const url = settings.url_apiInformes || settings.url_api;

    if (!url) {
        renderInformes([], settings, {
            mensaje: 'No hay una URL configurada para consultar los informes.'
        });
        return;
    }

    $.ajax({
        url,
        method: 'GET',
        dataType: 'json',
        success: function (data) {
            renderInformes(data, settings);
        },
        error: function () {
            renderInformes([], settings, {
                mensaje: 'No fue posible cargar los informes en este momento.'
            });
        }
    });
}

/**
 * Renderiza el contenido de los informes agrupados por ejercicio.
 * @param {Array} data - Información recibida desde la API.
 * @param {Object} settings - Configuración del módulo.
 * @param {Object} [estado] - Estado adicional para mostrar mensajes.
 */
function renderInformes(data, settings, estado = {}) {
    const informes = Array.isArray(data) ? data : [];
    const informesActivos = informes.filter((informe) => informe.activo !== false);
    const $mainContainer = $('#' + settings.main_container);

    $mainContainer.empty();

    const titulo = settings.title || 'Informes Legislativos';
    const grupos = agruparPorEjercicio(informesActivos);

    if (!grupos.length) {
        const mensaje = estado.mensaje || 'No hay informes disponibles en este momento.';
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

    const $tabsWrapper = $(`
        <div class="informes-tabs">
            <ul class="nav nav-tabs" id="informes-tab" role="tablist"></ul>
            <div class="tab-content pt-3" id="informes-tabContent"></div>
        </div>
    `);

    const $tabList = $tabsWrapper.find('#informes-tab');
    const $tabContent = $tabsWrapper.find('#informes-tabContent');

    grupos.forEach((grupo, index) => {
        const ejercicio = grupo.nombre;
        const tabId = generarIdEjercicio(ejercicio, index);
        const esActivo = index === 0;

        const $tab = $(`
            <li class="nav-item" role="presentation">
                <button class="nav-link${esActivo ? ' active' : ''}" id="${tabId}-tab" data-bs-toggle="tab"
                    data-bs-target="#${tabId}" type="button" role="tab" aria-controls="${tabId}"
                    aria-selected="${esActivo}">
                    ${ejercicio}
                </button>
            </li>
        `);

        const informesDelEjercicio = grupo.informes;
        const $pane = $(`
            <div class="tab-pane fade${esActivo ? ' show active' : ''}" id="${tabId}" role="tabpanel"
                aria-labelledby="${tabId}-tab">
            </div>
        `);

        const contenido = informesDelEjercicio.length
            ? crearListadoInformes(informesDelEjercicio, settings)
            : crearMensajeSinInformes();

        $pane.html(contenido);

        $tabList.append($tab);
        $tabContent.append($pane);
    });

    $mainContainer.append($encabezado, $tabsWrapper);
}

/**
 * Agrupa los informes por su ejercicio correspondiente.
 * @param {Array} informes - Lista de informes activos.
 * @returns {Array} Lista de grupos con nombre del ejercicio e informes.
 */
function agruparPorEjercicio(informes) {
    const grupos = new Map();

    informes.forEach((informe) => {
        const nombreEjercicio = formatearEjercicio(obtenerEjercicio(informe));

        if (!grupos.has(nombreEjercicio)) {
            grupos.set(nombreEjercicio, []);
        }

        grupos.get(nombreEjercicio).push(informe);
    });

    return Array.from(grupos, ([nombre, items]) => ({
        nombre,
        informes: items
    }));
}

/**
 * Obtiene el valor del ejercicio desde un informe.
 * @param {Object} informe - Informe proporcionado por la API.
 * @returns {string} Nombre del ejercicio normalizado.
 */
function obtenerEjercicio(informe) {
    if (!informe || typeof informe !== 'object') {
        return 'Ejercicio';
    }

    const candidatos = [
        informe.ejercicio,
        informe.nombre_ejercicio,
        informe.periodo,
        informe.ejercicio_nombre,
        informe.anio,
        informe.year
    ];

    for (const candidato of candidatos) {
        const valor = normalizarValorEjercicio(candidato);

        if (valor) {
            return valor;
        }
    }

    return 'Ejercicio';
}

/**
 * Normaliza los distintos formatos en los que puede llegar el ejercicio.
 * @param {*} valor - Valor potencial del ejercicio.
 * @returns {string} Valor normalizado o cadena vacía.
 */
function normalizarValorEjercicio(valor) {
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
        const candidatos = [
            valor.nombre,
            valor.titulo,
            valor.descripcion,
            valor.label,
            valor.valor,
            valor.ejercicio,
            valor.anio,
            valor.year
        ];

        for (const item of candidatos) {
            const texto = normalizarValorEjercicio(item);

            if (texto) {
                return texto;
            }
        }
    }

    return '';
}

/**
 * Crea el listado de informes a mostrar dentro de un ejercicio.
 * @param {Array} informes - Informes correspondientes al ejercicio.
 * @param {Object} settings - Configuración del módulo.
 * @returns {string} HTML generado para el listado.
 */
function crearListadoInformes(informes, settings) {
    const elementos = informes
        .map((informe) => crearElementoInforme(informe, settings))
        .join('');

    return `<div class="list-group list-group-flush">${elementos}</div>`;
}

/**
 * Crea la entrada visual para un informe individual.
 * @param {Object} informe - Informe a renderizar.
 * @param {Object} settings - Configuración del módulo.
 * @returns {string} HTML generado para el informe.
 */
function crearElementoInforme(informe, settings) {
    const titulo = obtenerTituloInforme(informe);
    const enlace = construirRutaArchivo(obtenerArchivoInforme(informe), settings);

    if (enlace) {
        return `
            <a class="list-group-item list-group-item-action" href="${enlace}" target="_blank" rel="noopener">
                ${titulo}
            </a>
        `;
    }

    return `
        <div class="list-group-item">
            ${titulo}
        </div>
    `;
}

/**
 * Obtiene el título del informe.
 * @param {Object} informe - Informe proporcionado por la API.
 * @returns {string} Título definido para el informe.
 */
function obtenerTituloInforme(informe) {
    return (
        (informe && (informe.titulo || informe.nombre || informe.tema)) ||
        'Informe'
    );
}

/**
 * Obtiene el nombre del archivo o URL de descarga del informe.
 * @param {Object} informe - Informe proporcionado por la API.
 * @returns {string|undefined} Nombre de archivo o URL.
 */
function obtenerArchivoInforme(informe) {
    if (!informe || typeof informe !== 'object') {
        return undefined;
    }

    const candidatosDirectos = [
        informe.archivo,
        informe.archivo_url,
        informe.url,
        informe.enlace,
        informe.link,
        informe?.archivo?.ruta,
        informe?.archivo?.url,
        informe?.archivo?.enlace
    ];

    const candidatosColecciones = [];

    if (Array.isArray(informe.archivos) && informe.archivos.length) {
        const primerArchivo = informe.archivos[0];
        candidatosColecciones.push(
            primerArchivo?.archivo,
            primerArchivo?.url,
            primerArchivo?.enlace,
            primerArchivo?.ruta
        );
    }

    if (Array.isArray(informe.items) && informe.items.length) {
        const primerItem = informe.items[0];
        candidatosColecciones.push(
            primerItem?.archivo,
            primerItem?.url,
            primerItem?.enlace,
            primerItem?.ruta
        );
    }

    const candidatos = [...candidatosDirectos, ...candidatosColecciones];

    for (const candidato of candidatos) {
        if (typeof candidato === 'string' && candidato.trim()) {
            return candidato.trim();
        }
    }

    return undefined;
}

/**
 * Construye la ruta completa hacia el archivo del informe.
 * @param {string} archivo - Ruta parcial o URL del archivo.
 * @param {Object} settings - Configuración con URLs base.
 * @returns {string|undefined} Ruta completa o indefinida si no hay archivo.
 */
function construirRutaArchivo(archivo, settings) {
    if (!archivo) {
        return undefined;
    }

    if (/^https?:\/\//i.test(archivo)) {
        return archivo;
    }

    const base = settings.url_filesInformes || settings.url_files;

    if (!base) {
        return archivo;
    }

    const baseNormalizada = base.endsWith('/') ? base.slice(0, -1) : base;
    const archivoNormalizado = archivo.startsWith('/') ? archivo.slice(1) : archivo;

    return `${baseNormalizada}/${archivoNormalizado}`;
}

/**
 * Formatea el nombre del ejercicio para usarlo como título de pestaña.
 * @param {string} ejercicio - Nombre del ejercicio.
 * @returns {string} Nombre formateado.
 */
function formatearEjercicio(ejercicio) {
    if (!ejercicio) {
        return 'Ejercicio';
    }

    const texto = String(ejercicio).trim();

    if (/^\d{4}$/.test(texto)) {
        return `Ejercicio ${texto}`;
    }

    return capitalizar(texto);
}

/**
 * Genera un identificador único para cada pestaña de ejercicio.
 * @param {string} ejercicio - Nombre del ejercicio.
 * @param {number} index - Índice del grupo.
 * @returns {string} Identificador único.
 */
function generarIdEjercicio(ejercicio, index) {
    const base = String(ejercicio || 'ejercicio').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `${base || 'ejercicio'}-${index}`;
}

/**
 * Crea el mensaje que se muestra cuando no hay informes en un ejercicio.
 * @returns {string} HTML del mensaje.
 */
function crearMensajeSinInformes() {
    return `
        <div class="alert alert-secondary" role="alert">
            No hay informes disponibles para este ejercicio.
        </div>
    `;
}

/**
 * Convierte una cadena a formato de título.
 * @param {string} texto - Cadena a capitalizar.
 * @returns {string} Cadena capitalizada.
 */
function capitalizar(texto) {
    return String(texto)
        .toLowerCase()
        .split(' ')
        .filter(Boolean)
        .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
        .join(' ');
}