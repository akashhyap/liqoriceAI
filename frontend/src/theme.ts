import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#38b6ff',
    },
    secondary: {
      main: '#35384b',
    },
  },
  typography: {
    fontFamily: [
      'Mulish',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 600,
      color: '#13234d',
    },
    h2: {
      fontWeight: 600,
      color: '#13234d',
    },
    h3: {
      fontWeight: 600,
      color: '#13234d',
    },
    h4: {
      fontWeight: 600,
      color: '#13234d',
    },
    h5: {
      fontWeight: 600,
      color: '#13234d',
    },
    h6: {
      fontWeight: 600,
      color: '#13234d',
    },
  },
});

export default theme;
