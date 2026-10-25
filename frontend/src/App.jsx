import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/common/Navbar';
import { LandingPage } from './pages/LandingPage';
import { Footer } from './components/common/Footer';

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-200">
        <Navbar />
        <div className="flex-1">
          <LandingPage />
        </div>
        <Footer />
      </div>
    </ThemeProvider>
  );
}

export default App;
