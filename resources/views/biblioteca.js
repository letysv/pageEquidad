/**
 * Muestra la sección de Biblioteca Virtual.
 * Renderiza un selector con las categorías disponibles y las tarjetas de libros asociadas.
 * @param {Object} settings - Configuración del módulo de biblioteca.
 */
export function muestra(settings = {}) {
    obtenerCategoriasRequest(settings)
        .done(function (categoriasData) {
            obtenerLibrosRequest(settings)
                .done(function (librosData) {
                    renderBiblioteca(categoriasData, librosData, settings);
                })
                .fail(function () {
                    renderBiblioteca(categoriasData, [], settings, {
                        mensajeLibros: 'No fue posible cargar los libros en este momento.'
                    });
                });
        })
        .fail(function () {
            renderBiblioteca([], [], settings, {
                mensaje: 'No fue posible cargar las categorías en este momento.'
            });
        });
}

function obtenerCategoriasRequest(settings) {
    return $.ajax({
        url: settings.url_apiCategorias || settings.url_api,
        method: 'GET',
        dataType: 'json'
    });
}

function obtenerLibrosRequest(settings) {
    const url = settings.url_apiBiblioteca || settings.url_api;

    if (!url) {
        return $.Deferred().resolve([]).promise();
    }

    return $.ajax({
        url: url,
        method: 'GET',
        dataType: 'json'
    });
}

/**
 * Construye la vista principal con el selector de categorías y la lista de libros.
 * @param {*} dataCategorias - Datos de categorías recibidos desde la API.
 * @param {*} dataLibros - Datos de libros recibidos desde la API.
 * @param {Object} settings - Configuración del módulo.
 * @param {Object} [estado] - Estado adicional para mostrar mensajes.
 */
function renderBiblioteca(dataCategorias, dataLibros, settings, estado = {}) {
    const categorias = obtenerCategorias(dataCategorias);
    const libros = obtenerLibros(dataLibros, settings);
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

    const { $wrapper: $selectorWrapper, $select } = crearSelectorCategorias(categorias);
    const $librosWrapper = $('<div class="biblioteca-libros mt-4"></div>');
    const $contenedorLibros = $('<div class="row g-4" id="biblioteca-libros"></div>');

    $librosWrapper.append($contenedorLibros);

    if (estado.mensajeLibros) {
        const $alertaLibros = $(`
            <div class="alert alert-warning" role="alert">
                ${estado.mensajeLibros}
            </div>
        `);
        $librosWrapper.prepend($alertaLibros);
    }

    mostrarMensajeSeleccionInicial($contenedorLibros);

    $select.on('change', function () {
        const categoriaSeleccionada = $(this).val();
        if (!categoriaSeleccionada) {
            mostrarMensajeSeleccionInicial($contenedorLibros);
            return;
        }

        const librosDeCategoria = filtrarLibrosPorCategoria(libros, categoriaSeleccionada);
        actualizarTarjetas(librosDeCategoria, $contenedorLibros);
    });

    $contenido.append($selectorWrapper);
    $mainContainer.append($encabezado, $contenido, $librosWrapper);
}

/**
 * Obtiene las categorías desde la respuesta de la API.
 * @param {*} data - Respuesta recibida.
 * @returns {Array<{ id: string, nombre: string }>} Categorías normalizadas.
 */
