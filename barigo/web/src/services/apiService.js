// Servicio API y WebSockets Socket.io conectado al backend real de BariGo (Puerto 5055 / Proxy VPS /api/barigo)
import { io } from 'socket.io-client';

const getApiBase = () => {
  if (typeof window === 'undefined') return 'http://localhost:5055/api';
  if (window.location.port === '5173' || window.location.port === '5174') {
    return 'http://localhost:5055/api';
  }
  if (window.location.origin.includes('5050')) {
    return 'http://localhost:5055/api';
  }
  // En producción VPS (oscarsoft.com.ar/barigo) el proxy está en /api/barigo
  return `${window.location.origin}/api/barigo`;
};

const API_BASE_URL = getApiBase();

const getSocketUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:5055';
  if (window.location.hostname === 'localhost') return 'http://localhost:5055';
  return window.location.origin;
};

const SOCKET_URL = getSocketUrl();

class ApiService {
  constructor() {
    this.token = typeof window !== 'undefined' ? localStorage.getItem('barigo_token') : null;
    this.socket = null;
    this.initSocket();
  }

  initSocket(userId = null, role = null) {
    if (typeof window === 'undefined') return null;

    if (!this.socket) {
      try {
        this.socket = io(SOCKET_URL, {
          path: '/socket.io',
          transports: ['websocket', 'polling'],
          query: {
            userId: userId || 'usr-real',
            role: role || 'passenger'
          },
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 2000
        });

        this.socket.on('connect', () => {
          console.log('[BariGo WebSockets] Conectado al servidor en tiempo real:', this.socket.id);
        });

        this.socket.on('disconnect', () => {
          console.log('[BariGo WebSockets] Desconectado del servidor');
        });
      } catch (err) {
        console.warn('[BariGo WebSockets] Error al inicializar socket:', err);
      }
    }
    return this.socket;
  }

  getSocket() {
    return this.socket || this.initSocket();
  }

  // Métodos REST API
  async getOnlineDrivers() {
    try {
      const res = await fetch(`${API_BASE_URL}/drivers/online`);
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data) ? data : (data.drivers || []);
      }
    } catch {
      // Fallback
    }
    return [];
  }

  async requestRide(ridePayload) {
    try {
      const res = await fetch(`${API_BASE_URL}/rides/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {})
        },
        body: JSON.stringify(ridePayload)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('[API] Fallback local para solicitud:', e.message);
    }
    return null;
  }

  async getAdminStats() {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: {
          ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {})
        }
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return null;
  }

  async updateFareSettings(fares) {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/fares`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {})
        },
        body: JSON.stringify(fares)
      });
      return res.ok;
    } catch {}
    return false;
  }
}

export const apiService = new ApiService();
