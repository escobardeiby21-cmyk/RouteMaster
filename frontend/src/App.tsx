import React, { useState, useEffect } from 'react';
import api from './api';
import MapDashboard from './components/MapDashboard';
import OrdersPanel from './components/OrdersPanel';
import FleetPanel from './components/FleetPanel';
import AnalyticsBar from './components/AnalyticsBar';
import ClientPortal from './components/ClientPortal';
import LoginScreen from './components/LoginScreen';
import DriverPortal from './components/DriverPortal';
import ChatbotWidget from './components/ChatbotWidget';
import FinancePanel from './components/FinancePanel';
import 'leaflet/dist/leaflet.css';

function App() {
  const [userRole, setUserRole] = useState<'admin' | 'driver' | 'guest' | 'login-admin' | 'login-driver' | null>(null);
  const [loggedInUser, setLoggedInUser] = useState('');
  const [activeTab, setActiveTab] = useState('orders');
  const [routeData, setRouteData] = useState<any>(null);
  const [activeDrivers, setActiveDrivers] = useState<any[]>([]);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallHelp, setShowInstallHelp] = useState(false);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowInstallHelp(true);
    }
  };

  useEffect(() => {
    if (userRole === 'admin') {
      const fetchDrivers = async () => {
        try {
          const res = await api.get('/drivers/');
          setActiveDrivers(res.data);
        } catch (error) {
          console.error("Error cargando choferes", error);
        }
      };
      fetchDrivers();
      const interval = setInterval(fetchDrivers, 10000); // Refrescar cada 10 seg
      return () => clearInterval(interval);
    }
  }, [userRole]);

  if (userRole === null) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-bg-main p-6 gap-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-30"></div>
        
        {/* CSS para la animación cómica del camión */}
        <style>{`
          @keyframes drive-truck {
            0% { transform: translateX(-20vw) rotate(-2deg); }
            25% { transform: translateX(20vw) rotate(2deg) translateY(-10px); }
            50% { transform: translateX(50vw) rotate(-2deg); }
            75% { transform: translateX(80vw) rotate(2deg) translateY(-10px); }
            100% { transform: translateX(120vw) rotate(-2deg); }
          }
          @keyframes puff {
            0% { opacity: 1; transform: scale(1) translate(0, 0); }
            100% { opacity: 0; transform: scale(2.5) translate(-30px, -20px); }
          }
          .funny-truck-container {
            position: absolute;
            top: 15%;
            left: 0;
            width: 100%;
            height: 150px;
            pointer-events: none;
            z-index: 5;
          }
          .truck-body {
            position: absolute;
            font-size: 7rem;
            animation: drive-truck 6s linear infinite;
            filter: drop-shadow(0 10px 15px rgba(0,0,0,0.5));
          }
          .smoke {
            position: absolute;
            bottom: 20px;
            left: -30px;
            font-size: 3rem;
            animation: puff 0.8s ease-out infinite;
          }
          .smoke2 {
            position: absolute;
            bottom: 10px;
            left: -50px;
            font-size: 2rem;
            animation: puff 0.8s ease-out infinite 0.4s;
          }
        `}</style>

        {/* Camión animado en el fondo */}
        <div className="funny-truck-container overflow-hidden">
          <div className="truck-body">
            🚚
            <span className="smoke">💨</span>
            <span className="smoke2">☁️</span>
          </div>
        </div>

        <div className="relative z-10 text-center mb-8 flex flex-col items-center">
          <div className="mb-4">
            <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-white via-blue-200 to-primary bg-clip-text text-transparent mb-2 tracking-tight drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
              RouteMaster
            </h1>
          </div>
          <p className="text-gray-300 text-sm md:text-lg lg:text-xl font-medium tracking-wide max-w-3xl mx-auto bg-black/40 px-8 py-3 rounded-full border border-white/10 backdrop-blur-md shadow-xl text-center">
            Sistema Inteligente de Optimización de Rutas y Gestión de Flotas en Tiempo Real
          </p>
        </div>

        <div className="relative z-10 flex gap-8 flex-col sm:flex-row mt-4">
          {/* Botón de Instalación Universal */}
          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 w-full flex justify-center z-50">
            <button 
              onClick={(e) => { e.stopPropagation(); handleInstallClick(); }}
              className="bg-gradient-to-r from-emerald-400 to-green-600 text-white font-bold px-6 py-2 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)] flex items-center gap-2 hover:scale-105 transition-transform animate-bounce relative z-50"
            >
              📱 Instalar App RouteMaster
            </button>
          </div>

          {/* Modal de Ayuda de Instalación */}
          {showInstallHelp && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[6000] flex items-center justify-center p-4 text-left">
              <div className="bg-bg-card max-w-md w-full border border-white/20 rounded-3xl p-6 shadow-2xl relative">
                <button onClick={() => setShowInstallHelp(false)} className="absolute top-4 right-4 text-white/50 hover:text-white text-xl font-bold">✕</button>
                <div className="text-5xl text-center mb-4">📲</div>
                <h2 className="text-2xl font-bold text-white text-center mb-6">Cómo instalar la App</h2>
                
                <div className="space-y-4">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                    <h3 className="text-gray-200 font-bold flex items-center gap-2 mb-2">
                      <span className="text-xl">
                        <svg viewBox="0 0 384 512" fill="currentColor" className="w-5 h-5"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
                      </span> 
                      En iPhone / Safari
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      1. Toca el ícono de <strong>Compartir</strong> en la barra inferior.<br/>
                      2. Selecciona <strong>"Agregar a inicio"</strong> ➕.
                    </p>
                  </div>
                  
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                    <h3 className="text-emerald-400 font-bold flex items-center gap-2 mb-2">
                      <span className="text-xl">
                        <svg viewBox="0 0 576 512" fill="currentColor" className="w-5 h-5"><path d="M420.22 77.29L467.4 3.78a10.84 10.84 0 0 0-3.32-15 10.74 10.74 0 0 0-14.89 3.31L400.91 67.24a275 275 0 0 0-225.82 0L126.81-7.89a10.74 10.74 0 0 0-14.89-3.31 10.84 10.84 0 0 0-3.32 15l47.18 73.51a283.43 283.43 0 0 0-128.53 143.5h521.46a283.42 283.42 0 0 0-128.49-143.52zM193.38 181.75a25.43 25.43 0 1 1 25.43-25.43 25.43 25.43 0 0 1-25.43 25.43zm189.24 0a25.43 25.43 0 1 1 25.43-25.43 25.43 25.43 0 0 1-25.43 25.43zM27.25 244.53v140c0 40 32.41 72.43 72.43 72.43h376.64c40 0 72.43-32.42 72.43-72.43v-140zm421.36 128.18c-30.84 0-55.85-25-55.85-55.84s25-55.84 55.85-55.84 55.84 25 55.84 55.84-25.01 55.84-55.84 55.84zm-222 17.57a151.76 151.76 0 0 1-99.34-37 14.59 14.59 0 0 1 19.33-21.78 122.58 122.58 0 0 0 80 29.59 123.51 123.51 0 0 0 79.52-29.27 14.59 14.59 0 1 1 19.06 22 152.61 152.61 0 0 1-98.57 36.44z"/></svg>
                      </span> 
                      En Android / Chrome
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      1. Toca los <strong>3 puntitos</strong> ⋮ arriba a la derecha.<br/>
                      2. Selecciona <strong>"Instalar aplicación"</strong> o "Agregar a inicio".
                    </p>
                  </div>
                </div>
                
                <button onClick={() => setShowInstallHelp(false)} className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3 rounded-xl mt-6 transition-colors">
                  ¡Entendido!
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-6 mt-12 relative z-10 w-full max-w-4xl justify-center items-center px-4">
          <button onClick={() => setUserRole('guest')} className="flex-1 w-full p-8 bg-primary/20 border border-primary/30 rounded-3xl hover:bg-primary/30 transition-all shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:-translate-y-2 text-center backdrop-blur-sm group">
            <div className="text-5xl md:text-6xl mb-4 group-hover:scale-110 transition-transform">📦</div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Soy Cliente</h2>
            <p className="text-sm text-blue-200">Cotizar y enviar un paquete.</p>
          </button>
          
          <button onClick={() => setUserRole('login-driver')} className="flex-1 w-full p-8 bg-emerald-500/20 border border-emerald-500/30 rounded-3xl hover:bg-emerald-500/30 transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:-translate-y-2 text-center backdrop-blur-sm group">
            <div className="text-5xl md:text-6xl mb-4 group-hover:scale-110 transition-transform">🚚</div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Soy Chofer</h2>
            <p className="text-sm text-emerald-200">Ver mis entregas asignadas.</p>
          </button>

          <button onClick={() => setUserRole('login-admin')} className="flex-1 w-full p-8 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all shadow-xl hover:-translate-y-2 text-center backdrop-blur-sm group">
            <div className="text-5xl md:text-6xl mb-4 group-hover:scale-110 transition-transform">🛡️</div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Administración</h2>
            <p className="text-sm text-gray-400">Torre de control central.</p>
          </button>
        </div>
        <ChatbotWidget />
      </div>
    );
  }

  if (userRole === 'login-admin') {
    return <LoginScreen onLogin={(role, username) => { setUserRole(role as any); setLoggedInUser(username); }} onBack={() => setUserRole(null)} initialRole="admin" />;
  }

  if (userRole === 'login-driver') {
    return <LoginScreen onLogin={(role, username) => { setUserRole(role as any); setLoggedInUser(username); }} onBack={() => setUserRole(null)} initialRole="driver" />;
  }

  if (userRole === 'driver') {
    return (
      <>
        <DriverPortal username={loggedInUser} onLogout={() => setUserRole(null)} />
        <ChatbotWidget />
      </>
    );
  }

  if (userRole === 'guest') {
    return (
      <>
        <ClientPortal onBack={() => setUserRole(null)} />
        <ChatbotWidget />
      </>
    );
  }

  return (
    <div className="flex h-screen bg-bg-main text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-bg-card border-r border-border-color p-6 flex flex-col relative z-20 shadow-2xl">
        <div className="mb-10">
          <button onClick={() => setUserRole(null)} className="text-xs text-gray-500 hover:text-white mb-4 transition-colors flex items-center gap-1">
            ← Salir al inicio
          </button>
          <h1 className="text-3xl font-black bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent flex items-center gap-3">
            RouteMaster
          </h1>
          <p className="text-gray-400 text-sm font-medium mt-2 tracking-wide">Enterprise Command Center</p>
        </div>
        
        <div className="flex-1">
          <nav className="space-y-2">
            <button 
              onClick={() => setActiveTab('map')}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3 ${activeTab === 'map' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              <span className="text-lg">🗺️</span> Rutas y Mapa
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3 ${activeTab === 'orders' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              <span className="text-lg">📦</span> Pedidos
            </button>
            <button 
              onClick={() => setActiveTab('fleet')}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3 ${activeTab === 'fleet' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              <span className="text-lg">👥</span> Choferes
            </button>
            <button 
              onClick={() => setActiveTab('finance')}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3 ${activeTab === 'finance' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              <span className="text-lg">💰</span> Finanzas
            </button>
          </nav>

          <div className="mt-8">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">Flota Conectada</h3>
            
            <div className="flex flex-col gap-3">
              {activeDrivers.length === 0 ? (
                <div className="text-xs text-gray-500 px-2 italic">Sin choferes registrados.</div>
              ) : (
                activeDrivers.slice(0, 3).map((driver) => (
                  <div key={driver.id} className="bg-white/5 p-3 rounded-xl border border-border-color hover:border-primary/50 transition-colors cursor-pointer group">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-200">{driver.name}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
                        {driver.status}
                      </span>
                    </div>
                    <div className="w-full bg-bg-main h-1.5 rounded-full overflow-hidden shadow-inner">
                      <div className="bg-gradient-to-r from-primary to-blue-400 h-full w-[100%] rounded-full group-hover:shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all"></div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {activeDrivers.length > 3 && (
              <button onClick={() => setActiveTab('fleet')} className="w-full text-center text-xs text-indigo-400 mt-3 hover:text-indigo-300">
                Ver todos ({activeDrivers.length})
              </button>
            )}
          </div>
        </div>
        
        <div className="p-4 border-t border-border-color text-sm text-gray-500 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
          Conectado (WebSockets)
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative z-10 flex flex-col bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-50">
        <AnalyticsBar />
        <div className="flex-1 p-6 h-full w-full min-h-0">
          <div className="h-full w-full bg-bg-card rounded-2xl border border-border-color overflow-hidden shadow-2xl ring-1 ring-white/10 flex flex-col">
            {activeTab === 'map' ? (
              <MapDashboard routeData={routeData} />
            ) : activeTab === 'fleet' ? (
              <FleetPanel />
            ) : activeTab === 'finance' ? (
              <FinancePanel />
            ) : (
              <OrdersPanel onRouteOptimized={(data) => {
                setRouteData(data);
                alert("¡Ruta óptima trazada!");
                setActiveTab('map');
              }} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
