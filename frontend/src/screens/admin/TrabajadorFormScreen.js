import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Alert, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usuariosService } from '../../services/usuarios.service';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import { COLORS } from '../../constants/colors';

const CARGOS_APP = [
  { id_cargo: 1, descripcion: 'Administrador', rol_app: 'ADMIN' },
  { id_cargo: 4, descripcion: 'Chef', rol_app: 'CHEF' },
  { id_cargo: 14, descripcion: 'Mozo', rol_app: 'MOZO' },
];

export default function TrabajadorFormScreen({ route, navigation }) {
  const { trabajador, isEdit } = route.params;

  const [nombre, setNombre] = useState(trabajador?.nombre || '');
  const [usuario, setUsuario] = useState(trabajador?.usuario || '');
  const [telefono, setTelefono] = useState(trabajador?.telefono || '');
  const [documento, setDocumento] = useState(trabajador?.documento_identidad || '');
  const [clave, setClave] = useState('');
  const [idCargo, setIdCargo] = useState(trabajador?.id_cargo || CARGOS_APP[0].id_cargo);
  const [horaEntrada, setHoraEntrada] = useState(trabajador?.hora_entrada || '08:00');
  const [horaSalida, setHoraSalida] = useState(trabajador?.hora_salida || '18:00');
  const [tolerancia, setTolerancia] = useState(String(trabajador?.tolerancia_min ?? '15'));
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const eliminando = useRef(false);

  // En modo edición, cargar datos completos del trabajador (incluye turno)
  useEffect(() => {
    if (isEdit && trabajador?.id_usuario) {
      setLoadingData(true);
      usuariosService.getTrabajador(trabajador.id_usuario)
        .then(data => {
          if (data) {
            setNombre(data.nombre || '');
            setUsuario(data.usuario || '');
            setTelefono(data.telefono || '');
            setDocumento(data.documento_identidad || '');
            setIdCargo(data.id_cargo || CARGOS_APP[0].id_cargo);
            if (data.hora_entrada) setHoraEntrada(data.hora_entrada);
            if (data.hora_salida) setHoraSalida(data.hora_salida);
            if (data.tolerancia_min !== undefined && data.tolerancia_min !== null) {
              setTolerancia(String(data.tolerancia_min));
            }
          }
        })
        .catch(err => {
          console.log('Error al cargar datos completos del trabajador:', err);
        })
        .finally(() => setLoadingData(false));
    }
  }, []);

  const handleGuardar = async () => {
    if (!nombre.trim() || !usuario.trim()) {
      Alert.alert('Campos requeridos', 'El nombre y usuario son obligatorios.');
      return;
    }

    if (!isEdit && !clave.trim()) {
      Alert.alert('Contraseña requerida', 'Ingresa una contraseña para el nuevo trabajador.');
      return;
    }

    setLoading(true);
    try {
      const data = {
        nombre: nombre.trim(),
        usuario: usuario.trim().toUpperCase(),
        telefono: telefono.trim() || null,
        documento_identidad: documento.trim() || null,
        id_cargo: idCargo,
        ...(clave.trim() && { clave: clave.trim() }),
        hora_entrada: horaEntrada,
        hora_salida: horaSalida,
        tolerancia_min: parseInt(tolerancia || '15', 10)
      };

      if (isEdit) {
        await usuariosService.editarTrabajador(trabajador.id_usuario, data);
      } else {
        await usuariosService.crearTrabajador(data);
      }
      navigation.goBack();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Error al guardar.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const confirmarEliminar = () => {
    if (eliminando.current) return;
    if (Platform.OS === 'web') {
      if (window.confirm(`¿Eliminar a "${trabajador.nombre}" permanentemente?`)) {
        eliminando.current = true;
        ejecutarEliminar();
      }
      return;
    }
    Alert.alert(
      'Eliminar Trabajador',
      `¿Eliminar a "${trabajador.nombre}"?\n\nEsta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => {
          eliminando.current = true;
          ejecutarEliminar();
        }},
      ]
    );
  };

  const ejecutarEliminar = async () => {
    setLoading(true);
    try {
      await usuariosService.eliminarTrabajador(trabajador.id_usuario);
      navigation.goBack();
    } catch (err) {
      const msg = err?.response?.data?.error?.message || err?.message || 'No se pudo eliminar.';
      Alert.alert('Error', msg);
      eliminando.current = false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      style={{ flex: 1, backgroundColor: COLORS.bgScreen }}
    >
      <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.content, { flexGrow: 1 }]} keyboardShouldPersistTaps="handled">
        {loadingData ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={{ marginTop: 12, color: COLORS.textMid, fontSize: 13 }}>Cargando datos del trabajador...</Text>
          </View>
        ) : (
        <>
        <Text style={styles.sectionTitle}>Datos del Trabajador</Text>

        <AppInput
          label="Nombre Completo *"
          value={nombre}
          onChangeText={setNombre}
          placeholder="Ej: Juan Pérez Ramírez"
          autoCapitalize="words"
        />
        <AppInput
          label="Nombre de Usuario *"
          value={usuario}
          onChangeText={setUsuario}
          placeholder="Ej: JUAN.PEREZ"
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <AppInput
          label="Teléfono"
          value={telefono}
          onChangeText={setTelefono}
          placeholder="Ej: 999 888 777"
          keyboardType="phone-pad"
        />
        <AppInput
          label="DNI / Documento"
          value={documento}
          onChangeText={setDocumento}
          placeholder="Ej: 45678912"
          keyboardType="numeric"
          maxLength={12}
        />
        <AppInput
          label={isEdit ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}
          value={clave}
          onChangeText={setClave}
          secureTextEntry
          placeholder="Mínimo 6 caracteres"
        />

        <Text style={styles.sectionTitle}>Cargo en la App</Text>
        <View style={styles.cargoContainer}>
          {CARGOS_APP.map(cargo => (
            <View
              key={cargo.id_cargo}
              style={[styles.cargoOption, idCargo === cargo.id_cargo && styles.cargoOptionActive]}
            >
              <Text
                style={[styles.cargoText, idCargo === cargo.id_cargo && styles.cargoTextActive]}
                onPress={() => setIdCargo(cargo.id_cargo)}
              >
                {cargo.descripcion}
              </Text>
              <Text style={styles.cargoRol}>{cargo.rol_app}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Turno de Trabajo</Text>
        <View style={styles.rowTurno}>
          <View style={{ flex: 1 }}>
            <AppInput
              label="Hora Entrada (HH:MM)"
              value={horaEntrada}
              onChangeText={setHoraEntrada}
              placeholder="08:00"
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <AppInput
              label="Hora Salida (HH:MM)"
              value={horaSalida}
              onChangeText={setHoraSalida}
              placeholder="18:00"
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
          </View>
        </View>
        <AppInput
          label="Tolerancia (min)"
          value={tolerancia}
          onChangeText={setTolerancia}
          placeholder="15"
          keyboardType="numeric"
          maxLength={3}
        />

        {isEdit && (
          <AppButton
            title="ELIMINAR TRABAJADOR"
            variant="destructive"
            onPress={confirmarEliminar}
            style={{ marginTop: 12 }}
          />
        )}

        <AppButton
          title={isEdit ? 'GUARDAR CAMBIOS' : 'CREAR TRABAJADOR'}
          onPress={handleGuardar}
          loading={loading}
          style={{ marginTop: 24 }}
        />

        {isEdit && (
          <AppButton
            title="CANCELAR"
            variant="secondary"
            onPress={() => navigation.goBack()}
          />
        )}
        </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgScreen },
  content: { padding: 20, paddingBottom: 100 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMid,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 10,
  },
  cargoContainer: { gap: 8 },
  cargoOption: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cargoOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceContainerLow,
  },
  cargoText: { fontSize: 15, fontWeight: '700', color: COLORS.textDark },
  cargoTextActive: { color: COLORS.primary },
  cargoRol: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMid,
    textTransform: 'uppercase',
  },
  rowTurno: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
