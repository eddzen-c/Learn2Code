# Recursos adaptables de Learn2Code: dragones y logos

Dos recursos separados con fondo transparente:

- `01-Dragon-principal`: personaje de la presentación de la landing.
- `02-Dragon-tarjeta-frontend`: personaje de la tarjeta de ruta.

Cada recurso contiene PNG y WebP de 128, 256, 384, 512, 768, 1024 y 1254 px de ancho y alto.
Todas las resoluciones de cada recurso se exportaron desde una sola imagen base para mantener su diseño.
WebP es la opción ligera para la web; PNG conserva una alternativa con transparencia.

## Uso adaptable

Abre `ejemplo-responsive.html` para ver ambos recursos sobre fondos claros y oscuros.
El ejemplo usa `picture`, `srcset` y `sizes` para elegir una resolución según el espacio disponible y la densidad de píxeles.
El CSS controla el tamaño visible: hasta 224 px en móvil, 320 px en tablet y 448 px en escritorio, sin desbordar su contenedor.
Cambiar el ancho de la ventana permite comprobar los cambios.

Para integrar el recurso en tu proyecto, copia las carpetas y adapta las rutas del ejemplo a tu carpeta pública de imágenes.
Conserva `height: auto` para mantener las proporciones.

## Origen de los dragones

Las bases transparentes se reconstruyeron con edición de imagen a partir del mockup JPEG de la landing.
Conservan el diseño de referencia; no son recortes de una ilustración original independiente, por lo que pueden variar detalles finos.
Las dimensiones menores son exportaciones de esas bases, sin volver a generar al personaje.

## Logos oficiales

Los archivos oficiales se exportaron directamente desde los PNG proporcionados, sin regeneración ni rediseño.
Se conserva el lienzo y la proporción de cada archivo: el isotipo es cuadrado y el logo completo tiene proporción 3:2.
Las variantes WebP usan compresión sin pérdida. Los PNG originales están en `00-Originales-oficiales`.

- Isotipo: 32, 48, 64, 96, 128, 192, 256, 384, 512, 768, 1024 y 1254 px de ancho.
- Logo completo: 128, 192, 256, 384, 512, 768, 1024, 1280 y 1536 px de ancho.
- Los altos se calculan proporcionalmente; no estires el logo para llenar un contenedor.

Para tamaños muy pequeños conviene usar el isotipo en lugar del logo completo.
El ejemplo HTML incluye ambos logos sobre fondo oscuro y conserva los ejemplos de los dragones.
