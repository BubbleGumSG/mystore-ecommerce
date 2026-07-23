import { useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [imageUrl, setImageUrl] = useState('');

  // Extra security: Double-check they are an admin before rendering the page
  if (user?.role !== 'ADMIN') {
    return <div className="p-8 text-center text-red-600 font-bold text-xl">🛑 Access Denied. Admins Only.</div>;
  }

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus('Processing...');

    try {
      await api.post('/products', {
        name: name,
        description: description,
        price: parseFloat(price),
        imageUrl: imageUrl
      });

      setStatus('✅ Product added successfully!');
      
      // Clear the form for the next product
      setName('');
      setDescription('');
      setPrice('');
      setImageUrl('');
      
      // Clear the success message after 3 seconds
      setTimeout(() => setStatus(''), 3000);
      
    } catch (err) {
      console.error(err);
      setStatus('❌ Failed to add product. Check console for details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-gray-800">Admin Dashboard</h1>
      <p className="text-gray-600 mb-8">Add new inventory to the storefront.</p>

      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-6 border-b pb-2">Add New Product</h2>

        {status && (
          <div className={`p-4 mb-6 rounded font-bold ${status.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
            {status}
          </div>
        )}

        <form onSubmit={handleAddProduct} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Product Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="e.g., Wireless Headphones"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
            <textarea 
              required
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Detailed product description..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Price ($)</label>
            <input 
              type="number" 
              step="0.01"
              min="0"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="99.99"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Image URL</label>
            <input 
              type="url" 
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="https://example.com/image.png (Optional)"
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-gray-900 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-800 transition disabled:bg-gray-400 mt-4"
          >
            {isSubmitting ? 'Adding...' : 'Add Product to Store'}
          </button>
        </form>
      </div>
    </div>
  );
}