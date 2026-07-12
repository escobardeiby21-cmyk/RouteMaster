import React, { useState } from 'react';
import api from '../api';

const LoginScreen = ({ onLogin, onBack, initialRole = 'admin' }: { onLogin: (role: string, username: string) => void, onBack: () => void, initialRole?: string }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const formData = new URLSearchParams();
      formData.append('username', username.toLowerCase());
      formData.append('password', password);
      
      const res = await api.post('/token', formData);
      localStorage.setItem('token', res.data.access_token);
      
      // El backend devuelve el rol ('admin' o 'driver')
      onLogin(res.data.role, username.toLowerCase());
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError("Usuario o contraseña incorrectos.");
      } else {
        setError("Error de conexión con el servidor.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 bg-bg-main relative min-h-screen">
      <div className="absolute inset-0 bg-gradient-to-br from-bg-main via-bg-main to-primary/20 opacity-80"></div>
      
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] relative z-10 w-full max-w-sm animate-[slideInDown_0.4s_ease-out]">
        <button onClick={onBack} className="text-gray-400 hover:text-white mb-8 text-sm flex items-center gap-2 transition-colors">← Volver al Portal de Clientes</button>
        
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center text-4xl mb-6 shadow-[0_0_30px_rgba(99,102,241,0.4)] mx-auto">
          🔒
        </div>
        
        <h2 className="text-2xl font-bold text-white text-center mb-2">Acceso Restringido</h2>
        <p className="text-gray-400 text-center text-sm mb-8">Ingresa tus credenciales corporativas</p>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div>
            <label className="text-xs text-primary mb-1 block uppercase tracking-wider font-bold">Usuario ({initialRole === 'driver' ? 'Chofer' : 'Administrador'})</label>
            <input required className="w-full px-4 py-3 bg-bg-main/50 border border-white/10 rounded-xl text-white outline-none focus:border-primary transition-colors" value={username} onChange={e=>setUsername(e.target.value)} placeholder={initialRole === 'driver' ? "Ej. chofer_1" : "Ej. admin"} />
          </div>
          <div>
            <label className="text-xs text-primary mb-1 block uppercase tracking-wider font-bold">Contraseña</label>
            <input required type="password" className="w-full px-4 py-3 bg-bg-main/50 border border-white/10 rounded-xl text-white outline-none focus:border-primary transition-colors" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          
          {error && <div className="text-red-400 text-sm text-center bg-red-500/10 p-2 rounded border border-red-500/20">{error}</div>}
          
          <button disabled={loading} type="submit" className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white font-bold py-4 mt-2 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all flex justify-center">
            {loading ? <span className="animate-pulse">Validando...</span> : "Ingresar al Sistema"}
          </button>
        </form>

        {/* Sección de Descarga Directa (Sideloading) para Choferes */}
        <div className="mt-8 text-center border-t border-white/10 pt-6">
          <p className="text-gray-400 text-xs mb-3">¿Eres chofer y aún no tienes la aplicación?</p>
          <a 
            href="/RouteMaster-Oficial.apk" 
            download 
            className="inline-flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:scale-105"
          >
            ⬇️ Instalar RouteMaster App
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
