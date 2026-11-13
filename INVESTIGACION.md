# Investigación previa (13 nov 2026)

Lo que leí antes de escribir código, qué tomé de cada cosa y qué descarté.

## 1. Guías y skills contra el "diseño de IA"

| Recurso | Licencia | Qué hice con él |
| --- | --- | --- |
| [Nutlope/hallmark](https://github.com/Nutlope/hallmark) | MIT | Lo cloné y leí `references/gates.md` entero (la lista de ~80 "tells" con su arreglo). Usé su linter `sloplint.mjs` contra el CSS y el HTML del prototipo. |
| [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | Apache-2.0 | Lo cloné. Su catálogo `antipatterns.json` (62 patrones) lo usé como checklist y corrí su detector de navegador en cada pantalla durante la revisión. |
| Skill `frontend-design` de Anthropic | (incluida en la sesión) | La seguí como proceso: plan de tokens primero, revisión del plan contra el brief, y crítica con capturas. |
| [The Fountain Institute: 7 señales de UI hecha por IA](https://www.thefountaininstitute.com/blog/signs-vibe-coded-ui) y [925studios: fuentes y degradés](https://www.925studios.co/blog/ai-slop-design-tells) | artículos | Confirman la misma lista: degradé violeta-azul, Inter en todo, tres tarjetas iguales, hero centrado. |

Reglas concretas que salieron de esa lectura y que apliqué:

- Nada de degradés, brillos, glassmorphism, sombras en todas las tarjetas ni tarjeta dentro de tarjeta (Hallmark 2a, 3, 4, 29).
- Ni Inter ni la fuente del sistema como cara principal (Hallmark 1). Una sola familia.
- Sin etiquetas en mayúsculas espaciadas ni "eyebrows" arriba de los títulos (Hallmark 54 y 67).
- Sin puntuación de plantilla: textos unidos con puntos medios, flechas pegadas a los botones (Hallmark 63).
- Sin métricas, testimonios ni logos inventados presentados como reales (Hallmark 46a). Todo lo de ejemplo dice "demo".
- Sin formularios que muestren "¡Listo!" sin hacer nada (Hallmark 70): cada acción cambia datos de verdad en localStorage y se ve el cambio.
- Foco visible, `prefers-reduced-motion`, nada de `transition: all` (Hallmark 10a, 26a, 27).
- Copy: sin palabras como "potenciá", "sin fricciones", "solución innovadora" (Hallmark 19, Impeccable `marketing-buzzword`).

## 2. Marketplaces y job boards open source (estructura y UX)

| Repo | Licencia | Qué tomé |
| --- | --- | --- |
| [sharetribe/web-template](https://github.com/sharetribe/web-template) | Apache-2.0 | Estructura de páginas de un marketplace (búsqueda con filtros, ficha, gestión de publicaciones, bandeja) y su patrón de "sin resultados + botón para limpiar filtros" (`NoSearchResultsMaybe`). No copié código: solo la estructura de pantallas. |
| [sharetribe/sharetribe](https://github.com/sharetribe/sharetribe) (versión Rails, histórica) | MIT | Referencia del modelo de comisión del operador y panel de administración. |
| [micropyramid/opensource-job-portal](https://github.com/micropyramid/opensource-job-portal) | MIT | Campos típicos de una oferta y de un postulante. |
| [aschmelyun/laravel-job-board](https://github.com/aschmelyun/laravel-job-board) | MIT | Referencia de un job board chico y simple. |

No reutilicé código de ninguno: el prototipo es HTML, CSS y JavaScript propios, sin dependencias.

## 3. Sistemas de diseño estilo Notion / Upwork

| Recurso | Licencia | Uso |
| --- | --- | --- |
| [sreeram-venkitesh/notion.css](https://github.com/sreeram-venkitesh/notion.css) | MIT | Referencia de bordes finos, grises cálidos y formularios sobrios. No lo incluí. |
| [@jungherz-de/notionkit](https://www.jsdelivr.com/package/npm/@jungherz-de/notionkit) | MIT | Referencia de densidad de tablas y vistas de base de datos. No lo incluí. |
| Upwork (producto, no código) | propietario | Solo como referencia de densidad: lista de ofertas en filas, filtros a la izquierda, Connects visibles. Nada de su marca ni su verde. |

Descarté usar una librería de componentes: agregaba peso y su "look" por defecto es justamente lo que se reconoce como plantilla.

## 4. Plan de diseño (antes de construir)

**Tipografía:** [Archivo](https://github.com/Omnibus-Type/Archivo), de Omnibus-Type, una fundidora de Buenos Aires (licencia OFL, incluida en `/fonts`). Una sola familia: los títulos usan su eje de ancho un poco más angosto, el resto en ancho normal. Es una grotesca pensada para texto denso y tablas, y no está en ninguna lista de fuentes "de IA".

**Color:** fondo casi blanco neutro, tinta oscura con un toque verde, y un solo acento: un verde yerba apagado. No es el verde de Upwork ni el celeste de plantilla.

| Token | Hex | Uso |
| --- | --- | --- |
| `--paper` | `#FBFBF9` | fondo |
| `--ink` | `#22251F` | texto principal |
| `--muted` | `#696C63` | texto secundario |
| `--line` | `#E3E3DD` | bordes de 1px |
| `--accent` | `#4A6A2C` | botón principal, selección, links |
| `--danger` | `#A93A2E` | errores y rechazos |

**Layout:** aplicación, no landing de marketing. Barra superior fina con el nombre, el selector de vista de la demo y los Connects. En las listas: filtros a la izquierda (240px) y resultados en filas separadas por líneas, no tarjetas con sombra. Todo alineado a la izquierda.

```
+---------------------------------------------------------------+
| Cursada   [Estudiante|Empresa|Admin]          18 Connects  ES |
+-------------+-------------------------------------------------+
| Área        | 10 ofertas                       Ordenar: nuevas |
| [ ] Salud   | ------------------------------------------------ |
| [ ] Datos   | Medical transcription reviewer (EN)    USD 9-12/h |
| Idioma      | Kestrel Health, Irlanda  · 10 h/sem   2 Connects |
| Tarifa      | ------------------------------------------------ |
| Horas       | ...                                              |
+-------------+-------------------------------------------------+
```

**Lo memorable:** la landing abre con ofertas reales de la demo (filas de la base), no con una frase grande. El producto es el "hero".

**Revisión del plan contra el brief:** mi primera idea de landing era un título grande centrado con dos botones abajo; es exactamente el hero genérico que el brief prohíbe. La cambié por un texto corto alineado a la izquierda, dos opciones lado a lado con lo que pasa al elegir cada una, y debajo una muestra de ofertas reales.
