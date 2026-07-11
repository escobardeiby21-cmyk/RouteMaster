import React, { useState, useEffect } from 'react';
import api from '../api';

const OrdersPanel = ({ onRouteOptimized }: { onRouteOptimized: (data: any) => void }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [loading, setLoading] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedDrivers, setSelectedDrivers] = useState<number[]>([]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
      const res = await api.post('/token', formData);
      localStorage.setItem('token', res.data.access_token);
      setToken(res.data.access_token);
    } catch (err) {
      alert("Error al iniciar sesión.");
    }
  };

  const fetchPendingOrders = async () => {
    if (!token) return;
    try {
      const res = await api.get('/pending_orders');
      setPendingOrders(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDrivers = async () => {
    if (!token) return;
    try {
      // Intentar crear un chofer por defecto si no hay ninguno
      await api.post('/drivers/?name=Chofer_1').catch(() => {});
      await api.post('/drivers/?name=Chofer_2').catch(() => {});
      
      const res = await api.get('/drivers/');
      setDrivers(res.data);
      if (res.data.length > 0 && selectedDrivers.length === 0) {
        setSelectedDrivers([res.data[0].id]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPendingOrders();
    fetchDrivers();
    const interval = setInterval(fetchPendingOrders, 3000); // Poll every 3 seconds for new orders
    return () => clearInterval(interval);
  }, [token]);

  const toggleDriver = (driverId: number) => {
    setSelectedDrivers(prev => 
      prev.includes(driverId) 
        ? prev.filter(id => id !== driverId)
        : [...prev, driverId]
    );
  };

  const handleOptimize = async () => {
    if (pendingOrders.length === 0) return alert("No hay pedidos pendientes de clientes.");
    if (selectedDrivers.length === 0) return alert("Debes seleccionar al menos un chofer para despachar.");
    
    setLoading(true);
    try {
      const payload = {
        driver_ids: selectedDrivers,
        vehicle_capacities: selectedDrivers.map(() => 500), // Capacidad estándar para todos
        depot: { id: "depot", name: "Almacén Central", lat: 39.4699, lng: -0.3774, weight: 0 },
        deliveries: pendingOrders,
        use_real_maps: false
      };

      const res = await api.post('/optimize-and-save-multi-route', payload);
      // Tras optimizar, en la vida real estos pedidos pasarían a "asignados".
      // Por ahora, borramos la lista visual y se lo pasamos al mapa.
      setPendingOrders([]);
      onRouteOptimized({ routeData: res.data, customStops: pendingOrders });
    } catch (err: any) {
      alert("Error optimizando: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-bg-card">
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center text-3xl shadow-[0_0_15px_rgba(99,102,241,0.5)] mb-6">🔒</div>
        <h2 className="text-2xl font-bold mb-2 text-white">Acceso Restringido</h2>
        <form onSubmit={handleLogin} className="bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col gap-4 w-80 mt-6 shadow-xl">
          <input className="px-4 py-3 bg-bg-main border border-border-color rounded-xl text-white outline-none focus:border-primary" value={username} onChange={e=>setUsername(e.target.value)} placeholder="Usuario" />
          <input type="password" className="px-4 py-3 bg-bg-main border border-border-color rounded-xl text-white outline-none focus:border-primary" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Contraseña" />
          <button type="submit" className="bg-primary hover:bg-blue-600 text-white font-medium py-3 rounded-xl shadow-lg transition-all">Desbloquear Panel</button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 text-white overflow-y-auto bg-bg-card flex flex-col h-full relative">
      
      {/* Overlay de Carga (IA Procesando) */}
      {loading && (
        <div className="absolute inset-0 bg-bg-main/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center rounded-2xl">
          <div className="w-20 h-20 border-4 border-indigo-500/30 border-t-primary rounded-full animate-spin mb-6 shadow-[0_0_30px_rgba(99,102,241,0.5)]"></div>
          <h3 className="text-2xl font-bold text-white mb-2 animate-pulse drop-shadow-lg">Calculando ruta óptima con IA...</h3>
          <p className="text-indigo-300 text-sm tracking-widest uppercase font-bold">Mapeando coordenadas terrestres por satélite</p>
        </div>
      )}

      <div className="flex justify-between items-center mb-6 border-b border-border-color pb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Bandeja de Entrada (En Vivo)</h2>
          <p className="text-gray-400 mt-1">Solicitudes entrantes desde el Portal Web Público</p>
        </div>
        <button 
          onClick={handleOptimize} 
          disabled={loading || pendingOrders.length === 0}
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-emerald-500 hover:to-green-700 px-6 py-3 rounded-xl font-bold shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? "Optimizando con IA..." : "⚡ Asignar Ruta y Despachar"}
        </button>
      </div>

      <div className="flex gap-6 flex-1 min-h-0 justify-center">
        {/* Tabla de Paradas Dinámicas que lee la Base de Datos */}
        <div className="w-2/3 bg-white/5 border border-border-color rounded-2xl p-6 shadow-xl flex flex-col overflow-hidden relative">
          
          <h3 className="text-lg font-medium mb-4 text-gray-200 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            Escuchando peticiones de clientes...
          </h3>

          <div className="overflow-y-auto flex-1 pr-2">
            {pendingOrders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <div className="text-4xl mb-4 opacity-50">📭</div>
                <p className="italic">No hay solicitudes pendientes.</p>
                <p className="text-xs mt-2">Abre el Portal Público y haz una petición para verla aparecer aquí.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingOrders.map((stop, i) => (
                  <div key={stop.id} className="bg-bg-main border border-border-color p-4 rounded-xl flex justify-between items-center hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center border border-blue-500/30">
                        {i + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-100">{stop.name}</h4>
                        <p className="text-sm text-gray-400">{stop.address}</p>
                        
                        <div className="mt-2 text-xs text-gray-500 flex flex-col gap-1">
                          {stop.tracking_number && <span className="flex items-center gap-2 bg-indigo-500/20 text-indigo-300 w-fit px-2 py-0.5 rounded border border-indigo-500/30">📦 {stop.tracking_number}</span>}
                          {stop.phone && <span className="flex items-center gap-2">📞 <span className="text-blue-300">{stop.phone}</span></span>}
                          {stop.details && <span className="flex items-center gap-2">🏢 <span className="text-gray-400">{stop.details}</span></span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {stop.price && <div className="text-emerald-400 font-bold mb-1">${stop.price.toFixed(2)}</div>}
                      <span className="px-3 py-1 bg-white/5 text-gray-300 rounded-lg text-xs font-mono border border-white/10">GPS OK</span>
                      <p className="text-sm text-green-400 font-bold mt-2">Carga: {stop.weight} kg</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel de Selección de Choferes */}
        <div className="w-1/3 bg-white/5 border border-border-color rounded-2xl p-6 shadow-xl flex flex-col h-full">
          <h3 className="text-lg font-medium mb-4 text-gray-200">Asignación de Flota</h3>
          <p className="text-xs text-gray-400 mb-4">Selecciona los camiones que usarás para repartir esta tanda de pedidos. La IA dividirá el mapa entre ellos.</p>
          
          <div className="flex-1 overflow-y-auto space-y-2">
            {drivers.map(driver => (
              <label key={driver.id} className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer border transition-all ${selectedDrivers.includes(driver.id) ? 'bg-primary/20 border-primary' : 'bg-bg-main border-border-color hover:border-gray-500'}`}>
                <input 
                  type="checkbox" 
                  checked={selectedDrivers.includes(driver.id)}
                  onChange={() => toggleDriver(driver.id)}
                  className="w-5 h-5 rounded text-primary focus:ring-primary bg-bg-card border-gray-600"
                />
                <div className="flex flex-col">
                  <span className="font-bold text-gray-100">🚚 {driver.name}</span>
                  <span className="text-xs text-green-400">En Base - Listo</span>
                </div>
              </label>
            ))}
            {drivers.length === 0 && (
              <div className="text-center text-gray-500 py-8">No hay choferes en la base de datos.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersPanel;
