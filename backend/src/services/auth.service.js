const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const authRepo = require('../repositories/auth.repo');

async function login(username, password) {
  const user = await authRepo.findByUsername(username);
  if (!user) {
    throw new Error('Usuario o contraseña incorrectos');
  }

  // Soporte para contraseña por defecto en el script SQL de inicialización
  const isDefaultHash = user.clave === '$2y$10$TuClaveHashBcryptAqui.DeleiteDefaultPwd2026xxxxx';
  let isPasswordValid = false;

  if (isDefaultHash && password === 'Deleite2026') {
    isPasswordValid = true;
  } else {
    try {
      isPasswordValid = await bcrypt.compare(password, user.clave);
    } catch (err) {
      isPasswordValid = false;
    }
  }

  if (!isPasswordValid) {
    throw new Error('Usuario o contraseña incorrectos');
  }

  const tiendas = await authRepo.getUserTiendas(user.id_usuario);
  if (tiendas.length === 0) {
    throw new Error('El usuario no tiene sucursales asignadas');
  }

  // Si tiene varias tiendas, el frontend dejará seleccionar, pero por defecto tomamos la principal
  const principalTienda = tiendas.find(t => t.es_principal) || tiendas[0];

  const payload = {
    id_usuario: user.id_usuario,
    nombre: user.nombre,
    usuario: user.usuario,
    rol_app: user.rol_app,
    id_tienda: principalTienda.id_tienda,
    direccion: user.direccion,
    telefono: user.telefono,
    documento_identidad: user.documento_identidad
  };

  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET || 'super_secret_jwt_key_deleite_2026',
    { expiresIn: '24h' }
  );

  return {
    token,
    user: {
      id_usuario: user.id_usuario,
      nombre: user.nombre,
      usuario: user.usuario,
      rol_app: user.rol_app,
      direccion: user.direccion,
      telefono: user.telefono,
      documento_identidad: user.documento_identidad,
      tiendas: tiendas.map(t => ({
        id_tienda: t.id_tienda,
        descripcion: t.descripcion,
        es_principal: t.es_principal
      }))
    }
  };
}

module.exports = {
  login
};
