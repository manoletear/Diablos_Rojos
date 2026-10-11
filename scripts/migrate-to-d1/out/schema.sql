-- Generado automaticamente desde el schema real de Supabase (Fase 3 migracion Cloudflare D1).
-- 2026-10-11T14:10:38.792Z

PRAGMA foreign_keys = OFF;

create table "alumno_categorias" (
  "id" text,
  "alumno_id" text not null,
  "categoria_id" text not null,
  "es_principal" integer not null,
  "created_at" text not null,
  primary key ("id"),
  foreign key ("alumno_id") references "alumnos"("id") on delete cascade,
  foreign key ("categoria_id") references "categorias"("id") on delete cascade
);

create table "alumnos" (
  "id" text,
  "nombre" text not null,
  "apellido" text not null,
  "rut" text,
  "fecha_nacimiento" text,
  "categoria_id" text,
  "sede_id" text,
  "temporada_id" text,
  "estado" text not null,
  "posicion" text,
  "numero_camiseta" integer,
  "nombre_camiseta" text,
  "talla_camiseta" text,
  "beca_pct" integer,
  "cuota_personalizada" integer,
  "fecha_inscripcion" text,
  "created_at" text not null,
  primary key ("id"),
  foreign key ("categoria_id") references "categorias"("id") on delete set null,
  foreign key ("sede_id") references "sedes"("id") on delete set null,
  foreign key ("temporada_id") references "temporadas"("id") on delete set null,
  check (("estado" in ('en_prueba', 'matriculado', 'retirado')))
);

create table "apoderado_alumno" (
  "apoderado_id" text,
  "alumno_id" text,
  "parentesco" text,
  "es_principal" integer not null,
  "relacion" text check ("relacion" in ('madre', 'padre', 'tutor', 'otro')) not null,
  primary key ("apoderado_id", "alumno_id"),
  foreign key ("apoderado_id") references "apoderados"("id") on delete cascade,
  foreign key ("alumno_id") references "alumnos"("id") on delete cascade
);

create table "apoderados" (
  "id" text,
  "profile_id" text,
  "nombre" text not null,
  "email" text,
  "telefono" text,
  "created_at" text not null,
  "telar_id" text,
  "direccion" text,
  "contacto_emergencia" text,
  "telefono_emergencia" text,
  "notif_whatsapp" integer,
  "notif_email" integer,
  primary key ("id"),
  foreign key ("profile_id") references "profiles"("id") on delete set null
);

create table "catalogo_items_inventario" (
  "id" text,
  "variante_id" text not null,
  "talla" text not null,
  "precio" integer not null,
  "stock" integer not null,
  primary key ("id"),
  foreign key ("variante_id") references "catalogo_variantes"("id") on delete cascade
);

create table "catalogo_pedido_items" (
  "id" text,
  "pedido_id" text not null,
  "alumno_id" text,
  "item_inventario_id" text not null,
  "cantidad" integer not null,
  "precio_unitario" integer not null,
  "pago_id" text,
  primary key ("id"),
  foreign key ("pedido_id") references "catalogo_pedidos"("id") on delete cascade,
  foreign key ("alumno_id") references "alumnos"("id") on delete set null,
  foreign key ("item_inventario_id") references "catalogo_items_inventario"("id"),
  foreign key ("pago_id") references "pagos"("id") on delete set null
);

create table "catalogo_pedidos" (
  "id" text,
  "solicitado_por" text,
  "estado" text check ("estado" in ('pendiente_pago', 'pago_confirmado', 'pedido', 'listo_retiro', 'entregado', 'cancelado')) not null,
  "monto_total" integer not null,
  "notas" text,
  "created_at" text not null,
  primary key ("id"),
  foreign key ("solicitado_por") references "profiles"("id") on delete set null
);

create table "catalogo_productos" (
  "id" text,
  "nombre" text not null,
  "codigo" text,
  "descripcion" text,
  "imagen_url" text,
  "generico" integer not null,
  "created_at" text not null,
  primary key ("id")
);

create table "catalogo_variantes" (
  "id" text,
  "producto_id" text not null,
  "nombre" text not null,
  "codigo" text,
  primary key ("id"),
  foreign key ("producto_id") references "catalogo_productos"("id") on delete cascade
);

