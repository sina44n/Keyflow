import React from 'react';
import { BrowserRouter, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { SoundProvider } from './context/SoundContext';
import { Navbar } from './components/common/Navbar';
import { LandingPage } from './pages/LandingPage';
import { AcademyPage } from './pages/AcademyPage';
import { WorkstationPage } from './pages/WorkstationPage';
import { Footer } from './components/common/Footer';

const AcademyStageRoute = () => {
  const { stageId } = useParams();
  const navigate = useNavigate();
  return (
    <AcademyPage
      initialLevelId={parseInt(stageId, 10) || 1}
      onExit={() => navigate('/')}
    />
  );
};

const AcademyHomeRoute = () => {
  const navigate = useNavigate();
  return (
    <AcademyPage
      initialLevelId={1}
      onExit={() => navigate('/')}
    />
  );
};

function App() {
  return (
    <ThemeProvider>
      <SoundProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-200">
            <Navbar />
            <div className="flex-1">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/workstation" element={<WorkstationPage />} />
                <Route path="/practice" element={<WorkstationPage />} />
                <Route path="/academy" element={<AcademyHomeRoute />} />
                <Route path="/academy/stage/:stageId" element={<AcademyStageRoute />} />
                <Route path="*" element={<LandingPage />} />
              </Routes>
            </div>
            <Footer />
          </div>
        </BrowserRouter>
      </SoundProvider>
    </ThemeProvider>
  );
}

export default App;
