/**
 * Muestra la sección de Biblioteca Virtual.
 * Renderiza únicamente un selector con las categorías disponibles.
 * @param {Object} settings - Configuración del módulo de biblioteca.
 */
export function muestra(settings = {}) {
    $.ajax({
        url: settings.url_apiCategorias || settings.url_api,
        method: 'GET',
        dataType: 'json',
        success: function (data) {
            renderBiblioteca(data, settings);
        },
        error: function () {
            renderBiblioteca([], settings, {
                mensaje: 'No fue posible cargar las categorías en este momento.'
            });
        }
    });
}

/**
 * Construye la vista principal con el selector de categorías.
 * @param {*} data - Datos recibidos desde la API.
 * @param {Object} settings - Configuración del módulo.
 * @param {Object} [estado] - Estado adicional para mostrar mensajes.
 */
function renderBiblioteca(data, settings, estado = {}) {
    const categorias = obtenerCategorias(data);
    const $mainContainer = $('#' + settings.main_container);

    $mainContainer.empty();

    const titulo = settings.title || 'Biblioteca';
    const $encabezado = $(`
        <header class="major">
            <h2 class="modulo-nombre">${titulo}</h2>
        </header>
    `);

    const $contenido = $('<div class="biblioteca-categorias"></div>');

    if (!categorias.length) {
        const mensaje = estado.mensaje || 'No hay categorías disponibles en este momento.';
        const $contenidoVacio = $(`
            <div class="alert alert-info" role="alert">
                ${mensaje}
            </div>
        `);

        $contenido.append($contenidoVacio);
        $mainContainer.append($encabezado, $contenido);
        return;
    }

    const $selectorWrapper = crearSelectorCategorias(categorias, settings);
    $contenido.append($selectorWrapper);
    
    // Contenedor para los libros
    const $librosContainer = $('<div class="biblioteca-libros mt-4" id="biblioteca-libros-container"></div>');
    $contenido.append($librosContainer);
    
    $mainContainer.append($encabezado, $contenido);
}

/**
 * Crea el selector HTML con las categorías.
 * @param {Array<{ id: string, nombre: string }>} categorias - Categorías a mostrar.
 * @param {Object} settings - Configuración del módulo.
 * @returns {jQuery} Contenedor del selector.
 */
function crearSelectorCategorias(categorias, settings) {
    const $wrapper = $('<div class="mb-4 biblioteca-categorias__selector"></div>');
    const $label = $('<label class="form-label fw-bold" for="biblioteca-categorias">Selecciona una categoría</label>');
    const $select = $('<select class="form-select" id="biblioteca-categorias"></select>');

    const $placeholder = $('<option value="" selected disabled>-- Selecciona una categoría --</option>');
    $select.append($placeholder);

    categorias.forEach((categoria) => {
        const $option = $(`<option value="${categoria.id}">${categoria.nombre}</option>`);
        $select.append($option);
    });

    // Evento para cargar libros cuando se selecciona una categoría
    $select.on('change', function() {
        const categoriaId = $(this).val();
        if (categoriaId) {
            cargarLibrosPorCategoria(categoriaId, categorias, settings);
        } else {
            $('#biblioteca-libros-container').empty();
        }
    });

    $wrapper.append($label, $select);
    return $wrapper;
}

/**
 * Carga y muestra los libros de la categoría seleccionada.
 * @param {string} categoriaId - ID de la categoría seleccionada.
 * @param {Array} categorias - Lista de categorías.
 * @param {Object} settings - Configuración del módulo.
 */
function cargarLibrosPorCategoria(categoriaId, categorias, settings) {
    const $librosContainer = $('#biblioteca-libros-container');
    
    // Mostrar loading
    $librosContainer.html(`
        <div class="text-center">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Cargando libros...</span>
            </div>
            <p class="mt-2">Cargando libros...</p>
        </div>
    `);

    // Obtener el nombre de la categoría para mostrar
    const categoria = categorias.find(cat => cat.id === categoriaId);
    const nombreCategoria = categoria ? categoria.nombre : '';

    // Usar el endpoint específico para libros por categoría
    $.ajax({
        url: settings.url_apiLibros + categoriaId,
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            const libros = procesarDatosLibros(data);
            renderLibros(libros, nombreCategoria, settings);
        },
        error: function(xhr, status, error) {
            console.error('Error al cargar libros:', error);
            $librosContainer.html(`
                <div class="alert alert-danger" role="alert">
                    <h4>Error al cargar los libros</h4>
                    <p>No fue posible cargar los libros de esta categoría en este momento.</p>
                    <button class="btn btn-sm btn-outline-danger" onclick="cargarLibrosPorCategoria('${categoriaId}', ${JSON.stringify(categorias)}, ${JSON.stringify(settings)})">
                        Reintentar
                    </button>
                </div>
            `);
        }
    });
}

/**
 * Procesa los datos recibidos de la API para normalizar la estructura de libros.
 * @param {*} data - Datos recibidos de la API.
 * @returns {Array} Lista de libros normalizados.
 */
function procesarDatosLibros(data) {
    const libros = [];

    data.forEach((libro) => {
        if (libro && typeof libro === 'object') {
            // Obtener el primer item (archivo e imagen)
            const item = libro.items && libro.items.length > 0 ? libro.items[0] : {};
            
            const libroNormalizado = {
                id: libro.id,
                titulo: libro.titulo,
                archivo: item.archivo || '',
                imagen: item.archivoImage || '',
                categoria_id: libro.categoria_id,
                descripcion: libro.descripcion || `Libro: ${libro.titulo}`
            };

            // Solo agregar libros que tengan título y archivo
            if (libroNormalizado.titulo && libroNormalizado.archivo) {
                libros.push(libroNormalizado);
            }
        }
    });

    return libros;
}

