
export enum BodyPart {
  STARS_REHAB = '誠星動作 (Core Rehab)',
  STARS_MOBILITY = '誠星動作-放鬆 (Mobility)',
  SAMURAI_WORKOUT = '武士動作 (Samurai)',
  LANDMINE = '地雷管 (Landmine)',
  BADMINTON = '羽球 (Badminton)',
  OTHER_GYM = '其他 (Others)'
}

export type InputMode = 'STRENGTH' | 'REPS_ONLY' | 'TIME_ONLY' | 'CYCLING' | 'RELAX' | 'TREADMILL';

export interface ExerciseDefinition {
  id: string;
  name: string;
  category: BodyPart;
  isUnilateral: boolean;
  mode: InputMode;
  defaultUnit?: string;
}

export interface ExerciseLog {
  id: string;
  date: string;
  exerciseName: string;
  category: string;
  side: '左' | '右' | '雙側' | 'N/A';
  sets: number;
  value: string; // 存放重量+次數 或 阻力+時間 的字串
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
  speed: string; // 新增：速度
  notes: string;
}
