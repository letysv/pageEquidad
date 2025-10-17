/**
 * Módulo encargado de renderizar la información de la sala de lactancia.
 * Muestra la descripción, el link al archivo con su nombre, y la imagen.
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

    // Extraer la información específica que necesitas
    const informacion = extraerInformacionLactancia(registro, settings);

    const $tarjeta = $('<div class="lactancia-contenido card shadow-sm"></div>');
    const $cuerpo = $('<div class="card-body"></div>');

    // Mostrar descripción PRIMERO
    if (informacion.descripcion) {
        const $descripcion = $(`
            <div class="lactancia-descripcion mb-4">
                <div class="descripcion-contenido fs-6">${informacion.descripcion}</div>
            </div>
        `);
        $cuerpo.append($descripcion);
    } else {
        $cuerpo.append(`
            <div class="alert alert-warning">
                <p class="text-muted mb-0">No hay descripción disponible en este momento.</p>
            </div>
        `);
    }

    // Mostrar archivos PDF SEGUNDO - NOMBRE COMO LINK
    const archivosPdf = informacion.archivos.filter(archivo => archivo.esPdf);
    if (archivosPdf.length > 0) {
        const $archivosSection = $(`
            <div class="lactancia-archivos mt-4">
                <h5 class="text-success mb-3">
                </h5>
            </div>
        `);

        archivosPdf.forEach(archivo => {
            const $archivo = $(`
                <div class="archivo-item p-3 bg-light rounded mb-3">
                    <div class="file-info">
                        <a href="${archivo.url}" 
                           target="_blank" 
                           rel="noopener"
                           class="text-primary text-decoration-none fw-bold">
                            ${archivo.nombre}
                        </a>
                    </div>
                </div>
            `);
            $archivosSection.append($archivo);
        });

        $cuerpo.append($archivosSection);
    }

    // Mostrar imagen AL FINAL - DEBAJO DE LOS ARCHIVOS
    if (informacion.imagenUrl) {
        const $contenedorImagen = $(`
            <div class="lactancia-imagen text-center mt-4">
                <img src="${informacion.imagenUrl}"
                     alt="${informacion.nombreImagen || titulo}"
                     class="img-fluid rounded shadow"
                     style="max-height: 500px; object-fit: contain;"
                     loading="lazy"
                     onerror="this.style.display='none'; console.error('Error cargando imagen:', this.src)">
            </div>
        `);

        $cuerpo.append($contenedorImagen);
    } else {
        $cuerpo.append(`
            <div class="alert alert-secondary mt-4">
                <p class="text-muted mb-0">No hay imagen disponible para mostrar.</p>
            </div>
        `);
    }

    $tarjeta.append($cuerpo);
    $mainContainer.append($tarjeta);
}

/**
 * Extrae la información específica de lactancia que necesitas
 */
function extraerInformacionLactancia(registro, settings) {
    const baseUrl = settings.url_filesLactancia || settings.url_files || '';
    
    // Obtener descripción del registro principal
    const descripcion = obtenerDescripcion(registro);
    
    // Procesar items para separar imágenes y archivos
    const items = obtenerItems(registro, settings);
    const { imagenes, archivos } = procesarItems(items, baseUrl);
    
    // Tomar la primera imagen encontrada (o null si no hay)
    const primeraImagen = imagenes.length > 0 ? imagenes[0] : null;
    
    return {
        descripcion: descripcion,
        imagenUrl: primeraImagen ? primeraImagen.url : '',
        nombreImagen: primeraImagen ? primeraImagen.nombre : '',
        archivos: archivos
    };
}

/**
 * Procesa los items para separar imágenes de archivos PDF
 */
function procesarItems(items, baseUrl) {
    const imagenes = [];
    const archivos = [];
    
    items.forEach(item => {
        if (item.archivo) {
            const urlCompleta = construirUrl(baseUrl, item.archivo);
            const esImagen = esUrlDeImagen(urlCompleta);
            const esPdf = urlCompleta.toLowerCase().includes('.pdf');
            
            const itemProcesado = {
                url: urlCompleta,
                nombre: item.nombre || 'Sin nombre',
                esImagen: esImagen,
                esPdf: esPdf,
                tipo: esImagen ? 'imagen' : (esPdf ? 'pdf' : 'archivo')
            };
            
            if (esImagen) {
                imagenes.push(itemProcesado);
            } else {
                archivos.push(itemProcesado);
            }
        }
    });
    
    return { imagenes, archivos };
}

/**
 * Verifica si una URL es de imagen
 */
function esUrlDeImagen(url) {
    if (!url) return false;
    const extensionesImagen = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    return extensionesImagen.some(ext => url.toLowerCase().includes(ext));
}

/**
 * Obtiene los items relacionados si existen
 */
function obtenerItems(registro, settings) {
    if (!registro || typeof registro !== 'object') {
        return [];
    }

    // Buscar items en diferentes propiedades posibles
    const candidatos = [
        registro.items,
        registro.lactancia_items,
        registro.related_items,
        registro.child_items,
        registro.archivos
    ];

    for (const candidato of candidatos) {
        if (Array.isArray(candidato) && candidato.length > 0) {
            return candidato;
        }
    }

    return [];
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