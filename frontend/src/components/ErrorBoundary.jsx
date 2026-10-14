import React from 'react';

/**
 * Kivora Application Error Boundary
 * Prevents runtime rendering exceptions in subcomponents from unmounting
 * the entire React tree or showing a blank page.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('Kivora ErrorBoundary caught an exception:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="kivora-error-boundary-fallback"
          style={{
            padding: '48px 24px',
            maxWidth: '680px',
            margin: '40px auto',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #F3E8FF',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.06)',
            textAlign: 'center',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#FEF2F2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              margin: '0 auto 16px auto',
            }}
          >
            ⚠️
          </div>

          <h2
            style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#111827',
              margin: '0 0 8px 0',
            }}
          >
            {this.props.title || 'An unexpected display error occurred'}
          </h2>

          <p
            style={{
              fontSize: '14px',
              color: '#4B5563',
              lineHeight: 1.5,
              margin: '0 0 20px 0',
            }}
          >
            {this.props.message ||
              'A rendering issue prevented this section from displaying properly. The rest of your workspace remains safe.'}
          </p>

          {this.state.error?.message && (
            <div
              style={{
                backgroundColor: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#991B1B',
                marginBottom: '24px',
                overflowX: 'auto',
              }}
            >
              <strong>Error Details:</strong> {this.state.error.message}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={this.handleReset}
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                backgroundColor: '#7952EC',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(121, 82, 236, 0.3)',
              }}
            >
              ↻ Try Again
            </button>

            <button
              type="button"
              onClick={() => {
                window.location.href = '/';
              }}
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                backgroundColor: '#F3F4F6',
                color: '#374151',
                border: '1px solid #D1D5DB',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Return to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
