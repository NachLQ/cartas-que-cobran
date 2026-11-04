import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'cartas.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS configuracion_acreedor (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      nombre TEXT NOT NULL DEFAULT '',
      nif TEXT NOT NULL DEFAULT '',
      direccion TEXT NOT NULL DEFAULT '',
      telefono TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      tipo_interes_demora REAL NOT NULL DEFAULT 13.5,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS configuracion_interes (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      tipo_bce_porcentaje REAL NOT NULL DEFAULT 5.5,
      puntos_adicionales REAL NOT NULL DEFAULT 8.0,
      fecha_actualizacion TEXT NOT NULL DEFAULT (date('now'))
    );

    CREATE TABLE IF NOT EXISTS expedientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero_factura TEXT NOT NULL,
      concepto TEXT NOT NULL,
      importe_total REAL NOT NULL,
      importe_pagado REAL NOT NULL DEFAULT 0,
      fecha_factura TEXT NOT NULL,
      fecha_vencimiento TEXT NOT NULL,
      paso_actual INTEGER NOT NULL DEFAULT 1 CHECK (paso_actual BETWEEN 1 AND 5),
      estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo','resuelto','cerrado')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expediente_id INTEGER NOT NULL UNIQUE,
      nombre TEXT NOT NULL,
      nif TEXT NOT NULL DEFAULT '',
      direccion TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      telefono TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (expediente_id) REFERENCES expedientes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS comunicaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expediente_id INTEGER NOT NULL,
      fecha TEXT NOT NULL,
      canal TEXT NOT NULL CHECK (canal IN ('whatsapp','email','carta','burofax','otro')),
      resumen TEXT NOT NULL DEFAULT '',
      resultado TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (expediente_id) REFERENCES expedientes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS documentos_generados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expediente_id INTEGER NOT NULL,
      paso INTEGER NOT NULL,
      contenido_texto TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (expediente_id) REFERENCES expedientes(id) ON DELETE CASCADE
    );
  `);

  // Filas singleton de configuración
  db.prepare(`INSERT OR IGNORE INTO configuracion_acreedor (id) VALUES (1)`).run();
  db.prepare(`INSERT OR IGNORE INTO configuracion_interes (id) VALUES (1)`).run();
}

export default db;
