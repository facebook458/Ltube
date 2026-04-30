// VideoSection.jsx
// Video Content Section with Pre-roll Ads and Interactions

import React, { useState, useRef, useEffect } from 'react';
import { db } from '../firebase-config';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  increment,
  deleteDoc
} from 'firebase/firestore';
import '../styles/VideoSection.css';

const VideoSection = ({ videos, user, onAuthRequired, onNotification, ads }) => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showPreroll, setShowPreroll] = useState(false);
  const [prerollTimeLeft, setPrerollTimeLeft] = useState(5);
  const [videoComments, setVideoComments] = useState({});
  const [commentText, setCommentText] = useState('');
  const [likes, setLikes] = useState({});
  const [newComment, setNewComment] = useState('');
  const videoRef = useRef(null);
  const prerollTimerRef = useRef(null);

  // Load comments and likes
  useEffect(() => {
    if (selectedVideo) {
      loadVideoComments(selectedVideo.id);
      loadVideoLikes(selectedVideo.id);
    }
  }, [selectedVideo]);

  // Pre-roll timer
  useEffect(() => {
    if (showPreroll && prerollTimeLeft > 0) {
      prerollTimerRef.current = setTimeout(() => {
        setPrerollTimeLeft(prerollTimeLeft - 1);
      }, 1000);
    } else if (showPreroll && prerollTimeLeft === 0) {
      setShowPreroll(false);
      videoRef.current?.play();
    }
    return () => clearTimeout(prerollTimerRef.current);
  }, [showPreroll, prerollTimeLeft]);

  const loadVideoComments = async (videoId) => {
    try {
      const q = query(
        collection(db, 'comments'),
        where('contentId', '==', videoId),
        where('type', '==', 'video')
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
      setVideoComments(prev => ({
        ...prev,
        [videoId]: comments.sort((a, b) => b.createdAt - a.createdAt)
      }));
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const loadVideoLikes = async (videoId) => {
    try {
      const snapshot = await getDocs(collection(db, 'videos'));
      const video = snapshot.docs.find(doc => doc.id === videoId);
      if (video) {
        setLikes(prev => ({
          ...prev,
          [videoId]: video.data().likes || 0
        }));
      }
    } catch (error) {
      console.error('Error loading likes:', error);
    }
  };

  const playVideo = (video) => {
    setSelectedVideo(video);
    setShowPreroll(true);
    setPrerollTimeLeft(5);
    
    // Increment views
    updateVideoViews(video.id);
  };

  const updateVideoViews = async (videoId) => {
    try {
      const docRef = doc(db, 'videos', videoId);
      await updateDoc(docRef, {
        views: increment(1)
      });
    } catch (error) {
      console.error('Error updating views:', error);
    }
  };

  const handleLikeVideo = async (videoId) => {
    if (!user) {
      onAuthRequired();
      return;
    }

    try {
      const docRef = doc(db, 'videos', videoId);
      await updateDoc(docRef, {
        likes: increment(1)
      });
      setLikes(prev => ({
        ...prev,
        [videoId]: (prev[videoId] || 0) + 1
      }));
      onNotification('👍 Liked!', 'success');
    } catch (error) {
      onNotification('Error liking video: ' + error.message, 'error');
    }
  };

  const handleAddComment = async (videoId) => {
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
        contentId: videoId,
        type: 'video',
        userId: user.uid,
        userEmail: user.email,
        text: commentText,
        createdAt: new Date(),
        likes: 0
      });

      setCommentText('');
      loadVideoComments(videoId);
      onNotification('Comment added!', 'success');
    } catch (error) {
      onNotification('Error adding comment: ' + error.message, 'error');
    }
  };

  const handleShareVideo = (video) => {
    if (navigator.share) {
      navigator.share({
        title: video.title,
        text: 'Check out this amazing video!',
        url: window.location.href
      });
    } else {
      onNotification('Share link: ' + window.location.href, 'info');
    }
  };

  const skipPreroll = () => {
    setShowPreroll(false);
    videoRef.current?.play();
  };

  return (
    <section className="video-section">
      <div className="section-header">
        <h2>🎥 Featured Videos</h2>
        <p>{videos.length} videos available</p>
      </div>

      {/* Video Grid */}
      <div className="video-grid">
        {videos.map(video => (
          <div key={video.id} className="video-card">
            <div
              className="video-thumbnail"
              onClick={() => playVideo(video)}
            >
              <video src={video.url} />
              <div className="play-overlay">
                <button className="play-btn">▶</button>
              </div>
              <div className="video-duration">
                <span>Video</span>
              </div>
            </div>
            <div className="video-info">
              <h3>{video.title}</h3>
              <div className="video-stats">
                <span>👁️ {video.views || 0}</span>
                <span>👍 {likes[video.id] || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Video Player Modal */}
      {selectedVideo && (
        <div className="video-modal">
          <div className="modal-overlay" onClick={() => setSelectedVideo(null)} />
          <div className="modal-content">
            <button
              className="close-btn"
              onClick={() => setSelectedVideo(null)}
            >
              ✕
            </button>

            {/* Pre-roll Ad */}
            {showPreroll && (
              <div className="preroll-ad-container">
                <div id="ad-preroll" className="ad-space preroll">
                  {/* Ad will be injected here */}
                  <div className="ad-placeholder">
                    <p>Advertisement</p>
                  </div>
                </div>
                <div className="skip-timer">
                  <p>Ad: {prerollTimeLeft}s</p>
                  {prerollTimeLeft === 0 ? (
                    <p className="skip-ready">Ready to skip</p>
                  ) : (
                    <p className="skip-countdown">Skip in {prerollTimeLeft}s</p>
                  )}
                </div>
              </div>
            )}

            {/* Video Player */}
            {!showPreroll && (
              <>
                <video
                  ref={videoRef}
                  className="video-player"
                  controls
                  autoPlay
                >
                  <source src={selectedVideo.url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>

                <div className="video-details">
                  <h2>{selectedVideo.title}</h2>

                  {/* Video Stats */}
                  <div className="video-actions">
                    <button
                      className="action-btn"
                      onClick={() => handleLikeVideo(selectedVideo.id)}
                    >
                      👍 Like ({likes[selectedVideo.id] || 0})
                    </button>
                    <button
                      className="action-btn"
                      onClick={() => handleShareVideo(selectedVideo)}
                    >
                      📤 Share
                    </button>
                  </div>

                  {/* Ad Below Video */}
                  <div id="banner-ad-video" className="ad-space below-video">
                    {/* Banner ad will be injected here */}
                    <div className="ad-placeholder">Advertisement</div>
                  </div>

                  {/* Comments Section */}
                  <div className="comments-section">
                    <h3>💬 Comments ({(videoComments[selectedVideo.id] || []).length})</h3>

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
                              handleAddComment(selectedVideo.id);
                            }
                          }}
                        />
                        <button
                          className="btn-submit"
                          onClick={() => handleAddComment(selectedVideo.id)}
                        >
                          Post
                        </button>
                      </div>
                    )}

                    <div className="comments-list">
                      {(videoComments[selectedVideo.id] || []).map(comment => (
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
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default VideoSection;
