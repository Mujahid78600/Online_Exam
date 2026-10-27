import React, { useState } from 'react';
import axios from 'axios';

const LoginRegister = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    cnic: '',
    phone: '',
    address: '',
    specialization: '',
    department: '',
    class: '',
    previous_degree: '',
    previous_grade: ''
  });

  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    try {
      const res = await axios.post(`http://localhost:5000${endpoint}`, formData);

      if (isLogin) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        onLoginSuccess(res.data.user);
      } else {
        alert(res.data.message);
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '11px 12px',
    marginTop: '6px',
    marginBottom: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '7px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '2px'
  };

  return (
    <div style={{ minHeight: '100vh', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px', boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: '550px', maxHeight: '90vh', borderRadius: '10px', boxShadow: '0 12px 35px rgba(0, 0, 0, 0.12)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        <div style={{ background: 'linear-gradient(135deg, #2563eb, #031f6e)', color: '#fff', padding: '12px', textAlign: 'center', flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>
            {isLogin ? 'Login to Portal' : 'Create Account'}
          </h2>

          <p style={{ margin: '3px 0 0', fontSize: '13px', opacity: 0.9 }}>
            {isLogin ? 'Sign in to continue to your account' : 'Register your account to continue'}
          </p>
        </div>

        <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>

          {error && (
            <div style={{ background: 'linear-gradient(270deg, #2563eb, #97bd04)', color: '#870108', padding: '10px 12px', borderRadius: '6px', marginBottom: '10px', fontSize: '16px', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {!isLogin && (
              <div style={{ display: 'grid', gridTemplateColumns: '30% 70%', gap: '12px' }}>

                <div>
                  <label style={labelStyle}>Role</label>
                  <select name="role" value={formData.role} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="student">Student</option>
                    <option value="instructor">Instructor</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input type="text" name="name" required value={formData.name} onChange={handleChange} placeholder="Enter your full name" style={inputStyle} />
                </div>

              </div>
            )}

            <label style={labelStyle}>Email Address</label>
            <input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="Enter email address" style={inputStyle} />

            <label style={labelStyle}>Password</label>
            <input type="password" name="password" required value={formData.password} onChange={handleChange} placeholder="Enter password" style={inputStyle} />




{!isLogin && formData.role === 'instructor' && (
  <>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

      <div>
        <label style={labelStyle}>CNIC</label>
        <input type="text" name="cnic" value={formData.cnic} onChange={handleChange} placeholder="XXXXX-XXXXXXX-X" style={inputStyle} />
      </div>

      <div>
        <label style={labelStyle}>Phone</label>
        <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="03XX-XXXXXXX" style={inputStyle} />
      </div>

    </div>

    <label style={labelStyle}>Specialization</label>
    <input type="text" name="specialization" value={formData.specialization} onChange={handleChange} placeholder="e.g. Computer Science" style={inputStyle} />
  </>
)}





            {!isLogin && formData.role === 'student' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

                  <div>
                    <label style={labelStyle}>Department</label>
                    <input type="text" name="department" value={formData.department} onChange={handleChange} placeholder="Department" style={inputStyle} />
                  </div>

                  <div>
                    <label style={labelStyle}>Class</label>
                    <input type="text" name="class" value={formData.class} onChange={handleChange} placeholder="Class" style={inputStyle} />
                  </div>

                </div>

                <label style={labelStyle}>CNIC</label>
                <input type="text" name="cnic" value={formData.cnic} onChange={handleChange} placeholder="XXXXX-XXXXXXX-X" style={inputStyle} />
              </>
            )}

            <button type="submit" style={{ width: '100%', padding: '12px', marginTop: '4px', background: 'linear-gradient(135deg, #2563eb, #031f6e)', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)' }}>
              {isLogin ? 'Login' : 'Submit Registration'}
            </button>

          </form>

          <div style={{ marginTop: '10px', paddingTop: '12px', borderTop: '2px solid #e5e7eb', textAlign: 'center' }}>
            <span style={{ fontSize: '16px', color: '#6b7280' }}>
              {isLogin ? "Don't have an account? " : 'Already registered? '}
            </span>

            <span onClick={() => { setIsLogin(!isLogin); setError(''); }} style={{ fontSize: '16px', color: '#2563eb', fontWeight: '700', cursor: 'pointer' }}>
              {isLogin ? 'Register' : 'Login'}
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginRegister;