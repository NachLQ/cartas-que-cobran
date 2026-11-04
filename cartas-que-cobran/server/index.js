import express from 'express';
import cors from 'cors';
import db, { initSchema } from './db.js';
import { calcularExpediente } from './intereses.js';
import { generarDocumento } from './documentos.js';

initSchema();

// Primera ejecución: si no hay expedientes, cargar la demo automáticamente
// (así el pack funciona nada más arrancar, sin `npm run seed` manual).
if (db.prepare('SELECT COUNT(*) AS c FROM expedientes').get().c === 0) {
  await import('./seed.js');
}

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// ── Helpers ──────────────────────────────────────────────────────────────────
function getAcreedor() {
  return db.prepare('SELECT * FROM configuracion_acreedor WHERE id = 1').get();
}
function getInteres() {
  return db.prepare('SELECT * FROM configuracion_interes WHERE id = 1').get();
}
function tipoInteresEfectivo() {
  // El tipo de demora se gestiona en la configuración del acreedor (actualizable).
  return getAcreedor().tipo_interes_demora;
}
function calcExp(exp) {
  return calcularExpediente({
    importe_total: exp.importe_total,
    importe_pagado: exp.importe_pagado,
    fecha_vencimiento: exp.fecha_vencimiento,
    tipo_interes: tipoInteresEfectivo(),
  });
}
function expedienteCompleto(id) {
  const exp = db.prepare('SELECT * FROM expedientes WHERE id = ?').get(id);
  if (!exp) return null;
  const cliente = db.prepare('SELECT * FROM clientes WHERE expediente_id = ?').get(id) || {};
  const comunicaciones = db.prepare('SELECT * FROM comunicaciones WHERE expediente_id = ? ORDER BY fecha').all(id);
  const documentos = db.prepare('SELECT * FROM documentos_generados WHERE expediente_id = ? ORDER BY paso, created_at').all(id);
  return { ...exp, cliente, comunicaciones, documentos, calculo: calcExp(exp) };
}

// Alerta: pasos 3+ sin movimiento (sin comunicación) en > 15 días.
function tieneAlerta(exp) {
  if (exp.estado !== 'activo' || exp.paso_actual < 3) return false;
  const ultima = db.prepare('SELECT MAX(fecha) AS f FROM comunicaciones WHERE expediente_id = ?').get(exp.id);
  const ref = ultima && ultima.f ? new Date(ultima.f + 'T00:00:00') : new Date(exp.updated_at);
  const dias = Math.floor((Date.now() - ref.getTime()) / (1000 * 60 * 60 * 24));
  return dias > 15;
}

// ── Configuración del acreedor ───────────────────────────────────────────────
app.get('/api/configuracion', (req, res) => {
  res.json(getAcreedor());
});

app.put('/api/configuracion', (req, res) => {
  const a = getAcreedor();
  const { nombre, nif, direccion, telefono, email, tipo_interes_demora } = req.body;
  db.prepare(`UPDATE configuracion_acreedor SET
      nombre = ?, nif = ?, direccion = ?, telefono = ?, email = ?, tipo_interes_demora = ?, updated_at = datetime('now')
    WHERE id = 1`).run(
    nombre ?? a.nombre, nif ?? a.nif, direccion ?? a.direccion,
    telefono ?? a.telefono, email ?? a.email,
    tipo_interes_demora ?? a.tipo_interes_demora
  );
  res.json(getAcreedor());
});

// ── Configuración de interés (BCE + puntos) ──────────────────────────────────
app.get('/api/interes', (req, res) => {
  const i = getInteres();
  res.json({ ...i, tipo_demora_total: i.tipo_bce_porcentaje + i.puntos_adicionales });
});

app.put('/api/interes', (req, res) => {
  const i = getInteres();
  const { tipo_bce_porcentaje, puntos_adicionales } = req.body;
  const bce = tipo_bce_porcentaje ?? i.tipo_bce_porcentaje;
  const puntos = puntos_adicionales ?? i.puntos_adicionales;
  db.prepare(`UPDATE configuracion_interes SET tipo_bce_porcentaje = ?, puntos_adicionales = ?, fecha_actualizacion = date('now') WHERE id = 1`)
    .run(bce, puntos);
  // Sincroniza el tipo de demora efectivo del acreedor.
  db.prepare(`UPDATE configuracion_acreedor SET tipo_interes_demora = ?, updated_at = datetime('now') WHERE id = 1`)
    .run(bce + puntos);
  const out = getInteres();
  res.json({ ...out, tipo_demora_total: out.tipo_bce_porcentaje + out.puntos_adicionales });
});

