
import React, { useState, useEffect, useMemo } from 'react';
import { OABSubject, ExamResult, Question, Diagnostic, UserProfile } from './types';
import { ALL_SUBJECTS, DEFAULT_EXAM_SIZE } from './constants';
import { generateOABQuestions, generateAIDiagnostic, generateInstantDiagnostic } from './services/geminiService';
import ExamTaker from './components/ExamTaker';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import ExamHistory from './components/ExamHistory';
import MentorDashboard from './components/MentorDashboard';
import ExamReview from './components/ExamReview';

type View = 'LOGIN' | 'DASHBOARD' | 'SETUP' | 'EXAM' | 'RESULTS' | 'HISTORY' | 'MENTOR_VIEW_STUDENT';
type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [existingUsers, setExistingUsers] = useState<UserProfile[]>([]);
  const [view, setView] = useState<View>('LOGIN');
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'light');
  
  const [history, setHistory] = useState<ExamResult[]>([]);
  const [viewingStudent, setViewingStudent] = useState<UserProfile | null>(null);
  const [allUserResults, setAllUserResults] = useState<Record<string, ExamResult[]>>({});

  const [loading, setLoading] = useState(false);
  const [loadingInstantDiag, setLoadingInstantDiag] = useState(false);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [lastResult, setLastResult] = useState<ExamResult | null>(null);
  const [diagnostic, setDiagnostic] = useState<Diagnostic | null>(null);
  const [loadingDiagnostic, setLoadingDiagnostic] = useState(false);

  const [selectedSubject, setSelectedSubject] = useState<OABSubject | "Geral">("Geral");
  const [questionCount, setQuestionCount] = useState(DEFAULT_EXAM_SIZE);

  // Theme Sync
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Initial Data Load
  useEffect(() => {
    const savedUsers = localStorage.getItem('oab_users');
    if (savedUsers) {
      try { 
        const users: UserProfile[] = JSON.parse(savedUsers);
        setExistingUsers(users);
        
        const resultsMap: Record<string, ExamResult[]> = {};
        users.forEach(u => {
          const uHistory = localStorage.getItem(`oab_history_${u.id}`);
          if (uHistory) resultsMap[u.id] = JSON.parse(uHistory);
        });
        setAllUserResults(resultsMap);
      } catch(e) {
        console.error("Error loading initial data", e);
      }
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'student') {
        setHistory(allUserResults[currentUser.id] || []);
      }
      setView('DASHBOARD');
    }
  }, [currentUser]);

  useEffect(() => {
    if (history.length > 0) {
      handleUpdateDiagnostic();
    } else {
      setDiagnostic(null);
    }
    
    if (currentUser?.role === 'student' && !viewingStudent) {
      localStorage.setItem(`oab_history_${currentUser.id}`, JSON.stringify(history));
      setAllUserResults(prev => ({ ...prev, [currentUser.id]: history }));
    }
  }, [history]);

  const handleLogin = (user: UserProfile) => {
    const isNew = !existingUsers.find(u => u.id === user.id);
    if (isNew) {
      const updated = [user, ...existingUsers];
      setExistingUsers(updated);
      localStorage.setItem('oab_users', JSON.stringify(updated));
    }
    setCurrentUser(user);
  };

  const logout = () => {
    setCurrentUser(null);
    setHistory([]);
    setDiagnostic(null);
    setViewingStudent(null);
    setView('LOGIN');
  };

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleUpdateDiagnostic = async () => {
    if (loadingDiagnostic) return;
    setLoadingDiagnostic(true);
    try {
      const diag = await generateAIDiagnostic(history);
      setDiagnostic(diag);
    } catch (e) {
      console.error("Diagnostic failed", e);
    } finally {
      setLoadingDiagnostic(false);
    }
  };

  const startExam = async (overrideCount?: number, overrideSubject?: any) => {
    setLoading(true);
    try {
      const finalCount = overrideCount || questionCount;
      const finalSubject = overrideSubject || selectedSubject;
      const recentTopics = history.slice(0, 3).flatMap(h => h.details.map(d => d.subject));
      const uniqueRecentTopics = Array.from(new Set(recentTopics)).slice(0, 10);
      const questions = await generateOABQuestions(finalSubject, finalCount, uniqueRecentTopics);
      setExamQuestions(questions);
      setView('EXAM');
    } catch (e) {
      alert("Erro ao gerar questões. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinishExam = async (result: ExamResult) => {
    setLoadingInstantDiag(true);
    setView('RESULTS');
    try {
      const instantDiag = await generateInstantDiagnostic(result);
      const enrichedResult = { ...result, aiDiagnostic: instantDiag };
      setLastResult(enrichedResult);
      setHistory(prev => [enrichedResult, ...prev]);
    } catch (e) {
      setLastResult(result);
      setHistory(prev => [result, ...prev]);
    } finally {
      setLoadingInstantDiag(false);
    }
  };

  const handleMentorViewStudent = (student: UserProfile) => {
    setViewingStudent(student);
    const studentHistory = allUserResults[student.id] || [];
    setHistory(studentHistory);
    setView('MENTOR_VIEW_STUDENT');
  };

  const navigateHome = () => {
    setViewingStudent(null);
    if (currentUser?.role === 'student') {
      setHistory(allUserResults[currentUser.id] || []);
    } else {
      setHistory([]);
      setDiagnostic(null);
    }
    setView('DASHBOARD');
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {currentUser && (
        <nav className={`border-b sticky top-0 z-50 transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-20 items-center">
              <div className="flex items-center space-x-3 cursor-pointer" onClick={navigateHome}>
                <div className={`w-12 h-12 ${currentUser.role === 'mentor' ? 'bg-indigo-800 shadow-indigo-100' : 'bg-blue-800 shadow-blue-100'} rounded-2xl flex items-center justify-center shadow-xl transform -rotate-6 transition-transform hover:rotate-0`}>
                  <i className="fas fa-balance-scale text-white text-xl"></i>
                </div>
                <div>
                  <span className={`text-xl font-black tracking-tighter block leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Mentoria</span>
                  <span className={`text-sm font-black uppercase tracking-widest ${currentUser.role === 'mentor' ? 'text-indigo-400' : 'text-blue-500'}`}>Tamara Farias</span>
                </div>
              </div>
              
              <div className="hidden md:flex items-center space-x-8">
                <button 
                  onClick={navigateHome}
                  className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${view === 'DASHBOARD' ? (currentUser.role === 'mentor' ? 'text-indigo-400' : 'text-blue-500') : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Painel Central
                </button>
                {currentUser.role === 'student' && !viewingStudent && (
                  <>
                    <button 
                      onClick={() => setView('HISTORY')}
                      className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${view === 'HISTORY' ? 'text-blue-500' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Meus Resultados
                    </button>
                    <button 
                      onClick={() => setView('SETUP')}
                      className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${view === 'SETUP' ? 'text-blue-500' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Caderno de Prova
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center space-x-4">
                <button 
                  onClick={toggleTheme}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${theme === 'dark' ? 'bg-slate-800 text-amber-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  title="Alternar Tema"
                >
                  <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
                </button>
                <div className="hidden sm:block text-right">
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">{currentUser.role === 'mentor' ? 'Mentoria Tamara' : 'Membro Premium'}</p>
                  <p className={`text-sm font-black ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>{currentUser.name}</p>
                </div>
                <button 
                  onClick={logout}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-900' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100'} shadow-sm`}
                  title="Sair da Plataforma"
                >
                  <i className="fas fa-power-off text-sm"></i>
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {view === 'LOGIN' && <Login onLogin={handleLogin} existingUsers={existingUsers} />}
        
        {view === 'DASHBOARD' && currentUser && (
          currentUser.role === 'mentor' ? (
            <MentorDashboard 
              students={existingUsers.filter(u => u.role === 'student')} 
              allResults={allUserResults}
              onViewStudent={handleMentorViewStudent}
            />
          ) : (
            <Dashboard 
              history={history} 
              diagnostic={diagnostic} 
              onNewExam={() => setView('SETUP')}
              onViewHistory={() => setView('HISTORY')}
              loadingDiagnostic={loadingDiagnostic}
            />
          )
        )}

        {view === 'MENTOR_VIEW_STUDENT' && viewingStudent && (
          <div className="space-y-10 animate-fadeIn">
            <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 p-8 rounded-[2.5rem] border shadow-sm transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <button 
                onClick={navigateHome} 
                className={`group px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-3 ${theme === 'dark' ? 'bg-slate-800 text-slate-300 hover:bg-indigo-600 hover:text-white' : 'bg-slate-100 text-slate-500 hover:bg-indigo-600 hover:text-white'}`}
              >
                <i className="fas fa-arrow-left transition-transform group-hover:-translate-x-1"></i> 
                Voltar à Gestão
              </button>
              <div className="flex items-center gap-5 sm:text-right">
                <div>
                  <h2 className={`text-3xl font-black tracking-tight leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{viewingStudent.name}</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">{viewingStudent.email}</p>
                </div>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black ${theme === 'dark' ? 'bg-slate-800 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                  {viewingStudent.name.charAt(0)}
                </div>
              </div>
            </div>
            
            <div className={`p-6 rounded-[2rem] border flex items-center gap-4 transition-colors duration-300 ${theme === 'dark' ? 'bg-indigo-950/30 border-indigo-900 text-indigo-200' : 'bg-indigo-50/50 border-indigo-100 text-indigo-900'}`}>
               <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                  <i className="fas fa-search"></i>
               </div>
               <p className="text-sm font-bold leading-snug">
                 Você está visualizando o diagnóstico estratégico em tempo real. Esta análise é gerada com base em todos os simulados entregues por este aluno.
               </p>
            </div>

            <Dashboard 
              history={history} 
              diagnostic={diagnostic} 
              onNewExam={() => {}} 
              onViewHistory={() => setView('HISTORY')}
              loadingDiagnostic={loadingDiagnostic}
            />
          </div>
        )}

        {view === 'HISTORY' && (
          <ExamHistory 
            history={history} 
            onViewDetails={(res) => { setLastResult(res); setView('RESULTS'); }} 
            onBack={() => {
              if (currentUser?.role === 'mentor') setView('MENTOR_VIEW_STUDENT');
              else setView('DASHBOARD');
            }}
          />
        )}

        {view === 'SETUP' && currentUser?.role === 'student' && (
          <div className="max-w-4xl mx-auto animate-fadeIn space-y-10">
            <div className="bg-gradient-to-br from-blue-900 to-indigo-950 p-12 sm:p-16 rounded-[3.5rem] shadow-2xl text-white relative overflow-hidden group border border-white/5">
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <span className="px-5 py-2 bg-blue-600/30 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.25em] border border-white/10">Ambiente Simulado</span>
                  <span className="px-5 py-2 bg-amber-500/20 rounded-full text-[10px] font-black uppercase tracking-[0.25em] text-amber-300 border border-amber-500/10">Foco FGV</span>
                </div>
                <h2 className="text-4xl sm:text-6xl font-black mb-8 tracking-tighter leading-tight">Exame de Ordem <br/>Unificado</h2>
                <p className="text-blue-100/70 mb-12 max-w-lg text-xl leading-relaxed font-medium">Caderno de 80 questões dinâmicas, cronômetro progressivo de 5 horas e sistema de integridade ativado.</p>
                <button
                  onClick={() => startExam(80, "Geral")}
                  disabled={loading}
                  className={`px-14 py-6 rounded-3xl font-black shadow-2xl transition-all flex items-center space-x-5 active:scale-95 text-lg group/btn ${theme === 'dark' ? 'bg-slate-100 text-slate-900 hover:bg-white' : 'bg-white text-slate-900 hover:bg-blue-50'}`}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-900 border-t-transparent"></div>
                  ) : (
                    <>
                      <i className="fas fa-feather-pointed group-hover/btn:rotate-12 transition-transform"></i>
                      <span>Abrir Prova Oficial</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className={`p-10 sm:p-14 rounded-[3.5rem] shadow-xl border transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
               <h2 className={`text-3xl font-black mb-12 tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Treinamento Dirigido</h2>
               <div className="space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div>
                      <label className="block text-[11px] font-black text-slate-400 mb-5 uppercase tracking-widest ml-1">Eixo Temático</label>
                      <select 
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value as any)}
                        className={`w-full p-6 border-2 rounded-3xl font-black outline-none focus:ring-8 transition-all cursor-pointer appearance-none shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-100 focus:ring-blue-500/10 focus:border-blue-500' : 'bg-slate-50 border-slate-100 text-slate-700 focus:ring-blue-500/5 focus:border-blue-600'}`}
                      >
                        <option value="Geral">Simulado Interdisciplinar</option>
                        {ALL_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-slate-400 mb-5 uppercase tracking-widest ml-1">Volume de Questões</label>
                      <div className="grid grid-cols-2 gap-4">
                        {[10, 20, 40, 60].map(count => (
                          <button
                            key={count}
                            onClick={() => setQuestionCount(count)}
                            className={`py-5 rounded-2xl border-2 font-black transition-all text-sm ${questionCount === count 
                              ? (theme === 'dark' ? 'border-blue-500 bg-blue-950/40 text-blue-400 shadow-md' : 'border-blue-600 bg-blue-50 text-blue-700 shadow-md')
                              : (theme === 'dark' ? 'border-slate-800 bg-slate-800 text-slate-500 hover:border-slate-700' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200')
                            }`}
                          >
                            {count} Itens
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => startExam()}
                    disabled={loading}
                    className={`w-full py-7 font-black rounded-[2.5rem] shadow-2xl transition-all flex items-center justify-center space-x-5 active:scale-[0.98] text-xl ${theme === 'dark' ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-slate-900 text-white hover:bg-black'}`}
                  >
                    {loading ? <div className="animate-spin rounded-full h-7 w-7 border-2 border-white border-t-transparent"></div> : (
                      <>
                        <i className="fas fa-layer-group"></i>
                        <span>Gerar Novo Simulado Inédito</span>
                      </>
                    )}
                  </button>
               </div>
            </div>
          </div>
        )}

        {view === 'EXAM' && currentUser && (
          <ExamTaker 
            userId={currentUser.id}
            questions={examQuestions} 
            onFinish={handleFinishExam} 
            onCancel={navigateHome}
          />
        )}

        {view === 'RESULTS' && lastResult && (
          <div className="max-w-4xl mx-auto animate-bounceIn space-y-12">
            <div className={`rounded-[4rem] shadow-2xl overflow-hidden border transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
               <div className={`p-16 text-center relative overflow-hidden ${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-slate-950 text-white'}`}>
                  <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute top-10 left-10 text-6xl rotate-12"><i className="fas fa-gavel"></i></div>
                    <div className="absolute bottom-10 right-10 text-6xl -rotate-12"><i className="fas fa-landmark"></i></div>
                  </div>
                  <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-10 shadow-2xl transition-all border-8 border-white/5 ${lastResult.score >= (lastResult.totalQuestions * 0.5) ? 'bg-green-500 shadow-green-500/20' : 'bg-blue-700 shadow-blue-700/20'}`}>
                    <i className={`fas ${lastResult.score >= (lastResult.totalQuestions * 0.5) ? 'fa-check' : 'fa-info'} text-5xl`}></i>
                  </div>
                  <h2 className="text-5xl font-black mb-5 tracking-tighter">Entrega de Prova</h2>
                  <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Candidato: {currentUser.name}</p>
               </div>

               <div className="p-12 sm:p-20">
                  <div className="flex flex-col sm:flex-row justify-center items-center gap-12 sm:gap-24 mb-20">
                    <div className="text-center">
                      <p className="text-slate-400 text-[12px] font-black uppercase tracking-[0.3em] mb-4">Acertos Totais</p>
                      <p className={`text-8xl font-black leading-none ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>{lastResult.score}</p>
                    </div>
                    <div className="hidden sm:block h-28 w-px bg-slate-100 dark:bg-slate-800"></div>
                    <div className="text-center">
                      <p className="text-slate-400 text-[12px] font-black uppercase tracking-[0.3em] mb-4">Aproveitamento</p>
                      <p className={`text-8xl font-black leading-none ${lastResult.score >= (lastResult.totalQuestions * 0.5) ? 'text-green-500' : (theme === 'dark' ? 'text-blue-400' : 'text-blue-700')}`}>
                        {Math.round((lastResult.score / lastResult.totalQuestions) * 100)}%
                      </p>
                    </div>
                  </div>

                  {lastResult.aiDiagnostic && (
                    <div className={`mb-16 p-12 rounded-[3rem] border relative group transition-colors duration-300 ${theme === 'dark' ? 'bg-blue-950/20 border-blue-900 text-slate-200' : 'bg-blue-50/50 border-blue-100 text-slate-800'}`}>
                      <div className="absolute -top-5 left-12 px-8 py-2.5 bg-blue-800 text-white text-[12px] font-black uppercase tracking-widest rounded-full shadow-2xl group-hover:scale-105 transition-transform">
                        Relatório Tamara Farias AI
                      </div>
                      <div className="prose prose-sm max-w-none font-bold leading-relaxed italic text-xl">
                        "{lastResult.aiDiagnostic}"
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-6 mb-12">
                    <button
                      onClick={navigateHome}
                      className={`flex-1 py-7 font-black rounded-[2.5rem] transition-all shadow-xl active:scale-95 text-lg ${theme === 'dark' ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-slate-900 text-white hover:bg-black'}`}
                    >
                      Voltar ao Painel
                    </button>
                    {currentUser?.role === 'student' && !viewingStudent && (
                      <button
                        onClick={() => setView('SETUP')}
                        className={`flex-1 py-7 font-black rounded-[2.5rem] transition-all active:scale-95 shadow-xl text-lg ${theme === 'dark' ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-blue-800 text-white hover:bg-blue-900'}`}
                      >
                        Refazer Simulado
                      </button>
                    )}
                  </div>

                  {/* Question Review Section */}
                  <ExamReview result={lastResult} />
               </div>
            </div>
          </div>
        )}
      </main>

      <footer className={`border-t py-16 mt-12 transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white/50 border-slate-100'}`}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-8 opacity-20">
             <i className="fas fa-balance-scale text-2xl"></i>
          </div>
          <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.5em] mb-4">
            Mentoria Tamara Farias • Inteligência Jurídica
          </p>
          <div className="flex justify-center gap-6 text-slate-300">
             <i className="fab fa-instagram hover:text-indigo-600 transition-colors cursor-pointer"></i>
             <i className="fab fa-linkedin hover:text-indigo-600 transition-colors cursor-pointer"></i>
             <i className="fas fa-envelope hover:text-indigo-600 transition-colors cursor-pointer"></i>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
