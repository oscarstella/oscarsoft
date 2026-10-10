import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import PassengerScreen from './src/screens/PassengerScreen';
import DriverScreen from './src/screens/DriverScreen';

export default function App() {
  const [role, setRole] = useState('passenger'); // 'passenger' | 'driver'

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#070d18" />

      {/* Selector Superior de Rol (Pasajero / Chofer) */}
      <View style={styles.roleBar}>
        <View style={styles.logoRow}>
          <Text style={styles.logoText}>
            <Text style={{ color: '#06b6d4' }}>Bari</Text>
            <Text style={{ color: '#10b981' }}>Go</Text>
          </Text>
          <Text style={styles.cityTag}>Bariloche</Text>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabBtn, role === 'passenger' && styles.tabBtnActive]} 
            onPress={() => setRole('passenger')}
          >
            <Text style={[styles.tabText, role === 'passenger' && styles.tabTextActive]}>Pasajero</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabBtn, role === 'driver' && styles.tabBtnActive]} 
            onPress={() => setRole('driver')}
          >
            <Text style={[styles.tabText, role === 'driver' && styles.tabTextActive]}>Chofer</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Pantalla Activa */}
      <View style={styles.screenContainer}>
        {role === 'passenger' ? <PassengerScreen /> : <DriverScreen />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#070d18'
  },
  roleBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#070d18'
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  logoText: {
    fontSize: 22,
    fontWeight: 'bold'
  },
  cityTag: {
    fontSize: 11,
    color: '#94a3b8',
    backgroundColor: '#131f37',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  tabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16
  },
  tabBtnActive: {
    backgroundColor: '#06b6d4'
  },
  tabText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 'bold'
  },
  tabTextActive: {
    color: '#070d18'
  },
  screenContainer: {
    flex: 1
  }
});
