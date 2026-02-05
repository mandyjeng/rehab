
import { ExerciseDefinition } from './types';

// 使用者設定檔
export const USERS = {
  MANDY: {
    id: 'MANDY',
    name: 'Mandy',
    api: 'https://script.google.com/macros/s/AKfycbz549Mb252YpDAjCLd1SnduHE9Frp6jUCJ__gbZPSn6ivzZai0frvI5SvX84-CUwrrXOg/exec',
    sheet: 'https://docs.google.com/spreadsheets/d/1TBuSUnuO3HTtG-9ZHDmDrlHGSNlEip3WUntbtWQcre8/edit?gid=0#gid=0',
    storageKey: 'rehab_logs_stable',
    statusKey: 'rehab_statuses_stable'
  },
  AFU: {
    id: 'AFU',
    name: '阿甫',
    api: 'https://script.google.com/macros/s/AKfycbyxD7ysc_PLe_OXsB8A0f9BUfxIPQkIQLE6DEZRIX8yXHlvXz_5d1T3AEwixBNSl41qOg/exec',
    sheet: 'https://docs.google.com/spreadsheets/d/1kbS8_7erLUJiq6mZ9czD-ZDJUa50iyfVzbx0QNbJRDk/edit?gid=0#gid=0',
    storageKey: 'rehab_logs_afu',
    statusKey: 'rehab_statuses_afu'
  }
} as const;

export type UserKey = keyof typeof USERS;

// 初始設定為空，由 App.tsx 動態載入
export let EXERCISES: ExerciseDefinition[] = [];
