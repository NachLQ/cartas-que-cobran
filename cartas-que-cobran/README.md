# 📨 Cartas que Cobran

**Del recordatorio amable al monitorio, paso a paso, sin abogado hasta que haga falta.**

Herramienta para autónomos y pequeños negocios en España que tienen facturas impagadas y no saben
qué hacer después del tercer WhatsApp ignorado. Te lleva de la mano por una **escalada de cobro en 5
pasos**, genera el documento listo para enviar en cada fase y calcula los intereses de demora y la
indemnización por costes de cobro conforme a la Ley 3/2004.

---

## ⚠️ AVISO LEGAL

> **Esta herramienta es un apoyo documental. No es asesoramiento jurídico. Se recomienda revisar
> cualquier acción legal con un profesional antes de ejecutarla.**

El aviso aparece dentro de la app en la pantalla de configuración y, de forma destacada, **antes de
generar los documentos de los pasos 3, 4 y 5** (carta formal, burofax y proceso monitorio).

---

## 🚀 Instalación y arranque

Requisitos: **Node.js 18+** (probado con Node 24) y npm.

```bash
# 1. Instalar dependencias (cliente + servidor, monorepo con workspaces)
npm install

# 2. Cargar los datos demo (6 expedientes realistas)
npm run seed

# 3. Arrancar servidor (API :3001) y cliente (web :5173) a la vez
npm run dev
```

Abre **http://localhost:5173**. La API REST queda en **http://localhost:3001** (el cliente la consume
a través del proxy de Vite, no necesitas tocar nada).

> Si `better-sqlite3` da error de compilación, asegúrate de tener una versión compatible con tu Node
> (este proyecto fija `^12.x`, válida para Node 18–24).

---

## 🧭 Cómo funciona

### Crear un expediente
**Panel → “+ Nuevo expediente”.** Rellena la factura (número, concepto, importe total, importe pagado
si hubo pago parcial, fechas) y los datos del cliente deudor (nombre, NIF, dirección, email, teléfono).
El **importe pendiente** se calcula solo (`total − pagado`). En menos de 2 minutos tienes el expediente
y puedes generar el documento de su paso.

### La escalada de 5 pasos
El sistema **recomienda** el paso según los días de retraso, pero **el paso actual lo controlas tú**
(puedes ir por detrás de lo recomendado). Avanzas con el botón “Avanzar al paso siguiente”.

| Paso | Nombre | Tramo orientativo | Formato del documento |
|------|--------|-------------------|------------------------|
| 1 | Recordatorio amable | Días 1–7 | WhatsApp + email |
| 2 | Reclamación firme | Días 8–21 | Email |
| 3 | Carta de reclamación formal | Días 22–45 | Texto/PDF (imprimir) + burofax |
| 4 | Requerimiento / burofax | Días 46–90 | Texto para burofax + instrucciones |
| 5 | Proceso monitorio | +90 días | Datos pre-rellenados + guía paso a paso |

Cada expediente muestra una **línea de tiempo visual** con el paso actual resaltado. El botón
**“Generar documento del paso”** es el CTA principal.

### Cómo usar los documentos generados
Al generar un documento se abre un editor: el texto ya trae **insertados los datos reales** del
expediente (deudor, NIF, importe, intereses, fechas, días de retraso, acreedor…). Puedes **editarlo**,
y luego **copiarlo** (📋), **descargarlo como .txt** (⬇️) o **imprimirlo / guardarlo como PDF** (🖨️,
usa el diálogo del navegador “Guardar como PDF”). Los cambios se guardan con 💾.

Después, registra el envío en **“Registrar / marcar como enviado”** (canal, fecha, resumen, resultado).
Ese historial alimenta las alertas y deja traza para un eventual monitorio.

### Cómo se calculan los intereses
La calculadora está **siempre visible** en la vista del expediente. Fórmula:

```
Interés de demora = importe_pendiente × (tipo% / 100) × (días_retraso / 365)
```

- **tipo%** = tipo de referencia del BCE + 8 puntos (configurable; por defecto 5,5 + 8 = **13,5 %**).
- **días_retraso** = días naturales desde el vencimiento hasta hoy.

**Indemnización por costes de cobro (Ley 3/2004, art. 8):**

| Importe pendiente | Indemnización |
|-------------------|---------------|
| Hasta 999,99 € | 40 € fijos |
| 1.000 € – 9.999,99 € | 70 € fijos |
| 10.000 € o más | 1 % del importe |

**Total reclamable = pendiente + intereses + indemnización.** Se recalcula a la fecha de hoy.

