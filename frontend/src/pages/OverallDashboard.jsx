import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../hooks/useAuth';
import { 
  Users, Ticket, Clock, CheckCircle, 
  ArrowRight, ShieldAlert, BarChart3 
} from 'lucide-react';

export default function OverallDashboard() {
  const { user, isAdmin } = useAuth(); // User ge role eka gannawa
  const navigate = useNavigate();
  
  const [ticketStats, setTicketStats] = useState({ total: 0, open: 0 });
  const [userStats, setUserStats] = useState({ total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Tickets data (Hamaotama ona)
        const tRes = await api.get('/tickets');
        const allTickets = tRes.data.content || [];
        setTicketStats({
          total: allTickets.length,
          open: allTickets.filter(t => t.status === 'OPEN').length
        });

        // 2. Users data (Admin nam vitharak gannawa)
        if (isAdmin) {
          const uRes = await api.get('/admin/users');
          setUserStats({ total: uRes.data.length });
        }
      } catch (err) {
        console.error("Data load fail", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isAdmin]);

  if (loading) return <div className="p-10 text-white">Loading System Overview...</div>;

  return (
    <div className="dashboard-container" style={{ padding: '2rem' }}>
      
      <div className="mb-8">
        <h1 className="heading-1" style={{ color: 'white' }}>System Overview</h1>
        <p style={{ color: '#94a3b8' }}>Welcome back, {user?.name}. Here is what's happening.</p>
      </div>

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        
        {/* --- ADMIN TA WITHARAK PENA USERS CARD --- */}
        {isAdmin && (
          <div className="stat-card" onClick={() => navigate('/admin/users')} style={{ cursor: 'pointer', borderLeft: '4px solid #6366f1' }}>
            <div className="stat-card__icon" style={{ color: '#6366f1' }}>
              <Users size={24} />
            </div>
            <div className="stat-card__body">
              <div className="stat-card__number">{userStats.total}</div>
              <div className="stat-card__label">Total System Users</div>
              <small style={{ color: '#6366f1' }}>Click to manage users</small>
            </div>
            <ArrowRight size={16} />
          </div>
        )}

        {/* --- HAMOTAMA PENA TICKETS CARD --- */}
        <div className="stat-card" onClick={() => navigate('/tickets')} style={{ cursor: 'pointer', borderLeft: '4px solid #f59e0b' }}>
          <div className="stat-card__icon" style={{ color: '#f59e0b' }}>
            <Ticket size={24} />
          </div>
          <div className="stat-card__body">
            <div className="stat-card__number">{ticketStats.total}</div>
            <div className="stat-card__label">Total Tickets</div>
            <small style={{ color: '#f59e0b' }}>View all incidents</small>
          </div>
          <ArrowRight size={16} />
        </div>

        {/* --- ACTIVE ISSUES CARD --- */}
        <div className="stat-card" onClick={() => navigate('/tickets?status=OPEN')} style={{ cursor: 'pointer', borderLeft: '4px solid #ef4444' }}>
          <div className="stat-card__icon" style={{ color: '#ef4444' }}>
            <Clock size={24} />
          </div>
          <div className="stat-card__body">
            <div className="stat-card__number">{ticketStats.open}</div>
            <div className="stat-card__label">Active Issues</div>
            <small style={{ color: '#ef4444' }}>Need attention</small>
          </div>
          <ArrowRight size={16} />
        </div>

      </div>

      {/* --- QUICK ACTION SECTION --- */}
      <div className="mt-10" style={{ marginTop: '3rem', background: '#1e293b', padding: '2rem', borderRadius: '15px' }}>
        <h3 className="heading-3 mb-4 flex items-center gap-2">
          <BarChart3 size={20} /> Quick Actions
        </h3>
        <div className="flex gap-4">
          <button className="btn btn-primary" onClick={() => navigate('/tickets/new')}>
            Create New Ticket
          </button>
          
          {/* Admin nam thawa button ekak pennanawa */}
          {isAdmin && (
            <button className="btn btn-outline" onClick={() => navigate('/admin/users')}>
              User Management
            </button>
          )}
        </div>
      </div>

    </div>
  );
}