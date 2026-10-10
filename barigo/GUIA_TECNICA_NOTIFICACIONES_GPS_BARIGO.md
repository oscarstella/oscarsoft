# 📘 GUÍA TÉCNICA DE ARQUITECTURA BARIGO
## Notificaciones con Pantalla Apagada, Telemetría GPS en Tiempo Real y Sistema Multi-APK

Este documento detalla todas las técnicas, configuraciones nativas de Android, servicios en segundo plano, librerías y algoritmos implementados en **BariGo** para lograr el funcionamiento en tiempo real, recepción de viajes con pantalla apagada y seguimiento satelital.

---

## 1. 🔔 Notificaciones con Pantalla Apagada / Bloqueada

### El Problema de Android Moderno:
En Android 10+ (hasta Android 14/15/16), cuando la pantalla se apaga o el celular entra en reposo:
1. **Modo Doze**: El sistema duerme la CPU y pausa los sockets de red e hilos de Flutter.
2. **Ciclo de Vida de UI**: El motor de renderizado de Flutter (`build()`) se congela completamente.
3. **Restricción de Audio**: Los sonidos normales de notificación se atenúan o no suenan si el canal no está marcado como alarma/llamada de alta prioridad.

### La Solución Implementada:

#### A. Flags Nativas de Ventana en Android (`MainActivity.kt`)
Se agregaron flags en la actividad principal de Android para que el sistema operativo permita encender la pantalla y mostrar la app sobre el bloqueo:
```kotlin
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
    setShowWhenLocked(true)
    setTurnScreenOn(true)
} else {
    window.addFlags(
        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
        WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
        WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
    )
}
```

#### B. Permisos en `AndroidManifest.xml`
```xml
<uses-permission android:name="android.permission.WAKE_LOCK"/>
<uses-permission android:name="android.permission.USE_FULL_SCREEN_INTENT"/>
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
<uses-permission android:name="android.permission.FOREGROUND_SERVICE"/>
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION"/>
<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS"/>
```

#### C. Servicio en Primer Plano con WakeLock (`GeolocatorLocationService`)
Se declaró el servicio de ubicación en primer plano en el manifiesto con `enableWakeLock: true`:
```dart
locationSettings = AndroidSettings(
  accuracy: LocationAccuracy.bestForNavigation,
  distanceFilter: 2,
  forceLocationManager: true,
  intervalDuration: const Duration(seconds: 1),
  foregroundNotificationConfig: const ForegroundNotificationConfig(
    notificationText: "BariGo Chofer transmitiendo GPS en tiempo real",
    notificationTitle: "BariGo Chofer en Servicio",
    enableWakeLock: true,
  ),
);
```
Esto mantiene el procesador despierto y el socket de Supabase activo aunque la pantalla esté apagada.

#### D. Canal de Notificación de Máxima Prioridad (`NotificationService.dart`)
Se configuró un canal de notificación con audio tipo **Alarma**:
* `importance: Importance.max`
* `priority: Priority.max`
* `audioAttributesUsage: AudioAttributesUsage.alarm`
* `fullScreenIntent: true`
* `category: AndroidNotificationCategory.call`
* Despertador de procesador: `WakelockPlus.enable()`

#### E. Desacople del Ciclo de Vida de la UI
* **Regla crítica**: La notificación NUNCA debe estar dentro de un widget `build()`.
* Se ubicó la escucha directamente en la capa de datos en segundo plano (`DriverProvider._init()` escuchando `_supabaseService.activeRideStream`), garantizando ejecución continua.

---

## 2. 🛰️ Telemetría GPS Real vía Satélite (Celular Chofer ➔ Supabase)

### Flujo de Datos Físico:
1. **Solicitud de Permisos**:
   La app de chofer solicita en tiempo de ejecución:
   ```dart
   LocationPermission permission = await Geolocator.requestPermission();
   ```
2. **Captura Satelital Hardware**:
   Mediante `Geolocator.getPositionStream` con `LocationAccuracy.bestForNavigation`.
3. **Subida Continua a Supabase**:
   Cada vez que la antena GPS detecta un movimiento físico (> 2 metros):
   ```dart
   await _supabaseService.updateDriverLocation(
     _driverProfile.id,
     LatLng(position.latitude, position.longitude),
     heading: position.heading,
   );
   ```
   Esto impacta en la tabla `driver_locations` de Supabase:
   * `latitude`, `longitude`, `heading`, `is_online`, `last_updated`.

---

## 3. 🗺️ Seguimiento en Vivo y Alerta de 2 Minutos (Supabase ➔ Pasajero)

### Flujo en la App del Pasajero:
1. **Escucha en Tiempo Real**:
   La app del pasajero recibe el streaming de `driver_locations` y actualiza la posición física real del chofer asignado.
