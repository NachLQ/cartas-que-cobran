import { euro } from '../api.js';

// Calculadora de intereses de demora siempre visible en la vista del expediente.
export default function CalculadoraIntereses({ calculo }) {
  if (!calculo) return null;
  return (
    <div className="card p-4">
      <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <span>🧮</span> Calculadora de intereses (Ley 3/2004)
      </h3>
      <dl className="space-y-2 text-sm">
        <Linea etiqueta="Importe pendiente" valor={euro(calculo.importe_pendiente)} />
        <Linea etiqueta={`Días de retraso`} valor={`${calculo.dias_retraso} días`} />
        <Linea
          etiqueta={`Intereses de demora (${calculo.tipo_interes}% anual)`}
          valor={euro(calculo.interes_demora)}
        />
        <Linea etiqueta="Indemnización costes de cobro" valor={euro(calculo.indemnizacion_costes)} />
        <div className="border-t border-slate-200 pt-2 mt-2">
          <Linea etiqueta="TOTAL RECLAMABLE A HOY" valor={euro(calculo.total_reclamable)} destacado />
        </div>
      </dl>
      <p className="mt-3 text-[11px] text-slate-400 leading-snug">
        Fórmula: pendiente × (tipo% / 100) × (días / 365). Indemnización: 40 € hasta 999,99 €;
        70 € de 1.000 € a 9.999,99 €; 1 % desde 10.000 €. Los importes se recalculan a la fecha de hoy.
      </p>
    </div>
  );
}

function Linea({ etiqueta, valor, destacado }) {
  return (
    <div className="flex justify-between items-baseline">
      <dt className={destacado ? 'font-semibold text-slate-700' : 'text-slate-500'}>{etiqueta}</dt>
      <dd className={destacado ? 'text-lg font-bold text-marca-700' : 'font-medium text-slate-700'}>{valor}</dd>
    </div>
  );
}
