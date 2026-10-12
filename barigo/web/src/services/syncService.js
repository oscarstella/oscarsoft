// Servicio de sincronización en tiempo real entre pestañas y dispositivos
// Utiliza BroadcastChannel nativo + localStorage events + soporte opcional Socket.io

class SyncService {
  constructor() {
    this.channel = null;
    this.listeners = new Set();
    this.initChannel();
  }

  initChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('barigo_mobility_sync');
        this.channel.onmessage = (event) => {
          this.notifyListeners(event.data);
        };
      } catch (e) {
        console.warn('BroadcastChannel error:', e);
      }
    }

    // Fallback con storage event
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'barigo_sync_event' && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            this.notifyListeners(data);
          } catch {}
        }
      });
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(data) {
    this.listeners.forEach((cb) => {
      try {
        cb(data);
      } catch (err) {
        console.error('Error in sync listener:', err);
      }
    });
  }

  emit(type, payload) {
    const message = { type, payload, timestamp: Date.now() };

    // 1. BroadcastChannel
    if (this.channel) {
      this.channel.postMessage(message);
    }

    // 2. LocalStorage trigger
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('barigo_sync_event', JSON.stringify(message));
      } catch {}
    }

    // 3. Notificar listeners locales en la misma ventana
    this.notifyListeners(message);
  }
}

export const syncService = new SyncService();
