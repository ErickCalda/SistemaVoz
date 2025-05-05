import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './utils/firebase';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateSurvey from './pages/CreateSurvey';
import SurveyDetail from './pages/SurveyDetail';
import TakeSurvey from './pages/TakeSurvey';
import PublicSurveys from './pages/PublicSurveys';
import ResponseDetail from './pages/ResponseDetail';
import NotFound from './pages/NotFound';
import VoiceTest from './pages/VoiceTest';

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingScreen from './components/LoadingScreen';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="surveys/public" element={<PublicSurveys />} />
        <Route path="voice-test" element={<VoiceTest />} />
        <Route 
          path="dashboard" 
          element={
            <ProtectedRoute user={user}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="create-survey" 
          element={
            <ProtectedRoute user={user}>
              <CreateSurvey />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="surveys/:surveyId" 
          element={
            <ProtectedRoute user={user}>
              <SurveyDetail />
            </ProtectedRoute>
          } 
        />
        <Route path="take-survey/:surveyId" element={<TakeSurvey />} />
        <Route 
          path="responses/:responseId" 
          element={
            <ProtectedRoute user={user}>
              <ResponseDetail />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
