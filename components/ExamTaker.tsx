
import React, { useState, useEffect, useRef } from 'react';
import { Question, ExamResult, OABSubject } from '../types';

interface ExamTakerProps {
  userId: string;
  questions: Question[];
  onFinish: (result: ExamResult) => void;
  onCancel: () => void;
}

const ExamTaker: React.FC<ExamTakerProps> = ({ userId, questions, onFinish, onCancel }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  
  // Official OAB Timer Logic (300 mins for 80Q, or proportional)
  const officialTimePerQuestion = 3.75; // 300 minutes / 80 questions
  const initialTime = Math.ceil(questions.length * officialTimePerQuestion * 60);
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isPaused, setIsPaused] = useState(false);
  
  // Anti-Cheat Stats
  const [tabExitCount, setTabExitCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Request Fullscreen on start
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {
        console.warn("Fullscreen request denied.");
      });
    }

    // Monitor Visibility (Anti-Cheat)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setTabExitCount(prev => prev + 1);
        setIsPaused(true);
      } else {
        setIsPaused(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Timer Interval
    const timer = setInterval(() => {
      if (!isPaused && timeLeft > 0) {
        setTimeLeft(prev => prev - 1);
      }
      if (timeLeft === 0) {
        handleSubmit();
      }
    }, 1000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(timer);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [isPaused, timeLeft]);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelect = (letter: 'A' | 'B' | 'C' | 'D') => {
    if (revealed[currentQuestion.id]) return;
    
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: letter }));
    setRevealed(prev => ({ ...prev, [currentQuestion.id]: true }));
  };

  const handleSubmit = () => {
    const details = questions.map(q => ({
      questionId: q.id,
      subject: q.subject,
      isCorrect: answers[q.id] === q.correctOption,
      userAnswer: answers[q.id] || "N/A",
      questionText: q.text,
      options: q.options,
      correctOption: q.correctOption,
      explanation: q.explanation
    }));

    const score = details.filter(d => d.isCorrect).length;

    onFinish({
      id: crypto.randomUUID(),
      userId,
      date: new Date().toISOString(),
      subject: questions.every(q => q.subject === questions[0].subject) ? questions[0].subject : "Geral",
      score,
      totalQuestions: questions.length,
      timeSpentSeconds: initialTime - timeLeft,
      tabExitCount,
      details
    });
  };

  const isQuestionRevealed = revealed[currentQuestion.id];

  return (
    <div ref={containerRef} className="max-w-5xl mx-auto px-4 py-4 sm:py-8 min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      
      {/* Kiosk Mode Warning Overlay */}
      {isPaused && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-6 text-center">
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl max-w-sm">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-exclamation-triangle text-3xl text-red-600"></i>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4">Prova Pausada!</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">Detectamos que você saiu do ambiente de prova. Consultas externas são monitoradas.</p>
            <button 
              onClick={() => setIsPaused(false)}
              className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all"
            >
              Retomar Simulado
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header with Stats & Timer */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-4">
             <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
               <i className="fas fa-balance-scale"></i>
             </div>
             <div>
               <h2 className="text-lg font-black tracking-tight">Simulado OAB</h2>
               <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Questão {currentIndex + 1} de {questions.length}</p>
             </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Timer */}
            <div className={`flex items-center space-x-3 px-6 py-3 rounded-2xl border-2 transition-all ${
              timeLeft < 300 ? 'bg-red-500/10 border-red-500 text-red-500 animate-pulse' : 
              timeLeft < 1800 ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 
              'bg-white/5 border-white/10 text-white'
            }`}>
              <i className="fas fa-clock text-xs"></i>
              <span className="font-black font-mono text-xl">{formatTime(timeLeft)}</span>
            </div>

            <button 
              onClick={onCancel}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center text-slate-400"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        <div className="h-1.5 bg-slate-100 dark:bg-slate-800">
          <div 
            className="h-full bg-blue-600 transition-all duration-500 shadow-[0_0_10px_rgba(37,99,235,0.5)]" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div key={currentIndex} className="p-8 sm:p-12 animate-slideInRight">
          <div className="mb-6 flex items-center justify-between">
            <span className="px-4 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800">
              {currentQuestion.subject}
            </span>
            {tabExitCount > 0 && (
              <span className="text-red-500 text-[10px] font-black uppercase flex items-center gap-2">
                <i className="fas fa-user-secret"></i>
                Consultas Detectadas: {tabExitCount}
              </span>
            )}
          </div>

          <p className="text-xl sm:text-2xl text-slate-800 dark:text-slate-100 leading-relaxed mb-12 font-bold tracking-tight">
            {currentQuestion.text}
          </p>

          <div className="grid grid-cols-1 gap-4">
            {currentQuestion.options.map((opt) => {
              const isSelected = answers[currentQuestion.id] === opt.letter;
              const isCorrect = opt.letter === currentQuestion.correctOption;
              
              let variantClasses = 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50';
              let iconColor = 'text-slate-400';
              let circleBg = 'bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700';
              
              if (isQuestionRevealed) {
                if (isCorrect) {
                  variantClasses = 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-lg shadow-green-100 dark:shadow-none';
                  circleBg = 'bg-green-500 text-white border-green-500 shadow-md';
                  iconColor = 'text-green-500';
                } else if (isSelected) {
                  variantClasses = 'border-red-500 bg-red-50 dark:bg-red-900/20 shadow-lg shadow-red-100 dark:shadow-none';
                  circleBg = 'bg-red-500 text-white border-red-500 shadow-md';
                  iconColor = 'text-red-500';
                } else {
                  variantClasses = 'border-slate-50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900/30 opacity-60 grayscale-[0.5]';
                  circleBg = 'bg-slate-200 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400';
                  iconColor = 'text-slate-300';
                }
              } else if (isSelected) {
                variantClasses = 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/10 shadow-xl shadow-blue-50 dark:shadow-none scale-[1.02]';
                circleBg = 'bg-blue-600 text-white shadow-lg';
              }

              return (
                <button
                  key={opt.letter}
                  disabled={isQuestionRevealed}
                  onClick={() => handleSelect(opt.letter as any)}
                  className={`group w-full p-6 rounded-[1.5rem] border-2 text-left transition-all duration-300 flex items-start space-x-6 relative overflow-hidden active:scale-95 ${variantClasses}`}
                >
                  <span className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm transition-all ${circleBg}`}>
                    {opt.letter}
                  </span>
                  <span className={`text-lg font-semibold pr-10 leading-snug transition-colors ${
                    isSelected ? (isQuestionRevealed ? (isCorrect ? 'text-green-900 dark:text-green-400' : 'text-red-900 dark:text-red-400') : 'text-blue-900 dark:text-blue-400') : 'text-slate-600 dark:text-slate-400'
                  }`}>
                    {opt.text}
                  </span>
                  
                  {isQuestionRevealed && (
                    <div className={`absolute right-6 top-1/2 -translate-y-1/2 transition-all duration-500 animate-bounceIn ${iconColor}`}>
                      <i className={`fas ${isCorrect ? 'fa-check-circle' : (isSelected ? 'fa-times-circle' : '')} text-2xl`}></i>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {isQuestionRevealed && currentQuestion.explanation && (
            <div className="mt-8 p-8 bg-blue-50/50 dark:bg-blue-900/10 rounded-[2rem] border border-blue-100 dark:border-blue-800/50 animate-slideDown">
              <div className="flex items-center gap-3 mb-4">
                <i className="fas fa-lightbulb text-blue-500"></i>
                <h4 className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em]">Fundamentação Legal</h4>
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 italic leading-relaxed">
                {currentQuestion.explanation}
              </p>
            </div>
          )}
        </div>

        <div className="p-8 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-6">
          <button
            onClick={() => setCurrentIndex(prev => prev - 1)}
            disabled={currentIndex === 0}
            className="w-full sm:w-auto px-8 py-4 text-slate-500 dark:text-slate-400 font-black disabled:opacity-30 flex items-center justify-center space-x-3 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <i className="fas fa-chevron-left text-xs"></i>
            <span>Questão Anterior</span>
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
             {currentIndex === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                className="w-full px-12 py-5 bg-green-600 hover:bg-green-700 text-white font-black rounded-[1.5rem] shadow-2xl shadow-green-100 dark:shadow-none transition-all flex items-center justify-center space-x-3 active:scale-95"
              >
                <i className="fas fa-flag-checkered"></i>
                <span>Finalizar Exame</span>
              </button>
             ) : (
              <button
                onClick={() => setCurrentIndex(prev => prev + 1)}
                className={`w-full px-12 py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-[1.5rem] shadow-2xl shadow-blue-100 dark:shadow-none transition-all flex items-center justify-center space-x-3 active:scale-95 ${!isQuestionRevealed ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={!isQuestionRevealed ? "Responda para avançar" : ""}
              >
                <span>Próxima Questão</span>
                <i className="fas fa-chevron-right text-xs"></i>
              </button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamTaker;
