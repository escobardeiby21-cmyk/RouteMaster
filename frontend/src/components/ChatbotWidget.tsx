import React, { useState } from 'react';
import api from '../api';

const ChatbotWidget = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{sender: 'user'|'bot', text: string}[]>([
    { sender: 'bot', text: '¡Hola! Soy tu asistente virtual 👍. Pregúntame sobre envíos o escríbeme tu número de guía.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');
    setIsTyping(true);
    
    try {
      const res = await api.post('/public/chat', { message: userMsg });
      setChatMessages(prev => [...prev, { sender: 'bot', text: res.data.response }]);
    } catch(err) {
      setChatMessages(prev => [...prev, { sender: 'bot', text: 'Ups, tengo problemas para conectarme a los servidores ahora mismo.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Botón flotante de Chat */}
      <button 
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-tr from-primary to-purple-600 hover:from-blue-600 hover:to-primary rounded-full shadow-[0_0_20px_rgba(99,102,241,0.6)] flex items-center justify-center transition-all transform hover:scale-110 z-[5000]"
      >
        <img src="/bot_avatar.jpg" alt="Bot" className="w-14 h-14 rounded-full object-cover border-2 border-white/20" />
        {!chatOpen && <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-bg-main animate-pulse"></span>}
      </button>

      {/* Ventana de Chat Flotante */}
      {chatOpen && (
        <div className="fixed bottom-28 right-6 w-80 h-[400px] bg-bg-main/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl flex flex-col z-[5000] overflow-hidden">
          {/* Header del Chat */}
          <div className="bg-gradient-to-r from-primary to-indigo-700 p-4 flex items-center gap-3">
            <img src="/bot_avatar.jpg" alt="Bot" className="w-10 h-10 rounded-full object-cover border-2 border-white/30 shadow-md" />
            <div>
              <h3 className="text-white font-bold text-sm">Asistente IA</h3>
              <p className="text-green-300 text-xs flex items-center gap-1 font-medium"><span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> En línea</p>
            </div>
            <button onClick={() => setChatOpen(false)} className="ml-auto text-white/70 hover:text-white text-xl">✕</button>
          </div>
          
          {/* Mensajes */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`max-w-[85%] rounded-xl p-3 text-sm shadow-md ${msg.sender === 'user' ? 'bg-primary text-white self-end rounded-tr-none' : 'bg-white/10 text-gray-200 self-start rounded-tl-none border border-white/5 whitespace-pre-wrap'}`}>
                {msg.text}
              </div>
            ))}
            {isTyping && (
              <div className="bg-white/10 text-gray-400 self-start rounded-xl rounded-tl-none p-3 text-xs flex gap-1 items-center border border-white/5">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
              </div>
            )}
          </div>
          
          {/* Input de Texto */}
          <form onSubmit={handleChatSubmit} className="p-3 border-t border-white/10 bg-black/40 flex gap-2">
            <input 
              className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary transition-colors"
              placeholder="Pregunta o guía..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
            />
            <button type="submit" disabled={!chatInput.trim() || isTyping} className="bg-primary hover:bg-blue-600 disabled:opacity-50 text-white px-3 rounded-lg transition-colors font-bold">
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;
