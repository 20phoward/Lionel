import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin, getMe } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegistering) {
        const { register } = await import('../api/client');
        await register({ email, password, name });
      }
      const resp = await apiLogin(email, password);
      const { access_token, refresh_token } = resp.data;
      localStorage.setItem('access_token', access_token);
      const meResp = await getMe();
      login(access_token, refresh_token, meResp.data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Lionel</h1>
        <h2 className="text-lg text-center text-gray-600 mb-6">
          {isRegistering ? 'Create Account' : 'Sign In'}
        </h2>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            {isRegistering ? 'Register' : 'Sign In'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500">
          {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-blue-600 hover:underline"
          >
            {isRegistering ? 'Sign In' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  );
}
