// Cálculo de intereses de demora e indemnización por costes de cobro
// conforme a la Ley 3/2004, de 29 de diciembre (morosidad operaciones comerciales).

const MS_DIA = 1000 * 60 * 60 * 24;

export function redondear2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// Días naturales de retraso desde el vencimiento hasta la fecha de referencia (hoy por defecto).
export function diasRetraso(fechaVencimiento, hoy = new Date()) {
  const v = new Date(fechaVencimiento + 'T00:00:00');
  const h = new Date(hoy);
  h.setHours(0, 0, 0, 0);
  const diff = Math.floor((h - v) / MS_DIA);
  return Math.max(0, diff);
}

// Importe pendiente = total - pagado (nunca negativo).
export function importePendiente(importeTotal, importePagado = 0) {
  return redondear2(Math.max(0, importeTotal - importePagado));
}

// Indemnización fija por costes de cobro (art. 8 Ley 3/2004).
export function calcularIndemnizacion(pendiente) {
  if (pendiente >= 10000) return redondear2(pendiente * 0.01);
  if (pendiente >= 1000) return 70;
  if (pendiente > 0) return 40;
  return 0;
}

// Interés de demora: pendiente * (tipo% / 100) * (días / 365).
export function calcularInteres(pendiente, tipoInteres, dias) {
  return redondear2(pendiente * (tipoInteres / 100) * (dias / 365));
}

// Paso recomendado por tramos de días de retraso.
export function pasoRecomendado(dias) {
  if (dias <= 7) return 1;
  if (dias <= 21) return 2;
  if (dias <= 45) return 3;
  if (dias <= 90) return 4;
  return 5;
}

// Cálculo completo para un expediente.
export function calcularExpediente({ importe_total, importe_pagado, fecha_vencimiento, tipo_interes }, hoy = new Date()) {
  const pendiente = importePendiente(importe_total, importe_pagado);
  const dias = diasRetraso(fecha_vencimiento, hoy);
  const interes = calcularInteres(pendiente, tipo_interes, dias);
  const indemnizacion = calcularIndemnizacion(pendiente);
  const total_reclamable = redondear2(pendiente + interes + indemnizacion);
  return {
    importe_pendiente: pendiente,
    dias_retraso: dias,
    tipo_interes,
    interes_demora: interes,
    indemnizacion_costes: indemnizacion,
    total_reclamable,
    paso_recomendado: pasoRecomendado(dias),
  };
}
