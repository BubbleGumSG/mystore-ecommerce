import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await api.post('/auth/register', {
        email: email,
        password: password
      });

      setSuccess('✅ Cont creat cu succes! Te redirecționăm...');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      console.error(err);
      setError('❌ Eroare la creare. Probabil acest email există deja.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border border-gray-100">
        <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-6">Creare Cont</h2>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-center font-bold">{error}</div>}
        {success && <div className="bg-green-50 text-green-600 p-3 rounded mb-4 text-center font-bold">{success}</div>}

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="nume@exemplu.com"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Parolă</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-blue-300"
          >
            {isLoading ? 'Se creează contul...' : 'Înregistrare'}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600 text-sm">
          Ai deja un cont?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-bold">
            Loghează-te aici
          </Link>
        </p>
      </div>
    </div>
  );
}