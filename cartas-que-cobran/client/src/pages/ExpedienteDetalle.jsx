import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, euro, fecha, PASOS } from '../api.js';
import Timeline from '../components/Timeline.jsx';
import CalculadoraIntereses from '../components/CalculadoraIntereses.jsx';
import DocumentoModal from '../components/DocumentoModal.jsx';

const CANALES = ['whatsapp', 'email', 'carta', 'burofax', 'otro'];

export default function ExpedienteDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exp, setExp] = useState(null);
  const [docAbierto, setDocAbierto] = useState(null);
  const [generando, setGenerando] = useState(false);
  const [nuevaCom, setNuevaCom] = useState({ canal: 'whatsapp', resumen: '', resultado: '', fecha: new Date().toISOString().slice(0, 10) });

  async function cargar() {
    setExp(await api.getExpediente(id));
  }
  useEffect(() => { cargar(); }, [id]);

  if (!exp) return <p className="text-slate-400 text-center py-10">Cargando…</p>;

  const paso = PASOS.find(p => p.n === exp.paso_actual);

  async function generarDocumento(p = exp.paso_actual) {
    setGenerando(true);
    try {
      const doc = await api.generarDocumento(id, p);
      setDocAbierto(doc);
      await cargar();
    } finally {
      setGenerando(false);
    }
  }

  async function avanzar() {
    await api.avanzarPaso(id);
    await cargar();
  }

  async function cambiarEstado(estado) {
    let importe_pagado = exp.importe_pagado;
    if (estado === 'resuelto') {
      const def = exp.calculo.importe_pendiente;
      const val = window.prompt('¿Cuánto se ha cobrado en total? (importe pagado)', String(exp.importe_pagado || def + exp.importe_pagado));
      if (val === null) return;
      importe_pagado = Number(val.replace(',', '.')) || 0;
    }
    await api.actualizarExpediente(id, { estado, importe_pagado });
    await cargar();
  }

  async function registrarCom(e) {
    e.preventDefault();
    if (!nuevaCom.resumen.trim()) return;
    await api.registrarComunicacion(id, nuevaCom);
    setNuevaCom({ canal: 'whatsapp', resumen: '', resultado: '', fecha: new Date().toISOString().slice(0, 10) });
    await cargar();
  }

  async function borrar() {
    if (!window.confirm('¿Eliminar este expediente y todo su historial? Esta acción no se puede deshacer.')) return;
    await api.borrarExpediente(id);
    navigate('/');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link to="/" className="hover:text-marca-600">Panel</Link>
        <span>/</span>
        <span className="text-slate-600">{exp.cliente.nombre}</span>
      </div>

      {/* Cabecera */}
      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{exp.cliente.nombre}</h1>
            <p className="text-slate-500">Factura {exp.numero_factura} · {exp.concepto}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-400">
              {exp.cliente.nif && <span>NIF: {exp.cliente.nif}</span>}
              {exp.cliente.email && <span>✉️ {exp.cliente.email}</span>}
              {exp.cliente.telefono && <span>📞 {exp.cliente.telefono}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            {exp.estado === 'activo' && <button className="btn-ghost" onClick={() => cambiarEstado('resuelto')}>✓ Marcar cobrado</button>}
            {exp.estado === 'activo' && <button className="btn-ghost" onClick={() => cambiarEstado('cerrado')}>Dar por perdido</button>}
            {exp.estado !== 'activo' && <button className="btn-ghost" onClick={() => cambiarEstado('activo')}>Reabrir</button>}
            <button className="btn-danger" onClick={borrar}>Eliminar</button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
          <Dato etiqueta="Importe total" valor={euro(exp.importe_total)} />
          <Dato etiqueta="Pagado" valor={euro(exp.importe_pagado)} />
          <Dato etiqueta="Fecha factura" valor={fecha(exp.fecha_factura)} />
          <Dato etiqueta="Vencimiento" valor={fecha(exp.fecha_vencimiento)} />
        </div>
      </div>

      {/* Línea de tiempo + CTA */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-700">Escalada de cobro</h2>
          <span className="text-xs text-slate-400">
            Recomendado por antigüedad: paso {exp.calculo.paso_recomendado}
            {exp.calculo.paso_recomendado > exp.paso_actual && ' (vas por detrás)'}
          </span>
        </div>
        <div className="px-2 py-4">
          <Timeline pasoActual={exp.paso_actual} recomendado={exp.calculo.paso_recomendado} />
        </div>

        <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className={`badge ${paso?.color} text-white`}>Paso actual {exp.paso_actual}</span>
              <h3 className="font-semibold text-slate-800 mt-1">{paso?.titulo} <span className="text-xs font-normal text-slate-400">· {paso?.rango}</span></h3>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary" disabled={generando} onClick={() => generarDocumento()}>
                {generando ? 'Generando…' : '📄 Generar documento del paso'}
              </button>
              {exp.paso_actual < 5 && (
                <button className="btn-ghost" onClick={avanzar}>Avanzar al paso {exp.paso_actual + 1} →</button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Calculadora */}
        <div className="space-y-6">
          <CalculadoraIntereses calculo={exp.calculo} />

          {/* Generar otros pasos */}
          <div className="card p-4">
            <h3 className="font-semibold text-slate-700 mb-3">Generar documento de cualquier paso</h3>
            <div className="grid grid-cols-1 gap-2">
              {PASOS.map(p => (
                <button key={p.n} onClick={() => generarDocumento(p.n)}
                  className="flex items-center gap-3 text-left rounded-lg border border-slate-200 p-2.5 hover:border-marca-400 hover:bg-marca-50 transition">
                  <span className={`w-7 h-7 flex-shrink-0 rounded-full ${p.color} text-white flex items-center justify-center text-sm font-semibold`}>{p.n}</span>
                  <span className="flex-1">
                    <span className="text-sm font-medium text-slate-700">{p.titulo}</span>
                    <span className="block text-[11px] text-slate-400">{p.rango}</span>
                  </span>
                  <span className="text-marca-600 text-sm">Generar →</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Comunicaciones */}
        <div className="space-y-6">
          <div className="card p-4">
            <h3 className="font-semibold text-slate-700 mb-3">Historial de comunicaciones</h3>
            {exp.comunicaciones.length === 0 ? (
              <p className="text-sm text-slate-400">Sin comunicaciones registradas todavía.</p>
            ) : (
              <ol className="space-y-2">
                {exp.comunicaciones.map(c => (
                  <li key={c.id} className="flex gap-3 text-sm border-l-2 border-slate-200 pl-3">
                    <span className="text-xs text-slate-400 w-20 flex-shrink-0">{fecha(c.fecha)}</span>
                    <div>
                      <span className="badge bg-slate-100 text-slate-600 capitalize mr-2">{c.canal}</span>
                      <span className="text-slate-700">{c.resumen}</span>
                      {c.resultado && <span className="block text-xs text-slate-400">→ {c.resultado}</span>}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <form className="card p-4 space-y-3" onSubmit={registrarCom}>
            <h3 className="font-semibold text-slate-700">Registrar / marcar como enviado</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Canal</label>
                <select className="input" value={nuevaCom.canal} onChange={e => setNuevaCom({ ...nuevaCom, canal: e.target.value })}>
                  {CANALES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Fecha</label>
                <input type="date" className="input" value={nuevaCom.fecha} onChange={e => setNuevaCom({ ...nuevaCom, fecha: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Resumen</label>
              <input className="input" placeholder="Ej.: Enviada carta formal del paso 3" value={nuevaCom.resumen} onChange={e => setNuevaCom({ ...nuevaCom, resumen: e.target.value })} />
            </div>
            <div>
              <label className="label">Resultado (opcional)</label>
              <input className="input" placeholder="Ej.: Sin respuesta / Prometió pago" value={nuevaCom.resultado} onChange={e => setNuevaCom({ ...nuevaCom, resultado: e.target.value })} />
            </div>
            <button className="btn-primary w-full" type="submit">Registrar comunicación</button>
          </form>
        </div>
      </div>

      {docAbierto && <DocumentoModal documento={docAbierto} expediente={exp} onClose={() => setDocAbierto(null)} />}
    </div>
  );
}

function Dato({ etiqueta, valor }) {
  return (
    <div>
      <div className="text-xs text-slate-400">{etiqueta}</div>
      <div className="font-medium text-slate-700">{valor}</div>
    </div>
  );
}
