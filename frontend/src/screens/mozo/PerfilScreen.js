import React, { useContext, useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Alert, KeyboardAvoidingView, Platform, Modal, TouchableOpacity
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { usuariosService } from '../../services/usuarios.service';
import { asistenciaService } from '../../services/asistencia.service';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import { COLORS } from '../../constants/colors';
import { formatTime } from '../../utils/formatDate';

function QrGrid({ data, size = 180 }) {
  const gridSize = 21;
  const cellSize = size / gridSize;

  const getHashValue = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  };

  const seed = getHashValue(data || 'default');

  const getFinderCellColor = (r, c) => {
    if (r === 0 || r === 6 || c === 0 || c === 6) return true; // Borde negro
    if (r === 1 || r === 5 || c === 1 || c === 5) return false; // Anillo blanco
    return true; // Centro negro
  };

  const renderCell = (r, c) => {
    const isTopLeftFinder = r < 7 && c < 7;
    const isTopRightFinder = r < 7 && c >= gridSize - 7;
    const isBottomLeftFinder = r >= gridSize - 7 && c < 7;

    let isFilled = false;
    if (isTopLeftFinder) {
      isFilled = getFinderCellColor(r, c);
    } else if (isTopRightFinder) {
      isFilled = getFinderCellColor(r, c - (gridSize - 7));
    } else if (isBottomLeftFinder) {
      isFilled = getFinderCellColor(r - (gridSize - 7), c);
    } else {
      // Determinar relleno pseudoaleatorio determinista basado en el hash
      const val = (seed * (r + 1) * (c + 1) + (r * 13) + (c * 37)) % 100;
      isFilled = val < 45; // 45% de densidad
    }

    return (
      <View
        key={`${r}-${c}`}
        style={{
          width: cellSize,
          height: cellSize,
          backgroundColor: isFilled ? '#32170d' : '#ffffff',
        }}
      />
    );
  };

  const cells = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      cells.push(renderCell(r, c));
    }
  }

  return (
    <View style={[styles.qrWrapper, { width: size, height: size, flexWrap: 'wrap', flexDirection: 'row' }]}>
      {cells}
    </View>
  );
}

