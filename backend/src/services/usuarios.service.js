const bcrypt = require('bcryptjs');
const usuariosRepo = require('../repositories/usuarios.repo');

async function getTrabajadores(tiendaId, rolApp) {
  const users = await usuariosRepo.listByTienda(tiendaId, rolApp);
  
  // Mapear cada usuario para adjuntarle su turno activo
  const formatTime = (val) => {
    if (!val) return null;
    if (val instanceof Date) {
      const h = String(val.getHours()).padStart(2, '0');
      const m = String(val.getMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    }
    if (typeof val === 'string') {
      return val.substring(0, 5);
    }
    return null;
  };

  for (let user of users) {
    const turno = await asistenciaService.obtenerTurno(user.id_usuario);
    if (turno) {
      user.hora_entrada = formatTime(turno.hora_entrada);
      user.hora_salida = formatTime(turno.hora_salida);
      user.tolerancia_min = turno.tolerancia_min;
    }
  }
  return users;
}

async function getTrabajador(id) {
  const user = await usuariosRepo.getById(id);
  if (!user) throw new Error('Trabajador no encontrado');
  
  // Traer también el turno activo del usuario
  const turno = await asistenciaService.obtenerTurno(id);
  if (turno) {
    const formatTime = (val) => {
      if (!val) return null;
      if (val instanceof Date) {
        const h = String(val.getHours()).padStart(2, '0');
        const m = String(val.getMinutes()).padStart(2, '0');
        return `${h}:${m}`;
      }
      if (typeof val === 'string') {
        // "08:00:00" -> "08:00"
        return val.substring(0, 5);
      }
      return null;
    };
    user.hora_entrada = formatTime(turno.hora_entrada);
    user.hora_salida = formatTime(turno.hora_salida);
    user.tolerancia_min = turno.tolerancia_min;
  }
  return user;
}

const authRepo = require('../repositories/auth.repo');
const asistenciaService = require('./asistencia.service');

async function crearTrabajador(userData, tiendaId, turnoData, usuarioCreadorId) {
  // Validar nombre de usuario duplicado
  const existingUser = await authRepo.findByUsername(userData.usuario);
  if (existingUser) {
    throw new Error('El nombre de usuario ya se encuentra registrado.');
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(userData.clave || 'Ideal2026', salt);
  const payload = { ...userData, clave: hash };

  const userId = await usuariosRepo.create(payload);
  await usuariosRepo.addUsuarioTienda(userId, tiendaId, 1);

  if (turnoData && (turnoData.hora_entrada || turnoData.hora_salida)) {
    await asistenciaService.asignarTurno({
      id_usuario: userId,
      id_tienda: tiendaId,
      ...turnoData,
      usuario_creacion: usuarioCreadorId
    });
  }

  return userId;
}

async function editarTrabajador(id, userData, tiendaId, usuarioCreadorId) {
  const { hora_entrada, hora_salida, tolerancia_min, ...userPayload } = userData;
  
  await usuariosRepo.update(id, userPayload);

  if (hora_entrada || hora_salida) {
    await asistenciaService.asignarTurno({
      id_usuario: id,
      id_tienda: tiendaId || 1,
      hora_entrada,
      hora_salida,
      tolerancia_min: tolerancia_min !== undefined ? parseInt(tolerancia_min, 10) : 15,
      usuario_creacion: usuarioCreadorId
    });
  }
}

async function eliminarTrabajador(id) {
  await usuariosRepo.deleteUsuario(id);
}

async function desactivarTrabajador(id, estado) {
  await usuariosRepo.updateEstado(id, estado);
}

async function actualizarPerfil(id, profileData) {
  const payload = { ...profileData };
  if (profileData.clave) {
    const salt = await bcrypt.genSalt(10);
    payload.clave = await bcrypt.hash(profileData.clave, salt);
  }
  await usuariosRepo.updatePerfil(id, payload);
}

async function actualizarClave(id, claveNueva) {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(claveNueva, salt);
  await usuariosRepo.updateClave(id, hash);
}

module.exports = {
  getTrabajadores,
  getTrabajador,
  crearTrabajador,
  editarTrabajador,
  eliminarTrabajador,
  desactivarTrabajador,
  actualizarPerfil,
  actualizarClave
};
