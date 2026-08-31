import { useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const [searchParams] = useSearchParams()
  const error = searchParams.get('error')

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Welcome back</h1>
        <p className="login-sub">
          Sign in to access your admin dashboard.
        </p>

        {error && (
          <div className="login-error">
            {error.replace(/_/g, ' ')}
          </div>
        )}

        <div className="login-buttons">
          <button className="btn btn-primary login-btn" onClick={login}>
            Login
          </button>
          <button className="btn btn-outline login-btn" onClick={login}>
            Register
          </button>
        </div>

        <p className="login-note">
          Both login and register redirect to the identity provider. If you
          haven't created an account yet, choose Register.
        </p>

        <Link to="/" className="login-back">
          &larr; Back to home
        </Link>
      </div>
    </div>
  )
}
