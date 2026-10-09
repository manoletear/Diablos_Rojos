-- Quien registro la asistencia (Telar lo tiene NULL en el 100%).
-- Decision aprobada 2026-10-09. Se deja nullable para no romper los
-- ~40 registros ya cargados sin este dato; nuevo codigo lo completa.

alter table registros_asistencia add column if not exists recorded_by uuid references profiles(id) on delete set null;
