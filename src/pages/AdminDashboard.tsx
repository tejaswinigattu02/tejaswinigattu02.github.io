import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminDashboard() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    }
  }, [loading, user, navigate])

  if (loading) {
    return <div className="admin-page"><div className="admin-loading">Loading...</div></div>
  }

  if (!user) {
    return null
  }

  return (
    <div className="admin-page">
      <div className="admin-card">
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
          <button className="btn btn-outline" onClick={logout}>Logout</button>
        </div>

        <div className="admin-welcome">
          <span className="admin-avatar">
            {(user.name || user.email || '?')[0].toUpperCase()}
          </span>
          <div>
            <h2>Welcome, {user.name || user.email}!</h2>
            <p className="text2">You are signed in and authenticated.</p>
          </div>
        </div>

        <div className="admin-grid">
          <div className="admin-panel">
            <h3>Profile</h3>
            <ul className="admin-list">
              <li><strong>Name:</strong> {user.name || '—'}</li>
              <li><strong>Email:</strong> {user.email || '—'}</li>
              <li><strong>Subject:</strong> {user.sub}</li>
              <li><strong>Verified:</strong> {user.email_verified ? 'Yes' : 'No'}</li>
            </ul>
          </div>

          <div className="admin-panel">
            <h3>Quick Stats</h3>
            <ul className="admin-list">
              <li><strong>Role:</strong> Admin</li>
              <li><strong>Status:</strong> <span className="status-online">● Online</span></li>
            </ul>
          </div>
        </div>

        <div className="admin-actions">
          <Link to="/" className="btn btn-primary">Back to home</Link>
        </div>
      </div>
    </div>
  )
}