create table "categorias" (
  "id" text,
  "sede_id" text not null,
  "nombre" text not null,
  "anio_desde" integer,
  "anio_hasta" integer,
  "dias_horario" text,
  "estado" text not null,
  "created_at" text not null,
  "entrenador_principal_id" text,
  "mensualidad_base" integer,
  primary key ("id"),
  foreign key ("entrenador_principal_id") references "entrenadores"("id") on delete set null,
  foreign key ("sede_id") references "sedes"("id"),
  check (("estado" in ('activa', 'inactiva')))
);

create table "configuracion_financiera" (
  "id" integer,
  "mensualidad_default" integer,
  "matricula_default" integer,
  "matricula_reducida" integer,
  "dia_vencimiento" integer,
  "descuento_hermano_2_pct" integer,
  "descuento_hermano_3_pct" integer,
  "packs" text not null,
  "uniforme_incluido_en_matricula" integer not null,
  "uniforme_precio" integer,
  "uniforme_precio_cambio_numero" integer,
  "uniforme_precio_reposicion" integer,
  primary key ("id"),
  check (id)
);

create table "consentimientos" (
  "id" text,
  "alumno_id" text not null,
  "apoderado_id" text not null,
  "tipo" text check ("tipo" in ('atencion_psicologica', 'atencion_kinesiologica', 'uso_imagen', 'otro')) not null,
  "version_documento" text not null,
  "otorgado_en" text not null,
  "metodo" text,
  "revocado_en" text,
  "revocado_motivo" text,
  "created_at" text not null,
  primary key ("id"),
  foreign key ("alumno_id") references "alumnos"("id") on delete cascade,
  foreign key ("apoderado_id") references "apoderados"("id")
);

create table "convocatoria_jugadores" (
  "convocatoria_id" text,
  "alumno_id" text,
  "rechazada" integer not null,
  "estado" text check ("estado" in ('pendiente', 'confirmada', 'rechazada')) not null,
  "confirmado_por" text,
  "confirmado_en" text,
  primary key ("convocatoria_id", "alumno_id"),
  foreign key ("convocatoria_id") references "convocatorias"("id") on delete cascade,
  foreign key ("alumno_id") references "alumnos"("id") on delete cascade,
  foreign key ("confirmado_por") references "profiles"("id") on delete set null
);

create table "convocatorias" (
  "id" text,
  "partido_id" text not null,
  "created_at" text not null,
  primary key ("id"),
  foreign key ("partido_id") references "partidos"("id") on delete cascade
);

create table "documentos_tributarios" (
  "id" text,
  "tipo" text check ("tipo" in ('boleta', 'factura', 'nota_credito')) not null,
  "direccion" text check ("direccion" in ('emitido', 'recibido')) not null,
  "folio" text,
  "rut_contraparte" text,
  "razon_social_contraparte" text,
  "monto_neto" integer,
  "monto_iva" integer,
  "monto_total" integer not null,
  "fecha_emision" text not null,
  "categoria_gasto" text,
  "estado" text check ("estado" in ('pendiente', 'conciliado', 'anulado')) not null,
  "pago_id" text,
  "origen" text not null,
  "notas" text,
  "creado_por" text,
  "created_at" text not null,
  primary key ("id"),
  foreign key ("pago_id") references "pagos"("id") on delete set null,
  foreign key ("creado_por") references "profiles"("id") on delete set null
);

create table "entrenador_categorias" (
  "entrenador_id" text,
  "categoria_id" text,
  primary key ("entrenador_id", "categoria_id"),
  foreign key ("entrenador_id") references "entrenadores"("id") on delete cascade,
  foreign key ("categoria_id") references "categorias"("id") on delete cascade
);

create table "entrenadores" (
  "id" text,
  "profile_id" text,
  "nombre" text not null,
  "email" text,
  "telefono" text,
  "created_at" text not null,
  primary key ("id"),
  foreign key ("profile_id") references "profiles"("id") on delete set null
);

create table "entrenamiento_excepciones" (
  "id" text,
  "categoria_id" text not null,
  "fecha" text not null,
  "tipo" text check ("tipo" in ('suspendido', 'horario_distinto', 'cancha_distinta')) not null,
  "motivo" text,
  "nuevo_horario" text,
  "nuevo_recinto_id" text,
  "created_at" text not null,
  primary key ("id"),
  foreign key ("categoria_id") references "categorias"("id") on delete cascade,
  foreign key ("nuevo_recinto_id") references "recintos"("id") on delete set null
);

