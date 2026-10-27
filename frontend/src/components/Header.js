
import React, { useState, useEffect } from 'react';

const Header = ({ user, onLogout }) => {
  const [imageError, setImageError] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sync user data with props or localStorage
  useEffect(() => {
    if (user) {
      setCurrentUser(user);
      setImageError(false);
    } else {
      const storedUser = localStorage.getItem('user');

      if (storedUser) {
        try {
          setCurrentUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Error parsing stored user in Header:', error);
        }
      }
    }
  }, [user]);

  // Toggle mobile sidebar
  const toggleSidebar = () => {
    const sidebar = document.querySelector('aside');

    if (sidebar) {
      const isOpen = sidebar.classList.toggle('open');
      setSidebarOpen(isOpen);
    }
  };

  // User avatar fallback letter
  const firstLetter = currentUser?.name
    ? currentUser.name.charAt(0).toUpperCase()
    : 'U';

  // Support both image fields
  const rawImagePath =
    currentUser?.image || currentUser?.profile_image;

  // Format image path
  const formattedImagePath = rawImagePath
    ? encodeURI(rawImagePath.replace(/\\/g, '/'))
    : null;

  // Resolve image URL
  const imageUrl = formattedImagePath
    ? formattedImagePath.startsWith('http')
      ? formattedImagePath
      : `http://localhost:5000/${formattedImagePath}`
    : null;

  return (
    <header>
      <div className="header-left">
        <button
          type="button"
          className="hamburger-btn"
          onClick={toggleSidebar}
          aria-label="Toggle Sidebar"
          aria-expanded={sidebarOpen}
        >
          ☰
        </button>

        <h2>Online Exams App</h2>
      </div>

      <div className="header-right">
        <div className="header-user-info">
          {imageUrl && !imageError ? (
            <img
              className="header-profile-image"
              src={imageUrl}
              alt="Profile"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="header-avatar-fallback">
              {firstLetter}
            </div>
          )}

          <span className="header-user-name">
            {currentUser?.name || 'User'}
          </span>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="danger header-logout-btn"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
