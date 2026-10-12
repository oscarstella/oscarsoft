import React, { useState } from 'react';
import { StyleSheet, View, Text, StatusBar, LogBox, TouchableOpacity } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import PassengerScreen from './src/screens/PassengerScreen';
import DriverScreen from './src/screens/DriverScreen';

// Silenciar advertencias de desarrollo y conexión en pantalla móvil (Cannot connect to Metro/Expo CLI)
LogBox.ignoreAllLogs(true);

/**
 * BariGo Bariloche - Aplicación Móvil Oficial
 * Soporta modo Pasajero y modo Chofer en tiempo real.
 */
export default function App() {
  const [activeRole, setActiveRole] = useState('passenger'); // 'passenger' | 'driver'

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor="#070d18" />

        {/* Header Superior Limpio BariGo */}
        <View style={styles.headerBar}>
          <View style={styles.brandRow}>
            <Text style={styles.brandLogo}>
              <Text style={{ color: '#06b6d4' }}>Bari</Text>
              <Text style={{ color: '#10b981' }}>Go</Text>
            </Text>
            <View style={styles.tagBadge}>
              <Text style={styles.tagText}>Bariloche</Text>
            </View>
          </View>

          {/* Selector Rápido de Rol: Pasajero / Chofer para probar con 2 celulares */}
          <View style={styles.roleToggleGroup}>
            <TouchableOpacity 
              style={[styles.roleTab, activeRole === 'passenger' && styles.roleTabActive]} 
              onPress={() => setActiveRole('passenger')}
              activeOpacity={0.7}
            >
              <Text style={[styles.roleTabText, activeRole === 'passenger' && styles.roleTabTextActive]}>👤 Pasajero</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.roleTab, activeRole === 'driver' && styles.roleTabActive]} 
              onPress={() => setActiveRole('driver')}
              activeOpacity={0.7}
            >
              <Text style={[styles.roleTabText, activeRole === 'driver' && styles.roleTabTextActive]}>🚗 Chofer</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pantalla Activa según Rol */}
        <View style={styles.screenBody}>
          {activeRole === 'passenger' ? <PassengerScreen /> : <DriverScreen />}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#070d18'
  },
  headerBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#070d18',
    zIndex: 10
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  brandLogo: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  tagBadge: {
    backgroundColor: '#131f37',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  tagText: {
    fontSize: 10,
    color: '#38bdf8',
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  cityStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  livePulse: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10b981'
  },
  cityStatusText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600'
  },
  roleToggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  roleTab: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16
  },
  roleTabActive: {
    backgroundColor: '#1e293b'
  },
  roleTabText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600'
  },
  roleTabTextActive: {
    color: '#38bdf8',
    fontWeight: '700'
  },
  screenBody: {
    flex: 1
  }
});