create table "eventos_partido" (
  "id" text,
  "partido_id" text not null,
  "alumno_id" text,
  "minuto" integer,
  "tipo" text check ("tipo" in ('gol', 'amarilla', 'roja', 'cambio', 'lesion')) not null,
  "created_at" text not null,
  "eliminado" integer not null,
  "eliminado_por" text,
  "eliminado_en" text,
  "motivo_eliminacion" text,
  primary key ("id"),
  foreign key ("partido_id") references "partidos"("id") on delete cascade,
  foreign key ("alumno_id") references "alumnos"("id") on delete set null,
  foreign key ("eliminado_por") references "profiles"("id") on delete set null
);

create table "fichas_medicas" (
  "alumno_id" text,
  "grupo_sanguineo" text,
  "condiciones_medicas" text,
  "alergias" text,
  "seguro_escolar" integer,
  "nombre_seguro" text,
  primary key ("alumno_id"),
  foreign key ("alumno_id") references "alumnos"("id") on delete cascade
);

create table "lesiones_adjuntos" (
  "id" text,
  "lesion_operativo_id" text not null,
  "uploaded_by" text,
  "storage_path" text not null,
  "nombre_archivo" text,
  "tipo_archivo" text,
  "descripcion" text,
  "created_at" text not null,
  primary key ("id"),
  foreign key ("lesion_operativo_id") references "lesiones_operativo"("id") on delete cascade,
  foreign key ("uploaded_by") references "profiles"("id") on delete set null
);

create table "lesiones_catalogo" (
  "id" text,
  "codigo" text,
  "nombre" text not null,
  "region_corporal" text,
  "tipo_lesion" text,
  "severidad_default" text check ("severidad_default" in ('leve', 'moderada', 'severa')),
  "dias_recuperacion_default" integer,
  "descripcion" text,
  "activo" integer not null,
  "created_at" text not null,
  primary key ("id")
);

create table "lesiones_clinico" (
  "id" text,
  "lesion_operativo_id" text not null,
  "mecanismo" text,
  "diagnostico" text,
  "derivacion_externa" text,
  "notas_clinicas" text,
  "profesional_tratante" text,
  "created_at" text not null,
  "updated_at" text not null,
  primary key ("id"),
  foreign key ("lesion_operativo_id") references "lesiones_operativo"("id") on delete cascade,
  foreign key ("profesional_tratante") references "profiles"("id") on delete set null
);

create table "lesiones_operativo" (
  "id" text,
  "alumno_id" text not null,
  "catalogo_item_id" text,
  "partido_id" text,
  "restriccion_id" text,
  "fecha_lesion" text not null,
  "region_corporal" text,
  "lado" text check ("lado" in ('izquierdo', 'derecho', 'bilateral', 'no_aplica')),
  "contexto" text check ("contexto" in ('entrenamiento', 'partido', 'fuera_del_club', 'desconocido')),
  "estado" text check ("estado" in ('activa', 'en_tratamiento', 'alta_medica', 'alta_deportiva', 'archivada')) not null,
  "fecha_retorno_estimada" text,
  "alta_medica_fecha" text,
  "alta_medica_por" text,
  "alta_deportiva_fecha" text,
  "alta_deportiva_por" text,
  "resumen_apoderado" text,
  "recomendacion_staff" text,
  "apoderado_notificado" integer not null,
  "instrucciones_apoderado" text,
  "created_by" text,
  "created_at" text not null,
  "updated_at" text not null,
  primary key ("id"),
  foreign key ("alumno_id") references "alumnos"("id") on delete cascade,
  foreign key ("catalogo_item_id") references "lesiones_catalogo"("id") on delete set null,
  foreign key ("partido_id") references "partidos"("id") on delete set null,
  foreign key ("restriccion_id") references "restricciones_salud"("id") on delete set null,
  foreign key ("alta_medica_por") references "profiles"("id") on delete set null,
  foreign key ("alta_deportiva_por") references "profiles"("id") on delete set null,
  foreign key ("created_by") references "profiles"("id") on delete set null
);

