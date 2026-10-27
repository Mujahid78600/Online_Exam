import React, { useEffect, useState } from 'react';
import axios from 'axios';

const InstructorProfile = ({ user, onUserUpdate }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [instructorProfile, setInstructorProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    date_of_birth: '',
    date_of_joining: '',
    cnic: '',
    phone: '',
    address: '',
    specialization: '',
    password: '',
    profile_image: user?.image || user?.profile_image || ''
  });

  const fetchFullProfile = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/extra/profile', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const u = res.data.user || {};
      const p = res.data.profile || {};
      const userImg = u.image || u.profile_image || '';

      setInstructorProfile({
        name: u.name || '',
        email: u.email || '',
        date_of_birth: p.date_of_birth ? p.date_of_birth.split('T')[0] : '',
        date_of_joining: p.date_of_joining ? p.date_of_joining.split('T')[0] : '',
        cnic: p.cnic || '',
        phone: p.phone || '',
        address: p.address || '',
        specialization: p.specialization || '',
        password: '',
        profile_image: userImg
      });

      if (userImg) {
        const formattedPath = encodeURI(userImg.replace(/\\\\/g, '/'));
        setImagePreview(`http://localhost:5000/${formattedPath}`);
      } else {
        setImagePreview(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFullProfile();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', instructorProfile.name);
      formData.append('cnic', instructorProfile.cnic);
      formData.append('phone', instructorProfile.phone);
      formData.append('date_of_birth', instructorProfile.date_of_birth);
      formData.append('specialization', instructorProfile.specialization);
      formData.append('address', instructorProfile.address);

      if (instructorProfile.password) formData.append('password', instructorProfile.password);
      if (selectedImage) formData.append('profile_image', selectedImage);

      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      };

      const res = await axios.put('http://localhost:5000/api/extra/profile', formData, config);

      if (res.data.user) {
        if (typeof onUserUpdate === 'function') {
          onUserUpdate(res.data.user);
        } else {
          localStorage.setItem('user', JSON.stringify(res.data.user));
          window.location.reload();
        }
      }

      alert('Profile and Image Updated Successfully!');
      fetchFullProfile();
    } catch (err) {
      alert('Failed to update profile');
    }
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="main-card">
      <h3 className="card-title">My Profile & Information</h3>
      <hr className="card-divider" />
      <form onSubmit={handleSaveProfile}>
        <div className="profile-upload-container">
  <div className="profile-avatar">
    {imagePreview ? ( <img src={imagePreview} alt="Profile Preview" /> ) :
      
     (
      <span className="profile-avatar-placeholder">
        {instructorProfile.name ? instructorProfile.name.charAt(0).toUpperCase() : 'U'}   
      </span>
     )}

    <label htmlFor="profileImageInput" className="profile-edit-icon" title="Change profile picture" >
      ✎
    </label>

    <input id="profileImageInput" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageFileChange}

      hidden
    />
  </div>
</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label>Full Name</label>
            <input type="text" value={instructorProfile.name}
              onChange={(e) => setInstructorProfile({ ...instructorProfile, name: e.target.value })} required />
          </div>
          <div>
            <label>Email Address (Read-only)</label>
            <input type="email" value={instructorProfile.email} disabled />
          </div>
          <div>
            <label>CNIC Number</label>
            <input type="text" placeholder="35201-XXXXXXX-X" value={instructorProfile.cnic}
              onChange={(e) => setInstructorProfile({ ...instructorProfile, cnic: e.target.value })} />
          </div>
          <div>
            <label>Phone Number</label>
            <input type="text" placeholder="0300-XXXXXXX" value={instructorProfile.phone}
              onChange={(e) => setInstructorProfile({ ...instructorProfile, phone: e.target.value })} />
          </div>
          <div>
            <label>Date of Birth</label>
            <input type="date" value={instructorProfile.date_of_birth}
              onChange={(e) => setInstructorProfile({ ...instructorProfile, date_of_birth: e.target.value })} />
          </div>
          <div>
            <label>Date of Joining</label>
            <input type="date" value={instructorProfile.date_of_joining} disabled />
             
          </div>
          <div>
            <label>Specialization</label>
            <input type="text" placeholder="e.g. CS / Web" value={instructorProfile.specialization}
              onChange={(e) => setInstructorProfile({ ...instructorProfile, specialization: e.target.value })} />
          </div>
          <div>
            <label>New Password (Optional)</label>
            <input type="password" placeholder="Leave blank if unchanged" value={instructorProfile.password}
              onChange={(e) => setInstructorProfile({ ...instructorProfile, password: e.target.value })} />
          </div>
        </div>

          <label>Residential Address</label>
          <textarea rows="3" placeholder="Complete Residential Address..." value={instructorProfile.address}
            onChange={(e) => setInstructorProfile({ ...instructorProfile, address: e.target.value })} />
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
          <button type="submit" className="success" >
            Save Complete Profile
          </button>
        </div>
      </form>
    </div>
  );
};

export default InstructorProfile;
