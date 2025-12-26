
import { BodyPart, ExerciseDefinition } from './types';

export const EXERCISES: ExerciseDefinition[] = [
  // A-G 系列 (維持原名 + 專業備註)
  { id: 'a_series', name: '動作A 弓箭步四變化 (前腳墊高)', category: BodyPart.REHAB_SERIES, isUnilateral: true, defaultUnit: '組' },
  { id: 'b_series', name: '動作B 彈力帶髖', category: BodyPart.REHAB_SERIES, isUnilateral: true, defaultUnit: '組' },
  { id: 'c_series', name: '動作C 旋轉跨步蹲 (含180度)', category: BodyPart.REHAB_SERIES, isUnilateral: true, defaultUnit: '組' },
  { id: 'd_series', name: '動作D 平板變化式下核心', category: BodyPart.REHAB_SERIES, isUnilateral: false, defaultUnit: '下' },
  { id: 'e_series', name: '動作E 側跨步蹲', category: BodyPart.REHAB_SERIES, isUnilateral: true, defaultUnit: '下' },
  { id: 'f_series', name: '動作F 髖飛機變化式', category: BodyPart.REHAB_SERIES, isUnilateral: true, defaultUnit: '下' },
  { id: 'g_series', name: '動作G 後腳抬高弓箭步', category: BodyPart.REHAB_SERIES, isUnilateral: true, defaultUnit: '下' },

  // 物理治療與穩定 (PT & Stability)
  { id: 'tibial_int', name: '脛骨內轉 (左側加強)', category: BodyPart.PT_STABILITY, isUnilateral: true, defaultUnit: '下' },
  { id: 'bosu_stand', name: '波速球單腳站立 (平衡)', category: BodyPart.PT_STABILITY, isUnilateral: true, defaultUnit: '秒' },
  { id: 'calf_raise', name: '提踵 (踮腳尖 墊高5-15cm)', category: BodyPart.PT_STABILITY, isUnilateral: true, defaultUnit: '下' },
  { id: 'wall_sit', name: '牆邊單腳等長滑坐 (膝角30-40°)', category: BodyPart.PT_STABILITY, isUnilateral: true, defaultUnit: '秒' },
  { id: 'hip_bridge', name: '彈力帶單腿臀橋', category: BodyPart.PT_STABILITY, isUnilateral: true, defaultUnit: '下' },
  { id: 'mini_squat', name: '迷你深蹲 (徒手)', category: BodyPart.PT_STABILITY, isUnilateral: false, defaultUnit: '下' },
  { id: 'pelvic_drop', name: '右骨盆下沉訓練', category: BodyPart.PT_STABILITY, isUnilateral: false, defaultUnit: '下' },
  { id: 'leg_extension_sl', name: '單腳 Leg Extension (腳掌外轉)', category: BodyPart.PT_STABILITY, isUnilateral: true, defaultUnit: 'kg' },

  // 器械與重量 (Gym)
  { id: 'leg_ext_machine', name: 'Leg Extension (伸膝機)', category: BodyPart.GYM_WEIGHTS, isUnilateral: false, defaultUnit: 'kg' },
  { id: 'leg_curl_machine', name: 'Leg Curl (屈膝機)', category: BodyPart.GYM_WEIGHTS, isUnilateral: false, defaultUnit: 'kg' },
  { id: 'sl_deadlift', name: '單腿硬舉', category: BodyPart.GYM_WEIGHTS, isUnilateral: true, defaultUnit: 'kg' },
  { id: 'rowing_horiz', name: '水平划船', category: BodyPart.GYM_WEIGHTS, isUnilateral: false, defaultUnit: 'kg' },
  { id: 'db_bench_press', name: '單手啞鈴臥推', category: BodyPart.GYM_WEIGHTS, isUnilateral: true, defaultUnit: 'kg' },
  { id: 'landmine_series', name: '地雷管 (單腿硬舉/抗扭側彎)', category: BodyPart.GYM_WEIGHTS, isUnilateral: true, defaultUnit: 'kg' },
  { id: 'arm_bar', name: 'Arm Bar (骨盆貼地)', category: BodyPart.GYM_WEIGHTS, isUnilateral: true, defaultUnit: 'kg' },

  // 跑步與球場協調 (Court & Cardio)
  { id: 'treadmill_run', name: '跑步機 (速度/坡度間歇)', category: BodyPart.COURT_CARDIO, isUnilateral: false, defaultUnit: '分' },
  { id: 'jump_land', name: '單腳起跳雙腳落地', category: BodyPart.COURT_CARDIO, isUnilateral: true, defaultUnit: '下' },
  { id: 'badminton_coord', name: '跑協調 (側向/雙腳進出/步伐)', category: BodyPart.COURT_CARDIO, isUnilateral: false, defaultUnit: '趟' },
  { id: 'step_platform', name: '快速上下台階 (15cm)', category: BodyPart.COURT_CARDIO, isUnilateral: false, defaultUnit: '秒' },
  { id: 'badminton_game', name: '羽球實戰 (自評跑動分數)', category: BodyPart.COURT_CARDIO, isUnilateral: false, defaultUnit: '場' },

  // 放鬆與按摩 (Mobility)
  { id: 'ball_relax', name: '按摩球放鬆 (腰部/口袋處/大腿)', category: BodyPart.MOBILITY, isUnilateral: true, defaultUnit: '分' },
  { id: 'ligament_relax', name: '微笑韌帶動態放鬆 (左側)', category: BodyPart.MOBILITY, isUnilateral: true, defaultUnit: '分' },
  { id: 'foam_roller', name: '滾筒放鬆 (前側/外側/內側)', category: BodyPart.MOBILITY, isUnilateral: true, defaultUnit: '分' },
  { id: 'knee_range', name: '右膝彎曲度訓練 (凹角度)', category: BodyPart.MOBILITY, isUnilateral: false, defaultUnit: '分' }
];

export const CATEGORIES = Object.values(BodyPart);

export const UNITS = ['下', '組', 'kg', '秒', '分', '趟', '場', 'km/h'];
