import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { asistenciaService } from '../../services/asistencia.service';
import { usuariosService } from '../../services/usuarios.service';
import { COLORS } from '../../constants/colors';

export default function AsistenciaScreen() {
  const { user } = useContext(AuthContext);
  const [filtroRol, setFiltroRol] = useState(null);
  const [asistencias, setAsistencias] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const hoy = new Date().toISOString().slice(0, 10);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [trab, asis] = await Promise.all([
        usuariosService.getTrabajadores(),
        asistenciaService.listarAsistencias(hoy, hoy)
      ]);
      setTrabajadores(trab);
      setAsistencias(asis);
    } catch (err) {
      Alert.alert('Error', 'No se pudo cargar la información de asistencia.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    cargarDatos();
  };

  const trabajadoresFiltrados = filtroRol
    ? trabajadores.filter(t => t.rol_app === filtroRol)
    : trabajadores;

  const asistenciaPorTrabajador = {};
  asistencias.forEach(a => {
    if (!asistenciaPorTrabajador[a.id_usuario]) {
      asistenciaPorTrabajador[a.id_usuario] = [];
    }
    asistenciaPorTrabajador[a.id_usuario].push(a);
  });

  const getObservacionStyle = (obs) => {
    if (!obs) return {};
    const text = obs.toLowerCase();
    if (text.includes('tardanza') || text.includes('antes') || text.includes('temprana')) return { color: '#c62828' };
    if (text.includes('a tiempo') || text.includes('correcta')) return { color: '#2e7d32' };
    return {};
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
      }
    >
      <Text style={styles.title}>Control de Asistencia</Text>
      <Text style={styles.subtitle}>{new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Text>
      <Text style={styles.infoNote}>
        <MaterialCommunityIcons name="information-outline" size={13} color={COLORS.textMid} /> Vista de auditoría — solo lectura
      </Text>

      {/* Filtros rápidos */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, !filtroRol && styles.filterChipActive]}
          onPress={() => setFiltroRol(null)}
        >
          <Text style={[styles.filterText, !filtroRol && styles.filterTextActive]}>Todos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filtroRol === 'MOZO' && styles.filterChipActive]}
          onPress={() => setFiltroRol('MOZO')}
        >
          <Text style={[styles.filterText, filtroRol === 'MOZO' && styles.filterTextActive]}>Mozos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filtroRol === 'CHEF' && styles.filterChipActive]}
          onPress={() => setFiltroRol('CHEF')}
        >
          <Text style={[styles.filterText, filtroRol === 'CHEF' && styles.filterTextActive]}>Chefs</Text>
        </TouchableOpacity>
      </View>

      {trabajadoresFiltrados.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.empty}>No hay trabajadores registrados.</Text>
        </View>
      ) : (
        trabajadoresFiltrados.map(t => {
          const registros = asistenciaPorTrabajador[t.id_usuario] || [];
          const entradaReg = registros.find(r => r.tipo === 'ENTRADA');
          const salidaReg = registros.find(r => r.tipo === 'SALIDA');

          return (
            <View key={t.id_usuario} style={styles.workerCard}>
              <View style={styles.workerHeader}>
                <View style={styles.workerAvatar}>
                  <Text style={styles.workerInitial}>{(t.nombre || 'U').charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.workerName}>{t.nombre}</Text>
                  <Text style={styles.workerRol}>{t.rol_app} · @{t.usuario}</Text>
                </View>
                {/* Indicador de estado */}
                <View style={[
                  styles.statusIndicator,
                  entradaReg && salidaReg ? styles.statusComplete :
                  entradaReg ? styles.statusPartial : styles.statusPending
                ]}>
                  <Text style={styles.statusIndicatorText}>
                    {entradaReg && salidaReg ? '✅ Completo' :
                     entradaReg ? '🕐 En turno' : '⏳ Sin marcar'}
                  </Text>
                </View>
              </View>

              {/* Mostrar Horario Asignado del Trabajador */}
              <View style={styles.shiftBadge}>
                <MaterialCommunityIcons name="clock-outline" size={13} color="#745c00" />
                <Text style={styles.shiftText}>
                  Turno: {t.hora_entrada && t.hora_salida ? `${t.hora_entrada} - ${t.hora_salida} (Tol. ${t.tolerancia_min || 15}m)` : 'Sin turno asignado'}
                </Text>
              </View>

              {/* Resumen de asistencia del día */}
              <View style={styles.attendanceSummary}>
                <View style={styles.attendanceRow}>
                  <MaterialCommunityIcons name="login" size={16} color={entradaReg ? '#2e7d32' : '#bbbbbb'} />
                  <Text style={styles.attendanceLabel}>Entrada:</Text>
                  {entradaReg ? (
                    <>
                      <Text style={styles.attendanceTime}>
                        {new Date(entradaReg.fecha_hora).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                      </Text>
                      {entradaReg.observacion && (
                        <Text style={[styles.attendanceObs, getObservacionStyle(entradaReg.observacion)]}>
                          {entradaReg.observacion}
                        </Text>
                      )}
                    </>
                  ) : (
                    <Text style={styles.attendanceNA}>No registrada</Text>
                  )}
                </View>
                <View style={styles.attendanceRow}>
                  <MaterialCommunityIcons name="logout" size={16} color={salidaReg ? '#1565c0' : '#bbbbbb'} />
                  <Text style={styles.attendanceLabel}>Salida:</Text>
                  {salidaReg ? (
                    <>
                      <Text style={styles.attendanceTime}>
                        {new Date(salidaReg.fecha_hora).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                      </Text>
                      {salidaReg.observacion && (
                        <Text style={[styles.attendanceObs, getObservacionStyle(salidaReg.observacion)]}>
                          {salidaReg.observacion}
                        </Text>
                      )}
                    </>
                  ) : (
                    <Text style={styles.attendanceNA}>No registrada</Text>
                  )}
                </View>
              </View>

              {/* Historial completo del día */}
              {registros.length > 0 && (
                <View style={styles.historyBlock}>
                  <Text style={styles.historyTitle}>Detalle de registros</Text>
                  {registros.map(r => (
                    <View key={r.id_asistencia} style={styles.historyRow}>
                      <View style={[styles.badge, r.tipo === 'ENTRADA' ? styles.badgeIn : styles.badgeOut]}>
                        <Text style={styles.badgeText}>{r.tipo}</Text>
                      </View>
                      <Text style={styles.historyTime}>
                        {new Date(r.fecha_hora).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                      </Text>
                      <Text style={[styles.historyStatus, r.estado === 'VALIDADO' && styles.statusValidado]}>
                        {r.estado}
                      </Text>
                      {r.observacion && (
                        <Text style={[styles.historyObs, getObservacionStyle(r.observacion)]}>
                          {r.observacion}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgScreen },
  content: { padding: 16, paddingBottom: 100 },
  title: { fontSize: 20, fontWeight: '900', color: '#222222', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#745c00', fontWeight: '700', marginBottom: 4 },
  infoNote: { fontSize: 11, color: COLORS.textMid, marginBottom: 16, fontStyle: 'italic' },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e6e1da',
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 12, fontWeight: '700', color: '#666666' },
  filterTextActive: { color: '#ffffff' },
  workerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e6e1da',
  },
  workerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  workerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffdf9d',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#745c00',
  },
  workerInitial: { fontSize: 18, fontWeight: '900', color: '#745c00' },
  workerName: { fontSize: 15, fontWeight: '800', color: '#222222' },
  workerRol: { fontSize: 12, color: '#745c00', fontWeight: '700' },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusComplete: { backgroundColor: '#e8f5e9' },
  statusPartial: { backgroundColor: '#fff8e1' },
  statusPending: { backgroundColor: '#f5f5f5' },
  statusIndicatorText: { fontSize: 10, fontWeight: '700' },
  attendanceSummary: {
    backgroundColor: '#fafaf8',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 4,
  },
  attendanceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  attendanceLabel: { fontSize: 12, fontWeight: '700', color: '#555555', width: 55 },
  attendanceTime: { fontSize: 13, fontWeight: '800', color: '#222222', fontFamily: 'monospace' },
  attendanceNA: { fontSize: 12, color: '#aaaaaa', fontStyle: 'italic' },
  attendanceObs: { fontSize: 11, fontWeight: '700', marginLeft: 4 },
  historyBlock: { marginTop: 8, borderTopWidth: 1, borderTopColor: '#f3efea', paddingTop: 10 },
  historyTitle: { fontSize: 11, fontWeight: '700', color: '#666666', textTransform: 'uppercase', marginBottom: 6 },
  historyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeIn: { backgroundColor: '#e8f5e9' },
  badgeOut: { backgroundColor: '#ffebee' },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#222222' },
  historyTime: { fontSize: 12, fontWeight: '700', color: '#222222', fontFamily: 'monospace' },
  historyStatus: { fontSize: 11, fontWeight: '700', color: '#888888' },
  historyObs: { fontSize: 10, fontWeight: '600' },
  statusValidado: { color: COLORS.success },
  center: { alignItems: 'center', paddingVertical: 40 },
  empty: { fontSize: 14, color: '#888888', fontWeight: '600' },
  shiftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff8e1',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ffe082',
  },
  shiftText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#745c00',
  },
});
