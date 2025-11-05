import type { AppProps } from 'next/app';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { DemoProvider } from '../hooks/useDemo';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1F4E79',
    },
    secondary: {
      main: '#7F7F7F',
    },
  },
});

export default function App({ Component, pageProps }: AppProps) {
  const { initializeAuth } = useAuth();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DemoProvider>
        <Component {...pageProps} />
      </DemoProvider>
    </ThemeProvider>
  );
}