import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import logo from './assets/logo2.jpg';
import { auth } from './firebase';
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword } from 'firebase/auth';
import Dashboard from './components/Dashboard';

function App() {
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(user && user.emailVerified);
    });
    return () => unsubscribe();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      if (!userCredential.user.emailVerified) {
        toast.error('Please verify your email before logging in');
        return;
      }
      toast.success('Logged in successfully!');
      setShowLogin(false);
      setIsAuthenticated(true);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await sendEmailVerification(userCredential.user);
      toast.success(`Verification email sent to ${formData.email}.`);
      setShowSignup(false);
      setFormData({ email: '', password: '', name: '' });
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <Routes>
      <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />} />
      <Route path="/" element={
        <div className="App">
          <nav className="navbar">
            <div className="logo">
              <img src={logo} alt="BioNexa Logo" />
              <h1>BioNexa</h1>
            </div>
            <div className="nav-buttons">
              <button className="btn btn-login" onClick={() => setShowLogin(true)}>Login</button>
              <button className="btn btn-signup" onClick={() => setShowSignup(true)}>Sign Up</button>
            </div>
          </nav>

          <main className="hero">
            <div className="hero-content">
              <h1 className="hero-title">Welcome to BioNexa</h1>
              <p className="hero-subtitle">Connecting Biology with Technology for a Better Future</p>
              <button className="btn btn-signup" onClick={() => setShowSignup(true)}>Get Started</button>
            </div>
          </main>

          {showLogin && (
            <div className="modal-overlay">
              <div className="auth-modal">
                <button className="close-btn" onClick={() => setShowLogin(false)}>&times;</button>
                <h2>Login</h2>
                <form onSubmit={handleLogin} className="auth-form">
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input type="password" id="password" name="password" value={formData.password} onChange={handleInputChange} required />
                  </div>
                  <button type="submit" className="btn btn-signup">Login</button>
                </form>
              </div>
            </div>
          )}

          {showSignup && (
            <div className="modal-overlay">
              <div className="auth-modal">
                <button className="close-btn" onClick={() => setShowSignup(false)}>&times;</button>
                <h2>Sign Up</h2>
                <form onSubmit={handleSignup} className="auth-form">
                  <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="signup-email">Email</label>
                    <input type="email" id="signup-email" name="email" value={formData.email} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="signup-password">Password</label>
                    <input type="password" id="signup-password" name="password" value={formData.password} onChange={handleInputChange} required />
                  </div>
                  <button type="submit" className="btn btn-signup">Sign Up</button>
                </form>
              </div>
            </div>
          )}

          <ToastContainer position="top-right" autoClose={5000} />
        </div>
      }/>
    </Routes>
  );
}

export default App;
