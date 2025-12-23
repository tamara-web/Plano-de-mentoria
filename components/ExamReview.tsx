
import React, { useState, useMemo } from 'react';
import { ExamResult } from '../types';

interface ExamReviewProps {
  result: ExamResult;
}

type FilterType = 'all' | 'errors' | 'success';

const ExamReview: React.FC<ExamReviewProps> = ({ result }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredDetails = useMemo(() => {
    if (filter === 'errors') return result.details.filter(d => !d.isCorrect);
    if (filter === 'success') return result.details.filter(d => d.isCorrect);
    return result.details;
  }, [result, filter]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-blue-600 rounded-full"></div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Revisão do Caderno</h3>
        </div>
        
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${filter === 'all' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
          >Todos</button>
          <button 
            onClick={() => setFilter('errors')}
            className={`px-4 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${filter === 'errors' ? 'bg-white dark:bg-slate-700 text-red-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
          >Erros ({result.details.filter(d => !d.isCorrect).length})</button>
          <button 
            onClick={() => setFilter('success')}
            className={`px-4 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${filter === 'success' ? 'bg-white dark:bg-slate-700 text-green-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
          >Acertos ({result.details.filter(d => d.isCorrect).length})</button>
        </div>
      </div>
      
      <div className="space-y-4">
        {filteredDetails.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
            <p className="font-bold text-slate-400">Nenhuma questão encontrada para este filtro.</p>
          </div>
        ) : filteredDetails.map((detail, idx) => (
          <div 
            key={detail.questionId} 
            className={`bg-white dark:bg-slate-900 border rounded-[2rem] overflow-hidden transition-all duration-300 shadow-sm ${
              expandedId === detail.questionId 
                ? 'border-blue-400 dark:border-blue-800 ring-4 ring-blue-500/5' 
                : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
            }`}
          >
            <button 
              onClick={() => setExpandedId(expandedId === detail.questionId ? null : detail.questionId)}
              className="w-full p-6 sm:p-8 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors text-left"
            >
              <div className="flex items-center gap-4 sm:gap-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm flex-shrink-0 transition-transform ${
                  detail.isCorrect 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                } ${expandedId === detail.questionId ? 'scale-110' : ''}`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 line-clamp-1 mb-1 leading-tight">
                    {detail.questionText || "Questão sem descrição salva"}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest truncate max-w-[150px]">{detail.subject}</span>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${detail.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                      {detail.isCorrect ? 'Correta' : 'Incorreta'}
                    </span>
                  </div>
                </div>
              </div>
              <div className={`w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 transition-transform ${expandedId === detail.questionId ? 'rotate-180 bg-blue-50 text-blue-600' : ''}`}>
                <i className="fas fa-chevron-down text-xs"></i>
              </div>
            </button>

            {expandedId === detail.questionId && (
              <div className="p-6 sm:p-10 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20 animate-slideDown">
                <div className="mb-10">
                  <div className="flex items-center gap-2 mb-4">
                     <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enunciado da Questão</h4>
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 leading-relaxed mb-8">
                    {detail.questionText}
                  </p>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {detail.options?.map(opt => (
                      <div 
                        key={opt.letter} 
                        className={`p-5 rounded-2xl border-2 flex items-start gap-5 transition-all ${
                          opt.letter === detail.correctOption 
                            ? 'border-green-500 bg-green-50/50 dark:bg-green-900/10' 
                            : (opt.letter === detail.userAnswer && !detail.isCorrect 
                                ? 'border-red-500 bg-red-50/50 dark:bg-red-900/10' 
                                : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50')
                        }`}
                      >
                        <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                          opt.letter === detail.correctOption 
                            ? 'bg-green-500 text-white shadow-lg shadow-green-200 dark:shadow-none' 
                            : (opt.letter === detail.userAnswer ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400')
                        }`}>
                          {opt.letter}
                        </span>
                        <div className="flex-grow">
                           <span className={`text-sm font-semibold block ${
                             opt.letter === detail.correctOption ? 'text-green-900 dark:text-green-300' : 'text-slate-600 dark:text-slate-400'
                           }`}>{opt.text}</span>
                           {opt.letter === detail.correctOption && (
                             <span className="text-[9px] font-black uppercase text-green-600 mt-2 block tracking-widest flex items-center gap-2">
                               <i className="fas fa-check-double text-[8px]"></i>
                               Gabarito Oficial
                             </span>
                           )}
                           {opt.letter === detail.userAnswer && !detail.isCorrect && (
                             <span className="text-[9px] font-black uppercase text-red-600 mt-2 block tracking-widest flex items-center gap-2">
                               <i className="fas fa-times text-[8px]"></i>
                               Sua Resposta
                             </span>
                           )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`p-8 rounded-[2.5rem] border relative overflow-hidden group/card transition-colors ${
                  detail.isCorrect 
                  ? 'bg-green-50/50 border-green-100 dark:bg-green-950/20 dark:border-green-900/30' 
                  : 'bg-blue-50/50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30'
                }`}>
                   <div className="absolute -right-4 -top-4 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl"></div>
                   <div className="flex items-center justify-between mb-6">
                      <h4 className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] flex items-center gap-3">
                         <i className="fas fa-gavel text-xs"></i>
                         Fundamentação Legal e Pedagógica
                      </h4>
                      <i className="fas fa-quote-right text-blue-100 dark:text-blue-900/40 text-4xl"></i>
                   </div>
                   <div className="text-base text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                     {detail.explanation ? (
                       <div className="space-y-4 whitespace-pre-line italic">
                          {detail.explanation}
                       </div>
                     ) : (
                       <p className="italic text-slate-400">Explicação não disponível para esta questão. Consulte o mentor.</p>
                     )}
                   </div>
                   
                   <div className="mt-8 pt-6 border-t border-blue-100/50 dark:border-blue-900/20 flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px]">
                         <i className="fas fa-robot"></i>
                      </div>
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Análise gerada por Mentoria AI Tamara Farias</span>
                   </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExamReview;