// ── Expedientes ──────────────────────────────────────────────────────────────
app.get('/api/expedientes', (req, res) => {
  const { estado, paso } = req.query;
  let rows = db.prepare('SELECT * FROM expedientes ORDER BY created_at').all();
  if (estado) rows = rows.filter(r => r.estado === estado);
  if (paso) rows = rows.filter(r => String(r.paso_actual) === String(paso));
  const data = rows.map(exp => {
    const cliente = db.prepare('SELECT * FROM clientes WHERE expediente_id = ?').get(exp.id) || {};
    return { ...exp, cliente, calculo: calcExp(exp), alerta: tieneAlerta(exp) };
  });
  // Orden por urgencia: paso más alto primero, luego más días de retraso.
  data.sort((a, b) => {
    if (a.estado !== b.estado) return a.estado === 'activo' ? -1 : 1;
    if (b.paso_actual !== a.paso_actual) return b.paso_actual - a.paso_actual;
    return b.calculo.dias_retraso - a.calculo.dias_retraso;
  });
  res.json(data);
});

app.get('/api/expedientes/:id', (req, res) => {
  const exp = expedienteCompleto(Number(req.params.id));
  if (!exp) return res.status(404).json({ error: 'Expediente no encontrado' });
  res.json({ ...exp, alerta: tieneAlerta(exp) });
});

