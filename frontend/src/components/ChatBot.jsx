import { useState, useRef, useEffect } from 'react';
import api from '../api/axios';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Salut! Cu ce te pot ajuta astăzi?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.post('/chat', { message: userText });
      
      setMessages(prev => [...prev, { sender: 'bot', text: response.data.reply }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { sender: 'bot', text: 'Ups! Am pierdut conexiunea. Încearcă din nou.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Fereastra de Chat */}
      {isOpen && (
        <div className="bg-white w-80 h-96 rounded-2xl shadow-2xl border border-gray-200 flex flex-col mb-4 overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="bg-blue-600 text-white px-4 py-3 font-bold flex justify-between items-center shadow-md">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              Asistent Magazin
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:text-gray-200 text-xl font-bold">✕</button>
          </div>

          {/* Zona de Mesaje */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3">
            {messages.map((msg, index) => (
              <div key={index} className={`max-w-[80%] p-3 rounded-xl text-sm ${
                msg.sender === 'user' 
                  ? 'bg-blue-600 text-white self-end rounded-br-none' 
                  : 'bg-white border text-gray-800 self-start rounded-bl-none shadow-sm'
              }`}>
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div className="bg-white border text-gray-500 self-start p-3 rounded-xl rounded-bl-none shadow-sm text-sm italic">
                Se gândește...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Formularul de Scriere */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Scrie un mesaj..."
              className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              ➤
            </button>
          </form>
        </div>
      )}

      {/* Butonul de run */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-blue-600 rounded-full shadow-2xl flex items-center justify-center text-white text-2xl hover:bg-blue-700 hover:scale-110 transition-transform duration-200"
        >
          💬
        </button>
      )}
    </div>
  );
}