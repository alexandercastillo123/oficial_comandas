const crypto = require('crypto');
const asistenciaRepo = require('../repositories/asistencia.repo');

function generarToken() {
   return crypto.randomBytes(16).toString('hex');
}

function parseTime(timeVal) {
  if (!timeVal) return null;
  if (timeVal instanceof Date) {
    return {
      hours: timeVal.getHours(),
      minutes: timeVal.getMinutes(),
      seconds: timeVal.getSeconds()
    };
  }
  if (typeof timeVal === 'string') {
    const parts = timeVal.split(':');
    if (parts.length >= 2) {
      return {
        hours: parseInt(parts[0], 10),
        minutes: parseInt(parts[1], 10),
        seconds: parts.length > 2 ? parseInt(parts[2].split('.')[0], 10) : 0
      };
    }
  }
  if (typeof timeVal.hours === 'number') {
    return {
      hours: timeVal.hours,
      minutes: timeVal.minutes,
      seconds: timeVal.seconds || 0
    };
  }
  return null;
}

async function generarQr(idUsuario, idTienda, tipo) {
  // 1. Obtener el turno
  const turno = await obtenerTurno(idUsuario);
  if (!turno) {
    throw new Error('No tienes un turno de trabajo asignado. Contacta al administrador.');
  }

  // 2. Verificar marcas de hoy
  const asistenciasHoy = await asistenciaRepo.obtenerAsistenciasHoy(idUsuario);
  if (tipo === 'ENTRADA' && asistenciasHoy.some(a => a.tipo === 'ENTRADA')) {
    throw new Error('Ya registraste tu entrada el día de hoy.');
  }
  if (tipo === 'SALIDA') {
    if (!asistenciasHoy.some(a => a.tipo === 'ENTRADA')) {
      throw new Error('Debes marcar tu entrada antes de poder registrar tu salida.');
    }
    if (asistenciasHoy.some(a => a.tipo === 'SALIDA')) {
      throw new Error('Ya registraste tu salida el día de hoy.');
    }
  }

  // 3. Validar ventana de 15 minutos antes de la hora de entrada (solo para ENTRADA)
  const ahora = new Date();
  if (tipo === 'ENTRADA') {
    const timeEntrada = parseTime(turno.hora_entrada);
    if (!timeEntrada) {
      throw new Error('Formato de hora de entrada inválido en el turno.');
    }
    const shiftStart = new Date(ahora);
    shiftStart.setHours(timeEntrada.hours, timeEntrada.minutes, timeEntrada.seconds, 0);

    const limitStart = new Date(shiftStart.getTime() - 15 * 60 * 1000);
    if (ahora < limitStart) {
      const pad = (n) => String(n).padStart(2, '0');
      const horaStr = `${pad(timeEntrada.hours)}:${pad(timeEntrada.minutes)}`;
      const limitStr = `${pad(limitStart.getHours())}:${pad(limitStart.getMinutes())}`;
      throw new Error(`Aún es muy temprano. Tu turno inicia a las ${horaStr}. Puedes marcar tu asistencia desde las ${limitStr}.`);
    }
  }

  // 4. Generar token y guardar en DB
  const token = generarToken();
  await asistenciaRepo.createAsistencia({
    id_usuario: idUsuario,
    id_tienda: idTienda,
    tipo,
    qr_token: token,
    observacion: 'Token temporal generado'
  });

  return {
    token,
    expires_in: 10
  };
}

