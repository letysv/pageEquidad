/**
 * 
 * @param {Array} settings - Configuración para las notas
 */
export function muestra(settings) {

    $.ajax({
        url: settings.url_apiNotas,
        method: "GET",
        dataType: "json",
        success: function (data) {
            muestraNotas(data, settings);
        }
    })
}

/** 
 * Muestra las notas en el contenedor especificado.
 * @param {Array} data - Array de notas obtenidas de la API.
 * @param {string} contenedor - ID del contenedor donde se mostrarán las notas
 * @param {string} rutaBase - Ruta base para las imágenes de las notas
*/
function muestraNotas(data, settings) {
    const NotasActivas = data.filter((nota) => nota.activo);
    const $mainContainer = $("#" + settings.main_container);
    $mainContainer.html("");

    // Actualizar el título si se proporciona
    if (NotasActivas.length === 0) {
        const $item = $(`
            <header class="major">
                <h2 class="modulo-nombre">No hay notas disponibles en este momento.</h2>
                <div class="modulo-secciones"></div>
            </header>
        `);
        $mainContainer.append($item);
        return;
    }

    // Se crea el encabezado para las notas
    const $item = $(`
        <header class="major">
            <h2 class="modulo-nombre">Notas</h2>
            <div class="modulo-secciones row"></div>
        </header>
    `);
    $mainContainer.append($item);

    // Se crea el contenedor para las tarjetas de notas
    const $cardsContainer = $item.find(".modulo-secciones");

    // console.log(settings)

    // Se crean las tarjetas para cada nota activa
    NotasActivas.forEach(nota => {
        // Se trunca la descripción si es muy larga
        const descripcionTruncada = nota.descripcion.length > 100
            ? nota.descripcion.substring(0, 100) + '...'
            : nota.descripcion;

        const imagenes = nota.items || [];

        // Se establecen valores para la imagen
        const imgElement = $('<img class="mt-2">').attr({
            'src': settings.url_filesNotas + imagenes[0].archivo,
            'alt': nota.nombre || 'Imagen de la nota'
        });

        // Se crea el elemento de la tarjeta
        const $item = $(`
            <div class="card" style="width: 18rem; margin-right: 10px; margin-bottom: 10px; cursor: pointer;">
                <img src="..." class="card-img-top" alt="...">
                <div class="card-body">
                    <h6 class="card-title">${nota.nombre}</h6>
                    <p class="card-text">${descripcionTruncada}</p>

                    </div>
                    </div>
                    `);
                    // <a href="" class="btn btn-primary" onClick="show('${JSON.stringify(settings)}', ${nota.id})">Ver nota</a>
        $item.on("click", function (e) {
            e.preventDefault(); // Prevenir el comportamiento por defecto del enlace
            show(settings, nota.id);
        });

        // Se reemplaza la imagen de la tarjeta con la imagen de la nota
        $item.find('.card-img-top').replaceWith(imgElement);

        // Se agrega el elemento de la tarjeta al contenedor
        $cardsContainer.append($item);
    });
}

/** 
 * Muestra los detalles de una nota específica.
 * @param {Array} settings - URL de la API para obtener los detalles de la nota.
 * @param {string} idNota - ID de la nota a mostrar.
 */
export function show(settings, idNota) {
    $.ajax({
        url: `${settings.url_apiNota}/${idNota}`,
        method: 'GET',
        dataType: 'json',
        success: function (notaJson) {
            // notaJson = JSON.parse(notaJson); 
            const mainContainer = $('#main_container');

            const baseUrl = (settings.url_filesNotas || '').endsWith('/') ? settings.url_filesNotas : settings.url_filesNotas ? settings.url_filesNotas + '/' : '';


            // Crear HTML para todas las imágenes en fila
            let imagenesHTML = '';
            if (notaJson.items && notaJson.items.length > 0) {
                imagenesHTML = `
                    <div class="galeria-horizontal">
                        ${notaJson.items.map(item => `
                            <div class="imagen-horizontal-container">
                                <img src="${baseUrl}${item.archivo}" alt="${notaJson.nombre || 'Imagen de nota'}" class="imagen-horizontal">
                            </div>
                        `).join('')}
                    </div>
                `;
            }

            const detalleHTML = `
                <div class="nota-detalle">
                    <h2>${notaJson.nombre || 'Sin título'}</h2>
                    ${imagenesHTML}
                    <div class="nota-descripcion">
                        ${notaJson.descripcion || 'No hay descripción disponible.'}
                    </div>
                </div>
            `;

            // Insertar en el contenedor principal
            mainContainer.html(detalleHTML);
        }
    });

}
