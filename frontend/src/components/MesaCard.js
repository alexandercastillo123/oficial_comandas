import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useResponsive } from '../hooks/useResponsive';

export default function MesaCard({ numero, capacidad, estado_mesa, comandas_activas, onPress }) {
  const { isTablet } = useResponsive();
  
  let leftBorderColor = COLORS.success;
  let statusText = 'Disponible';
  let badgeBg = '#e8f5e9';
  let badgeTextColor = COLORS.success;
  let dotColor = COLORS.success;

  if (estado_mesa === 'OCUPADA') {
    leftBorderColor = COLORS.warning;
    statusText = 'Ocupada';
    badgeBg = COLORS.secondaryFixed;
    badgeTextColor = COLORS.onSecondaryFixed;
    dotColor = COLORS.warning;
  } else if (estado_mesa === 'PRE_CUENTA') {
    leftBorderColor = COLORS.info;
    statusText = 'Pre-cuenta';
    badgeBg = '#e1f5fe';
    badgeTextColor = COLORS.info;
    dotColor = COLORS.info;
  }

  return (
    <TouchableOpacity 
      style={[styles.card, { borderLeftColor: leftBorderColor }, isTablet && styles.cardTablet]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{numero}</Text>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
      </View>
      
      <View style={styles.middle}>
        <MaterialCommunityIcons name="account-group" size={16} color={COLORS.textMid} />
        <Text style={styles.infoText}>{capacidad} Personas</Text>
      </View>
      
      <View style={styles.footer}>
        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.badgeText, { color: badgeTextColor }]}>{statusText}</Text>
        </View>
        {comandas_activas > 0 && (
          <View style={styles.ticketBadge}>
            <MaterialCommunityIcons name="printer" size={14} color={COLORS.textMid} />
            <Text style={styles.ticketText}>{comandas_activas} Tkt</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 6,
    padding: 14,
    borderRadius: 16,
    minHeight: 120,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderLeftWidth: 4,
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardTablet: {
    minHeight: 140,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.primary,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  middle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 4,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.textMid,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  ticketBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff8f5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  ticketText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMid,
  },
});