app.post('/api/expedientes', (req, res) => {
  const b = req.body;
  const cli = b.cliente || {};
  const insExp = db.prepare(`INSERT INTO expedientes
      (numero_factura, concepto, importe_total, importe_pagado, fecha_factura, fecha_vencimiento, paso_actual, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  const tx = db.transaction(() => {
    const r = insExp.run(
      b.numero_factura || '', b.concepto || '',
      Number(b.importe_total) || 0, Number(b.importe_pagado) || 0,
      b.fecha_factura || '', b.fecha_vencimiento || '',
      Number(b.paso_actual) || 1, b.estado || 'activo'
    );
    const id = r.lastInsertRowid;
    db.prepare(`INSERT INTO clientes (expediente_id, nombre, nif, direccion, email, telefono)
        VALUES (?, ?, ?, ?, ?, ?)`).run(
      id, cli.nombre || '', cli.nif || '', cli.direccion || '', cli.email || '', cli.telefono || ''
    );
    return id;
  });
  const id = tx();
  res.status(201).json(expedienteCompleto(id));
});

app.put('/api/expedientes/:id', (req, res) => {
  const id = Number(req.params.id);
  const exp = db.prepare('SELECT * FROM expedientes WHERE id = ?').get(id);
  if (!exp) return res.status(404).json({ error: 'Expediente no encontrado' });
  const b = req.body;
  const cli = b.cliente;
  const tx = db.transaction(() => {
    db.prepare(`UPDATE expedientes SET
        numero_factura = ?, concepto = ?, importe_total = ?, importe_pagado = ?,
        fecha_factura = ?, fecha_vencimiento = ?, paso_actual = ?, estado = ?, updated_at = datetime('now')
      WHERE id = ?`).run(
      b.numero_factura ?? exp.numero_factura, b.concepto ?? exp.concepto,
      b.importe_total ?? exp.importe_total, b.importe_pagado ?? exp.importe_pagado,
      b.fecha_factura ?? exp.fecha_factura, b.fecha_vencimiento ?? exp.fecha_vencimiento,
      b.paso_actual ?? exp.paso_actual, b.estado ?? exp.estado, id
    );
    if (cli) {
      db.prepare(`UPDATE clientes SET nombre = ?, nif = ?, direccion = ?, email = ?, telefono = ? WHERE expediente_id = ?`)
        .run(cli.nombre ?? '', cli.nif ?? '', cli.direccion ?? '', cli.email ?? '', cli.telefono ?? '', id);
    }
  });
  tx();
  res.json(expedienteCompleto(id));
});

app.delete('/api/expedientes/:id', (req, res) => {
  const id = Number(req.params.id);
  const r = db.prepare('DELETE FROM expedientes WHERE id = ?').run(id);
  if (r.changes === 0) return res.status(404).json({ error: 'Expediente no encontrado' });
  res.json({ ok: true });
});

// Avanzar al siguiente paso (máximo 5).
app.post('/api/expedientes/:id/avanzar-paso', (req, res) => {
  const id = Number(req.params.id);
  const exp = db.prepare('SELECT * FROM expedientes WHERE id = ?').get(id);
  if (!exp) return res.status(404).json({ error: 'Expediente no encontrado' });
  const nuevo = Math.min(5, exp.paso_actual + 1);
  db.prepare(`UPDATE expedientes SET paso_actual = ?, updated_at = datetime('now') WHERE id = ?`).run(nuevo, id);
  res.json(expedienteCompleto(id));
});

// Calcular intereses (en vivo).
app.get('/api/expedientes/:id/calcular-intereses', (req, res) => {
  const exp = db.prepare('SELECT * FROM expedientes WHERE id = ?').get(Number(req.params.id));
  if (!exp) return res.status(404).json({ error: 'Expediente no encontrado' });
  res.json(calcExp(exp));
});

// Generar documento de un paso.
app.post('/api/expedientes/:id/generar-documento/:paso', (req, res) => {
  const id = Number(req.params.id);
  const paso = Number(req.params.paso);
  const exp = db.prepare('SELECT * FROM expedientes WHERE id = ?').get(id);
  if (!exp) return res.status(404).json({ error: 'Expediente no encontrado' });
  if (paso < 1 || paso > 5) return res.status(400).json({ error: 'Paso no válido' });
  const cliente = db.prepare('SELECT * FROM clientes WHERE expediente_id = ?').get(id) || {};
  const acreedor = getAcreedor();
  const calculo = calcExp(exp);
  const hoyISO = new Date().toISOString().slice(0, 10);
  const contenido = generarDocumento(paso, { expediente: exp, cliente, acreedor, calculo, hoyISO });
  const r = db.prepare(`INSERT INTO documentos_generados (expediente_id, paso, contenido_texto) VALUES (?, ?, ?)`)
    .run(id, paso, contenido);
  res.status(201).json({ id: r.lastInsertRowid, expediente_id: id, paso, contenido_texto: contenido });
});

// Guardar el texto editado de un documento.
app.put('/api/documentos/:docId', (req, res) => {
  const docId = Number(req.params.docId);
  const { contenido_texto } = req.body;
  const r = db.prepare(`UPDATE documentos_generados SET contenido_texto = ? WHERE id = ?`).run(contenido_texto || '', docId);
  if (r.changes === 0) return res.status(404).json({ error: 'Documento no encontrado' });
  res.json(db.prepare('SELECT * FROM documentos_generados WHERE id = ?').get(docId));
});

// Registrar comunicación.
app.post('/api/expedientes/:id/comunicaciones', (req, res) => {
  const id = Number(req.params.id);
  const exp = db.prepare('SELECT * FROM expedientes WHERE id = ?').get(id);
  if (!exp) return res.status(404).json({ error: 'Expediente no encontrado' });
  const b = req.body;
  const fecha = b.fecha || new Date().toISOString().slice(0, 10);
  const r = db.prepare(`INSERT INTO comunicaciones (expediente_id, fecha, canal, resumen, resultado)
      VALUES (?, ?, ?, ?, ?)`).run(id, fecha, b.canal || 'otro', b.resumen || '', b.resultado || '');
  db.prepare(`UPDATE expedientes SET updated_at = datetime('now') WHERE id = ?`).run(id);
  res.status(201).json(db.prepare('SELECT * FROM comunicaciones WHERE id = ?').get(r.lastInsertRowid));
});

// ── Panel (métricas) ─────────────────────────────────────────────────────────
app.get('/api/panel', (req, res) => {
  const rows = db.prepare('SELECT * FROM expedientes').all();
  let total_reclamado_activo = 0;
  let total_recuperado = 0;
  const por_paso = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let alertas = 0;
  for (const exp of rows) {
    const cal = calcExp(exp);
    if (exp.estado === 'activo') {
      total_reclamado_activo += cal.total_reclamable;
      por_paso[exp.paso_actual] = (por_paso[exp.paso_actual] || 0) + 1;
      if (tieneAlerta(exp)) alertas++;
    }
    if (exp.estado === 'resuelto') {
      total_recuperado += exp.importe_pagado;
    }
  }
  res.json({
    total_expedientes: rows.length,
    activos: rows.filter(r => r.estado === 'activo').length,
    resueltos: rows.filter(r => r.estado === 'resuelto').length,
    cerrados: rows.filter(r => r.estado === 'cerrado').length,
    total_reclamado_activo: Math.round(total_reclamado_activo * 100) / 100,
    total_recuperado: Math.round(total_recuperado * 100) / 100,
    por_paso,
    alertas,
  });
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`✅ Cartas que Cobran — API escuchando en http://localhost:${PORT}`);
});
