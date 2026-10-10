import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Switch, 
  Alert 
} from 'react-native';
import { VoiceService } from '../services/voiceService';

export default function DriverScreen() {
  const [isOnline, setIsOnline] = useState(true);
  const [hasPass24h, setHasPass24h] = useState(true);
  const [hoursLeft, setHoursLeft] = useState(21);
  const [incomingOffer, setIncomingOffer] = useState(null);
  const [currentTrip, setCurrentTrip] = useState(null);

  // Simular viaje entrante
  const handleTriggerSimulatedRide = () => {
    if (!hasPass24h) {
      Alert.alert('Pase Requerido', 'Debes activar tu Pase de 24hs para recibir viajes.');
      return;
    }

    const offer = {
      id: 'ride-992',
      passenger: 'Martina',
      origin: 'Av. Bustillo Km 4 (Melipal)',
      destination: 'Centro Cívico (Mitre)',
      fare: 3900,
      distanceKm: 4.2
    };

    setIncomingOffer(offer);
    VoiceService.notifyNewRideDriver(offer.origin, offer.fare);
  };

  const handleAccept = () => {
    setCurrentTrip(incomingOffer);
    setIncomingOffer(null);
    Alert.alert('✅ Viaje Aceptado', 'Navega hacia el punto de recogida.');
  };

  const handleArrived = () => {
    VoiceService.notifyDriverArrived();
    Alert.alert('🚗 Llegaste al punto', 'Avisamos al pasajero que estás en la puerta.');
  };

  const handleStartTrip = () => {
    VoiceService.notifyTripStarted(currentTrip.destination);
    Alert.alert('🏁 Viaje Iniciado', 'Conduce con precaución hacia el destino.');
  };

  const handleCompleteTrip = () => {
    VoiceService.notifyTripCompleted(currentTrip.fare);
    Alert.alert('💰 Viaje Finalizado', `Cobrar al pasajero: $${currentTrip.fare} ARS en efectivo.`);
    setCurrentTrip(null);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🚗 Portal Chofer BariGo</Text>
      <Text style={styles.subtitle}>San Carlos de Bariloche • 0% Comisiones</Text>

      {/* Tarjeta de Pase 24 Horas */}
      <View style={styles.passCard}>
        <View>
          <Text style={styles.passLabel}>Pase Diario de Conducción</Text>
          <Text style={[styles.passStatus, { color: hasPass24h ? '#10b981' : '#ef4444' }]}>
            {hasPass24h ? `● ACTIVO (Vence en ${hoursLeft}h)` : '● INACTIVO'}
          </Text>
        </View>
        {!hasPass24h ? (
          <TouchableOpacity 
            style={styles.btnBuyPass} 
            onPress={() => { setHasPass24h(true); setHoursLeft(24); }}
          >
            <Text style={styles.btnBuyPassText}>Pagar $4.500</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.passPrice}>$4.500 ARS</Text>
        )}
      </View>

      {/* Switch Online/Offline */}
      <View style={styles.switchRow}>
        <View>
          <Text style={styles.switchTitle}>Radar de Chofer</Text>
          <Text style={styles.switchDesc}>{isOnline ? 'Conectado y visible' : 'Desconectado'}</Text>
        </View>
        <Switch 
          value={isOnline} 
          onValueChange={setIsOnline} 
          trackColor={{ false: '#334155', true: '#06b6d4' }}
        />
      </View>

      {/* Viaje activo del chofer */}
      {currentTrip ? (
        <View style={styles.tripCard}>
          <Text style={styles.tripTitle}>🚕 VIAJE EN CURSO</Text>
          <Text style={styles.tripPassenger}>Pasajero: {currentTrip.passenger}</Text>
          <Text style={styles.tripRoute}>📍 Origen: {currentTrip.origin}</Text>
          <Text style={styles.tripRoute}>🏁 Destino: {currentTrip.destination}</Text>
          <Text style={styles.tripFare}>Cobro total: ${currentTrip.fare} ARS</Text>

          <TouchableOpacity style={styles.btnStep} onPress={handleArrived}>
            <Text style={styles.btnStepText}>1. Llegué al Pasajero (Voz AR)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btnStep, { backgroundColor: '#3b82f6' }]} onPress={handleStartTrip}>
            <Text style={styles.btnStepText}>2. Iniciar Viaje (Voz AR)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btnStep, { backgroundColor: '#10b981' }]} onPress={handleCompleteTrip}>
            <Text style={styles.btnStepText}>3. Finalizar y Cobrar (Voz AR)</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Oferta entrante simulada */}
          {incomingOffer && (
            <View style={styles.offerCard}>
              <Text style={styles.offerBadge}>🚨 ¡NUEVA SOLICITUD DE VIAJE!</Text>
              <Text style={styles.offerText}>📍 {incomingOffer.origin}</Text>
              <Text style={styles.offerText}>🏁 {incomingOffer.destination}</Text>
              <Text style={styles.offerFare}>Tarifa Neta: ${incomingOffer.fare} ARS</Text>

              <TouchableOpacity style={styles.btnAccept} onPress={handleAccept}>
                <Text style={styles.btnAcceptText}>Aceptar Viaje Ahora</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.btnSimulate} onPress={handleTriggerSimulatedRide}>
            <Text style={styles.btnSimulateText}>🔊 Probar Alerta de Viaje Entrante (Voz Argentina)</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Vehículo Habilitado */}
      <View style={styles.vehicleInfo}>
        <Text style={styles.vehicleTitle}>Vehículo Verificado:</Text>
        <Text style={styles.vehicleText}>• Chevrolet Onix Joy Blanco (AF 342 BZ)</Text>
        <Text style={styles.vehicleText}>• Cadenas para Nieve: Verificado ✅</Text>
        <Text style={styles.vehicleText}>• Seguro y RTO Río Negro: Al día ✅</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070d18' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#ffffff', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#94a3b8', marginBottom: 18 },
  passCard: { backgroundColor: '#0f172a', padding: 16, borderRadius: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#1e293b', marginBottom: 14 },
  passLabel: { fontSize: 12, color: '#94a3b8', textTransform: 'uppercase' },
  passStatus: { fontSize: 14, fontWeight: 'bold', marginTop: 4 },
  passPrice: { fontSize: 18, fontWeight: 'bold', color: '#10b981' },
  btnBuyPass: { backgroundColor: '#10b981', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  btnBuyPassText: { color: '#070d18', fontWeight: 'bold' },
  switchRow: { backgroundColor: '#0f172a', padding: 16, borderRadius: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  switchTitle: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' },
  switchDesc: { fontSize: 12, color: '#94a3b8' },
  btnSimulate: { backgroundColor: '#1e293b', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#06b6d4', alignItems: 'center', marginVertical: 14 },
  btnSimulateText: { color: '#06b6d4', fontWeight: 'bold', fontSize: 14 },
  offerCard: { backgroundColor: 'rgba(6,182,212,0.15)', borderWidth: 1, borderColor: '#06b6d4', padding: 18, borderRadius: 14, marginBottom: 14 },
  offerBadge: { color: '#38bdf8', fontWeight: 'bold', marginBottom: 8 },
  offerText: { color: '#ffffff', fontSize: 14, marginBottom: 4 },
  offerFare: { color: '#10b981', fontSize: 20, fontWeight: 'bold', marginVertical: 8 },
  btnAccept: { backgroundColor: '#10b981', padding: 14, borderRadius: 24, alignItems: 'center' },
  btnAcceptText: { color: '#070d18', fontWeight: 'bold', fontSize: 16 },
  tripCard: { backgroundColor: '#0f243a', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#10b981', marginBottom: 16 },
  tripTitle: { color: '#10b981', fontWeight: 'bold', fontSize: 14, marginBottom: 8 },
  tripPassenger: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  tripRoute: { color: '#cbd5e1', fontSize: 13, marginTop: 4 },
  tripFare: { color: '#06b6d4', fontSize: 18, fontWeight: 'bold', marginVertical: 10 },
  btnStep: { backgroundColor: '#6366f1', padding: 12, borderRadius: 20, alignItems: 'center', marginBottom: 8 },
  btnStepText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  vehicleInfo: { borderTopWidth: 1, borderColor: '#1e293b', paddingTop: 16, marginTop: 10 },
  vehicleTitle: { color: '#e2e8f0', fontSize: 14, fontWeight: 'bold', marginBottom: 6 },
  vehicleText: { color: '#94a3b8', fontSize: 12, marginBottom: 3 }
});
