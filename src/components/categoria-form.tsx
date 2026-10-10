type Sede = { id: string; nombre: string };
type Entrenador = { id: string; nombre: string };

export function CategoriaFormFields({
  sedes,
  entrenadores,
  defaultValues,
}: {
  sedes: Sede[];
  entrenadores: Entrenador[];
  defaultValues?: {
    nombre?: string;
    sede_id?: string | null;
    anio_desde?: number | null;
    anio_hasta?: number | null;
    dias_horario?: string | null;
    mensualidad_base?: number | null;
    entrenador_principal_id?: string | null;
    estado?: string;
  };
}) {
  const d = defaultValues ?? {};
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-neutral-700">Nombre</label>
        <input name="nombre" required defaultValue={d.nombre} placeholder="Sub10 (2016)" className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-neutral-700">Año desde</label>
          <input type="number" name="anio_desde" required defaultValue={d.anio_desde ?? ""} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-neutral-700">Año hasta</label>
          <input type="number" name="anio_hasta" required defaultValue={d.anio_hasta ?? ""} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700">Sede</label>
        <select name="sede_id" required defaultValue={d.sede_id ?? ""} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
          <option value="">Seleccionar</option>
          {sedes.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700">Horario</label>
        <input name="dias_horario" defaultValue={d.dias_horario ?? ""} placeholder="Martes y Jueves 17:30 - 19:30" className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-neutral-700">Mensualidad base</label>
          <input type="number" name="mensualidad_base" defaultValue={d.mensualidad_base ?? ""} placeholder="Hereda si vacío" className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-neutral-700">Entrenador principal</label>
          <select name="entrenador_principal_id" defaultValue={d.entrenador_principal_id ?? ""} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <option value="">Sin asignar</option>
            {entrenadores.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700">Estado</label>
        <select name="estado" defaultValue={d.estado ?? "activa"} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
          <option value="activa">Activa</option>
          <option value="inactiva">Inactiva</option>
        </select>
      </div>
    </>
  );
}
