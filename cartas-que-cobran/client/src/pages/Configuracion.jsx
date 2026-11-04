import { useEffect, useState } from 'react';
import { api } from '../api.js';
import AvisoLegal from '../components/AvisoLegal.jsx';

export default function Configuracion() {
  const [acreedor, setAcreedor] = useState(null);
  const [interes, setInteres] = useState(null);
  const [guardado, setGuardado] = useState('');

  async function cargar() {
    const [a, i] = await Promise.all([api.getConfiguracion(), api.getInteres()]);
    setAcreedor(a);
    setInteres(i);
  }
  useEffect(() => { cargar(); }, []);

  if (!acreedor || !interes) return <p className="text-slate-400 text-center py-10">Cargando…</p>;

  const setA = (k, v) => setAcreedor({ ...acreedor, [k]: v });
  const setI = (k, v) => setInteres({ ...interes, [k]: v });
  const tipoTotal = (Number(interes.tipo_bce_porcentaje) || 0) + (Number(interes.puntos_adicionales) || 0);

  async function guardarAcreedor(e) {
    e.preventDefault();
    await api.putConfiguracion(acreedor);
    setGuardado('acreedor');
    setTimeout(() => setGuardado(''), 2000);
  }

  async function guardarInteres(e) {
    e.preventDefault();
    const i = await api.putInteres({
      tipo_bce_porcentaje: Number(interes.tipo_bce_porcentaje),
      puntos_adicionales: Number(interes.puntos_adicionales),
    });
    setInteres(i);
    const a = await api.getConfiguracion();
    setAcreedor(a);
    setGuardado('interes');
    setTimeout(() => setGuardado(''), 2000);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Configuración</h1>

      <form className="card p-5 space-y-4" onSubmit={guardarAcreedor}>
        <h2 className="font-semibold text-slate-700">Datos del acreedor (tu negocio)</h2>
        <p className="text-xs text-slate-400">Se insertan automáticamente en todos los documentos generados.</p>
        <div className="grid md:grid-cols-2 gap-4">
          <Campo label="Nombre / razón social"><input className="input" value={acreedor.nombre} onChange={e => setA('nombre', e.target.value)} /></Campo>
          <Campo label="NIF / CIF"><input className="input" value={acreedor.nif} onChange={e => setA('nif', e.target.value)} /></Campo>
          <Campo label="Dirección"><input className="input" value={acreedor.direccion} onChange={e => setA('direccion', e.target.value)} /></Campo>
          <Campo label="Teléfono"><input className="input" value={acreedor.telefono} onChange={e => setA('telefono', e.target.value)} /></Campo>
          <Campo label="Email"><input className="input" value={acreedor.email} onChange={e => setA('email', e.target.value)} /></Campo>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-primary" type="submit">Guardar datos</button>
          {guardado === 'acreedor' && <span className="text-emerald-600 text-sm">✓ Guardado</span>}
        </div>
      </form>

      <form className="card p-5 space-y-4" onSubmit={guardarInteres}>
        <h2 className="font-semibold text-slate-700">Tipo de interés de demora</h2>
        <p className="text-xs text-slate-400">
          El interés de demora comercial = tipo de referencia del BCE + 8 puntos (Ley 3/2004).
          Actualízalo cada semestre según el valor publicado.
        </p>
        <div className="grid md:grid-cols-3 gap-4 items-end">
          <Campo label="Tipo de referencia BCE (%)"><input type="number" step="0.01" className="input" value={interes.tipo_bce_porcentaje} onChange={e => setI('tipo_bce_porcentaje', e.target.value)} /></Campo>
          <Campo label="Puntos adicionales"><input type="number" step="0.5" className="input" value={interes.puntos_adicionales} onChange={e => setI('puntos_adicionales', e.target.value)} /></Campo>
          <div className="bg-marca-50 rounded-lg p-3 text-center">
            <div className="text-xs text-slate-500">Tipo de demora aplicado</div>
            <div className="text-2xl font-bold text-marca-700">{tipoTotal.toFixed(2)}%</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-primary" type="submit">Actualizar tipo</button>
          {guardado === 'interes' && <span className="text-emerald-600 text-sm">✓ Actualizado</span>}
          <span className="text-xs text-slate-400 ml-auto">Última actualización: {interes.fecha_actualizacion}</span>
        </div>
      </form>

      <div>
        <h2 className="font-semibold text-slate-700 mb-2">Aviso legal</h2>
        <AvisoLegal />
      </div>
    </div>
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
