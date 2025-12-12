import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { checkPassword, saveSession } from '../utils/security';

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [debugMsg, setDebugMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    setDebugMsg('');

    // Pequeño delay para UX
    await new Promise(r => setTimeout(r, 300));

    try {
      const result = await checkPassword(password);

      if (result.isValid) {
        saveSession();
        onLoginSuccess();
      } else {
        setError(true);
        if (result.debugInfo) setDebugMsg(result.debugInfo);
      }
    } catch (err) {
      console.error(err);
      setError(true);
      setDebugMsg("Error inesperado en validación.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-blue-600 p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Acceso Restringido</h2>
          <p className="text-blue-100 mt-2 text-sm">Market Intelligence Dashboard</p>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Clave de Acceso</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(false);
                  }}
                  className={`block w-full px-4 py-3 pr-12 rounded-lg border focus:ring-2 focus:outline-none transition-colors ${
                    error 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50' 
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                  }`}
                  placeholder="Introduce la clave..."
                  autoFocus
                />
                
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {error && (
                <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100 text-red-700 text-sm">
                   <div className="flex items-center gap-2 font-medium mb-1">
                      <AlertCircle className="w-4 h-4" /> Acceso Denegado
                   </div>
                   <p className="text-xs opacity-90">La contraseña no coincide.</p>
                   {debugMsg && (
                     <p className="text-[10px] font-mono mt-2 pt-2 border-t border-red-200 opacity-70">
                       Debug: {debugMsg}
                     </p>
                   )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              className={`w-full py-3 px-4 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg active:scale-95'
              }`}
            >
              {loading ? 'Verificando...' : 'Entrar al Dashboard'} 
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};