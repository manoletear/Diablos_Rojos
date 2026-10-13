-- Propuesta de mensualidad base por categoria, confirmada por el director.
-- Basada en la MODA real de los pagos ya cobrados (no inventada) — coincide
-- con el "hereda $98.000" que mostraba Telar como default de organizacion.
-- Familias existentes NO se tocan: siguen con lo que tengan acordado
-- (alumnos.cuota_personalizada tiene prioridad, ver scripts/generar-pagos-mensuales.js).
-- Esto solo fija el valor por defecto para familias NUEVAS de aqui en adelante.

update categorias set mensualidad_base = 98000
where nombre in ('PlayGroup','Sub8 (2018)','Sub9 (2017)','Sub10 (2016)','Sub12 (2014)','Sub13 (2013)','Sub14 (2012)');

update categorias set mensualidad_base = 65000
where nombre in ('Sub11 (2015)','Sub16 (2011/2010)');

update configuracion_financiera set mensualidad_default = 98000;