create table "lesiones_sesiones_tratamiento" (
  "id" text,
  "lesion_operativo_id" text not null,
  "recorded_by" text,
  "fecha" text not null,
  "tipo_sesion" text,
  "nivel_dolor" integer,
  "rango_movimiento" text,
  "inflamacion" integer,
  "tratamiento_aplicado" text,
  "feedback_alumno" text,
  "notas_progreso" text,
  "proxima_sesion" text,
  "created_at" text not null,
  primary key ("id"),
  foreign key ("lesion_operativo_id") references "lesiones_operativo"("id") on delete cascade,
  foreign key ("recorded_by") references "profiles"("id") on delete set null,
  check (((nivel_dolor >= 0) AND (nivel_dolor <= 10)))
);

create table "lineups" (
  "id" text,
  "partido_id" text not null,
  "formacion" text,
  "datos_json" text,
  "created_at" text not null,
  primary key ("id"),
  foreign key ("partido_id") references "partidos"("id") on delete cascade
);

create table "matriculas_categoria" (
  "id" text,
  "alumno_id" text not null,
  "categoria_id" text not null,
  "temporada_id" text not null,
  "estado" text not null,
  "tipo_cuota" text check ("tipo_cuota" in ('full', 'reducida', 'exenta')) not null,
  "pago_id" text,
  "created_at" text not null,
  primary key ("id"),
  foreign key ("alumno_id") references "alumnos"("id") on delete cascade,
  foreign key ("categoria_id") references "categorias"("id") on delete cascade,
  foreign key ("temporada_id") references "temporadas"("id") on delete cascade,
  foreign key ("pago_id") references "pagos"("id") on delete set null,
  check (("estado" in ('activa', 'pendiente_pago')))
);

create table "matriculas_sede" (
  "id" text,
  "alumno_id" text not null,
  "sede_id" text not null,
  "estado" text check ("estado" in ('activa', 'finalizada', 'suspendida')) not null,
  "fecha_inicio" text not null,
  "fecha_fin" text,
  "notas" text,
  "created_at" text not null,
  primary key ("id"),
  foreign key ("alumno_id") references "alumnos"("id") on delete cascade,
  foreign key ("sede_id") references "sedes"("id")
);

create table "mediciones_antropometricas" (
  "id" text,
  "alumno_id" text not null,
  "categoria_id" text,
  "temporada_id" text,
  "medido_por" text,
  "fecha_medicion" text not null,
  "periodo_medicion" text,
  "peso_kg" integer,
  "talla_cm" integer,
  "imc" integer,
  "imc_percentil" integer,
  "talla_percentil" integer,
  "peso_percentil" integer,
  "oms_version_usada" text,
  "categoria_imc" text,
  "tiene_alerta" integer not null,
  "tipo_alerta" text,
  "mensaje_alerta" text,
  "alerta_revisada" integer not null,
  "alerta_revisada_por" text,
  "alerta_revisada_en" text,
  "nota_revision" text,
  "notas" text,
  "created_at" text not null,
  primary key ("id"),
  foreign key ("alumno_id") references "alumnos"("id") on delete cascade,
  foreign key ("categoria_id") references "categorias"("id") on delete set null,
  foreign key ("temporada_id") references "temporadas"("id") on delete set null,
  foreign key ("medido_por") references "profiles"("id") on delete set null,
  foreign key ("alerta_revisada_por") references "profiles"("id") on delete set null
);

create table "mensaje_envios" (
  "id" text,
  "mensaje_id" text not null,
  "apoderado_id" text not null,
  "canal" text check ("canal" in ('whatsapp_api', 'wa_me', 'email', 'in_app', 'push')) not null,
  "estado" text check ("estado" in ('en_cola', 'enviado', 'entregado', 'leido', 'fallido')) not null,
  "proveedor_mensaje_id" text,
  "wa_url" text,
  "token_respuesta" text,
  "enviado_en" text,
  "entregado_en" text,
  "leido_en" text,
  "fallo_motivo" text,
  "created_at" text not null,
  primary key ("id"),
  foreign key ("mensaje_id") references "mensajes"("id") on delete cascade,
  foreign key ("apoderado_id") references "apoderados"("id") on delete cascade
);

