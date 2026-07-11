import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import SignaturePad from 'react-signature-canvas';

const DriverPortal = ({ username, onLogout }: { username: string, onLogout: () => void }) => {
  const [route, setRoute] = useState<any>(null);
  const [completedRoute, setCompletedRoute] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [loading, setLoading] = useState(true);
  
  // POD States
  const [showPODModal, setShowPODModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [photoData, setPhotoData] = useState<string | null>(null);
  const sigCanvas = useRef<any>(null);
  const fileInputRef = useRef<any>(null);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const res = await api.get('/orders');
        const pendingOrders = res.data.filter((o: any) => o.status !== 'Entregado' && o.driver?.toLowerCase() === username.toLowerCase());
        const completedOrders = res.data.filter((o: any) => o.status === 'Entregado' && o.driver?.toLowerCase() === username.toLowerCase());
        setRoute(pendingOrders);
        setCompletedRoute(completedOrders);
      } catch(e) {}
      setLoading(false);
    };
    fetchRoute();
    // Refrescar cada 10 segundos por si el Admin le asigna nuevas rutas en tiempo real
    const int = setInterval(fetchRoute, 10000);
    return () => clearInterval(int);
  }, [username]);

  const handlePhotoCapture = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const markDelivered = async () => {
    if (!selectedOrder) return;
    
    let signature = null;
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      signature = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
    }
    
    try {
      await api.post(`/driver/delivered/${selectedOrder}`, {
        signature: signature,
        photo: photoData
      });
      // Actualización visual instantánea
      const deliveredOrder = route.find((o: any) => o.tracking_number === selectedOrder);
      if (deliveredOrder) {
        setCompletedRoute(prev => [...prev, { ...deliveredOrder, status: 'Entregado' }]);
      }
      setRoute((prev: any) => prev.filter((o: any) => o.tracking_number !== selectedOrder));
      setShowPODModal(false);
      setSelectedOrder(null);
      setPhotoData(null);
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
        {/* Tabs */}
        <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10 mb-6 backdrop-blur-sm">
          <button 
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'pending' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            🚧 En Ruta ({route?.length || 0})
          </button>
          <button 
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'completed' ? 'bg-green-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            ✅ Completadas ({completedRoute.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center text-primary mt-10 animate-pulse font-bold">📡 Conectando con el satélite...</div>
        ) : activeTab === 'pending' ? (
          route && route.length > 0 ? (
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
                  <button onClick={() => { setSelectedOrder(order.tracking_number); setShowPODModal(true); }} className="flex-[2] bg-gradient-to-r from-green-500 to-emerald-600 hover:from-emerald-500 hover:to-green-700 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 transition-all">
                    ✅ Entregar
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
        )) : (
          completedRoute.length > 0 ? (
            <div className="flex flex-col gap-4">
              {completedRoute.map((order: any) => (
                <div key={order.tracking_number} className="bg-green-500/10 border border-green-500/20 p-4 rounded-2xl relative shadow-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-white font-bold">{order.client_name}</h3>
                    <span className="text-green-400 text-xs font-bold bg-green-400/20 px-2 py-1 rounded">✅ Entregado</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-2">{order.address}</p>
                  <p className="text-xs text-gray-500 font-mono">Guía: {order.tracking_number}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center bg-white/5 border border-white/10 p-10 rounded-3xl mt-10 shadow-inner">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="text-white font-bold mb-2">Aún no hay entregas</h3>
              <p className="text-gray-400 text-sm">Tus entregas completadas de hoy aparecerán aquí como comprobante de tu trabajo.</p>
            </div>
          )
        )}
      </div>

      {/* Modal de Prueba de Entrega (P.O.D.) */}
      {showPODModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-bg-card w-full max-w-md rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 bg-gradient-to-r from-primary to-blue-600 flex justify-between items-center">
              <h3 className="text-white font-bold text-lg">Prueba de Entrega</h3>
              <button onClick={() => { setShowPODModal(false); setSelectedOrder(null); setPhotoData(null); }} className="text-white/70 hover:text-white font-bold text-xl">✕</button>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-6">
              {/* Foto */}
              <div>
                <h4 className="text-gray-300 font-bold mb-2 text-sm uppercase tracking-wider">1. Foto en Puerta</h4>
                <input type="file" accept="image/*" capture="environment" onChange={handlePhotoCapture} ref={fileInputRef} className="hidden" />
                
                {photoData ? (
                  <div className="relative rounded-xl overflow-hidden border-2 border-primary">
                    <img src={photoData} alt="Evidencia" className="w-full h-48 object-cover" />
                    <button onClick={() => setPhotoData(null)} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg">✕</button>
                  </div>
                ) : (
                  <button onClick={() => fileInputRef.current?.click()} className="w-full bg-white/5 hover:bg-white/10 border-2 border-dashed border-white/20 rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-colors">
                    <span className="text-4xl">📸</span>
                    <span className="text-gray-400 font-medium">Abrir Cámara</span>
                  </button>
                )}
              </div>
              
              {/* Firma */}
              <div>
                <h4 className="text-gray-300 font-bold mb-2 text-sm uppercase tracking-wider">2. Firma del Cliente</h4>
                <div className="bg-white rounded-xl overflow-hidden border-2 border-white/20 touch-none">
                  <SignaturePad 
                    ref={sigCanvas}
                    canvasProps={{className: 'w-full h-40'}}
                  />
                </div>
                <button onClick={() => sigCanvas.current?.clear()} className="text-xs text-gray-500 mt-2 hover:text-white">Borrar firma</button>
              </div>
            </div>
            
            <div className="p-4 border-t border-white/10 bg-black/20">
              <button onClick={markDelivered} className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all text-lg">
                Confirmar Entrega Segura
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverPortal;
