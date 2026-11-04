import { PASOS } from '../api.js';

// Línea de tiempo visual de los 5 pasos de escalada.
export default function Timeline({ pasoActual, recomendado, compact = false }) {
  return (
    <div className={`flex items-center ${compact ? 'gap-1' : 'gap-1.5'}`}>
      {PASOS.map((p, i) => {
        const completado = p.n < pasoActual;
        const actual = p.n === pasoActual;
        return (
          <div key={p.n} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                title={`Paso ${p.n}: ${p.titulo}`}
                className={[
                  'flex items-center justify-center rounded-full font-semibold text-white',
                  compact ? 'w-6 h-6 text-xs' : 'w-9 h-9 text-sm',
                  actual ? `${p.color} ring-2 ring-offset-2 ring-marca-500 scale-110` :
                  completado ? `${p.color} opacity-90` : 'bg-slate-300',
                ].join(' ')}
              >
                {completado ? '✓' : p.n}
              </div>
              {!compact && (
                <span className={`mt-1 text-[10px] leading-tight text-center w-20 ${actual ? 'font-semibold text-slate-700' : 'text-slate-400'}`}>
                  {p.titulo}
                </span>
              )}
            </div>
            {i < PASOS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-0.5 ${p.n < pasoActual ? 'bg-marca-500' : 'bg-slate-300'} ${compact ? 'self-center' : 'mb-5'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