create table "mensajes" (
  "id" text,
  "plantilla_id" text,
  "tipo" text check ("tipo" in ('cumpleanos', 'recordatorio_pago', 'pago_vencido', 'cambio_entrenamiento', 'entrenamiento_cancelado', 'convocatoria', 'evento', 'general')) not null,
  "alumno_id" text,
  "cuerpo_renderizado" text not null,
  "variables_usadas" text,
  "source_type" text check ("source_type" in ('pago', 'partido', 'sesion_entrenamiento', 'torneo', 'manual')) not null,
  "source_id" text,
  "creado_por" text,
  "created_at" text not null,
  primary key ("id"),
  foreign key ("plantilla_id") references "plantillas_mensaje"("id") on delete set null,
  foreign key ("alumno_id") references "alumnos"("id") on delete set null,
  foreign key ("creado_por") references "profiles"("id") on delete set null
);

create table "minutaje_categoria_resumen" (
  "id" text,
  "categoria_id" text not null,
  "temporada" text not null,
  "alumnos" integer,
  "jornadas" integer,
  "partidos" integer,
  "minutos_totales" integer,
  "citados_promedio_jornada" integer,
  primary key ("id"),
  foreign key ("categoria_id") references "categorias"("id") on delete cascade
);

create table "minutaje_resumen" (
  "id" text,
  "alumno_id" text not null,
  "categoria_id" text,
  "temporada" text not null,
  "estado" text,
  "fecha_incorporacion" text,
  "entrenamientos_presente" integer,
  "entrenamientos_registrados" integer,
  "asistencia_pct" integer,
  "jornadas_categoria" integer,
  "partidos_categoria" integer,
  "convocado_jornadas" integer,
  "convocado_partidos" integer,
  "convocatorias_rechazadas" integer,
  "convocatoria_pct" integer,
  "partidos_con_minutos" integer,
  "partidos_sin_entrar" integer,
  "minutaje_efectivo_pct" integer,
  "datos_insuficientes" integer,
  "minutos_cat_propia" integer,
  "minutos_otras_cat" integer,
  "minutos_totales" integer,
  "minutos_ult5_jornadas" integer,
  "jornadas_ult5" integer,
  "cumple_asistencia_60" integer,
  "cumple_convocatoria_70" integer,
  "cumple_minutos_50" integer,
  primary key ("id"),
  foreign key ("alumno_id") references "alumnos"("id") on delete cascade,
  foreign key ("categoria_id") references "categorias"("id") on delete set null
);

create table "minutajes_partido" (
  "id" text,
  "partido_id" text not null,
  "alumno_id" text not null,
  "titular" integer not null,
  "posicion" text,
  "minutos_jugados" integer not null,
  "minutos_fuente" text check ("minutos_fuente" in ('calculado', 'manual')) not null,
  "minutos_editado_por" text,
  "minutos_editado_en" text,
  "goles" integer not null,
  "asistencias" integer not null,
  "amarillas" integer not null,
  "rojas" integer not null,
  "nota_entrenador" integer,
  "comentario_entrenador" text,
  "created_at" text not null,
  "updated_at" text not null,
  primary key ("id"),
  foreign key ("partido_id") references "partidos"("id") on delete cascade,
  foreign key ("alumno_id") references "alumnos"("id") on delete cascade,
  foreign key ("minutos_editado_por") references "profiles"("id") on delete set null
);

create table "oms_tablas_referencia" (
  "id" text,
  "version" text not null,
  "sexo" text not null,
  "edad_meses" integer not null,
  "tipo_medida" text not null,
  "percentil" integer not null,
  "valor" integer not null,
  "created_at" text not null,
  primary key ("id"),
  check (("sexo" in ('M', 'F'))),
  check (("tipo_medida" in ('imc', 'talla', 'peso')))
);