2. **Solapa Flotante en el Mapa (`BarigoMap.dart`)**:
   Sobre el vehículo en movimiento se renderiza un widget con:
   * 👤 Nombre del chofer.
   * 📌 Últimos 3 dígitos de la patente (`•••342`).
   * ⏱️ Tiempo estimado de llegada en vivo (`• 2 min`).
3. **Disparador de Alerta de Proximidad**:
   Se calcula la distancia satelital al punto de retiro (`_pickupLocation`):
   ```dart
   final remainingDistKm = _locationService.calculateDistanceKm(driverPos, _pickupLocation);
   final remainingMins = _locationService.estimateDurationMinutes(remainingDistKm);
   ```
   Cuando `remainingMins <= 2` o `remainingDistKm <= 0.8 km`:
   * Se muestra el banner superior: `🚨 ¡TU AUTO ESTÁ POR LLEGAR! Salí a su encuentro.`
   * Se dispara la notificación del sistema `NotificationService().showPassengerArrivalNotification(...)`.
   * Se ejecuta la voz TTS `SoundService().speakPassengerArrival()`.

---

## 4. 🗣️ Sintetizador de Voz (TTS) y Detección de Idioma

### Implementación en `SoundService.dart`:
Se utiliza `flutter_tts` con detección inteligente del motor de voz del dispositivo:
```dart
Future<void> _initLanguage() async {
  final languages = await _tts.getLanguages;
  if (languages.contains('es-AR')) {
    await _tts.setLanguage('es-AR'); // Español Argentino
  } else if (languages.contains('es-419')) {
    await _tts.setLanguage('es-419'); // Español Neutro / Latino
  } else {
    await _tts.setLanguage('es');
  }
}
```
* Avisos vocalizados:
  1. *"¡Atención! Nuevo viaje solicitado en BariGo. Toca aceptar."* (Chofer)
  2. *"¡Viaje aceptado! El chofer [Nombre] está en camino a tu ubicación."* (Pasajero)
  3. *"¡Atención! Tu auto está por llegar. Salí a su encuentro."* (Pasajero)

---

## 5. 📱 Sistema Multi-APK Independiente (Product Flavors)

Para que un usuario o chofer pueda tener instaladas **las 2 aplicaciones al mismo tiempo en el mismo teléfono Android sin que se pisen**:

### Configuración en `android/app/build.gradle.kts`:
```kotlin
flavorDimensions += "role"
productFlavors {
    create("chofer") {
        dimension = "role"
        applicationId = "com.barigo.chofer"
        manifestPlaceholders["appName"] = "BariGo Chofer"
    }
    create("pasajero") {
        dimension = "role"
        applicationId = "com.barigo.pasajero"
        manifestPlaceholders["appName"] = "BariGo Pasajero"
    }
}
```

### Entrypoints Exclusivos:
* **Chofer**: `lib/main_driver.dart` ➔ Genera `apks/barigo_chofer.apk` (`com.barigo.chofer`)
* **Pasajero**: `lib/main_passenger.dart` ➔ Genera `apks/barigo_pasajero.apk` (`com.barigo.pasajero`)

---

## 6. 📚 Librerías y Dependencias Principales

| Librería | Versión | Propósito en BariGo |
| :--- | :--- | :--- |
| `geolocator` | `^13.0.2` | GPS satelital en segundo plano con servicio `ForegroundService` y `WAKE_LOCK`. |
| `flutter_local_notifications` | `^18.0.1` | Notificaciones heads-up de máxima prioridad con audio de alarma y pantalla bloqueada. |
| `wakelock_plus` | `^1.2.11` | Despierta la CPU y pantalla del móvil al recibir alertas de viaje. |
| `flutter_tts` | `^4.2.2` | Síntesis de voz en español argentino (`es-AR`) y neutro (`es-419`). |
| `supabase_flutter` | `^2.8.4` | Base de datos PostgreSQL en tiempo real y streaming de telemetría de viajes y flota. |
| `flutter_map` | `^7.0.2` | Motor de mapas OpenStreetMap de alta resolución con capas de rutas y marcadores animados. |
| `latlong2` | `^0.9.1` | Cálculos geoespaciales (distancia euclidiana/haversine, rumbos de vehículos). |
| `provider` | `^6.1.2` | Gestión reactiva de estado desacoplada de la UI (`DriverProvider`, `PassengerProvider`, `AdminProvider`). |
| `shared_preferences` | `^2.3.4` | Persistencia local de sesión y credenciales del chofer/pasajero. |
| `url_launcher` | `^6.3.1` | Comunicación directa por WhatsApp con el chofer y pasajeros. |

---

*Documento generado para el proyecto BariGo - San Carlos de Bariloche.*
