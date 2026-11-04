import { Routes, Route, NavLink, Link } from 'react-router-dom';
import Panel from './pages/Panel.jsx';
import ExpedienteDetalle from './pages/ExpedienteDetalle.jsx';
import NuevoExpediente from './pages/NuevoExpediente.jsx';
import Configuracion from './pages/Configuracion.jsx';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">📨</span>
            <div>
              <h1 className="font-bold text-slate-800 leading-tight">Cartas que Cobran</h1>
              <p className="text-[11px] text-slate-400 leading-tight">Del recordatorio amable al monitorio, paso a paso</p>
            </div>
          </Link>
          <nav className="flex items-center gap-1">
            <Tab to="/">Panel</Tab>
            <Tab to="/configuracion">Configuración</Tab>
            <Link to="/nuevo" className="btn-primary ml-2">+ Nuevo expediente</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Panel />} />
          <Route path="/nuevo" element={<NuevoExpediente />} />
          <Route path="/expedientes/:id" element={<ExpedienteDetalle />} />
          <Route path="/configuracion" element={<Configuracion />} />
        </Routes>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-3 text-[11px] text-slate-400">
          Esta herramienta es un apoyo documental. No es asesoramiento jurídico. Revise cualquier acción
          legal con un profesional antes de ejecutarla.
        </div>
      </footer>
    </div>
  );
}

function Tab({ to, children }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `px-3 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-marca-50 text-marca-700' : 'text-slate-600 hover:bg-slate-100'}`
      }
    >
      {children}
    </NavLink>
  );
}
