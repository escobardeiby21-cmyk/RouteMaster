import React, { useState, useEffect } from 'react';
import api from '../api';

const DriverPortal = ({ username, onLogout }: { username: string, onLogout: () => void }) => {
  const [route, setRoute] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const res = await api.get('/orders');
        // Filtramos las paradas asignadas a este chofer específico y que NO estén entregadas
        const orders = res.data.filter((o: any) => o.status !== 'Entregado' && o.driver?.toLowerCase() === username.toLowerCase());
        setRoute(orders);
      } catch(e) {}
      setLoading(false);
    };
    fetchRoute();
    // Refrescar cada 10 segundos por si el Admin le asigna nuevas rutas en tiempo real
    const int = setInterval(fetchRoute, 10000);
    return () => clearInterval(int);
  }, [username]);

  const markDelivered = async (tracking_number: string) => {
    try {
      await api.post(`/driver/delivered/${tracking_number}`);
      // Actualización visual instantánea
      setRoute((prev: any) => prev.filter((o: any) => o.tracking_number !== tracking_number));
    } catch(e) {
      alert("Error al actualizar la base de datos.");
    }
  };

  return (
    <div className="min-h-screen bg-bg-main flex flex-col font-sans pb-20">
      {/* Header Estilo App Móvil */}
      <div className="bg-white/10 p-5 border-b border-white/10 sticky top-0 z-50 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl flex justify-between items-center">
        <div>
          <h1 className="text-white font-bold text-xl flex items-center gap-2">🚚 Chofer</h1>
          <p className="text-emerald-400 text-sm font-mono uppercase tracking-widest">{username}</p>
        </div>
        <button onClick={onLogout} className="text-red-400 text-xs font-bold uppercase tracking-wider bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-xl border border-red-500/30 transition-colors">
          Salir
        </button>
      </div>

      <div className="p-4 flex-1 max-w-lg mx-auto w-full">
        <h2 className="text-gray-400 font-bold mb-4 uppercase tracking-widest text-xs">
          Tus Paradas Pendientes ({route?.length || 0})
        </h2>
        
        {loading ? (
          <div className="text-center text-primary mt-10 animate-pulse font-bold">📡 Conectando con el satélite...</div>
        ) : route && route.length > 0 ? (
          <div className="flex flex-col gap-5">
            {route.map((order: any, idx: number) => (
              <div key={order.tracking_number} className={`bg-white/5 border border-white/10 p-5 rounded-3xl relative overflow-hidden shadow-lg ${idx === 0 ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
                {idx === 0 && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-blue-600 text-white text-[10px] uppercase font-bold px-4 py-1.5 rounded-bl-2xl z-10 shadow-lg">
                    SIGUIENTE PARADA
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-2 mt-2">
                  <h3 className="text-white font-bold text-xl">{order.client_name}</h3>
                  <span className="text-gray-500 font-mono text-xs">#{idx + 1}</span>
                </div>
                
                <p className="text-gray-300 text-sm mb-4 leading-relaxed pr-6">{order.address}</p>
                
                <div className="flex gap-2 mb-4 text-xs font-mono">
                  <span className="bg-black/40 text-gray-300 px-3 py-1.5 rounded-lg border border-white/5">📦 {order.weight} kg</span>
                  <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-lg border border-indigo-500/20 flex items-center gap-1">📞 {order.phone}</span>
                </div>
                
                {order.details && (
                  <div className="bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs p-3 rounded-xl mb-5">
                    <strong className="block mb-1">Indicaciones extra:</strong>
                    {order.details}
                  </div>
                )}
                
                <div className="flex gap-3">
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${order.lat},${order.lng}`} target="_blank" rel="noreferrer" 
                     className="flex-[1.5] bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-xl text-center flex items-center justify-center gap-2 transition-colors border border-white/10 shadow-inner">
                    🗺️ Ir en Maps
                  </a>
                  <button onClick={() => markDelivered(order.tracking_number)} className="flex-[2] bg-gradient-to-r from-green-500 to-emerald-600 hover:from-emerald-500 hover:to-green-700 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 transition-all">
                    ✅ Entregado
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center bg-white/5 border border-white/10 p-10 rounded-3xl mt-10 shadow-inner">
            <div className="text-6xl mb-6">☕</div>
            <h3 className="text-white font-bold text-2xl mb-2">Ruta Limpia</h3>
            <p className="text-gray-400 text-sm leading-relaxed">No tienes entregas pendientes. Espera a que el Despachador optimice una nueva ruta y te la asigne.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverPortal;