create table "pagos" (
  "id" text,
  "alumno_id" text not null,
  "tipo" text check ("tipo" in ('matricula', 'mensualidad', 'pack', 'uniforme', 'catalogo', 'torneo', 'rifa', 'viaje', 'otro')) not null,
  "periodo" text,
  "sede_id" text,
  "monto_total" integer not null,
  "monto_pagado" integer not null,
  "estado" text check ("estado" in ('pendiente', 'parcial', 'por_comprobar', 'pagado', 'vencido')) not null,
  "fecha_vencimiento" text,
  "fecha_registro" text not null,
  "es_proporcional" integer not null,
  "dias_proporcional" text,
  "created_at" text not null,
  "pack_tipo" text,
  "descuento_monto" integer not null,
  "cubierto_por_pago_id" text,
  "metodo_pago" text,
  "comprobante_url" text,
  "notas" text,
  "temporada_id" text,
  primary key ("id"),
  foreign key ("alumno_id") references "alumnos"("id") on delete cascade,
  foreign key ("sede_id") references "sedes"("id") on delete set null,
  foreign key ("cubierto_por_pago_id") references "pagos"("id") on delete set null,
  foreign key ("temporada_id") references "temporadas"("id") on delete set null,
  check ((monto_pagado <= monto_total)),
  check ((monto_total >= (0)))
);

create table "pagos_transacciones" (
  "id" text,
  "pago_id" text not null,
  "monto" integer not null,
  "metodo_pago" text,
  "comprobante_url" text,
  "estado_aprobacion" text check ("estado_aprobacion" in ('pendiente', 'aprobado', 'rechazado')) not null,
  "registrado_por" text,
  "aprobado_por" text,
  "notas" text,
  "created_at" text not null,
  primary key ("id"),
  foreign key ("pago_id") references "pagos"("id") on delete cascade,
  foreign key ("registrado_por") references "profiles"("id") on delete set null,
  foreign key ("aprobado_por") references "profiles"("id") on delete set null,
  check ((monto > (0)))
);

create table "partido_estado_vivo" (
  "partido_id" text,
  "estado" text check ("estado" in ('no_iniciado', 'primer_tiempo', 'entretiempo', 'segundo_tiempo', 'finalizado')) not null,
  "minuto_actual" integer,
  "periodo_actual" text,
  "iniciado_en" text,
  "pausado" integer not null,
  "pausado_en" text,
  "segundos_acumulados" integer not null,
  "version" integer not null,
  "ultimo_checkpoint_en" text,
  "actualizado_en" text not null,
  primary key ("partido_id"),
  foreign key ("partido_id") references "partidos"("id") on delete cascade
);

create table "partidos" (
  "id" text,
  "categoria_id" text not null,
  "torneo_id" text,
  "recinto_id" text,
  "rival" text not null,
  "fecha_hora" text not null,
  "local_o_visita" text check ("local_o_visita" in ('local', 'visita', 'neutral')) not null,
  "estado" text check ("estado" in ('programado', 'en_curso', 'completado', 'cancelado')) not null,
  "resultado_local" integer,
  "resultado_rival" integer,
  "created_at" text not null,
  "telar_id" text,
  "temporada_id" text,
  primary key ("id"),
  foreign key ("categoria_id") references "categorias"("id") on delete cascade,
  foreign key ("torneo_id") references "torneos"("id") on delete set null,
  foreign key ("recinto_id") references "recintos"("id") on delete set null,
  foreign key ("temporada_id") references "temporadas"("id") on delete set null
);

create table "plantillas_mensaje" (
  "id" text,
  "tipo" text check ("tipo" in ('cumpleanos', 'recordatorio_pago', 'pago_vencido', 'cambio_entrenamiento', 'entrenamiento_cancelado', 'convocatoria', 'evento', 'general')) not null,
  "nombre" text not null,
  "cuerpo" text not null,
  "activa" integer not null,
  "created_by" text,
  "created_at" text not null,
  "updated_at" text not null,
  primary key ("id"),
  foreign key ("created_by") references "profiles"("id") on delete set null
);

create table "profiles" (
  "id" text,
  "email" text not null,
  "nombre" text,
  "rol" text check ("rol" in ('director', 'admin', 'entrenador', 'apoderado', 'profesional_salud')) not null,
  "created_at" text not null,
  primary key ("id")
);

create table "psicologia_adjuntos" (
  "id" text,
  "caso_id" text not null,
  "uploaded_by" text,
  "storage_path" text not null,
  "nombre_archivo" text,
  "descripcion" text,
  "created_at" text not null,
  primary key ("id"),
  foreign key ("caso_id") references "psicologia_casos"("id") on delete cascade,
  foreign key ("uploaded_by") references "profiles"("id") on delete set null
);

