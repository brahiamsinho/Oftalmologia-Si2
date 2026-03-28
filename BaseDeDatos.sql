//////////////////////////////////////////////////////
// CLÍNICA OFTALMOLÓGICA - BASE DE DATOS SPRINT 1
// Alcance incluido:
// - Usuarios y seguridad
// - Roles y permisos
// - Perfil / login / recuperación
// - Bitácora
// - Pacientes
// - Historial clínico oftalmológico
// - Citas y agenda médica
//////////////////////////////////////////////////////

Enum estado_usuario {
  ACTIVO
  INACTIVO
  BLOQUEADO
}

Enum tipo_usuario {
  ADMINISTRATIVO
  MEDICO
  ESPECIALISTA
  PACIENTE
  ADMIN
}

Enum estado_paciente {
  ACTIVO
  EN_SEGUIMIENTO
  POSTOPERATORIO
  INACTIVO
}

Enum estado_historia_clinica {
  ACTIVA
  CERRADA
  ARCHIVADA
}

Enum tipo_antecedente {
  MEDICO
  OFTALMOLOGICO
  ALERGIA
  FAMILIAR
  QUIRURGICO
  OTRO
}

Enum estado_tratamiento {
  ACTIVO
  SUSPENDIDO
  FINALIZADO
}

Enum tipo_cita_nombre {
  CONSULTA
  ESTUDIO
  CIRUGIA
  SEGUIMIENTO_POSTOPERATORIO
}

Enum estado_cita {
  PROGRAMADA
  CONFIRMADA
  REPROGRAMADA
  CANCELADA
  ATENDIDA
  NO_ASISTIO
}

Enum accion_bitacora {
  LOGIN
  LOGOUT
  LOGIN_FALLIDO
  CREAR
  EDITAR
  ELIMINAR
  CAMBIAR_PASSWORD
  RECUPERAR_PASSWORD
  REPROGRAMAR
  CANCELAR
  CONFIRMAR
}

Table usuarios {
  id_usuario bigint [pk, increment]
  username varchar(50) [not null, unique]
  email varchar(120) [not null, unique]
  password_hash text [not null]
  nombres varchar(100) [not null]
  apellidos varchar(100) [not null]
  telefono varchar(30)
  foto_perfil text
  tipo_usuario tipo_usuario [not null]
  estado estado_usuario [not null, default: 'ACTIVO']
  ultimo_acceso timestamp
  fecha_creacion timestamp [not null, default: `CURRENT_TIMESTAMP`]
  fecha_actualizacion timestamp [not null, default: `CURRENT_TIMESTAMP`]

  Note: 'Usuarios del sistema: personal administrativo, médicos y pacientes.'
}

Table roles {
  id_rol bigint [pk, increment]
  nombre varchar(50) [not null, unique]
  descripcion varchar(255)
  activo boolean [not null, default: true]
}

Table permisos {
  id_permiso bigint [pk, increment]
  codigo varchar(100) [not null, unique]
  nombre varchar(100) [not null]
  modulo varchar(100) [not null]
  descripcion varchar(255)
}

Table usuario_rol {
  id_usuario bigint [not null]
  id_rol bigint [not null]
  fecha_asignacion timestamp [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (id_usuario, id_rol) [pk]
  }
}

Table rol_permiso {
  id_rol bigint [not null]
  id_permiso bigint [not null]
  fecha_asignacion timestamp [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (id_rol, id_permiso) [pk]
  }
}

Table tokens_recuperacion {
  id_token bigint [pk, increment]
  id_usuario bigint [not null]
  token text [not null, unique]
  expira_en timestamp [not null]
  usado boolean [not null, default: false]
  fecha_creacion timestamp [not null, default: `CURRENT_TIMESTAMP`]
}

Table bitacora {
  id_bitacora bigint [pk, increment]
  id_usuario bigint
  modulo varchar(100) [not null]
  tabla_afectada varchar(100)
  id_registro_afectado bigint
  accion accion_bitacora [not null]
  descripcion text
  ip_origen varchar(45)
  user_agent text
  fecha_evento timestamp [not null, default: `CURRENT_TIMESTAMP`]

  Note: 'Registro de actividades importantes para seguridad y trazabilidad.'
}

Table pacientes {
  id_paciente bigint [pk, increment]
  id_usuario bigint [unique]
  numero_historia varchar(30) [not null, unique]
  tipo_documento varchar(20) [not null]
  numero_documento varchar(30) [not null, unique]
  nombres varchar(100) [not null]
  apellidos varchar(100) [not null]
  fecha_nacimiento date
  sexo varchar(20)
  telefono varchar(30)
  email varchar(120)
  direccion text
  contacto_emergencia_nombre varchar(150)
  contacto_emergencia_telefono varchar(30)
  estado_paciente estado_paciente [not null, default: 'ACTIVO']
  fecha_registro timestamp [not null, default: `CURRENT_TIMESTAMP`]
  observaciones_generales text

  Note: 'Datos generales del paciente y estado dentro del proceso de atención.'
}

Table especialistas {
  id_especialista bigint [pk, increment]
  id_usuario bigint [not null, unique]
  codigo_profesional varchar(50) [unique]
  especialidad varchar(100) [not null]
  activo boolean [not null, default: true]

  Note: 'Médicos/especialistas que atienden citas y registran información clínica.'
}

Table historias_clinicas {
  id_historia_clinica bigint [pk, increment]
  id_paciente bigint [not null, unique]
  fecha_apertura date [not null, default: `CURRENT_DATE`]
  motivo_apertura text
  estado estado_historia_clinica [not null, default: 'ACTIVA']
  observaciones text

  Note: 'Expediente clínico oftalmológico digital del paciente.'
}

