const bcrypt = require('bcryptjs');
const usuariosRepo = require('../repositories/usuarios.repo');

async function getTrabajadores(tiendaId, rolApp) {
  return await usuariosRepo.listByTienda(tiendaId, rolApp);
}

async function getTrabajador(id) {
  const user = await usuariosRepo.getById(id);
  if (!user) throw new Error('Trabajador no encontrado');
  return user;
}

async function crearTrabajador(userData, tiendaId) {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(userData.clave || 'Ideal2026', salt);
  const payload = { ...userData, clave: hash };

  const userId = await usuariosRepo.create(payload);
  await usuariosRepo.addUsuarioTienda(userId, tiendaId, 1);
  return userId;
}

async function editarTrabajador(id, userData) {
  const payload = { ...userData };
  await usuariosRepo.update(id, payload);
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
