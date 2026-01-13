import { Box, Paper } from '@mui/material';
import { Map } from './components/Map';
import './App.css';

function App() {
  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw' }}>
      <Paper
        elevation={2}
        sx={{
          width: 320,
          minWidth: 320,
          height: '100%',
          borderRadius: 0,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1,
        }}
      >
        {/* Panel content will go here */}
      </Paper>
      <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <Map />
      </Box>
    </Box>
  );
}

export default App;
