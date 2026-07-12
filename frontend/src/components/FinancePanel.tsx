import React, { useState, useEffect } from 'react';
import api from '../api';

const FinancePanel = () => {
  const [settings, setSettings] = useState<any>(null);
  const [crmClients, setCrmClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resSettings, resCrm] = await Promise.all([
        api.get('/admin/settings'),
        api.get('/admin/crm')
      ]);
      setSettings(resSettings.data);
      // Ordenar CRM por clientes que más han gastado
      const sortedCrm = resCrm.data.sort((a: any, b: any) => b.total_spent - a.total_spent);
      setCrmClients(sortedCrm);
    } catch (err) {
      console.error("Error fetching finance data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/admin/settings', settings);
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 3000);
    } catch (err) {
      alert("Error al guardar tarifas");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({ ...settings, [e.target.name]: parseFloat(e.target.value) || 0 });
  };

  if (loading) {
    return <div className="p-8 text-center text-primary animate-pulse">Cargando datos financieros...</div>;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 h-full w-full">
      
      {/* Columna Izquierda: Tarifas Dinámicas */}
      <div className="flex-[1] bg-bg-card border border-border-color rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3 relative z-10">
          <span className="text-3xl">⚙️</span> Simulador de Tarifas
        </h2>
        
        <form onSubmit={handleSaveSettings} className="flex flex-col gap-5 relative z-10">
          <div className="bg-bg-main/50 p-4 rounded-2xl border border-white/5">
            <h3 className="text-xs text-primary font-bold uppercase tracking-wider mb-3">Tarifa Base (Fija)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Desde Almacén ($)</label>
                <input type="number" step="0.1" name="base_price_almacen" value={settings?.base_price_almacen} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="text-xs text-blue-300 mb-1 block">Recolección Domicilio ($)</label>
                <input type="number" step="0.1" name="base_price_domicilio" value={settings?.base_price_domicilio} onChange={handleChange} className="w-full bg-blue-500/10 border border-blue-500/30 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500 transition-colors" />
              </div>
            </div>
          </div>

          <div className="bg-bg-main/50 p-4 rounded-2xl border border-white/5">
            <h3 className="text-xs text-primary font-bold uppercase tracking-wider mb-3">Variables (Peso y Distancia)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Precio por Kg ($)</label>
                <input type="number" step="0.01" name="price_per_kg" value={settings?.price_per_kg} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Precio por Km ($)</label>
                <input type="number" step="0.01" name="price_per_km" value={settings?.price_per_km} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-primary transition-colors" />
              </div>
            </div>
          </div>

          <div className="bg-bg-main/50 p-4 rounded-2xl border border-white/5">
            <h3 className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-3">Recargos Especiales</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Paquete Mediano ($)</label>
                <input type="number" step="0.1" name="surcharge_mediano" value={settings?.surcharge_mediano} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="text-xs text-cyan-300 mb-1 block">Refrigerado ($)</label>
                <input type="number" step="0.1" name="surcharge_refrigerado" value={settings?.surcharge_refrigerado} onChange={handleChange} className="w-full bg-cyan-500/10 border border-cyan-500/30 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500 transition-colors" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={saving} className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg flex justify-center items-center gap-2 ${savedMsg ? 'bg-green-500 shadow-green-500/30' : 'bg-primary hover:bg-blue-600 shadow-primary/30'}`}>
            {saving ? <span className="animate-pulse">Guardando...</span> : savedMsg ? <>✅ Tarifas Actualizadas</> : <>💾 Guardar Tarifas Dinámicas</>}
          </button>
          <p className="text-[10px] text-gray-500 text-center">Los clientes verán los nuevos precios inmediatamente en sus cotizaciones.</p>
        </form>
      </div>

      {/* Columna Derecha: CRM de Clientes */}
      <div className="flex-[1.5] bg-bg-card border border-border-color rounded-3xl p-6 shadow-xl flex flex-col">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-3xl">👥</span> Historial de Clientes (CRM)
            </h2>
            <p className="text-gray-400 text-sm mt-1">Ranking de clientes por valor total (LTV).</p>
          </div>
          <div className="bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-xl border border-emerald-500/20 font-mono font-bold">
            Total Ingresos: ${crmClients.reduce((sum, c) => sum + c.total_spent, 0).toFixed(2)}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {crmClients.length === 0 ? (
            <div className="text-center py-20 text-gray-500 italic">No hay clientes registrados aún.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {crmClients.map((client, idx) => (
                <div key={client.phone} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-inner ${idx === 0 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50' : idx === 1 ? 'bg-gray-300/20 text-gray-300 border border-gray-400/50' : idx === 2 ? 'bg-orange-700/20 text-orange-400 border border-orange-700/50' : 'bg-primary/20 text-primary'}`}>
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-lg">{client.name}</h4>
                      <p className="text-gray-400 text-xs font-mono">📞 {client.phone}</p>
                    </div>
                  </div>
                  <div className="text-right flex gap-6 items-center">
                    <div>
                      <span className="block text-[10px] text-gray-500 uppercase tracking-wider">Paquetes</span>
                      <span className="text-white font-mono font-bold text-lg">{client.total_orders}</span>
                    </div>
                    <div className="bg-black/30 px-4 py-2 rounded-xl border border-white/5">
                      <span className="block text-[10px] text-emerald-500/70 uppercase tracking-wider mb-0.5">Gastado</span>
                      <span className="text-emerald-400 font-black text-xl">${client.total_spent.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default FinancePanel;
