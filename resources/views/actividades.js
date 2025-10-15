/**
 * Módulo encargado de renderizar las actividades obtenidas desde la API.
 * Cada actividad representa un evento (por ejemplo "Eventos propios" o
 * "Eventos como invitado") y contiene una o varias notas asociadas.
 */
export function muestra(settings = {}) {
    const url = settings.url_apiActividades || settings.url_api;

    if (!url) {
        renderActividades([], settings, {
            mensaje: 'No hay una URL configurada para consultar las actividades.'
        });
        return;
    }

    $.ajax({
        url,
        method: 'GET',
        dataType: 'json',
        success: function (data) {
            renderActividades(data, settings);
        },
        error: function () {
            renderActividades([], settings, {
                mensaje: 'No fue posible cargar las actividades en este momento.'
            });
        }
    });
}

/**
 * Renderiza el módulo de actividades con pestañas por cada evento.
 * @param {Array|Object} data - Información devuelta por la API.
 * @param {Object} settings - Configuración del módulo.
 * @param {Object} [estado] - Estado adicional para mostrar mensajes personalizados.
 */
const PATRON_COLECCIONES_NOTAS = /(notas|notes|items|lista|entries|registros|eventos|actividades|activities)/i;
const CLAVES_DESCRIPCION_INCLUYE = /(descripcion|detalle|resumen|reseña|resena|nota|texto|contenido|story|body|parrafo|paragraph|mensaje|message|observacion|observación|review|comment|descripciongeneral|descripcion_larga|descripcion_corta|descripcion_nota|descripcionEvento|descripcionActividad)/i;
const CLAVES_DESCRIPCION_EXCLUYE = /(evento|actividad|imagen|foto|galeria|gallery|url|archivo|ruta|link|enlace|nombre|titulo|fecha|autor|creado|actualizado|modificado|id|uuid|folio|clave|codigo|slug|categoria|contacto)/i;

