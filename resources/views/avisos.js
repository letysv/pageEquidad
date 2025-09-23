
/**
 * Función que carga los avisos desde la API y los muestra en la página.
 * @param {string} urlApi 
 * @param {string} urlFiles 
 * @param {string} contenedor
 */
export function muestra(settings) {
    $.ajax({
        url: settings.url_api,
        method: 'GET',
        success: function (avisos) {

            const $mainContainer = $('#' + settings.main_container);

            // Actualizar el título si se proporciona
            if (settings.title) {
                $mainContainer.find('header.major h2').text(settings.title);
            }

            const $avisosContent = $('#' + settings.datacontainer);
            $avisosContent.empty();

            // Filtrar avisos activos y ordenar por fecha
            const avisosActivos = avisos
                .filter(aviso => aviso.activo)
            // .sort((a, b) => new Date(b.fecha_publicacion) - new Date(a.fecha_publicacion));

            if (avisosActivos.length === 0) {
                $avisosContent.html('<p class="text-muted">No hay avisos disponibles en este momento.</p>');
                return;
            }

            // Crear contenedor de avisos
            const $avisosContainer = $('<div></div>');

            // Agregar cada aviso
            avisosActivos.forEach(aviso => {
                const $avisoItem = $(` 
									<div class="aviso-item">
										<p class="aviso-titulo">${aviso.nombre}</p>
									</div>
								`);

                $avisosContainer.append($avisoItem);


                const items = aviso.items || [];
                if (items.length > 0) {
                    const $archivosContainer = $('<div class="archivos-container"></div>');
                    items.forEach(item => {
                        const itemFile = `<a href="${settings.url_files}${item.archivo}" target="_blank">${item.descripcion}</a>`;

                        $archivosContainer.append(`<div class="archivo-item">${itemFile}</div>`);

                        $avisosContainer.append($archivosContainer);
                    })
                }

            });

            $avisosContent.append($avisosContainer);
        },
        error: function (error) {
            console.error('Error avisos:', error);
            $('#avisos-content').html('<p class="text-danger">Error al cargar los avisos. Por favor intente más tarde.</p>');
        }
    });
}