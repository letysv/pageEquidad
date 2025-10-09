/**
 * Módulo de Biblioteca.
 * Muestra un selector con todas las categorías disponibles obtenidas desde la API.
 * @param {Object} settings - Configuración del módulo.
 */
export function muestra(settings = {}) {
    const url = settings.url_apiBiblioteca || settings.url_api;
    const $mainContainer = obtenerContenedorPrincipal(settings.main_container);
    const titulo = settings.title || 'Biblioteca Virtual';

    $mainContainer.empty();
    const $header = crearEncabezado(titulo);
    const $contenido = $('<div class="biblioteca-categorias"></div>');
    $mainContainer.append($header, $contenido);

    if (!url) {
        mostrarMensaje($contenido, 'No se ha configurado la URL de la biblioteca.');
        return;
    }

    mostrarMensaje($contenido, 'Cargando categorías…', 'secondary', 'biblioteca-loader');

    $.ajax({
        url,
        method: 'GET',
        dataType: 'json',
        success(data) {
            renderizarCategorias(data, $contenido);
        },
        error() {
            mostrarMensaje($contenido, 'No fue posible cargar las categorías en este momento. Intenta nuevamente más tarde.');
        }
    });
}

/**
 * Obtiene el contenedor principal donde se montará la vista.
 * @param {string} idContenedor - ID del contenedor principal.
 * @returns {jQuery} Contenedor principal.
 */
function obtenerContenedorPrincipal(idContenedor) {
    if (!idContenedor) {
        return $('#main_container');
    }
    return $('#' + idContenedor);
}

/**
 * Crea el encabezado del módulo.
 * @param {string} titulo - Título que se mostrará.
 * @returns {jQuery} Encabezado generado.
 */
function crearEncabezado(titulo) {
    return $(`
        <header class="major">
            <h2 class="modulo-nombre">${titulo}</h2>
        </header>
    `);
}

/**
 * Renderiza la lista de categorías en el contenedor indicado.
 * @param {*} data - Respuesta de la API.
 * @param {jQuery} $contenedor - Contenedor donde se mostrará el selector.
 */
function renderizarCategorias(data, $contenedor) {
    const categorias = construirCategorias(data);

    if (!categorias.length) {
        mostrarMensaje($contenedor, 'No hay categorías disponibles en este momento.');
        return;
    }

    const selectId = 'biblioteca-categorias';
    const $grupo = $('<div class="mb-4"></div>');
    const $label = $(`<label class="form-label fw-bold" for="${selectId}">Categorías disponibles</label>`);
    const $select = $(`<select class="form-select" id="${selectId}"></select>`);
    const $mensaje = $('<div class="alert alert-info" role="alert">Selecciona una categoría para ver más detalles.</div>');

    $select.append('<option value="" selected disabled>-- Selecciona una categoría --</option>');

    categorias.forEach((categoria) => {
        const texto = categoria.total !== undefined && categoria.total !== null
            ? `${categoria.nombre} (${categoria.total})`
            : categoria.nombre;
        $select.append(`<option value="${categoria.id}">${texto}</option>`);
    });

    $grupo.append($label, $select);
    $contenedor.html('');
    $contenedor.append($grupo, $mensaje);

    $select.on('change', function () {
        const seleccion = categorias.find((categoria) => categoria.id === this.value);
        if (!seleccion) {
            $mensaje
                .removeClass('alert-primary alert-secondary')
                .addClass('alert-info')
                .html('Selecciona una categoría para ver más detalles.');
            return;
        }

        const total = obtenerTextoTotal(seleccion.total);
        $mensaje
            .removeClass('alert-info alert-secondary')
            .addClass('alert-primary')
            .html(`<strong>${seleccion.nombre}</strong>${total}`);
    });
}

/**
 * Construye la lista normalizada de categorías obtenidas desde la API.
 * @param {*} data - Respuesta original.
 * @returns {Array<{id: string, nombre: string, total?: number}>} Lista de categorías.
 */
function construirCategorias(data) {
    const posiblesColecciones = extraerColeccionesDeCategorias(data);
    const categoriasNormalizadas = posiblesColecciones
        .map((item, indice) => normalizarCategoria(item, indice))
        .filter(Boolean);

    const mapa = new Map();
    categoriasNormalizadas.forEach((categoria) => {
        if (!mapa.has(categoria.id)) {
            mapa.set(categoria.id, categoria);
            return;
        }

        const actual = mapa.get(categoria.id);
        if (actual.total === undefined && categoria.total !== undefined) {
            mapa.set(categoria.id, { ...actual, total: categoria.total });
        }
    });

    return Array.from(mapa.values()).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
}

/**
 * Obtiene un arreglo de posibles categorías dentro de la respuesta de la API.
 * @param {*} data - Respuesta original.
 * @returns {Array} Lista con elementos que representan categorías.
 */
function extraerColeccionesDeCategorias(data) {
    if (data === undefined || data === null) {
        return [];
    }

    const colecciones = [];
    const visitados = new WeakSet();

    function explorar(valor) {
        if (!valor) {
            return;
        }

        if (Array.isArray(valor)) {
            if (esColeccionDeCategorias(valor)) {
                colecciones.push(...valor);
            }
            return;
        }

        if (typeof valor === 'object') {
            if (visitados.has(valor)) {
                return;
            }
            visitados.add(valor);

            const claves = ['categorias', 'categories', 'data', 'result', 'response'];
            claves.forEach((clave) => {
                if (Object.prototype.hasOwnProperty.call(valor, clave)) {
                    explorar(valor[clave]);
                }
            });
        }
    }

    explorar(data);
    return colecciones;
}

