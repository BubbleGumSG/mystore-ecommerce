import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

// Setările pentru harta Google Maps
const containerStyle = { width: '100%', height: '400px', borderRadius: '0.75rem' };
const defaultCenter = { lat: 43.8986, lng: 25.9744 }; 

// Lockere demonstrative
const mockLockers = [
  { id: 1, name: "Easybox Centru", lat: 43.8986, lng: 25.9744 },
  { id: 2, name: "Easybox Kaufland", lat: 43.9100, lng: 25.9700 },
  { id: 3, name: "Easybox Gara", lat: 43.8950, lng: 25.9500 },
];

export default function Cart() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkoutStatus, setCheckoutStatus] = useState('');
  
  const [deliveryMethod, setDeliveryMethod] = useState('home'); 
  const [selectedLocker, setSelectedLocker] = useState(null); // NOU: Salvează lockerul ales

  const [shippingDetails, setShippingDetails] = useState({
    fullName: '', phone: '', county: '', city: '', street: '', number: '', block: '', apartment: '', additionalInfo: ''
  });

  // Încărcarea API-ului Google Maps
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY // Citește din fișierul .env
  });

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const fetchCart = async () => {
      try {
        const response = await api.get(`/carts/${user.userId}`);
        setCart(response.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load your cart.');
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckout = async () => {
    // Validare
    if (deliveryMethod === 'home') {
      if (!shippingDetails.fullName || !shippingDetails.phone || !shippingDetails.city || !shippingDetails.street || !shippingDetails.number) {
        alert('⚠️ Te rugăm să completezi câmpurile obligatorii pentru livrare.');
        return;
      }
    } else if (deliveryMethod === 'easybox') {
      if (!selectedLocker) {
        alert('⚠️ Te rugăm să selectezi un Easybox de pe hartă!');
        return;
      }
    }

    try {
      // Salvăm datele, punând numele real al lockerului selectat!
      const deliveryData = {
        method: deliveryMethod,
        details: deliveryMethod === 'home' ? shippingDetails : { easyboxName: selectedLocker.name }
      };
      localStorage.setItem('pendingDelivery', JSON.stringify(deliveryData));

      const response = await api.post(`/payments/create-checkout-session/${user.userId}`);
      window.location.href = response.data.url;
    } catch (err) {
      console.error(err);
      alert('❌ Nu am putut inițializa plata.');
    }
  };

  const handleRemoveItem = async (cartItemId) => {
    try {
      await api.delete(`/carts/${user.userId}/items/${cartItemId}`);
      setCart(prevCart => ({ ...prevCart, items: prevCart.items.filter(item => item.id !== cartItemId) }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateQuantity = async (variantId, newQuantity) => {
    if (newQuantity < 1) return; 
    try {
      await api.put(`/carts/${user.userId}/update`, null, { params: { variantId, quantity: newQuantity } });
      setCart(prevCart => ({
        ...prevCart,
        items: prevCart.items.map(item => item.variant.id === variantId ? { ...item, quantity: newQuantity } : item)
      }));
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return <div className="p-8 text-center text-lg">Please log in to view your cart.</div>;
  if (loading) return <div className="p-8 text-center text-lg text-gray-500">Loading cart...</div>;
  if (error) return <div className="p-8 text-center text-red-500 font-bold">{error}</div>;
  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
        <button onClick={() => navigate('/')} className="text-blue-600 hover:underline">Go back to shopping</button>
      </div>
    );
  }

  const cartTotal = cart.items.reduce((total, item) => total + ((item.variant.price || item.variant.product?.basePrice || 0) * item.quantity), 0);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Shopping Cart</h1>
      
      <div className="bg-white shadow-sm border rounded-lg p-6">
        
        {/* LISTA DE PRODUSE */}
        {cart.items.map((item) => {
          const price = item.variant.price || item.variant.product?.basePrice || 0;
          return (
            <div key={item.id} className="flex justify-between items-center border-b py-4 last:border-b-0">
              <div className="flex-grow">
                <h3 className="font-bold text-lg text-gray-800">{item.variant.product?.name || 'Loading Name...'}</h3>
                <p className="text-sm text-gray-500 mb-2">Variant ID: {item.variant.id.substring(0,8)}</p>
                <div className="flex items-center space-x-3 mt-2">
                  <span className="text-gray-500 font-bold text-sm">Quantity:</span>
                  <div className="flex items-center border rounded-lg overflow-hidden shadow-sm">
                    <button onClick={() => handleUpdateQuantity(item.variant.id, item.quantity - 1)} disabled={item.quantity <= 1} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold disabled:opacity-50">-</button>
                    <span className="px-4 py-1 font-bold bg-white border-x text-sm">{item.quantity}</span>
                    <button onClick={() => handleUpdateQuantity(item.variant.id, item.quantity + 1)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold">+</button>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="font-bold text-xl text-gray-800">${(price * item.quantity).toFixed(2)}</div>
                <button onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-700 font-bold transition p-2">✕</button>
              </div>
            </div>
          );
        })}

        {/* SECȚIUNEA DE LIVRARE */}
        <div className="mt-8 pt-6 border-t">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Metodă de livrare</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div onClick={() => setDeliveryMethod('home')} className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${deliveryMethod === 'home' ? 'border-blue-600 bg-blue-50 shadow-md' : 'border-gray-200 hover:border-blue-300'}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🚚</span>
                <div>
                  <h3 className="font-bold text-gray-800">Livrare la Domiciliu</h3>
                  <p className="text-sm text-gray-500">Curier rapid la adresa ta</p>
                </div>
                {deliveryMethod === 'home' && <span className="ml-auto text-blue-600 text-xl font-bold">✓</span>}
              </div>
            </div>

            <div onClick={() => setDeliveryMethod('easybox')} className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${deliveryMethod === 'easybox' ? 'border-green-600 bg-green-50 shadow-md' : 'border-gray-200 hover:border-green-300'}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">📦</span>
                <div>
                  <h3 className="font-bold text-gray-800">Ridicare din Easybox</h3>
                  <p className="text-sm text-gray-500">Alege un locker de pe hartă</p>
                </div>
                {deliveryMethod === 'easybox' && <span className="ml-auto text-green-600 text-xl font-bold">✓</span>}
              </div>
            </div>
          </div>

          {/* FORMULAR DOMICILIU */}
          {deliveryMethod === 'home' && (
            <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl animate-fade-in">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">📍 Adresă de livrare curier</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nume Complet *</label><input type="text" name="fullName" value={shippingDetails.fullName} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white"/></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Telefon *</label><input type="text" name="phone" value={shippingDetails.phone} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white"/></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Județ</label><input type="text" name="county" value={shippingDetails.county} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white"/></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Oraș / Localitate *</label><input type="text" name="city" value={shippingDetails.city} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white"/></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Stradă *</label><input type="text" name="street" value={shippingDetails.street} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white"/></div>
                <div className="grid grid-cols-3 gap-2 md:col-span-2">
                  <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nr. *</label><input type="text" name="number" value={shippingDetails.number} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white"/></div>
                  <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bloc</label><input type="text" name="block" value={shippingDetails.block} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white"/></div>
                  <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ap.</label><input type="text" name="apartment" value={shippingDetails.apartment} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white"/></div>
                </div>
                <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Detalii suplimentare</label><input type="text" name="additionalInfo" value={shippingDetails.additionalInfo} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white"/></div>
              </div>
            </div>
          )}

          {/* HARTA PENTRU EASYBOX */}
          {deliveryMethod === 'easybox' && (
            <div className="mt-2 animate-fade-in border rounded-xl overflow-hidden shadow-sm">
              <div className="bg-green-600 text-white p-3 font-bold flex justify-between items-center">
                <span>📍 Selectează un Easybox de pe hartă</span>
                {selectedLocker && <span className="bg-white text-green-700 px-3 py-1 rounded text-sm">Ales: {selectedLocker.name}</span>}
              </div>
              
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={containerStyle}
                  center={defaultCenter}
                  zoom={13}
                >
                  {/* Desenăm marker-ele pentru fiecare Easybox */}
                  {mockLockers.map(locker => (
                    <Marker 
                      key={locker.id} 
                      position={{ lat: locker.lat, lng: locker.lng }}
                      onClick={() => setSelectedLocker(locker)}
                      // O pictogramă vizuală mai frumoasă dacă este selectat
                      icon={selectedLocker?.id === locker.id ? "http://maps.google.com/mapfiles/ms/icons/green-dot.png" : "http://maps.google.com/mapfiles/ms/icons/red-dot.png"}
                    />
                  ))}
                </GoogleMap>
              ) : (
                <div className="p-12 text-center text-gray-500">Se încarcă harta...</div>
              )}
            </div>
          )}
        </div>

        {/* ZONA DE TOTAL ȘI CHECKOUT */}
        <div className="mt-8 pt-6 border-t flex flex-col items-end">
          <div className="flex justify-between w-64 mb-6">
            <span className="text-xl font-bold text-gray-600">Total Produse:</span>
            <span className="text-2xl font-extrabold text-blue-600">${cartTotal.toFixed(2)}</span>
          </div>
          
          <button 
            onClick={handleCheckout}
            disabled={checkoutStatus === 'Processing...'}
            className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-green-700 transition w-64 disabled:bg-gray-400"
          >
            {checkoutStatus === 'Processing...' ? 'Processing...' : 'Checkout'}
          </button>
        </div>
      </div>
    </div>
  );
}