> **Ejemplo (seed “Reformas Montseny SL”):** 3.400 € pendientes, vencidos hace 52 días, tipo 13,5 %.
> Interés = 3.400 × 0,135 × 52/365 = **65,39 €**. Indemnización (tramo 1.000–9.999,99 €) = **70 €**.
> Total reclamable = **3.535,39 €**. *(Los días corren desde el vencimiento, así que el número exacto
> sube cada día que pasa; el cálculo de la app y el hecho a mano coinciden.)*

### Cómo actualizar el tipo de interés
**Configuración → Tipo de interés de demora.** Cambia el “tipo de referencia BCE” (publicado
semestralmente) y/o los puntos adicionales. El tipo total se aplica de inmediato a todos los cálculos
y documentos. También puedes editar ahí los datos de tu negocio (acreedor).

---

## 📊 El panel

Pantalla principal. Muestra:
- **Métricas:** total reclamado activo, total recuperado, nº de alertas, expedientes totales.
- **Distribución de expedientes activos por paso** (clicable para filtrar).
- **Lista de expedientes ordenada por urgencia** (paso más alto + más días de retraso primero), con
  cliente, importe pendiente, línea de tiempo, días de retraso y estado.
- **Filtros** por estado y por paso.
- **Alerta visual** ⏰ en expedientes en paso 3+ que llevan más de 15 días sin movimiento.

Estados del expediente: **activo** · **resuelto** (cobrado total o parcial) · **cerrado** (dado por perdido).

---

## 🌱 Qué incluye el seed (`npm run seed`)

6 expedientes en distintas fases (tipo de demora 13,5 %):

1. **Estudio Diseño Vidal** — 1.850 €, vencida hace 31 días. Paso 2. Recordatorio enviado sin respuesta.
2. **Academia Digital Norte** — 540 €, vencida hace 9 días. Paso 1. Sin comunicaciones.
3. **Reformas Montseny SL** — 3.400 €, vencida hace 52 días. Paso 3. Pasos 1 y 2 hechos; carta enviada.
4. **Clínica Wellness Sur** — 960 €, vencida hace ~8 meses. Paso 4 (burofax). Historial completo.
5. **Taller Creativo Barna** — 280 €. **Resuelto** (pagó tras el paso 2). Caso de éxito del panel.
6. **Consultoría Azul** — 2.100 €, vencida hace 120 días. Paso 5 (monitorio). Datos pre-rellenados.

El seed también carga los datos del acreedor demo y el tipo de interés (BCE 5,5 % + 8 puntos).

---

## 🗂️ Estructura del proyecto

```
cartas-que-cobran/
├── package.json          # workspaces + scripts (dev, seed)
├── server/               # API REST (Node + Express + SQLite/better-sqlite3)
│   ├── index.js          # rutas
│   ├── db.js             # esquema SQLite
│   ├── intereses.js      # cálculo de intereses e indemnización
│   ├── documentos.js     # plantillas de los 5 documentos (copy publicable)
│   └── seed.js           # datos demo
└── client/               # React 18 + Vite + Tailwind
    └── src/
        ├── App.jsx, api.js
        ├── pages/        # Panel, ExpedienteDetalle, NuevoExpediente, Configuracion
        └── components/   # Timeline, CalculadoraIntereses, DocumentoModal, AvisoLegal
```

### API REST

```
GET/PUT  /api/configuracion                         # datos del acreedor
GET/PUT  /api/interes                                # tipo BCE + puntos
GET/POST /api/expedientes                            # lista (filtros ?estado &paso) / crear
GET/PUT/DELETE /api/expedientes/:id
POST     /api/expedientes/:id/avanzar-paso
GET      /api/expedientes/:id/calcular-intereses
POST     /api/expedientes/:id/generar-documento/:paso
PUT      /api/documentos/:docId                      # guardar texto editado
POST     /api/expedientes/:id/comunicaciones
GET      /api/panel                                  # métricas
```

---

## 🚧 Qué queda fuera del MVP (fase 2)

- Envío certificado real / **burofax digital** integrado con Correos.
- **Firma electrónica** de los documentos.
- Integración con **gestoría** o software contable.
- **Notificaciones automáticas** de recordatorio de seguimiento.
- **Multiusuario** y autenticación (ahora es de un solo usuario local).
- Generación nativa de PDF en servidor (ahora el PDF se obtiene vía “Imprimir → Guardar como PDF” del
  navegador, sin dependencias extra).

> **Integraciones externas simuladas:** el envío de WhatsApp/email/burofax no se conecta a ningún
> proveedor real; la app genera el texto y tú lo envías por tu canal. La capa está aislada y
> documentada para enchufar el proveedor real en fase de pulido.
