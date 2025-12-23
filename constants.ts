
import { OABSubject } from './types';

export const ALL_SUBJECTS = Object.values(OABSubject);

export const DEFAULT_EXAM_SIZE = 10;

export const SUBJECT_COLORS: Record<string, string> = {
  [OABSubject.ETICA]: "#1e40af",
  [OABSubject.CONSTITUCIONAL]: "#b91c1c",
  [OABSubject.CIVIL]: "#047857",
  [OABSubject.PROCESSUAL_CIVIL]: "#7c3aed",
  [OABSubject.PENAL]: "#ea580c",
  [OABSubject.PROCESSUAL_PENAL]: "#be123c",
  [OABSubject.TRABALHO]: "#15803d",
  [OABSubject.PROCESSUAL_TRABALHO]: "#4338ca",
  [OABSubject.ADMINISTRATIVO]: "#c2410c",
  [OABSubject.TRIBUTARIO]: "#b45309",
  [OABSubject.EMPRESARIAL]: "#0e7490",
  [OABSubject.DIREITOS_HUMANOS]: "#db2777",
  "Geral": "#475569"
};
