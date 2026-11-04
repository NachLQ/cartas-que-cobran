// Generador de documentos de los 5 pasos de escalada.
// Cada plantilla recibe el contexto del expediente y devuelve texto publicable tal cual.

export function euro(n) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n || 0);
}

export function fechaLarga(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
}

export function fechaCorta(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
}

const SEP = '\n\n────────────────────────────────────────\n\n';

// ctx = { expediente, cliente, acreedor, calculo, hoyISO }
export function generarDocumento(paso, ctx) {
  switch (Number(paso)) {
    case 1: return paso1(ctx);
    case 2: return paso2(ctx);
    case 3: return paso3(ctx);
    case 4: return paso4(ctx);
    case 5: return paso5(ctx);
    default: throw new Error('Paso no válido');
  }
}

// ── PASO 1 — Recordatorio amable (WhatsApp + email) ──────────────────────────
function paso1({ expediente: e, cliente: c, acreedor: a, calculo: cal }) {
  const whatsapp =
`📱 WHATSAPP — Recordatorio amable

Hola ${c.nombre}, te escribo respecto a la factura ${e.numero_factura} de ${e.concepto} por importe de ${euro(cal.importe_pendiente)} con vencimiento el ${fechaCorta(e.fecha_vencimiento)}. Quería asegurarme de que todo estaba correcto y que no había ningún problema. Si necesitas algo por mi parte, dímelo. Un saludo, ${a.nombre || '[tu nombre]'}`;

  const email =
`✉️ EMAIL — Recordatorio amable

Asunto: Recordatorio factura ${e.numero_factura} — ${a.nombre || '[tu negocio]'}

Estimado/a ${c.nombre}:

Espero que te encuentres bien. Me pongo en contacto contigo en relación con la factura ${e.numero_factura}, correspondiente a ${e.concepto}, por un importe de ${euro(cal.importe_pendiente)} y con fecha de vencimiento el ${fechaCorta(e.fecha_vencimiento)} (adjunto de nuevo la factura para tu comodidad).

Es posible que se trate de un simple olvido, así que te agradecería que me confirmaras una fecha aproximada de pago. Si hubiera cualquier incidencia o necesitaras alguna aclaración por mi parte, quedo totalmente a tu disposición.

Muchas gracias de antemano por tu atención.

Un cordial saludo,
${a.nombre || '[tu nombre]'}
${a.email || ''}${a.telefono ? '\n' + a.telefono : ''}`;

  return whatsapp + SEP + email;
}

// ── PASO 2 — Reclamación firme (email) ───────────────────────────────────────
function paso2({ expediente: e, cliente: c, acreedor: a, calculo: cal }) {
  return (
`✉️ EMAIL — Reclamación firme

Asunto: Reclamación de pago — Factura ${e.numero_factura} vencida hace ${cal.dias_retraso} días

Estimado/a ${c.nombre}:

Le escribo de nuevo en relación con la factura ${e.numero_factura}, de ${e.concepto}, por importe de ${euro(cal.importe_pendiente)}, cuyo vencimiento se produjo el ${fechaCorta(e.fecha_vencimiento)}. A día de hoy el pago acumula ${cal.dias_retraso} días de retraso y no he recibido respuesta a mi comunicación anterior.

Le ruego que me confirme una fecha concreta de pago en el plazo de los próximos días. Confío en que se trate de un retraso puntual y que podamos resolverlo de forma amistosa.

En caso de no recibir respuesta, me veré en la obligación de iniciar una reclamación formal de la deuda, con la liquidación de los intereses de demora y los costes de cobro que correspondan conforme a la Ley 3/2004 de lucha contra la morosidad.

Quedo a la espera de sus noticias.

Atentamente,
${a.nombre || '[tu nombre]'}${a.nif ? '\nNIF: ' + a.nif : ''}
${a.email || ''}${a.telefono ? '\n' + a.telefono : ''}`
  );
}

