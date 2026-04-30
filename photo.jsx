// PhotoSection.jsx
// Photo Content Section with Interactions

import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  increment
} from 'firebase/firestore';
import '../styles/PhotoSection.css';

const PhotoSection = ({ photos, user, onAuthRequired, onNotification, ads }) => {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoComments, setPhotoComments] = useState({});
  const [commentText, setCommentText] = useState('');
  const [likes, setLikes] = useState({});

  useEffect(() => {
    if (selectedPhoto) {
      loadPhotoComments(selectedPhoto.id);
      loadPhotoLikes(selectedPhoto.id);
    }
  }, [selectedPhoto]);

  const loadPhotoComments = async (photoId) => {
    try {
      const q = query(
        collection(db, 'comments'),
        where('contentId', '==', photoId),
        where('type', '==', 'photo')
      );
      const snapshot = await getDocs(q);
      const comments = await Promise.all(
        snapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();
          return {
            id: docSnapshot.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date()
          };
        })
      );
      setPhotoComments(prev => ({
        ...prev,
        [photoId]: comments.sort((a, b) => b.createdAt - a.createdAt)
      }));
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const loadPhotoLikes = async (photoId) => {
    try {
      const snapshot = await getDocs(collection(db, 'photos'));
      const photo = snapshot.docs.find(doc => doc.id === photoId);
      if (photo) {
        setLikes(prev => ({
          ...prev,
          [photoId]: photo.data().likes || 0
        }));
      }
    } catch (error) {
      console.error('Error loading likes:', error);
    }
  };

  const viewPhoto = async (photo) => {
    setSelectedPhoto(photo);
    updatePhotoViews(photo.id);
  };

  const updatePhotoViews = async (photoId) => {
    try {
      const docRef = doc(db, 'photos', photoId);
      await updateDoc(docRef, {
        views: increment(1)
      });
    } catch (error) {
      console.error('Error updating views:', error);
    }
  };

  const handleLikePhoto = async (photoId) => {
    if (!user) {
      onAuthRequired();
      return;
    }

    try {
      const docRef = doc(db, 'photos', photoId);
      await updateDoc(docRef, {
        likes: increment(1)
      });
      setLikes(prev => ({
        ...prev,
        [photoId]: (prev[photoId] || 0) + 1
      }));
      onNotification('👍 Liked!', 'success');
    } catch (error) {
      onNotification('Error liking photo: ' + error.message, 'error');
    }
  };

  const handleAddComment = async (photoId) => {
    if (!user) {
      onAuthRequired();
      return;
    }

    if (!commentText.trim()) {
      onNotification('Please enter a comment', 'error');
      return;
    }

    try {
      await addDoc(collection(db, 'comments'), {
        contentId: photoId,
        type: 'photo',
        userId: user.uid,
        userEmail: user.email,
        text: commentText,
        createdAt: new Date(),
        likes: 0
      });

      setCommentText('');
      loadPhotoComments(photoId);
      onNotification('Comment added!', 'success');
    } catch (error) {
      onNotification('Error adding comment: ' + error.message, 'error');
    }
  };

  const handleSharePhoto = (photo) => {
    if (navigator.share) {
      navigator.share({
        title: photo.title,
        text: 'Check out this amazing photo!',
        url: window.location.href
      });
    } else {
      onNotification('Share link: ' + window.location.href, 'info');
    }
  };

  return (
    <section className="photo-section">
      <div className="section-header">
        <h2>🖼️ Photo Gallery</h2>
        <p>{photos.length} photos available</p>
      </div>

      {/* Photo Grid */}
      <div className="photo-grid">
        {photos.map(photo => (
          <div key={photo.id} className="photo-card">
            <div
              className="photo-thumbnail"
              onClick={() => viewPhoto(photo)}
            >
              <img src={photo.url} alt={photo.title} loading="lazy" />
              <div className="photo-overlay">
                <button className="view-btn">👁️ View</button>
              </div>
            </div>
            <div className="photo-info">
              <h3>{photo.title}</h3>
              <div className="photo-stats">
                <span>👁️ {photo.views || 0}</span>
                <span>👍 {likes[photo.id] || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <div className="photo-modal">
          <div className="modal-overlay" onClick={() => setSelectedPhoto(null)} />
          <div className="modal-content">
            <button
              className="close-btn"
              onClick={() => setSelectedPhoto(null)}
            >
              ✕
            </button>

            <div className="photo-viewer">
              <img src={selectedPhoto.url} alt={selectedPhoto.title} />

              <div className="photo-details">
                <h2>{selectedPhoto.title}</h2>

                {/* Photo Actions */}
                <div className="photo-actions">
                  <button
                    className="action-btn"
                    onClick={() => handleLikePhoto(selectedPhoto.id)}
                  >
                    👍 Like ({likes[selectedPhoto.id] || 0})
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => handleSharePhoto(selectedPhoto)}
                  >
                    📤 Share
                  </button>
                </div>

                {/* Ad Below Photo */}
                <div id="banner-ad-photo" className="ad-space below-photo">
                  <div className="ad-placeholder">Advertisement</div>
                </div>

                {/* Comments Section */}
                <div className="comments-section">
                  <h3>💬 Comments ({(photoComments[selectedPhoto.id] || []).length})</h3>

                  {user && (
                    <div className="comment-form">
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="comment-input"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleAddComment(selectedPhoto.id);
                          }
                        }}
                      />
                      <button
                        className="btn-submit"
                        onClick={() => handleAddComment(selectedPhoto.id)}
                      >
                        Post
                      </button>
                    </div>
                  )}

                  <div className="comments-list">
                    {(photoComments[selectedPhoto.id] || []).map(comment => (
                      <div key={comment.id} className="comment-item">
                        <div className="comment-header">
                          <strong>{comment.userEmail}</strong>
                          <span className="comment-time">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="comment-text">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default PhotoSection;
