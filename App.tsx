
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { EXERCISES, CATEGORIES } from './constants';
import { ExerciseLog, FormData, BodyPart, ExerciseDefinition } from './types';

const App: React.FC = () => {
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [dailyStatuses, setDailyStatuses] = useState<Record<string, string>>({}); 
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<FormData>({
    date: new Date().toISOString().split('T')[0],
    exerciseId: EXERCISES[0].id,
    side: '記錄雙側',
    sets: 3,
    weight: '',
    reps: '10',
    time: '',
    resistance: '',
    slope: '',
    speed: '',
    notes: ''
  });
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // 用於處理滑動手勢的 Ref
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    const savedLogs = localStorage.getItem('rehab_logs_v16');
    const savedStatuses = localStorage.getItem('rehab_statuses_v16');
    if (savedLogs) setLogs(JSON.parse(savedLogs));
    if (savedStatuses) setDailyStatuses(JSON.parse(savedStatuses));
  }, []);

  useEffect(() => {
    localStorage.setItem('rehab_logs_v16', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('rehab_statuses_v16', JSON.stringify(dailyStatuses));
  }, [dailyStatuses]);

  const currentDailyStatus = dailyStatuses[formData.date] || '';

  const handleStatusChange = (val: string) => {
    setDailyStatuses(prev => ({ ...prev, [formData.date]: val }));
  };

  const currentExercise = useMemo(() => 
    EXERCISES.find(e => e.id === formData.exerciseId) || EXERCISES[0]
  , [formData.exerciseId]);

  // 過濾動作邏輯
  const filteredExercises = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return EXERCISES;
    return EXERCISES.filter(ex => 
      ex.name.toLowerCase().includes(term) || 
      ex.category.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  const filteredCategories = useMemo(() => {
    return CATEGORIES.filter(cat => 
      filteredExercises.some(ex => ex.category === cat)
    );
  }, [filteredExercises]);

  useEffect(() => {
    if (!editingId) {
      setFormData(prev => ({
        ...prev,
        side: currentExercise.isUnilateral ? '左' : 'N/A' as any,
        weight: currentExercise.category === BodyPart.LANDMINE ? '20' : '',
        reps: currentExercise.mode === 'REPS_ONLY' || currentExercise.mode === 'STRENGTH' ? '10' : '',
        time: currentExercise.mode === 'TIME_ONLY' ? '30' : (currentExercise.mode === 'CYCLING' || currentExercise.mode === 'TREADMILL' ? '15' : ''),
        resistance: '',
        slope: '',
        speed: '',
        sets: (currentExercise.mode === 'RELAX' || currentExercise.mode === 'CYCLING' || currentExercise.mode === 'TREADMILL') ? 1 : 3
      }));
    }
  }, [currentExercise, editingId]);

  // 滑動手勢處理函數
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const diffX = touchEndX - touchStartX.current;
    const diffY = touchEndY - touchStartY.current;

    if (Math.abs(diffX) > 70 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) {
        if (activeTab === 'form') {
          setActiveTab('history');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        if (activeTab === 'history') {
          setActiveTab('form');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleSaveLog = () => {
    setIsProcessing(true);
    let finalValue = "";
    let finalUnit = "";

    switch(currentExercise.mode) {
      case 'STRENGTH':
        finalValue = `${formData.weight !== '' ? formData.weight + 'kg ' : ''}${formData.reps}下`;
        finalUnit = '組';
        break;
      case 'REPS_ONLY':
        finalValue = `${formData.reps}下`;
        finalUnit = '組';
        break;
      case 'TIME_ONLY':
        finalValue = `${formData.time}秒`;
        finalUnit = '組';
        break;
      case 'CYCLING':
        finalValue = `阻力${formData.resistance}`;
        finalUnit = `${formData.time}分鐘`;
        break;
      case 'TREADMILL':
        finalValue = `坡度${formData.slope} 速度${formData.speed}`;
        finalUnit = `${formData.time}分鐘`;
        break;
      case 'RELAX':
        finalValue = "已完成";
        finalUnit = "次";
        break;
    }

    const sideToSave = currentExercise.isUnilateral 
      ? (formData.side === '記錄雙側' ? '雙側' : formData.side as any) 
      : 'N/A';

    if (editingId) {
      setLogs(prev => prev.map(log => log.id === editingId ? {
        ...log,
        date: formData.date,
        exerciseName: currentExercise.name,
        category: currentExercise.category,
        side: sideToSave,
        sets: formData.sets,
        value: finalValue,
        unit: finalUnit,
        notes: formData.notes
      } : log));
      setEditingId(null);
      setActiveTab('history');
    } else {
      const newLog: ExerciseLog = {
        id: crypto.randomUUID(),
        date: formData.date,
        exerciseName: currentExercise.name,
        category: currentExercise.category,
        side: sideToSave,
        sets: formData.sets,
        value: finalValue,
        unit: finalUnit,
        notes: formData.notes
      };
      setLogs(prev => [newLog, ...prev]);
    }
    
    setTimeout(() => {
      setFormData(prev => ({ 
        ...prev, 
        weight: currentExercise.category === BodyPart.LANDMINE ? '20' : '', 
        notes: '' 
      }));
      setIsProcessing(false);
    }, 200);
  };

  const startEditing = (log: ExerciseLog) => {
    const exercise = EXERCISES.find(ex => ex.name === log.exerciseName);
    if (!exercise) return;
    let weight = '', reps = '', time = '', resistance = '', slope = '', speed = '';
    if (exercise.mode === 'STRENGTH') {
      const match = log.value.match(/(\d+(?:\.\d+)?)kg\s+(\d+)下/);
      if (match) { weight = match[1]; reps = match[2]; } 
      else { reps = log.value.replace('下', ''); }
    } else if (exercise.mode === 'REPS_ONLY') { reps = log.value.replace('下', ''); }
    else if (exercise.mode === 'TIME_ONLY') { time = log.value.replace('秒', ''); }
    else if (exercise.mode === 'CYCLING') { resistance = log.value.replace('阻力', ''); time = log.unit.replace('分鐘', ''); }
    else if (exercise.mode === 'TREADMILL') {
      const match = log.value.match(/坡度([\d.]+)\s+速度([\d.]+)/);
      if (match) { slope = match[1]; speed = match[2]; }
      time = log.unit.replace('分鐘', '');
    }
    setEditingId(log.id);
    setFormData({
      date: log.date, exerciseId: exercise.id,
      side: log.side === '雙側' ? '記錄雙側' : log.side as any,
      sets: log.sets, weight, reps, time, resistance, slope, speed, notes: log.notes
    });
    setSearchTerm('');
    setActiveTab('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const groupedLogs = useMemo(() => {
    const groups: Record<string, ExerciseLog[]> = {};
    logs.forEach(log => {
      if (!groups[log.date]) groups[log.date] = [];
      groups[log.date].push(log);
    });
    return Object.keys(groups).sort((a, b) => b.localeCompare(a)).map(date => ({
      date, logs: groups[date], status: dailyStatuses[date] || ''
    }));
  }, [logs, dailyStatuses]);

  const handleDeleteAll = () => {
    if (window.confirm('⚠️ 確定要刪除「所有」歷史紀錄嗎？')) {
      setLogs([]); setDailyStatuses({}); localStorage.clear();
    }
  };

  const handleCopyToClipboard = () => {
    if (groupedLogs.length === 0) {
      alert(`目前沒有紀錄可以複製喔！`);
      return;
    }
    
    const allText = groupedLogs.map(group => {
      const title = `📅 【${group.date} 復健日誌】`;
      const status = `🧠 今日狀況：${group.status || '未填寫'}`;
      const tableHeader = "動作項目\t側邊\t負重\t組數\t組數\t備註";
      
      const tableRows = group.logs.map(l => {
        const sideCol = (l.side === 'N/A' || l.side === '雙側') ? '雙側' : l.side;
        const exercise = EXERCISES.find(ex => ex.name === l.exerciseName);
        
        let loadCol = "-";   
        let perfCol = "-";   
        let setsCol = `${l.sets}組`; 

        if (exercise) {
          if (exercise.mode === 'STRENGTH') {
            const wMatch = l.value.match(/(\d+(?:\.\d+)?)kg/);
            const rMatch = l.value.match(/(\d+)下/);
            loadCol = wMatch ? `${wMatch[1]}公斤` : "0公斤";
            perfCol = rMatch ? `${rMatch[1]}下` : l.value;
          } else if (exercise.mode === 'REPS_ONLY' || exercise.mode === 'TIME_ONLY') {
            perfCol = l.value;
          } else if (exercise.mode === 'CYCLING' || exercise.mode === 'TREADMILL') {
            loadCol = l.value; 
            perfCol = l.unit;  
          } else if (exercise.mode === 'RELAX') {
            perfCol = "已完成";
          }
        }
        
        return `${l.exerciseName}\t${sideCol}\t${loadCol}\t${perfCol}\t${setsCol}\t${l.notes || ""}`;
      }).join('\n');

      return `${title}\n${status}\n\n${tableHeader}\n${tableRows}`;
    }).join('\n\n' + '─'.repeat(30) + '\n\n');

    navigator.clipboard.writeText(allText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div 
      className="pb-32 px-4 max-w-7xl mx-auto flex flex-col items-center font-['Noto_Sans_TC'] select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <header className="py-6 md:py-12 text-center w-full transition-all flex flex-col items-center">
        <div className="inline-block p-3 md:p-8 rounded-[2rem] md:rounded-[4rem] bg-white shadow-lg mb-4 md:mb-8 border-2 md:border-4 border-indigo-700 relative overflow-hidden group">
          <svg className="w-12 h-12 md:w-32 md:h-32 relative z-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="15" fill="#f5f3ff" opacity="0.8" />
            <path d="M42 51 Q50 48 58 51 L62 76 Q50 82 38 76 Z" fill="#6366f1" />
            <path d="M58 55 L75 22" stroke="#ffdbca" strokeWidth="6" strokeLinecap="round" />
            <path d="M42 55 L25 50" stroke="#ffdbca" strokeWidth="6" strokeLinecap="round" />
            <rect x="38" y="75" width="8" height="12" rx="2" fill="#1e1b4b" transform="rotate(-15 38 75)" />
            <rect x="54" y="75" width="8" height="12" rx="2" fill="#1e1b4b" transform="rotate(10 54 75)" />
          </svg>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-950 tracking-tight leading-tight">
          RehabFlow <span className="text-indigo-700">Smart</span>
        </h1>
        <p className="mt-1 text-slate-900 font-black tracking-widest text-xs md:text-sm uppercase">mm復健日記</p>
      </header>

      <div className="sticky top-2 z-50 bg-white/95 backdrop-blur-lg p-1.5 rounded-full shadow-2xl border border-indigo-100 mb-8 flex w-full max-w-xs mx-auto md:hidden ring-2 ring-indigo-50">
        <button onClick={() => { setActiveTab('form'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`flex-1 py-3 rounded-full font-black text-sm transition-all ${activeTab === 'form' ? 'bg-indigo-700 text-white shadow-md scale-105' : 'text-slate-600'}`}>⚡ 紀錄動作</button>
        <button onClick={() => { setActiveTab('history'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`flex-1 py-3 rounded-full font-black text-sm transition-all ${activeTab === 'history' ? 'bg-indigo-700 text-white shadow-md scale-105' : 'text-slate-600'}`}>📅 歷史進度</button>
      </div>

      <div className="flex flex-col gap-8 md:gap-10 w-full max-w-4xl">
        <div className={`${activeTab === 'form' ? 'block' : 'hidden md:block'} space-y-8 md:space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
          <div className="glass-card rounded-[2rem] md:rounded-[3rem] p-6 md:p-8 border-b-4 md:border-b-8 border-emerald-600 shadow-xl shadow-emerald-100/40">
            <div className="flex flex-col md:flex-row gap-5 md:gap-6 items-start">
              <div className="w-full md:w-1/3">
                <label className="text-xs md:text-xs font-black text-emerald-900 mb-2 block uppercase tracking-widest">📅 選擇日期</label>
                <input type="date" className="w-full px-5 py-4 rounded-xl md:rounded-3xl bg-white border-2 border-emerald-100 focus:border-emerald-500 outline-none font-black text-slate-950 shadow-sm text-base md:text-base" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
              </div>
              <div className="w-full md:w-2/3">
                <label className="text-xs md:text-xs font-black text-emerald-900 mb-2 block uppercase tracking-widest">🧠 今日身體狀況</label>
                <textarea placeholder="今天的體感..." className="w-full px-5 py-4 rounded-xl md:rounded-3xl bg-white border-2 border-emerald-100 focus:border-emerald-500 outline-none font-bold text-slate-800 shadow-sm h-16 md:h-20 resize-none text-base md:text-base leading-relaxed" value={currentDailyStatus} onChange={e => handleStatusChange(e.target.value)} />
              </div>
            </div>
          </div>

          <div className={`glass-card rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 border-b-4 md:border-b-8 transition-all duration-300 ${editingId ? 'border-orange-500 shadow-orange-100 ring-4 ring-orange-50' : 'border-indigo-800 shadow-indigo-300/40'}`}>
            <h2 className="text-xl md:text-2xl font-black text-slate-950 mb-6 md:mb-8 flex items-center">
              <span className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl md:rounded-2xl mr-4 md:mr-4 text-base md:text-xl shadow-lg text-white transition-colors ${editingId ? 'bg-orange-500' : 'bg-indigo-800'}`}>{editingId ? '✏️' : '⚡'}</span>
              {editingId ? '修改動作內容' : `新增紀錄`}
            </h2>
            <div className="space-y-6 md:space-y-6">
              <section className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
                  <div className="flex-1">
                    <label className="text-xs md:text-sm font-black text-slate-950 mb-2 block tracking-tighter uppercase tracking-widest">🎯 選擇復健動作</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <input 
                        type="text" 
                        placeholder="搜尋動作關鍵字..." 
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-800 shadow-sm text-sm md:text-base transition-all"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                <select 
                  className="w-full px-5 py-4 md:py-4 rounded-xl md:rounded-3xl bg-white border-2 md:border-4 border-slate-100 focus:border-indigo-700 outline-none font-black text-slate-950 shadow-sm text-base md:text-base" 
                  value={formData.exerciseId} 
                  onChange={e => setFormData({ ...formData, exerciseId: e.target.value })}
                >
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map(cat => (
                      <optgroup label={cat} key={cat} className="bg-slate-200 text-slate-950 font-black">
                        {filteredExercises.filter(ex => ex.category === cat).map(ex => (
                          <option value={ex.id} key={ex.id} className="bg-white font-bold">{ex.name}</option>
                        ))}
                      </optgroup>
                    ))
                  ) : (
                    <option disabled>找不到符合搜尋的動作</option>
                  )}
                </select>
              </section>
              
              <div className={`p-5 md:p-6 rounded-[1.8rem] md:rounded-[2.5rem] border-2 space-y-6 md:space-y-6 transition-colors ${editingId ? 'bg-orange-50 border-orange-100' : 'bg-indigo-50/50 border-indigo-100'}`}>
                {currentExercise.isUnilateral && (
                  <section>
                    <label className="text-xs md:text-xs font-black text-slate-950 mb-3 block uppercase tracking-widest text-center md:text-left">執行側邊</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['左', '右', '記錄雙側'].map(s => (
                        <button key={s} type="button" onClick={() => setFormData({ ...formData, side: s as any })} className={`py-3 md:py-3 rounded-xl md:rounded-2xl font-black text-xs md:text-sm transition-all shadow-sm ${formData.side === s ? (editingId ? 'bg-orange-500 text-white' : 'bg-indigo-700 text-white') : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}>{s}</button>
                      ))}
                    </div>
                  </section>
                )}
                
                <div className={`grid ${currentExercise.mode === 'TREADMILL' ? 'grid-cols-3' : 'grid-cols-2'} gap-4 md:gap-4`}>
                  {(currentExercise.mode === 'STRENGTH' || currentExercise.mode === 'CYCLING' || currentExercise.mode === 'TREADMILL') && (
                    <section>
                      <label className="text-xs md:text-xs font-black text-slate-950 mb-2 block text-center md:text-left uppercase tracking-widest">{currentExercise.mode === 'CYCLING' ? '阻力' : currentExercise.mode === 'TREADMILL' ? '坡度' : '負重(kg)'}</label>
                      <input type="text" inputMode="decimal" className="w-full px-3 py-4 rounded-xl md:rounded-2xl bg-white border-2 border-indigo-200 focus:border-indigo-700 outline-none font-black text-slate-950 text-xl md:text-xl text-center shadow-inner" value={currentExercise.mode === 'CYCLING' ? formData.resistance : currentExercise.mode === 'TREADMILL' ? formData.slope : formData.weight} onChange={e => setFormData({ ...formData, [currentExercise.mode === 'CYCLING' ? 'resistance' : (currentExercise.mode === 'TREADMILL' ? 'slope' : 'weight')]: e.target.value })} />
                    </section>
                  )}
                  {currentExercise.mode === 'TREADMILL' && (
                    <section>
                      <label className="text-xs md:text-xs font-black text-slate-950 mb-2 block text-center md:text-left uppercase tracking-widest">速度</label>
                      <input type="text" inputMode="decimal" className="w-full px-3 py-4 rounded-xl md:rounded-2xl bg-white border-2 border-indigo-200 focus:border-indigo-700 outline-none font-black text-slate-950 text-xl md:text-xl text-center shadow-inner" value={formData.speed} onChange={e => setFormData({ ...formData, speed: e.target.value })} />
                    </section>
                  )}
                  {currentExercise.mode !== 'RELAX' && (
                    <section className={currentExercise.mode === 'REPS_ONLY' || currentExercise.mode === 'TIME_ONLY' ? 'col-span-2' : ''}>
                      <label className="text-xs md:text-xs font-black text-slate-950 mb-2 block text-center md:text-left uppercase tracking-widest">{currentExercise.mode === 'TIME_ONLY' || currentExercise.mode === 'CYCLING' || currentExercise.mode === 'TREADMILL' ? '時間' : '次數'}</label>
                      <input type="text" inputMode="numeric" className="w-full px-3 py-4 rounded-xl md:rounded-2xl bg-white border-2 border-indigo-200 focus:border-indigo-700 outline-none font-black text-slate-950 text-xl md:text-xl text-center shadow-inner" value={currentExercise.mode === 'TIME_ONLY' || currentExercise.mode === 'CYCLING' || currentExercise.mode === 'TREADMILL' ? formData.time : formData.reps} onChange={e => setFormData({ ...formData, [currentExercise.mode === 'TIME_ONLY' || currentExercise.mode === 'CYCLING' || currentExercise.mode === 'TREADMILL' ? 'time' : 'reps']: e.target.value })} />
                    </section>
                  )}
                </div>

                {currentExercise.mode !== 'RELAX' && currentExercise.mode !== 'CYCLING' && currentExercise.mode !== 'TREADMILL' && (
                  <section>
                    <label className="text-xs md:text-xs font-black text-slate-950 mb-3 block text-center uppercase tracking-widest">總組數</label>
                    <div className="flex items-center justify-center space-x-8 md:space-x-8">
                      <button type="button" onClick={() => setFormData({...formData, sets: Math.max(1, formData.sets - 1)})} className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-xl md:rounded-2xl border-2 border-slate-200 text-slate-950 font-black text-xl shadow-sm">-</button>
                      <span className="text-3xl md:text-4xl font-black text-indigo-800 w-10 text-center">{formData.sets}</span>
                      <button type="button" onClick={() => setFormData({...formData, sets: formData.sets + 1})} className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-xl md:rounded-2xl border-2 border-slate-200 text-slate-950 font-black text-xl shadow-sm">+</button>
                    </div>
                  </section>
                )}
              </div>

              <section>
                <label className="text-xs md:text-sm font-black text-slate-950 mb-2 block uppercase tracking-widest">📔 動作備註</label>
                <textarea placeholder="今日體感..." className="w-full px-5 py-4 rounded-xl md:rounded-3xl bg-white border-2 border-slate-100 focus:border-indigo-700 outline-none h-18 md:h-20 font-bold text-slate-950 shadow-inner resize-none text-base md:text-base leading-relaxed" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
              </section>

              <button type="button" onClick={handleSaveLog} disabled={isProcessing} className={`w-full py-5 md:py-6 rounded-2xl md:rounded-[2.5rem] font-black text-white shadow-xl md:shadow-2xl transition-all transform active:scale-95 text-lg md:text-2xl ${isProcessing ? 'bg-slate-400' : editingId ? 'bg-gradient-to-br from-orange-500 to-rose-600' : 'bg-gradient-to-br from-indigo-800 via-indigo-900 to-slate-950'}`}>
                {isProcessing ? '處理中...' : editingId ? '💾 儲存修改' : '🎯 確定新增紀錄'}
              </button>
            </div>
          </div>
        </div>

        <div className={`${activeTab === 'history' ? 'block' : 'hidden md:block'} w-full space-y-8 md:space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
          <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-4 px-1 md:px-4">
            <h2 className="text-2xl md:text-3xl font-black text-slate-950">歷史復健日誌</h2>
            <div className="flex gap-3 w-full md:w-auto">
              <button type="button" onClick={handleDeleteAll} className="flex-1 md:flex-none px-4 md:px-6 py-3 rounded-xl font-black bg-white text-rose-600 border border-rose-100 text-xs md:text-sm shadow-sm">🗑️ 清空</button>
              <button type="button" onClick={handleCopyToClipboard} className={`flex-[2] md:flex-none px-6 md:px-8 py-3 rounded-xl font-black shadow-lg text-sm md:text-lg transition-all ${logs.length === 0 ? 'bg-slate-100 text-slate-400' : copied ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-white'}`}>{copied ? '✅ 成功' : '📋 複製日誌'}</button>
            </div>
          </div>

          <div className="space-y-8 md:space-y-10">
            {groupedLogs.map(group => (
              <div key={group.date} className="glass-card rounded-[2rem] md:rounded-[4rem] overflow-hidden border-2 border-white shadow-lg bg-white/60">
                <div className="bg-slate-950 p-5 md:p-8 text-white border-b-2 border-indigo-700">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 md:w-14 md:h-14 bg-indigo-700 rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-2xl">📅</div>
                      <div>
                        <span className="text-xl md:text-3xl font-black tracking-tighter block">{group.date}</span>
                        <span className="px-2 py-0.5 bg-white/20 rounded text-xs font-bold uppercase tracking-widest">{group.logs.length} 項目</span>
                      </div>
                    </div>
                    <div className="flex-1 p-3.5 md:p-5 bg-white/5 rounded-2xl md:rounded-[2rem] border border-white/10 backdrop-blur-md">
                      <p className="text-sm md:text-lg font-bold text-emerald-400 leading-relaxed">{group.status || '未填寫狀況...'}</p>
                    </div>
                  </div>
                </div>

                <div className="md:block">
                   <div className="block md:hidden divide-y-2 divide-indigo-50/50">
                      {group.logs.map(log => (
                        <div key={log.id} className="p-5 flex flex-col gap-4 hover:bg-white transition-colors relative">
                           <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h3 className="text-lg font-black text-slate-950 leading-tight">{log.exerciseName}</h3>
                                <div className="flex gap-2 mt-2 items-center flex-wrap">
                                   <span className="text-xs text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/50">{log.category}</span>
                                   {log.side !== 'N/A' && <span className={`px-2 py-0.5 rounded-full text-xs font-black text-white shadow-sm ${log.side === '左' ? 'bg-orange-600' : log.side === '右' ? 'bg-indigo-700' : 'bg-emerald-600'}`}>{log.side}</span>}
                                </div>
                              </div>
                              <div className="text-right ml-3">
                                 <span className="text-xl font-black text-indigo-950 bg-indigo-100/50 px-3 py-1 rounded-xl block border border-indigo-200 shadow-sm">{log.value}</span>
                                 <span className="block text-xs font-black text-slate-500 mt-1.5 uppercase tracking-tighter">{log.sets > 1 ? `× ${log.sets} 組` : log.unit}</span>
                              </div>
                           </div>
                           {log.notes && <p className="text-sm text-slate-600 font-medium italic bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">“{log.notes}”</p>}
                           <div className="flex justify-end gap-6 pt-3 border-t border-slate-100 mt-1">
                              <button onClick={() => startEditing(log)} className="text-sm font-black text-indigo-700 px-3 py-1 flex items-center gap-1">✏️ 修改</button>
                              <button onClick={() => { if(window.confirm('確定刪除？')) setLogs(prev => prev.filter(l => l.id !== log.id)); }} className="text-sm font-black text-rose-600 px-3 py-1 flex items-center gap-1">🗑️ 刪除</button>
                           </div>
                        </div>
                      ))}
                   </div>
                   
                   <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left min-w-[700px]">
                      <tbody className="divide-y-2 divide-indigo-50">
                        {group.logs.map(log => (
                          <tr key={log.id} className="hover:bg-indigo-50/40 transition-all">
                            <td className="px-8 py-8 w-1/2">
                              <div className="text-xl font-black text-slate-950">{log.exerciseName}</div>
                              <div className="flex gap-2 mt-2 items-center">
                                <span className="text-sm text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md">{log.category}</span>
                                {log.side !== 'N/A' && <span className={`px-2 py-0.5 rounded-full text-sm font-black text-white ${log.side === '左' ? 'bg-orange-600' : log.side === '右' ? 'bg-indigo-700' : 'bg-emerald-600'}`}>{log.side}</span>}
                              </div>
                              {log.notes && <div className="mt-2 text-base text-slate-500 font-medium italic bg-slate-100/50 p-2 rounded-xl">“{log.notes}”</div>}
                            </td>
                            <td className="px-8 py-8 text-center">
                              <span className="text-2xl font-black text-indigo-900 bg-white px-5 py-3 rounded-[1.5rem] border-2 border-indigo-50 inline-block shadow-sm">{log.value}</span>
                              <span className="block text-sm font-black text-slate-400 mt-2 uppercase tracking-widest">{log.sets > 1 ? `× ${log.sets} 組` : log.unit}</span>
                            </td>
                            <td className="px-8 py-8 text-right">
                              <div className="flex justify-end gap-2">
                                <button onClick={() => startEditing(log)} className="p-3 bg-white border border-slate-100 rounded-2xl text-indigo-600 shadow-sm transition-transform active:scale-90 hover:bg-indigo-50"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                                <button onClick={() => { if(window.confirm('確定刪除？')) setLogs(prev => prev.filter(l => l.id !== log.id)); }} className="p-3 bg-white border border-slate-100 rounded-2xl text-rose-500 shadow-sm transition-transform active:scale-90 hover:bg-rose-50"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
