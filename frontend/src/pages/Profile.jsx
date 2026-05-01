import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { User, Mail, Shield, BadgeCheck, Camera } from 'lucide-react';
import { authService } from '../api/authService';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    department: user?.department || '',
    email: user?.email || '',
    soundNotify: user?.soundNotify || false,
    emailNotify: user?.emailNotify || false,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Re-sync if user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        department: user.department || '',
        email: user.email || '',
        soundNotify: user.soundNotify || false,
        emailNotify: user.emailNotify || false,
      });
    }
  }, [user]);

  const initials = (name = '') =>
    name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.updateProfile(formData);
      toast.success('Profile updated successfully!');
      
      // Update global context by fetching fresh data
      const response = await authService.getMe();
      if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
        setUser(response.data);
      }
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords don't match!");
      return;
    }
    setPasswordLoading(true);
    try {
      await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password changed successfully!');
      setIsChangingPassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || error.response?.data?.message || 'Failed to change password.';
      toast.error(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="profile-container fade-in">
      <header className="profile__header">
        <h1 className="profile__title">User Profile</h1>
        <p className="profile__subtitle">Manage your personal information and account settings</p>
      </header>

      <div className="profile__content">
        {/* Profile Card */}
        <div className="profile__card">
          <div className="profile__avatar-section">
            <div className="profile__avatar-wrapper">
              <div className="profile__avatar-large">
                {initials(user?.name)}
              </div>
            </div>
            <div className="profile__identity">
              <h2 className="profile__name">{user?.name || 'User Name'}</h2>
              <span className="profile__role-badge">
                <Shield size={14} />
                {user?.role || 'USER'}
              </span>
            </div>
          </div>

          <hr className="profile__divider" />

          {isEditing ? (
            <form onSubmit={handleSubmit} className="profile__edit-form">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Email Address (Read Only)</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  value={formData.email}
                  readOnly
                  disabled
                  style={{ opacity: 0.6 }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-input"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+94 77 123 4567"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Department</label>
                <input
                  type="text"
                  name="department"
                  className="form-input"
                  value={formData.department}
                  onChange={handleInputChange}
                  placeholder="e.g. IT Faculty"
                />
              </div>

              <div className="form-actions" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="profile__details">
              <div className="profile__detail-item">
                <div className="profile__detail-icon"><User size={20} /></div>
                <div className="profile__detail-info">
                  <label>Full Name</label>
                  <p>{user?.name}</p>
                </div>
              </div>

              <div className="profile__detail-item">
                <div className="profile__detail-icon"><Mail size={20} /></div>
                <div className="profile__detail-info">
                  <label>Email Address</label>
                  <p>{user?.email || 'not-provided@matrix.com'}</p>
                </div>
              </div>

              <div className="profile__detail-item">
                <div className="profile__detail-icon"><BadgeCheck size={20} /></div>
                <div className="profile__detail-info">
                  <label>Department</label>
                  <p>{user?.department || 'Not specified'}</p>
                </div>
              </div>
              
              <div className="profile__detail-item">
                <div className="profile__detail-icon"><BadgeCheck size={20} /></div>
                <div className="profile__detail-info">
                  <label>Phone Number</label>
                  <p>{user?.phone || 'Not specified'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Change Password Card (Visible when changing password) */}
        {isChangingPassword && (
          <div className="profile__card" style={{ marginTop: '20px' }}>
            <h3>Change Password</h3>
            <hr className="profile__divider" style={{ margin: '10px 0 20px' }} />
            <form onSubmit={handlePasswordSubmit} className="profile__edit-form">
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  className="form-input"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  className="form-input"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  className="form-input"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  minLength={6}
                />
              </div>
              <div className="form-actions" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsChangingPassword(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={passwordLoading}>
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Quick Actions Card */}
        <div className="profile__actions">
          <h3>Account Actions</h3>
          <div className="profile__action-buttons">
            {!isEditing && (
              <button className="btn btn-primary" onClick={() => setIsEditing(true)}>Edit Profile</button>
            )}
            {!isChangingPassword && (
              <button className="btn btn-outline" onClick={() => setIsChangingPassword(true)}>Change Password</button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .profile-container {
          padding: var(--space-8);
          max-width: 800px;
          margin: 0 auto;
        }
        .profile__header { margin-bottom: var(--space-8); }
        .profile__title { font-size: 1.875rem; font-weight: 700; color: var(--clr-text); }
        .profile__subtitle { color: var(--clr-text-3); margin-top: var(--space-2); }

        .profile__card {
          background: var(--clr-surface);
          border: 1px solid var(--clr-border);
          border-radius: var(--radius-lg);
          padding: var(--space-8);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .profile__avatar-section {
          display: flex;
          align-items: center;
          gap: var(--space-6);
          margin-bottom: var(--space-6);
        }

        .profile__avatar-wrapper { position: relative; }
        .profile__avatar-large {
          width: 100px; height: 100px;
          background: linear-gradient(135deg, var(--clr-primary), var(--clr-secondary));
          color: white; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 2rem; font-weight: 700;
        }

        .profile__avatar-edit {
          position: absolute; bottom: 0; right: 0;
          background: var(--clr-surface);
          border: 1px solid var(--clr-border);
          padding: 8px; border-radius: 50%;
          cursor: pointer; box-shadow: var(--shadow-sm);
        }

        .profile__role-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(99, 102, 241, 0.1);
          color: var(--clr-primary);
          padding: 4px 12px; border-radius: 20px;
          font-size: 0.75rem; font-weight: 600; text-transform: uppercase;
          margin-top: 8px;
        }

        .profile__divider { border: 0; border-top: 1px solid var(--clr-border); margin: var(--space-6) 0; }

        .profile__details {
          display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6);
        }

        .profile__detail-item { display: flex; gap: var(--space-4); align-items: flex-start; }
        .profile__detail-icon { color: var(--clr-primary); margin-top: 4px; }
        .profile__detail-info label { display: block; font-size: 0.75rem; color: var(--clr-text-3); text-transform: uppercase; }
        .profile__detail-info p { font-weight: 500; color: var(--clr-text); margin-top: 2px; }

        .status-active { color: #10b981; font-weight: 600; }

        .profile__actions { margin-top: var(--space-6); }
        .profile__action-buttons { display: flex; gap: var(--space-3); margin-top: var(--space-3); }
        
        @media (max-width: 640px) {
          .profile__details { grid-template-columns: 1fr; }
          .profile__avatar-section { flex-direction: column; text-align: center; }
        }
      `}</style>
    </div>
  );
}