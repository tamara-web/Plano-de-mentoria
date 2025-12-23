
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell 
} from 'recharts';
import { ExamResult, Diagnostic } from '../types';
import { SUBJECT_COLORS } from '../constants';

interface DashboardProps {
  history: ExamResult[];
  diagnostic: Diagnostic | null;
  onNewExam: () => void;
  onViewHistory: () => void;
  loadingDiagnostic: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ history, diagnostic, onNewExam, onViewHistory, loadingDiagnostic }) => {
  const weeklyResults = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return history.filter(h => new Date(h.date) >= oneWeekAgo);
  }, [history]);

  const stats = useMemo(() => {
    if (weeklyResults.length === 0) return null;
    const totalQuestions = weeklyResults.reduce((acc, r) => acc + r.totalQuestions, 0);
    const totalCorrect = weeklyResults.reduce((acc, r) => acc + r.score, 0);
    const avgScore = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

    // Accuracy per subject
    const subjectData: Record<string, { correct: number, total: number }> = {};
    weeklyResults.forEach(res => {
      res.details.forEach(d => {
        if (!subjectData[d.subject]) subjectData[d.subject] = { correct: 0, total: 0 };
        subjectData[d.subject].total += 1;
        if (d.isCorrect) subjectData[d.subject].correct += 1;
      });
    });

    const chartData = Object.entries(subjectData).map(([name, data]) => ({
      name,
      accuracy: Math.round((data.correct / data.total) * 100),
      count: data.total
    })).sort((a, b) => b.accuracy - a.accuracy);

    return {
      totalSimulated: weeklyResults.length,
      totalQuestions,
      accuracy: Math.round(avgScore),
      chartData
    };
  }, [weeklyResults]);

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fadeIn">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-blue-100">
          <i className="fas fa-graduation-cap text-4xl text-blue-600"></i>
        </div>
        <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">Comece sua Preparação</h2>
        <p className="text-slate-500 max-w-sm mb-10 font-medium">
          Sua jornada rumo à carteira da OAB começa com o primeiro passo. Realize um simulado para ativar sua inteligência artificial.
        </p>
        <button 
          onClick={onNewExam}
          className="px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-3xl shadow-2xl shadow-blue-200 transition-all active:scale-95"
        >
          Iniciar Primeiro Simulado
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fadeIn">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Seu Desempenho</h1>
          <p className="text-slate-500 font-medium">Análise avançada dos últimos 7 dias.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
           <button 
            onClick={onViewHistory}
            className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-all flex items-center space-x-2"
          >
            <i className="fas fa-history text-xs opacity-50"></i>
            <span>Histórico Completo</span>
          </button>
          <button 
            onClick={onNewExam}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100 transition-all flex items-center space-x-2"
          >
            <i className="fas fa-plus text-xs"></i>
            <span>Novo Simulado</span>
          </button>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                <i className="fas fa-chart-line text-lg"></i>
              </div>
              <h3 className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Aproveitamento</h3>
            </div>
            <p className="text-5xl font-black text-slate-900">{stats?.accuracy || 0}<span className="text-2xl text-slate-300 ml-1">%</span></p>
            <div className="mt-6 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]" style={{ width: `${stats?.accuracy || 0}%` }}></div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
                <i className="fas fa-book-open text-lg"></i>
              </div>
              <h3 className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Simulados</h3>
            </div>
            <p className="text-5xl font-black text-slate-900">{stats?.totalSimulated || 0}</p>
            <p className="text-xs text-slate-400 mt-4 font-bold tracking-tight">Provas na última semana</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group sm:col-span-2 lg:col-span-1">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-green-100 rounded-xl text-green-600">
                <i className="fas fa-tasks text-lg"></i>
              </div>
              <h3 className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Questões</h3>
            </div>
            <p className="text-5xl font-black text-slate-900">{stats?.totalQuestions || 0}</p>
            <p className="text-xs text-slate-400 mt-4 font-bold tracking-tight">Resolvidas com sucesso</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart */}
        <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Análise por Matéria</h3>
            <span className="text-[10px] font-black bg-slate-50 text-slate-400 px-3 py-1 rounded-full uppercase tracking-widest">Últimos 7 dias</span>
          </div>
          <div className="h-[350px]">
            {stats && stats.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100} 
                    style={{ fontSize: '10px', fontWeight: 700, fill: '#64748b' }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(241,245,249,0.5)' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontWeight: 700 }}
                  />
                  <Bar dataKey="accuracy" radius={[0, 8, 8, 0]} barSize={24}>
                    {stats.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SUBJECT_COLORS[entry.name] || "#3b82f6"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-50 rounded-[2rem]">
                <i className="fas fa-chart-pie text-3xl mb-4 opacity-20"></i>
                <p className="font-bold text-sm">Realize mais provas para ver o gráfico.</p>
              </div>
            )}
          </div>
        </div>

        {/* Diagnostic AI */}
        <div className="bg-slate-900 text-white p-8 sm:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-10 relative z-10">
            <h3 className="text-2xl font-black flex items-center space-x-3 tracking-tight">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40">
                <i className="fas fa-brain text-white text-sm"></i>
              </div>
              <span>Mentor Estratégico AI</span>
            </h3>
            {loadingDiagnostic && (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-400 border-t-transparent"></div>
            )}
          </div>

          {!diagnostic && !loadingDiagnostic ? (
            <div className="text-slate-500 border-2 border-dashed border-slate-800 rounded-3xl p-10 text-center relative z-10">
               <p className="font-bold mb-4 italic">"Estou pronto para analisar seu perfil de estudo assim que você completar alguns simulados."</p>
               <button onClick={onNewExam} className="text-blue-400 font-black uppercase text-xs tracking-widest hover:text-blue-300 transition-colors">
                  Iniciar agora
               </button>
            </div>
          ) : loadingDiagnostic ? (
            <div className="space-y-6 relative z-10">
              <div className="h-4 bg-slate-800 rounded-full w-3/4 animate-pulse"></div>
              <div className="h-4 bg-slate-800 rounded-full w-full animate-pulse"></div>
              <div className="h-4 bg-slate-800 rounded-full w-5/6 animate-pulse"></div>
            </div>
          ) : (
            <div className="space-y-8 relative z-10">
              <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50">
                <p className="text-slate-200 leading-relaxed italic font-medium">
                  "{diagnostic?.summary}"
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-green-500/10 border border-green-500/20 p-5 rounded-2xl group transition-all hover:bg-green-500/15">
                  <h4 className="text-green-400 text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                    <i className="fas fa-check-circle"></i>
                    Dominados
                  </h4>
                  <ul className="text-sm space-y-2">
                    {diagnostic?.strengths.map((s, i) => (
                      <li key={i} className="flex items-center space-x-2 font-bold text-slate-300">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-2xl group transition-all hover:bg-red-500/15">
                  <h4 className="text-red-400 text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                    <i className="fas fa-exclamation-triangle"></i>
                    Atenção
                  </h4>
                  <ul className="text-sm space-y-2">
                    {diagnostic?.weaknesses.map((w, i) => (
                      <li key={i} className="flex items-center space-x-2 font-bold text-slate-300">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-blue-600/20 border border-blue-500/30 p-6 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12">
                   <i className="fas fa-lightbulb text-4xl"></i>
                </div>
                <h4 className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-3">Plano de Ataque</h4>
                <p className="text-sm text-slate-200 font-bold leading-relaxed">
                  {diagnostic?.recommendation}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