function obtenerCategorias(data) {
    const coleccion = extraerColeccionCategorias(data);
    const categoriasMap = new Map();

    coleccion.forEach((item) => {
        if (typeof item === 'string') {
            const nombre = item.trim();
            if (nombre) {
                const id = generarIdCategoria(nombre);
                if (!categoriasMap.has(id)) {
                    categoriasMap.set(id, { id, nombre });
                }
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

            const id = generarIdCategoria(identificador);

            if (!categoriasMap.has(id)) {
                categoriasMap.set(id, { id, nombre });
            }
        }
    });

    return Array.from(categoriasMap.values()).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
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
 * Crea el selector HTML con las categorías.
 * @param {Array<{ id: string, nombre: string }>} categorias - Categorías a mostrar.
 * @returns {{ $wrapper: jQuery, $select: jQuery }} Contenedor y elemento select.
 */
function crearSelectorCategorias(categorias) {
    const $wrapper = $('<div class="mb-4 biblioteca-categorias__selector"></div>');
    const $label = $('<label class="form-label fw-bold" for="biblioteca-categorias">Selecciona una categoría</label>');
    const $select = $('<select class="form-select" id="biblioteca-categorias"></select>');

    const $placeholder = $('<option value="" selected disabled>-- Selecciona una categoría --</option>');
    $select.append($placeholder);

    categorias.forEach((categoria) => {
        const $option = $(`<option value="${categoria.id}">${categoria.nombre}</option>`);
        $select.append($option);
    });

    $wrapper.append($label, $select);
    return { $wrapper, $select };
}

function mostrarMensajeSeleccionInicial($contenedor) {
    $contenedor.html(`
        <div class="col-12">
            <div class="alert alert-secondary" role="alert">
                Selecciona una categoría para ver los libros disponibles.
            </div>
        </div>
    `);
}

/**
 * Extrae una propiedad válida de un objeto.
 * @param {Object} origen - Objeto origen.
 * @param {Array<string>} claves - Posibles nombres de la propiedad.
 * @returns {string|undefined} Valor encontrado.
 */
function extraerPropiedad(origen, claves) {
    for (const clave of claves) {
        if (!Object.prototype.hasOwnProperty.call(origen, clave)) {
            continue;
        }

        const texto = normalizarValorPropiedad(origen[clave]);
        if (texto) {
            return texto;
        }
    }

    return undefined;
}

function normalizarValorPropiedad(valor) {
    if (valor === undefined || valor === null) {
        return undefined;
    }

    if (typeof valor === 'string' || typeof valor === 'number' || typeof valor === 'boolean') {
        const texto = String(valor).trim();
        return texto || undefined;
    }

    if (Array.isArray(valor)) {
        for (const elemento of valor) {
            const texto = normalizarValorPropiedad(elemento);
            if (texto) {
                return texto;
            }
        }
        return undefined;
    }

    if (typeof valor === 'object') {
        const candidatos = [
            'url',
            'href',
            'link',
            'archivo',
            'archivo_url',
            'archivoUrl',
            'ruta',
            'ruta_archivo',
            'path',
            'download_url',
            'downloadUrl',
            'archivoImage',
            'file',
            'file_url',
            'fileUrl',
            'data',
            'attributes',
            'value'
        ];

        for (const candidato of candidatos) {
            if (!Object.prototype.hasOwnProperty.call(valor, candidato)) {
                continue;
            }

            const texto = normalizarValorPropiedad(valor[candidato]);
            if (texto) {
                return texto;
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

function obtenerLibros(data, settings) {
    const coleccion = extraerColeccionLibros(data);
    const libros = [];

    coleccion.forEach((item) => {
        const libro = normalizarLibro(item, settings);
        if (libro) {
            libros.push(libro);
        }
    });

    return libros;
}

function extraerColeccionLibros(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (data && typeof data === 'object') {
        const candidatos = [
            data.libros,
            data.data,
            data.items,
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

function normalizarLibro(item, settings) {
    if (!item || typeof item !== 'object') {
        return null;
    }

    const titulo = extraerPropiedad(item, [
        'titulo',
        'nombre',
        'title',
        'name'
    ]);

    if (!titulo) {
        return null;
    }

    const enlace = construirRutaArchivo(
        extraerPropiedad(item, [
            'archivo',
            'archivo_url',
            'archivoUrl',
            'archivoRuta',
            'ruta_archivo',
            'url_archivo',
            'url',
            'enlace',
            'link',
            'file',
            'file_url',
            'fileUrl',
            'documento',
            'documento_url',
            'ruta',
            'download_url',
            'downloadUrl',
            'pdf',
            'pdf_url',
            'pdfUrl',
            'archivo_pdf',
            'archivoPdf',
            'documento_pdf',
            'documentoPdf'
        ]),
        settings
    );

    const imagen = construirRutaArchivo(
        extraerPropiedad(item, [
            'imagen',
            'portada',
            'cover',
            'img',
            'imagen_portada',
            'imagenPortada',
            'imagen_url',
            'imagenUrl',
            'archivoImage',
            'url_imagen',
            'urlImagen',
            'imagen_ruta',
            'ruta_imagen',
            'image',
            'image_url',
            'imageUrl',
            'thumbnail',
            'thumbnail_url',
            'portada_url',
            'portadaUrl',
            'cover_url',
            'coverUrl',
            'miniatura',
            'miniatura_url'
        ]),
        settings
    ) || obtenerImagenFallback();

    const descripcion = extraerPropiedad(item, [
        'descripcion',
        'resumen',
        'description',
        'detalle'
    ]);

    const categoriaId = obtenerIdentificadorCategoria(item);

    return {
        titulo,
        enlace,
        imagen,
        descripcion,
        categoriaId
    };
}

function obtenerIdentificadorCategoria(item) {
    const posiblesIds = [
        'categoria_id',
        'categoriaId',
        'id_categoria',
        'category_id',
        'categoryId',
        'cat_id',
        'categoria_clave',
        'categoriaSlug',
        'categoria_slug'
    ];

    for (const clave of posiblesIds) {
        if (Object.prototype.hasOwnProperty.call(item, clave)) {
            const valor = item[clave];
            if (valor !== undefined && valor !== null && String(valor).trim()) {
                return generarIdCategoria(valor);
            }
        }
    }

    const posiblesObjetos = [
        item.categoria,
        item.category,
        item.apartado,
        item.area,
        item.tema
    ];

    for (const candidato of posiblesObjetos) {
        if (!candidato) {
            continue;
        }

        if (typeof candidato === 'string') {
            const texto = candidato.trim();
            if (texto) {
                return generarIdCategoria(texto);
            }
            continue;
        }

        if (typeof candidato === 'object') {
            const id = extraerPropiedad(candidato, [
                'id',
                'clave',
                'slug',
                'codigo',
                'value'
            ]);

            if (id) {
                return generarIdCategoria(id);
            }

            const nombre = extraerPropiedad(candidato, [
                'nombre',
                'name',
                'titulo',
                'label',
                'descripcion'
            ]);

            if (nombre) {
                return generarIdCategoria(nombre);
            }
        }
    }

    const categoriaNombre = extraerPropiedad(item, [
        'categoria',
        'categoria_nombre',
        'apartado',
        'area',
        'category',
        'nombre_categoria',
        'descripcion_categoria'
    ]);

    if (categoriaNombre) {
        return generarIdCategoria(categoriaNombre);
    }

    return generarIdCategoria('Sin categoría');
}

function filtrarLibrosPorCategoria(libros, categoriaId) {
    return libros.filter((libro) => libro.categoriaId === categoriaId);
}

function actualizarTarjetas(libros, $contenedor) {
    $contenedor.empty();

    if (!libros.length) {
        $contenedor.append(`
            <div class="col-12">
                <div class="alert alert-secondary" role="alert">
                    No hay libros disponibles en esta categoría.
                </div>
            </div>
        `);
        return;
    }

    const tarjetas = libros
        .map((libro) => crearTarjetaLibro(libro))
        .join('');

    $contenedor.html(tarjetas);
}

function crearTarjetaLibro(libro) {
    const tituloEnlace = libro.enlace
        ? `<a href="${libro.enlace}" target="_blank" rel="noopener" class="stretched-link">${libro.titulo}</a>`
        : libro.titulo;

    const descripcionHtml = libro.descripcion
        ? `<p class="card-text">${libro.descripcion}</p>`
        : '';

    const imagenFallback = obtenerImagenFallback();

    return `
        <div class="col-12 col-sm-6 col-lg-4">
            <div class="card h-100 shadow-sm position-relative overflow-hidden">
                <div class="biblioteca-libros__imagen-wrapper">
                    <img src="${libro.imagen}" class="biblioteca-libros__imagen" alt="Portada de ${libro.titulo}" onerror="this.onerror=null;this.src='${imagenFallback}';" />
                </div>
                <div class="card-body">
                    <h5 class="card-title">${tituloEnlace}</h5>
                    ${descripcionHtml}
                </div>
            </div>
        </div>
    `;
}

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
    return `${base}${separador}${String(ruta).replace(/^\/+/, '')}`;
}

function obtenerImagenFallback() {
    return 'https://via.placeholder.com/300x400?text=Sin+imagen';
}