// ── PASO 3 — Carta de reclamación formal (PDF + texto burofax) ───────────────
function paso3({ expediente: e, cliente: c, acreedor: a, calculo: cal, hoyISO }) {
  return (
`CARTA DE RECLAMACIÓN FORMAL

${a.nombre || '[Acreedor]'}${a.nif ? '\nNIF: ' + a.nif : ''}${a.direccion ? '\n' + a.direccion : ''}${a.email ? '\n' + a.email : ''}${a.telefono ? '\n' + a.telefono : ''}

En ${a.direccion ? a.direccion.split(',').slice(-1)[0].trim() : '________'}, a ${fechaLarga(hoyISO)}

Destinatario:
${c.nombre}${c.nif ? '\nNIF: ' + c.nif : ''}${c.direccion ? '\n' + c.direccion : ''}

ASUNTO: Reclamación de deuda — Factura ${e.numero_factura}

Estimado/a ${c.nombre}:

Por medio de la presente le comunico formalmente que, a fecha de hoy, mantiene usted pendiente de pago la factura ${e.numero_factura}, de fecha ${fechaCorta(e.fecha_factura)}, correspondiente a los servicios de ${e.concepto}, por un importe de ${euro(cal.importe_pendiente)}.

Dicha factura venció el ${fechaCorta(e.fecha_vencimiento)}, por lo que el pago acumula a día de hoy ${cal.dias_retraso} días de retraso, pese a las comunicaciones previas remitidas sin que se haya obtenido respuesta ni propuesta de pago.

LIQUIDACIÓN DE LA DEUDA A DÍA DE HOY:
  · Principal pendiente ............... ${euro(cal.importe_pendiente)}
  · Intereses de demora (${cal.tipo_interes}% anual, ${cal.dias_retraso} días) ... ${euro(cal.interes_demora)}
  · Indemnización por costes de cobro (Ley 3/2004) ... ${euro(cal.indemnizacion_costes)}
  · TOTAL RECLAMADO .................. ${euro(cal.total_reclamable)}

Le REQUIERO para que proceda al abono de la cantidad adeudada en el plazo máximo de DIEZ (10) DÍAS HÁBILES a contar desde la recepción de la presente comunicación.

En caso de no atender este requerimiento dentro del plazo indicado, me veré obligado a iniciar las acciones legales oportunas para la recuperación de la deuda, incluyendo el envío de requerimiento mediante burofax y, en su caso, la presentación de un proceso monitorio ante el Juzgado competente, con el consiguiente incremento de los importes reclamados (intereses y costas).

Confío, no obstante, en que resolvamos este asunto de forma amistosa antes de llegar a esa situación.

Atentamente,


Fdo.: ${a.nombre || '[Acreedor]'}${a.nif ? '\nNIF: ' + a.nif : ''}`
  );
}

// ── PASO 4 — Requerimiento de pago / texto para burofax ──────────────────────
function paso4({ expediente: e, cliente: c, acreedor: a, calculo: cal, hoyISO }) {
  const instrucciones =
`INSTRUCCIONES PARA ENVIAR EL BUROFAX
1. Acuda a una oficina de Correos o use Correos Online (www.correos.es).
2. Solicite un BUROFAX CON CERTIFICACIÓN DE TEXTO Y ACUSE DE RECIBO. Esto acredita el contenido, la fecha y la entrega: es la prueba que necesitará si llega a juicio.
3. Lleve dos copias del texto: una se envía y otra se la sella Correos como justificante.
4. Conserve el acuse de recibo y la certificación de texto junto al expediente.
5. Coste orientativo: entre 30 € y 50 € según extensión. Es un gasto recuperable como coste de cobro.`;

  const texto =
`REQUERIMIENTO FEHACIENTE DE PAGO

En ${a.direccion ? a.direccion.split(',').slice(-1)[0].trim() : '________'}, a ${fechaLarga(hoyISO)}

Don/Doña ${a.nombre || '[nombre acreedor]'}, con NIF ${a.nif || '[NIF]'}, con domicilio en ${a.direccion || '[dirección]'}, como acreedor de los servicios prestados a ${c.nombre}, con NIF ${c.nif || '[NIF deudor]'} y domicilio en ${c.direccion || '[dirección deudor]'}, por medio del presente

REQUIERO formalmente el pago de la cantidad de ${euro(cal.importe_pendiente)} de principal, más ${euro(cal.interes_demora)} en concepto de intereses de demora y ${euro(cal.indemnizacion_costes)} en concepto de indemnización por costes de cobro, lo que asciende a un total de ${euro(cal.total_reclamable)}, calculados conforme a la Ley 3/2004, de 29 de diciembre, por la que se establecen medidas de lucha contra la morosidad en las operaciones comerciales.

Dicha deuda trae causa de la factura ${e.numero_factura}, de fecha ${fechaCorta(e.fecha_factura)}, por los servicios de ${e.concepto}, vencida el ${fechaCorta(e.fecha_vencimiento)} y que acumula ${cal.dias_retraso} días de impago.

El abono deberá realizarse en el plazo máximo de CINCO (5) DÍAS HÁBILES desde la recepción del presente requerimiento, con expreso apercibimiento de que, de no atenderse, se iniciarán sin más trámite las acciones legales oportunas para la recuperación de la deuda, incluida la presentación de la correspondiente demanda de proceso monitorio ante el Juzgado competente, con imposición de las costas e intereses que procedan.

El presente requerimiento se remite por conducto fehaciente (burofax con certificación de texto y acuse de recibo) a fin de que quede constancia de su contenido, fecha y recepción.

Atentamente,


Fdo.: ${a.nombre || '[nombre acreedor]'}
NIF: ${a.nif || '[NIF]'}`;

  return texto + SEP + instrucciones;
}

