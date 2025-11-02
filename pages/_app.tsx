import type { ReactElement, ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { SessionProvider } from 'next-auth/react';
import type { NextPage } from 'next';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import Router from 'next/router';
import nProgress from 'nprogress';
import 'nprogress/nprogress.css';
import ThemeProvider from 'src/theme/ThemeProvider';
import CssBaseline from '@mui/material/CssBaseline';
import { CacheProvider, EmotionCache } from '@emotion/react';
import createEmotionCache from 'src/createEmotionCache';
import { SidebarProvider } from 'src/contexts/SidebarContext';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { SnackbarProvider, useSnackbar } from 'notistack';
import ErrorBoundary from '@/components/ErrorBoundary';
import setupAxiosInterceptors from '../lib/client/axiosConfig';

// Setup axios interceptors once
setupAxiosInterceptors();

const clientSideEmotionCache = createEmotionCache();

type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactNode;
};

interface TokyoAppProps extends AppProps {
  emotionCache?: EmotionCache;
  Component: NextPageWithLayout;
}

// Component that uses snackbar for global error handling
function GlobalErrorHandler({ children }: { children: ReactNode }) {
  const { enqueueSnackbar } = useSnackbar();
  
  // Use refs to persist values across renders and event handlers
  const isShowingErrorRef = useRef(false);
  const DEBOUNCE_TIME = 300; // 300ms

  useEffect(() => {
    const showErrorAlert = (errorDetails: string) => {
      // Check if we're already showing an error
      if (isShowingErrorRef.current) {
        console.log('Skipping duplicate - error already being shown');
        return false;
      }

      // Set flag to prevent duplicates
      isShowingErrorRef.current = true;
      
      // Show the alert
      alert(errorDetails);
      
      // Show snackbar
      enqueueSnackbar(
        'Error detectado. Por favor envía la captura al soporte.',
        {
          variant: 'error',
          autoHideDuration: 3000,
          anchorOrigin: { vertical: 'top', horizontal: 'center' }
        }
      );

      // Reset flag after debounce time
      setTimeout(() => {
        isShowingErrorRef.current = false;
      }, DEBOUNCE_TIME);

      return true;
    };

    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);

      // Prepare detailed error info
      const errorInfo = {
        type: 'Promise Rejection',
        message: event.reason?.message || String(event.reason),
        code: event.reason?.code || 'N/A',
        stack: event.reason?.stack || 'No stack trace',
        timestamp: new Date().toLocaleString('es-MX'),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      // Show detailed error as alert for screenshot
      const errorDetails = `
🔴 ERROR DETECTADO
Por favor toma captura de pantalla y envíala

Tipo: ${errorInfo.type}
Mensaje: ${errorInfo.message}
Código: ${errorInfo.code}
Fecha: ${errorInfo.timestamp}
Página: ${errorInfo.url}

Dispositivo: ${navigator.platform}
Navegador: ${navigator.userAgent.substring(0, 50)}...

Stack Trace:
${errorInfo.stack.substring(0, 200)}
      `.trim();

      // Show error (with duplicate prevention)
      showErrorAlert(errorDetails);

      // Prevent default browser error handling
      event.preventDefault();
    };

    // Handle global errors
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error || event.message);

      // Prevent default browser error handling for known issues
      if (event.error?.message?.includes('ResizeObserver')) {
        event.preventDefault();
        return;
      }

      // Prepare detailed error info
      const errorInfo = {
        type: 'Runtime Error',
        message: event.error?.message || event.message || 'Error desconocido',
        filename: event.filename || 'N/A',
        lineno: event.lineno || 'N/A',
        colno: event.colno || 'N/A',
        stack: event.error?.stack || 'No stack trace',
        timestamp: new Date().toLocaleString('es-MX'),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      // Show detailed error as alert for screenshot
      const errorDetails = `
🔴 ERROR DETECTADO
Por favor toma captura de pantalla y envíala

Tipo: ${errorInfo.type}
Mensaje: ${errorInfo.message}
Archivo: ${errorInfo.filename}
Línea: ${errorInfo.lineno}:${errorInfo.colno}
Fecha: ${errorInfo.timestamp}
Página: ${errorInfo.url}

Dispositivo: ${navigator.platform}
Navegador: ${navigator.userAgent.substring(0, 50)}...

Stack Trace:
${errorInfo.stack.substring(0, 200)}
      `.trim();

      // Show error (with duplicate prevention)
      showErrorAlert(errorDetails);
    };

    // Add event listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    // Cleanup
    return () => {
      window.removeEventListener(
        'unhandledrejection',
        handleUnhandledRejection
      );
      window.removeEventListener('error', handleError);
    };
  }, [enqueueSnackbar]);

  return <>{children}</>;
}

function TokyoApp(props: TokyoAppProps) {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;
  const getLayout = Component.getLayout ?? ((page) => page);

  Router.events.on('routeChangeStart', nProgress.start);
  Router.events.on('routeChangeError', nProgress.done);
  Router.events.on('routeChangeComplete', nProgress.done);

  return (
    <SessionProvider session={pageProps['session']}>
      <CacheProvider value={emotionCache}>
        <Head>
          <title>Servi Hogar: Soluciones a tu medida</title>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, shrink-to-fit=no"
          />
        </Head>
        <SnackbarProvider maxSnack={3}>
          <GlobalErrorHandler>
            <SidebarProvider>
              <ThemeProvider>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <ErrorBoundary>
                    <CssBaseline />
                    {getLayout(<Component {...pageProps} />)}
                  </ErrorBoundary>
                </LocalizationProvider>
              </ThemeProvider>
            </SidebarProvider>
          </GlobalErrorHandler>
        </SnackbarProvider>
      </CacheProvider>
    </SessionProvider>
  );
}

export default TokyoApp;
