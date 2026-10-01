# Notu — juegos desbloqueados

Página estática para descubrir juegos por categoría, añadir sitios publicados en GitHub Pages y
revivir juegos Flash propios con Ruffle.

## Añadir un juego

- Una página HTTPS en `usuario.github.io` se añade a la colección y se abre en una pestaña nueva.
- Para Flash, carga un archivo `.swf` local o usa la URL directa HTTPS de
  `raw.githubusercontent.com` que termina en `.swf`. Los repositorios y las URL `/blob/` contienen
  código fuente, no un juego ejecutable.
- No se incluyen juegos Flash. Usa archivos que tengas derecho a utilizar. El SWF se limita a
  50 MB, se valida por su cabecera y se procesa localmente; Ruffle no puede acceder a la red,
  abrir enlaces externos ni interactuar con la página.
- El paquete oficial de Ruffle 0.6.0 se carga desde unpkg solo cuando se abre un SWF. Sin conexión
  no se puede cargar el reproductor.

## Publicación

GitHub Pages está configurado para servir la raíz de `main` en
<https://uyruw3.github.io/Notu/>. Los cambios se publican cuando llegan a esa rama.