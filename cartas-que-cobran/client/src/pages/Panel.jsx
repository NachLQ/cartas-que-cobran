import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, euro, PASOS } from '../api.js';
import Timeline from '../components/Timeline.jsx';

const ESTADOS = {
  activo: { txt: 'Activo', cls: 'bg-marca-50 text-marca-700' },
  resuelto: { txt: 'Resuelto', cls: 'bg-emerald-50 text-emerald-700' },
  cerrado: { txt: 'Cerrado', cls: 'bg-slate-100 text-slate-500' },
};

export default function Panel() {
  const [expedientes, setExpedientes] = useState([]);
  const [panel, setPanel] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroPaso, setFiltroPaso] = useState('');
  const [cargando, setCargando] = useState(true);

  async function cargar() {
    setCargando(true);
    const [exps, pan] = await Promise.all([
      api.getExpedientes({ estado: filtroEstado, paso: filtroPaso }),
      api.getPanel(),
    ]);
    setExpedientes(exps);
    setPanel(pan);
    setCargando(false);
  }

  useEffect(() => { cargar(); }, [filtroEstado, filtroPaso]);

  return (
    <div className="space-y-6">
      {/* Métricas */}
      {panel && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Metrica titulo="Total reclamado activo" valor={euro(panel.total_reclamado_activo)} color="text-marca-700" sub={`${panel.activos} expedientes activos`} />
          <Metrica titulo="Total recuperado" valor={euro(panel.total_recuperado)} color="text-emerald-600" sub={`${panel.resueltos} resueltos`} />
          <Metrica titulo="Alertas de seguimiento" valor={panel.alertas} color={panel.alertas ? 'text-red-600' : 'text-slate-400'} sub="Paso 3+ sin movimiento >15 días" />
          <Metrica titulo="Expedientes totales" valor={panel.total_expedientes} color="text-slate-700" sub={`${panel.cerrados} cerrados`} />
        </div>
      )}

      {/* Distribución por paso */}
      {panel && (
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-slate-600 mb-3">Expedientes activos por paso de escalada</h3>
          <div className="grid grid-cols-5 gap-2">
            {PASOS.map(p => (
              <button
                key={p.n}
                onClick={() => setFiltroPaso(filtroPaso === String(p.n) ? '' : String(p.n))}
                className={`rounded-lg border p-3 text-center transition ${filtroPaso === String(p.n) ? 'border-marca-500 bg-marca-50' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <div className={`w-7 h-7 mx-auto rounded-full ${p.color} text-white flex items-center justify-center text-sm font-semibold`}>{p.n}</div>
                <div className="text-2xl font-bold text-slate-800 mt-1">{panel.por_paso[p.n] || 0}</div>
                <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{p.titulo}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold text-slate-700 mr-auto">Expedientes</h2>
        <select className="input w-auto" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="resuelto">Resueltos</option>
          <option value="cerrado">Cerrados</option>
        </select>
        <select className="input w-auto" value={filtroPaso} onChange={e => setFiltroPaso(e.target.value)}>
          <option value="">Todos los pasos</option>
          {PASOS.map(p => <option key={p.n} value={p.n}>Paso {p.n} — {p.titulo}</option>)}
        </select>
        {(filtroEstado || filtroPaso) && (
          <button className="btn-ghost" onClick={() => { setFiltroEstado(''); setFiltroPaso(''); }}>Limpiar</button>
        )}
      </div>

      {/* Lista */}
      {cargando ? (
        <p className="text-slate-400 text-center py-10">Cargando…</p>
      ) : expedientes.length === 0 ? (
        <div className="card p-10 text-center text-slate-400">
          No hay expedientes con estos filtros. <Link to="/nuevo" className="text-marca-600 font-medium">Crea el primero →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {expedientes.map(e => <FilaExpediente key={e.id} e={e} />)}
        </div>
      )}
    </div>
  );
}

function Metrica({ titulo, valor, color, sub }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-slate-400">{titulo}</div>
      <div className={`text-2xl font-bold mt-1 ${color}`}>{valor}</div>
      <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>
    </div>
  );
}

function FilaExpediente({ e }) {
  const estado = ESTADOS[e.estado];
  const paso = PASOS.find(p => p.n === e.paso_actual);
  return (
    <Link to={`/expedientes/${e.id}`} className="card p-4 block hover:shadow-md transition">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="lg:w-64 flex-shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-800">{e.cliente.nombre}</h3>
            {e.alerta && <span className="badge bg-red-100 text-red-700" title="Más de 15 días sin movimiento en paso 3+">⏰ Sin movimiento</span>}
          </div>
          <p className="text-xs text-slate-400">Factura {e.numero_factura} · {e.concepto}</p>
        </div>

        <div className="flex-1 min-w-0">
          <Timeline pasoActual={e.paso_actual} compact />
        </div>

        <div className="flex items-center gap-6 lg:gap-8">
          <div className="text-right">
            <div className="text-lg font-bold text-slate-800">{euro(e.calculo.importe_pendiente)}</div>
            <div className="text-[11px] text-slate-400">pendiente</div>
          </div>
          <div className="text-right w-20">
            <div className={`text-sm font-semibold ${e.calculo.dias_retraso > 45 ? 'text-red-600' : e.calculo.dias_retraso > 0 ? 'text-orange-500' : 'text-slate-500'}`}>
              {e.calculo.dias_retraso} días
            </div>
            <div className="text-[11px] text-slate-400">de retraso</div>
          </div>
          <div className="text-right w-24">
            <span className={`badge ${estado.cls}`}>{estado.txt}</span>
            <div className="text-[10px] text-slate-400 mt-1">Paso {e.paso_actual}: {paso?.titulo}</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
