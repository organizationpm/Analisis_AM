import React, { useState, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { Dashboard } from './components/Dashboard';
import { Login } from './components/Login';
import { ProcessedCompany, DatasetStats } from './types';
import { Package, TrendingUp, LogOut, UploadCloud } from 'lucide-react';
import { checkSession, logout } from './utils/security';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [data, setData] = useState<ProcessedCompany[] | null>(null);
  const [stats, setStats] = useState<DatasetStats | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    if (checkSession()) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleDataProcessed = (processedData: ProcessedCompany[], processedStats: DatasetStats) => {
    setData(processedData);
    setStats(processedStats);
  };

  const handleResetData = () => {
    if (window.confirm('¿Estás seguro? Se perderán los datos actuales del análisis y volverás a la pantalla de carga.')) {
      setData(null);
      setStats(null);
    }
  };

  // --- AUTH GUARD ---
  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm z-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Market Intel<span className="text-blue-600">Dash</span></h1>
          </div>
          <div className="flex items-center gap-3">
             {data && (
               <button 
                 onClick={handleResetData}
                 className="flex items-center gap-2 text-gray-600 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium mr-2"
                 title="Cargar nuevo archivo"
               >
                 <UploadCloud className="w-4 h-4" />
                 <span className="hidden sm:inline">Nuevo Archivo</span>
               </button>
             )}
             
             <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>

             <div className="text-sm text-gray-500 hidden sm:block px-2">
                v2.1
             </div>
             <button 
               onClick={logout}
               className="text-gray-500 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
               title="Cerrar Sesión"
             >
               <LogOut className="w-5 h-5" />
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {!data || !stats ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4">
             <div className="max-w-2xl w-full">
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Inteligencia de Mercado (Alimarket Standard)</h2>
                  <p className="text-gray-600 text-lg">Sube cualquier Excel con formato estándar Alimarket (Empresas, Profesionales, Datos) para obtener análisis sectorial, scoring y tendencias IA.</p>
                </div>
                <FileUpload onDataProcessed={handleDataProcessed} />
             </div>
          </div>
        ) : (
          <Dashboard data={data} stats={stats} />
        )}
      </main>
    </div>
  );
}