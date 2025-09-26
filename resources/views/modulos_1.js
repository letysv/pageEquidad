/**
 * Función que carga los módulos desde la API y los muestra en el menú dinámico.
 * @param {string} urlApi
 * @param {string} contenedor
 */

import * as notas from './notas.js';

export function modulosAside(settings) {
    $.ajax({
        url: settings.url_api,
        method: 'GET',
        dataType: 'json',
        success: function (data) {
            const $menu = $('#' + settings.menu_container);
            $menu.empty();

            // Obtener la ruta/hash actual
            const currentPath = window.location.pathname + window.location.hash;
            let moduloActivoEncontrado = false;

            const $liInicio = $('<li></li>');
            const $aInicio = $('<a href=""></a>')
                .append(`<img src="${settings.url_files_iconos}inicio.png" class="menu-icon" alt="Inicio">`)
                .append(' Inicio');

            $liInicio.append($aInicio);
            $menu.append($liInicio);

            const $liNotas = $('<li></li>');
            const $aNotas = $('<a href=""></a>')
                .append(`<img src="${settings.url_files_iconos}notas.png" class="menu-icon" alt="Notas">`)
                .append(' Notas');
            
            $liNotas.append($aNotas);
            $aNotas.on("click", function (e) {
                e.preventDefault();
                notas.muestra(settings);
            });
            $menu.append($liNotas);

            // Filtrar y ordenar módulos activos
            const modulosActivos = data
                .filter(modulo => modulo.activo)
                // .sort((a, b) => a.orden - b.orden);
                .sort((a, b) => (a.posicion ?? 0) - (b.posicion ?? 0));

            // Si no hay módulos activos
            if (modulosActivos.length === 0) {
                // $menu.html('<li class="text-muted">No hay módulos disponibles</li>');
                return;
            }

            // const $liInicio = $('<li></li>');
            // const $aInicio = $('<a href="">Inicio</a>')
            // const $liInicio = $('<li></li>');
            // const $aInicio = $('<a href=""></a>')
            // .append(`<img src="${settings.url_files_iconos}default.png" class="menu-icon" alt="Inicio">`)
            // .append(' Inicio');  // El espacio antes de "Inicio" es importante para separar el icono del texto

            // $liInicio.append($aInicio);
            // $menu.append($liInicio);

            // const $liNotas = $('<li></li>');
            // const $aNotas = $('<a href="">Notas</a>')
            // const $liNotas = $('<li></li>');
            // const $aNotas = $('<a href=""></a>')
            // .append(`<img src="${settings.url_files_iconos}default.png" class="menu-icon" alt="Notas">`)
            // .append(' Notas');
            // $liNotas.append($aNotas);
            // $aNotas.on("click", function (e) {
            //     e.preventDefault(); // Prevenir el comportamiento por defecto del enlace
            //     notas.muestra(settings);
            // });
            // $menu.append($liNotas);


            // Crear ítems del menú
            modulosActivos.forEach(modulo => {
                const $li = $('<li></li>');
                const $a = $('<a></a>')
                    .attr('href', '#')
                    // .attr('href', modulo.link || '#')
                    // .attr('href', modulo.link || modulo.enlace || '#')
                    // .attr('target', '_blank')
                    .attr('role', 'button') 
                    .text(modulo.nombre);


                $a.on('click', function (e) {
                    e.preventDefault(); // Prevenir el comportamiento por defecto del enlace
                    const api = settings.url_base + 'api/modulo/' + modulo.id;
                    settings.url_api = api;
                    settings.title = modulo.nombre;
                    muestraContenido(settings);
                });

                // Determinar si es el ítem activo
                // const esActivo = currentPath.includes(modulo.enlace) ||
                const slug = modulo.enlace || modulo.link || '';
                const esActivo = (slug && currentPath.includes(slug)) ||
                    (modulo.es_inicio && !moduloActivoEncontrado && currentPath.endsWith('/'));

                if (esActivo) {
                    $a.addClass('active');
                    moduloActivoEncontrado = true;
                }

                // Agregar icono si existe
                // if (modulo.icon) {
                //     $a.prepend(`<span class="icon ${modulo.icon}"></span> `);
                // }

                if (modulo.icon) {
                    // Asume que modulo.icon contiene el nombre del archivo (ej: "mi-icono.png")
                    const iconUrl = settings.url_files_iconos + modulo.icon;
                    $a.prepend(`<img src="${iconUrl}" class="menu-icon" alt="${modulo.nombre}"> `);
                }

                $li.append($a);
                $menu.append($li);
            });

            // Si ningún ítem quedó activo, activar el primero
            if (!moduloActivoEncontrado && modulosActivos.length > 0) {
                // $menu.find('li:first-child a').addClass('active');
            }

            // Inicializar funcionalidad de scroll del template
            if (typeof $.fn.scrolly === 'function') {
                $menu.find('a').scrolly();
            }
        },
        error: function (error) {
            console.error('Error al cargar módulos:', error);
            $('#dynamic-menu').html('<li class="text-danger">Error al cargar el menú</li>');
        }
    });
}

function muestraContenido(settings) {
    const $mainContainer = $("#" + settings.main_container);
    if (settings.title) {
        $mainContainer.find("header.major h2").text(settings.title);
    }

    $.ajax({
        url: settings.url_api,
        method: "GET",
        dataType: "json",
        success: function (data) {
            // Procesar y mostrar los datos en el contenedor correspondiente
            const $container = $("#" + settings.main_container);
            $container.empty();
            if (settings.title) {
                $container.find("header.major h2").text(settings.title);
            }
            if (data && data.length > 0) {
                data.forEach((item) => {
                    // Crear contenedor principal del módulo
                    const $item = $(`
                                        <header class="major">
                                            <h2 class="modulo-nombre">${item.nombre}</h2>
                                            <div class="modulo-secciones"></div>
                                        </header>
                                    `);

                    const $seccionesContainer = $item.find(".modulo-secciones");

                    // Procesar las secciones del módulo
                    if (item.modulos_seccion && item.modulos_seccion.length > 0) {
                        item.modulos_seccion.forEach((seccion) => {
                            const $seccion = $(`
                                                <div class="seccion-item">
                                                    <h4 class="seccion-nombre">${seccion.nombre}</h4>
                                                    <div class="items-container"></div>
                                                </div>
                                            `);

                            const $itemsContainer = $seccion.find(".items-container");

                            // Procesar los items de la sección
                            if (seccion.items_seccion && seccion.items_seccion.length > 0) {
                                seccion.items_seccion.forEach((itemSeccion) => {
                                    const $itemSeccion = $(`
                                                        <div class="item-seccion">
                                                            <a href="${settings.url_files}${itemSeccion.archivo}" target="_blank" class="item-archivo">
                                                                ${itemSeccion.nombre}
                                                            </a>
                                                        </div>
                                                    `);
                                    $itemsContainer.append($itemSeccion);
                                });
                            } else {
                                $itemsContainer.html(
                                    '<p class="text-muted">No hay items en esta sección</p>'
                                );
                            }

                            $seccionesContainer.append($seccion);
                        });
                    } else {
                        $seccionesContainer.html(
                            '<p class="text-muted">No hay secciones disponibles</p>'
                        );
                    }

                    $container.append($item);
                });
            } else {
                $container.html("<p>No hay datos disponibles</p>");
            }
        },
        error: function (error) {
            console.error("Error al cargar contenido:", error);
            const $container = $("#" + settings.datacontainer);
            $container.html('<p class="text-danger">Error al cargar contenido</p>');
        },
    });
}
