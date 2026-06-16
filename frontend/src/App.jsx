import { useState, useEffect } from 'react';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import './styles/App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="app">
      {user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <Auth setUser={setUser} />
      )}
    </div>
  );
}

export default App;
