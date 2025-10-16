/**
 * Renderiza el aviso de privacidad del Centro de Estudios para la Igualdad de Género y Derechos Humanos.
 * @param {Object} settings - Configuración para definir contenedores y título del aviso.
 */
export function muestra(settings = {}) {
    const mainContainerId = settings.main_container || 'main_container';
    const $mainContainer = $('#' + mainContainerId);

    if (!$mainContainer.length) {
        console.warn(`No se encontró el contenedor con id "${mainContainerId}" para mostrar el aviso de privacidad.`);
        return;
    }

    const titulo = settings.title || 'Aviso de privacidad';

    $mainContainer.empty();

    const $header = $(`
        <header class="major">
            <h2 class="modulo-nombre">${titulo}</h2>
        </header>
    `);

    const contenidoHTML = `
        <div class="aviso-privacidad card shadow-sm border-0">
            <div class="card-body aviso-privacidad__body">
                <section class="aviso-privacidad__section mb-4">
                    <p>
                        El Congreso del Estado de Veracruz de Ignacio de la Llave, con domicilio en Avenida Encanto esquina
                        Avenida Lázaro Cárdenas sin número, Colonia El Mirador, Código Postal 91170, Xalapa, Veracruz, es el
                        responsable del tratamiento de los datos personales que nos proporcione. Estos datos serán protegidos
                        conforme a la Ley 316 de Protección de Datos Personales en Posesión de Sujetos Obligados para el Estado
                        de Veracruz de Ignacio de la Llave y demás normatividad aplicable.
                    </p>
                </section>

                <section class="aviso-privacidad__section mb-4">
                    <h3 class="h4">Finalidades del tratamiento</h3>
                    <p>Sus datos personales serán utilizados para las siguientes finalidades necesarias:</p>
                    <ol class="ps-3">
                        <li>Registrar su inscripción a la modalidad de capacitación que haya elegido.</li>
                        <li>Generar listas de asistencia y validar su participación.</li>
                        <li>Emitir constancias de participación o asistencia según la modalidad correspondiente.</li>
                        <li>Establecer comunicación para dar seguimiento a los cursos, aclarar dudas, notificar cancelaciones o cambios de horario, fecha o sede.</li>
                    </ol>
                    <p>De manera adicional, utilizaremos su información personal para:</p>
                    <ul class="ps-3">
                        <li>Enviar material de exposición o apoyo.</li>
                        <li>Extender invitaciones a futuros eventos.</li>
                    </ul>
                    <p class="mb-0">
                        Si no desea que sus datos personales sean tratados para las finalidades adicionales, puede manifestarlo enviando un correo a
                        <a href="mailto:rbautista@legisver.gob.mx">rbautista@legisver.gob.mx</a>.
                    </p>
                </section>

                <section class="aviso-privacidad__section mb-4">
                    <h3 class="h4">Datos personales recabados</h3>
                    <p>Para las finalidades antes señaladas se solicitarán los siguientes datos personales:</p>
                    <ul class="ps-3">
                        <li>Nombre.</li>
                        <li>Lugar de procedencia.</li>
                        <li>Institución laboral y área de adscripción.</li>
                        <li>Cargo público o función que desempeña.</li>
                        <li>Correo electrónico.</li>
                        <li>Teléfonos institucional y celular.</li>
                        <li>Firma.</li>
                    </ul>
                    <p class="mb-0">Se informa que no se recabarán datos personales sensibles.</p>
                </section>

                <section class="aviso-privacidad__section mb-4">
                    <h3 class="h4">Fundamento legal</h3>
                    <p>
                        Para los efectos legales correspondientes, se entiende como responsable de la información que contenga datos personales al
                        Centro de Estudios para la Igualdad de Género y Derechos Humanos de la Sexagésima Quinta Legislatura. Lo anterior se realiza
                        con fundamento en el artículo 57, fracción X, de la Ley Orgánica del Poder Legislativo del Estado de Veracruz de Ignacio de la Llave,
                        así como en el artículo 31 Bis, incisos i) y k), del Reglamento de los Servicios Administrativos del Congreso del Estado de Veracruz
                        de Ignacio de la Llave.
                    </p>
                </section>

                <section class="aviso-privacidad__section mb-4">
                    <h3 class="h4">Transferencia de los datos personales</h3>
                    <p class="mb-0">
                        No se realizarán transferencias que requieran su consentimiento, salvo aquellas necesarias para atender requerimientos de información
                        de una autoridad competente, debidamente fundados y motivados.
                    </p>
                </section>

                <section class="aviso-privacidad__section mb-4">
                    <h3 class="h4">Derechos ARCO</h3>
                    <p>
                        Usted tiene derecho a conocer qué datos personales se tienen de usted, para qué se utilizan y las condiciones de su uso (Acceso).
                        Asimismo, puede solicitar la corrección de su información personal cuando esté desactualizada, sea inexacta o incompleta (Rectificación);
                        pedir que se elimine de los registros o bases de datos si considera que su manejo no se ajusta a los principios y obligaciones legales
                        (Cancelación); y oponerse al uso de sus datos personales para fines específicos (Oposición).
                    </p>
                    <p>
                        Para ejercer cualquiera de los derechos ARCO, presente su solicitud ante la Unidad de Transparencia, a través de la Plataforma Nacional
                        de Transparencia (<a href="http://www.plataformadetransparencia.org.mx/web/guest/inicio" target="_blank" rel="noopener">plataformadetransparencia.org.mx</a>)
                        o al correo <a href="mailto:transparencia@legisver.gob.mx">transparencia@legisver.gob.mx</a>.
                    </p>
                    <h4 class="h5 mt-3">Requisitos de la solicitud</h4>
                    <ul class="ps-3">
                        <li>Nombre del titular y domicilio o cualquier medio para recibir notificaciones.</li>
                        <li>Documentos que acrediten la identidad del titular y, en su caso, la representación legal.</li>
                        <li>Área responsable que trata los datos personales, si es posible identificarla.</li>
                        <li>Descripción clara y precisa de los datos personales respecto de los que se busca ejercer algún derecho ARCO.</li>
                        <li>Descripción del derecho que se desea ejercer o la petición del titular.</li>
                        <li>Cualquier otro elemento o documento que facilite la localización de los datos personales.</li>
                    </ul>
                    <p>
                        Para solicitar la rectificación, deberá indicar las modificaciones a realizar y aportar la documentación oficial que sustente su petición.
                        En el caso de la cancelación, debe expresar las causas que motivan la eliminación. Para ejercer el derecho de oposición, señale los motivos
                        que justifican la finalización del tratamiento de los datos personales y el daño o perjuicio que le causaría, o bien, especifique las
                        finalidades con las que no está de acuerdo cuando la oposición sea parcial.
                    </p>
                    <p class="mb-0">
                        La Unidad de Transparencia responderá a través del medio señalado en la solicitud dentro de un plazo de 15 días hábiles, prorrogable por
                        10 días más previa notificación. De resultar procedente, la solicitud se hará efectiva dentro de los 15 días hábiles siguientes a la fecha
                        en que se comunique la respuesta.
                    </p>
                </section>

                <section class="aviso-privacidad__section mb-4">
                    <h3 class="h4">Datos de la Unidad de Transparencia</h3>
                    <p>
                        <strong>Domicilio:</strong> Avenida Encanto esquina Avenida Lázaro Cárdenas sin número, Colonia El Mirador, Código Postal 91170, Xalapa, Veracruz.<br>
                        <strong>Teléfono:</strong> 228 842 0500 ext. 3127.<br>
                        <strong>Correo electrónico:</strong> <a href="mailto:transparencia@legisver.gob.mx">transparencia@legisver.gob.mx</a>.
                    </p>
                    <p class="mb-0">
                        Cualquier modificación a este aviso de privacidad se dará a conocer en
                        <a href="http://www.legisver.gob.mx/Inicio.php?p=datosP" target="_blank" rel="noopener">http://www.legisver.gob.mx/Inicio.php?p=datosP</a>.
                    </p>
                </section>

                <section class="aviso-privacidad__section">
                    <div class="alert alert-info" role="alert">
                        <h4 class="alert-heading h5 mb-2">Aviso de privacidad simplificado del Centro de Estudios para la Igualdad de Género y Derechos Humanos</h4>
                        <p class="mb-2">
                            El Honorable Congreso del Estado de Veracruz de Ignacio de la Llave es el responsable del tratamiento de los datos personales que nos
                            proporcione. Se utilizarán para registrar su participación en las modalidades de capacitación, generar listas de asistencia, emitir
                            constancias y mantener comunicación para dar seguimiento a los cursos.
                        </p>
                        <p class="mb-2">
                            Sus datos pueden compartirse con autoridades administrativas y jurisdiccionales que, en el ejercicio de sus atribuciones, requieran
                            la información de manera debidamente fundada y motivada.
                        </p>
                        <p class="mb-0">
                            Consulte el aviso de privacidad integral en
                            <a href="http://www.legisver.gob.mx/Inicio.php?p=datosP" target="_blank" rel="noopener">http://www.legisver.gob.mx/Inicio.php?p=datosP</a>.
                        </p>
                    </div>
                </section>
            </div>
        </div>
    `;

    const $contenido = $(contenidoHTML);

    $mainContainer.append($header, $contenido);
}