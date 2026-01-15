import { BodyPart, ExerciseDefinition } from './types';

export const EXERCISES: ExerciseDefinition[] = [
  // 誠星動作
  { id: 'ss1', name: '單腳起跳雙腳落地', category: BodyPart.STARS_REHAB, isUnilateral: true, mode: 'STRENGTH' },
  { id: 'ss2', name: '脛骨內轉', category: BodyPart.STARS_REHAB, isUnilateral: true, mode: 'REPS_ONLY' },
  { id: 'ss3', name: '後腳抬高蹲膝蓋前延伸', category: BodyPart.STARS_REHAB, isUnilateral: true, mode: 'STRENGTH' },
  { id: 'ss4', name: '彈力繩帶綁腿，墊高單腳臀橋', category: BodyPart.STARS_REHAB, isUnilateral: true, mode: 'REPS_ONLY' },
  { id: 'ss_a', name: '動作A (弓箭步變化式)', category: BodyPart.STARS_REHAB, isUnilateral: true, mode: 'STRENGTH' },
  { id: 'ss_b', name: '動作B (彈力帶髖外展/伸展)', category: BodyPart.STARS_REHAB, isUnilateral: true, mode: 'REPS_ONLY' },
  { id: 'ss_c', name: '動作C (旋轉跨步蹲)', category: BodyPart.STARS_REHAB, isUnilateral: true, mode: 'STRENGTH' },
  { id: 'ss_d', name: '動作D (平板變化式下核心)', category: BodyPart.STARS_REHAB, isUnilateral: false, mode: 'REPS_ONLY' },
  { id: 'ss_e', name: '動作E (側跨步蹲)', category: BodyPart.STARS_REHAB, isUnilateral: true, mode: 'STRENGTH' },
  { id: 'ss_f', name: '動作F (髖飛機變化式)', category: BodyPart.STARS_REHAB, isUnilateral: true, mode: 'REPS_ONLY' },
  { id: 'ss5', name: '側跨步-臀部後坐 (正側前後45度)', category: BodyPart.STARS_REHAB, isUnilateral: true, mode: 'STRENGTH' },
  { id: 'ss6', name: '單腳起跳雙腳著地 (大腿朝外/聲小)', category: BodyPart.STARS_REHAB, isUnilateral: true, mode: 'STRENGTH' },
  { id: 'ss7', name: '單腳 Airplane', category: BodyPart.STARS_REHAB, isUnilateral: true, mode: 'STRENGTH' },
  { id: 'ss8', name: '核心中軸-可樂罐', category: BodyPart.STARS_REHAB, isUnilateral: false, mode: 'REPS_ONLY' },
  { id: 'ss9', name: '側跪姿動態髖伸蚌殼式', category: BodyPart.STARS_REHAB, isUnilateral: true, mode: 'STRENGTH' },
  { id: 'ss10', name: '平板支撐骨盆前後傾旋轉控制', category: BodyPart.STARS_REHAB, isUnilateral: false, mode: 'STRENGTH' },
  { id: 'ss11', name: '夾滾筒單腿硬舉', category: BodyPart.STARS_REHAB, isUnilateral: true, mode: 'STRENGTH' },
  { id: 'ss12', name: '夾滾筒單腿髖飛機', category: BodyPart.STARS_REHAB, isUnilateral: true, mode: 'STRENGTH' },

  // 誠星動作-放鬆
  { id: 'sm1', name: '左右腰部球放鬆', category: BodyPart.STARS_MOBILITY, isUnilateral: true, mode: 'RELAX' },
  { id: 'sm2', name: '微笑韌帶放鬆', category: BodyPart.STARS_MOBILITY, isUnilateral: true, mode: 'RELAX' },
  { id: 'sm3', name: '骨盆下沉練習', category: BodyPart.STARS_MOBILITY, isUnilateral: false, mode: 'REPS_ONLY' },
  { id: 'sm4', name: '膕肌/大腿前外側/正內側滾筒', category: BodyPart.STARS_MOBILITY, isUnilateral: true, mode: 'RELAX' },
  { id: 'sm5', name: '雙膝彎曲伸展維持', category: BodyPart.STARS_MOBILITY, isUnilateral: true, mode: 'RELAX' },
  { id: 'sm6', name: '膕肌放鬆', category: BodyPart.STARS_MOBILITY, isUnilateral: true, mode: 'RELAX' },

  // 武士動作
  { id: 'sw1', name: '側棒式髖內外轉', category: BodyPart.SAMURAI_WORKOUT, isUnilateral: true, mode: 'REPS_ONLY' },
  { id: 'sw2', name: '坐姿划船', category: BodyPart.SAMURAI_WORKOUT, isUnilateral: false, mode: 'STRENGTH' },
  { id: 'sw3', name: '雙槓輔助上拉', category: BodyPart.SAMURAI_WORKOUT, isUnilateral: false, mode: 'STRENGTH' },
  { id: 'sw4', name: 'Arm Bar', category: BodyPart.SAMURAI_WORKOUT, isUnilateral: true, mode: 'STRENGTH' },
  { id: 'sw5', name: '下腹捲腹', category: BodyPart.SAMURAI_WORKOUT, isUnilateral: false, mode: 'REPS_ONLY' },
  { id: 'sw6', name: '單手啞鈴臥推', category: BodyPart.SAMURAI_WORKOUT, isUnilateral: true, mode: 'STRENGTH' },

  // 地雷管動作
  { id: 'lm1', name: '地雷管-單腿硬舉', category: BodyPart.LANDMINE, isUnilateral: true, mode: 'STRENGTH' },
  { id: 'lm2', name: '地雷管-抗扭側彎', category: BodyPart.LANDMINE, isUnilateral: true, mode: 'STRENGTH' },
  { id: 'lm3', name: '地雷管-單手前舉', category: BodyPart.LANDMINE, isUnilateral: true, mode: 'STRENGTH' },

  // 羽球動作
  { id: 'bd1', name: '打羽球', category: BodyPart.BADMINTON, isUnilateral: false, mode: 'STRENGTH', defaultUnit: '場' },
  { id: 'bd2', name: '抬髖前跨步', category: BodyPart.BADMINTON, isUnilateral: false, mode: 'REPS_ONLY', defaultUnit: '趟' },
  { id: 'bd3', name: '側向單腳進出', category: BodyPart.BADMINTON, isUnilateral: false, mode: 'REPS_ONLY', defaultUnit: '趟' },
  { id: 'bd4', name: '單腳開合', category: BodyPart.BADMINTON, isUnilateral: false, mode: 'REPS_ONLY', defaultUnit: '趟' },
  { id: 'bd5', name: '上網步伐', category: BodyPart.BADMINTON, isUnilateral: false, mode: 'REPS_ONLY', defaultUnit: '趟' },
  { id: 'bd6', name: '後撤步伐', category: BodyPart.BADMINTON, isUnilateral: false, mode: 'REPS_ONLY', defaultUnit: '趟' },

  // 其他
  { id: 'ot1', name: 'Leg curl', category: BodyPart.OTHER_GYM, isUnilateral: false, mode: 'STRENGTH' },
  { id: 'ot2', name: 'Leg extension', category: BodyPart.OTHER_GYM, isUnilateral: false, mode: 'STRENGTH' },
  { id: 'ot3', name: '單腿站波速球', category: BodyPart.OTHER_GYM, isUnilateral: true, mode: 'TIME_ONLY' },
  { id: 'ot4', name: '雙腳提踵', category: BodyPart.OTHER_GYM, isUnilateral: false, mode: 'STRENGTH' },
  { id: 'ot5', name: '單腳提踵', category: BodyPart.OTHER_GYM, isUnilateral: true, mode: 'STRENGTH' },
  { id: 'ot6', name: '坐式腳踏車', category: BodyPart.OTHER_GYM, isUnilateral: false, mode: 'CYCLING' },
  { id: 'ot7', name: '跑步機', category: BodyPart.OTHER_GYM, isUnilateral: false, mode: 'TREADMILL' },
  { id: 'ot8', name: '單腿硬舉', category: BodyPart.OTHER_GYM, isUnilateral: true, mode: 'STRENGTH' }
];

export const CATEGORIES = Object.values(BodyPart);