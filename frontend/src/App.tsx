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
import InstallAppButton from './components/InstallAppButton';
import 'leaflet/dist/leaflet.css';

function App() {
  const [userRole, setUserRole] = useState<'admin' | 'driver' | 'guest' | 'login-admin' | 'login-driver' | null>(null);
  const [loggedInUser, setLoggedInUser] = useState('');
  const [activeTab, setActiveTab] = useState('orders');
  const [routeData, setRouteData] = useState<any>(null);
  const [activeDrivers, setActiveDrivers] = useState<any[]>([]);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);



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
        
        <InstallAppButton />

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
