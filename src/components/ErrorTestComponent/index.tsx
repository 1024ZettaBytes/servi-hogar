import { Button, Card, CardContent, Container, Grid, Typography } from '@mui/material';
import { useState } from 'react';

function ErrorTestComponent() {
  const [testType, setTestType] = useState<string | null>(null);

  // Test 1: React render error (caught by Error Boundary)
  if (testType === 'render') {
    throw new Error('Test: React rendering error');
  }

  // Test 2: Event handler error (caught by global error handler)
  const handleEventError = () => {
    throw new Error('Test: Event handler error');
  };

  // Test 3: Async error (caught by unhandledrejection handler)
  const handleAsyncError = async () => {
    throw new Error('Test: Async function error');
  };

  // Test 4: Promise rejection (caught by unhandledrejection handler)
  const handlePromiseError = () => {
    Promise.reject(new Error('Test: Promise rejection'));
  };

  // Test 5: Network error simulation
  const handleNetworkError = async () => {
    const error: any = new Error('Network Error');
    error.code = 'ERR_NETWORK';
    throw error;
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Error Handling Test Suite
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Test different error scenarios. Check browser console for logs.
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Button 
                variant="contained" 
                color="error"
                fullWidth
                onClick={() => setTestType('render')}
              >
                Test 1: React Render Error (Error Boundary)
              </Button>
            </Grid>
            
            <Grid item xs={12}>
              <Button 
                variant="contained" 
                color="warning"
                fullWidth
                onClick={handleEventError}
              >
                Test 2: Event Handler Error (Global Handler)
              </Button>
            </Grid>
            
            <Grid item xs={12}>
              <Button 
                variant="contained" 
                color="info"
                fullWidth
                onClick={() => handleAsyncError()}
              >
                Test 3: Async Function Error (Unhandled Rejection)
              </Button>
            </Grid>
            
            <Grid item xs={12}>
              <Button 
                variant="contained" 
                color="secondary"
                fullWidth
                onClick={handlePromiseError}
              >
                Test 4: Promise Rejection (Unhandled Rejection)
              </Button>
            </Grid>
            
            <Grid item xs={12}>
              <Button 
                variant="contained" 
                color="success"
                fullWidth
                onClick={() => handleNetworkError()}
              >
                Test 5: Network Error (ERR_NETWORK)
              </Button>
            </Grid>
          </Grid>
          
          <Typography variant="caption" display="block" sx={{ mt: 3 }}>
            ✅ Test 1 should show Error Boundary UI<br/>
            ✅ Tests 2-5 should log to console and be caught by global handlers
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
}

export default ErrorTestComponent;
