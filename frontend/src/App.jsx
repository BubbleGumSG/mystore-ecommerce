import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import AdminDashboard from "./pages/AdminDashboard";
import EditProduct from "./pages/EditProduct";
import Register from "./pages/Register";
import Success from "./pages/Success";
import Chatbot from "./components/ChatBot";

function Navigation() {
  
  const { user, logout } = useAuth(); 

  return (
    <nav className="bg-blue-600 text-white p-4 shadow-md">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold tracking-wider">MyStore</Link>
        <div className="space-x-6 flex items-center">
          <Link to="/" className="hover:text-blue-200">Products</Link>
          
          {/*  */}
          {user && (
            <>
              <Link to="/orders" className="hover:text-blue-200">Orders</Link>
              <Link to="/cart" className="hover:text-blue-200">Cart</Link>
            </>
          )}
          
          {user ? (
            <div className="flex items-center space-x-4">
               
               {user.role === 'ADMIN' && (
                 <Link to="/admin" className="text-sm bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded font-bold transition text-white">
                   Admin Panel
                 </Link>
               )}

               <span className="text-sm bg-blue-800 px-2 py-1 rounded">
                 {user.role === 'ADMIN' ? '👑 Admin' : '👤 User'}
               </span>
               <button onClick={logout} className="hover:text-blue-200 font-bold cursor-pointer">Logout</button>
            </div>
          ) : (
            <Link to="/login" className="hover:text-blue-200 font-bold">Login</Link>
          )}
          
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <main className="max-w-6xl mx-auto mt-8 bg-white shadow-sm rounded-lg min-h-[60vh] p-4">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/edit/:id" element={<EditProduct />} />
              <Route path="/register" element={<Register />} />
              <Route path="/success" element={<Success />} />
            </Routes>
          </main>

          {/* --- CHATBOT --- */}
          <Chatbot />
          {/* ---------------------------------- */}
          
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}