create table "psicologia_casos" (
  "id" text,
  "alumno_id" text not null,
  "catalogo_item_id" text,
  "temporada_id" text,
  "created_by" text,
  "abierto_en" text not null,
  "cerrado_en" text,
  "estado" text check ("estado" in ('abierto', 'en_progreso', 'pausado', 'cerrado')) not null,
  "origen" text check ("origen" in ('entrenador', 'autodeteccion', 'apoderado', 'otro')),
  "derivacion_externa" text,
  "resumen_apoderado" text,
  "recomendacion_staff" text,
  "recomendacion_staff_vence" text,
  "recomendacion_staff_prioridad" text check ("recomendacion_staff_prioridad" in ('normal', 'importante', 'urgente')),
  "consentimiento_id" text,
  "created_at" text not null,
  "updated_at" text not null,
  primary key ("id"),
  foreign key ("alumno_id") references "alumnos"("id") on delete cascade,
  foreign key ("catalogo_item_id") references "psicologia_catalogo"("id") on delete set null,
  foreign key ("temporada_id") references "temporadas"("id") on delete set null,
  foreign key ("created_by") references "profiles"("id") on delete set null,
  foreign key ("consentimiento_id") references "consentimientos"("id")
);

create table "psicologia_catalogo" (
  "id" text,
  "codigo" text,
  "nombre" text not null,
  "categoria" text,
  "descripcion" text,
  "activo" integer not null,
  "created_at" text not null,
  primary key ("id")
);

create table "psicologia_objetivos" (
  "id" text,
  "caso_id" text not null,
  "descripcion" text not null,
  "estado" text not null,
  "fecha_objetivo" text,
  "logrado_en" text,
  "created_at" text not null,
  primary key ("id"),
  foreign key ("caso_id") references "psicologia_casos"("id") on delete cascade,
  check (("estado" in ('pendiente', 'en_progreso', 'logrado', 'descartado')))
);

create table "psicologia_sesiones" (
  "id" text,
  "caso_id" text not null,
  "recorded_by" text not null,
  "fecha" text not null,
  "duracion_minutos" integer,
  "tipo_sesion" text,
  "animo_inicio" integer,
  "animo_fin" integer,
  "intervenciones" text,
  "notas_clinicas" text,
  "notas_progreso" text,
  "tarea" text,
  "resumen_apoderado" text,
  "recomendacion_staff" text,
  "created_at" text not null,
  primary key ("id"),
  foreign key ("caso_id") references "psicologia_casos"("id") on delete cascade,
  foreign key ("recorded_by") references "profiles"("id"),
  check (((animo_inicio >= 1) AND (animo_inicio <= 10))),
  check (((animo_fin >= 1) AND (animo_fin <= 10)))
);

create table "push_subscriptions" (
  "id" text,
  "profile_id" text not null,
  "endpoint" text not null,
  "p256dh" text not null,
  "auth" text not null,
  "user_agent" text,
  "created_at" text not null,
  primary key ("id"),
  foreign key ("profile_id") references "profiles"("id") on delete cascade
);

create table "recintos" (
  "id" text,
  "nombre" text not null,
  "created_at" text not null,
  primary key ("id")
);

create table "registros_asistencia" (
  "id" text,
  "sesion_id" text not null,
  "alumno_id" text not null,
  "estado" text check ("estado" in ('presente', 'ausente', 'tardanza', 'justificada')) not null,
  "created_at" text not null,
  "recorded_by" text,
  primary key ("id"),
  foreign key ("sesion_id") references "sesiones_entrenamiento"("id") on delete cascade,
  foreign key ("alumno_id") references "alumnos"("id") on delete cascade,
  foreign key ("recorded_by") references "profiles"("id") on delete set null
);

create table "restricciones_salud" (
  "id" text,
  "alumno_id" text not null,
  "can_train" integer not null,
  "can_train_physical" integer not null,
  "can_play_matches" integer not null,
  "severidad" text check ("severidad" in ('leve', 'moderada', 'severa')),
  "restricciones" text,
  "vigente_desde" text not null,
  "vigente_hasta" text,
  "override_staff" integer not null,
  "override_motivo" text,
  "override_por" text,
  "created_at" text not null,
  "updated_at" text not null,
  primary key ("id"),
  foreign key ("alumno_id") references "alumnos"("id") on delete cascade,
  foreign key ("override_por") references "profiles"("id") on delete set null
);

