
import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { filterTableById } from '../../utils/tableSearch';

const API_BASE = 'http://localhost:5000';

const ManageUsers = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState(null);

  const getHeaders = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  });

  // Fetch all users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.get(
        `${API_BASE}/api/admin/users`,
        getHeaders()
      );

      setAllUsers(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      console.error('Failed to load users:', err);

      setError('Unable to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Activate / Suspend user
  const handleStatusToggle = async (userId, currentStatus) => {
    const newStatus =
      currentStatus === 'active' ? 'inactive' : 'active';

    setUpdatingUserId(userId);

    try {
      await axios.put(
        `${API_BASE}/api/admin/users/${userId}/status`,
        { status: newStatus },
        getHeaders()
      );

      await fetchUsers();

      alert('User status updated successfully!');
    } catch (err) {
      console.error('Failed to update user status:', err);

      alert(
        err.response?.data?.message ||
        'Failed to update user status.'
      );
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Admin users ko list se exclude karna
  const visibleUsers = allUsers.filter(
    (user) => user.role !== 'admin'
  );

  return (
    <div className="main-card">
      <div className="card-header-wrapper">
        <h3 className="card-title">
          Manage System Users
        </h3>
      </div>

      <hr className="card-divider" />

      {/* Search */}
      <input
        type="text"
        placeholder="Search Users by Name or Email..."
        style={{
          width: '320px',
          maxWidth: '100%',
          marginBottom: 16
        }}
        onChange={(event) =>
          filterTableById(
            'adminUsersTable',
            event.target.value
          )
        }
      />

      {/* Loading */}
      {loading && (
        <p role="status">Loading users...</p>
      )}

      {/* Error */}
      {error && (
        <div role="alert">
          <p>{error}</p>

          <button
            type="button"
            onClick={fetchUsers}
            disabled={loading}
          >
            Retry
          </button>
        </div>
      )}

      {/* Users Table */}
      <div style={{ overflowX: 'auto' }}>
        <table id="adminUsersTable">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {!loading && visibleUsers.map((user) => (
              <tr key={user._id}>
                <td>
                  <strong>{user.name || '—'}</strong>
                </td>

                <td>{user.email || '—'}</td>

                <td>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      background:
                        user.role === 'student'
                          ? '#e0f2fe'
                          : '#f0fdf4',
                      color:
                        user.role === 'student'
                          ? '#0369a1'
                          : '#166534',
                      fontWeight: 'bold'
                    }}
                  >
                    {(user.role || 'unknown').toUpperCase()}
                  </span>
                </td>

                <td>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      background:
                        user.status === 'active'
                          ? '#dcfce7'
                          : '#fee2e2',
                      color:
                        user.status === 'active'
                          ? '#166534'
                          : '#991b1b',
                      fontWeight: 'bold'
                    }}
                  >
                    {user.status || 'unknown'}
                  </span>
                </td>

                <td>
                  <button
                    type="button"
                    className={
                      user.status === 'active'
                        ? 'danger'
                        : 'success'
                    }
                    disabled={updatingUserId === user._id}
                    onClick={() =>
                      handleStatusToggle(
                        user._id,
                        user.status
                      )
                    }
                  >
                    {updatingUserId === user._id
                      ? 'Updating...'
                      : user.status === 'active'
                        ? 'Suspend'
                        : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}

            {!loading &&
              !error &&
              visibleUsers.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center' }}>
                    No users found.
                  </td>
                </tr>
              )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageUsers;
