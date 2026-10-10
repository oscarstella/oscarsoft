import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Alert 
} from 'react-native';
import { VoiceService } from '../services/voiceService';

const PRESETS = [
  { name: 'Centro Cívico (Mitre)', km: 0 },
  { name: 'Terminal de Ómnibus', km: 2.8 },
  { name: 'Av. Bustillo Km 4 (Melipal)', km: 4.2 },
  { name: 'Cerro Catedral', km: 17.5 },
  { name: 'Aeropuerto BRC', km: 14.0 },
  { name: 'Llao Llao / Circuito Chico', km: 24.0 }
];

export default function PassengerScreen() {
  const [origin, setOrigin] = useState(PRESETS[0]);
  const [destination, setDestination] = useState(PRESETS[2]);
  const [activeRide, setActiveRide] = useState(null);

  // Cálculo de tarifa
  const distanceKm = Math.abs(destination.km - origin.km) || 4.2;
  const estimatedMins = Math.max(Math.ceil((distanceKm / 32) * 60) + 3, 5);
  const fare = Math.max(1200 + (distanceKm * 650) + (estimatedMins * 120), 2000);
  const roundedFare = Math.round(fare / 50) * 50;

  const handleRequestRide = () => {
    const ride = {
      id: 'ride-demo',
      origin: origin.name,
      destination: destination.name,
      fare: roundedFare,
      status: 'accepted',
      driver: {
        name: 'Carlos Nahuel Huapi',
        car: 'Chevrolet Onix Joy Blanco',
        plate: 'AF 342 BZ',
        rating: 4.95
      }
    };

    setActiveRide(ride);
    VoiceService.notifyDriverAssigned('Carlos', 'Chevrolet Onix blanco', 'AF 342 BZ');
  };

  const handleSimulateArrival = () => {
    VoiceService.notifyDriverAtDoor();
    Alert.alert('🚗 Chofer en la puerta', 'Carlos ha llegado en el Chevrolet Onix blanco.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🚕 Pedir Viaje en Bariloche</Text>
      <Text style={styles.subtitle}>Conectando con choferes locales al mejor precio</Text>

      {activeRide ? (
        <View style={styles.cardActive}>
          <Text style={styles.badgeActive}>● CHOFER ASIGNADO</Text>
          <Text style={styles.driverName}>{activeRide.driver.name}</Text>
          <Text style={styles.carDetails}>{activeRide.driver.car} • {activeRide.driver.plate}</Text>
          <Text style={styles.rating}>⭐ {activeRide.driver.rating} • Tiempo estimado: 4 min</Text>

          <View style={styles.divider} />

          <Text style={styles.routeText}>📍 {activeRide.origin}</Text>
          <Text style={styles.routeText}>🏁 {activeRide.destination}</Text>
          <Text style={styles.fareHighlight}>Total a abonar: ${activeRide.fare} ARS</Text>

          <TouchableOpacity style={styles.btnAction} onPress={handleSimulateArrival}>
            <Text style={styles.btnActionText}>Simular llegada de chofer (Voz AR)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnCancel} onPress={() => setActiveRide(null)}>
            <Text style={styles.btnCancelText}>Cancelar Viaje</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Selector Origen */}
          <Text style={styles.label}>Punto de Recogida (Origen):</Text>
          <View style={styles.chipsRow}>
            {PRESETS.slice(0, 3).map((p, idx) => (
              <TouchableOpacity 
                key={idx} 
                style={[styles.chip, origin.name === p.name && styles.chipActive]}
                onPress={() => setOrigin(p)}
              >
                <Text style={styles.chipText}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Selector Destino */}
          <Text style={styles.label}>Destino:</Text>
          <View style={styles.chipsRow}>
            {PRESETS.slice(2).map((p, idx) => (
              <TouchableOpacity 
                key={idx} 
                style={[styles.chip, destination.name === p.name && styles.chipActive]}
                onPress={() => setDestination(p)}
              >
                <Text style={styles.chipText}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Desglose de Tarifa */}
          <View style={styles.fareBox}>
            <Text style={styles.fareRow}>Distancia: {distanceKm.toFixed(1)} km • {estimatedMins} min</Text>
            <Text style={styles.fareTotal}>Tarifa Estimada: ${roundedFare} ARS</Text>
          </View>

          <TouchableOpacity style={styles.btnPrimary} onPress={handleRequestRide}>
            <Text style={styles.btnPrimaryText}>Solicitar BariGo Ahora</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070d18' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#ffffff', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#94a3b8', marginBottom: 20 },
  label: { fontSize: 13, color: '#06b6d4', fontWeight: 'bold', marginTop: 12, marginBottom: 8 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  chip: { backgroundColor: '#131f37', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#1e293b' },
  chipActive: { borderColor: '#06b6d4', backgroundColor: 'rgba(6,182,212,0.2)' },
  chipText: { color: '#f8fafc', fontSize: 12 },
  fareBox: { backgroundColor: '#0f172a', padding: 16, borderRadius: 12, marginVertical: 18, borderWidth: 1, borderColor: '#1e293b' },
  fareRow: { color: '#94a3b8', fontSize: 13, marginBottom: 4 },
  fareTotal: { color: '#10b981', fontSize: 20, fontWeight: 'bold' },
  btnPrimary: { backgroundColor: '#06b6d4', padding: 16, borderRadius: 30, alignItems: 'center' },
  btnPrimaryText: { color: '#070d18', fontSize: 16, fontWeight: 'bold' },
  cardActive: { backgroundColor: '#0f1e36', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#06b6d4' },
  badgeActive: { color: '#10b981', fontWeight: 'bold', fontSize: 12, marginBottom: 8 },
  driverName: { color: '#ffffff', fontSize: 20, fontWeight: 'bold' },
  carDetails: { color: '#cbd5e1', fontSize: 14, marginVertical: 4 },
  rating: { color: '#fbbf24', fontSize: 13 },
  divider: { height: 1, backgroundColor: '#1e293b', marginVertical: 14 },
  routeText: { color: '#94a3b8', fontSize: 13, marginBottom: 4 },
  fareHighlight: { color: '#06b6d4', fontSize: 18, fontWeight: 'bold', marginTop: 10 },
  btnAction: { backgroundColor: '#10b981', padding: 12, borderRadius: 24, alignItems: 'center', marginTop: 14 },
  btnActionText: { color: '#ffffff', fontWeight: 'bold' },
  btnCancel: { marginTop: 10, padding: 10, alignItems: 'center' },
  btnCancelText: { color: '#ef4444', fontWeight: 'bold' }
});
