/**
 * Muestra la sección de Biblioteca Virtual.
 * Renderiza un selector de categorías y tarjetas de libros filtradas por la categoría seleccionada.
 * @param {Object} settings - Configuración del módulo de biblioteca.
 */
export function muestra(settings = {}) {
    $.ajax({
        url: settings.url_apiBiblioteca || settings.url_api,
        method: 'GET',
        dataType: 'json',
        success: function (data) {
            renderBiblioteca(data, settings);
        },
        error: function () {
            renderBiblioteca([], settings, {
                mensaje: 'No fue posible cargar la biblioteca en este momento.'
            });
        }
    });
}

/**
 * Construye la vista principal de la biblioteca.
 * @param {Array} data - Datos recibidos desde la API.
 * @param {Object} settings - Configuración del módulo.
 * @param {Object} [estado] - Estado adicional para mostrar mensajes.
 */
function renderBiblioteca(data, settings, estado = {}) {
    const { categorias } = prepararDatosBiblioteca(data);
    const $mainContainer = $('#' + settings.main_container);

    $mainContainer.empty();

    const titulo = settings.title || 'Biblioteca';

    const $encabezado = $(`
        <header class="major">
            <h2 class="modulo-nombre">${titulo}</h2>
        </header>
    `);

    if (!categorias.length) {
        const mensaje = estado.mensaje || 'No hay libros disponibles en este momento.';
        const $contenidoVacio = $(`
            <div class="alert alert-info" role="alert">
                ${mensaje}
            </div>
        `);

        $mainContainer.append($encabezado, $contenidoVacio);
        return;
    }

    const { $wrapper: $selectorWrapper, $select } = crearSelectorCategorias(categorias);
    const $contenedorLibros = $('<div class="row g-4" id="biblioteca-libros"></div>');

    $mainContainer.append($encabezado, $selectorWrapper, $contenedorLibros);

    mostrarMensajeSeleccionCategoria($contenedorLibros);

    const mostrarLibros = (categoriaSeleccionada) => {
        const librosDeCategoria = buscarLibrosPorCategoria(categorias, categoriaSeleccionada);
        actualizarTarjetas(librosDeCategoria, $contenedorLibros, settings);
    };

    $select.on('change', function () {
        const categoriaSeleccionada = $(this).val();
        if (!categoriaSeleccionada) {
            mostrarMensajeSeleccionCategoria($contenedorLibros);
            return;
        }
        mostrarLibros(categoriaSeleccionada);
    });
}

/**
 * Prepara la estructura de categorías y libros a partir de la respuesta de la API.
 * @param {*} data - Datos recibidos desde el servicio.
 * @returns {{ categorias: Array }}
 */
function prepararDatosBiblioteca(data) {
    const libros = extraerLibros(data);
    const librosActivos = libros.filter((libro) => libro.activo !== false);
    const categoriasApi = extraerCategorias(data);

    if (categoriasApi.length) {
        return {
            categorias: construirCategoriasDesdeApi(categoriasApi, librosActivos)
        };
    }

    return {
        categorias: agruparPorCategoria(librosActivos)
    };
}

/**
 * Crea un elemento select con las categorías disponibles.
 * @param {Array} categorias - Lista de categorías disponibles.
 * @returns {{ $wrapper: jQuery, $select: jQuery }} Selector y su contenedor.
 */
function crearSelectorCategorias(categorias) {
    const $wrapper = $('<div class="mb-4"></div>');
    const $label = $('<label class="form-label fw-bold" for="biblioteca-categorias">Selecciona una categoría</label>');
    const $select = $('<select class="form-select" id="biblioteca-categorias"></select>');

    const $placeholder = $('<option value="" selected disabled>-- Selecciona una categoría --</option>');
    $select.append($placeholder);

    categorias.forEach((categoria, index) => {
        const $option = $(`<option value="${categoria.id}">${categoria.nombre}</option>`);
        $select.append($option);
    });

    $wrapper.append($label, $select);
    return { $wrapper, $select };
}

