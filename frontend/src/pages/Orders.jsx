import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Link } from 'react-router-dom';

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // If not logged in, stop loading
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        // Call the new Java endpoint we just built!
        const response = await api.get(`/orders/user/${user.userId}`);
        
        // Sort orders by newest first (assuming larger IDs or dates are newer)
        const sortedOrders = response.data.sort((a, b) => b.id - a.id);
        setOrders(sortedOrders);
      } catch (err) {
        console.error(err);
        setError('Failed to load your order history.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  // --- NOU: FUNCȚIA DE ANULARE COMANDĂ ---
  const handleCancelOrder = async (orderId) => {
    // Întrebăm utilizatorul dacă e sigur
    const isConfirmed = window.confirm("Ești sigur că vrei să anulezi această comandă?");
    if (!isConfirmed) return;

    try {
      // Trimitem cererea către Java
      await api.put(`/orders/${orderId}/cancel`);
      
      // Actualizăm interfața instantaneu, fără să dăm refresh la pagină
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: 'CANCELLED' } : order
      ));
      
      alert("✅ Comanda a fost anulată cu succes!");
    } catch (err) {
      console.error(err);
      alert("❌ A apărut o eroare la anularea comenzii.");
    }
  };
  // -----------------------------------------

  if (!user) return <div className="p-8 text-center text-lg">Please log in to view your orders.</div>;
  if (loading) return <div className="p-8 text-center text-lg text-gray-500">Loading history...</div>;
  if (error) return <div className="p-8 text-center text-red-500 font-bold">{error}</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">My Order History</h1>

      {orders.length === 0 ? (
        <div className="text-center p-12 bg-gray-50 rounded-lg border">
          <h2 className="text-xl font-bold text-gray-600 mb-4">You haven't placed any orders yet.</h2>
          <Link to="/" className="text-blue-600 font-bold hover:underline">Start Shopping →</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border rounded-lg shadow-sm overflow-hidden">
              
              {/* Order Header */}
              <div className="bg-gray-50 px-6 py-4 border-b flex flex-wrap justify-between items-center gap-4">
                <div>
                  <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Order ID</p>
                  <p className="font-mono text-gray-800">{order.id.substring(0,8)}...</p>
                </div>
                
                {/* --- ZONA DE STATUS MODIFICATĂ --- */}
                <div className="flex flex-col items-center gap-2">
                  <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Status</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                    order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' : 
                    order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : // Am adăugat culoarea roșie pentru Cancelled
                    'bg-green-100 text-green-800'
                  }`}>
                    {order.status}
                  </span>

                  {/* NOU: Butonul de anulare apare doar dacă nu e deja anulată */}
                  {order.status !== 'CANCELLED' && (
                    <button 
                      onClick={() => handleCancelOrder(order.id)}
                      className="text-xs bg-red-500 text-white px-2 py-1 rounded font-bold hover:bg-red-600 transition"
                    >
                      Anulează
                    </button>
                  )}
                </div>
                {/* ---------------------------------- */}

                <div className="text-right">
                  <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Total</p>
                  <p className="text-xl font-extrabold text-blue-600">${order.totalAmount.toFixed(2)}</p>
                </div>
              </div>

              {/* Order Items List */}
              <div className="px-6 py-4">
                <ul className="divide-y divide-gray-100">
                  {order.items.map((item) => (
                    <li key={item.id} className="py-3 flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center text-xl">
                          📦
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">
                            {item.variant.product?.name || "Product Name Unavailable"}
                          </p>
                          <p className="text-sm text-gray-500">Qty: {item.quantity} × ${item.priceAtPurchase.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="font-bold text-gray-700">
                        ${(item.quantity * item.priceAtPurchase).toFixed(2)}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}