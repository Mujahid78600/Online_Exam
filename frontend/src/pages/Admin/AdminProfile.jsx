
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000';

const AdminProfile = ({ user, onUserUpdate }) => {
  const [adminProfile, setAdminProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    profile_image: user?.image || user?.profile_image || ''
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const getHeaders = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  });

  useEffect(() => {
    setAdminProfile((previous) => ({
      ...previous,
      name: user?.name || '',
      email: user?.email || '',
      profile_image:
        user?.image || user?.profile_image || ''
    }));

    const image = user?.image || user?.profile_image || '';

    if (image) {
      const formattedPath = encodeURI(image.replace(/\\/g, '/'));

      setImagePreview(
        /^https?:\/\//i.test(formattedPath)
          ? formattedPath
          : `${API_BASE}/${formattedPath.replace(/^\/+/, '')}`
      );
    } else {
      setImagePreview(null);
    }
  }, [user]);

  const updateField = (field, value) => {
    setAdminProfile((previous) => ({
      ...previous,
      [field]: value
    }));
  };

  const handleImageFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Please select a JPG, PNG, or WEBP image.');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must not exceed 5 MB.');
      event.target.value = '';
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    if (
      adminProfile.newPassword &&
      adminProfile.newPassword !== adminProfile.confirmPassword
    ) {
      alert('New password and confirm password do not match.');
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();

      formData.append('name', adminProfile.name);

      if (adminProfile.currentPassword) {
        formData.append(
          'currentPassword',
          adminProfile.currentPassword
        );
      }

      if (adminProfile.newPassword) {
        formData.append('newPassword', adminProfile.newPassword);
      }

      if (selectedImage) {
        formData.append('profile_image', selectedImage);
      }

      // Replace this endpoint/field names only if your
      // existing admin backend uses different ones.
      const response = await axios.put(
        `${API_BASE}/api/admin/profile`,
        formData,
        getHeaders()
      );

      if (response.data.user) {
        onUserUpdate?.(response.data.user);

        localStorage.setItem(
          'user',
          JSON.stringify(response.data.user)
        );
      }

      setSelectedImage(null);

      setAdminProfile((previous) => ({
        ...previous,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating admin profile:', error);

      alert(
        error.response?.data?.message ||
        'Failed to update profile. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="main-card">Loading profile...</div>;
  }

  return (
    <div className="main-card">
      <h3 className="card-title">My Profile</h3>
      <hr className="card-divider" />

      <form onSubmit={handleSaveProfile}>
        {/* Profile Picture */}
        <div className="profile-upload-container">
          <div className="profile-avatar">
            {imagePreview ? (
              <img
                className="avatar-preview-img"
                src={imagePreview}
                alt="Admin profile"
              />
            ) : (
              <span className="avatar-initial-txt">
                {adminProfile.name
                  ? adminProfile.name.charAt(0).toUpperCase()
                  : 'A'}
              </span>
            )}

            <label
              htmlFor="adminProfileImageInput"
              className="profile-edit-icon"
              title="Change profile picture"
            >
              ✎
            </label>

            <input
              id="adminProfileImageInput"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageFileChange}
              hidden
            />
          </div>
        </div>

        {/* Admin Profile Fields */}
        <div className="profile-fields-grid">
          <div>
            <label>Full Name</label>
            <input
              type="text"
              value={adminProfile.name}
              onChange={(e) => updateField('name', e.target.value)}
              required
            />
          </div>

          <div>
            <label>Email Address (Read-only)</label>
            <input
              className="readonly-input-box"
              type="email"
              value={adminProfile.email}
              disabled
            />
          </div>

          <div>
            <label>New Password (Optional)</label>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Leave blank if unchanged"
              value={adminProfile.newPassword}
              onChange={(e) =>
                updateField('newPassword', e.target.value)
              }
            />
          </div>

          <div>
            <label>Confirm New Password</label>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Confirm new password"
              value={adminProfile.confirmPassword}
              onChange={(e) =>
                updateField('confirmPassword', e.target.value)
              }
            />
          </div>

          <div>
            <label>Current Password</label>
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Required if changing password"
              value={adminProfile.currentPassword}
              onChange={(e) =>
                updateField('currentPassword', e.target.value)
              }
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="profile-submit-wrapper">
          <button
            type="submit"
            className="success profile-submit-button"
            disabled={saving}
          >
            {saving ? 'Saving Profile...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminProfile;
