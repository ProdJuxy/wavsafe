import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import Layout from './components/Layout/Layout';
import Uploader from './components/Uploader/Uploader';

function App() {
  const [session, setSession] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 50, y: 50 });
  const [currentView, setCurrentView] = useState('all'); // 👈 NEW

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setHoverPosition({ x, y });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return (
      <div
        style={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#111',
          color: '#fff',
          flexDirection: 'column',
        }}
      >
        <h2 style={{ marginBottom: '1rem' }}>Sign in to WavSafe</h2>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} />
        </div>
      </div>
    );
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      style={{
        background: `radial-gradient(circle at ${hoverPosition.x}% ${hoverPosition.y}%, #1a1a1a, #000)`,
        transition: 'background 0.1s ease',
        minHeight: '100vh',
      }}
    >
      <Layout
        session={session}
        currentView={currentView}
        setCurrentView={setCurrentView}
      >
        <Uploader session={session} currentView={currentView} />
      </Layout>
    </div>
  );
}

export default App;
