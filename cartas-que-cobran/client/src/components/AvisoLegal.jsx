// Aviso legal obligatorio. Se muestra antes de generar documentos de pasos 3, 4 y 5.
export default function AvisoLegal({ compacto = false }) {
  return (
    <div className={`rounded-lg border border-amber-300 bg-amber-50 text-amber-900 ${compacto ? 'p-3 text-xs' : 'p-4 text-sm'}`}>
      <div className="flex gap-2">
        <span className="text-lg leading-none">⚠️</span>
        <p>
          <strong>Aviso legal.</strong> Esta herramienta es un apoyo documental. No es asesoramiento
          jurídico. Se recomienda revisar cualquier acción legal con un profesional antes de ejecutarla.
        </p>
      </div>
    </div>
  );
}
