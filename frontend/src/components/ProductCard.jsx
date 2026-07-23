import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function ProductCard({ product }) {
  const { user } = useAuth(); // Grab Dave's info from the global memory!
  const [isAdding, setIsAdding] = useState(false);
  const [feedback, setFeedback] = useState(''); // Used to say "Added!" or "Error"

  const handleAddToCart = async () => {
    // 1. Check if they are logged in first!
    if (!user) {
      alert("Please log in to start shopping!");
      return;
    }

    setIsAdding(true);
    setFeedback('');

    try {
      // 2. Send the request to your Java backend
      await api.post(`/carts/${user.userId}/add`, null, {
        params: {
            variantId: product.variants[0].id, // Just adding the first variant for simplicity
            quantity: 1
        }
      });

      // 3. Show a success message for 2 seconds
      setFeedback('✅ Added to Cart!');
      setTimeout(() => setFeedback(''), 2000);
      
    } catch (err) {
      console.error(err);
      setFeedback('❌ Failed to add.');
      setTimeout(() => setFeedback(''), 3000);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="border rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-200 bg-white overflow-hidden flex flex-col relative">
      
      {/* Floating Feedback Badge */}
      {feedback && (
        <div className="absolute top-2 right-2 bg-white px-3 py-1 rounded-full shadow-md text-sm font-bold z-10 animate-fade-in-down">
          {feedback}
        </div>
      )}

      {/* --- THIS IS THE NEW IMAGE SECTION --- */}
      <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden border-b">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <span className="text-gray-400 text-4xl">📸</span>
        )}
      </div>
      {/* ------------------------------------- */}
      
      {/* Product Info */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-bold text-lg text-gray-800">{product.name}</h3>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{product.description}</p>
        
        <div className="mt-auto flex justify-between items-end">
          
          <span className="text-xl font-extrabold text-blue-600 mb-1">
            ${product.basePrice.toFixed(2)}
          </span>
          
          {/* Am creat un container în dreapta pentru a ține ambele butoane */}
          <div className="flex flex-col items-end space-y-2">
            <button 
              onClick={handleAddToCart}
              disabled={isAdding}
              className={`px-4 py-2 rounded font-bold transition ${
                isAdding 
                  ? 'bg-gray-400 cursor-not-allowed text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
              }`}
            >
              {isAdding ? 'Adding...' : 'Add to Cart'}
            </button>

            {/* --- NOU: BUTONUL DE EDIT PENTRU ADMIN --- */}
            {user?.role === 'ADMIN' && (
              <Link 
                to={`/admin/edit/${product.id}`}
                className="text-xs font-bold text-gray-500 hover:text-blue-600 transition flex items-center"
              >
                ⚙️ Editează Produs
              </Link>
            )}
            {/* ------------------------------------------ */}
          </div>

        </div>
      </div>
    </div>
  );
}