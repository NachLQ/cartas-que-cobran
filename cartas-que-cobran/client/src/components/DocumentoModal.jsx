import { useState } from 'react';
import { api, PASOS } from '../api.js';
import AvisoLegal from './AvisoLegal.jsx';

// Modal para ver/editar/copiar/descargar/imprimir el documento generado de un paso.
export default function DocumentoModal({ documento, expediente, onClose }) {
  const [texto, setTexto] = useState(documento.contenido_texto);
  const [guardado, setGuardado] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const paso = PASOS.find(p => p.n === documento.paso);
  const muestraAviso = documento.paso >= 3;

  const cliente = expediente?.cliente?.nombre || 'expediente';
  const nombreArchivo = `paso${documento.paso}_${cliente.replace(/\s+/g, '_')}`;

  async function guardar() {
    if (documento.id) {
      await api.guardarDocumento(documento.id, texto);
    }
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2000);
  }

  function copiar() {
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  function descargarTxt() {
    const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nombreArchivo}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // "PDF descargable" vía diálogo de impresión del navegador (Guardar como PDF).
  function imprimirPdf() {
    const win = window.open('', '_blank');
    win.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8">
      <title>${nombreArchivo}</title>
      <style>
        body{font-family:'Times New Roman',Georgia,serif;white-space:pre-wrap;
          max-width:720px;margin:40px auto;padding:0 24px;line-height:1.5;color:#1e293b;font-size:14px;}
        @media print{body{margin:20px;}}
      </style></head><body>${texto.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="card w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <div>
            <span className={`badge ${paso?.color} text-white`}>Paso {documento.paso}</span>
            <h3 className="font-semibold text-slate-800 mt-1">{paso?.titulo}</h3>
          </div>
          <button className="btn-ghost px-2 py-1" onClick={onClose}>✕</button>
        </div>

        <div className="p-4 overflow-y-auto space-y-3">
          {muestraAviso && <AvisoLegal compacto />}
          <p className="text-xs text-slate-500">
            Puedes editar el texto antes de copiarlo o descargarlo. Los datos del expediente ya están insertados.
          </p>
          <textarea
            className="input font-mono text-[13px] leading-relaxed min-h-[45vh]"
            value={texto}
            onChange={e => setTexto(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 p-4">
          <button className="btn-primary" onClick={copiar}>{copiado ? '✓ Copiado' : '📋 Copiar texto'}</button>
          <button className="btn-ghost" onClick={descargarTxt}>⬇️ Descargar .txt</button>
          <button className="btn-ghost" onClick={imprimirPdf}>🖨️ Imprimir / PDF</button>
          <button className="btn-ghost" onClick={guardar}>{guardado ? '✓ Guardado' : '💾 Guardar cambios'}</button>
          <span className="ml-auto text-xs text-slate-400">Documento del paso {documento.paso}</span>
        </div>
      </div>
    </div>
  );
}
