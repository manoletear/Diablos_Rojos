-- Feedback de un entrenador probando la app: al hacer clic en un alumno
-- debería poder ver el perfil completo, incluyendo el contacto de sus
-- apoderados. Hoy "apoderados" solo tiene staff_all_apoderados
-- (director/admin) y apoderado_read_self — el entrenador no tenía SELECT
-- aqui, igual que ya lo tiene en "alumnos" via entrenador_read_alumnos_para_citar.

create policy entrenador_read_apoderados on apoderados for select
  using (auth_rol() = 'entrenador');

create policy entrenador_read_apoderado_alumno on apoderado_alumno for select
  using (auth_rol() = 'entrenador');
