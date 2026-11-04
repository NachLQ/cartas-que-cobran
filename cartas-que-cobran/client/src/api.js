// Cliente API mínimo sobre fetch. Todas las rutas pasan por el proxy de Vite (/api).
const BASE = '/api';

async function req(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    let msg = res.statusText;
    try { const j = await res.json(); msg = j.error || msg; } catch { /* noop */ }
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Configuración
  getConfiguracion: () => req('/configuracion'),
  putConfiguracion: (data) => req('/configuracion', { method: 'PUT', body: JSON.stringify(data) }),
  getInteres: () => req('/interes'),
  putInteres: (data) => req('/interes', { method: 'PUT', body: JSON.stringify(data) }),

  // Expedientes
  getExpedientes: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    return req('/expedientes' + (qs ? '?' + qs : ''));
  },
  getExpediente: (id) => req(`/expedientes/${id}`),
  crearExpediente: (data) => req('/expedientes', { method: 'POST', body: JSON.stringify(data) }),
  actualizarExpediente: (id, data) => req(`/expedientes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  borrarExpediente: (id) => req(`/expedientes/${id}`, { method: 'DELETE' }),
  avanzarPaso: (id) => req(`/expedientes/${id}/avanzar-paso`, { method: 'POST' }),
  calcularIntereses: (id) => req(`/expedientes/${id}/calcular-intereses`),
  generarDocumento: (id, paso) => req(`/expedientes/${id}/generar-documento/${paso}`, { method: 'POST' }),
  guardarDocumento: (docId, contenido_texto) => req(`/documentos/${docId}`, { method: 'PUT', body: JSON.stringify({ contenido_texto }) }),
  registrarComunicacion: (id, data) => req(`/expedientes/${id}/comunicaciones`, { method: 'POST', body: JSON.stringify(data) }),

  // Panel
  getPanel: () => req('/panel'),
};

// ── Utilidades de formato ────────────────────────────────────────────────────
export const euro = (n) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n || 0);

export const fecha = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso.length > 10 ? iso : iso + 'T00:00:00');
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
};

export const PASOS = [
  { n: 1, titulo: 'Recordatorio amable', rango: 'Días 1-7', color: 'bg-emerald-500' },
  { n: 2, titulo: 'Reclamación firme', rango: 'Días 8-21', color: 'bg-yellow-500' },
  { n: 3, titulo: 'Carta formal', rango: 'Días 22-45', color: 'bg-orange-500' },
  { n: 4, titulo: 'Requerimiento / burofax', rango: 'Días 46-90', color: 'bg-red-500' },
  { n: 5, titulo: 'Proceso monitorio', rango: '+90 días', color: 'bg-purple-600' },
];
