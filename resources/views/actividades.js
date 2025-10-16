/**
 * Módulo encargado de renderizar las actividades obtenidas desde la API.
 * Cada actividad representa un evento y contiene una o varias notas asociadas.
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
            console.log('Datos recibidos:', data); // Para debug
            renderActividades(data, settings);
        },
        error: function (xhr, status, error) {
            console.error('Error cargando actividades:', error);
            renderActividades([], settings, {
                mensaje: 'No fue posible cargar las actividades en este momento.'
            });
        }
    });
}

/**
 * Renderiza el módulo de actividades con pestañas por cada evento.
 */
function renderActividades(data, settings, estado = {}) {
    const actividades = normalizarColeccion(data);
    const actividadesActivas = actividades.filter((actividad) => estaActiva(actividad));
    const actividadesAgrupadas = agruparActividadesPorEvento(actividadesActivas, settings);
    
    console.log('Actividades agrupadas:', actividadesAgrupadas); // Para debug
    
    const $mainContainer = $('#' + (settings.main_container || 'main_container'));
    const titulo = settings.title || 'Actividades realizadas';

    $mainContainer.empty();

    if (!actividadesAgrupadas.length) {
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

    actividadesAgrupadas.forEach((grupo, index) => {
        const nombreEvento = grupo.nombre || `Evento ${index + 1}`;
        const tabId = `actividad-${normalizarTexto(nombreEvento).toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${index + 1}`;
        const isActive = index === 0;

        // Crear pestaña
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
                    ${nombreEvento}
                </button>
            </li>
        `);

        // Crear contenido de la pestaña
        const $pane = $(`
            <div class="tab-pane fade ${isActive ? 'show active' : ''}"
                 id="${tabId}"
                 role="tabpanel"
                 aria-labelledby="${tabId}-tab">
            </div>
        `);

        // Crear contenedor para las notas
        const $notasContainer = $('<div class="actividades-notas-container row"></div>');

        if (grupo.notas && grupo.notas.length > 0) {
            grupo.notas.forEach((nota, notaIndex) => {
                const $notaCard = crearTarjetaNota(nota, settings);
                $notasContainer.append($notaCard);
            });
        } else {
            $notasContainer.append(`
                <div class="col-12">
                    <div class="alert alert-warning">
                        No hay notas disponibles para este evento.
                    </div>
                </div>
            `);
        }

        $pane.append($notasContainer);
        $tabsNav.append($tab);
        $tabContent.append($pane);
    });

    $mainContainer.append($encabezado, $tabsNav, $tabContent);
}

/**
 * Crea una tarjeta individual para cada nota con toda su información
 */
function crearTarjetaNota(nota, settings) {
    const titulo = obtenerTituloNota(nota);
    const descripcion = obtenerDescripcionNota(nota);
    const fecha = formatearFecha(obtenerFechaNota(nota));
    const lugar = obtenerLugarNota(nota);
    const imagenUrl = obtenerImagenNota(nota, settings);

    console.log('Creando tarjeta para nota:', { titulo, imagenUrl }); // Para debug

    const $card = $(`
        <div class="col-lg-6 col-xl-4 mb-4">
            <div class="nota-card card h-100 shadow-sm">
                ${imagenUrl ? `
                    <div class="nota-imagen-container">
                        <img src="${imagenUrl}" 
                             alt="${titulo || 'Imagen de la actividad'}" 
                             class="nota-imagen card-img-top"
                             loading="lazy"
                             onerror="this.style.display='none'">
                    </div>
                ` : ''}
                
                <div class="card-body">
                    ${titulo ? `<h3 class="nota-titulo h5">${titulo}</h3>` : ''}
                    
                    <div class="nota-metadata mb-2">
                        ${fecha ? `<div class="nota-fecha text-muted small"><strong>Fecha:</strong> ${fecha}</div>` : ''}
                        ${lugar ? `<div class="nota-lugar text-muted small"><strong>Lugar:</strong> ${lugar}</div>` : ''}
                    </div>
                    
                    ${descripcion ? `<div class="nota-descripcion mt-2">${descripcion}</div>` : ''}
                </div>
            </div>
        </div>
    `);

    return $card;
}

/**
 * Agrupa actividades por evento
 */
function agruparActividadesPorEvento(actividades = [], settings) {
    const grupos = new Map();

    actividades.forEach((actividad) => {
        if (!actividad || typeof actividad !== 'object') return;

        // Obtener el identificador del evento
        let eventoId;
        let nombreEvento = 'Eventos varios';
        
        if (actividad.evento && actividad.evento.id) {
            eventoId = actividad.evento.id;
            nombreEvento = actividad.evento.nombre || nombreEvento;
        } else if (actividad.evento_id) {
            eventoId = actividad.evento_id;
            nombreEvento = actividad.nombre_evento || nombreEvento;
        } else {
            // Si no hay evento definido, usar un grupo por defecto
            eventoId = 'sin-evento';
        }

        if (!grupos.has(eventoId)) {
            grupos.set(eventoId, {
                id: eventoId,
                nombre: nombreEvento,
                notas: []
            });
        }

        const grupo = grupos.get(eventoId);
        
        // Procesar la actividad principal como nota individual
        if (actividad.descripcion || actividad.titulo || actividad.imagen) {
            const imagenUrl = construirUrlImagenCompleta(settings.url_filesActividades, actividad.imagen || actividad.archivo);
            console.log('Procesando actividad principal:', { 
                titulo: actividad.titulo, 
                imagen: actividad.imagen,
                archivo: actividad.archivo,
                imagenUrl 
            });
            
            grupo.notas.push({
                titulo: actividad.titulo || actividad.nombre || '',
                descripcion: actividad.descripcion || '',
                fecha: actividad.fecha,
                lugar: actividad.lugar,
                imagen: imagenUrl
            });
        }

        // Procesar items como notas individuales
        if (actividad.items && Array.isArray(actividad.items)) {
            actividad.items.forEach(item => {
                if (item.descripcion || item.titulo || item.imagen || item.archivo) {
                    const itemImagenUrl = construirUrlImagenCompleta(settings.url_filesActividades, item.imagen || item.archivo);
                    console.log('Procesando item:', { 
                        titulo: item.titulo, 
                        imagen: item.imagen,
                        archivo: item.archivo,
                        itemImagenUrl 
                    });
                    
                    grupo.notas.push({
                        titulo: item.titulo || item.nombre || '',
                        descripcion: item.descripcion || '',
                        fecha: item.fecha || actividad.fecha,
                        lugar: item.lugar || actividad.lugar,
                        imagen: itemImagenUrl
                    });
                }
            });
        }
    });

    return Array.from(grupos.values());
}

/**
 * Obtiene la URL de la imagen para una nota específica
 */
function obtenerImagenNota(nota, settings) {
    if (nota.imagen && typeof nota.imagen === 'string') {
        return nota.imagen;
    }
    
    // Si no hay imagen directa, intentar construirla desde archivo
    if (nota.archivo && typeof nota.archivo === 'string') {
        return construirUrlImagenCompleta(settings.url_filesActividades, nota.archivo);
    }
    
    return null;
}

/**
 * Construye la URL completa de la imagen
 */
function construirUrlImagenCompleta(baseUrl, archivo) {
    if (!archivo || typeof archivo !== 'string') {
        console.log('Archivo no válido:', archivo);
        return null;
    }

    // Si ya es una URL completa, retornarla
    if (archivo.startsWith('http') || archivo.startsWith('//')) {
        console.log('URL completa encontrada:', archivo);
        return archivo;
    }

    // Si no tiene baseUrl, retornar el archivo tal cual
    if (!baseUrl) {
        console.log('Sin baseUrl, retornando archivo:', archivo);
        return archivo;
    }

    // Construir URL completa
    const urlCompleta = baseUrl + archivo.replace(/^\//, '');
    console.log('URL construida:', urlCompleta);
    return urlCompleta;
}

/**
 * Funciones auxiliares
 */
function normalizarColeccion(data) {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
        if (Array.isArray(data.data)) return data.data;
        if (Array.isArray(data.actividades)) return data.actividades;
        if (Array.isArray(data.items)) return data.items;
    }
    return [];
}

function estaActiva(actividad = {}) {
    return actividad.activo !== false && actividad.estado !== 'inactivo';
}

function obtenerTituloNota(nota = {}) {
    return nota.titulo || nota.nombre || '';
}

function obtenerDescripcionNota(nota = {}) {
    return nota.descripcion || nota.contenido || '';
}

function obtenerFechaNota(nota = {}) {
    return nota.fecha || nota.fecha_evento || '';
}

function obtenerLugarNota(nota = {}) {
    return nota.lugar || nota.ubicacion || '';
}

function normalizarTexto(texto) {
    if (typeof texto !== 'string') return '';
    return texto.trim();
}

function formatearFecha(fecha) {
    if (!fecha) return '';
    
    try {
        const date = new Date(fecha);
        if (isNaN(date.getTime())) return fecha;
        
        const dia = date.getDate();
        const mes = date.toLocaleString('es-ES', { month: 'long' });
        const anio = date.getFullYear();
        
        return `${dia} de ${mes} de ${anio}`;
    } catch (e) {
        return fecha;
    }
}

export default { muestra };