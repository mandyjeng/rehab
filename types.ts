
export enum BodyPart {
  REHAB_SERIES = '復健 A-G 系列 (Rehab)',
  PT_STABILITY = '物理治療與穩定 (PT & Stability)',
  GYM_WEIGHTS = '器械與負重 (Gym & Weights)',
  COURT_CARDIO = '功能性與步伐 (Court & Cardio)',
  MOBILITY = '放鬆與伸展 (Mobility)'
}

export interface ExerciseDefinition {
  id: string;
  name: string;
  category: BodyPart;
  isUnilateral: boolean;
  defaultUnit: string;
}

export interface ExerciseLog {
  id: string;
  date: string;
  exerciseName: string;
  category: string;
  side: '左' | '右' | '雙側' | 'N/A';
  sets: number;
  value: string;
  unit: string;
  notes: string;
}

export interface FormData {
  date: string;
  exerciseId: string;
  side: '左' | '右' | '雙側' | 'N/A';
  sets: number;
  value: string;
  unit: string;
  notes: string;
}