function renderActividades(data, settings, estado = {}) {
    const actividades = normalizarColeccion(data);
    const actividadesActivas = actividades.filter((actividad) => estaActiva(actividad));
    const actividadesPreparadas = prepararActividades(actividadesActivas);
    const $mainContainer = $('#' + (settings.main_container || 'main_container'));
    const titulo = settings.title || 'Actividades realizadas';

    $mainContainer.empty();

    if (!actividadesPreparadas.length) {
        const mensaje = estado.mensaje || 'No hay actividades disponibles en este momento.';
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

    const $tabsNav = $('<ul class="nav nav-tabs actividades-tabs" role="tablist"></ul>');
    const $tabContent = $('<div class="tab-content actividades-tab-content"></div>');

    actividadesPreparadas.forEach((actividad, index) => {
        const nombreActividad = obtenerNombreActividad(actividad, index);
        const tabId = generarIdTab(nombreActividad, index);
        const isActive = index === 0;

        const $tab = $(`
            <li class="nav-item" role="presentation">
                <button class="nav-link ${isActive ? 'active' : ''}"
                        id="${tabId}-tab"
                        data-bs-toggle="tab"
                        data-bs-target="#${tabId}"
                        type="button"
                        role="tab"
                        aria-controls="${tabId}"
                        aria-selected="${isActive}">
                    ${nombreActividad}
                </button>
            </li>
        `);

        const $pane = $('<div></div>');
        $pane.addClass(`tab-pane fade ${isActive ? 'show active' : ''}`)
            .attr({
                id: tabId,
                role: 'tabpanel',
                'aria-labelledby': `${tabId}-tab`
            });

        const $contenidoActividad = crearContenidoActividad(actividad, settings);
        $pane.append($contenidoActividad);

        $tabsNav.append($tab);
        $tabContent.append($pane);
    });

    $mainContainer.append($encabezado, $tabsNav, $tabContent);
}

/**
 * Obtiene la colección final de actividades, agrupando por evento si es necesario.
 * @param {Array} actividades - Lista de actividades obtenidas desde la API.
 * @returns {Array}
 */
function prepararActividades(actividades = []) {
    if (!actividades.length) {
        return [];
    }

    const existenNotasAnidadas = actividades.some((actividad) => obtenerNotasDeActividad(actividad).length);

    if (existenNotasAnidadas) {
        return fusionarActividadesPorNombre(actividades);
    }

    return agruparActividadesPorEvento(actividades);
}

/**
 * Agrupa elementos planos (notas) por el nombre del evento al que pertenecen.
 * @param {Array} actividades - Lista de notas planas devueltas por la API.
 * @returns {Array}
 */
function agruparActividadesPorEvento(actividades = []) {
    const grupos = new Map();

    actividades.forEach((nota, index) => {
        if (!nota || typeof nota !== 'object') {
            return;
        }

        const nombreEvento = obtenerNombreActividad(nota, index);
        const clave = obtenerClaveAgrupacionActividad(nota, index, nombreEvento);
        let grupo = grupos.get(clave);

        if (!grupo) {
            grupo = {
                nombre: nombreEvento,
                nombre_evento: nombreEvento,
                evento: nombreEvento,
                titulo: nombreEvento,
                notas: []
            };
            grupos.set(clave, grupo);
        }

        if (!Array.isArray(grupo.notas)) {
            grupo.notas = [];
        }

        if (!notaYaRegistrada(grupo.notas, nota)) {
            grupo.notas.push(nota);
        }

        const descripcionEvento = obtenerDescripcionEventoDesdeNota(nota);

        if (descripcionEvento && !obtenerDescripcionActividadPrincipal(grupo)) {
            grupo.descripcion = descripcionEvento;
            grupo.descripcion_evento = descripcionEvento;
            grupo.descripcionActividad = descripcionEvento;
        }
    });

    return Array.from(grupos.values());
}

/**
 * Fusiona actividades que ya contienen notas agrupándolas por el nombre o identificador del evento.
 * @param {Array} actividades - Lista de actividades devueltas por la API.
 * @returns {Array}
 */
function fusionarActividadesPorNombre(actividades = []) {
    const grupos = new Map();

    actividades.forEach((actividad, index) => {
        if (!actividad || typeof actividad !== 'object') {
            return;
        }

        const nombreActividad = obtenerNombreActividad(actividad, index);
        const clave = obtenerClaveAgrupacionActividad(actividad, index, nombreActividad);
        let existente = grupos.get(clave);

        if (!existente) {
            const base = { ...actividad };

            base.nombre = base.nombre || nombreActividad;
            base.nombre_evento = base.nombre_evento || nombreActividad;
            base.evento = base.evento || nombreActividad;
            base.titulo = base.titulo || nombreActividad;

            if (Array.isArray(base.notas)) {
                base.notas = base.notas.slice();
            } else {
                const notasIniciales = obtenerNotasDeActividad(base);
                base.notas = Array.isArray(notasIniciales) ? notasIniciales.slice() : [];
            }

            grupos.set(clave, base);
            existente = base;
        }

        const notasDestino = Array.isArray(existente.notas) ? existente.notas : (existente.notas = []);
        const nuevasNotas = obtenerNotasDeActividad(actividad);

        nuevasNotas.forEach((nota) => {
            if (!notaYaRegistrada(notasDestino, nota)) {
                notasDestino.push(nota);
            }
        });

        if (!obtenerDescripcionActividadPrincipal(existente)) {
            const descripcion = obtenerDescripcionActividadPrincipal(actividad);

            if (descripcion) {
                existente.descripcion = existente.descripcion || descripcion;
                existente.descripcion_evento = existente.descripcion_evento || descripcion;
                existente.descripcionActividad = existente.descripcionActividad || descripcion;
            }
        }

        const clavesGaleria = ['imagenes', 'fotos', 'galeria', 'gallery', 'images'];
        clavesGaleria.forEach((claveGaleria) => {
            if (!existente[claveGaleria] && actividad[claveGaleria]) {
                existente[claveGaleria] = actividad[claveGaleria];
            }
        });
    });

    return Array.from(grupos.values());
}

/**
 * Genera el contenido de una pestaña con las notas del evento.
 * @param {Object} actividad - Información del evento.
 * @param {Object} settings - Configuración general.
 * @returns {jQuery} Elemento con el contenido renderizado.
 */
function crearContenidoActividad(actividad, settings) {
    const notas = obtenerNotasDeActividad(actividad);
    const descripcionActividad = obtenerDescripcionActividadPrincipal(actividad);

    const $contenedor = $('<div class="actividades-actividad"></div>');

    if (descripcionActividad) {
        const $descripcion = $('<div class="actividad-descripcion lead"></div>').html(descripcionActividad);
        $contenedor.append($descripcion);
    }

    if (!notas.length) {
        const $alerta = $(`
            <div class="alert alert-secondary mt-3" role="alert">
                No hay notas registradas para este evento.
            </div>
        `);

        $contenedor.append($alerta);
        return $contenedor;
    }

    const $contenedorNotas = $('<div class="actividades-notas mt-4"></div>');

    notas.forEach((nota) => {
        const titulo = obtenerTituloNota(nota);
        const descripcion = obtenerDescripcionNota(nota);
        const fecha = formatearFecha(obtenerFechaNota(nota));
        const lugar = obtenerLugarNota(nota, actividad);
        const imagenes = obtenerImagenesRelacionadas(nota, actividad, settings);

        const $card = $('<article class="actividad-card card shadow-sm"></article>');
        const $cuerpo = $('<div class="card-body"></div>');

        if (titulo) {
            const $titulo = $('<h3 class="actividad-card__title h5 mb-3"></h3>').text(titulo);
            $cuerpo.append($titulo);
        }

        if (fecha) {
            const $fecha = $('<p class="actividad-card__fecha text-muted small mb-2"></p>').text(fecha);
            $cuerpo.append($fecha);
        }

        if (lugar) {
            const $lugar = $('<p class="actividad-card__lugar mb-2"></p>').html(`<span class="fw-semibold">Lugar:</span> ${lugar}`);
            $cuerpo.append($lugar);
        }

        if (descripcion) {
            const $descripcion = $('<p class="actividad-card__descripcion"></p>').html(descripcion);
            $cuerpo.append($descripcion);
        }

        $card.append($cuerpo);

        if (imagenes.length) {
            const $galeria = crearGaleriaImagenes(imagenes);
            $card.append($galeria);
        }

        $contenedorNotas.append($card);
    });

    $contenedor.append($contenedorNotas);

    return $contenedor;
}

/**
 * Crea la galería de imágenes asociadas a una nota o actividad.
 * @param {Array<string>} imagenes - URLs completas de las imágenes.
 * @returns {jQuery} Elemento con la galería renderizada.
 */
function crearGaleriaImagenes(imagenes = []) {
    const $galeria = $('<div class="actividad-card__galeria"></div>');

    imagenes.forEach((url) => {
        const $figura = $('<figure class="actividad-card__galeria-item"></figure>');
        const $imagen = $('<img class="actividad-card__imagen img-fluid" alt="Imagen relacionada" loading="lazy">');
        $imagen.attr('src', url);
        $figura.append($imagen);
        $galeria.append($figura);
    });

    return $galeria;
}

/**
 * Normaliza la colección de actividades en un arreglo.
 * @param {Array|Object} data - Datos devueltos por la API.
 * @returns {Array}
 */
function normalizarColeccion(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (data && typeof data === 'object') {
        const posiblesListas = [
            data.data,
            data.actividades,
            data.eventos,
            data.items,
            data.records,
            data.result
        ];

        for (const lista of posiblesListas) {
            if (Array.isArray(lista)) {
                return lista;
            }
        }
    }

    return [];
}

/**
 * Determina si una actividad está activa o visible.
 * @param {Object} actividad - Actividad a evaluar.
 * @returns {boolean}
 */
function estaActiva(actividad = {}) {
    const candidatos = [
        actividad.activo,
        actividad.visible,
        actividad.estado,
        actividad.estatus,
        actividad.habilitado,
        actividad.enabled
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
 * Obtiene el nombre descriptivo de la actividad.
 * @param {Object} actividad - Actividad a procesar.
 * @param {number} index - Índice de la actividad en la lista.
 * @returns {string}
 */
function obtenerNombreActividad(actividad = {}, index = 0) {
    const candidatos = [
        actividad.nombre,
        actividad.nombre_evento,
        actividad.nombreEvento,
        actividad.evento,
        actividad.evento_nombre,
        actividad.eventoNombre,
        actividad.titulo,
        actividad.titulo_evento,
        actividad.tituloEvento,
        actividad.tipo,
        actividad.tipo_evento,
        actividad.categoria,
        actividad.seccion,
        actividad.grupo,
        actividad.grupo_evento,
        actividad.grupoEvento
    ];

    for (const candidato of candidatos) {
        const texto = obtenerTextoPlano(candidato);

        if (texto) {
            return texto;
        }
    }

    if (actividad.evento && actividad.evento !== actividad && typeof actividad.evento === 'object') {
        const textoEvento = obtenerNombreActividad(actividad.evento, index);

        if (textoEvento && !/^Evento\s+\d+$/i.test(textoEvento)) {
            return textoEvento;
        }
    }

    if (actividad.categoria && actividad.categoria !== actividad && typeof actividad.categoria === 'object') {
        const textoCategoria = obtenerTextoPlano(actividad.categoria);

        if (textoCategoria) {
            return textoCategoria;
        }
    }

    return `Evento ${index + 1}`;
}

/**
 * Genera un identificador único para una pestaña.
 * @param {string} nombre - Nombre base del tab.
 * @param {number} index - Índice para asegurar unicidad.
 * @returns {string}
 */
function generarIdTab(nombre, index) {
    const base = normalizarTexto(nombre)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    const sufijo = index + 1;
    return `actividad-${base || 'tab'}-${sufijo}`;
}

/**
 * Obtiene un identificador estable para agrupar actividades o notas relacionadas con el mismo evento.
 * @param {Object} actividad - Actividad o nota que representa un evento.
 * @param {number} index - Índice del elemento dentro de la lista original.
 * @param {string} [nombreActividad] - Nombre previamente calculado del evento.
 * @returns {string}
 */
function obtenerClaveAgrupacionActividad(actividad = {}, index = 0, nombreActividad = '') {
    const identificadorEvento = normalizarTexto(obtenerIdentificadorEvento(actividad)).toLowerCase();

    if (identificadorEvento) {
        return `id:${identificadorEvento}`;
    }

    const nombre = normalizarTexto(nombreActividad || obtenerNombreActividad(actividad, index)).toLowerCase();

    if (nombre) {
        return `nombre:${nombre}`;
    }

    return `indice:${index + 1}`;
}

/**
 * Obtiene las notas asociadas a una actividad.
 * @param {Object} actividad - Actividad a procesar.
 * @returns {Array}
 */
function obtenerNotasDeActividad(actividad = {}) {
    const posiblesListas = [
        actividad.notas,
        actividad.items,
        actividad.eventos,
        actividad.registros,
        actividad.detalles,
        actividad.actividades
    ];

    for (const lista of posiblesListas) {
        if (Array.isArray(lista) && lista.length) {
            return lista;
        }
    }

    return [];
}

/**
 * Determina si una nota ya fue agregada a una colección para evitar duplicados.
 * @param {Array} notas - Colección actual de notas.
 * @param {Object} nota - Nota candidata a agregar.
 * @returns {boolean}
 */
function notaYaRegistrada(notas = [], nota = {}) {
    if (!Array.isArray(notas)) {
        return false;
    }

    const identificador = obtenerIdentificadorNota(nota);
    const huellaContenido = generarHuellaContenidoNota(nota);

    return notas.some((item) => {
        const identificadorExistente = obtenerIdentificadorNota(item);
        const huellaExistente = generarHuellaContenidoNota(item);

        const coincideIdentificador = identificador && identificadorExistente && identificadorExistente === identificador;
        const coincideHuella = huellaContenido && huellaExistente && huellaExistente === huellaContenido;

        if (coincideIdentificador) {
            if (huellaContenido && huellaExistente) {
                return coincideHuella;
            }

            return true;
        }

        return coincideHuella;
    });
}

/**
 * Genera una huella que identifica de forma consistente una nota.
 * @param {Object} nota - Nota a evaluar.
 * @returns {string}
 */
function obtenerIdentificadorNota(nota = {}) {
    if (!nota || typeof nota !== 'object') {
        return '';
    }

    const claves = Object.keys(nota);

    for (const clave of claves) {
        if (/evento/i.test(clave)) {
            continue;
        }

        const esIdDirecto = /^id$/i.test(clave);
        const esIdentificadorNota = /nota/i.test(clave) && /(id|uuid|guid|hash|clave|codigo|identificador)/i.test(clave);
        const esIdentificadorGenerico = /(uuid|guid)/i.test(clave) && !/evento/i.test(clave);

        if (!esIdDirecto && !esIdentificadorNota && !esIdentificadorGenerico) {
            continue;
        }

        const valor = nota[clave];

        if (valor === undefined || valor === null) {
            continue;
        }

        if (typeof valor === 'number') {
            return `id:${String(valor)}`;
        }

        if (typeof valor === 'string') {
            const texto = valor.trim();

            if (texto) {
                return `id:${texto.toLowerCase()}`;
            }
        }
    }

    return '';
}

function generarHuellaContenidoNota(nota = {}) {
    if (!nota || typeof nota !== 'object') {
        return '';
    }

    const titulo = limpiarTextoComparacion(obtenerTituloNota(nota));
    const descripcion = limpiarTextoComparacion(obtenerDescripcionNota(nota));
    const fecha = limpiarTextoComparacion(obtenerFechaNota(nota));

    const partes = [titulo, descripcion, fecha].filter(Boolean);

    if (!partes.length) {
        return '';
    }

    return partes.join(' | ').toLowerCase();
}

/**
 * Obtiene el título que se mostrará para una nota.
 * @param {Object} nota - Nota a procesar.
 * @returns {string}
 */
function obtenerTituloNota(nota = {}) {
    const candidatos = [
        nota.titulo,
        nota.nombre,
        nota.titulo_nota,
        nota.tituloNota,
        nota.encabezado
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
 * Obtiene la descripción o contenido de una nota.
 * @param {Object} nota - Nota a procesar.
 * @returns {string}
 */
function obtenerDescripcionNota(nota = {}) {
    const fragmentos = [];
    const candidatos = [
        nota.descripcion,
        nota.resumen,
        nota.detalle,
        nota.contenido,
        nota.cuerpo,
        nota.texto,
        nota.nota,
        nota.descripcion_larga,
        nota.descripcion_corta,
        nota.descripcion_general,
        nota.descripcionGeneral,
        nota.descripcion_nota,
        nota.descripcionNota,
        nota.descripcion_evento,
        nota.descripcionEvento,
        nota.descripcion_actividad,
        nota.descripcionActividad,
        nota.description,
        nota.summary,
        nota.body
    ];

    for (const candidato of candidatos) {
        if (candidato === undefined || candidato === null) {
            continue;
        }

        if (typeof candidato === 'string' || typeof candidato === 'number') {
            agregarFragmentoDescripcion(fragmentos, normalizarTexto(candidato, true));
            continue;
        }

        if (typeof candidato === 'object') {
            const encontrados = recolectarFragmentosDescripcion(candidato, { forzar: true });
            encontrados.forEach((texto) => agregarFragmentoDescripcion(fragmentos, texto));
        }
    }

    const explorados = recolectarFragmentosDescripcion(nota);
    explorados.forEach((texto) => agregarFragmentoDescripcion(fragmentos, texto));

    return fragmentos.join('<br>');
}

function obtenerLugarNota(nota = {}, actividad = {}) {
    const lugarNota = buscarLugarEnObjeto(nota);

    if (lugarNota) {
        return lugarNota;
    }

    const lugarActividad = buscarLugarEnObjeto(actividad);

    if (lugarActividad) {
        return lugarActividad;
    }

    if (actividad && typeof actividad === 'object') {
        const posiblesRelaciones = [actividad.evento, actividad.detalle, actividad.detalles, actividad.info];

        for (const relacion of posiblesRelaciones) {
            const lugarRelacionado = buscarLugarEnObjeto(relacion);

            if (lugarRelacionado) {
                return lugarRelacionado;
            }
        }
    }

    return '';
}

function buscarLugarEnObjeto(origen, visitados = new WeakSet()) {
    if (origen === undefined || origen === null) {
        return '';
    }

    if (typeof origen === 'string' || typeof origen === 'number') {
        return normalizarTexto(origen);
    }

    if (Array.isArray(origen)) {
        for (const item of origen) {
            const encontrado = buscarLugarEnObjeto(item, visitados);

            if (encontrado) {
                return encontrado;
            }
        }

        return '';
    }

    if (typeof origen !== 'object') {
        return '';
    }

    if (visitados.has(origen)) {
        return '';
    }

    visitados.add(origen);

    const clavesDirectas = [
        'lugar',
        'lugar_evento',
        'lugarEvento',
        'lugar_actividad',
        'lugarActividad',
        'lugar_presentacion',
        'ubicacion',
        'ubicación',
        'ubicacion_evento',
        'ubicacionEvento',
        'ubicacion_actividad',
        'ubicacionActividad',
        'sede',
        'sitio',
        'site',
        'venue',
        'place',
        'location',
        'direccion',
        'dirección',
        'domicilio',
        'domicilio_evento',
        'municipio',
        'ciudad',
        'localidad',
        'estado',
        'region',
        'región'
    ];

    for (const clave of clavesDirectas) {
        if (Object.prototype.hasOwnProperty.call(origen, clave)) {
            const texto = obtenerTextoPlano(origen[clave]);

            if (texto) {
                return texto;
            }
        }
    }

    const patronClave = /(lugar|ubicaci[oó]n|sede|direcci[oó]n|domicilio|municipio|localidad|ciudad|estado|regi[oó]n|site|sitio|venue|place|location)/i;

    for (const [clave, valor] of Object.entries(origen)) {
        if (!patronClave.test(clave)) {
            continue;
        }

        const texto = obtenerTextoPlano(valor);

        if (texto) {
            return texto;
        }
    }

    const relaciones = [
        origen.evento,
        origen.actividad,
        origen.detalle,
        origen.detalles,
        origen.informacion,
        origen.info,
        origen.metadata,
        origen.meta,
        origen.extra
    ];

    for (const relacion of relaciones) {
        if (!relacion || relacion === origen) {
            continue;
        }

        const texto = buscarLugarEnObjeto(relacion, visitados);

        if (texto) {
            return texto;
        }
    }

    return '';
}

function recolectarFragmentosDescripcion(origen, opciones = {}) {
    const { forzar = false, profundidadMaxima = 6 } = opciones;
    const fragmentos = [];
    const visitados = new WeakSet();
    const pila = [{ valor: origen, clave: opciones.clave || '', forzar, profundidad: 0 }];

    while (pila.length) {
        const { valor, clave, forzar: forzarActual, profundidad } = pila.pop();

        if (valor === undefined || valor === null) {
            continue;
        }

        if (profundidad > profundidadMaxima) {
            continue;
        }

        if (typeof valor === 'string' || typeof valor === 'number') {
            const texto = normalizarTexto(valor, true);

            if (!texto) {
                continue;
            }

            if (forzarActual || CLAVES_DESCRIPCION_INCLUYE.test(clave)) {
                agregarFragmentoDescripcion(fragmentos, texto);
            }

            continue;
        }

        if (typeof valor !== 'object') {
            continue;
        }

        if (visitados.has(valor)) {
            continue;
        }

        visitados.add(valor);

        if (Array.isArray(valor)) {
            if (!forzarActual && CLAVES_DESCRIPCION_EXCLUYE.test(clave)) {
                continue;
            }

            if (!forzarActual && PATRON_COLECCIONES_NOTAS.test(clave) && pareceColeccionNotas(valor)) {
                continue;
            }

            for (const item of valor) {
                pila.push({ valor: item, clave, forzar: forzarActual, profundidad: profundidad + 1 });
            }

            continue;
        }

        const entradas = Object.entries(valor);

        for (const [subClave, subValor] of entradas) {
            if (!forzarActual && CLAVES_DESCRIPCION_EXCLUYE.test(subClave)) {
                continue;
            }

            if (!forzarActual && PATRON_COLECCIONES_NOTAS.test(subClave) && pareceColeccionNotas(subValor)) {
                continue;
            }

            const siguienteForzar = forzarActual || CLAVES_DESCRIPCION_INCLUYE.test(subClave);
            pila.push({ valor: subValor, clave: subClave, forzar: siguienteForzar, profundidad: profundidad + 1 });
        }
    }

    return fragmentos;
}

function agregarFragmentoDescripcion(fragmentos, texto) {
    if (!texto) {
        return;
    }

    const llave = texto.replace(/\s+/g, ' ').trim();

    if (!llave) {
        return;
    }

    if (!fragmentos.some((existente) => existente.replace(/\s+/g, ' ').trim() === llave)) {
        fragmentos.push(texto);
    }
}

function pareceColeccionNotas(valor) {
    if (!Array.isArray(valor)) {
        return false;
    }

    return valor.some((item) => pareceNotaIndependiente(item));
}

function pareceNotaIndependiente(item) {
    if (!item || typeof item !== 'object') {
        return false;
    }

    const claves = Object.keys(item);

    if (!claves.length) {
        return false;
    }

    const textoClaves = claves.join(' ').toLowerCase();

    if (/(evento|actividad)/.test(textoClaves) && /(nota|id|uuid|folio|clave)/.test(textoClaves)) {
        return true;
    }

    return false;
}

/**
 * Obtiene la descripción del evento almacenada dentro de una nota plana.
 * @param {Object} nota - Nota individual devuelta por la API.
 * @returns {string}
 */
function obtenerDescripcionEventoDesdeNota(nota = {}) {
    const candidatos = [
        nota.descripcion_evento,
        nota.descripcionEvento,
        nota.descripcion_del_evento,
        nota.descripcionDelEvento,
        nota.descripcion_actividad,
        nota.descripcionActividad,
        nota.resumen_evento,
        nota.resumenEvento
    ];

    for (const candidato of candidatos) {
        const texto = normalizarTexto(candidato, true);

        if (texto) {
            return texto;
        }
    }

    return '';
}

/**
 * Obtiene la descripción general de la actividad (evento).
 * @param {Object} actividad - Actividad o grupo de notas a procesar.
 * @returns {string}
 */
function obtenerDescripcionActividadPrincipal(actividad = {}) {
    const candidatos = [
        actividad.descripcion_evento,
        actividad.descripcionEvento,
        actividad.descripcion_actividad,
        actividad.descripcionActividad,
        actividad.descripcion,
        actividad.resumen,
        actividad.detalle,
        actividad.texto,
        actividad.contenido
    ];

    for (const candidato of candidatos) {
        const texto = normalizarTexto(candidato, true);

        if (texto) {
            return texto;
        }
    }

    return '';
}

/**
 * Obtiene un identificador proveniente del evento asociado a una actividad o nota.
 * @param {Object} actividad - Actividad o nota que puede contener referencias al evento.
 * @returns {string}
 */
function obtenerIdentificadorEvento(actividad = {}) {
    if (!actividad || typeof actividad !== 'object') {
        return '';
    }

    const candidatos = [
        actividad.evento_id,
        actividad.id_evento,
        actividad.idEvento,
        actividad.eventoId,
        actividad.identificador_evento,
        actividad.identificadorEvento,
        actividad.clave_evento,
        actividad.claveEvento,
        actividad.codigo_evento,
        actividad.codigoEvento,
        actividad.slug_evento,
        actividad.slugEvento,
        actividad.evento_slug,
        actividad.eventoSlug,
        actividad.uuid_evento,
        actividad.uuidEvento
    ];

    for (const candidato of candidatos) {
        const texto = normalizarTexto(obtenerTextoPlano(candidato)).toLowerCase();

        if (texto) {
            return texto;
        }
    }

    if (actividad.evento && actividad.evento !== actividad && typeof actividad.evento === 'object') {
        const identificadorEvento = obtenerIdentificadorEvento(actividad.evento);

        if (identificadorEvento) {
            return identificadorEvento;
        }
    }

    if (actividad.categoria && actividad.categoria !== actividad && typeof actividad.categoria === 'object') {
        const identificadorCategoria = obtenerIdentificadorEvento(actividad.categoria);

        if (identificadorCategoria) {
            return identificadorCategoria;
        }
    }

    return '';
}

/**
 * Obtiene la fecha asociada a una nota.
 * @param {Object} nota - Nota a procesar.
 * @returns {string|Date|undefined}
 */
function obtenerFechaNota(nota = {}) {
    const candidatos = [
        nota.fecha,
        nota.fecha_evento,
        nota.fechaEvento,
        nota.fecha_publicacion,
        nota.fechaPublicacion,
        nota.publicado_en,
        nota.created_at,
        nota.updated_at
    ];

    for (const candidato of candidatos) {
        if (!candidato) {
            continue;
        }

        return candidato;
    }

    return undefined;
}

/**
 * Obtiene las imágenes relacionadas con una nota.
 * @param {Object} nota - Nota o actividad hija.
 * @param {Object} actividad - Actividad padre, por si las imágenes están a ese nivel.
 * @param {Object} settings - Configuración con la ruta base de archivos.
 * @returns {Array<string>} - URLs absolutas de las imágenes.
 */
function obtenerImagenesRelacionadas(nota = {}, actividad = {}, settings = {}) {
    const baseUrl = construirRutaArchivos(settings.url_filesActividades || settings.url_files);
    const imagenesNota = extraerImagenesDesdeEntidad(nota, baseUrl);

    if (imagenesNota.length) {
        return imagenesNota;
    }

    if (actividad && actividad !== nota) {
        return extraerImagenesDesdeEntidad(actividad, baseUrl);
    }

    return [];
}

function extraerImagenesDesdeEntidad(entidad = {}, baseUrl = '') {
    if (!entidad || typeof entidad !== 'object') {
        return [];
    }

    const imagenes = new Set();

    const candidatosDirectos = [
        entidad.imagen,
        entidad.foto,
        entidad.portada,
        entidad.imagen_destacada,
        entidad.archivo
    ];

    candidatosDirectos.forEach((imagen) => {
        const url = construirUrlImagen(baseUrl, imagen);
        if (url && esArchivoImagen(url)) {
            imagenes.add(url);
        }
    });

    const colecciones = [
        entidad.imagenes,
        entidad.images,
        entidad.fotos,
        entidad.galeria,
        entidad.gallery,
        entidad.items
    ];

    colecciones.forEach((lista) => {
        if (!Array.isArray(lista)) {
            return;
        }

        lista.forEach((item) => {
            const candidato = typeof item === 'string' ? item : item?.archivo || item?.url || item?.imagen;
            const url = construirUrlImagen(baseUrl, candidato);
            if (url && esArchivoImagen(url)) {
                imagenes.add(url);
            }
        });
    });

    return Array.from(imagenes);
}

/**
 * Construye la URL absoluta a partir de la ruta base y el nombre del archivo.
 * @param {string} baseUrl - Ruta base de los archivos.
 * @param {string} archivo - Nombre o ruta relativa del archivo.
 * @returns {string|undefined}
 */
function construirUrlImagen(baseUrl, archivo) {
    if (archivo === undefined || archivo === null) {
        return undefined;
    }

    if (typeof archivo === 'number') {
        archivo = String(archivo);
    }

    if (typeof archivo !== 'string') {
        return undefined;
    }

    const referencia = archivo.trim();

    if (!referencia) {
        return undefined;
    }

    if (/^https?:\/\//i.test(referencia)) {
        return referencia;
    }

    if (!baseUrl) {
        return referencia.replace(/^\/+/, '');
    }

    return baseUrl + referencia.replace(/^\/+/, '');
}

/**
 * Determina si una ruta corresponde a un archivo de imagen.
 * @param {string} ruta - Ruta o URL del recurso.
 * @returns {boolean}
 */
function esArchivoImagen(ruta = '') {
    if (!ruta) {
        return false;
    }

    const referencia = ruta.split('?')[0].toLowerCase();
    return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(referencia);
}

/**
 * Asegura que la ruta base termine con una diagonal.
 * @param {string} rutaBase - Ruta base proporcionada en la configuración.
 * @returns {string}
 */
function construirRutaArchivos(rutaBase = '') {
    if (!rutaBase) {
        return '';
    }

    return rutaBase.endsWith('/') ? rutaBase : rutaBase + '/';
}

/**
 * Obtiene una representación textual de un valor que puede ser un objeto o arreglo.
 * @param {*} valor - Valor a evaluar.
 * @param {boolean} [permitirHtml=false] - Indica si se conservan etiquetas HTML básicas.
 * @returns {string}
 */
function obtenerTextoPlano(valor, permitirHtml = false) {
    if (valor === undefined || valor === null) {
        return '';
    }

    if (typeof valor === 'string' || typeof valor === 'number') {
        return normalizarTexto(valor, permitirHtml);
    }

    if (Array.isArray(valor)) {
        for (const item of valor) {
            const texto = obtenerTextoPlano(item, permitirHtml);

            if (texto) {
                return texto;
            }
        }

        return '';
    }

    if (typeof valor === 'object') {
        const posiblesClaves = [
            'nombre',
            'nombre_evento',
            'nombreEvento',
            'titulo',
            'titulo_evento',
            'tituloEvento',
            'texto',
            'descripcion',
            'label',
            'nombreCategoria'
        ];

        for (const clave of posiblesClaves) {
            if (Object.prototype.hasOwnProperty.call(valor, clave)) {
                const texto = obtenerTextoPlano(valor[clave], permitirHtml);

                if (texto) {
                    return texto;
                }
            }
        }
    }

    return '';
}

/**
 * Normaliza un valor de texto.
 * @param {*} valor - Valor a transformar en texto.
 * @param {boolean} [permitirHtml=false] - Si se debe conservar etiquetas HTML básicas.
 * @returns {string}
 */
function normalizarTexto(valor, permitirHtml = false) {
    if (valor === undefined || valor === null) {
        return '';
    }

    if (typeof valor === 'number') {
        return String(valor);
    }

    if (typeof valor !== 'string') {
        return '';
    }

    const texto = valor.trim();

    if (!permitirHtml) {
        return texto.replace(/\s+/g, ' ');
    }

    return texto;
}

function limpiarTextoComparacion(valor) {
    if (valor === undefined || valor === null) {
        return '';
    }

    if (typeof valor === 'number') {
        return String(valor);
    }

    if (valor instanceof Date) {
        if (isNaN(valor.getTime())) {
            return '';
        }

        return valor.toISOString();
    }

    if (typeof valor !== 'string') {
        return '';
    }

    return valor
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Convierte una fecha a la cadena "25 de junio de 2025".
 * @param {string|Date} fecha - Fecha a formatear.
 * @returns {string}
 */
function formatearFecha(fecha) {
    if (!fecha) {
        return '';
    }

    const date = convertirAFecha(fecha);

    if (!date || isNaN(date.getTime())) {
        return '';
    }

    const dia = date.getDate();
    const mes = obtenerNombreMes(date.getMonth());
    const anio = date.getFullYear();

    return `${dia} de ${mes} de ${anio}`;
}

/**
 * Convierte diversos formatos de fecha a un objeto Date.
 * @param {string|Date} valor - Valor que representa la fecha.
 * @returns {Date|undefined}
 */
function convertirAFecha(valor) {
    if (valor instanceof Date) {
        return valor;
    }

    if (typeof valor !== 'string') {
        return undefined;
    }

    const texto = valor.trim();

    if (!texto) {
        return undefined;
    }

    // Manejar fechas en formato "YYYY-MM-DD" sin hora como UTC para evitar desfaces.
    if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
        const [anio, mes, dia] = texto.split('-').map(Number);
        return new Date(anio, mes - 1, dia);
    }

    // Reemplazar espacios por 'T' en caso de formato incompleto.
    const normalizado = texto.replace(' ', 'T');
    const fecha = new Date(normalizado);

    if (!isNaN(fecha.getTime())) {
        return fecha;
    }

    return undefined;
}

/**
 * Devuelve el nombre del mes en español.
 * @param {number} indiceMes - Índice del mes (0-11).
 * @returns {string}
 */
function obtenerNombreMes(indiceMes) {
    const meses = [
        'enero',
        'febrero',
        'marzo',
        'abril',
        'mayo',
        'junio',
        'julio',
        'agosto',
        'septiembre',
        'octubre',
        'noviembre',
        'diciembre'
    ];

    return meses[indiceMes] || '';
}

export default { muestra };