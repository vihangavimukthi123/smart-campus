import React, { useState, useEffect } from 'react';
import api from '../api/axiosInstance';
import { 
  Search, UserPlus, Edit, Trash2, X, 
  ShieldCheck, Wrench, Users, Filter 
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

// API Configuration
const API_URL = '/admin/users';

export default function AdminUserPage() {
    const [users, setUsers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', role: 'USER', phone: '', department: ''
    });

    const loadUsers = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(API_URL);
            setUsers(data);
        } catch (err) {
            console.error("Failed to load users", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadUsers(); }, []);

    const handleOpenModal = (user = null) => {
        if (user) {
            setSelectedUser(user);
            setFormData(user);
        } else {
            setSelectedUser(null);
            setFormData({ name: '', email: '', password: '', role: 'USER', phone: '', department: '' });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (selectedUser) {
                await api.put(`${API_URL}/${selectedUser.userId}`, formData);
            } else {
                await api.post(API_URL, formData);
            }
            setIsModalOpen(false);
            loadUsers();
        } catch (err) {
            alert(err.response?.data || "Operation failed");
        }
    };

    const handleDelete = (id) => {
        setUserToDelete(id);
        setShowConfirmModal(true);
    };

    const executeDelete = async () => {
        try {
            await api.delete(`${API_URL}/${userToDelete}`);
            loadUsers();
        } catch (err) {
            alert("Delete failed");
        }
    };

    return (
        <div className="admin-page-container fade-in">
            {/* Header Section */}
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">User Management</h1>
                    <p className="admin-subtitle">System administration & role control</p>
                </div>
                <button className="add-user-btn" onClick={() => handleOpenModal()}>
                    <UserPlus size={18} />
                    <span>Add New User</span>
                </button>
            </div>

            {/* Quick Stats */}
            <div className="admin-stats-grid">
                <div className="mini-stat-card">
                    <Users className="icon-blue" />
                    <div><h4>{users.length}</h4><p>Total Users</p></div>
                </div>
                <div className="mini-stat-card">
                    <Wrench className="icon-green" />
                    <div><h4>{users.filter(u => u.role === 'TECHNICIAN').length}</h4><p>Technicians</p></div>
                </div>
                <div className="mini-stat-card">
                    <ShieldCheck className="icon-red" />
                    <div><h4>{users.filter(u => u.role === 'ADMIN').length}</h4><p>Admins</p></div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="search-filter-card">
                <Search size={20} className="search-icon" />
                <input 
                    type="text" 
                    placeholder="Search users by name or email..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* User Table */}
            <div className="table-container shadow-card">
                {loading ? (
                    <div className="loader">Loading...</div>
                ) : (
                    <table className="admin-data-table">
                        <thead>
                            <tr>
                                <th>Identity</th>
                                <th>Role</th>
                                <th>Department</th>
                                <th>Contact</th>
                                <th style={{textAlign: 'right'}}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())).map(user => (
                                <tr key={user.userId}>
                                    <td>
                                        <div className="user-info">
                                            <div className="user-avatar">{user.name.charAt(0)}</div>
                                            <div>
                                                <div className="user-name">{user.name}</div>
                                                <div className="user-email">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`role-badge role-${user.role.toLowerCase()}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td>{user.department || 'N/A'}</td>
                                    <td>{user.phone || 'N/A'}</td>
                                    <td style={{textAlign: 'right'}}>
                                        <div className="action-btns">
                                            <button className="edit-btn" onClick={() => handleOpenModal(user)}><Edit size={16} /></button>
                                            <button className="delete-btn" onClick={() => handleDelete(user.userId)}><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal - Popup Form */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <div className="modal-header">
                            <h3>{selectedUser ? 'Update User Details' : 'Register New User'}</h3>
                            <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSave} className="modal-form">
                            <div className="input-group">
                                <label>Full Name</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                            </div>
                            <div className="input-group">
                                <label>Email Address</label>
                                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                            </div>
                            {!selectedUser && (
                                <div className="input-group">
                                    <label>Password</label>
                                    <input type="password" onChange={e => setFormData({...formData, password: e.target.value})} required />
                                </div>
                            )}
                            <div className="form-row">
                                <div className="input-group">
                                    <label>Role</label>
                                    <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                                        <option value="USER">STUDENT</option>
                                        <option value="TECHNICIAN">TECHNICIAN</option>
                                        <option value="ADMIN">ADMIN</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>Department</label>
                                    <input type="text" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
                                </div>
                            </div>
                            <div className="input-group">
                                <label>Phone Number</label>
                                <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                            </div>
                            <button type="submit" className="save-btn">
                                {selectedUser ? 'Update User' : 'Create User'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={executeDelete}
                title="Delete User"
                message="Are you sure you want to delete this user? This action cannot be undone and will remove all associated data."
                confirmText="Delete"
                type="danger"
            />

            <style>{`
                .admin-page-container { padding: 2rem; max-width: 1200px; margin: 0 auto; }
                .admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                .admin-title { font-size: 1.8rem; font-weight: 700; color: #fff; }
                .admin-subtitle { color: #94a3b8; font-size: 0.9rem; }
                
                .add-user-btn { 
                    background: #6366f1; color: white; border: none; padding: 0.7rem 1.2rem; 
                    border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px;
                    transition: 0.3s; font-weight: 500;
                }
                .add-user-btn:hover { background: #4f46e5; transform: translateY(-2px); }

                .admin-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 2rem; }
                .mini-stat-card { 
                    background: #1e293b; border: 1px solid #334155; padding: 1.2rem; 
                    border-radius: 12px; display: flex; align-items: center; gap: 1rem;
                }
                .mini-stat-card h4 { font-size: 1.5rem; margin: 0; color: #fff; }
                .mini-stat-card p { font-size: 0.8rem; margin: 0; color: #94a3b8; }
                .icon-blue { color: #6366f1; } .icon-green { color: #10b981; } .icon-red { color: #ef4444; }

                .search-filter-card { 
                    background: #1e293b; border: 1px solid #334155; padding: 1rem; 
                    border-radius: 12px; display: flex; align-items: center; gap: 12px; margin-bottom: 1.5rem;
                }
                .search-filter-card input { 
                    background: transparent; border: none; color: white; width: 100%; outline: none; font-size: 1rem;
                }
                .search-icon { color: #64748b; }

                .shadow-card { background: #1e293b; border-radius: 12px; border: 1px solid #334155; overflow: hidden; }
                .admin-data-table { width: 100%; border-collapse: collapse; text-align: left; }
                .admin-data-table th { background: #0f172a; padding: 1rem; font-size: 0.85rem; color: #94a3b8; text-transform: uppercase; }
                .admin-data-table td { padding: 1rem; border-bottom: 1px solid #334155; color: #e2e8f0; font-size: 0.9rem; }
                
                .user-info { display: flex; align-items: center; gap: 12px; }
                .user-avatar { 
                    width: 36px; height: 36px; background: #6366f1; border-radius: 50%; 
                    display: flex; align-items: center; justify-content: center; font-weight: bold;
                }
                .user-name { font-weight: 600; }
                .user-email { font-size: 0.8rem; color: #94a3b8; }

                .role-badge { padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 700; }
                .role-admin { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid #ef4444; }
                .role-technician { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid #10b981; }
                .role-user { background: rgba(14, 165, 233, 0.1); color: #0ea5e9; border: 1px solid #0ea5e9; }

                .action-btns { display: flex; justify-content: flex-end; gap: 8px; }
                .edit-btn, .delete-btn { 
                    background: #334155; border: none; color: #94a3b8; padding: 6px; 
                    border-radius: 6px; cursor: pointer; transition: 0.2s;
                }
                .edit-btn:hover { color: #6366f1; background: #475569; }
                .delete-btn:hover { color: #ef4444; background: #475569; }

                /* Modal Styles */
                .modal-overlay { 
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                    background: rgba(0,0,0,0.7); backdrop-filter: blur(5px);
                    display: flex; justify-content: center; align-items: center; z-index: 1000;
                }
                .modal-card { background: #1e293b; width: 500px; border-radius: 16px; padding: 2rem; border: 1px solid #475569; }
                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
                .modal-header h3 { margin: 0; color: #fff; }
                .modal-header button { background: none; border: none; color: #94a3b8; cursor: pointer; }

                .modal-form { display: flex; flex-direction: column; gap: 1rem; }
                .input-group label { display: block; color: #94a3b8; font-size: 0.8rem; margin-bottom: 5px; }
                .input-group input, .input-group select { 
                    width: 100%; background: #0f172a; border: 1px solid #334155; 
                    padding: 0.7rem; border-radius: 8px; color: white; outline: none;
                }
                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
                .save-btn { 
                    background: #6366f1; color: white; border: none; padding: 0.8rem; 
                    border-radius: 8px; cursor: pointer; font-weight: 600; margin-top: 1rem;
                }
            `}</style>
        </div>
    );
}