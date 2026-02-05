
export type BodyPart = string;

export type InputMode = 'STRENGTH' | 'REPS_ONLY' | 'TIME_ONLY' | 'CYCLING' | 'RELAX' | 'TREADMILL';

export interface ExerciseDefinition {
  id: string;
  name: string;
  category: BodyPart;
  isUnilateral: boolean;
  mode: InputMode;
  defaultUnit?: string;
  defaultQuantity?: string;
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
  side: '左' | '記錄雙側' | 'N/A';
  sets: number;
  weight: string;
  reps: string;
  time: string;
  resistance: string;
  slope: string;
  speed: string;
  notes: string;
}
