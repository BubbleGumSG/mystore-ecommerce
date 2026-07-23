import { createContext, useState, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        return {
          email: decoded.sub,
          role: decoded.role,
          userId: decoded.userId,
        };
      } catch (error) {
        console.error("Invalid token", error);
        localStorage.removeItem('token');
        return null;
      }
    }
    return null;
  });

  const login = (token) => {
    localStorage.setItem('token', token);
    const decoded = jwtDecode(token);
    setUser({
      email: decoded.sub,
      role: decoded.role,
      userId: decoded.userId,
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 3. Export a custom hook so other files can easily grab the user data
export function useAuth() {
  return useContext(AuthContext);
}