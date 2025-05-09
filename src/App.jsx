import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
window.supabase = supabase;
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import Layout from './components/Layout/Layout';
import Uploader from './components/Uploader/Uploader';
import { SidebarProvider } from './context/SidebarContext';




const USE_LOCAL_BETA = import.meta.env.VITE_USE_LOCAL_BETA === 'true';

const checkBetaAccess = async (session) => {
  const email = session?.user?.email?.trim().toLowerCase();
  console.log('🔐 Checking beta access for:', email);

  if (USE_LOCAL_BETA) {
    const allowedEmails = import.meta.env.VITE_BETA_EMAILS.split(',').map(e => e.trim().toLowerCase());
    const match = allowedEmails.includes(email);
    console.log('🧪 Local whitelist match:', match);
    return match;
  }

  // fallback to Supabase table
  try {
    const { data, error } = await supabase
      .from('beta_users')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    console.log('🧾 Supabase result:', { data, error });
    return !!data && !error;
  } catch (e) {
    console.error('❌ Supabase check failed:', e);
    return false;
  }
};




function App() {
  const [session, setSession] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 50, y: 50 });
  const [currentView, setCurrentView] = useState('all'); // 👈 NEW
  const [accessDenied, setAccessDenied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timedOut, setTimedOut] = useState(false);


  const handleMouseMove = (e) => {
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;
  
    document.documentElement.style.setProperty('--mouse-x', `${x}%`);
    document.documentElement.style.setProperty('--mouse-y', `${y}%`);
  };

  useEffect(() => {
    console.log('🔥 useEffect start');
  
    const getSessionAndValidate = async () => {
      const { data, error } = await supabase.auth.getSession();
      console.log('🧠 Supabase session result:', data, error);
  
      const session = data?.session;
  
      if (!session) {
        console.log('⛔ No session found');
        setSession(null);
        setLoading(false);
        return;
      }
  
      const allowed = await checkBetaAccess(session);
      console.log('✅ Beta access allowed?', allowed);
  
      if (allowed) {
        setSession(session);
      } else {
        setAccessDenied(true);
        setSession(null);
        await supabase.auth.signOut();
      }
  
      setLoading(false);
    };
  
    getSessionAndValidate();
  
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('🔄 Auth changed:', session);
  
      if (!session) {
        setSession(null);
        setLoading(false);
        return;
      }
  
      checkBetaAccess(session).then((allowed) => {
        if (allowed) {
          setSession(session);
        } else {
          setAccessDenied(true);
          setSession(null);
          supabase.auth.signOut();
        }
        setLoading(false);
      });
    });
  
    return () => subscription.unsubscribe();
  }, []);
  
  

  
  if (accessDenied) {
    return (
      <div
        style={{
          height: '100vh',
          width: '100vw',
          background: 'linear-gradient(135deg, #0f0f0f, #1a1a1a)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
      >
        <div
          style={{
            backdropFilter: 'blur(16px)',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.4)',
            borderRadius: '16px',
            padding: '3rem',
            color: '#fff',
            maxWidth: '460px',
            textAlign: 'center',
            animation: 'fadeInScale 0.6s ease forwards',
          }}
        >
          <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>
            Access Restricted
          </h2>
          <p style={{ fontSize: '1rem', lineHeight: '1.5' }}>
            WavSafe is currently in closed beta. If you’d like to request access,
            sign up on our waitlist.
          </p>
          <a
            href="https://wavsafe.com"
            style={{
              marginTop: '2rem',
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#a020f0',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              transition: 'background 0.3s ease',
            }}
          >
            Return to Landing Page
          </a>
        </div>
      </div>
    );
  }
  
  if (timedOut) {
    return (
      <div
        style={{
          height: '100vh',
          width: '100vw',
          backgroundColor: '#111',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <h2 style={{ fontSize: '1.6rem', marginBottom: '1rem' }}>
          Sorry, this is a closed beta.
        </h2>
        <p style={{ fontSize: '1rem', maxWidth: '400px' }}>
          If you think this is a mistake, please contact us or request access at wavsafe.com.
        </p>
        <a
          href="https://wavsafe.com"
          style={{
            marginTop: '2rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#a020f0',
            color: '#fff',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '600',
          }}
        >
          Return to Landing Page
        </a>
      </div>
    );
  }
  

  if (loading) {
    return (
      <div
        style={{
          height: '100vh',
          width: '100vw',
          background: 'linear-gradient(135deg, #0f0f0f, #1a1a1a)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            padding: '2.5rem 3rem',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            backdropFilter: 'blur(14px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Spinner */}
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '4px solid #a020f033',
              borderTop: '4px solid #a020f0',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '1.5rem',
            }}
          ></div>
  
          {/* Text */}
          <p style={{ color: '#fff', fontSize: '1rem' }}>Checking access…</p>
        </div>
  
        {/* Spinner animation */}
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }
  
  

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
    <SidebarProvider>
      <div onMouseMove={handleMouseMove}>
        <Layout
          session={session}
          currentView={currentView}
          setCurrentView={setCurrentView}
        >
          <Uploader session={session} currentView={currentView} />
        </Layout>
      </div>
    </SidebarProvider>
  );
  
  
}

export default App;
