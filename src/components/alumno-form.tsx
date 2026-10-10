type Categoria = { id: string; nombre: string };
type Sede = { id: string; nombre: string };

export function AlumnoFormFields({
  categorias,
  sedes,
  defaultValues,
}: {
  categorias: Categoria[];
  sedes: Sede[];
  defaultValues?: {
    nombre?: string;
    apellido?: string;
    rut?: string | null;
    fecha_nacimiento?: string | null;
    categoria_id?: string | null;
    sede_id?: string | null;
    estado?: string;
    posicion?: string | null;
    numero_camiseta?: number | null;
  };
}) {
  const d = defaultValues ?? {};
  return (
    <>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-neutral-700">Nombre</label>
          <input name="nombre" required defaultValue={d.nombre} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-neutral-700">Apellido</label>
          <input name="apellido" required defaultValue={d.apellido} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </div>
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-neutral-700">RUT</label>
          <input name="rut" defaultValue={d.rut ?? ""} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-neutral-700">Fecha de nacimiento</label>
          <input type="date" name="fecha_nacimiento" defaultValue={d.fecha_nacimiento ?? ""} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </div>
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-neutral-700">Categoría</label>
          <select name="categoria_id" defaultValue={d.categoria_id ?? ""} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <option value="">Sin asignar</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-neutral-700">Sede</label>
          <select name="sede_id" defaultValue={d.sede_id ?? ""} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <option value="">Sin asignar</option>
            {sedes.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-neutral-700">Estado</label>
          <select name="estado" defaultValue={d.estado ?? "en_prueba"} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <option value="en_prueba">En Prueba</option>
            <option value="matriculado">Matriculado</option>
            <option value="retirado">Retirado</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-neutral-700">Posición</label>
          <input name="posicion" defaultValue={d.posicion ?? ""} placeholder="DC, MC, PO..." className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-neutral-700">Número</label>
          <input type="number" name="numero_camiseta" defaultValue={d.numero_camiseta ?? ""} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </div>
      </div>
    </>
  );
}
