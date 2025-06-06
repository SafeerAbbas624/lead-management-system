import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import LeadsPage from './pages/LeadsPage';
import { AppBar, Toolbar, Typography, Container, Button } from '@mui/material';

function App() {
  return (
    <Router>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Lead Management System
          </Typography>
          <Button color="inherit" component={Link} to="/leads">
            Leads
          </Button>
        </Toolbar>
      </AppBar>
      
      <Container>
        <Routes>
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/" element={<LeadsPage />} />
        </Routes>
      </Container>
    </Router>
  );
}

export default App; 