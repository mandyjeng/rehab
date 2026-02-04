
import { BodyPart, ExerciseDefinition } from './types';

// 已更新為您提供的正式網址
export const EXERCISES_API_URL = 'https://script.google.com/macros/s/AKfycbz549Mb252YpDAjCLd1SnduHE9Frp6jUCJ__gbZPSn6ivzZai0frvI5SvX84-CUwrrXOg/exec';

// 初始設定為空，由 App.tsx 動態載入
export let EXERCISES: ExerciseDefinition[] = [];

export const CATEGORIES = Object.values(BodyPart);
