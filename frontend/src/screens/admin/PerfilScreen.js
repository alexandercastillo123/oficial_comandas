import React, { useContext, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Alert, KeyboardAvoidingView, Platform, Modal, TouchableOpacity
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { usuariosService } from '../../services/usuarios.service';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import { COLORS } from '../../constants/colors';

export default function PerfilScreen() {
  const { user, logout } = useContext(AuthContext);

  const [nombre, setNombre] = useState(user?.nombre || '');
  const [telefono, setTelefono] = useState(user?.telefono || '');
  const [direccion, setDireccion] = useState(user?.direccion || '');
  const [claveNueva, setClaveNueva] = useState('');
  const [loading, setLoading] = useState(false);

  const [showEditPerfil, setShowEditPerfil] = useState(false);
  const [showEditClave, setShowEditClave] = useState(false);

  const tiendaActiva = user?.tiendas?.find(t => t.es_principal) || user?.tiendas?.[0];

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
      Alert.alert('✅ Contraseña Cambiada', 'Tu contraseña fue actualizada correctamente.');
      setShowEditClave(false);
    } catch {
      Alert.alert('Error', 'No se pudo cambiar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirm = window.confirm('¿Estás seguro de que quieres salir?');
      if (confirm) logout();
    } else {
      Alert.alert(
        'Cerrar Sesión',
        '¿Estás seguro de que quieres salir?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Cerrar Sesión', style: 'destructive', onPress: logout }
        ]
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{(user?.nombre || 'A').charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.userName}>{nombre}</Text>
          <View style={styles.rolBadge}>
            <Text style={styles.rolBadgeText}>{user?.rol_app}</Text>
          </View>
          <Text style={styles.userUsername}>@{user?.usuario}</Text>
          {tiendaActiva && (
            <Text style={styles.userStore}>{tiendaActiva.descripcion}</Text>
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
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e6e1da',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffdf9d',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#745c00',
  },
  avatarInitial: { fontSize: 34, fontWeight: '900', color: '#745c00' },
  userName: { fontSize: 18, fontWeight: '900', color: '#222222', textAlign: 'center' },
  rolBadge: {
    backgroundColor: '#745c00',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  rolBadgeText: { color: '#ffffff', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  userUsername: { fontSize: 13, color: '#888888', marginTop: 4 },
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
});