/**
 * Renderiza la lista de libros en el contenedor.
 * @param {Array} libros - Lista de libros a mostrar.
 * @param {string} nombreCategoria - Nombre de la categoría seleccionada.
 * @param {Object} settings - Configuración del módulo.
 */
function renderLibros(libros, nombreCategoria, settings) {
    const $librosContainer = $('#biblioteca-libros-container');
    
    if (!libros.length) {
        $librosContainer.html(`
            <div class="alert alert-info" role="alert">
                <h4>${nombreCategoria}</h4>
                <p>No hay libros disponibles en esta categoría.</p>
            </div>
        `);
        return;
    }

    const $contenidoLibros = $(`
        <div class="biblioteca-libros__contenido">
            <h3 class="mb-4">${nombreCategoria}</h3>
            <div class="row" id="biblioteca-libros-grid"></div>
        </div>
    `);

    const $grid = $contenidoLibros.find('#biblioteca-libros-grid');
    
    libros.forEach(libro => {
        const $libroCard = crearCardLibro(libro, settings);
        $grid.append($libroCard);
    });

    $librosContainer.empty().append($contenidoLibros);
}

/**
 * Crea una tarjeta HTML para mostrar un libro.
 * @param {Object} libro - Datos del libro.
 * @param {Object} settings - Configuración del módulo.
 * @returns {jQuery} Elemento jQuery de la tarjeta del libro.
 */
function crearCardLibro(libro, settings) {
    // URL base para archivos (ajustar según tu configuración)
    const baseUrlArchivos = settings.baseUrlArchivos || '';
    const baseUrlImagenes = settings.baseUrlImagenes || baseUrlArchivos;
    
    const urlArchivo = libro.archivo.startsWith('http') ? libro.archivo : baseUrlArchivos + libro.archivo;
    const urlImagen = libro.imagen ? 
        (libro.imagen.startsWith('http') ? libro.imagen : baseUrlImagenes + libro.imagen) : 
        (settings.imagenDefault || 'img/libro-default.jpg');
    
    const descripcion = libro.descripcion || 'Sin descripción disponible';

    return $(`
        <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
            <div class="card libro-card h-100">
                <div class="card-img-top-container text-center p-3">
                    <img src="${urlImagen}" 
                         class="card-img-top libro-imagen" 
                         alt="${libro.titulo}"
                         style="max-height: 200px; width: auto; object-fit: contain;"
                         onerror="this.src='${settings.imagenDefault || 'img/libro-default.jpg'}'">
                </div>
                <div class="card-body d-flex flex-column">
                    <a href="${urlArchivo}" 
                       class="btn btn-primary mt-auto libro-enlace" 
                       target="_blank"
                       rel="noopener noreferrer"
                       title="Abrir libro: ${libro.titulo}">
                        Ver Libro
                    </a>
                </div>
            </div>
        </div>
    `);
}

/**
 * Obtiene las categorías desde la respuesta de la API.
 * @param {*} data - Respuesta recibida.
 * @returns {Array<{ id: string, nombre: string }>} Categorías normalizadas.
 */
function obtenerCategorias(data) {
    const coleccion = extraerColeccionCategorias(data);
    const categorias = [];

    coleccion.forEach((item) => {
        if (typeof item === 'string') {
            const nombre = item.trim();
            if (nombre) {
                categorias.push({ id: generarIdCategoria(nombre), nombre });
            }
            return;
        }

        if (item && typeof item === 'object') {
            const nombre = extraerPropiedad(item, [
                'nombre',
                'titulo',
                'name',
                'label',
                'descripcion',
                'categoria',
                'nombre_categoria',
                'descripcion_categoria'
            ]);

            if (!nombre) {
                return;
            }

            const identificador =
                extraerPropiedad(item, [
                    'id',
                    'clave',
                    'slug',
                    'codigo',
                    'value',
                    'identificador',
                    'id_categoria',
                    'categoria_id',
                    'clave_categoria'
                ]) || nombre;

            categorias.push({
                id: generarIdCategoria(identificador),
                nombre
            });
        }
    });

    return categorias;
}

/**
 * Extrae la colección de categorías de la respuesta de la API.
 * @param {*} data - Respuesta original.
 * @returns {Array} Colección de categorías.
 */
function extraerColeccionCategorias(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (data && typeof data === 'object') {
        const candidatos = [
            data.categorias,
            data.categories,
            data.data,
            data.result,
            data.response
        ];

        for (const candidato of candidatos) {
            if (Array.isArray(candidato)) {
                return candidato;
            }

            if (candidato && typeof candidato === 'object' && Array.isArray(candidato.data)) {
                return candidato.data;
            }
        }
    }

    return [];
}

/**
 * Extrae una propiedad válida de un objeto.
 * @param {Object} origen - Objeto origen.
 * @param {Array<string>} claves - Posibles nombres de la propiedad.
 * @returns {string|undefined} Valor encontrado.
 */
function extraerPropiedad(origen, claves) {
    for (const clave of claves) {
        if (Object.prototype.hasOwnProperty.call(origen, clave)) {
            const valor = origen[clave];
            if (valor !== undefined && valor !== null) {
                const texto = String(valor).trim();
                if (texto) {
                    return texto;
                }
            }
        }
    }

    return undefined;
}

/**
 * Genera un identificador seguro a partir del nombre de la categoría.
 * @param {string} texto - Nombre o identificador base.
 * @returns {string} Identificador generado.
 */
function generarIdCategoria(texto) {
    const valor = String(texto || 'categoria');
    const normalizado = valor
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    const id = normalizado
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return id || 'categoria';
}