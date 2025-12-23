
import { GoogleGenAI, Type } from "@google/genai";
import { OABSubject, Question, Diagnostic, ExamResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Simple in-memory cache to reduce latency
const questionCache = new Map<string, { questions: Question[], timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes validity

/**
 * Generates unique OAB questions.
 * Includes a 'recentTopics' parameter to help the AI avoid repeating scenarios.
 */
export async function generateOABQuestions(
  subject: OABSubject | "Geral", 
  count: number,
  recentTopics: string[] = []
): Promise<Question[]> {
  const cacheKey = `${subject}_${count}_${recentTopics.slice(0, 3).join('_')}`;
  const cached = questionCache.get(cacheKey);

  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    console.debug(`[Cache] Serving questions for ${subject} (${count}Q)`);
    return cached.questions;
  }

  let subjectInstruction = "";
  
  if (subject === "Geral" && count === 80) {
    subjectInstruction = `Siga EXATAMENTE a distribuição oficial da 1ª fase da OAB (80 questões):
    - Ética Profissional: 8 questões
    - Direito Constitucional: 7 questões
    - Direito Civil: 7 questões
    - Direito Processual Civil: 7 questões
    - Direito Administrativo: 6 questões
    - Direito Penal: 6 questões
    - Direito Processual Penal: 6 questões
    - Direito do Trabalho: 6 questões
    - Direito Processual do Trabalho: 6 questões
    - Direito Tributário: 5 questões
    - Direito Empresarial: 5 questões
    - Direitos Humanos: 2 questões
    - Direito Internacional: 2 questões
    - ECA: 2 questões
    - Direito Ambiental: 2 questões
    - Direito do Consumidor: 2 questões
    - Filosofia do Direito: 2 questões`;
  } else {
    subjectInstruction = `Disciplina: ${subject === "Geral" ? "Mistura equilibrada das 17 disciplinas da OAB" : subject}.`;
  }

  const prompt = `Gere ${count} questões no estilo da prova da OAB 1ª Fase (FGV).
  ${subjectInstruction}
  
  REQUISITOS DE NOVIDADE:
  - EVITE temas já abordados recentemente: ${recentTopics.join(", ") || "Nenhum específico"}.
  - Crie CASOS PRÁTICOS novos, nomes de personagens fictícios variados e situações jurídicas complexas.

  REQUISITOS TÉCNICOS:
  1. 4 alternativas (A, B, C, D).
  2. EXPLICAÇÃO DETALHADA: Forneça a fundamentação jurídica completa, citando ARTIGOS DE LEI (CF, CC, CP, CLT, etc.) e súmulas pertinentes.
  3. Formato JSON rigoroso.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              subject: { type: Type.STRING },
              text: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    letter: { type: Type.STRING },
                    text: { type: Type.STRING }
                  }
                }
              },
              correctOption: { type: Type.STRING },
              explanation: { type: Type.STRING }
            },
            required: ["id", "subject", "text", "options", "correctOption", "explanation"]
          }
        }
      }
    });

    const questions: Question[] = JSON.parse(response.text || "[]");
    
    if (questions.length > 0) {
      questionCache.set(cacheKey, { questions, timestamp: Date.now() });
    }

    return questions;
  } catch (e: any) {
    console.error("Critical error generating questions:", e);
    throw new Error(`Falha ao conectar com o servidor de questões: ${e.message || 'Erro desconhecido'}`);
  }
}

/**
 * Generates an immediate diagnostic for a specific finished exam.
 */
export async function generateInstantDiagnostic(result: ExamResult): Promise<string> {
  const summary = result.details.map(d => `${d.subject}: ${d.isCorrect ? 'Acerto' : 'Erro'}`).join(", ");
  const prompt = `Analise este resultado de simulado OAB: ${summary}. 
  O aluno acertou ${result.score} de ${result.totalQuestions}.
  Dê um feedback curto focado no erro mais crítico e mencione a base legal que o aluno deve revisar.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { thinkingConfig: { thinkingBudget: 0 } }
    });

    return response.text || "Continue estudando para melhorar seus resultados.";
  } catch (e) {
    return "O diagnóstico automático está temporariamente indisponível.";
  }
}

export async function generateAIDiagnostic(results: ExamResult[]): Promise<Diagnostic> {
  if (results.length === 0) return {
    summary: "Sem dados para análise.",
    strengths: [],
    weaknesses: [],
    recommendation: "Realize seu primeiro simulado."
  };

  const resultsSummary = results.slice(0, 10).map(r => ({
    date: r.date,
    score: r.score,
    total: r.totalQuestions,
    errors: r.details.filter(d => !d.isCorrect).map(d => d.subject)
  }));

  const prompt = `Aja como um mentor especializado em aprovação na OAB. 
  Analise os resultados históricos do aluno: ${JSON.stringify(resultsSummary)}.
  Identifique padrões de erro e forneça um plano estratégico.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendation: { type: Type.STRING }
          },
          required: ["summary", "strengths", "weaknesses", "recommendation"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (e) {
    return {
      summary: "Análise estratégica temporariamente indisponível.",
      strengths: [],
      weaknesses: [],
      recommendation: "Continue realizando simulados."
    };
  }
}
