
import React, { useState, useMemo } from 'react';
import { ExamResult, OABSubject } from '../types';
import { ALL_SUBJECTS, SUBJECT_COLORS } from '../constants';

interface ExamHistoryProps {
  history: ExamResult[];
  onViewDetails: (result: ExamResult) => void;
  onBack: () => void;
}

const ExamHistory: React.FC<ExamHistoryProps> = ({ history, onViewDetails, onBack }) => {
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'score-high' | 'score-low'>('newest');

  const filteredHistory = useMemo(() => {
    let list = [...history];

    if (filterSubject !== 'all') {
      list = list.filter(item => item.subject === filterSubject);
    }

    list.sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortOrder === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortOrder === 'score-high') return (b.score / b.totalQuestions) - (a.score / a.totalQuestions);
      if (sortOrder === 'score-low') return (a.score / a.totalQuestions) - (b.score / b.totalQuestions);
      return 0;
    });

    return list;
  }, [history, filterSubject, sortOrder]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  return (
    <div className="animate-fadeIn space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Histórico de Provas</h2>
          <p className="text-slate-500 font-medium">Reveja cada passo da sua jornada.</p>
        </div>
        <button 
          onClick={onBack}
          className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center space-x-2"
        >
          <i className="fas fa-arrow-left text-xs"></i>
          <span>Voltar ao Dashboard</span>
        </button>
      </header>

      {/* Filters */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Filtrar por Matéria</label>
          <select 
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
          >
            <option value="all">Todas as Matérias</option>
            <option value="Geral">Simulados Gerais</option>
            {ALL_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Ordenar por</label>
          <select 
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
          >
            <option value="newest">Mais Recentes</option>
            <option value="oldest">Mais Antigas</option>
            <option value="score-high">Maior Desempenho</option>
            <option value="score-low">Menor Desempenho</option>
          </select>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-4">
        {filteredHistory.length === 0 ? (
          <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-slate-100">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-search text-slate-300 text-xl"></i>
            </div>
            <p className="text-slate-400 font-bold">Nenhum simulado encontrado com os filtros aplicados.</p>
          </div>
        ) : (
          filteredHistory.map((res) => {
            const percentage = Math.round((res.score / res.totalQuestions) * 100);
            const isApproved = res.score >= (res.totalQuestions * 0.5);

            return (
              <div 
                key={res.id} 
                className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:border-blue-200 transition-all flex flex-col md:flex-row items-center gap-6 group"
              >
                <div className="flex-shrink-0 w-20 h-20 rounded-3xl bg-slate-50 flex flex-col items-center justify-center border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-all">
                   <span className="text-2xl font-black text-slate-900">{percentage}%</span>
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Performance</span>
                </div>

                <div className="flex-grow text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">{res.subject === 'Geral' ? 'Simulado Geral FGV' : res.subject}</h3>
                    {res.totalQuestions === 80 && (
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-500 text-[9px] font-black rounded uppercase border border-indigo-100">Oficial</span>
                    )}
                  </div>
                  <p className="text-slate-400 text-sm font-medium mb-4">{formatDate(res.date)}</p>
                  
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                    <div className="flex items-center space-x-2 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                      <i className="fas fa-bullseye text-blue-500"></i>
                      <span>{res.score} / {res.totalQuestions} Acertos</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                      <i className="fas fa-hourglass-half text-amber-500"></i>
                      <span>{formatTime(res.timeSpentSeconds)}</span>
                    </div>
                    {res.tabExitCount > 0 && (
                      <div className="flex items-center space-x-2 text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                        <i className="fas fa-exclamation-triangle"></i>
                        <span>{res.tabExitCount} Consultas</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0 flex items-center gap-3">
                  <div className={`hidden sm:flex px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest ${isApproved ? 'bg-green-50 border-green-200 text-green-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                    {isApproved ? 'Aprovado' : 'Abaixo da Meta'}
                  </div>
                  <button 
                    onClick={() => onViewDetails(res)}
                    className="w-12 h-12 bg-slate-900 hover:bg-black text-white rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-90"
                    title="Ver Detalhes"
                  >
                    <i className="fas fa-eye"></i>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ExamHistory;
