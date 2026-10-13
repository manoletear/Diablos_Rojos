# Fase 1 · Modelo de datos y permisos

Con el mapeo aprobado de la Fase 0:
1. Genera las migraciones SOLO para entidades faltantes (usa `schema.sql` como referencia, traducido al ORM del repo).
   No dupliques entidades existentes; si un nombre difiere, usa el existente.
2. Implementa el scoping del rol apoderado en backend (helper único `getGuardianStudentIds()` o RLS si el repo usa Supabase).
3. Implementa el estado derivado de cuotas (`payment_due_status`) como vista o función.
4. Implementa `audit_log` y un helper para registrar transiciones.
5. Tests: un apoderado no puede leer ni modificar alumnos, cuotas, convocatorias ni pedidos de otro apoderado.

Muéstrame el plan de archivos antes de generar. Al terminar: resumen + cómo correr los tests.
