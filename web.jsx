// WebSection.jsx
// Web Links Section with Click Tracking

import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import {
  updateDoc,
  doc,
  increment
} from 'firebase/firestore';
import '../styles/WebSection.css';

const WebSection = ({ webLinks, user, onAuthRequired, onNotification, ads }) => {
  const [clickCounts, setClickCounts] = useState({});

  useEffect(() => {
    // Initialize click counts
    const counts = {};
    webLinks.forEach(link => {
      counts[link.id] = link.clicks || 0;
    });
    setClickCounts(counts);
  }, [webLinks]);

  const handleWebLinkClick = async (linkId, url) => {
    try {
      // Track click in database
      const docRef = doc(db, 'web_links', linkId);
      await updateDoc(docRef, {
        clicks: increment(1)
      });

      // Update local state
      setClickCounts(prev => ({
        ...prev,
        [linkId]: (prev[linkId] || 0) + 1
      }));

      // Open link
      window.open(url, '_blank');
      onNotification('Link opened!', 'success');
    } catch (error) {
      console.error('Error tracking click:', error);
      // Still open the link even if tracking fails
      window.open(url, '_blank');
    }
  };

  return (
    <section className="web-section">
      <div className="section-header">
        <h2>🔗 Web Links</h2>
        <p>{webLinks.length} links available</p>
      </div>

      {/* Web Links Grid */}
      <div className="web-grid">
        {webLinks.map(link => (
          <div key={link.id} className="web-card">
            <div className="web-icon">{link.icon}</div>
            <div className="web-info">
              <h3>{link.title}</h3>
              <p className="web-url">{link.url}</p>
              <div className="web-stats">
                <span>🔗 {clickCounts[link.id] || 0} clicks</span>
              </div>
            </div>
            <button
              className="web-link-btn"
              onClick={() => handleWebLinkClick(link.id, link.url)}
            >
              Open Link →
            </button>
          </div>
        ))}
      </div>

      {/* Ad Below Web Links */}
      <div id="banner-ad-web" className="ad-space below-web">
        <div className="ad-placeholder">Advertisement</div>
      </div>
    </section>
  );
};

export default WebSection;
