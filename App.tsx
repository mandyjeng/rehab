
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { EXERCISES, CATEGORIES } from './constants';
import { ExerciseLog, FormData, BodyPart, ExerciseDefinition } from './types';

const App: React.FC = () => {
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [dailyStatuses, setDailyStatuses] = useState<Record<string, string>>({}); 
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<FormData>({
    date: new Date().toISOString().split('T')[0],
    exerciseId: '', // 預設為空，對應「請選擇」
    side: '記錄雙側',
    sets: 1, // 總組數預設填 1
    weight: '0', // 初始預設填 0
    reps: '10',
    time: '',
    resistance: '',
    slope: '',
    speed: '',
    notes: ''
  });
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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

  // 點擊外部關閉下拉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentDailyStatus = dailyStatuses[formData.date] || '';

  const handleStatusChange = (val: string) => {
    setDailyStatuses(prev => ({ ...prev, [formData.date]: val }));
  };

  const currentExercise = useMemo(() => 
    EXERCISES.find(e => e.id === formData.exerciseId) || null
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
    if (!editingId && currentExercise) {
      // 根據特定規則設定次數/場數/趟數的預設值
      let defaultReps = '10';
      if (currentExercise.name === '打羽球') {
        defaultReps = '5';
      } else if (currentExercise.category === BodyPart.BADMINTON) {
        defaultReps = '3';
      }

      setFormData(prev => ({
        ...prev,
        side: currentExercise.isUnilateral ? '左' : 'N/A' as any,
        // 如果是地雷管類別預設 20，其餘 0
        weight: currentExercise.category === BodyPart.LANDMINE ? '20' : '0',
        reps: currentExercise.mode === 'REPS_ONLY' || currentExercise.mode === 'STRENGTH' ? defaultReps : '',
        time: currentExercise.mode === 'TIME_ONLY' ? '30' : (currentExercise.mode === 'CYCLING' || currentExercise.mode === 'TREADMILL' ? '15' : ''),
        resistance: '',
        slope: '',
        speed: '',
        sets: 1 // 總組數預設為 1
      }));
    }
  }, [currentExercise, editingId]);

  const handleSaveLog = () => {
    // 修正：如果沒有選擇動作
    if (!currentExercise) {
      // 檢查是否填寫了身體狀況，如果有則提示狀況已更新，並導向歷史紀錄以便確認
      if (currentDailyStatus.trim()) {
        alert("今日身體狀況已更新完成！✅");
        setActiveTab('history');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      alert("請先選擇一個復健動作喔！");
      return;
    }

    setIsProcessing(true);
    let finalValue = "";
    let finalUnit = "";

    switch(currentExercise.mode) {
      case 'STRENGTH':
        const wUnit = currentExercise.name === '打羽球' ? '分 ' : 'kg ';
        const rUnit = currentExercise.defaultUnit || '下';
        finalValue = `${formData.weight !== '' ? formData.weight + wUnit : '0' + wUnit}${formData.reps}${rUnit}`;
        finalUnit = '組';
        break;
      case 'REPS_ONLY':
        const unitLabel = currentExercise.defaultUnit || '下';
        finalValue = `${formData.reps}${unitLabel}`;
        finalUnit = '組';
        break;
      case 'TIME_ONLY':
        finalValue = `${formData.time}秒`;
        finalUnit = '組';
        break;
      case 'CYCLING':
        finalValue = `阻力${formData.resistance || '0'}`;
        finalUnit = `${formData.time || '0'}分鐘`;
        break;
      case 'TREADMILL':
        finalValue = `坡度${formData.slope || '0'} 速度${formData.speed || '0'}`;
        finalUnit = `${formData.time || '0'}分鐘`;
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
      // 新增動作後自動導向歷史頁籤
      setActiveTab('history');
    }
    
    // 儲存後捲動至頂部
    window.scrollTo({ top: 0, behavior: 'smooth' });

    setTimeout(() => {
      setFormData(prev => ({ 
        ...prev, 
        exerciseId: '', // 儲存後重置為「請選擇」
        weight: '0', 
        sets: 1,
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
      const wUnit = exercise.name === '打羽球' ? '分' : 'kg';
      const rUnit = exercise.defaultUnit || '下';
      const regex = new RegExp(`(\\d+(?:\\.\\d+)?)${wUnit}\\s+(\\d+)${rUnit}`);
      const match = log.value.match(regex);
      if (match) { weight = match[1]; reps = match[2]; } 
      else { reps = log.value.replace(rUnit, ''); }
    } else if (exercise.mode === 'REPS_ONLY') { 
      const rUnit = exercise.defaultUnit || '下';
      reps = log.value.replace(rUnit, ''); 
    }
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
    
    // 獲取所有有紀錄或有狀態（且狀態不為空）的日期
    const statusDates = Object.keys(dailyStatuses).filter(d => {
      const status = dailyStatuses[d];
      return typeof status === 'string' && status.trim() !== '';
    });
    
    const allDates = new Set([...Object.keys(groups), ...statusDates]);

    return Array.from(allDates).sort((a, b) => b.localeCompare(a)).map(date => ({
      date, 
      logs: groups[date] || [], 
      status: dailyStatuses[date] || ''
    }));
  }, [logs, dailyStatuses]);

  const handleDeleteAll = () => {
    if (window.confirm('⚠️ 確定要刪除「所有」歷史紀錄嗎？')) {
      setLogs([]); setDailyStatuses({}); localStorage.clear();
    }
  };

  const handleDeleteDay = (date: string) => {
    if (window.confirm(`⚠️ 確定要刪除 ${date} 的所有紀錄（包含動作與身體狀況）嗎？`)) {
      setLogs(prev => prev.filter(log => log.date !== date));
      setDailyStatuses(prev => {
        const next = { ...prev };
        delete next[date];
        return { ...next };
      });
    }
  };

  // 修正：支援傳入特定日期，或複製全部
  const handleCopyToClipboard = (targetDate?: string) => {
    if (groupedLogs.length === 0) {
      alert(`目前沒有紀錄可以複製喔！`);
      return;
    }

    const dataToCopy = targetDate 
      ? groupedLogs.filter(g => g.date === targetDate)
      : groupedLogs;

    const allText = dataToCopy.map(group => {
      const title = `📅 【${group.date} 復健日誌】`;
      const status = `🧠 今日狀況：${group.status || '未填寫'}`;
      const tableHeader = "動作項目\t側邊\t負重\t組數\t組數\t備註";
      const tableRows = group.logs.map(l => {
        const sideCol = (l.side === 'N/A' || l.side === '雙側') ? '雙側' : l.side;
        const exercise = EXERCISES.find(ex => ex.name === l.exerciseName);
        let loadCol = "-"; let perfCol = "-"; let setsCol = `${l.sets}組`; 
        if (exercise) {
          if (exercise.mode === 'STRENGTH') {
            const wUnit = exercise.name === '打羽球' ? '分' : 'kg';
            const rUnit = exercise.defaultUnit || '下';
            const wMatch = l.value.match(new RegExp(`(\\d+(?:\\.\\d+)?)${wUnit}`));
            const rMatch = l.value.match(new RegExp(`(\\d+)${rUnit}`));
            loadCol = wMatch ? `${wMatch[1]}${wUnit === '分' ? '分' : '公斤'}` : "0公斤";
            perfCol = rMatch ? `${rMatch[1]}${rUnit}` : l.value;
          } else if (exercise.mode === 'REPS_ONLY' || exercise.mode === 'TIME_ONLY') {
            perfCol = l.value;
          } else if (exercise.mode === 'CYCLING' || exercise.mode === 'TREADMILL') {
            loadCol = l.value; perfCol = l.unit;  
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
      if (targetDate) alert(`${targetDate} 的紀錄已複製！`);
    });
  };

  return (
    <div 
      className="pb-32 px-4 max-w-7xl mx-auto flex flex-col items-center font-['Noto_Sans_TC'] select-none"
    >
      <header className="py-8 md:py-12 text-center w-full transition-all flex flex-col items-center">
        <div className="inline-block p-1 md:p-4 rounded-[2.5rem] md:rounded-[4rem] bg-white shadow-2xl mb-6 md:mb-8 border-4 border-indigo-600 relative overflow-hidden ring-8 ring-indigo-50">
          <img 
            src="https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=2069&auto=format&fit=crop" 
            alt="Workout Illustration" 
            className="w-24 h-24 md:w-48 md:h-48 object-cover rounded-[2rem]"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=2069&auto=format&fit=crop";
            }}
          />
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-slate-950 tracking-tight leading-tight">
          RehabFlow <span className="text-indigo-700">Smart</span>
        </h1>
        <p className="mt-2 text-slate-900 font-black tracking-widest text-base md:text-lg uppercase">mm復健日記</p>
      </header>

      {/* 底部 Tab */}
      <div className="sticky top-2 z-50 bg-white/95 backdrop-blur-lg p-2 rounded-full shadow-2xl border border-indigo-100 mb-8 flex w-full max-w-sm mx-auto md:hidden ring-4 ring-indigo-50">
        <button onClick={() => { setActiveTab('form'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`flex-1 py-4 rounded-full font-black text-lg transition-all ${activeTab === 'form' ? 'bg-indigo-700 text-white shadow-md scale-105' : 'text-slate-600'}`}>⚡ 紀錄動作</button>
        <button onClick={() => { setActiveTab('history'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`flex-1 py-4 rounded-full font-black text-lg transition-all ${activeTab === 'history' ? 'bg-indigo-700 text-white shadow-md scale-105' : 'text-slate-600'}`}>📅 歷史紀錄</button>
      </div>

      <div className="flex flex-col gap-8 md:gap-10 w-full max-w-4xl">
        {/* 表單區域 */}
        <div className={`${activeTab === 'form' ? 'block' : 'hidden md:block'} space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
          <div className="glass-card rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-10 border-b-4 md:border-b-8 border-emerald-600 shadow-xl shadow-emerald-100/40">
            <div className="flex flex-col md:flex-row gap-8 md:gap-8 items-start">
              <div className="w-full md:w-1/3">
                <label className="text-lg md:text-base font-black text-emerald-900 mb-3 block uppercase tracking-widest">📅 選擇日期</label>
                <input type="date" className="w-full px-5 py-5 rounded-2xl md:rounded-3xl bg-white border-2 border-emerald-100 focus:border-emerald-500 outline-none font-black text-slate-950 shadow-sm text-xl md:text-lg" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
              </div>
              <div className="w-full md:w-2/3">
                <label className="text-lg md:text-base font-black text-emerald-900 mb-3 block uppercase tracking-widest">🧠 今日身體狀況</label>
                <textarea placeholder="今天的體感..." className="w-full px-5 py-5 rounded-2xl md:rounded-3xl bg-white border-2 border-emerald-100 focus:border-emerald-500 outline-none font-bold text-slate-800 shadow-sm h-24 md:h-24 resize-none text-xl md:text-lg leading-relaxed" value={currentDailyStatus} onChange={e => handleStatusChange(e.target.value)} />
              </div>
            </div>
          </div>

          <div className={`glass-card rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-10 border-b-4 md:border-b-8 transition-all duration-300 ${editingId ? 'border-orange-500 shadow-orange-100 ring-4 ring-orange-50' : 'border-indigo-800 shadow-indigo-300/40'}`}>
            <h2 className="text-3xl md:text-3xl font-black text-slate-950 mb-8 flex items-center">
              <span className={`w-14 h-14 flex items-center justify-center rounded-2xl mr-4 text-2xl shadow-lg text-white transition-colors ${editingId ? 'bg-orange-500' : 'bg-indigo-800'}`}>{editingId ? '✏️' : '⚡'}</span>
              {editingId ? '修改動作內容' : `新增紀錄`}
            </h2>
            <div className="space-y-8">
              <section className="space-y-4">
                <label className="text-lg md:text-base font-black text-slate-950 mb-3 block tracking-tighter uppercase tracking-widest">🎯 選擇復健動作</label>
                
                {/* 整合式搜尋選單 (Searchable Select) */}
                <div className="relative" ref={dropdownRef}>
                  <button 
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full px-6 py-5 rounded-2xl bg-white border-2 border-slate-100 focus:border-indigo-700 outline-none font-black text-slate-950 shadow-sm text-xl md:text-lg flex justify-between items-center transition-all hover:bg-slate-50"
                  >
                    <span className={currentExercise ? "text-slate-950" : "text-slate-400"}>
                      {currentExercise ? currentExercise.name : '── 請點擊選擇動作 ──'}
                    </span>
                    <svg className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M19 9l-7 7-7-7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute z-[100] w-full mt-2 bg-white rounded-3xl shadow-2xl border-2 border-indigo-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      {/* 下拉選單內的搜尋框 */}
                      <div className="p-4 border-b border-slate-100 sticky top-0 bg-white shadow-sm">
                        <div className="relative">
                          <input 
                            type="text" 
                            placeholder="搜尋動作關鍵字..." 
                            className="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-800"
                            value={searchTerm}
                            autoFocus
                            onChange={e => setSearchTerm(e.target.value)}
                            onKeyDown={e => e.stopPropagation()}
                          />
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* 動作清單 */}
                      <div className="max-h-[400px] overflow-y-auto overscroll-contain">
                        {filteredCategories.length > 0 ? (
                          filteredCategories.map(cat => (
                            <div key={cat} className="mb-2">
                              <div className="px-5 py-3 bg-slate-100/50 text-slate-500 font-black text-sm uppercase tracking-widest sticky top-0 z-10">{cat}</div>
                              {filteredExercises.filter(ex => ex.category === cat).map(ex => (
                                <button
                                  key={ex.id}
                                  type="button"
                                  className={`w-full text-left px-8 py-4 hover:bg-indigo-50 transition-colors font-bold text-lg md:text-base border-b border-slate-50 last:border-0 ${formData.exerciseId === ex.id ? 'bg-indigo-50 text-indigo-800 border-l-4 border-l-indigo-600' : 'text-slate-800'}`}
                                  onClick={() => {
                                    setFormData({ ...formData, exerciseId: ex.id });
                                    setIsDropdownOpen(false);
                                    setSearchTerm('');
                                  }}
                                >
                                  {ex.name}
                                </button>
                              ))}
                            </div>
                          ))
                        ) : (
                          <div className="py-12 text-center text-slate-400 font-bold italic">
                            找不到符合的動作項目...
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </section>
              
              <div className={`p-8 md:p-10 rounded-[2.5rem] border-2 space-y-8 transition-colors shadow-inner ${editingId ? 'bg-orange-50 border-orange-100' : 'bg-indigo-50/50 border-indigo-100'}`}>
                {currentExercise?.isUnilateral && (
                  <section>
                    <label className="text-lg md:text-base font-black text-slate-950 mb-4 block uppercase tracking-widest text-center md:text-left">執行側邊</label>
                    <div className="grid grid-cols-3 gap-4">
                      {['左', '右', '記錄雙側'].map(s => (
                        <button key={s} type="button" onClick={() => setFormData({ ...formData, side: s as any })} className={`py-5 md:py-4 rounded-2xl md:rounded-2xl font-black text-lg md:text-base transition-all shadow-md ${formData.side === s ? (editingId ? 'bg-orange-500 text-white' : 'bg-indigo-700 text-white') : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}>{s}</button>
                      ))}
                    </div>
                  </section>
                )}
                
                {currentExercise && (
                  <div className={`grid ${currentExercise.mode === 'TREADMILL' ? 'grid-cols-3' : 'grid-cols-2'} gap-6`}>
                    {(currentExercise.mode === 'STRENGTH' || currentExercise.mode === 'CYCLING' || currentExercise.mode === 'TREADMILL') && (
                      <section>
                        <label className="text-lg md:text-base font-black text-slate-950 mb-3 block text-center md:text-left uppercase tracking-widest">
                          {currentExercise.mode === 'CYCLING' ? '阻力' : currentExercise.mode === 'TREADMILL' ? '坡度' : (currentExercise.name === '打羽球' ? '跑動自評分' : '負重(kg)')}
                        </label>
                        <input type="text" inputMode="decimal" className="w-full px-3 py-6 rounded-2xl md:rounded-2xl bg-white border-2 border-indigo-200 focus:border-indigo-700 outline-none font-black text-slate-950 text-3xl md:text-2xl text-center shadow-inner" value={currentExercise.mode === 'CYCLING' ? formData.resistance : currentExercise.mode === 'TREADMILL' ? formData.slope : formData.weight} onChange={e => setFormData({ ...formData, [currentExercise.mode === 'CYCLING' ? 'resistance' : (currentExercise.mode === 'TREADMILL' ? 'slope' : 'weight')]: e.target.value })} />
                      </section>
                    )}
                    {currentExercise.mode === 'TREADMILL' && (
                      <section>
                        <label className="text-lg md:text-base font-black text-slate-950 mb-3 block text-center md:text-left uppercase tracking-widest">速度</label>
                        <input type="text" inputMode="decimal" className="w-full px-3 py-6 rounded-2xl md:rounded-2xl bg-white border-2 border-indigo-200 focus:border-indigo-700 outline-none font-black text-slate-950 text-3xl md:text-2xl text-center shadow-inner" value={formData.speed} onChange={e => setFormData({ ...formData, speed: e.target.value })} />
                      </section>
                    )}
                    {currentExercise.mode !== 'RELAX' && (
                      <section className={currentExercise.mode === 'REPS_ONLY' || currentExercise.mode === 'TIME_ONLY' ? 'col-span-2' : ''}>
                        <label className="text-lg md:text-base font-black text-slate-950 mb-3 block text-center md:text-left uppercase tracking-widest">
                          {currentExercise.mode === 'TIME_ONLY' || currentExercise.mode === 'CYCLING' || currentExercise.mode === 'TREADMILL' ? '時間' : (currentExercise.defaultUnit || '次數')}
                        </label>
                        <input type="text" inputMode="numeric" className="w-full px-3 py-6 rounded-2xl md:rounded-2xl bg-white border-2 border-indigo-200 focus:border-indigo-700 outline-none font-black text-slate-950 text-3xl md:text-2xl text-center shadow-inner" value={currentExercise.mode === 'TIME_ONLY' || currentExercise.mode === 'CYCLING' || currentExercise.mode === 'TREADMILL' ? formData.time : formData.reps} onChange={e => setFormData({ ...formData, [currentExercise.mode === 'TIME_ONLY' || currentExercise.mode === 'CYCLING' || currentExercise.mode === 'TREADMILL' ? 'time' : 'reps']: e.target.value })} />
                      </section>
                    )}
                  </div>
                )}

                {currentExercise && currentExercise.mode !== 'RELAX' && currentExercise.mode !== 'CYCLING' && currentExercise.mode !== 'TREADMILL' && (
                  <section>
                    <label className="text-lg md:text-base font-black text-slate-950 mb-4 block text-center uppercase tracking-widest">總組數</label>
                    <div className="flex items-center justify-center space-x-12">
                      <button type="button" onClick={() => setFormData({...formData, sets: Math.max(1, formData.sets - 1)})} className="w-16 h-16 bg-white rounded-2xl border-4 border-slate-100 text-slate-950 font-black text-3xl shadow-md">-</button>
                      <span className="text-5xl font-black text-indigo-800 w-16 text-center">{formData.sets}</span>
                      <button type="button" onClick={() => setFormData({...formData, sets: formData.sets + 1})} className="w-16 h-16 bg-white rounded-2xl border-4 border-slate-100 text-slate-950 font-black text-3xl shadow-md">+</button>
                    </div>
                  </section>
                )}
                
                {!currentExercise && (
                  <div className="py-12 text-center text-slate-400 font-bold italic">
                    請從上方選單選擇動作項目...
                  </div>
                )}
              </div>

              <section>
                <label className="text-lg md:text-base font-black text-slate-950 mb-3 block uppercase tracking-widest">📔 動作備註</label>
                <textarea placeholder="今日體感..." className="w-full px-6 py-5 rounded-2xl bg-white border-2 border-slate-100 focus:border-indigo-700 outline-none h-24 font-bold text-slate-950 shadow-inner resize-none text-xl md:text-lg leading-relaxed" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
              </section>

              <button type="button" onClick={handleSaveLog} disabled={isProcessing} className={`w-full py-7 rounded-[2.5rem] font-black text-white shadow-2xl transition-all transform active:scale-95 text-2xl md:text-3xl ${isProcessing ? 'bg-slate-400' : editingId ? 'bg-gradient-to-br from-orange-500 to-rose-600' : 'bg-gradient-to-br from-indigo-800 via-indigo-900 to-slate-950'}`}>
                {isProcessing ? '處理中...' : editingId ? '💾 儲存修改' : '🎯 確定新增紀錄'}
              </button>
            </div>
          </div>
        </div>

        {/* 歷史紀錄區域 */}
        <div className={`${activeTab === 'history' ? 'block' : 'hidden md:block'} w-full space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
          <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-6 px-1 md:px-4">
            <h2 className="text-4xl font-black text-slate-950">歷史復健日誌</h2>
            <div className="flex gap-4 w-full md:w-auto">
              <button type="button" onClick={handleDeleteAll} className="flex-1 md:flex-none px-6 py-5 rounded-2xl font-black bg-white text-rose-600 border border-rose-100 text-lg shadow-sm">🗑️ 清空</button>
              <button type="button" onClick={() => handleCopyToClipboard()} className={`flex-[2] md:flex-none px-8 py-5 rounded-2xl font-black shadow-lg text-lg md:text-xl transition-all ${logs.length === 0 ? 'bg-slate-100 text-slate-400' : copied ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-white'}`}>{copied ? '✅ 已複製' : '📋 複製全部日誌'}</button>
            </div>
          </div>

          <div className="space-y-10">
            {groupedLogs.map(group => (
              <div key={group.date} className="glass-card rounded-[3rem] overflow-hidden border-2 border-white shadow-2xl bg-white/80">
                {/* 日期標頭 (優化排版) */}
                <div className="bg-indigo-50/50 p-6 md:p-8 border-b-2 border-indigo-100 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-4 bg-indigo-600"></div>
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between w-full gap-4">
                      {/* 日期資訊 */}
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center text-2xl shadow-lg shrink-0">📅</div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-2xl md:text-4xl font-black text-indigo-950 whitespace-nowrap overflow-hidden text-ellipsis">{group.date}</span>
                          <span className="text-sm font-bold text-indigo-700/60 uppercase tracking-widest">{group.logs.length} 個動作</span>
                        </div>
                      </div>
                      
                      {/* 操作按鈕 (圖示化並防止斷行) */}
                      <div className="flex gap-2 shrink-0">
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleCopyToClipboard(group.date); }}
                          className="w-11 h-11 md:w-14 md:h-14 flex items-center justify-center bg-white hover:bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-200 shadow-sm transition-all active:scale-90"
                          title="複製此日紀錄"
                        >
                          📋
                        </button>
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleDeleteDay(group.date); }}
                          className="w-11 h-11 md:w-14 md:h-14 flex items-center justify-center bg-white hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 shadow-sm transition-all active:scale-90"
                          title="刪除此日紀錄"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    
                    {/* 今日狀況區塊 */}
                    <div className="w-full p-4 bg-white/60 border border-indigo-100 rounded-2xl shadow-inner">
                      <p className="text-lg font-bold text-slate-700 leading-relaxed italic text-center md:text-left">
                        {group.status ? `“${group.status}”` : '未填寫今日狀況...'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 行動端列表 (Mobile 優化) */}
                <div className="block md:hidden">
                  <div className="divide-y-2 divide-indigo-50/50">
                    {group.logs.map(log => (
                      <div key={log.id} className="p-6 hover:bg-white transition-colors">
                        <div className="flex justify-between items-center gap-4">
                          {/* 左側資訊區 */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-2xl font-black text-slate-950 truncate leading-tight mb-3">{log.exerciseName}</h3>
                            <div className="flex flex-wrap gap-2 items-center">
                              <span className="text-sm text-indigo-700 font-bold bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-200/50">{log.category}</span>
                              {log.side !== 'N/A' && (
                                <span className={`px-3 py-1 rounded-full text-sm font-black text-white ${log.side === '左' ? 'bg-orange-600' : log.side === '右' ? 'bg-indigo-700' : 'bg-emerald-600'}`}>
                                  {log.side}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* 右側數值區 */}
                          <div className="text-right shrink-0">
                            <span className="text-3xl font-black text-indigo-950 bg-indigo-50 px-4 py-2 rounded-2xl inline-block border-2 border-indigo-100 shadow-sm whitespace-nowrap">
                              {log.value}
                            </span>
                            <span className="block text-sm font-black text-slate-500 mt-2 uppercase tracking-widest">
                              {log.sets > 1 ? `× ${log.sets} 組` : log.unit}
                            </span>
                          </div>
                        </div>

                        {/* 備註 (如有) */}
                        {log.notes && (
                          <p className="mt-4 text-lg text-slate-600 font-medium italic bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed">
                            “{log.notes}”
                          </p>
                        )}

                        {/* 底部按鈕區 */}
                        <div className="flex justify-end gap-8 mt-4 pt-2">
                          <button onClick={() => startEditing(log)} className="text-lg font-black text-indigo-700 py-1 flex items-center gap-1 active:opacity-50">
                            ✏️ <span className="underline underline-offset-4">修改</span>
                          </button>
                          <button onClick={() => { if(window.confirm('確定刪除此項動作？')) setLogs(prev => prev.filter(l => l.id !== log.id)); }} className="text-lg font-black text-rose-600 py-1 flex items-center gap-1 active:opacity-50">
                            🗑️ <span className="underline underline-offset-4">刪除</span>
                          </button>
                        </div>
                      </div>
                    ))}
                    {group.logs.length === 0 && (
                      <div className="p-10 text-center text-slate-400 font-bold italic">
                        當天僅記錄身體狀況，無具體動作項目
                      </div>
                    )}
                  </div>
                </div>

                {/* 桌面端列表 */}
                <div className="hidden md:block overflow-x-auto">
                  {group.logs.length > 0 ? (
                    <table className="w-full text-left min-w-[800px]">
                      <tbody className="divide-y-2 divide-indigo-50">
                        {group.logs.map(log => (
                          <tr key={log.id} className="hover:bg-indigo-50/40 transition-all">
                            <td className="px-10 py-10 w-1/2">
                              <div className="text-3xl font-black text-slate-950">{log.exerciseName}</div>
                              <div className="flex gap-3 mt-3 items-center">
                                <span className="text-lg text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-lg">{log.category}</span>
                                {log.side !== 'N/A' && <span className={`px-3 py-1 rounded-full text-lg font-black text-white ${log.side === '左' ? 'bg-orange-600' : log.side === '右' ? 'bg-indigo-700' : 'bg-emerald-600'}`}>{log.side}</span>}
                              </div>
                              {log.notes && <div className="mt-4 text-xl text-slate-500 font-medium italic bg-slate-100/50 p-3 rounded-2xl">“{log.notes}”</div>}
                            </td>
                            <td className="px-10 py-10 text-center">
                              <span className="text-4xl font-black text-indigo-900 bg-white px-7 py-4 rounded-[2rem] border-2 border-indigo-50 inline-block shadow-lg whitespace-nowrap">{log.value}</span>
                              <span className="block text-lg font-black text-slate-400 mt-3 uppercase tracking-widest">{log.sets > 1 ? `× ${log.sets} 組` : log.unit}</span>
                            </td>
                            <td className="px-10 py-10 text-right">
                              <div className="flex justify-end gap-4">
                                <button onClick={() => startEditing(log)} className="p-5 bg-white border-2 border-slate-100 rounded-2xl text-indigo-600 shadow-md transition-transform active:scale-90 hover:bg-indigo-50"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                                <button onClick={() => { if(window.confirm('確定刪除？')) setLogs(prev => prev.filter(l => l.id !== log.id)); }} className="p-5 bg-white border-2 border-slate-100 rounded-2xl text-rose-500 shadow-md transition-transform active:scale-90 hover:bg-rose-50"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="py-20 text-center text-slate-400 font-bold italic text-2xl">
                      當天僅記錄身體狀況，無具體動作項目
                    </div>
                  )}
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
