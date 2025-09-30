import { settings, muestraContenido } from './helpers.js';

const modulosAside = () => {
  const aside = document.querySelector(settings.menu_container);
  if (!aside) return;

  const menu = document.createElement('ul');
  menu.classList.add('menu');

  const modulosFijos = [
    { id: 'inicio', nombre: 'Inicio', url: 'home.html' },
    { id: 'notas', nombre: 'Notas', url: 'notas.html' },
    { id: 'publicaciones', nombre: 'Publicaciones', url: 'modulos/publicaciones.html' },
    { id: 'biblioteca', nombre: 'Biblioteca', url: 'modulos/biblioteca.html' },
    { id: 'efemerides', nombre: 'Efemérides', url: 'modulos/efemerides.html' },
    { id: 'informes', nombre: 'Informes', url: 'modulos/informes.html' },
    { id: 'enlaces', nombre: 'Enlaces', url: 'modulos/enlaces.html' },
    { id: 'actividades', nombre: 'Actividades', url: 'modulos/actividades.html' }
  ];

  modulosFijos.forEach((modulo) => {
    const li = document.createElement('li');
    li.classList.add('menu__item');

    const enlace = document.createElement('a');
    enlace.href = '#';
    enlace.textContent = modulo.nombre;
    enlace.title = modulo.nombre;

    enlace.addEventListener('click', (event) => {
      event.preventDefault();
      muestraContenido(modulo.url);
    });

    li.appendChild(enlace);
    menu.appendChild(li);
  });

  aside.innerHTML = '';
  aside.appendChild(menu);
};

export default modulosAside;
