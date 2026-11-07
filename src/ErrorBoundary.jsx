import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    // Clear localStorage in case bad/corrupted cached data caused the issue
    try {
      localStorage.removeItem('ow_news');
      localStorage.removeItem('ow_news_v2');
      localStorage.removeItem('ow_rashi');
    } catch (e) {
      console.warn(e);
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#f8fafc',
          fontFamily: "'Noto Sans Devanagari', -apple-system, BlinkMacSystemFont, sans-serif",
          color: '#0f172a',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '500px',
            background: '#ffffff',
            borderRadius: '16px',
            padding: '36px 28px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📰</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0b3c75', marginBottom: '12px' }}>
              उमरगा वार्ता
            </h1>
            <p style={{ fontSize: '1rem', color: '#475569', marginBottom: '24px', lineHeight: 1.6 }}>
              पोर्टल लोड होताना एक तात्पुरती अडचण आली आहे. खालील बटणावर क्लिक करून पेज रीलोड करा.
            </p>
            <button
              onClick={this.handleReload}
              style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: 'none',
                padding: '12px 28px',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.3)'
              }}
            >
              रीलोड करा (Reload Portal)
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
