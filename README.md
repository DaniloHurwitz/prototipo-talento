# Cursada (prototipo)

Prototipo visual y navegable de una plataforma que conecta a estudiantes universitarios argentinos con empresas del exterior que necesitan trabajo remoto de medio tiempo. El intermediario cura los perfiles y cobra una comisión.

**No es un producto real.** No hay servidor, cuentas, pagos ni verificación. Todo está simulado y marcado como "demo".

## Cómo correrlo

- **Publicado:** subí la carpeta a un repo de GitHub y activá Pages (Settings > Pages > Deploy from a branch > `main` / root). No necesita compilar nada.
- **En tu compu:** abrí `index.html` en el navegador, o mejor, desde esta carpeta corré `python3 -m http.server` y entrá a `http://localhost:8000`.

Para recorrer la demo, usá el selector **Ver como** de la barra superior (Estudiante, Empresa, Admin). La vista de empresa tiene el selector **ES / EN**. Abajo de todo está **Restablecer los datos de ejemplo**.

### Un recorrido que muestra todo en 3 minutos

1. En **Estudiante**, completá el registro (o entrá con un perfil de ejemplo). Tu perfil queda "En revisión".
2. Postulate a una oferta: gastás Connects y lo ves en el contador de arriba y en **Mis postulaciones**.
3. En **Admin > Curaduría**, aprobá tu perfil. Probá **Rechazar** sin motivo: no te deja.
4. En **Empresa**, abrí la oferta: ahora aparece tu postulación. Contratá al estudiante.
5. En **Admin > Resumen**, cambiá la comisión y mirá cómo se recalculan los ingresos y el texto de la landing.

## Qué es real y qué es simulado

| Funciona de verdad (en tu navegador) | Simulado |
| --- | --- |
| Registro de estudiantes y empresas con validación | Ningún mail se envía ni se verifica |
| Postulaciones que descuentan Connects | La compra de Connects: suma saldo pero no cobra ni pide datos |
| Filtros, orden y búsqueda de ofertas y estudiantes | No hay cuentas ni contraseñas: "Cambiar de perfil" cambia de usuario sin login |
| Invitaciones de empresa a estudiante | Los contratos nuevos empiezan con 0 horas (no hay carga de horas) |
| Curaduría: aprobar y rechazar con motivo | Los ingresos del admin son cálculos sobre datos de ejemplo |
| Comisión configurable que cambia cálculos y textos | No hay mensajes ni chat entre las partes |
| Todo queda guardado en `localStorage` de ese navegador | Otra persona que abra el link ve sus propios datos, no los tuyos |

## Datos de ejemplo

15 estudiantes, 8 empresas, 10 ofertas (9 abiertas y 1 pausada), 15 postulaciones, 4 contratos activos y 4 compras de Connects, en `js/data.js`. Las personas y las empresas son inventadas; si alguna coincide con una real, es casualidad. No hay logos: cada empresa tiene un monograma con sus iniciales.

## Cambiar el nombre

El nombre está en un solo lugar: `APP.name` en `js/config.js`. Ahí también están los Connects iniciales, sus precios y la comisión por defecto. El `<title>` del HTML se reescribe desde ese valor.

## Decisiones que tomé sin preguntarte

- **Quién paga la comisión:** la empresa, encima de la tarifa del estudiante (10% por defecto). Al estudiante no se le cobra sobre lo que gana; paga solo si compra Connects. Es lo más fácil de vender a estudiantes.
- **Connects:** 20 gratis al registrarse. Postularse cuesta 2, o 4 si la oferta paga USD 13 /h o más. Paquetes de 10, 30 y 80 por USD 1,50, 4 y 9. Si una empresa te invita, no gastás nada.
- **Curaduría:** un estudiante en revisión puede postularse, pero la empresa no ve esa postulación hasta que el admin lo aprueba. Así se puede probar todo el circuito en la demo.
- **Idioma de las ofertas:** las empresas de afuera escriben en inglés, así que la mayoría de las ofertas están en inglés también en la vista de estudiante. Los perfiles de estudiantes están en español aunque la empresa vea la interfaz en inglés (la interfaz lo aclara).
- **Fecha fija:** la demo usa el 13 de noviembre de 2026 como "hoy" (`APP.today`), para que "hace 2 días" no cambie con el tiempo.
- **Sin framework:** HTML, CSS y JavaScript puro, sin dependencias ni compilación. Es lo más simple que funciona en GitHub Pages y que se puede editar con IA sin romper un build.

## Decisiones de diseño

El detalle de la investigación está en [INVESTIGACION.md](INVESTIGACION.md).

