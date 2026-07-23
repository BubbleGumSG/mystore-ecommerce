import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Success() {
  const { user } = useAuth();
  const [message, setMessage] = useState('Procesăm comanda ta...');
  
  // React în modul de dezvoltare rulează de 2 ori efectele. 
  // Acest "useRef" ne asigură că cerem golirea coșului o singură dată!
  const hasFired = useRef(false); 

  useEffect(() => {
    // Dacă nu e logat sau am trimis deja cererea, ne oprim
    if (!user || hasFired.current) return;
    
    hasFired.current = true; // Marcăm că am început procesul

    const finalizeOrder = async () => {
      try {
        // 1. Recuperăm datele de livrare din localStorage
        const savedDelivery = localStorage.getItem('pendingDelivery');
        const payload = savedDelivery ? JSON.parse(savedDelivery) : { method: 'home', details: {} };

        // 2. Trimitem cererea către Java cu tot cu payload-ul adresei
        await api.post(`/orders/checkout/${user.userId}`, payload);
        
        // 3. Curățăm memoria locală după succes ca să fie curat la următoarea comandă
        localStorage.removeItem('pendingDelivery');
        
        setMessage('✅ Plată Reușitada și Comandă Înregistrată!');
      } catch (err) {
        console.error("Eroare la finalizare:", err);
        setMessage('✅ Plata a fost finalizată!');
      }
    };

    finalizeOrder();
  }, [user]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-8">
      <div className="bg-white p-10 rounded-2xl shadow-xl text-center max-w-lg border-t-8 border-green-500">
        
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-5xl">🛍️</span>
        </div>
        
        <h1 className="text-3xl font-extrabold text-gray-800 mb-4">{message}</h1>
        <p className="text-gray-600 mb-8 text-lg">
          Mulțumim! Vei găsi detaliile achiziției în istoricul tău de comenzi.
        </p>

        <div className="flex flex-col space-y-4">
          <Link 
            to="/orders" 
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Vezi Comenzile Mele
          </Link>
          <Link 
            to="/" 
            className="w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-200 transition"
          >
            Continuă Cumpărăturile
          </Link>
        </div>
      </div>
    </div>
  );
}