async function validarQr(token) {
  const registro = await asistenciaRepo.getQrValido(token);
  if (!registro) {
    return { valido: false, motivo: 'Token no encontrado' };
  }
  if (registro.estado !== 'REGISTRADO') {
    return { valido: false, motivo: 'Este token ya ha sido validado o procesado' };
  }

  // Expiración de 10 segundos
  const diffMs = Date.now() - new Date(registro.fecha_hora).getTime();
  if (diffMs > 10000) {
    await asistenciaRepo.updateAsistenciaEstado(registro.id_asistencia, 'RECHAZADO', 'Token expirado');
    return { valido: false, motivo: 'El código QR ha expirado. Por favor genera uno nuevo.' };
  }

  // Calcular si es entrada a tiempo o tardanza, o salida antes de tiempo
  let observacion = 'A tiempo';
  if (registro.tipo === 'ENTRADA') {
    const turno = await obtenerTurno(registro.id_usuario);
    if (turno) {
      const timeEntrada = parseTime(turno.hora_entrada);
      if (timeEntrada) {
        const ahora = new Date();
        const shiftStart = new Date(ahora);
        shiftStart.setHours(timeEntrada.hours, timeEntrada.minutes, timeEntrada.seconds, 0);

        const toleranceEnd = new Date(shiftStart.getTime() + (turno.tolerancia_min || 15) * 60 * 1000);
        if (ahora > toleranceEnd) {
          const diffMins = Math.floor((ahora.getTime() - shiftStart.getTime()) / 60000);
          observacion = `Tardanza: ${diffMins} minutos tarde`;
        }
      }
    }
  } else if (registro.tipo === 'SALIDA') {
    const turno = await obtenerTurno(registro.id_usuario);
    if (turno) {
      const timeSalida = parseTime(turno.hora_salida);
      if (timeSalida) {
        const ahora = new Date();
        const shiftEnd = new Date(ahora);
        shiftEnd.setHours(timeSalida.hours, timeSalida.minutes, timeSalida.seconds, 0);

        if (ahora < shiftEnd) {
          const diffMins = Math.floor((shiftEnd.getTime() - ahora.getTime()) / 60000);
          observacion = `Salida Temprana: ${diffMins} minutos antes`;
        } else {
          observacion = 'Salida Correcta';
        }
      }
    }
  }

  // Marcar como validado
  await asistenciaRepo.updateAsistenciaEstado(registro.id_asistencia, 'VALIDADO', observacion);
  return { valido: true, registro: { ...registro, estado: 'VALIDADO', observacion } };
}

async function registrarAsistencia(idUsuario, idTienda, tipo, usuarioCreacionId) {
  const token = generarToken();
  const result = await asistenciaRepo.createAsistencia({
    id_usuario: idUsuario,
    id_tienda: idTienda,
    tipo,
    qr_token: token,
    usuario_creacion: usuarioCreacionId
  });
  return { id_asistencia: result, token };
}

async function asignarTurno(data) {
  await asistenciaRepo.desactivarTurnosUsuario(data.id_usuario);
  return asistenciaRepo.createTurno(data);
}

async function obtenerTurno(idUsuario) {
  return asistenciaRepo.getByUsuario(idUsuario);
}

async function listarAsistencias(tiendaId, filtros) {
   const { fechaDesde, fechaHasta, idUsuario, idTienda } = filtros;
   return asistenciaRepo.getAsistenciasByTienda(idTienda || tiendaId, {
     fechaDesde, fechaHasta, idUsuario
   });
}

async function ultimasAsistencias(idUsuario, limit = 5) {
  return asistenciaRepo.getUltimasAsistenciasByUsuario(idUsuario, limit);
}

async function obtenerEstadoAsistenciaHoy(idUsuario) {
  const turno = await obtenerTurno(idUsuario);
  const asistencias = await asistenciaRepo.obtenerAsistenciasHoy(idUsuario);
  
  const entrada = asistencias.find(a => a.tipo === 'ENTRADA') || null;
  const salida = asistencias.find(a => a.tipo === 'SALIDA') || null;

  if (turno) {
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
    turno.hora_entrada = formatTime(turno.hora_entrada);
    turno.hora_salida = formatTime(turno.hora_salida);
  }
  
  return {
    turno,
    entradaMarcada: !!entrada,
    salidaMarcada: !!salida,
    entrada,
    salida
  };
}

module.exports = {
  generarQr,
  validarQr,
  registrarAsistencia,
  asignarTurno,
  obtenerTurno,
  listarAsistencias,
  ultimasAsistencias,
  obtenerEstadoAsistenciaHoy
};
