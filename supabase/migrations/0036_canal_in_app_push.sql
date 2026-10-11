-- Agrega canales in_app y push a canal_mensaje. Separado en su propio
-- archivo porque ALTER TYPE ... ADD VALUE no puede usarse en la misma
-- transaccion que codigo que referencia el nuevo valor.

alter type canal_mensaje add value 'in_app';
alter type canal_mensaje add value 'push';