create table "salud_audit_log" (
  "id" text,
  "tabla" text not null,
  "registro_id" text not null,
  "accion" text not null,
  "usuario" text,
  "detalle" text,
  "created_at" text not null,
  primary key ("id"),
  foreign key ("usuario") references "profiles"("id") on delete set null,
  check (("accion" in ('select', 'insert', 'update', 'delete')))
);

create table "sedes" (
  "id" text,
  "nombre" text not null,
  "created_at" text not null,
  primary key ("id")
);

create table "sesiones_entrenamiento" (
  "id" text,
  "categoria_id" text not null,
  "fecha" text not null,
  "created_at" text not null,
  "temporada_id" text,
  primary key ("id"),
  foreign key ("categoria_id") references "categorias"("id") on delete cascade,
  foreign key ("temporada_id") references "temporadas"("id") on delete set null
);

create table "temporadas" (
  "id" text,
  "nombre" text not null,
  "fecha_inicio" text not null,
  "fecha_fin" text not null,
  "activa" integer not null,
  "created_at" text not null,
  primary key ("id")
);

create table "torneo_categorias" (
  "torneo_id" text,
  "categoria_id" text,
  primary key ("torneo_id", "categoria_id"),
  foreign key ("torneo_id") references "torneos"("id") on delete cascade,
  foreign key ("categoria_id") references "categorias"("id") on delete cascade
);

create table "torneo_inscripciones" (
  "id" text,
  "torneo_id" text not null,
  "alumno_id" text not null,
  "estado" text check ("estado" in ('pendiente', 'aprobada', 'rechazada', 'retirada')) not null,
  "pago_id" text,
  "aprobado_por" text,
  "aprobado_en" text,
  "notas" text,
  "created_at" text not null,
  primary key ("id"),
  foreign key ("torneo_id") references "torneos"("id") on delete cascade,
  foreign key ("alumno_id") references "alumnos"("id") on delete cascade,
  foreign key ("pago_id") references "pagos"("id") on delete set null,
  foreign key ("aprobado_por") references "profiles"("id") on delete set null
);

create table "torneos" (
  "id" text,
  "nombre" text not null,
  "formato_tiempos" integer,
  "formato_minutos" integer,
  "created_at" text not null,
  "tipo" text check ("tipo" in ('un_dia', 'corto_plazo', 'anual')) not null,
  "fecha_inicio" text,
  "fecha_fin" text,
  "estado" text check ("estado" in ('activo', 'finalizado', 'cancelado')) not null,
  "sede_id" text,
  "precio" integer,
  "obligatorio" integer not null,
  "requiere_aprobacion" integer not null,
  "telar_nombre" text,
  "telar_id" text,
  "costo_adicional" integer not null,
  "plazo_aprobacion" text,
  primary key ("id"),
  foreign key ("sede_id") references "sedes"("id") on delete set null
);

create table "uniforme_pedidos" (
  "id" text,
  "alumno_id" text not null,
  "categoria_id" text,
  "numero_camiseta" integer,
  "talla_camiseta" text,
  "talla_short" text,
  "estado" text check ("estado" in ('pendiente_pago', 'pagado', 'enviado_proveedor', 'en_produccion', 'entregado', 'cancelado')) not null,
  "pago_requerido" integer not null,
  "pago_id" text,
  "monto" integer,
  "motivo" text check ("motivo" in ('inicial', 'reposicion', 'cambio_numero')) not null,
  "pedido_anterior_id" text,
  "fecha_pedido" text,
  "fecha_entrega" text,
  "notas" text,
  "created_at" text not null,
  primary key ("id"),
  foreign key ("alumno_id") references "alumnos"("id") on delete cascade,
  foreign key ("categoria_id") references "categorias"("id") on delete set null,
  foreign key ("pago_id") references "pagos"("id") on delete set null,
  foreign key ("pedido_anterior_id") references "uniforme_pedidos"("id") on delete set null
);

create table "variables_mensaje_catalogo" (
  "tipo" text check ("tipo" in ('cumpleanos', 'recordatorio_pago', 'pago_vencido', 'cambio_entrenamiento', 'entrenamiento_cancelado', 'convocatoria', 'evento', 'general')),
  "variable" text,
  "descripcion" text,
  primary key ("tipo", "variable")
);

