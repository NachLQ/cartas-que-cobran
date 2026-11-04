// Seed de datos demo realistas en español. Idempotente: vacía y recarga.
import db, { initSchema } from './db.js';
import { calcularExpediente } from './intereses.js';

initSchema();

const MS_DIA = 1000 * 60 * 60 * 24;
function hace(dias) {
  return new Date(Date.now() - dias * MS_DIA).toISOString().slice(0, 10);
}

console.log('🌱 Limpiando base de datos...');
db.exec(`DELETE FROM documentos_generados; DELETE FROM comunicaciones; DELETE FROM clientes; DELETE FROM expedientes;`);
db.exec(`DELETE FROM sqlite_sequence WHERE name IN ('expedientes','clientes','comunicaciones','documentos_generados');`);

// Configuración del acreedor (negocio del usuario)
const TIPO_DEMORA = 13.5; // BCE 5,5% + 8 puntos (orientativo, actualizable)
db.prepare(`UPDATE configuracion_acreedor SET
    nombre = ?, nif = ?, direccion = ?, telefono = ?, email = ?, tipo_interes_demora = ?, updated_at = datetime('now')
  WHERE id = 1`).run(
  'Marta Ríos — Estudio Creativo', 'X1234567Z',
  'Calle Aragó 215, 3º 2ª, 08007 Barcelona',
  '+34 600 112 233', 'hola@martarios.es', TIPO_DEMORA
);
db.prepare(`UPDATE configuracion_interes SET tipo_bce_porcentaje = 5.5, puntos_adicionales = 8.0, fecha_actualizacion = date('now') WHERE id = 1`).run();

const insExp = db.prepare(`INSERT INTO expedientes
  (numero_factura, concepto, importe_total, importe_pagado, fecha_factura, fecha_vencimiento, paso_actual, estado, created_at, updated_at)
  VALUES (@numero_factura, @concepto, @importe_total, @importe_pagado, @fecha_factura, @fecha_vencimiento, @paso_actual, @estado, datetime('now'), datetime('now'))`);
const insCli = db.prepare(`INSERT INTO clientes (expediente_id, nombre, nif, direccion, email, telefono)
  VALUES (?, ?, ?, ?, ?, ?)`);
const insCom = db.prepare(`INSERT INTO comunicaciones (expediente_id, fecha, canal, resumen, resultado) VALUES (?, ?, ?, ?, ?)`);
const insDoc = db.prepare(`INSERT INTO documentos_generados (expediente_id, paso, contenido_texto, created_at) VALUES (?, ?, ?, datetime('now'))`);

function crear(exp, cliente, comunicaciones = [], documentos = []) {
  const r = insExp.run(exp);
  const id = r.lastInsertRowid;
  insCli.run(id, cliente.nombre, cliente.nif, cliente.direccion, cliente.email, cliente.telefono);
  for (const c of comunicaciones) insCom.run(id, c.fecha, c.canal, c.resumen, c.resultado || '');
  for (const d of documentos) insDoc.run(id, d.paso, d.contenido_texto);
  return id;
}

// 1) Estudio Diseño Vidal — 1.850€, vencida hace 31 días. Paso 2.
crear(
  { numero_factura: '2026-041', concepto: 'Diseño de identidad de marca', importe_total: 1850, importe_pagado: 0,
    fecha_factura: hace(61), fecha_vencimiento: hace(31), paso_actual: 2, estado: 'activo' },
  { nombre: 'Estudio Diseño Vidal', nif: 'B66123456', direccion: 'Carrer de Pau Claris 88, 08010 Barcelona', email: 'admin@estudiovidal.com', telefono: '+34 933 221 100' },
  [
    { fecha: hace(15), canal: 'whatsapp', resumen: 'Recordatorio amable enviado por WhatsApp.', resultado: 'Sin respuesta' },
  ],
  [
    { paso: 2, contenido_texto: 'Documento del paso 2 generado y pendiente de enviar. Pulsa "Generar documento" para regenerarlo con los datos actuales.' },
  ]
);

// 2) Academia Digital Norte — 540€, vencida hace 9 días. Paso 1. Sin comunicaciones.
crear(
  { numero_factura: '2026-052', concepto: 'Sesión de formación in-company', importe_total: 540, importe_pagado: 0,
    fecha_factura: hace(39), fecha_vencimiento: hace(9), paso_actual: 1, estado: 'activo' },
  { nombre: 'Academia Digital Norte', nif: 'B33445566', direccion: 'Calle Uría 40, 33003 Oviedo', email: 'gestion@adnorte.es', telefono: '+34 985 100 200' },
  [],
  []
);

// 3) Reformas Montseny SL — 3.400€, vencida hace 52 días. Paso 3. Pasos 1 y 2 hechos.
crear(
  { numero_factura: '2026-029', concepto: 'Proyecto web y catálogo online', importe_total: 3400, importe_pagado: 0,
    fecha_factura: hace(82), fecha_vencimiento: hace(52), paso_actual: 3, estado: 'activo' },
  { nombre: 'Reformas Montseny SL', nif: 'B62987654', direccion: 'Avinguda Diagonal 405, 08008 Barcelona', email: 'contabilidad@reformasmontseny.com', telefono: '+34 932 445 566' },
  [
    { fecha: hace(45), canal: 'whatsapp', resumen: 'Recordatorio amable (paso 1).', resultado: 'Visto, sin respuesta' },
    { fecha: hace(30), canal: 'email', resumen: 'Reclamación firme (paso 2). Pedida fecha de pago.', resultado: 'Sin respuesta' },
    { fecha: hace(7), canal: 'carta', resumen: 'Carta de reclamación formal (paso 3) enviada.', resultado: 'Sin respuesta' },
  ],
  [
    { paso: 3, contenido_texto: 'Carta formal del paso 3 generada y enviada hace una semana. Regenera para actualizar intereses.' },
  ]
);

