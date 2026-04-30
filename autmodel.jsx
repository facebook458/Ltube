// AuthModal.jsx
// User Authentication Modal (Login / Sign Up)

import React, { useState } from 'react';
import { auth } from '../firebase-config';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously
} from 'firebase/auth';
import { db } from '../firebase-config';
import { doc, setDoc } from 'firebase/firestore';
import '../styles/AuthModal.css';

const AuthModal = ({ onClose, onSuccess }) => {
  const [mode, setMode] = useState('login'); // login or signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setIsLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        // Create user document in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: userCredential.user.email,
          createdAt: new Date(),
          commentCount: 0
        });

        onSuccess();
      } else {
        // Login
        await signInWithEmailAndPassword(auth, email, password);
        onSuccess();
      }
    } catch (error) {
      setError(error.message);
    }
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);

      // Create or update user document
      await setDoc(
        doc(db, 'users', userCredential.user.uid),
        {
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
          photoURL: userCredential.user.photoURL,
          createdAt: new Date(),
          commentCount: 0
        },
        { merge: true }
      );

      onSuccess();
    } catch (error) {
      setError(error.message);
    }
    setIsLoading(false);
  };

  const handleAnonymousSignIn = async () => {
    setError('');
    setIsLoading(true);

    try {
      await signInAnonymously(auth);
      onSuccess();
    } catch (error) {
      setError(error.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal">
        <button className="close-btn" onClick={onClose}>✕</button>

        <div className="auth-header">
          <h2>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
          <p>
            {mode === 'login'
              ? 'Sign in to your account'
              : 'Join our community'}
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleEmailAuth} className="auth-form">
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-field"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input-field"
          />

          {mode === 'signup' && (
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="input-field"
            />
          )}

          <button type="submit" disabled={isLoading} className="btn-auth">
            {isLoading
              ? 'Processing...'
              : mode === 'login'
              ? 'Sign In'
              : 'Sign Up'}
          </button>
        </form>

        <div className="auth-divider">
          <span>Or continue with</span>
        </div>

        <div className="auth-options">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="btn-social google"
          >
            🔵 Google
          </button>

          <button
            type="button"
            onClick={handleAnonymousSignIn}
            disabled={isLoading}
            className="btn-social anonymous"
          >
            👤 Guest
          </button>
        </div>

        <div className="auth-footer">
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="link-btn"
              >
                Sign Up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="link-btn"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