/**
 * Determina si un arreglo parece contener categorías.
 * @param {Array} arreglo - Arreglo a evaluar.
 * @returns {boolean} `true` si el arreglo contiene categorías.
 */
function esColeccionDeCategorias(arreglo) {
    if (!arreglo.length) {
        return false;
    }

    const muestra = arreglo.slice(0, 5);
    return muestra.some((item) => {
        if (item === null || item === undefined) {
            return false;
        }

        if (typeof item === 'string' || typeof item === 'number') {
            return String(item).trim().length > 0;
        }

        if (typeof item === 'object') {
            return CAMPOS_NOMBRE.some((clave) => Object.prototype.hasOwnProperty.call(item, clave)) ||
                CAMPOS_ID.some((clave) => Object.prototype.hasOwnProperty.call(item, clave));
        }

        return false;
    });
}

/**
 * Normaliza una categoría en un formato estándar.
 * @param {*} categoria - Categoría original.
 * @param {number} indice - Índice usado como respaldo para el identificador.
 * @returns {{id: string, nombre: string, total?: number}|null} Categoría normalizada.
 */
function normalizarCategoria(categoria, indice) {
    if (categoria === null || categoria === undefined) {
        return null;
    }

    if (typeof categoria === 'string' || typeof categoria === 'number') {
        const nombre = String(categoria).trim();
        if (!nombre) {
            return null;
        }
        return {
            id: generarIdCategoria(nombre),
            nombre
        };
    }

    if (typeof categoria !== 'object') {
        return null;
    }

    const nombre = extraerPrimeraPropiedad(categoria, CAMPOS_NOMBRE);
    const identificador = extraerPrimeraPropiedad(categoria, CAMPOS_ID) || nombre || `categoria-${indice}`;
    const total = extraerTotalCategoria(categoria);

    const nombreFinal = nombre || String(identificador || '').trim();
    if (!nombreFinal) {
        return null;
    }

    return {
        id: generarIdCategoria(identificador || nombreFinal || `categoria-${indice}`),
        nombre: nombreFinal,
        total
    };
}

/**
 * Extrae el primer valor válido de un conjunto de propiedades.
 * @param {Object} objeto - Objeto del cual se extraerá el valor.
 * @param {Array<string>} claves - Claves posibles.
 * @returns {string|undefined} Valor encontrado.
 */
function extraerPrimeraPropiedad(objeto, claves) {
    for (const clave of claves) {
        if (!Object.prototype.hasOwnProperty.call(objeto, clave)) {
            continue;
        }
        const valor = objeto[clave];
        if (valor === undefined || valor === null) {
            continue;
        }
        const texto = String(valor).trim();
        if (texto) {
            return texto;
        }
    }
    return undefined;
}

/**
 * Obtiene el total de elementos asociados a una categoría.
 * @param {Object} categoria - Categoría original.
 * @returns {number|undefined} Total de elementos.
 */
function extraerTotalCategoria(categoria) {
    for (const clave of CAMPOS_TOTAL) {
        if (!Object.prototype.hasOwnProperty.call(categoria, clave)) {
            continue;
        }
        const valor = categoria[clave];
        if (valor === undefined || valor === null) {
            continue;
        }
        if (Array.isArray(valor)) {
            return valor.length;
        }
        const numero = Number(valor);
        if (!Number.isNaN(numero)) {
            return numero;
        }
    }

    for (const clave of CAMPOS_COLECCION) {
        if (!Object.prototype.hasOwnProperty.call(categoria, clave)) {
            continue;
        }
        const valor = categoria[clave];
        if (Array.isArray(valor)) {
            return valor.length;
        }
    }

    return undefined;
}

/**
 * Genera un identificador seguro para cada categoría.
 * @param {string} base - Texto base a normalizar.
 * @returns {string} Identificador generado.
 */
function generarIdCategoria(base) {
    const texto = String(base || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const id = texto.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return id || `categoria-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Obtiene la cadena que describe el total de elementos disponibles.
 * @param {number|undefined} total - Total de elementos.
 * @returns {string} Texto descriptivo del total.
 */
function obtenerTextoTotal(total) {
    if (total === undefined || total === null) {
        return '';
    }

    if (total === 0) {
        return '. No hay recursos disponibles en esta categoría.';
    }

    const etiqueta = total === 1 ? 'recurso disponible' : 'recursos disponibles';
    return `. Cuenta con ${total} ${etiqueta}.`;
}

/**
 * Muestra un mensaje dentro del contenedor indicado.
 * @param {jQuery} $contenedor - Contenedor donde se mostrará el mensaje.
 * @param {string} mensaje - Texto a mostrar.
 * @param {string} [tipo='danger'] - Tipo de alerta de Bootstrap.
 * @param {string} [claseAdicional] - Clase adicional para el elemento.
 */
function mostrarMensaje($contenedor, mensaje, tipo = 'danger', claseAdicional) {
    const clases = ['alert', `alert-${tipo}`];
    if (claseAdicional) {
        clases.push(claseAdicional);
    }
    const $alerta = $(`<div class="${clases.join(' ')}" role="alert">${mensaje}</div>`);
    $contenedor.html($alerta);
}

const CAMPOS_NOMBRE = [
    'nombre',
    'titulo',
    'name',
    'label',
    'descripcion',
    'display_name',
    'categoria',
    'category',
    'nombre_categoria',
    'descripcion_categoria'
];

const CAMPOS_ID = [
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
];

const CAMPOS_TOTAL = [
    'total',
    'count',
    'cantidad',
    'total_libros',
    'total_recursos'
];

const CAMPOS_COLECCION = [
    'libros',
    'books',
    'items',
    'recursos',
    'materiales'
];