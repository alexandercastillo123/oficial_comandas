const asistenciaService = require('../services/asistencia.service');
const { verifyToken, requireRole } = require('../middleware/auth');

async function generarQr(req, res) {
  try {
    const usuario = req.user;
    const { tipo } = req.body;
    const qr = await asistenciaService.generarQr(usuario.id_usuario, usuario.id_tienda, tipo);
    res.json(qr);
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
}

async function validarQr(req, res) {
  try {
    const { token } = req.body;
    const resultado = await asistenciaService.validarQr(token);
    if (!resultado.valido) {
      return res.status(400).json({ error: { message: resultado.motivo } });
    }
    res.json(resultado);
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
}

async function registrarAsistencia(req, res) {
  try {
    const usuario = req.user;
    const { tipo } = req.body;
    const result = await asistenciaService.registrarAsistencia(usuario.id_usuario, usuario.id_tienda, tipo, usuario.id_usuario);
    res.status(201).json({ id_asistencia: result.id_asistencia, token: result.token });
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
}

async function marcarAsistenciaManual(req, res) {
  try {
    const admin = req.user;
    const { id_usuario, id_tienda, tipo } = req.body;
    const result = await asistenciaService.registrarAsistencia(id_usuario, id_tienda, tipo, admin.id_usuario);
    res.status(201).json({ id_asistencia: result.id_asistencia, token: result.token });
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
}

async function asignarTurno(req, res) {
  try {
    const data = { ...req.body, usuario_creacion: req.user.id_usuario };
    const idTurno = await asistenciaService.asignarTurno(data);
    res.status(201).json({ id_turno_usuario: idTurno });
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
}

async function obtenerTurno(req, res) {
  try {
    const { idUsuario } = req.params;
    const turno = await asistenciaService.obtenerTurno(parseInt(idUsuario));
    if (!turno) {
      return res.status(404).json({ error: { message: 'Usuario sin turno asignado' } });
    }
    res.json(turno);
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
}

async function listarAsistencias(req, res) {
  try {
    const { fechaDesde, fechaHasta, idUsuario } = req.query;
    const tiendaId = req.user.id_tienda;
    const datos = await asistenciaService.listarAsistencias(tiendaId, {
      fechaDesde, fechaHasta, idUsuario: idUsuario ? parseInt(idUsuario) : null
    });
    res.json({ data: datos });
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
}

async function historialPersonal(req, res) {
  try {
    const usuario = req.user;
    const datos = await asistenciaService.ultimasAsistencias(usuario.id_usuario, 20);
    res.json({ data: datos });
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
}

async function obtenerEstadoHoy(req, res) {
  try {
    const usuario = req.user;
    const estado = await asistenciaService.obtenerEstadoAsistenciaHoy(usuario.id_usuario);
    res.json(estado);
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
}

module.exports = {
  generarQr,
  validarQr,
  registrarAsistencia,
  marcarAsistenciaManual,
  asignarTurno,
  obtenerTurno,
  listarAsistencias,
  historialPersonal,
  obtenerEstadoHoy
};