/**
 * Muestra un mensaje que solicita al usuario seleccionar una categoría.
 * @param {jQuery} $contenedor - Contenedor donde se renderiza el mensaje.
 */
function mostrarMensajeSeleccionCategoria($contenedor) {
    $contenedor.html(`
        <div class="col-12">
            <div class="alert alert-primary" role="alert">
                Selecciona una categoría para ver los libros disponibles.
            </div>
        </div>
    `);
}

/**
 * Actualiza las tarjetas de libros mostradas en pantalla.
 * @param {Array} libros - Libros a mostrar.
 * @param {jQuery} $contenedor - Contenedor donde se renderizan las tarjetas.
 * @param {Object} settings - Configuración del módulo.
 */
function actualizarTarjetas(libros, $contenedor, settings) {
    $contenedor.empty();

    if (!libros.length) {
        const $mensaje = $(`
            <div class="col-12">
                <div class="alert alert-secondary" role="alert">
                    No hay libros disponibles en esta categoría.
                </div>
            </div>
        `);
        $contenedor.append($mensaje);
        return;
    }

    const tarjetas = libros
        .map((libro) => crearTarjetaLibro(libro, settings))
        .join('');

    $contenedor.html(tarjetas);
}

/**
 * Construye el HTML de una tarjeta de libro.
 * @param {Object} libro - Información del libro.
 * @param {Object} settings - Configuración del módulo.
 * @returns {string} HTML generado.
 */
function crearTarjetaLibro(libro, settings) {
    const titulo = libro.titulo || libro.nombre || 'Libro';
    const imagen = construirRutaArchivo(libro.imagen || libro.portada || libro.cover, settings) || obtenerImagenFallback();
    const enlace = construirRutaArchivo(libro.archivo || libro.url || libro.enlace, settings);
    const descripcion = libro.descripcion || libro.resumen || '';

    const tituloEnlace = enlace
        ? `<a href="${enlace}" target="_blank" rel="noopener" class="stretched-link">${titulo}</a>`
        : titulo;

    const descripcionHtml = descripcion ? `<p class="card-text">${descripcion}</p>` : '';

    return `
        <div class="col-12 col-sm-6 col-lg-4">
            <div class="card h-100 shadow-sm position-relative overflow-hidden">
                <div class="bg-light" style="aspect-ratio: 3 / 4;">
                    <img src="${imagen}" class="w-100 h-100 object-fit-cover" alt="Portada de ${titulo}" onerror="this.onerror=null;this.src='${obtenerImagenFallback()}';" />
                </div>
                <div class="card-body">
                    <h5 class="card-title">${tituloEnlace}</h5>
                    ${descripcionHtml}
                </div>
            </div>
        </div>
    `;
}

/**
 * Agrupa los libros por categoría.
 * @param {Array} libros - Libros activos de la biblioteca.
 * @returns {Array} Lista de categorías con sus libros.
 */
function agruparPorCategoria(libros) {
    const grupos = new Map();

    libros.forEach((libro) => {
        const claveOriginal = obtenerClavePrimariaCategoria(libro);
        const claveCategoria = normalizarClave(claveOriginal);
        const nombreCategoria = obtenerNombreCategoria(libro);
        const idCategoria = generarIdCategoria(claveCategoria || nombreCategoria);

        if (!grupos.has(claveCategoria)) {
            grupos.set(claveCategoria, {
                id: idCategoria,
                nombre: nombreCategoria,
                clave: claveOriginal,
                claveNormalizada: claveCategoria,
                libros: []
            });
        }

        grupos.get(claveCategoria).libros.push(libro);
    });

    return Array.from(grupos.values());
}

/**
 * Obtiene el nombre de la categoría de un libro.
 * @param {Object} libro - Libro del cual obtener la categoría.
 * @returns {string} Nombre de la categoría.
 */
