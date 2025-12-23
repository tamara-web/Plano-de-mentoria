
export enum OABSubject {
  ETICA = "Ética Profissional",
  CONSTITUCIONAL = "Direito Constitucional",
  CIVIL = "Direito Civil",
  PROCESSUAL_CIVIL = "Direito Processual Civil",
  PENAL = "Direito Penal",
  PROCESSUAL_PENAL = "Direito Processual Penal",
  TRABALHO = "Direito do Trabalho",
  PROCESSUAL_TRABALHO = "Direito Processual do Trabalho",
  ADMINISTRATIVO = "Direito Administrativo",
  TRIBUTARIO = "Direito Tributário",
  EMPRESARIAL = "Direito Empresarial",
  DIREITOS_HUMANOS = "Direitos Humanos",
  INTERNACIONAL = "Direito Internacional",
  AMBIENTAL = "Direito Ambiental",
  CONSUMIDOR = "Direito do Consumidor",
  FILOSOFIA = "Filosofia do Direito",
  ECA = "ECA"
}

export type UserRole = 'student' | 'mentor';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  password?: string; // Stored locally for simulation
  role: UserRole;
  createdAt: string;
}

export interface Question {
  id: string;
  subject: OABSubject;
  text: string;
  options: {
    letter: 'A' | 'B' | 'C' | 'D';
    text: string;
  }[];
  correctOption: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

export interface ExamResult {
  id: string;
  userId: string;
  date: string; 
  subject: OABSubject | "Geral";
  score: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  tabExitCount: number; 
  details: {
    questionId: string;
    subject: OABSubject;
    isCorrect: boolean;
    userAnswer: string;
    // Fields added for detailed review
    questionText?: string;
    options?: { letter: 'A' | 'B' | 'C' | 'D'; text: string }[];
    correctOption?: 'A' | 'B' | 'C' | 'D';
    explanation?: string;
  }[];
  aiDiagnostic?: string;
}

export interface Diagnostic {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
}
