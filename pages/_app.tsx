import type { ReactElement, ReactNode } from 'react';
import { useEffect } from 'react';
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
import { SnackbarProvider } from 'notistack';
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

function TokyoApp(props: TokyoAppProps) {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;
  const getLayout = Component.getLayout ?? ((page) => page);

  Router.events.on('routeChangeStart', nProgress.start);
  Router.events.on('routeChangeError', nProgress.done);
  Router.events.on('routeChangeComplete', nProgress.done);

  // Global error handlers
  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      // Show user-friendly error for network errors
      if (event.reason?.code === 'ERR_NETWORK' || event.reason?.message?.includes('Network')) {
        console.error('Network error detected:', {
          message: event.reason.message,
          code: event.reason.code,
          stack: event.reason.stack
        });
      }
      
      // Prevent default browser error handling
      event.preventDefault();
    };

    // Handle global errors
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error || event.message);
      
      // Prevent default browser error handling for known issues
      if (event.error?.message?.includes('ResizeObserver')) {
        event.preventDefault();
      }
    };

    // Add event listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <SessionProvider session={pageProps["session"]}>
     
    <CacheProvider value={emotionCache}>
      <Head>
        <title>Servi Hogar: Soluciones a tu medida</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
      </Head>
      <SnackbarProvider maxSnack={3}>
      <SidebarProvider>
        <ThemeProvider>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <ErrorBoundary>
              <CssBaseline />
              {getLayout(<Component {...pageProps} />)}
            </ErrorBoundary>
          </LocalizationProvider>
        </ThemeProvider>
      </SidebarProvider >
      </SnackbarProvider>
    </CacheProvider>
    
    </SessionProvider>
  );
}

export default TokyoApp;
