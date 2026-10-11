import { crearDocumentoTributario } from "../actions";

export default function NuevoDocumentoTributarioPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-neutral-900">Registrar boleta / factura</h1>
      <p className="text-sm text-neutral-500">Carga manual — desde el PDF/XML que emite o recibe el club</p>

      <form action={crearDocumentoTributario} className="mt-6 max-w-xl space-y-4 rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-700">Dirección</label>
            <select name="direccion" required className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
              <option value="emitido">Emitida (cobro a apoderado/cliente)</option>
              <option value="recibido">Recibida (compra / gasto del club)</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-700">Tipo</label>
            <select name="tipo" required className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
              <option value="boleta">Boleta</option>
              <option value="factura">Factura</option>
              <option value="nota_credito">Nota de crédito</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-700">Folio</label>
            <input name="folio" className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-700">Fecha emisión</label>
            <input type="date" name="fecha_emision" required className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700">RUT contraparte</label>
          <input name="rut_contraparte" placeholder="12.345.678-9" className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Razón social / nombre</label>
          <input name="razon_social_contraparte" className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-700">Monto neto</label>
            <input type="number" name="monto_neto" className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-700">IVA</label>
            <input type="number" name="monto_iva" className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-700">Monto total</label>
            <input type="number" name="monto_total" required className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700">Categoría de gasto (solo si es recibida)</label>
          <select name="categoria_gasto" className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <option value="">—</option>
            <option value="arriendo">Arriendo / recinto</option>
            <option value="servicios">Servicios (agua, luz, internet)</option>
            <option value="insumos">Insumos / implementación deportiva</option>
            <option value="sueldos">Sueldos / honorarios</option>
            <option value="torneos">Torneos / inscripciones</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700">Notas (opcional)</label>
          <textarea name="notas" rows={2} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </div>

        <button type="submit" className="rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">
          Registrar
        </button>
      </form>
    </div>
  );
}