function obtenerNombreCategoria(libro) {
    const candidatos = [
        libro.categoria_nombre,
        libro.nombre_categoria,
        libro.categoriaName,
        typeof libro.categoria === 'string' ? libro.categoria : null,
        libro.apartado,
        libro.area
    ];

    for (const candidato of candidatos) {
        if (candidato !== undefined && candidato !== null) {
            const texto = String(candidato).trim();
            if (texto) {
                return texto;
            }
        }
    }

    return 'Sin categoría';
}

/**
 * Genera un identificador seguro para una categoría.
 * @param {string} nombre - Nombre de la categoría.
 * @returns {string} Identificador generado.
 */
function generarIdCategoria(nombre) {
    const texto = String(nombre || 'categoria');
    const normalizado = texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    const id = normalizado
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return id || 'categoria';
}

/**
 * Busca los libros asociados a una categoría específica.
 * @param {Array} categorias - Lista de categorías agrupadas.
 * @param {string} idCategoria - Identificador de la categoría seleccionada.
 * @returns {Array} Libros de la categoría seleccionada.
 */
function buscarLibrosPorCategoria(categorias, idCategoria) {
    const categoria = categorias.find((item) => item.id === idCategoria);
    return categoria ? categoria.libros : [];
}

/**
 * Extrae la lista de libros desde la respuesta de la API.
 * @param {*} data - Respuesta del servicio.
 * @returns {Array} Libros recibidos.
 */
function extraerLibros(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (data && typeof data === 'object') {
        if (Array.isArray(data.libros)) {
            return data.libros;
        }

        if (Array.isArray(data.items)) {
            return data.items;
        }

        if (Array.isArray(data.data)) {
            return data.data;
        }
    }

    return [];
}

/**
 * Extrae las categorías proporcionadas directamente por la API.
 * @param {*} data - Respuesta del servicio.
 * @returns {Array} Categorías proporcionadas.
 */
function extraerCategorias(data) {
    if (!data || typeof data !== 'object') {
        return [];
    }

    const candidatos = [data, data.data, data.result, data.response];

    for (const candidato of candidatos) {
        if (!candidato || typeof candidato !== 'object') {
            continue;
        }

        const colecciones = [candidato.categorias, candidato.categories];

        for (const coleccion of colecciones) {
            if (Array.isArray(coleccion)) {
                return coleccion;
            }

            if (coleccion && typeof coleccion === 'object' && Array.isArray(coleccion.data)) {
                return coleccion.data;
            }
        }
    }

    return [];
}

/**
 * Construye las categorías a partir de la estructura enviada por la API.
 * @param {Array} categoriasApi - Categorías recibidas desde el servicio.
 * @param {Array} libros - Libros activos.
 * @returns {Array} Categorías normalizadas.
 */
function construirCategoriasDesdeApi(categoriasApi, libros) {
    const categoriasNormalizadas = categoriasApi.map((categoria) => normalizarCategoriaDesdeApi(categoria));
    const mapa = new Map();

    categoriasNormalizadas.forEach((categoria) => {
        const clave = categoria.claveNormalizada;
        if (!mapa.has(clave)) {
            mapa.set(clave, { ...categoria, libros: [] });
        }
    });

    libros.forEach((libro) => {
        const claves = obtenerPosiblesClavesCategoria(libro);
        for (const clave of claves) {
            const claveNormalizada = normalizarClave(clave);
            if (mapa.has(claveNormalizada)) {
                mapa.get(claveNormalizada).libros.push(libro);
                return;
            }
        }
    });

    return Array.from(mapa.values());
}

/**
 * Normaliza la información de una categoría recibida desde la API.
 * @param {Object} categoria - Categoría a normalizar.
 * @returns {Object} Categoría con estructura estándar.
 */