// ── PASO 5 — Preparación proceso monitorio ───────────────────────────────────
function paso5({ expediente: e, cliente: c, acreedor: a, calculo: cal }) {
  const datos =
`PETICIÓN INICIAL DE PROCESO MONITORIO — DATOS PRE-RELLENADOS
(art. 812 y ss. de la Ley 1/2000 de Enjuiciamiento Civil)

DATOS DEL ACREEDOR (parte demandante):
  · Nombre / razón social: ${a.nombre || '[completar]'}
  · NIF: ${a.nif || '[completar]'}
  · Domicilio: ${a.direccion || '[completar]'}
  · Teléfono / email: ${a.telefono || '—'} / ${a.email || '—'}

DATOS DEL DEUDOR (parte demandada):
  · Nombre / razón social: ${c.nombre}
  · NIF: ${c.nif || '[completar]'}
  · Domicilio: ${c.direccion || '[completar — imprescindible para la notificación]'}
  · Teléfono / email: ${c.telefono || '—'} / ${c.email || '—'}

DEUDA RECLAMADA:
  · Principal: ${euro(cal.importe_pendiente)} (factura ${e.numero_factura}, de ${fechaCorta(e.fecha_factura)}, por ${e.concepto})
  · Vencimiento: ${fechaCorta(e.fecha_vencimiento)} — ${cal.dias_retraso} días de impago
  · Intereses de demora (${cal.tipo_interes}% anual): ${euro(cal.interes_demora)}
  · Indemnización por costes de cobro: ${euro(cal.indemnizacion_costes)}
  · TOTAL RECLAMADO: ${euro(cal.total_reclamable)}

DOCUMENTOS A APORTAR (numerar como anexos):
  1. Factura ${e.numero_factura}.
  2. Justificante del servicio prestado (contrato, presupuesto aceptado, albarán o emails).
  3. Comunicaciones de reclamación previas (recordatorios, email, carta formal, burofax con acuse).`;

  const guia =
`GUÍA PASO A PASO — PROCESO MONITORIO

¿QUÉ ES? Un procedimiento judicial rápido y sencillo para reclamar deudas dinerarias, vencidas y exigibles que consten documentalmente (una factura impagada vale). No necesita abogado ni procurador si la reclamación no supera los 2.000 €; por encima sí son obligatorios, aunque el procedimiento sigue siendo asequible.

PASO A. Reúna la documentación
  Factura, prueba del servicio y todas las reclamaciones previas (aquí es clave el burofax con acuse del paso 4).

PASO B. Rellene el formulario oficial
  Existe un impreso normalizado "Petición inicial de procedimiento monitorio". Lo encontrará en la web del Consejo General del Poder Judicial / Administración de Justicia (busque "petición inicial monitorio impreso"). Los datos de arriba ya están listos para volcarlos.

PASO C. Identifique el Juzgado competente
  Es el Juzgado de Primera Instancia del domicilio del DEUDOR (o del lugar donde pueda ser hallado). En este expediente: domicilio del deudor → ${c.direccion || '[completar dirección del deudor]'}.

PASO D. Presente la petición
  · Presencialmente: en el Juzgado de Primera Instancia o en el Servicio Común de Registro / Decanato de esa localidad.
  · Telemáticamente: a través de la sede judicial electrónica correspondiente (los profesionales usan LexNET; los particulares, la sede electrónica habilitada en su comunidad autónoma).

PASO E. Tasas
  La presentación del monitorio está EXENTA DE TASAS para personas físicas. Las personas jurídicas sí abonan tasa por debajo de cierto umbral; consúltelo según su caso.

PASO F. Qué ocurre después
  El Juzgado requiere al deudor para que, en 20 días hábiles, pague o se oponga:
    · Si paga → fin, ha cobrado.
    · Si no responde → se despacha ejecución (embargo de bienes/cuentas).
    · Si se opone → el asunto pasa a juicio (verbal u ordinario según la cuantía).

RECORDATORIO: este documento es un apoyo para preparar la reclamación. No sustituye el asesoramiento de un profesional. Revise la petición con un abogado o graduado social antes de presentarla, especialmente si la cuantía supera los 2.000 € o el deudor puede oponerse.`;

  return datos + SEP + guia;
}