Table antecedentes_clinicos {
  id_antecedente bigint [pk, increment]
  id_historia_clinica bigint [not null]
  tipo_antecedente tipo_antecedente [not null]
  descripcion text [not null]
  fecha_registro timestamp [not null, default: `CURRENT_TIMESTAMP`]
  registrado_por bigint

  Note: 'Antecedentes médicos, oftalmológicos, alergias y otros.'
}

Table diagnosticos_clinicos {
  id_diagnostico bigint [pk, increment]
  id_historia_clinica bigint [not null]
  fecha_diagnostico date [not null, default: `CURRENT_DATE`]
  descripcion text [not null]
  cie10 varchar(20)
  id_especialista bigint
  observaciones text
}

Table tratamientos_clinicos {
  id_tratamiento bigint [pk, increment]
  id_historia_clinica bigint [not null]
  id_diagnostico bigint
  descripcion text [not null]
  indicaciones text
  fecha_inicio date
  fecha_fin date
  estado estado_tratamiento [not null, default: 'ACTIVO']
  id_especialista bigint
}

Table evoluciones_clinicas {
  id_evolucion bigint [pk, increment]
  id_historia_clinica bigint [not null]
  fecha_evolucion timestamp [not null, default: `CURRENT_TIMESTAMP`]
  nota_evolucion text [not null]
  id_especialista bigint
}

Table recetas {
  id_receta bigint [pk, increment]
  id_historia_clinica bigint [not null]
  id_especialista bigint
  fecha_receta timestamp [not null, default: `CURRENT_TIMESTAMP`]
  indicaciones_generales text
}

Table receta_detalles {
  id_receta_detalle bigint [pk, increment]
  id_receta bigint [not null]
  medicamento varchar(150) [not null]
  dosis varchar(100)
  frecuencia varchar(100)
  duracion varchar(100)
  via_administracion varchar(50)
}

Table tipos_cita {
  id_tipo_cita bigint [pk, increment]
  nombre tipo_cita_nombre [not null, unique]
  descripcion varchar(255)
}

Table disponibilidades_especialista {
  id_disponibilidad bigint [pk, increment]
  id_especialista bigint [not null]
  dia_semana int [not null, note: '1=Lunes ... 7=Domingo']
  hora_inicio time [not null]
  hora_fin time [not null]
  intervalo_minutos int [not null, default: 30]
  fecha_desde date
  fecha_hasta date
  activo boolean [not null, default: true]

  Note: 'Horarios base del especialista para agenda médica.'
}

Table citas {
  id_cita bigint [pk, increment]
  id_paciente bigint [not null]
  id_especialista bigint [not null]
  id_tipo_cita bigint [not null]
  fecha_hora_inicio timestamp [not null]
  fecha_hora_fin timestamp [not null]
  estado estado_cita [not null, default: 'PROGRAMADA']
  motivo text
  observaciones text
  confirmada_en timestamp
  id_cita_reprogramada_desde bigint
  creado_por bigint
  fecha_creacion timestamp [not null, default: `CURRENT_TIMESTAMP`]

  Note: 'Programación, reprogramación, cancelación, confirmación y control de citas.'
}

//////////////////////////////////////////////////////
// RELACIONES
//////////////////////////////////////////////////////

Ref: usuario_rol.id_usuario > usuarios.id_usuario [delete: cascade]
Ref: usuario_rol.id_rol > roles.id_rol [delete: cascade]

Ref: rol_permiso.id_rol > roles.id_rol [delete: cascade]
Ref: rol_permiso.id_permiso > permisos.id_permiso [delete: cascade]

Ref: tokens_recuperacion.id_usuario > usuarios.id_usuario [delete: cascade]

Ref: bitacora.id_usuario > usuarios.id_usuario [delete: set null]

Ref: pacientes.id_usuario > usuarios.id_usuario [delete: set null]
Ref: especialistas.id_usuario > usuarios.id_usuario [delete: cascade]

Ref: historias_clinicas.id_paciente > pacientes.id_paciente [delete: cascade]

Ref: antecedentes_clinicos.id_historia_clinica > historias_clinicas.id_historia_clinica [delete: cascade]
Ref: antecedentes_clinicos.registrado_por > usuarios.id_usuario [delete: set null]

Ref: diagnosticos_clinicos.id_historia_clinica > historias_clinicas.id_historia_clinica [delete: cascade]
Ref: diagnosticos_clinicos.id_especialista > especialistas.id_especialista [delete: set null]

Ref: tratamientos_clinicos.id_historia_clinica > historias_clinicas.id_historia_clinica [delete: cascade]
Ref: tratamientos_clinicos.id_diagnostico > diagnosticos_clinicos.id_diagnostico [delete: set null]
Ref: tratamientos_clinicos.id_especialista > especialistas.id_especialista [delete: set null]

Ref: evoluciones_clinicas.id_historia_clinica > historias_clinicas.id_historia_clinica [delete: cascade]
Ref: evoluciones_clinicas.id_especialista > especialistas.id_especialista [delete: set null]

Ref: recetas.id_historia_clinica > historias_clinicas.id_historia_clinica [delete: cascade]
Ref: recetas.id_especialista > especialistas.id_especialista [delete: set null]

Ref: receta_detalles.id_receta > recetas.id_receta [delete: cascade]

Ref: disponibilidades_especialista.id_especialista > especialistas.id_especialista [delete: cascade]

Ref: citas.id_paciente > pacientes.id_paciente [delete: cascade]
Ref: citas.id_especialista > especialistas.id_especialista [delete: restrict]
Ref: citas.id_tipo_cita > tipos_cita.id_tipo_cita [delete: restrict]
Ref: citas.id_cita_reprogramada_desde > citas.id_cita [delete: set null]
Ref: citas.creado_por > usuarios.id_usuario [delete: set null]