function normalizarCategoriaDesdeApi(categoria) {
    const nombre =
        extraerPropiedadCategoria(categoria, [
            'nombre',
            'titulo',
            'name',
            'label',
            'descripcion',
            'categoria',
            'nombre_categoria',
            'nombreCategoria',
            'categoria_nombre',
            'descripcion_categoria'
        ]) || 'Sin categoría';
    const claveOriginal =
        extraerPropiedadCategoria(categoria, [
            'id',
            'clave',
            'slug',
            'codigo',
            'value',
            'identificador',
            'id_categoria',
            'categoria_id',
            'clave_categoria',
            'categoriaClave'
        ]) || nombre;
    const claveNormalizada = normalizarClave(claveOriginal);

    return {
        id: generarIdCategoria(claveNormalizada || nombre),
        nombre,
        clave: claveOriginal,
        claveNormalizada
    };
}

/**
 * Obtiene una propiedad existente de una categoría de la API.
 * @param {Object} categoria - Categoría original.
 * @param {Array<string>} claves - Posibles nombres de la propiedad.
 * @returns {string|undefined} Valor encontrado.
 */
function extraerPropiedadCategoria(categoria, claves) {
    for (const clave of claves) {
        if (categoria && Object.prototype.hasOwnProperty.call(categoria, clave)) {
            const valor = categoria[clave];
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
 * Obtiene la clave primaria de una categoría asociada a un libro.
 * @param {Object} libro - Libro que contiene la referencia a la categoría.
 * @returns {string} Clave de la categoría.
 */
function obtenerClavePrimariaCategoria(libro) {
    const claves = [
        libro.categoria_id,
        libro.id_categoria,
        libro.categoria,
        libro.apartado_id,
        libro.area_id,
        libro.categoriaClave,
        libro.categoria_slug,
        libro.categoria_codigo,
        libro.categoriaNombre,
        libro.categoria_nombre,
        libro.apartado,
        libro.area
    ];

    for (const clave of claves) {
        if (clave !== undefined && clave !== null) {
            const texto = String(clave).trim();
            if (texto) {
                return texto;
            }
        }
    }

    return obtenerNombreCategoria(libro);
}

/**
 * Construye una lista de posibles claves para encontrar la categoría de un libro.
 * @param {Object} libro - Libro del cual se obtendrán las claves.
 * @returns {Array<string>} Lista de claves posibles.
 */
function obtenerPosiblesClavesCategoria(libro) {
    const claves = [
        libro.categoria_id,
        libro.id_categoria,
        libro.categoria,
        libro.apartado_id,
        libro.area_id,
        libro.categoriaClave,
        libro.categoria_slug,
        libro.categoria_codigo,
        libro.categoriaNombre,
        libro.categoria_nombre,
        libro.apartado,
        libro.area,
        obtenerNombreCategoria(libro)
    ];

    return claves.filter((clave) => clave !== undefined && clave !== null);
}

/**
 * Normaliza una clave convirtiéndola en texto y llevándola a minúsculas.
 * @param {*} valor - Valor a normalizar.
 * @returns {string} Clave normalizada.
 */
function normalizarClave(valor) {
    if (valor === undefined || valor === null) {
        return '';
    }

    return String(valor)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
}

/**
 * Construye la ruta completa de un archivo o recurso.
 * @param {string} ruta - Ruta proporcionada por la API.
 * @param {Object} settings - Configuración del módulo.
 * @returns {string} Ruta absoluta del recurso.
 */
function construirRutaArchivo(ruta, settings) {
    if (!ruta) {
        return '';
    }

    if (/^https?:\/\//i.test(ruta)) {
        return ruta;
    }

    const base = settings.url_filesBiblioteca || settings.url_files || '';
    if (!base) {
        return ruta;
    }

    const separador = base.endsWith('/') ? '' : '/';
    return `${base}${separador}${ruta.replace(/^\/+/, '')}`;
}

/**
 * Devuelve una imagen de respaldo cuando no existe portada.
 * @returns {string} URL de la imagen de respaldo.
 */
function obtenerImagenFallback() {
    return 'https://via.placeholder.com/300x400?text=Sin+imagen';
}