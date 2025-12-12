import React, { useState, useMemo } from 'react';
import { ProcessedCompany, DatasetStats } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { 
  Database, Target, List, Search, 
  ArrowUpDown, ExternalLink, Mail, Phone, X, User, TrendingUp, Briefcase, 
  Package, Truck, Utensils, AlertTriangle, CheckCircle2, Download, FileSpreadsheet, FileText, Fingerprint, Layers
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DashboardProps {
  data: ProcessedCompany[];
  stats: DatasetStats;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff7300', '#d0ed57'];

const formatCurrencyMillions = (value: number | undefined) => {
  if (value === undefined || value === null) return '-';
  const millions = value / 1000000;
  return new Intl.NumberFormat('es-ES', { 
    style: 'decimal', 
    minimumFractionDigits: 1, 
    maximumFractionDigits: 1 
  }).format(millions) + ' M€';
};

// --- SUB-COMPONENT: Company Detail Modal ---
const CompanyDetailModal = ({ company, onClose }: { company: ProcessedCompany; onClose: () => void }) => {
  if (!company) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`p-6 text-white flex justify-between items-start shrink-0 bg-gradient-to-r ${company.ppwr.isRelevant ? 'from-blue-900 to-slate-800' : 'from-gray-700 to-gray-900'}`}>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold">{company.normalizedName}</h2>
              <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-semibold backdrop-blur-md">
                Score: {company.score.total}/100
              </span>
            </div>
            <p className="opacity-90 flex items-center gap-2 text-sm">
              {company.segmentation.primarySector} • {company.segmentation.province}
            </p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Column 1: Segmentation Details */}
            <div className="space-y-4">
              <h3 className="text-gray-900 font-bold flex items-center gap-2 border-b pb-2">
                <Layers className="w-4 h-4 text-blue-500" /> Segmentación
              </h3>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-3">
                 <div>
                    <span className="text-xs uppercase text-blue-400 font-bold">Material Principal</span>
                    <p className="font-semibold text-blue-900">{company.segmentation.material}</p>
                 </div>
                 <div>
                    <span className="text-xs uppercase text-blue-400 font-bold">Tipo Envase</span>
                    <p className="font-semibold text-blue-900">{company.segmentation.packagingType}</p>
                 </div>
                 <div>
                    <span className="text-xs uppercase text-blue-400 font-bold">Tamaño</span>
                    <p className="font-semibold text-blue-900">{company.segmentation.sizeLabel}</p>
                 </div>
              </div>
            </div>

            {/* Column 2: PPWR Deep Dive */}
            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h3 className="text-slate-900 font-bold flex items-center gap-2 border-b pb-2 border-slate-200">
                <Target className="w-4 h-4 text-blue-600" /> Análisis PPWR
              </h3>
              
              {company.ppwr.isRelevant ? (
                <>
                  <div className="mb-4">
                    <div className="flex justify-between text-xs font-semibold uppercase text-gray-500 mb-1">
                      <span>Riesgo</span>
                      <span>Oportunidad</span>
                    </div>
                    <div className="h-6 w-full bg-gray-200 rounded-lg overflow-hidden relative border border-gray-300">
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-400 to-green-500"></div>
                      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/50"></div>
                      <div 
                        className="absolute top-0 bottom-0 w-1.5 bg-slate-900 border-x border-white shadow-lg transition-all duration-500"
                        style={{ left: `${((company.ppwr.impactRatio + 10) / 20) * 100}%`, transform: 'translateX(-50%)' }}
                      ></div>
                    </div>
                    <div className="mt-2 text-center font-bold text-slate-800">
                      {company.ppwr.impactLabel} ({company.ppwr.impactRatio})
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                     <p className="text-xs font-semibold text-gray-500 uppercase">Factores Clave:</p>
                     <ul className="text-xs space-y-1">
                        {company.ppwr.keyDrivers.map((driver, i) => (
                           <li key={i} className="flex items-start gap-1.5">
                              {driver.includes("Negativo") || driver.includes("Reto") ? 
                                <AlertTriangle className="w-3 h-3 text-red-500 mt-0.5 shrink-0"/> : 
                                <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 shrink-0"/>
                              }
                              <span className="text-gray-700 leading-tight">{driver}</span>
                           </li>
                        ))}
                     </ul>
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-500 italic p-4 text-center">
                  Esta empresa no pertenece al sector del envase.
                </div>
              )}
            </div>

            {/* Column 3: Contact & Basic */}
            <div className="space-y-4">
              <h3 className="text-gray-900 font-bold flex items-center gap-2 border-b pb-2">
                <Fingerprint className="w-4 h-4 text-blue-500" /> Datos Corporativos
              </h3>
              
              <div className="text-sm space-y-3">
                {company.Web ? (
                  <a href={company.Web.startsWith('http') ? company.Web : `https://${company.Web}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline">
                    <ExternalLink className="w-4 h-4" /> {company.Web}
                  </a>
                ) : <span className="text-gray-400 italic">Web no disponible</span>}
                
                {company.Email && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="w-4 h-4 text-gray-400" /> {company.Email}
                  </div>
                )}
                {company['Teléfono'] && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="w-4 h-4 text-gray-400" /> {company['Teléfono']}
                  </div>
                )}
                <div className="text-gray-600">
                  <span className="font-semibold block text-xs text-gray-400 uppercase">Sede</span>
                  {company['Municipio']}, {company['Provincia']}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Scoring: {company.score.total}/100</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                     <div>Volumen: <span className="font-bold">{company.score.breakdown.volume}</span></div>
                     <div>Equipo: <span className="font-bold">{company.score.breakdown.humanCapital}</span></div>
                     <div>Crecim.: <span className="font-bold">{company.score.breakdown.growth}</span></div>
                     <div>Digital: <span className="font-bold">{company.score.breakdown.digital}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN DASHBOARD COMPONENT ---
export const Dashboard: React.FC<DashboardProps> = ({ data, stats }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'explorer' | 'shortlist'>('overview');
  const [selectedCompany, setSelectedCompany] = useState<ProcessedCompany | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMaterial, setFilterMaterial] = useState('Todos');
  const [filterType, setFilterType] = useState('Todos');
  const [filterProvince, setFilterProvince] = useState('Todos');
  
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'score.total', direction: 'desc' });

  // Filtering Logic
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = item.normalizedName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.segmentation.primarySector.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMaterial = filterMaterial === 'Todos' || item.segmentation.material === filterMaterial;
      const matchesType = filterType === 'Todos' || item.segmentation.packagingType === filterType;
      const matchesProvince = filterProvince === 'Todos' || item.segmentation.province === filterProvince;
      
      return matchesSearch && matchesMaterial && matchesType && matchesProvince;
    });
  }, [data, searchTerm, filterMaterial, filterType, filterProvince]);

  // Sorting Logic
  const sortedData = useMemo(() => {
    const sorted = [...filteredData];
    sorted.sort((a, b) => {
      let aValue: any = a;
      let bValue: any = b;

      const keys = sortConfig.key.split('.');
      keys.forEach(k => {
        aValue = aValue ? aValue[k] : 0;
        bValue = bValue ? bValue[k] : 0;
      });

      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if ((aValue as any) < (bValue as any)) return sortConfig.direction === 'asc' ? -1 : 1;
      if ((aValue as any) > (bValue as any)) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredData, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const uniqueProvinces = ['Todos', ...Object.keys(stats.topProvinces).sort()];
  const uniqueMaterials = ['Todos', ...Object.keys(stats.materialDistribution || {}).sort()];
  const uniqueTypes = ['Todos', ...Object.keys(stats.typeDistribution || {}).sort()];

  // Charts Data
  const materialData = Object.entries(stats.materialDistribution || {})
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));

  const typeData = Object.entries(stats.typeDistribution || {})
    .map(([name, value]) => ({ name, value }));

  return (
    <div className="flex flex-col h-full">
      {/* Modal */}
      {selectedCompany && (
        <CompanyDetailModal company={selectedCompany} onClose={() => setSelectedCompany(null)} />
      )}

      {/* Tab Navigation */}
      <div className="flex border-b bg-white px-6 pt-4 space-x-6 sticky top-0 z-10 shadow-sm overflow-x-auto">
        <button onClick={() => setActiveTab('overview')} className={`pb-3 px-2 flex items-center gap-2 font-medium text-sm border-b-2 ${activeTab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
          <Database className="w-4 h-4" /> Panorama
        </button>
        <button onClick={() => setActiveTab('explorer')} className={`pb-3 px-2 flex items-center gap-2 font-medium text-sm border-b-2 ${activeTab === 'explorer' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
          <Search className="w-4 h-4" /> Explorador
        </button>
        <button onClick={() => setActiveTab('shortlist')} className={`pb-3 px-2 flex items-center gap-2 font-medium text-sm border-b-2 ${activeTab === 'shortlist' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
          <List className="w-4 h-4" /> Top Leaders
        </button>
      </div>

      <div className="p-6 bg-gray-50 min-h-screen">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <p className="text-gray-500 text-xs uppercase font-bold">Total Empresas</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalCompanies}</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <p className="text-gray-500 text-xs uppercase font-bold">Riesgo Alto PPWR</p>
                <p className="text-3xl font-bold text-red-500 mt-1">{stats.ppwrStats?.highImpact || 0}</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <p className="text-gray-500 text-xs uppercase font-bold">Oportunidad PPWR</p>
                <p className="text-3xl font-bold text-green-500 mt-1">{stats.ppwrStats?.opportunity || 0}</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <p className="text-gray-500 text-xs uppercase font-bold">Material Predominante</p>
                <p className="text-xl font-bold text-blue-500 mt-2 truncate">
                  {Object.entries(stats.materialDistribution).sort((a,b) => (b[1] as number) - (a[1] as number))[0]?.[0] || '-'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm h-96">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribución por Materiales</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={materialData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {materialData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend layout="vertical" align="right" verticalAlign="middle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm h-96">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Tipo de Envase (Segmentación)</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={typeData} layout="vertical">
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} style={{ fontSize: '12px' }}/>
                    <Tooltip />
                    <Bar dataKey="value" fill="#82ca9d" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* EXPLORER TAB */}
        {activeTab === 'explorer' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col xl:flex-row gap-4 justify-between">
               <div className="flex flex-col md:flex-row gap-2 flex-1">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Buscar empresa..." 
                      className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select value={filterMaterial} onChange={(e) => setFilterMaterial(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white min-w-[140px]">
                    {uniqueMaterials.map(m => <option key={m} value={m}>{m === 'Todos' ? 'Material: Todos' : m}</option>)}
                  </select>
                  <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white min-w-[140px]">
                    {uniqueTypes.map(t => <option key={t} value={t}>{t === 'Todos' ? 'Tipo: Todos' : t}</option>)}
                  </select>
                  <select value={filterProvince} onChange={(e) => setFilterProvince(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white min-w-[140px]">
                    {uniqueProvinces.map(p => <option key={p} value={p}>{p === 'Todos' ? 'Provincia: Todas' : p}</option>)}
                  </select>
               </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('normalizedName')}>Empresa</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material / Tipo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('ppwr.impactRatio')}>Impacto PPWR</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('score.total')}>Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ventas</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedData.map((company) => (
                      <tr key={company['Id. Empresa']} onClick={() => setSelectedCompany(company)} className="hover:bg-blue-50 cursor-pointer transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                           <div className="text-sm font-medium text-gray-900">{company.normalizedName}</div>
                           <div className="text-xs text-gray-500">{company.segmentation.primarySector}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                           <div className="text-sm text-gray-800">{company.segmentation.material}</div>
                           <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{company.segmentation.packagingType}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {company.ppwr.isRelevant ? (
                             <span className={`text-xs font-bold px-2 py-1 rounded-full ${company.ppwr.impactRatio > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                               {company.ppwr.impactRatio > 0 ? '+' : ''}{company.ppwr.impactRatio}
                             </span>
                          ) : <span className="text-gray-300">-</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                           <div className="text-sm font-bold text-blue-600">{company.score.total}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                           {formatCurrencyMillions(company['Ventas 2024'])}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SHORTLIST TAB */}
        {activeTab === 'shortlist' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Top Leaders - Priorización</h2>
            <div className="grid gap-4">
              {data.slice(0, 20).map((company, idx) => (
                <div key={company['Id. Empresa']} onClick={() => setSelectedCompany(company)} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 cursor-pointer hover:shadow-md transition-all">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">{idx + 1}</div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">{company.normalizedName}</h4>
                      <div className="flex gap-2 mt-1">
                         <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">{company.segmentation.material}</span>
                         <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-100">{company.segmentation.packagingType}</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full md:w-32 text-center">
                     <p className="text-2xl font-black text-blue-600">{company.score.total}</p>
                     <p className="text-xs text-gray-400 uppercase">Score Global</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}