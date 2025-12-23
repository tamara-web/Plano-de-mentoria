
import React, { useMemo, useState } from 'react';
import { UserProfile, ExamResult, OABSubject } from '../types';
import { SUBJECT_COLORS } from '../constants';

interface MentorDashboardProps {
  students: UserProfile[];
  allResults: Record<string, ExamResult[]>;
  onViewStudent: (student: UserProfile) => void;
}

const MentorDashboard: React.FC<MentorDashboardProps> = ({ students, allResults, onViewStudent }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [perfFilter, setPerfFilter] = useState<'all' | 'above' | 'below'>('all');
  const [examCountFilter, setExamCountFilter] = useState<'all' | 'none' | 'atleast1' | 'atleast5'>('all');
  const [recencyFilter, setRecencyFilter] = useState<'all' | 'week' | 'month'>('all');

  const stats = useMemo(() => {
    const flattenedResults = Object.values(allResults).flat();
    const totalExams = flattenedResults.length;
    
    const avgScore = totalExams > 0 
      ? flattenedResults.reduce((acc, r) => acc + (r.score / r.totalQuestions), 0) / totalExams 
      : 0;

    const subjectErrors: Record<string, number> = {};
    flattenedResults.forEach(res => {
      res.details.forEach(d => {
        if (!d.isCorrect) {
          subjectErrors[d.subject] = (subjectErrors[d.subject] || 0) + 1;
        }
      });
    });

    const topMissed = Object.entries(subjectErrors)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([subject]) => subject);

    return {
      totalStudents: students.length,
      totalExams,
      avgScore: Math.round(avgScore * 100),
      topMissed
    };
  }, [students, allResults]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const results = allResults[s.id] || [];
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           s.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      // Performance Filter
      const avg = results.length > 0 
        ? (results.reduce((acc, r) => acc + (r.score / r.totalQuestions), 0) / results.length) * 100
        : 0;
      
      if (perfFilter === 'above' && avg < 50) return false;
      if (perfFilter === 'below' && (avg >= 50 || results.length === 0)) return false;

      // Exam Count Filter
      if (examCountFilter === 'none' && results.length > 0) return false;
      if (examCountFilter === 'atleast1' && results.length < 1) return false;
      if (examCountFilter === 'atleast5' && results.length < 5) return false;

      // Recency Filter
      if (recencyFilter !== 'all') {
        if (results.length === 0) return false;
        const lastExamDate = new Date(results[0].date).getTime();
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        if (recencyFilter === 'week' && now - lastExamDate > oneDay * 7) return false;
        if (recencyFilter === 'month' && now - lastExamDate > oneDay * 30) return false;
      }

      return true;
    });
  }, [students, searchTerm, perfFilter, examCountFilter, recencyFilter, allResults]);

  return (
    <div className="animate-fadeIn space-y-12">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Painel Tamara Farias</h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-3 ml-1">Monitoramento Estratégico de Alunos</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors"></i>
            <input 
              type="text" 
              placeholder="Buscar aluno..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none w-full sm:w-80 font-bold text-sm transition-all"
            />
          </div>
          <div className="hidden sm:flex bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm items-center gap-4">
             <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
               <i className="fas fa-crown"></i>
             </div>
             <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Tamara Farias (Mentora)</span>
          </div>
        </div>
      </header>

      {/* Strategic Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center">
              <i className="fas fa-users text-lg"></i>
            </div>
            <h3 className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Alunos Ativos</h3>
          </div>
          <p className="text-5xl font-black text-slate-900">{stats.totalStudents}</p>
        </div>
        
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center">
              <i className="fas fa-clipboard-list text-lg"></i>
            </div>
            <h3 className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Total Simulados</h3>
          </div>
          <p className="text-5xl font-black text-slate-900">{stats.totalExams}</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-green-100 text-green-700 rounded-2xl flex items-center justify-center">
              <i className="fas fa-percentage text-lg"></i>
            </div>
            <h3 className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Média Geral</h3>
          </div>
          <p className="text-5xl font-black text-slate-900">{stats.avgScore}%</p>
        </div>

        <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl -mr-16 -mt-16"></div>
          <div className="flex items-center space-x-4 mb-4 relative z-10">
            <i className="fas fa-exclamation-triangle text-amber-400"></i>
            <h3 className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Pontos Críticos (Geral)</h3>
          </div>
          <div className="space-y-2 relative z-10">
            {stats.topMissed.length > 0 ? stats.topMissed.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: SUBJECT_COLORS[s] || '#fff' }}></span>
                <span className="text-[11px] font-black truncate">{s}</span>
              </div>
            )) : <p className="text-xs font-bold text-slate-500">Aguardando dados...</p>}
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex flex-wrap gap-6 items-center">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Desempenho</label>
            <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
              <button 
                onClick={() => setPerfFilter('all')}
                className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${perfFilter === 'all' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              >Todos</button>
              <button 
                onClick={() => setPerfFilter('above')}
                className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${perfFilter === 'above' ? 'bg-white shadow-md text-green-600' : 'text-slate-400 hover:text-slate-600'}`}
              >Aprovando</button>
              <button 
                onClick={() => setPerfFilter('below')}
                className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${perfFilter === 'below' ? 'bg-white shadow-md text-red-600' : 'text-slate-400 hover:text-slate-600'}`}
              >Abaixo</button>
            </div>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Volume de Simulados</label>
            <select 
              value={examCountFilter}
              onChange={(e) => setExamCountFilter(e.target.value as any)}
              className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-600 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-xs"
            >
              <option value="all">Qualquer quantidade</option>
              <option value="none">Nenhum realizado</option>
              <option value="atleast1">Pelo menos 1</option>
              <option value="atleast5">Mais de 5 provas</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Última Atividade</label>
            <select 
              value={recencyFilter}
              onChange={(e) => setRecencyFilter(e.target.value as any)}
              className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-600 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-xs"
            >
              <option value="all">Sempre</option>
              <option value="week">Esta semana</option>
              <option value="month">Este mês</option>
            </select>
          </div>
        </div>
      </div>

      {/* Student List Table */}
      <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-8 sm:p-10 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
             <i className="fas fa-user-shield text-slate-300"></i>
             Gestão Acadêmica
          </h2>
          <div className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-widest">
            {filteredStudents.length} de {students.length} alunos
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Estudante</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 text-center">Simulados</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Performance</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 text-right">Ação Estratégica</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-10 py-24 text-center">
                    <div className="flex flex-col items-center opacity-30">
                      <i className="fas fa-search text-4xl mb-4"></i>
                      <p className="font-black uppercase tracking-widest text-xs">Nenhum aluno corresponde aos filtros.</p>
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.map(student => {
                const results = allResults[student.id] || [];
                const studentAvg = results.length > 0 
                  ? Math.round((results.reduce((acc, r) => acc + (r.score / r.totalQuestions), 0) / results.length) * 100)
                  : 0;

                return (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all text-xl shadow-inner">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-lg leading-tight group-hover:text-indigo-700 transition-colors">{student.name}</p>
                          <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8 text-center">
                      <div className="inline-block px-4 py-2 bg-slate-100 rounded-xl font-black text-slate-600">
                        {results.length}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center space-x-5">
                         <div className="flex flex-col">
                           <span className={`font-black text-xl leading-none ${studentAvg >= 50 ? 'text-green-600' : 'text-amber-500'}`}>{studentAvg}%</span>
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mt-1">Acertos</span>
                         </div>
                         <div className="w-32 bg-slate-100 h-3 rounded-full overflow-hidden shadow-inner hidden sm:block">
                            <div className={`h-full transition-all duration-1000 ease-out ${studentAvg >= 50 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]'}`} style={{ width: `${studentAvg}%` }}></div>
                         </div>
                      </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <button 
                        onClick={() => onViewStudent(student)}
                        className="px-8 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-700 transition-all active:scale-95 shadow-lg flex items-center gap-3 ml-auto group/btn"
                      >
                        <i className="fas fa-brain group-hover/btn:animate-pulse"></i>
                        <span>Análise Mentor</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MentorDashboard;
