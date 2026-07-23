import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function EditProduct() {
  const { id } = useParams(); // Luăm ID-ul din URL
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: ''
  });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  // 1. Încărcăm datele actuale ale produsului
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${id}`);
        const p = response.data;
        setFormData({
          name: p.name,
          description: p.description,
          price: p.basePrice,
          imageUrl: p.imageUrl || ''
        });
      } catch (err) {
        console.error(err);
        setStatus('❌ Nu s-au putut încărca datele produsului.');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Se salvează...');
    try {
      await api.put(`/products/${id}`, {
        ...formData,
        price: parseFloat(formData.price)
      });
      setStatus('✅ Produs actualizat!');
      setTimeout(() => navigate('/'), 1500); // Ne întoarcem la magazin
      
    } catch (err) {
        console.error(err);
      setStatus('❌ Eroare la salvare.');
    }
  };

  if (loading) return <div className="p-8 text-center">Se încarcă...</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Editează Produsul</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow border">
        {status && <div className="p-3 bg-blue-50 text-blue-700 rounded font-bold">{status}</div>}
        
        <div>
          <label className="block font-bold mb-1">Nume</label>
          <input type="text" className="w-full p-2 border rounded" value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})} required />
        </div>

        <div>
          <label className="block font-bold mb-1">Descriere</label>
          <textarea className="w-full p-2 border rounded" rows="3" value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})} required />
        </div>

        <div>
          <label className="block font-bold mb-1">Preț ($)</label>
          <input type="number" step="0.01" className="w-full p-2 border rounded" value={formData.price}
            onChange={(e) => setFormData({...formData, price: e.target.value})} required />
        </div>

        <div>
          <label className="block font-bold mb-1">URL Imagine</label>
          <input type="text" className="w-full p-2 border rounded" value={formData.imageUrl}
            onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} />
        </div>

        <div className="flex space-x-4">
          <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700">
            Salvează Modificările
          </button>
          <button type="button" onClick={() => navigate('/')} className="flex-1 bg-gray-200 py-2 rounded font-bold">
            Anulează
          </button>
        </div>
      </form>
    </div>
  );
}