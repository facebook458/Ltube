// UserPanel.jsx
// Main User Interface for EarningContent Platform

import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase-config';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import VideoSection from './VideoSection';
import PhotoSection from './PhotoSection';
import WebSection from './WebSection';
import AuthModal from './AuthModal';
import '../styles/UserPanel.css';

const UserPanel = () => {
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [videos, setVideos] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [webLinks, setWebLinks] = useState([]);
  const [ads, setAds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState('');

  // Initialize
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Load content
  useEffect(() => {
    loadAllContent();
  }, []);

  const loadAllContent = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadVideos(),
        loadPhotos(),
        loadWebLinks(),
        loadAds()
      ]);
    } catch (error) {
      console.error('Error loading content:', error);
    }
    setIsLoading(false);
  };

  const loadVideos = async () => {
    try {
      const q = query(
        collection(db, 'videos'),
        where('active', '==', true),
        orderBy('created_at', 'desc')
      );
      const snapshot = await getDocs(q);
      setVideos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error loading videos:', error);
    }
  };

  const loadPhotos = async () => {
    try {
      const q = query(
        collection(db, 'photos'),
        where('active', '==', true),
        orderBy('created_at', 'desc')
      );
      const snapshot = await getDocs(q);
      setPhotos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  const loadWebLinks = async () => {
    try {
      const q = query(
        collection(db, 'web_links'),
        where('active', '==', true),
        orderBy('created_at', 'desc')
      );
      const snapshot = await getDocs(q);
      setWebLinks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error loading web links:', error);
    }
  };

  const loadAds = async () => {
    try {
      const q = query(
        collection(db, 'ads_config'),
        where('active', '==', true)
      );
      const snapshot = await getDocs(q);
      const adsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAds(adsData);
      
      // Inject ad scripts
      injectAdScripts(adsData);
    } catch (error) {
      console.error('Error loading ads:', error);
    }
  };

  const injectAdScripts = (adsData) => {
    adsData.forEach(ad => {
      try {
        // Create script element
        const script = document.createElement('script');
        script.innerHTML = ad.scriptCode;
        script.async = true;

        // Inject based on placement
        const placementMap = {
          'below-video': 'banner-ad-video',
          'below-photo': 'banner-ad-photo',
          'below-web': 'banner-ad-web',
          'pre-roll': 'ad-preroll',
          'popup': 'ad-popup'
        };

        const targetId = placementMap[ad.placement];
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
          targetElement.appendChild(script);
        }
      } catch (error) {
        console.error('Error injecting ad script:', error);
      }
    });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      showNotification('Error logging out: ' + error.message, 'error');
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(''), 3000);
  };

  return (
    <div className="user-panel">
      {/* Header */}
      <header className="user-header">
        <div className="header-left">
          <h1 className="logo">🎬 EarningContent</h1>
          <p className="tagline">Watch • Earn • Share</p>
        </div>
        <div className="header-right">
          {user ? (
            <div className="user-menu">
              <span className="user-email">{user.email || 'User'}</span>
              <button className="btn-logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <button
              className="btn-login"
              onClick={() => setShowAuthModal(true)}
            >
              Sign In / Sign Up
            </button>
          )}
        </div>
      </header>

      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            showNotification('Logged in successfully!', 'success');
          }}
        />
      )}

      {/* Main Content */}
      <main className="user-content">
        {isLoading ? (
          <div className="loading-spinner">
            <p>Loading content...</p>
          </div>
        ) : (
          <>
            {/* Video Section */}
            {videos.length > 0 && (
              <VideoSection
                videos={videos}
                user={user}
                onAuthRequired={() => setShowAuthModal(true)}
                onNotification={showNotification}
                ads={ads.filter(ad => ['pre-roll', 'below-video'].includes(ad.placement))}
              />
            )}

            {/* Photo Section */}
            {photos.length > 0 && (
              <PhotoSection
                photos={photos}
                user={user}
                onAuthRequired={() => setShowAuthModal(true)}
                onNotification={showNotification}
                ads={ads.filter(ad => ['below-photo'].includes(ad.placement))}
              />
            )}

            {/* Web Section */}
            {webLinks.length > 0 && (
              <WebSection
                webLinks={webLinks}
                user={user}
                onAuthRequired={() => setShowAuthModal(true)}
                onNotification={showNotification}
                ads={ads.filter(ad => ['below-web'].includes(ad.placement))}
              />
            )}

            {/* Empty State */}
            {videos.length === 0 && photos.length === 0 && webLinks.length === 0 && (
              <div className="empty-state">
                <p>📭 No content available yet.</p>
                <p>Check back soon!</p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="user-footer">
        <p>© 2024 EarningContent Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default UserPanel;
