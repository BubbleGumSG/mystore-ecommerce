import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Am adăugat Link aici!
import { useAuth } from '../context/AuthContext';
import api from '../api/axios'; // Our custom Axios brain!

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { login } = useAuth(); 
  const navigate = useNavigate(); 

  const handleLogin = async (e) => {
    e.preventDefault(); 
    setError(''); 

    try {
      
      const response = await api.post('/auth/login', {
        email: email,
        password: password
      });

      const token = response.data; 

      login(token);

      navigate('/'); 
      
    } catch (err) {
      console.error(err);
      setError('Invalid email or password. The Bouncer says no!');
    }
  };

  return (
    <div className="flex justify-center items-center h-[50vh]">
      <div className="bg-white p-8 rounded-lg shadow-md w-96 border border-gray-100">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Welcome Back</h2>
        
        {/* If there is an error, show a red alert box */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
            <input 
              type="email" 
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
            <input 
              type="password" 
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200"
          >
            Sign In
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600 text-sm">
          Nu ai cont încă?{' '}
          <Link to="/register" className="text-blue-600 hover:underline font-bold">
            Creează unul aici
          </Link>
        </p>
        
      </div>
    </div>
  );
}