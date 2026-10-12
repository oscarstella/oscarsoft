import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[BariGo ErrorBoundary]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          minHeight: '320px',
          padding: '24px',
          background: '#09101d',
          color: '#f8fafc',
          textAlign: 'center'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <AlertTriangle size={28} color="#ef4444" />
          </div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 700 }}>
            {this.props.fallbackTitle || 'Hubo un inconveniente en la vista'}
          </h3>
          <p style={{ margin: '0 0 20px 0', fontSize: '0.82rem', color: '#94a3b8', maxWidth: '340px' }}>
            {this.state.error?.message || 'Se produjo un error al cargar los datos en pantalla.'}
          </p>
          <button
            onClick={this.handleReload}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #00e5ff, #0077b6)',
              color: '#002230',
              fontWeight: 700,
              fontSize: '0.85rem',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={15} />
            <span>Reintentar Vista</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
