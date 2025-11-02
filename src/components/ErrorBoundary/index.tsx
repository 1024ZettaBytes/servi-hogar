import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Box, Button, Container, Typography } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // You can also log to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    // Reload the page to recover
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md">
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100vh',
              textAlign: 'center',
              py: 4
            }}
          >
            <ErrorOutlineIcon 
              sx={{ fontSize: 80, color: 'error.main', mb: 2 }} 
            />
            <Typography variant="h3" gutterBottom>
              ¡Ups! Algo salió mal
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Ha ocurrido un error inesperado. Por favor, intenta recargar la página.
            </Typography>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Alert severity="error" sx={{ mb: 3, textAlign: 'left', width: '100%' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Error: {this.state.error.toString()}
                </Typography>
                {this.state.errorInfo && (
                  <Box sx={{ mt: 2, maxHeight: 300, overflow: 'auto' }}>
                    <pre style={{ fontSize: '0.75rem' }}>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </Box>
                )}
              </Alert>
            )}
            
            <Button 
              variant="contained" 
              size="large" 
              onClick={this.handleReset}
            >
              Recargar página
            </Button>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
