
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'https://online-exam-evgn.vercel.app';

const StudentProfile = ({ user, onUserUpdate }) => {
  const [studentProfile, setStudentProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    date_of_birth: '',
    cnic: '',
    phone: '',
    department: '',
    class: '',
    address: '',
    password: '',
    profile_image: user?.image || user?.profile_image || ''
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const getHeaders = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  });

  // Fetch complete profile
  const fetchFullProfile = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/extra/profile`,
        getHeaders()
      );

      const fetchedUser = response.data.user || {};
      const profile = response.data.profile || {};
      const userImage =
        fetchedUser.image || fetchedUser.profile_image || '';

      setStudentProfile({
        name: fetchedUser.name || '',
        email: fetchedUser.email || '',
        date_of_birth: profile.date_of_birth
          ? profile.date_of_birth.split('T')[0]
          : '',
        cnic: profile.cnic || '',
        phone: profile.phone || '',
        department: profile.department || '',
        class: profile.class || '',
        address: profile.address || '',
        password: '',
        profile_image: userImage
      });

      if (userImage) {
        const formattedPath = encodeURI(
          userImage.replace(/\\/g, '/')
        );
        setImagePreview(
          `${API_BASE}/${formattedPath.replace(/^\/+/, '')}`
        );
      } else {
        setImagePreview(null);
      }

      if (typeof onUserUpdate === 'function') {
        onUserUpdate(fetchedUser);
      }
    } catch (error) {
      console.error('Error fetching student profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFullProfile();

  }, []);

  // Update individual profile fields
  const updateField = (field, value) => {
    setStudentProfile((previous) => ({
      ...previous,
      [field]: value
    }));
  };

  // Handle profile image selection
  const handleImageFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Please select a JPG, PNG, or WEBP image.');
      event.target.value = '';
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // Save profile and image
  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();

      [
        'name',
        'cnic',
        'phone',
        'date_of_birth',
        'department',
        'class',
        'address'
      ].forEach((field) => {
        formData.append(field, studentProfile[field] || '');
      });

      if (studentProfile.password) {
        formData.append('password', studentProfile.password);
      }

      if (selectedImage) {
        formData.append('profile_image', selectedImage);
      }

      const response = await axios.put(
        `${API_BASE}/api/extra/profile`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.user) {
        onUserUpdate?.(response.data.user);
        localStorage.setItem(
          'user',
          JSON.stringify(response.data.user)
        );
      }

      setSelectedImage(null);
      await fetchFullProfile();

      alert('Profile and image updated successfully!');
    } catch (error) {
      console.error('Error saving student profile:', error);
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
      <h3 className="card-title">My Profile & Information</h3>
      <hr className="card-divider" />

      <form onSubmit={handleSaveProfile}>
        {/* Profile Picture */}
        <div className="profile-upload-container">
          <div className="profile-avatar">
            {imagePreview ? (
              <img
                className="avatar-preview-img"
                src={imagePreview}
                alt="Profile preview"
              />
            ) : (
              <span className="avatar-initial-txt">
                {studentProfile.name
                  ? studentProfile.name.charAt(0).toUpperCase()
                  : 'U'}
              </span>
            )}

            <label
              htmlFor="profileImageInput"
              className="profile-edit-icon"
              title="Change profile picture"
            >
              ✎
            </label>

            <input
              id="profileImageInput"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageFileChange}
              hidden
            />
          </div>
        </div>

        {/* Profile Fields */}
        <div className="profile-fields-grid">
          <div>
            <label>Full Name</label>
            <input
              type="text"
              value={studentProfile.name}
              onChange={(e) => updateField('name', e.target.value)}
              required
            />
          </div>

          <div>
            <label>Email Address (Read-only)</label>
            <input
              className="readonly-input-box"
              type="email"
              value={studentProfile.email}
              disabled
            />
          </div>

          <div>
            <label>CNIC Number</label>
            <input
              type="text"
              placeholder="35201-XXXXXXX-X"
              value={studentProfile.cnic}
              onChange={(e) => updateField('cnic', e.target.value)}
            />
          </div>

          <div>
            <label>Phone Number</label>
            <input
              type="text"
              placeholder="0300-XXXXXXX"
              value={studentProfile.phone}
              onChange={(e) => updateField('phone', e.target.value)}
            />
          </div>

          <div>
            <label>Date of Birth</label>
            <input
              type="date"
              value={studentProfile.date_of_birth}
              onChange={(e) =>
                updateField('date_of_birth', e.target.value)
              }
            />
          </div>

          <div>
            <label>Department</label>
            <input
              type="text"
              placeholder="e.g. Computer Science"
              value={studentProfile.department}
              onChange={(e) =>
                updateField('department', e.target.value)
              }
            />
          </div>

          <div>
            <label>Class / Semester</label>
            <input
              type="text"
              placeholder="e.g. BSCS-6th"
              value={studentProfile.class}
              onChange={(e) =>
                updateField('class', e.target.value)
              }
            />
          </div>

          <div>
            <label>New Password (Optional)</label>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Leave blank if unchanged"
              value={studentProfile.password}
              onChange={(e) =>
                updateField('password', e.target.value)
              }
            />
          </div>
        </div>

        {/* Residential Address */}
        <div className="address-field-block">
          <label>Residential Address</label>
          <textarea
            rows="2"
            placeholder="Complete Residential Address..."
            value={studentProfile.address}
            onChange={(e) =>
              updateField('address', e.target.value)
            }
          />
        </div>

        {/* Save Button */}
        <div className="profile-submit-wrapper">
          <button
            type="submit"
            className="success profile-submit-button"
            disabled={saving}
          >
            {saving ? 'Saving Profile...' : 'Save Complete Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentProfile;