- **Una sola tipografía:** [Archivo](https://github.com/Omnibus-Type/Archivo), de Omnibus-Type (Buenos Aires), licencia OFL, servida desde `/fonts`. Los títulos usan su eje de ancho un poco más angosto.
- **Un solo color de acento:** verde yerba apagado (`#4A6A2C`) sobre un fondo casi blanco. Sin degradés, sin sombras, sin violeta.
- **Densidad tipo Upwork, limpieza tipo Notion:** filtros a la izquierda, resultados en filas separadas por una línea (no tarjetas), bordes de 1px, tablas para todo lo que se compara.
- **El producto como portada:** la landing no tiene un título gigante centrado; muestra las dos opciones y, debajo, ofertas reales del listado.
- **Estados vacíos y errores escritos:** cada error dice qué falta y cómo arreglarlo, y cada lista vacía dice qué hacer.
- **Sin movimiento decorativo:** solo cambios de color al pasar el mouse. Foco visible en todo y `prefers-reduced-motion` respetado.

### Revisión contra el "diseño de IA"

Antes de entregar corrí dos detectores open source sobre el prototipo:

- **Hallmark `sloplint`** (MIT) sobre el CSS y el HTML: 22 fallas en la primera pasada (blanco puro, colores fuera de los tokens). Las corregí todas. Queda una sola, la "gate 20", que pide un comentario de registro propio de Hallmark; no aplica a este proyecto.
- **Impeccable** (Apache-2.0), su detector de navegador, en 15 pantallas: no encontró ningún patrón de IA. Marcó líneas demasiado largas y palabras sueltas al final de párrafos; también las corregí.

Además revisé cada pantalla con capturas buscando textos genéricos. Cambié, por ejemplo, la primera versión de la landing (un título centrado con dos botones) y los mensajes de error vagos.

## Capturas

En [`/capturas`](capturas): landing, las vistas de estudiante, empresa (en español y en inglés) y admin, y tres pantallas de celular.

## Repos y recursos que usé

| Recurso | Licencia | Para qué |
| --- | --- | --- |
| [Nutlope/hallmark](https://github.com/Nutlope/hallmark) | MIT | Reglas contra patrones de IA y su linter |
| [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | Apache-2.0 | Catálogo de antipatrones y detector en navegador |
| [sharetribe/web-template](https://github.com/sharetribe/web-template) | Apache-2.0 | Estructura de pantallas de un marketplace (sin copiar código) |
| [sharetribe/sharetribe](https://github.com/sharetribe/sharetribe) | MIT | Modelo de comisión y panel de admin, como referencia |
| [micropyramid/opensource-job-portal](https://github.com/micropyramid/opensource-job-portal) | MIT | Campos de ofertas y postulantes, como referencia |
| [Archivo, Omnibus-Type](https://github.com/Omnibus-Type/Archivo) | OFL 1.1 | Tipografía (incluida, ver `fonts/OFL-Archivo.txt`) |

Ningún código de terceros está incluido salvo la tipografía.

## Qué faltaría para convertirlo en producto real

**Backend y cuentas**
- Base de datos multiusuario (por ejemplo Supabase o Firebase), login con mail o Google, permisos para que cada uno vea solo lo suyo.
- Mensajería entre empresa y estudiante, notificaciones por mail, carga y aprobación de horas.

**Pagos**
- Cobro a la empresa en dólares (Stripe, Payoneer o similar) y pago al estudiante en Argentina. Esto es lo más difícil: hay que resolver cómo entra y sale la plata, en qué moneda y con qué comprobantes.
- Venta de Connects (Mercado Pago para estudiantes), con facturación automática.
- Qué pasa con reembolsos, disputas y horas no aprobadas.

**Verificación**
- Comprobar que el estudiante es alumno regular (certificado de la universidad) y su identidad.
- Prueba de nivel de idioma, o al menos una entrevista corta.
- Verificar que la empresa existe (registro, web, dominio del mail).

**Legal** (información general, a confirmar con abogado y contador)
- Términos y condiciones, y política de privacidad según la Ley 25.326, con inscripción de la base de datos en la AAIP.
- Relación laboral: dejar claro que el estudiante es independiente y no empleado de la plataforma ni de la empresa.
- Estudiantes menores de 18 años: decidir si se aceptan.
- Facturación de la comisión y el régimen impositivo de quien opera la plataforma (monotributo o sociedad), y cómo factura el estudiante sus servicios al exterior.
- Contratos con las empresas: confidencialidad, propiedad de lo que produce el estudiante, reglas para no contratarlo por fuera de la plataforma.

**Producto**
- Medir si las empresas de afuera publican de verdad: es el lado difícil del marketplace.
- Moderación de ofertas (que no sean estafas ni trabajo encubierto mal pago).
