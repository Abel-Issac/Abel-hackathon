import { useState, useEffect } from 'react';
import WelcomeScreen from './screens/WelcomeScreen';
import CreateScreen from './screens/CreateScreen';
import ShareScreen from './screens/ShareScreen';
import PlayScreen from './screens/PlayScreen';
import ResultsScreen from './screens/ResultsScreen';
import NotFoundScreen from './screens/NotFoundScreen';
import Footer from './components/Footer';
import Toast from './components/Toast';
import './index.css';

// Simple client-side router based on URL path
function getRouteFromPath() {
  const path = window.location.pathname;
  const quizMatch = path.match(/^\/quiz\/([a-z0-9-]+)$/i);
  if (quizMatch) return { screen: 'play', quizId: quizMatch[1] };
  return { screen: 'welcome', quizId: null };
}

export default function App() {
  const [route, setRoute] = useState(getRouteFromPath);
  const [quizData, setQuizData] = useState(null); // { id, title, questions }
  const [answers, setAnswers] = useState([]); // player's answers for results
  const [toast, setToast] = useState(null);

  // Listen for popstate (back/forward navigation)
  useEffect(() => {
    const onPop = () => setRoute(getRouteFromPath());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  function navigate(screen, quizId = null) {
    let path = '/';
    if (screen === 'play' && quizId) path = `/quiz/${quizId}`;
    window.history.pushState({}, '', path);
    setRoute({ screen, quizId });
  }

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }

  function handleQuizCreated(data) {
    setQuizData(data);
    navigate('share', data.id);
  }

  function handleStartPlay(id, data) {
    setQuizData(data);
    setAnswers([]);
    navigate('play', id);
  }

  function handleQuizComplete(finalAnswers) {
    setAnswers(finalAnswers);
    navigate('results');
  }

  return (
    <div className="app-container">
      {toast && <Toast message={toast} />}

      {route.screen === 'welcome' && (
        <WelcomeScreen
          onCreateQuiz={() => navigate('create')}
          onJumpToQuiz={(id) => navigate('play', id)}
        />
      )}

      {route.screen === 'create' && (
        <CreateScreen
          onQuizCreated={handleQuizCreated}
          onBack={() => navigate('welcome')}
        />
      )}

      {route.screen === 'share' && quizData && (
        <ShareScreen
          quizData={quizData}
          onPlay={() => handleStartPlay(quizData.id, quizData)}
          onShowToast={showToast}
          onCreateAnother={() => navigate('create')}
        />
      )}

      {route.screen === 'play' && (
        <PlayScreen
          quizId={route.quizId}
          initialData={quizData}
          onComplete={handleQuizComplete}
          onNotFound={() => navigate('notfound')}
          onShowToast={showToast}
        />
      )}

      {route.screen === 'results' && quizData && (
        <ResultsScreen
          quizData={quizData}
          answers={answers}
          onCreateNew={() => navigate('welcome')}
          onPlayAgain={() => {
            setAnswers([]);
            navigate('play', quizData.id);
          }}
        />
      )}

      {route.screen === 'notfound' && (
        <NotFoundScreen onCreateNew={() => navigate('welcome')} />
      )}

      <Footer />
    </div>
  );
}