export default function PerfilScreen() {
  const { user, logout } = useContext(AuthContext);

  const [nombre, setNombre] = useState(user?.nombre || '');
  const [telefono, setTelefono] = useState(user?.telefono || '');
  const [direccion, setDireccion] = useState(user?.direccion || '');
  const [claveNueva, setClaveNueva] = useState('');
  const [loading, setLoading] = useState(false);

  const [showEditPerfil, setShowEditPerfil] = useState(false);
  const [showEditClave, setShowEditClave] = useState(false);
  const [showAsistencia, setShowAsistencia] = useState(false);

  const [tipoMarca, setTipoMarca] = useState('ENTRADA');
  const [qrData, setQrData] = useState(null);
  const [countdown, setCountdown] = useState(10);
  const [marcando, setMarcando] = useState(false);
  const [tokenActual, setTokenActual] = useState('');
  const [estadoAsistencia, setEstadoAsistencia] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const countdownRef = useRef(null);

  const tiendaActiva = user?.tiendas?.find(t => t.es_principal) || user?.tiendas?.[0];

  useEffect(() => {
    // Reloj digital en tiempo real
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Cargar estado de la asistencia
    loadEstadoAsistencia();

    return () => {
      clearInterval(clockTimer);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const loadEstadoAsistencia = async () => {
    try {
      const data = await asistenciaService.obtenerEstadoHoy();
      setEstadoAsistencia(data);
    } catch (err) {
      console.log('Error al obtener estado de asistencia diaria:', err);
    }
  };

  const handleGuardarPerfil = async () => {
    if (!nombre.trim()) {
      Alert.alert('Campo requerido', 'El nombre no puede estar vacío.');
      return;
    }
    setLoading(true);
    try {
      await usuariosService.actualizarPerfil(user.id_usuario, { nombre, telefono, direccion, documento_identidad: user?.documento_identidad });
      Alert.alert('✅ Perfil Actualizado', 'Tus datos fueron guardados correctamente.');
      setShowEditPerfil(false);
    } catch (err) {
      Alert.alert('Error', 'No se pudo actualizar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarClave = async () => {
    if (!claveNueva || claveNueva.length < 6) {
      Alert.alert('Contraseña Inválida', 'Ingresa una clave de al menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await usuariosService.actualizarClave(user.id_usuario, claveNueva);
      setClaveNueva('');
      Alert.alert('✅ Contraseña Cambiada', 'Tu contraseña fue actualizada.');
      setShowEditClave(false);
    } catch {
      Alert.alert('Error', 'No se pudo cambiar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirm = window.confirm('¿Estás seguro que deseas salir?');
      if (confirm) logout();
    } else {
      Alert.alert(
        'Cerrar Sesión',
        '¿Estás seguro que deseas salir?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Salir', style: 'destructive', onPress: logout }
        ]
      );
    }
  };

  const abrirAsistencia = async (tipo) => {
    setTipoMarca(tipo);
    setMarcando(false);
    setLoading(true);
    try {
      const qr = await asistenciaService.generarQr(tipo);
      setQrData(qr);
      setTokenActual(qr.token);
      setCountdown(qr.expires_in || 10);
      setShowAsistencia(true);
      startCountdown();
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message || 'No se pudo iniciar el marcado.';
      Alert.alert('Restricción de Asistencia', msg);
    } finally {
      setLoading(false);
    }
  };

  const startCountdown = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const refrescarQr = async () => {
    setLoading(true);
    try {
      const qr = await asistenciaService.generarQr(tipoMarca);
      setQrData(qr);
      setTokenActual(qr.token);
      setCountdown(qr.expires_in || 10);
      startCountdown();
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message || 'No se pudo refrescar el código.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const confirmarAsistencia = async () => {
    if (!tokenActual || countdown <= 0) {
      Alert.alert('Código expirado', 'Por favor, actualiza el código para continuar.');
      return;
    }
    setMarcando(true);
    try {
      const res = await asistenciaService.validarQr(tokenActual);
      if (res.valido) {
        Alert.alert('✅ Asistencia Registrada', `${tipoMarca === 'ENTRADA' ? 'Entrada' : 'Salida'} marcada correctamente.`);
        setShowAsistencia(false);
        setQrData(null);
        setTokenActual('');
        await loadEstadoAsistencia();
      } else {
        Alert.alert('Error', res.motivo || 'No se pudo registrar la asistencia.');
      }
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'No se pudo registrar la asistencia.';
      Alert.alert('Error', msg);
    } finally {
      setMarcando(false);
    }
  };

  const formatDigitalClock = (date) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };

  const formatDateString = (date) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-PE', options);
  };



  const entradaMarcada = estadoAsistencia?.entradaMarcada;
  const salidaMarcada = estadoAsistencia?.salidaMarcada;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>
              {(user?.nombre || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{nombre}</Text>
          <Text style={styles.userRole}>{user?.rol_app}</Text>
          <Text style={styles.userUsername}>@{user?.usuario}</Text>
          {tiendaActiva && (
            <Text style={styles.userStore}>{tiendaActiva.descripcion}</Text>
          )}
        </View>

        {/* Reloj y Fecha (Estilo Bento) */}
        <View style={styles.clockSection}>
          <Text style={styles.digitalClock}>{formatDigitalClock(currentTime)}</Text>
          <Text style={styles.currentDate}>{formatDateString(currentTime)}</Text>
        </View>

        {/* Sección de Horario Asignado */}
        {estadoAsistencia?.turno ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Horario de Trabajo</Text>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="clock-outline" size={20} color={COLORS.textMid} />
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Turno Asignado</Text>
                <Text style={styles.infoValue}>
                  {formatTime(estadoAsistencia.turno.hora_entrada)} - {formatTime(estadoAsistencia.turno.hora_salida)}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="timer-sand" size={20} color={COLORS.textMid} />
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Tolerancia de Entrada</Text>
                <Text style={styles.infoValue}>{estadoAsistencia.turno.tolerancia_min} minutos</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Horario de Trabajo</Text>
            <Text style={styles.noTurnoText}>Sin turno de trabajo asignado hoy. Contacte a soporte.</Text>
          </View>
        )}

        {/* Sección de Control de Asistencia */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Control de Asistencia</Text>
          {entradaMarcada && salidaMarcada ? (
            <View style={styles.assistCompletedCard}>
              <MaterialCommunityIcons name="check-decagram" size={28} color={COLORS.success} />
              <Text style={styles.assistCompletedText}>Asistencia Completada Hoy</Text>
              <View style={styles.timeMarkedContainer}>
                <View style={styles.timeMarkedRow}>
                  <Text style={styles.timeMarkedLabel}>Entrada:</Text>
                  <Text style={styles.timeMarkedValue}>
                    {estadoAsistencia.entrada ? new Date(estadoAsistencia.entrada.fecha_hora).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </Text>
                </View>
                <View style={styles.timeMarkedRow}>
                  <Text style={styles.timeMarkedLabel}>Salida:</Text>
                  <Text style={styles.timeMarkedValue}>
                    {estadoAsistencia.salida ? new Date(estadoAsistencia.salida.fecha_hora).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.assistRow}>
              {!entradaMarcada && (
                <AppButton
                  title="MARCAR ENTRADA"
                  icon="login"
                  onPress={() => abrirAsistencia('ENTRADA')}
                  style={{ flex: 1 }}
                  loading={loading}
                />
              )}
              {entradaMarcada && !salidaMarcada && (
                <AppButton
                  title="MARCAR SALIDA"
                  icon="logout"
                  variant="secondary"
                  onPress={() => abrirAsistencia('SALIDA')}
                  style={{ flex: 1 }}
                  loading={loading}
                />
              )}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos Personales</Text>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="account-outline" size={20} color={COLORS.textMid} />
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Nombre</Text>
              <Text style={styles.infoValue}>{nombre}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="phone-outline" size={20} color={COLORS.textMid} />
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Teléfono</Text>
              <Text style={styles.infoValue}>{telefono || 'No registrado'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="card-account-details-outline" size={20} color={COLORS.textMid} />
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>DNI</Text>
              <Text style={styles.infoValue}>{user?.documento_identidad || 'No registrado'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={20} color={COLORS.textMid} />
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Dirección</Text>
              <Text style={styles.infoValue}>{user?.direccion || 'No registrada'}</Text>
            </View>
          </View>

          <AppButton title="EDITAR DATOS" variant="secondary" onPress={() => setShowEditPerfil(true)} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seguridad</Text>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.textMid} />
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Contraseña</Text>
              <Text style={styles.infoValue}>••••••••••••</Text>
            </View>
          </View>
          <AppButton title="CAMBIAR CONTRASEÑA" variant="secondary" onPress={() => setShowEditClave(true)} />
        </View>

        <AppButton title="CERRAR SESIÓN" variant="destructive" onPress={handleLogout} />
      </ScrollView>

      <Modal visible={showAsistencia} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{tipoMarca === 'ENTRADA' ? 'Marcar Entrada' : 'Marcar Salida'}</Text>

            {qrData && (
              <View style={styles.qrContainer}>
                <View style={styles.qrBox}>
                  <QrGrid data={tokenActual} size={180} />
                </View>
                <View style={styles.timerContainer}>
                  <View style={styles.timerBarOuter}>
                    <View style={[styles.timerBarInner, { width: `${(countdown / 10) * 100}%` }]} />
                  </View>
                  <Text style={styles.countdownText}>
                    Código válido por <Text style={styles.countdownNumber}>{countdown}</Text>s
                  </Text>
                </View>
                <TouchableOpacity onPress={refrescarQr} style={styles.refreshRow}>
                  <MaterialCommunityIcons name="refresh" size={18} color={COLORS.primary} />
                  <Text style={styles.refreshText}>Actualizar código</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={{ marginTop: 20 }}>
              <AppButton
                title={marcando ? 'Registrando...' : 'CONFIRMAR ASISTENCIA'}
                onPress={confirmarAsistencia}
                loading={marcando}
              />
            </View>

            <AppButton
              title="CANCELAR"
              variant="secondary"
              onPress={() => {
                setShowAsistencia(false);
                setQrData(null);
                setTokenActual('');
              }}
              style={{ marginTop: 10 }}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={showEditPerfil} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Datos Personales</Text>

            <AppInput label="Nombre Completo" value={nombre} onChangeText={setNombre} autoCapitalize="words" />
            <AppInput label="Teléfono" value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />
            <AppInput label="DNI" value={user?.documento_identidad || ''} editable={false} />
            <AppInput label="Dirección" value={direccion} onChangeText={setDireccion} />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setNombre(user?.nombre || '');
                  setTelefono(user?.telefono || '');
                  setDireccion(user?.direccion || '');
                  setShowEditPerfil(false);
                }}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleGuardarPerfil} disabled={loading}>
                <Text style={styles.saveBtnText}>{loading ? 'Guardando...' : 'Guardar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showEditClave} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cambiar Contraseña</Text>

            <AppInput label="Nueva Contraseña" value={claveNueva} onChangeText={setClaveNueva} secureTextEntry placeholder="Mínimo 6 caracteres" />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setClaveNueva('');
                  setShowEditClave(false);
                }}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleCambiarClave} disabled={loading}>
                <Text style={styles.saveBtnText}>{loading ? 'Actualizando...' : 'Actualizar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgScreen },
  content: { padding: 20, paddingBottom: 40 },
  profileCard: {
    alignItems: 'center',
    marginBottom: 28,
    paddingVertical: 24,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e6e1da',
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ffdf9d',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 3,
    borderColor: '#745c00',
  },
  avatarInitial: { fontSize: 30, fontWeight: '900', color: '#745c00' },
  userName: { fontSize: 18, fontWeight: '800', color: '#222222', textAlign: 'center' },
  userRole: {
    fontSize: 12,
    fontWeight: '700',
    color: '#745c00',
    backgroundColor: '#ffdf9d',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  userUsername: { fontSize: 12, color: '#888888', marginTop: 4 },
  userStore: { fontSize: 12, color: '#745c00', fontWeight: '700', marginTop: 4 },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e6e1da',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#888888',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    color: '#222222',
    fontWeight: '700',
    marginTop: 2,
  },
  assistRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#222222',
    marginBottom: 18,
    textAlign: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  qrBox: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e6e1da',
  },
  qrWrapper: {
    overflow: 'hidden',
  },
  countdownText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#745c00',
  },
  countdownNumber: {
    fontWeight: '900',
    fontSize: 15,
  },
  refreshRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
  },
  refreshText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 18,
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  cancelBtnText: {
    color: COLORS.error,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  clockSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e6e1da',
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitalClock: {
    fontSize: 32,
    fontWeight: '800',
    color: '#32170d',
    letterSpacing: 1,
  },
  currentDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  noTurnoText: {
    fontSize: 13,
    color: '#ba1a1a',
    fontWeight: '600',
    textAlign: 'center',
  },
  assistCompletedCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  assistCompletedText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4A7C59',
    marginTop: 6,
  },
  timeMarkedContainer: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 16,
  },
  timeMarkedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeMarkedLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '600',
  },
  timeMarkedValue: {
    fontSize: 13,
    color: '#222222',
    fontWeight: '700',
  },
  timerContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 14,
  },
  timerBarOuter: {
    width: 180,
    height: 6,
    backgroundColor: '#f3efea',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  timerBarInner: {
    height: '100%',
    backgroundColor: '#735c00',
    borderRadius: 3,
  },
});
