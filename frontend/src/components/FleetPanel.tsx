import React, { useEffect, useState } from 'react';
import api from '../api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

interface Order {
  tracking_number: string;
  destination: string;
  status: string;
  driver_id?: number;
  lat: number;
  lng: number;
  name: string;
  address: string;
  weight: number;
  phone: string;
}

const FleetPanel = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'routes' | 'drivers'>('pending');
  const [drivers, setDrivers] = useState<any[]>([]);
  const [allStops, setAllStops] = useState<any[]>([]);
  const [newDriverName, setNewDriverName] = useState("");
  const [newDriverPhone, setNewDriverPhone] = useState("");
  const [newDriverPlate, setNewDriverPlate] = useState("");
  const [newDriverEmergency, setNewDriverEmergency] = useState("");
  const [editingDriver, setEditingDriver] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  
  const fetchOrders = async () => {
    try {
      const res = await api.get('/pending_orders');
      setOrders(res.data);
      const resDrivers = await api.get('/drivers/');
      setDrivers(resDrivers.data);
      const resAllStops = await api.get('/all_stops');
      setAllStops(resAllStops.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const addDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/drivers/?name=${encodeURIComponent(newDriverName)}&phone=${encodeURIComponent(newDriverPhone)}&vehicle_plate=${encodeURIComponent(newDriverPlate)}&emergency_contact=${encodeURIComponent(newDriverEmergency)}`);
      setNewDriverName("");
      setNewDriverPhone("");
      setNewDriverPlate("");
      setNewDriverEmergency("");
      fetchOrders();
    } catch (e) {
      alert("Error al registrar chofer.");
    }
  };

  const deleteDriver = async (id: number) => {
    if(!window.confirm("¿Estás seguro de despedir a este chofer? Esta acción es irreversible.")) return;
    try {
      await api.delete(`/drivers/${id}`);
      fetchOrders();
    } catch (e) {
      alert("Error al eliminar chofer.");
    }
  };

  const saveEditDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!editingDriver) return;
    try {
      await api.put(`/drivers/${editingDriver.id}?name=${encodeURIComponent(editingDriver.name)}&phone=${encodeURIComponent(editingDriver.phone)}&vehicle_plate=${encodeURIComponent(editingDriver.vehicle_plate)}&emergency_contact=${encodeURIComponent(editingDriver.emergency_contact)}`);
      setEditingDriver(null);
      fetchOrders();
    } catch (e) {
      alert("Error al actualizar datos.");
    }
  };

  const reassignOrder = async (tracking_number: string, new_driver_id: number) => {
    try {
      await api.post(`/reassign/${tracking_number}/${new_driver_id}`);
      fetchOrders();
      alert("Paquete transferido con éxito.");
    } catch (e) {
      alert("Error al reasignar paquete.");
    }
  };

  const handleSimulate = async () => {
    if (!selectedDriver) {
      alert("Selecciona un chofer primero");
      return;
    }
    setSimulating(true);
    try {
      await api.post('/optimize-and-save-route', {
        driver_id: parseInt(selectedDriver),
        depot: { id: "0", name: "Almacén Central", lat: 39.4699, lng: -0.3774 },
        deliveries: orders.map(o => ({
          id: o.tracking_number,
          name: o.name,
          lat: o.lat,
          lng: o.lng,
          weight: o.weight
        })),
        use_real_maps: true
      });
      fetchOrders();
      setActiveTab('routes');
    } catch (err) {
      alert("Error optimizando ruta");
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-bg-main relative p-8">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            Centro de Comando Logístico
          </h1>
          <p className="text-gray-400">Control maestro de despachos y asignación de rutas por Inteligencia Artificial.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setActiveTab('drivers')} className={`px-6 py-3 rounded-xl font-bold transition-all border ${activeTab === 'drivers' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}>
            👥 Gestión de Personal
          </button>
          <button onClick={() => setActiveTab('pending')} className={`px-6 py-3 rounded-xl font-bold transition-all border ${activeTab === 'pending' ? 'bg-primary/20 text-primary border-primary/50 shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}>
            📦 Bandeja de Entrada ({orders.length})
          </button>
          <button onClick={() => setActiveTab('routes')} className={`px-6 py-3 rounded-xl font-bold transition-all border ${activeTab === 'routes' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}>
            🗺️ Mapa y Monitoreo Activo
          </button>
        </div>
      </div>

      {activeTab === 'pending' && (
        <div className="flex gap-8 flex-1 min-h-0 relative z-10 animate-[fadeIn_0.3s_ease-out]">
          <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-6 overflow-y-auto shadow-2xl backdrop-blur-md">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center justify-between">
              Paquetes sin asignar
              <span className="bg-primary/20 text-primary text-xs px-3 py-1 rounded-full border border-primary/30">NUEVOS</span>
            </h2>
            <div className="space-y-4">
              {orders.map((order, i) => (
                <div key={i} className="p-4 bg-black/30 rounded-2xl border border-white/5 hover:border-primary/50 transition-colors group">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors">{order.name}</h3>
                    <span className="text-xs font-mono bg-white/10 px-2 py-1 rounded text-gray-300">{order.tracking_number}</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-3 flex items-start gap-2">
                    <span className="mt-0.5">📍</span> {order.address}
                  </p>
                  <div className="flex gap-3 text-xs">
                    <span className="bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded border border-indigo-500/20">⚖️ {order.weight} kg</span>
                    <span className="bg-white/5 text-gray-400 px-2 py-1 rounded border border-white/5">📞 {order.phone}</span>
                  </div>
                </div>
              ))}
              {orders.length === 0 && (
                <div className="text-center text-gray-500 py-10">
                  <div className="text-4xl mb-3">📬</div>
                  No hay pedidos pendientes
                </div>
              )}
            </div>
          </div>
          
          <div className="w-1/3 bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-md flex flex-col justify-center">
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-primary to-blue-600 rounded-full mx-auto flex items-center justify-center text-5xl mb-6 shadow-[0_0_30px_rgba(99,102,241,0.5)]">
                🧠
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Despacho Automático</h3>
              <p className="text-gray-400 text-sm px-4">Selecciona un chofer y la IA calculará la ruta más rápida aglomerando los paquetes cercanos.</p>
            </div>
            
            <select 
              className="w-full bg-black/40 border border-white/20 rounded-xl p-4 text-white outline-none focus:border-primary transition-colors mb-6 cursor-pointer"
              value={selectedDriver} 
              onChange={e => setSelectedDriver(e.target.value)}
            >
              <option value="">Selecciona un Chofer...</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>{d.name} (ID: {d.id})</option>
              ))}
            </select>
            
            <button 
              disabled={orders.length === 0 || simulating} 
              onClick={handleSimulate}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white font-bold py-5 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.4)] disabled:opacity-50 transition-all text-lg flex items-center justify-center gap-3 hover:-translate-y-1"
            >
              {simulating ? (
                <span className="animate-pulse flex items-center gap-2">⚙️ Calculando Rutas...</span>
              ) : (
                <>✨ Optimizar y Asignar</>
              )}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'routes' && (
        <div className="flex-1 flex gap-6 min-h-0 relative z-10 animate-[fadeIn_0.3s_ease-out]">
          <div className="w-1/3 bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col h-full shadow-2xl backdrop-blur-md">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center justify-between">
              Estado de la Flota
              <span className="bg-emerald-500/20 text-emerald-400 text-xs px-3 py-1 rounded-full border border-emerald-500/30">EN VIVO</span>
            </h2>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {allStops.filter(s => s.chofer !== "Sin Asignar").map((stop, idx) => (
                <div key={idx} className={`p-4 rounded-xl border relative overflow-hidden ${stop.entregado ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/10'}`}>
                  {stop.entregado ? (
                    <div className="absolute top-0 right-0 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-bl-xl border-l border-b border-emerald-500/30">
                      ENTREGADO ✅
                    </div>
                  ) : (
                    <div className="absolute top-0 right-0 bg-indigo-500/20 text-indigo-400 text-[10px] font-bold px-3 py-1 rounded-bl-xl border-l border-b border-indigo-500/30">
                      EN CAMINO 🚚
                    </div>
                  )}
                  <h3 className="font-bold text-white mb-1">{stop.cliente}</h3>
                  <p className="text-gray-400 text-sm mb-3 truncate">{stop.direccion}</p>
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className="bg-black/30 px-2 py-1 rounded font-mono text-gray-300">{stop.guia}</span>
                    <span className="font-bold text-indigo-300">{stop.chofer}</span>
                  </div>
                  
                  {/* Botón de Emergencia (Reasignar) */}
                  {!stop.entregado && (
                    <div className="mt-3 pt-3 border-t border-white/10 flex justify-end gap-2">
                      <select id={`reassign-${stop.guia}`} className="bg-black/30 border border-white/10 rounded-lg text-xs text-white p-1 outline-none">
                        <option value="">Transferir a...</option>
                        {drivers.filter(d => d.name !== stop.chofer).map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                      <button 
                        onClick={() => {
                          const newDriverId = (document.getElementById(`reassign-${stop.guia}`) as HTMLSelectElement).value;
                          if(newDriverId) reassignOrder(stop.guia, parseInt(newDriverId));
                        }}
                        className="bg-orange-500/20 hover:bg-orange-500/40 text-orange-400 border border-orange-500/30 text-xs px-2 py-1 rounded-lg transition-colors font-bold"
                      >
                        🔄 Reasignar
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {allStops.filter(s => s.chofer !== "Sin Asignar").length === 0 && (
                <div className="text-center text-gray-500 py-10">No hay paquetes en tránsito.</div>
              )}
            </div>
          </div>
          
          <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-4 overflow-hidden shadow-2xl relative">
            <h2 className="absolute top-8 left-8 z-[1000] bg-black/60 backdrop-blur-md text-white font-bold px-4 py-2 rounded-xl border border-white/10 shadow-lg flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
              Radar Satelital (Vista de Administrador)
            </h2>
            <MapContainer center={[39.4699, -0.3774]} zoom={11} style={{ height: '100%', width: '100%', borderRadius: '1rem' }} className="z-0">
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            </MapContainer>
          </div>
        </div>
      )}

      {activeTab === 'drivers' && (
        <div className="flex-1 overflow-y-auto relative z-10 animate-[fadeIn_0.3s_ease-out]">
          
          {/* Modal de Edición */}
          {editingDriver && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[2000] flex items-center justify-center">
              <div className="bg-bg-main border border-white/10 rounded-3xl p-8 w-[500px] shadow-2xl">
                <h3 className="text-2xl font-bold text-white mb-6">✏️ Editar Perfil de Chofer</h3>
                <form onSubmit={saveEditDriver} className="flex flex-col gap-4">
                  <input required className="w-full bg-black/40 border border-white/20 p-3 rounded-xl text-white outline-none focus:border-indigo-500" value={editingDriver.name} onChange={e=>setEditingDriver({...editingDriver, name: e.target.value})} placeholder="Nombre completo" />
                  <input required className="w-full bg-black/40 border border-white/20 p-3 rounded-xl text-white outline-none focus:border-indigo-500" value={editingDriver.phone} onChange={e=>setEditingDriver({...editingDriver, phone: e.target.value})} placeholder="Teléfono celular" />
                  <input required className="w-full bg-black/40 border border-white/20 p-3 rounded-xl text-white outline-none focus:border-indigo-500" value={editingDriver.vehicle_plate} onChange={e=>setEditingDriver({...editingDriver, vehicle_plate: e.target.value})} placeholder="Placa del Vehículo" />
                  <input required className="w-full bg-black/40 border border-red-500/30 p-3 rounded-xl text-white outline-none focus:border-red-500" value={editingDriver.emergency_contact} onChange={e=>setEditingDriver({...editingDriver, emergency_contact: e.target.value})} placeholder="Contacto de Emergencia" />
                  
                  <div className="flex gap-4 mt-4">
                    <button type="button" onClick={() => setEditingDriver(null)} className="flex-1 px-4 py-3 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition-all">Cancelar</button>
                    <button type="submit" className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)]">Guardar Cambios</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 w-full max-w-7xl mx-auto">
            {/* Formulario de Registro */}
            <div className="xl:col-span-1 bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-md h-fit">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="text-3xl">🪪</span> Contratar Empleado
              </h2>
              <form onSubmit={addDriver} className="flex flex-col gap-4">
                <div>
                  <label className="text-[10px] text-primary mb-1 block uppercase tracking-wider font-bold">Datos Personales</label>
                  <input required className="w-full px-4 py-3 bg-bg-main/50 border border-white/10 rounded-xl text-white outline-none focus:border-primary transition-colors mb-3" value={newDriverName} onChange={e=>setNewDriverName(e.target.value)} placeholder="Ej. Carlos Mendoza" />
                  <input required className="w-full px-4 py-3 bg-bg-main/50 border border-white/10 rounded-xl text-white outline-none focus:border-primary transition-colors" value={newDriverPhone} onChange={e=>setNewDriverPhone(e.target.value)} placeholder="Teléfono Móvil (Ej. 600 123 456)" />
                </div>
                
                <div className="mt-2">
                  <label className="text-[10px] text-primary mb-1 block uppercase tracking-wider font-bold">Asignación Vehicular</label>
                  <input required className="w-full px-4 py-3 bg-bg-main/50 border border-white/10 rounded-xl text-white outline-none focus:border-primary transition-colors" value={newDriverPlate} onChange={e=>setNewDriverPlate(e.target.value)} placeholder="Placa / Matrícula" />
                </div>

                <div className="mt-2">
                  <label className="text-[10px] text-red-400 mb-1 block uppercase tracking-wider font-bold">Seguridad Industrial</label>
                  <input required className="w-full px-4 py-3 bg-red-500/5 border border-red-500/20 rounded-xl text-white outline-none focus:border-red-500 transition-colors" value={newDriverEmergency} onChange={e=>setNewDriverEmergency(e.target.value)} placeholder="Avisar en caso de emergencia a..." />
                </div>

                <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl text-indigo-200 text-xs mt-4">
                  <strong>Acceso:</strong> Se creará automáticamente la credencial <code>chofer_ID</code> y la clave maestra <code>1234</code>.
                </div>
                <button type="submit" className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-4 mt-2 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all flex items-center justify-center gap-2">
                  <span className="text-xl">➕</span> Dar de Alta
                </button>
              </form>
            </div>
            
            {/* Lista de Personal */}
            <div className="xl:col-span-2">
              <h2 className="text-2xl font-bold text-white mb-6">Plantilla Activa ({drivers.length})</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {drivers.map(d => (
                  <div key={d.id} className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all flex flex-col">
                    <div className="p-5 flex-1 border-b border-white/5">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-3 items-center">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold shadow-lg border-2 border-black">
                            {d.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-lg leading-tight">{d.name}</h3>
                            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold border border-emerald-500/30">ACTIVO</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Credencial</p>
                          <p className="text-xs font-mono text-gray-300 bg-white/5 px-2 py-1 rounded">chofer_{d.id}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-400">
                        <p className="flex justify-between border-b border-white/5 pb-1"><span className="text-gray-500">📱 Celular:</span> <span className="text-gray-200">{d.phone || "No registrado"}</span></p>
                        <p className="flex justify-between border-b border-white/5 pb-1"><span className="text-gray-500">🚚 Vehículo:</span> <span className="text-gray-200 font-mono">{d.vehicle_plate || "No asignado"}</span></p>
                        <p className="flex justify-between"><span className="text-red-400/80">🚑 Emergencias:</span> <span className="text-red-300">{d.emergency_contact || "No registrado"}</span></p>
                      </div>
                    </div>
                    
                    {/* Botones de Acción */}
                    <div className="flex bg-black/60">
                      <button onClick={() => setEditingDriver(d)} className="flex-1 py-3 text-sm font-bold text-indigo-400 hover:bg-white/5 hover:text-indigo-300 transition-colors border-r border-white/5">
                        ✏️ Modificar
                      </button>
                      <button onClick={() => deleteDriver(d.id)} className="flex-1 py-3 text-sm font-bold text-red-500 hover:bg-red-500/10 hover:text-red-400 transition-colors">
                        🗑️ Despedir
                      </button>
                    </div>
                  </div>
                ))}
                {drivers.length === 0 && (
                  <div className="col-span-full py-12 text-center text-gray-500 border border-white/5 border-dashed rounded-2xl">
                    <span className="text-4xl block mb-4">🪹</span>
                    No hay choferes contratados. Registra al primero a la izquierda.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FleetPanel;
