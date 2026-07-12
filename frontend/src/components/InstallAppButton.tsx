import React, { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import InstallAppModal from './InstallAppModal';

const InstallAppButton = () => {
  const [showInstallHelp, setShowInstallHelp] = useState(false);

  // Ocultar botón si ya estamos dentro de la App Nativa (Android/iOS)
  if (Capacitor.isNativePlatform()) {
    return null;
  }

  return (
    <>
        <button 
          onClick={() => setShowInstallHelp(true)} 
          className="flex items-center gap-2 bg-emerald-600/80 hover:bg-emerald-500 backdrop-blur-md border border-emerald-400/50 px-5 py-2.5 rounded-full text-sm font-bold text-white transition-all shadow-lg hover:scale-105"
        >
          📱 Descargar App
        </button>
      {showInstallHelp && <InstallAppModal onClose={() => setShowInstallHelp(false)} />}
    </>
  );
};

export default InstallAppButton;