// 4) Clínica Wellness Sur — 960€, vencida hace ~8 meses (243 días). Paso 4.
crear(
  { numero_factura: '2025-118', concepto: 'Campaña de redes sociales (trimestre)', importe_total: 960, importe_pagado: 0,
    fecha_factura: hace(273), fecha_vencimiento: hace(243), paso_actual: 4, estado: 'activo' },
  { nombre: 'Clínica Wellness Sur', nif: 'B92112233', direccion: 'Avenida de la Constitución 12, 41001 Sevilla', email: 'direccion@wellnesssur.es', telefono: '+34 954 778 899' },
  [
    { fecha: hace(230), canal: 'whatsapp', resumen: 'Recordatorio amable (paso 1).', resultado: 'Prometió pago, no cumplió' },
    { fecha: hace(210), canal: 'email', resumen: 'Reclamación firme (paso 2).', resultado: 'Sin respuesta' },
    { fecha: hace(150), canal: 'carta', resumen: 'Carta formal (paso 3).', resultado: 'Sin respuesta' },
    { fecha: hace(60), canal: 'burofax', resumen: 'Requerimiento por burofax (paso 4) con acuse de recibo.', resultado: 'Entregado, sin pago' },
  ],
  [
    { paso: 4, contenido_texto: 'Texto de burofax del paso 4 generado y enviado con acuse de recibo. En espera de decidir si continuar al monitorio.' },
  ]
);

// 5) Taller Creativo Barna — 280€. RESUELTO. Pagó tras el paso 2.
crear(
  { numero_factura: '2026-014', concepto: 'Diseño de cartelería para evento', importe_total: 280, importe_pagado: 280,
    fecha_factura: hace(95), fecha_vencimiento: hace(65), paso_actual: 2, estado: 'resuelto' },
  { nombre: 'Taller Creativo Barna', nif: 'B61555444', direccion: 'Carrer del Rec 24, 08003 Barcelona', email: 'hola@tallercreativobarna.cat', telefono: '+34 931 002 003' },
  [
    { fecha: hace(58), canal: 'whatsapp', resumen: 'Recordatorio amable (paso 1).', resultado: 'Sin respuesta' },
    { fecha: hace(50), canal: 'email', resumen: 'Reclamación firme (paso 2).', resultado: 'Pagó en 3 días' },
    { fecha: hace(47), canal: 'otro', resumen: 'Pago recibido por transferencia. Expediente cerrado como cobrado.', resultado: 'Cobrado 280€' },
  ],
  []
);

// 6) Consultoría Azul — 2.100€, vencida hace 120 días. Paso 5 (monitorio). Activo.
crear(
  { numero_factura: '2026-008', concepto: 'Consultoría de marca y estrategia digital', importe_total: 2100, importe_pagado: 0,
    fecha_factura: hace(150), fecha_vencimiento: hace(120), paso_actual: 5, estado: 'activo' },
  { nombre: 'Consultoría Azul', nif: 'B85667788', direccion: 'Calle de Alcalá 200, 28028 Madrid', email: 'admin@consultoriaazul.com', telefono: '+34 914 556 677' },
  [
    { fecha: hace(112), canal: 'whatsapp', resumen: 'Recordatorio amable (paso 1).', resultado: 'Sin respuesta' },
    { fecha: hace(95), canal: 'email', resumen: 'Reclamación firme (paso 2).', resultado: 'Sin respuesta' },
    { fecha: hace(70), canal: 'carta', resumen: 'Carta formal (paso 3).', resultado: 'Sin respuesta' },
    { fecha: hace(35), canal: 'burofax', resumen: 'Burofax con acuse (paso 4).', resultado: 'Entregado, sin pago' },
    { fecha: hace(5), canal: 'otro', resumen: 'Preparando petición inicial de proceso monitorio (paso 5).', resultado: 'En curso' },
  ],
  [
    { paso: 5, contenido_texto: 'Datos pre-rellenados para la petición inicial del proceso monitorio. Regenera para volcar los importes actualizados.' },
  ]
);

// Resumen de comprobación de cálculos
console.log('\n📊 Comprobación de cálculos (tipo demora ' + TIPO_DEMORA + '%):');
const exps = db.prepare('SELECT * FROM expedientes ORDER BY id').all();
for (const e of exps) {
  const cli = db.prepare('SELECT nombre FROM clientes WHERE expediente_id = ?').get(e.id);
  const cal = calcularExpediente({
    importe_total: e.importe_total, importe_pagado: e.importe_pagado,
    fecha_vencimiento: e.fecha_vencimiento, tipo_interes: TIPO_DEMORA,
  });
  console.log(`  · ${cli.nombre.padEnd(26)} pend ${cal.importe_pendiente}€  ${cal.dias_retraso}d  int ${cal.interes_demora}€  indem ${cal.indemnizacion_costes}€  total ${cal.total_reclamable}€  [paso ${e.paso_actual}/${e.estado}]`);
}

console.log('\n✅ Seed completado: 6 expedientes cargados.');
// Nota: no cerramos la conexión aquí para que el arranque con auto-seed
// (import desde index.js) pueda seguir usando el mismo `db`. En modo
// standalone (`npm run seed`) el proceso termina y el SO libera el fichero.
