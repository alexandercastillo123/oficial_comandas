import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Alert, KeyboardAvoidingView, Platform, Switch
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { mesasService } from '../../services/mesas.service';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import { COLORS } from '../../constants/colors';

export default function MesaFormScreen({ route, navigation }) {
  const { mesa, isEdit } = route.params;

  const [numero, setNumero] = useState(mesa?.numero || '');
  const [capacidad, setCapacidad] = useState(mesa?.capacidad?.toString() || '4');
  const [activa, setActiva] = useState(mesa?.estado === true || mesa?.estado === 1 || !isEdit);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const eliminando = useRef(false);

  const validate = () => {
    const errs = {};
    if (!numero.trim()) errs.numero = 'El nombre/número de mesa es obligatorio';
    if (!capacidad || isNaN(parseInt(capacidad)) || parseInt(capacidad) < 1) {
      errs.capacidad = 'La capacidad debe ser un número entero positivo';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleGuardar = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const data = {
        numero: numero.trim(),
        capacidad: parseInt(capacidad, 10),
        estado: activa ? 1 : 0,
      };

      if (isEdit) {
        await mesasService.editarMesa(mesa.id_mesa, data);
      } else {
        await mesasService.crearMesa(data);
      }
      navigation.goBack();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Error al guardar la mesa.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const confirmarEliminar = () => {
    if (eliminando.current) return;
    if (Platform.OS === 'web') {
      if (window.confirm(`¿Eliminar "${numero}" permanentemente?`)) {
        eliminando.current = true;
        ejecutarEliminar();
      }
      return;
    }
    Alert.alert(
      'Eliminar Mesa',
      `¿Eliminar "${numero}"?\n\nEsta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive', onPress: () => {
            eliminando.current = true;
            ejecutarEliminar();
          }
        },
      ]
    );
  };

  const ejecutarEliminar = async () => {
    setLoading(true);
    try {
      await mesasService.eliminarMesa(mesa.id_mesa);
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
        <View style={styles.previewCard}>
          <Text style={styles.previewLabel}>Vista Previa</Text>
          <View style={[styles.previewMesa, { backgroundColor: activa ? '#e8f5e9' : '#eeeeee', borderColor: activa ? '#c8e6c9' : '#bdbdbd' }]}>
            <Text style={styles.previewNumero}>{numero || 'Mesa ?'}</Text>
            <Text style={styles.previewCap}>
              Capacidad: {capacidad || '?'} persona{parseInt(capacidad) !== 1 ? 's' : ''}
            </Text>
            <View style={[styles.previewBadge, { backgroundColor: activa ? '#4CAF50' : '#9e9e9e' }]}>
              <Text style={styles.previewBadgeText}>{activa ? 'ACTIVA' : 'INACTIVA'}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Datos de la Mesa</Text>

        <AppInput
          label="Nombre / Número de Mesa *"
          value={numero}
          onChangeText={setNumero}
          placeholder="Ej: Mesa 1, Barra A, Terraza"
          error={errors.numero}
          autoCapitalize="words"
        />

        <AppInput
          label="Capacidad (personas) *"
          value={capacidad}
          onChangeText={setCapacidad}
          placeholder="Ej: 4"
          keyboardType="numeric"
          maxLength={2}
          error={errors.capacidad}
        />

        {isEdit && (
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Mesa activa (visible para mozos)</Text>
            <Switch
              value={activa}
              onValueChange={setActiva}
              trackColor={{ false: '#bdbdbd', true: '#4CAF50' }}
              thumbColor={activa ? '#4CAF50' : '#9e9e9e'}
            />
          </View>
        )}

        {isEdit && (
          <AppButton
            title="ELIMINAR MESA"
            variant="destructive"
            onPress={confirmarEliminar}
            style={{ marginTop: 12 }}
          />
        )}

        <AppButton
          title={isEdit ? 'GUARDAR CAMBIOS' : 'CREAR MESA'}
          onPress={handleGuardar}
          loading={loading}
          style={{ marginTop: 24 }}
        />

        <AppButton
          title="CANCELAR"
          variant="secondary"
          onPress={() => navigation.goBack()}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgScreen },
  content: { padding: 20, paddingBottom: 100 },
  previewCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 24,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMid,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  previewMesa: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: '70%',
  },
  previewNumero: { fontSize: 22, fontWeight: '800', color: COLORS.textDark },
  previewCap: { fontSize: 12, color: COLORS.textMid, marginTop: 4 },
  previewBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 8,
  },
  previewBadgeText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMid,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  switchLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textDark },
});
