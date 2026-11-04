import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api.js';

const hoy = new Date().toISOString().slice(0, 10);

export default function NuevoExpediente() {
  const navigate = useNavigate();
  const [guardando, setGuardando] = useState(false);
  const [f, setF] = useState({
    numero_factura: '',
    concepto: '',
    importe_total: '',
    importe_pagado: '0',
    fecha_factura: hoy,
    fecha_vencimiento: hoy,
    estado: 'activo',
    cliente: { nombre: '', nif: '', direccion: '', email: '', telefono: '' },
  });

  const set = (k, v) => setF({ ...f, [k]: v });
  const setCli = (k, v) => setF({ ...f, cliente: { ...f.cliente, [k]: v } });

  async function submit(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      const exp = await api.crearExpediente({
        ...f,
        importe_total: Number(String(f.importe_total).replace(',', '.')) || 0,
        importe_pagado: Number(String(f.importe_pagado).replace(',', '.')) || 0,
      });
      navigate(`/expedientes/${exp.id}`);
    } finally {
      setGuardando(false);
    }
  }

  const pendiente = (Number(String(f.importe_total).replace(',', '.')) || 0) - (Number(String(f.importe_pagado).replace(',', '.')) || 0);

  return (
    <form className="max-w-3xl mx-auto space-y-6" onSubmit={submit}>
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link to="/" className="hover:text-marca-600">Panel</Link><span>/</span><span className="text-slate-600">Nuevo expediente</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-800">Nuevo expediente de deuda</h1>

      <div className="card p-5 space-y-4">
        <h2 className="font-semibold text-slate-700">Datos de la factura</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Campo label="Número de factura *"><input required className="input" value={f.numero_factura} onChange={e => set('numero_factura', e.target.value)} placeholder="2026-001" /></Campo>
          <Campo label="Concepto del servicio *"><input required className="input" value={f.concepto} onChange={e => set('concepto', e.target.value)} placeholder="Diseño web" /></Campo>
          <Campo label="Importe total (€) *"><input required type="text" inputMode="decimal" className="input" value={f.importe_total} onChange={e => set('importe_total', e.target.value)} placeholder="1850" /></Campo>
          <Campo label="Importe pagado (€)"><input type="text" inputMode="decimal" className="input" value={f.importe_pagado} onChange={e => set('importe_pagado', e.target.value)} /></Campo>
          <Campo label="Fecha de la factura"><input type="date" className="input" value={f.fecha_factura} onChange={e => set('fecha_factura', e.target.value)} /></Campo>
          <Campo label="Fecha de vencimiento *"><input required type="date" className="input" value={f.fecha_vencimiento} onChange={e => set('fecha_vencimiento', e.target.value)} /></Campo>
        </div>
        <div className="text-sm bg-slate-50 rounded-lg p-3 text-slate-600">
          Importe pendiente calculado: <strong className="text-marca-700">{pendiente.toFixed(2)} €</strong>
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <h2 className="font-semibold text-slate-700">Datos del cliente deudor</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Campo label="Nombre / razón social *"><input required className="input" value={f.cliente.nombre} onChange={e => setCli('nombre', e.target.value)} /></Campo>
          <Campo label="NIF / CIF"><input className="input" value={f.cliente.nif} onChange={e => setCli('nif', e.target.value)} /></Campo>
          <Campo label="Dirección"><input className="input" value={f.cliente.direccion} onChange={e => setCli('direccion', e.target.value)} placeholder="Calle, nº, CP, ciudad" /></Campo>
          <Campo label="Email"><input type="email" className="input" value={f.cliente.email} onChange={e => setCli('email', e.target.value)} /></Campo>
          <Campo label="Teléfono"><input className="input" value={f.cliente.telefono} onChange={e => setCli('telefono', e.target.value)} /></Campo>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Link to="/" className="btn-ghost">Cancelar</Link>
        <button className="btn-primary" type="submit" disabled={guardando}>{guardando ? 'Creando…' : 'Crear expediente'}</button>
      </div>
    </form>
  );
}

function Campo({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
