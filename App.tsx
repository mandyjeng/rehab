
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { EXERCISES_API_URL, CATEGORIES } from './constants';
import { ExerciseLog, FormData, BodyPart, ExerciseDefinition } from './types';

interface ModalConfig {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: (() => void) | null;
  type: 'confirm' | 'alert';
}

const App: React.FC = () => {
  const [exercises, setExercises] = useState<ExerciseDefinition[]>([]);
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [dailyStatuses, setDailyStatuses] = useState<Record<string, string>>({}); 
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');
  const [searchTerm, setSearchTerm] = useState('');
  const [historySearchTerm, setHistorySearchTerm] = useState(''); 
  const [startDate, setStartDate] = useState(''); 
  const [endDate, setEndDate] = useState(''); 
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoadingExercises, setIsLoadingExercises] = useState(true);
  const [isWritingId, setIsWritingId] = useState<string | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [copiedDayId, setCopiedDayId] = useState<string | null>(null); 
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [modal, setModal] = useState<ModalConfig>({
    isOpen: false, title: '', message: '', onConfirm: null, type: 'alert'
  });

  const showAlert = (title: string, message: string) => {
    setModal({ isOpen: true, title, message, onConfirm: null, type: 'alert' });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setModal({ isOpen: true, title, message, onConfirm, type: 'confirm' });
  };

  const formatDateString = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    return `${y}/${m}/${d} (週${days[date.getDay()]})`;
  };

  const [formData, setFormData] = useState<FormData>({
    date: new Date().toISOString().split('T')[0],
    exerciseId: '', side: '記錄雙側', sets: 1, weight: '0', reps: '10',
    time: '', resistance: '', slope: '', speed: '', notes: ''
  });
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1TBuSUnuO3HTtG-9ZHDmDrlHGSNlEip3WUntbtWQcre8/edit?gid=0#gid=0';

  const getInitialHistoricalData = () => {
    const historicalLogs: ExerciseLog[] = [
      { id: "h1-1", date: "2026-01-20", exerciseName: "側跪姿動態髖伸蚌殼式", category: BodyPart.STARS_REHAB, side: "左", sets: 3, value: "0kg 5下", unit: "組", notes: "" },
      { id: "h1-11", date: "2026-01-20", exerciseName: "坐式腳踏車", category: BodyPart.OTHER_GYM, side: "N/A", sets: 1, value: "阻力0", unit: "分鐘", notes: "" },
      { id: "h8-1", date: "2026-01-27", exerciseName: "脛骨內轉", category: BodyPart.STARS_REHAB, side: "N/A", sets: 2, value: "10下", unit: "組", notes: "" },
    ];
    const historicalStatuses: Record<string, string> = {
      "2026-01-27": "左腳髕骨下方外側不舒服，6分",
    };
    return { historicalLogs, historicalStatuses };
  };

  useEffect(() => {
    const MAIN_LOGS_KEY = 'rehab_logs_stable';
    const MAIN_STATUS_KEY = 'rehab_statuses_stable';
    let currentLogs: ExerciseLog[] = [];
    let currentStatuses: Record<string, string> = {};
    const savedLogs = localStorage.getItem(MAIN_LOGS_KEY);
    const savedStatus = localStorage.getItem(MAIN_STATUS_KEY);
    if (savedLogs) currentLogs = JSON.parse(savedLogs);
    if (savedStatus) currentStatuses = JSON.parse(savedStatus);
    if (currentLogs.length === 0 && Object.keys(currentStatuses).length === 0) {
      const { historicalLogs, historicalStatuses } = getInitialHistoricalData();
      currentLogs = historicalLogs;
      currentStatuses = historicalStatuses;
    }
    setLogs(currentLogs);
    setDailyStatuses(currentStatuses);
  }, []);

  useEffect(() => { localStorage.setItem('rehab_logs_stable', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('rehab_statuses_stable', JSON.stringify(dailyStatuses)); }, [dailyStatuses]);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setIsLoadingExercises(true);
        const response = await fetch(EXERCISES_API_URL);
        const data = await response.json();
        setExercises(data);
      } catch (error) { console.error("無法載入動作:", error); }
      finally { setIsLoadingExercises(false); }
    };
    fetchExercises();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStatusChange = (val: string) => {
    setDailyStatuses(prev => ({ ...prev, [formData.date]: val }));
  };

  const currentExercise = useMemo(() => exercises.find(e => e.id === formData.exerciseId) || null, [formData.exerciseId, exercises]);
  const filteredExercises = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return term ? exercises.filter(ex => ex.name.toLowerCase().includes(term) || ex.category.toLowerCase().includes(term)) : exercises;
  }, [searchTerm, exercises]);
  const filteredCategories = useMemo(() => CATEGORIES.filter(cat => filteredExercises.some(ex => ex.category === cat)), [filteredExercises]);

  useEffect(() => {
    if (!editingId && currentExercise) {
      let dVal = currentExercise.defaultQuantity || '10';
      setFormData(prev => ({
        ...prev,
        side: currentExercise.isUnilateral ? '左' : 'N/A' as any,
        weight: currentExercise.category === BodyPart.LANDMINE ? '20' : '0',
        reps: (currentExercise.mode === 'REPS_ONLY' || currentExercise.mode === 'STRENGTH') ? dVal : '',
        time: (currentExercise.mode === 'TIME_ONLY' || currentExercise.mode === 'CYCLING' || currentExercise.mode === 'TREADMILL') ? dVal : '',
        sets: 1
      }));
    }
  }, [currentExercise, editingId]);

  const handleSaveLog = () => {
    if (!currentExercise) {
      if (dailyStatuses[formData.date]?.trim()) { showAlert("更新完成", "身體狀況已儲存！✅"); setActiveTab('history'); return; }
      showAlert("提示", "請先選擇復健動作！"); return;
    }
    setIsProcessing(true);
    let fVal = "";
    let isDuration = currentExercise.mode === 'CYCLING' || currentExercise.mode === 'TREADMILL';
    
    switch(currentExercise.mode) {
      case 'STRENGTH': fVal = `${formData.weight}kg ${formData.reps}${currentExercise.defaultUnit || '下'}`; break;
      case 'REPS_ONLY': fVal = `${formData.reps}${currentExercise.defaultUnit || '下'}`; break;
      case 'TIME_ONLY': fVal = `${formData.time}秒`; break;
      case 'CYCLING': fVal = `阻力${formData.resistance}`; break;
      case 'TREADMILL': fVal = `坡度${formData.slope} 速度${formData.speed}`; break;
      case 'RELAX': fVal = "已完成"; break;
    }

    const logData: ExerciseLog = {
      id: editingId || crypto.randomUUID(),
      date: formData.date, exerciseName: currentExercise.name, category: currentExercise.category,
      side: currentExercise.isUnilateral ? (formData.side === '記錄雙側' ? '雙側' : formData.side as any) : 'N/A',
      sets: isDuration ? (parseInt(formData.time) || 0) : formData.sets, 
      value: fVal, 
      unit: isDuration ? "分鐘" : "組", 
      notes: formData.notes
    };

    if (editingId) setLogs(prev => prev.map(l => l.id === editingId ? logData : l));
    else setLogs(prev => [logData, ...prev]);
    
    setEditingId(null); setActiveTab('history'); window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => { setFormData(prev => ({ ...prev, exerciseId: '', notes: '' })); setIsProcessing(false); }, 200);
  };

  const handleDeleteAll = () => {
    showConfirm('全部刪除', '確定要清空所有紀錄嗎？此動作無法復原。', () => {
      setLogs([]);
      setDailyStatuses({});
      showAlert('已清空', '所有紀錄已刪除！');
    });
  };

  const handleDeleteLog = (id: string, name: string) => {
    showConfirm('確認刪除', `確定要刪除動作「${name}」的紀錄嗎？`, () => {
      setLogs(prev => prev.filter(l => l.id !== id));
    });
  };

  const handleDeleteDay = (date: string) => {
    showConfirm('清空當日', `確定要清空 ${formatDateString(date)} 的所有紀錄嗎？`, () => {
      setLogs(prev => prev.filter(l => l.date !== date));
      setDailyStatuses(prev => {
        const next = { ...prev };
        delete next[date];
        return next;
      });
      showAlert('已清空', '當日紀錄已刪除！');
    });
  };

  const startEditing = (log: ExerciseLog) => {
    const ex = exercises.find(e => e.name === log.exerciseName);
    if (!ex) return;
    setEditingId(log.id);
    let restoredValues: any = {};
    if (ex.mode === 'CYCLING') {
      const m = log.value.match(/阻力(\d+)/);
      if (m) restoredValues.resistance = m[1];
    } else if (ex.mode === 'TREADMILL') {
      const m = log.value.match(/坡度(\d+) 速度(\d+)/);
      if (m) { restoredValues.slope = m[1]; restoredValues.speed = m[2]; }
    } else if (ex.mode === 'STRENGTH') {
      const m = log.value.match(/(\d+)kg\s+(\d+)/);
      if (m) { restoredValues.weight = m[1]; restoredValues.reps = m[2]; }
    } else if (ex.mode === 'REPS_ONLY') {
      const m = log.value.match(/(\d+)/);
      if (m) restoredValues.reps = m[1];
    }
    setFormData({ 
      ...formData, 
      ...restoredValues,
      date: log.date, 
      exerciseId: ex.id, 
      sets: log.unit === '分鐘' ? 1 : log.sets, 
      time: log.unit === '分鐘' ? log.sets.toString() : (ex.mode === 'TIME_ONLY' ? log.value.replace('秒', '') : formData.time),
      notes: log.notes, 
      side: log.side === '雙側' ? '記錄雙側' : log.side as any 
    });
    setActiveTab('form'); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const groupedLogs = useMemo(() => {
    const filterTerm = historySearchTerm.trim().toLowerCase();
    
    const filteredLogs = logs.filter(l => {
      const matchName = filterTerm ? l.exerciseName.toLowerCase().includes(filterTerm) : true;
      const matchStart = startDate ? l.date >= startDate : true;
      const matchEnd = endDate ? l.date <= endDate : true;
      return matchName && matchStart && matchEnd;
    });

    const groups: Record<string, ExerciseLog[]> = {};
    filteredLogs.forEach(l => { if (!groups[l.date]) groups[l.date] = []; groups[l.date].push(l); });
    
    const hasFilter = filterTerm || startDate || endDate;
    const allDates = hasFilter
      ? new Set(Object.keys(groups))
      : new Set([...Object.keys(groups), ...Object.keys(dailyStatuses).filter(d => dailyStatuses[d].trim() || (groups[d] && groups[d].length > 0))]);

    return Array.from(allDates).sort((a, b) => b.localeCompare(a)).map(date => ({ date, logs: groups[date] || [], status: dailyStatuses[date] || '' }));
  }, [logs, dailyStatuses, historySearchTerm, startDate, endDate]);

  const formatGroupToString = (group: {date: string, logs: ExerciseLog[], status: string}) => {
    const parts: string[] = [];
    if (group.status) parts.push(`[${group.status.trim()}]`);
    group.logs.forEach(l => {
      let entry = `${l.exerciseName}${l.side !== 'N/A' ? `【${l.side}】` : ''}: ${l.value.trim()}`;
      if (l.sets > 0) {
        if (l.unit === '分鐘') entry += ` ${l.sets}分鐘`;
        else entry += ` x${l.sets}組`;
      }
      if (l.notes) entry += ` (${l.notes.trim()})`;
      parts.push(entry);
    });
    return parts.join('｜');
  };

  const handleCopyDay = (date: string) => {
    const group = groupedLogs.find(g => g.date === date);
    if (!group) return;
    const content = formatGroupToString(group);
    const fullText = `${date},"${content}"`;
    navigator.clipboard.writeText(fullText).then(() => {
      setCopiedDayId(date);
      setTimeout(() => setCopiedDayId(null), 2000);
    });
  };

  const handleSyncAllToSheet = async () => {
    showConfirm('雲端同步', '確認從雲端「復健記錄」下載並還原所有紀錄？', async () => {
      setIsSyncingAll(true);
      try {
        const response = await fetch(`${EXERCISES_API_URL}?type=history`);
        const cloudData = await response.json();
        const newLogs: ExerciseLog[] = [];
        const newStatuses: Record<string, string> = {};
        cloudData.forEach((item: any) => {
          const date = item.date.toString().split('T')[0];
          let content = (item.content as string).trim().replace(/^"|"$/g, '');
          if (content.startsWith('[')) {
            const endIdx = content.indexOf(']');
            newStatuses[date] = content.substring(1, endIdx);
            content = content.substring(endIdx + 1).replace(/^｜/, '');
          }
          content.split('｜').filter(s => s.trim()).forEach(s => {
            const match = s.match(/^(.*?)(?:【(左|右|雙側)】)?:\s*(.*?)(?:\s+x(\d+)組|\s+(\d+)分鐘)?(?:\s+\((.*?)\))?\s*"?$/);
            if (match) {
              const setsVal = match[4] ? parseInt(match[4]) : (match[5] ? parseInt(match[5]) : 0);
              const unitVal = match[5] ? "分鐘" : "組";
              newLogs.push({
                id: crypto.randomUUID(), date, exerciseName: match[1].trim(), side: (match[2] || 'N/A') as any,
                value: match[3].trim(), sets: setsVal, notes: match[6] || "",
                category: exercises.find(e => e.name === match[1].trim())?.category || "其他", unit: unitVal
              });
            }
          });
        });
        setLogs(newLogs); setDailyStatuses(newStatuses);
        showAlert("同步成功", "紀錄已還原！✅");
      } catch (e) { showAlert("同步失敗", "無法連結雲端。"); }
      finally { setIsSyncingAll(false); }
    });
  };

  const handleWriteToSheet = async (targetDate: string) => {
    const group = groupedLogs.find(g => g.date === targetDate);
    if (!group) return;
    const cleanDate = targetDate.trim().split(' ')[0];
    showConfirm('上傳雲端', `將 ${cleanDate} 紀錄傳送到雲端？\n(若已有資料將自動覆蓋該日紀錄)`, async () => {
      setIsWritingId(targetDate);
      try {
        const content = formatGroupToString(group);
        await fetch(EXERCISES_API_URL, { 
          method: 'POST', 
          mode: 'no-cors', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: cleanDate, content: content }) 
        });
        showAlert("發送完成", "資料已發送！✅");
      } catch (e) { showAlert("上傳失敗", "連線異常，請檢查網路。"); }
      finally { setIsWritingId(null); }
    });
  };

  const handleCopyToClipboard = () => {
    const text = groupedLogs.map(g => `${g.date},"${formatGroupToString(g)}"`).join('\n');
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <div className="pb-32 px-4 max-w-7xl mx-auto flex flex-col items-center font-['Noto_Sans_TC'] select-none">
      {modal.isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md rounded-[2.5rem] p-8 md:p-10 shadow-2xl border-2 border-indigo-50">
            <h3 className="text-2xl md:text-3xl font-black text-slate-950 mb-4">{modal.title}</h3>
            <p className="text-lg md:text-xl text-slate-600 font-bold leading-relaxed mb-10 whitespace-pre-wrap">{modal.message}</p>
            <div className="flex gap-4">
              {modal.type === 'confirm' && <button onClick={() => setModal({ ...modal, isOpen: false })} className="flex-1 py-5 rounded-2xl font-black text-slate-500 bg-slate-100 text-lg">取消</button>}
              <button onClick={() => { modal.onConfirm?.(); setModal({ ...modal, isOpen: false }); }} className={`flex-1 py-5 rounded-2xl font-black text-white text-lg ${modal.type === 'confirm' ? 'bg-indigo-700' : 'bg-slate-950'}`}>確定</button>
            </div>
          </div>
        </div>
      )}

      <header className="py-8 md:py-12 text-center w-full transition-all flex flex-col items-center overflow-hidden">
        <div className="inline-block p-1 md:p-4 rounded-[2.5rem] md:rounded-[4rem] bg-white shadow-2xl mb-6 md:mb-8 border-4 border-indigo-600 ring-8 ring-indigo-50 overflow-hidden">
          <img src="https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=2069&auto=format&fit=crop" alt="Workout" className="w-24 h-24 md:w-48 md:h-48 object-cover rounded-[2rem]"/>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-slate-950 break-words w-full">RehabFlow <span className="text-indigo-700">Smart</span></h1>
        <p className="mt-2 text-slate-900 font-black tracking-widest uppercase text-sm sm:text-base">mm復健日記</p>
      </header>

      <div className="sticky top-2 z-50 bg-white/95 backdrop-blur-lg p-1.5 rounded-full shadow-2xl border border-indigo-100 mb-8 flex w-full max-sm mx-auto md:hidden ring-4 ring-indigo-50">
        <button onClick={() => { setActiveTab('form'); window.scrollTo({ top: 0 }); }} className={`flex-1 py-3.5 rounded-full font-black text-base transition-all ${activeTab === 'form' ? 'bg-indigo-700 text-white shadow-lg' : 'text-slate-600'}`}>⚡ 紀錄動作</button>
        <button onClick={() => { setActiveTab('history'); window.scrollTo({ top: 0 }); }} className={`flex-1 py-3.5 rounded-full font-black text-base transition-all ${activeTab === 'history' ? 'bg-indigo-700 text-white shadow-lg' : 'text-slate-600'}`}>📅 歷史紀錄</button>
      </div>

      <div className="flex flex-col gap-8 w-full max-w-4xl">
        <div className={`${activeTab === 'form' ? 'block' : 'hidden md:block'} space-y-8`}>
          <div className="glass-card rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-10 border-b-4 border-emerald-600 shadow-xl">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
              <div className="w-full md:w-1/3">
                <label className="text-base md:text-lg font-black text-emerald-900 mb-2 md:mb-3 block uppercase tracking-widest">📅 日期</label>
                <input type="date" className="w-full px-4 py-4 md:py-5 rounded-2xl bg-white border-2 border-emerald-100 font-black text-slate-950 shadow-sm text-lg md:text-xl" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
              </div>
              <div className="w-full md:w-2/3">
                <label className="text-base md:text-lg font-black text-emerald-900 mb-2 md:mb-3 block uppercase tracking-widest">🧠 今日身體狀況</label>
                <textarea placeholder="今天的體感..." className="w-full px-4 py-4 md:py-5 rounded-2xl bg-white border-2 border-emerald-100 font-bold text-slate-800 shadow-sm h-24 resize-none text-lg md:text-xl" value={dailyStatuses[formData.date] || ''} onChange={e => handleStatusChange(e.target.value)} />
              </div>
            </div>
          </div>

          <div className={`glass-card rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-10 border-b-4 transition-all duration-300 ${editingId ? 'border-orange-500 ring-4 ring-orange-50' : 'border-indigo-800 shadow-indigo-300/40'}`}>
            <h2 className="text-2xl md:text-3xl font-black text-slate-950 mb-6 md:mb-8 flex items-center">
              <span className={`w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-2xl mr-3 md:mr-4 text-xl md:text-2xl text-white ${editingId ? 'bg-orange-500' : 'bg-indigo-800'}`}>{editingId ? '✏️' : '⚡'}</span>
              {editingId ? '修改動作內容' : `新增紀錄`}
            </h2>
            <div className="space-y-6 md:space-y-8">
              <section className="space-y-3 md:space-y-4">
                <label className="text-base md:text-lg font-black text-slate-950 mb-2 md:mb-3 block uppercase tracking-widest">🎯 選擇復健動作</label>
                <div className="relative" ref={dropdownRef}>
                  <button type="button" onClick={() => !isLoadingExercises && setIsDropdownOpen(!isDropdownOpen)} className="w-full px-5 py-4 md:py-5 rounded-2xl bg-white border-2 border-slate-100 font-black text-slate-950 shadow-sm text-lg md:text-xl flex justify-between items-center transition-all">
                    <span className={`truncate ${currentExercise ? "text-slate-950" : "text-slate-400"}`}>{isLoadingExercises ? '載入中...' : (currentExercise ? currentExercise.name : '── 請選擇動作 ──')}</span>
                    {isLoadingExercises ? <div className="w-6 h-6 border-4 border-indigo-200 border-t-indigo-700 rounded-full animate-spin shrink-0"></div> : <svg className={`w-6 h-6 shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="3" strokeLinecap="round"/></svg>}
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute z-[100] w-full mt-2 bg-white rounded-3xl shadow-2xl border-2 border-indigo-50 overflow-hidden">
                      <div className="p-4 border-b border-slate-100 sticky top-0 bg-white">
                        <input type="text" placeholder="搜尋動作..." className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border-2 border-slate-100 font-bold" value={searchTerm} autoFocus onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => e.stopPropagation()}/>
                      </div>
                      <div className="max-h-[300px] md:max-h-[400px] overflow-y-auto overscroll-contain">
                        {filteredCategories.map(cat => (
                          <div key={cat}>
                            <div className="px-5 py-2.5 bg-slate-100/50 text-slate-500 font-black text-xs uppercase sticky top-0 z-10">{cat}</div>
                            {filteredExercises.filter(ex => ex.category === cat).map(ex => (
                              <button key={ex.id} type="button" className={`w-full text-left px-6 md:px-8 py-4 hover:bg-indigo-50 font-bold text-lg border-b last:border-0 ${formData.exerciseId === ex.id ? 'bg-indigo-50 text-indigo-800' : 'text-slate-800'}`} onClick={() => { setFormData({ ...formData, exerciseId: ex.id }); setIsDropdownOpen(false); setSearchTerm(''); }}>{ex.name}</button>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <div className={`p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-2 space-y-6 md:space-y-8 bg-indigo-50/50 border-indigo-100`}>
                {currentExercise?.isUnilateral && (
                  <section>
                    <label className="text-base md:text-lg font-black text-slate-950 mb-3 md:mb-4 block text-center">執行側邊</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['左', '右', '記錄雙側'].map(s => <button key={s} type="button" onClick={() => setFormData({ ...formData, side: s as any })} className={`py-4 md:py-5 rounded-2xl font-black text-base md:text-lg transition-all ${formData.side === s ? 'bg-indigo-700 text-white shadow-md' : 'bg-white text-slate-700'}`}>{s}</button>)}
                    </div>
                  </section>
                )}
                {currentExercise && (
                  <div className={`grid ${currentExercise.mode === 'TREADMILL' ? 'grid-cols-3' : 'grid-cols-2'} gap-4 md:gap-6`}>
                    {(currentExercise.mode === 'STRENGTH' || currentExercise.mode === 'CYCLING' || currentExercise.mode === 'TREADMILL') && (
                      <section>
                        <label className="text-sm md:text-lg font-black text-slate-950 mb-2 md:mb-3 block text-center truncate">{currentExercise.mode === 'CYCLING' ? '阻力' : currentExercise.mode === 'TREADMILL' ? '坡度' : '負重(kg)'}</label>
                        <input type="text" inputMode="decimal" className="w-full px-2 py-4 md:py-6 rounded-2xl bg-white border-2 border-indigo-200 font-black text-slate-950 text-2xl md:text-3xl text-center" value={currentExercise.mode === 'CYCLING' ? formData.resistance : currentExercise.mode === 'TREADMILL' ? formData.slope : formData.weight} onChange={e => setFormData({ ...formData, [currentExercise.mode === 'CYCLING' ? 'resistance' : (currentExercise.mode === 'TREADMILL' ? 'slope' : 'weight')]: e.target.value })} />
                      </section>
                    )}
                    {currentExercise.mode === 'TREADMILL' && (
                      <section>
                        <label className="text-sm md:text-lg font-black text-slate-950 mb-2 md:mb-3 block text-center">速度</label>
                        <input type="text" inputMode="decimal" className="w-full px-2 py-4 md:py-6 rounded-2xl bg-white border-2 border-indigo-200 font-black text-slate-950 text-2xl md:text-3xl text-center" value={formData.speed} onChange={e => setFormData({ ...formData, speed: e.target.value })} />
                      </section>
                    )}
                    {currentExercise.mode !== 'RELAX' && (
                      <section className={currentExercise.mode === 'REPS_ONLY' || currentExercise.mode === 'TIME_ONLY' ? 'col-span-2' : ''}>
                        <label className="text-sm md:text-lg font-black text-slate-950 mb-2 md:mb-3 block text-center">{currentExercise.mode.includes('TIME') || currentExercise.mode === 'CYCLING' || currentExercise.mode === 'TREADMILL' ? '時間' : '次數'}</label>
                        <input type="text" inputMode="numeric" className="w-full px-2 py-4 md:py-6 rounded-2xl bg-white border-2 border-indigo-200 font-black text-slate-950 text-2xl md:text-3xl text-center" value={currentExercise.mode.includes('TIME') || currentExercise.mode === 'CYCLING' || currentExercise.mode === 'TREADMILL' ? formData.time : formData.reps} onChange={e => setFormData({ ...formData, [currentExercise.mode.includes('TIME') || currentExercise.mode === 'CYCLING' || currentExercise.mode === 'TREADMILL' ? 'time' : 'reps']: e.target.value })} />
                      </section>
                    )}
                  </div>
                )}
                {currentExercise && !['RELAX', 'CYCLING', 'TREADMILL'].includes(currentExercise.mode) && (
                  <section>
                    <label className="text-base md:text-lg font-black text-slate-950 mb-3 md:mb-4 block text-center">總組數</label>
                    <div className="flex items-center justify-center space-x-6 md:space-x-12">
                      <button type="button" onClick={() => setFormData({...formData, sets: Math.max(1, formData.sets - 1)})} className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-2xl border-4 text-slate-950 font-black text-2xl shadow-md">-</button>
                      <span className="text-3xl md:text-5xl font-black text-indigo-800 w-12 md:w-16 text-center">{formData.sets}</span>
                      <button type="button" onClick={() => setFormData({...formData, sets: formData.sets + 1})} className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-2xl border-4 text-slate-950 font-black text-2xl shadow-md">+</button>
                    </div>
                  </section>
                )}
              </div>

              <section>
                <label className="text-base md:text-lg font-black text-slate-950 mb-2 md:mb-3 block uppercase tracking-widest">📔 動作備註</label>
                <textarea placeholder="體感備註..." className="w-full px-5 py-4 rounded-2xl bg-white border-2 border-slate-100 h-24 font-bold text-slate-950 shadow-inner resize-none text-lg" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
              </section>

              <button type="button" onClick={handleSaveLog} disabled={isProcessing || isLoadingExercises} className={`w-full py-5 md:py-7 rounded-[2rem] md:rounded-[2.5rem] font-black text-white shadow-2xl transition-all transform active:scale-95 text-xl md:text-2xl ${isProcessing ? 'bg-slate-400' : 'bg-gradient-to-br from-indigo-800 to-slate-950'}`}>
                {isProcessing ? '處理中...' : editingId ? '💾 儲存修改' : '🎯 確定新增紀錄'}
              </button>
            </div>
          </div>

          <div className="glass-card rounded-[2rem] p-6 border-b-4 border-slate-300 flex flex-col sm:flex-row items-center gap-5">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-inner">⚙️</div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-xl font-black text-slate-950 mb-1">雲端資料庫管理</h3>
              <p className="text-slate-500 font-bold text-sm">可在 Google Sheets 修改動作與分類。</p>
            </div>
            <a href={GOOGLE_SHEET_URL} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto px-6 py-4 bg-white border-2 border-slate-200 hover:text-indigo-700 rounded-2xl font-black text-slate-700 shadow-sm text-center">📊 開啟後端 Sheet</a>
          </div>
        </div>

        <div className={`${activeTab === 'history' ? 'block' : 'hidden md:block'} w-full space-y-10`}>
          <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-5 px-1">
            <h2 className="text-3xl md:text-4xl font-black text-slate-950 self-start">歷史復健日誌</h2>
            <div className="flex flex-row gap-4 w-full md:w-auto justify-center">
              <div className="group relative">
                <button type="button" onClick={handleDeleteAll} className="w-16 h-16 flex items-center justify-center rounded-2xl font-black bg-white text-rose-600 border-2 border-rose-100 shadow-sm transition-all hover:bg-rose-50 active:scale-95">
                  <span className="text-3xl transition-transform group-hover:scale-110">🗑️</span>
                </button>
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">清空紀錄</span>
              </div>
              <div className="group relative">
                <button type="button" onClick={handleSyncAllToSheet} disabled={isSyncingAll} className={`w-16 h-16 flex items-center justify-center rounded-2xl font-black shadow-md transition-all active:scale-95 ${isSyncingAll ? 'bg-slate-300 text-slate-500 animate-pulse' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'}`}>
                  <span className={`text-3xl transition-transform ${!isSyncingAll ? 'group-hover:rotate-180' : ''}`}>{isSyncingAll ? '⏳' : '🔄'}</span>
                </button>
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">雲端還原</span>
              </div>
              <div className="group relative">
                <button type="button" onClick={handleCopyToClipboard} className={`w-16 h-16 flex items-center justify-center rounded-2xl font-black shadow-md transition-all active:scale-95 ${copied ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-slate-950 text-white hover:bg-slate-800 shadow-slate-300'}`}>
                  <span className="text-3xl transition-transform group-hover:translate-y-[-2px]">{copied ? '✅' : '📋'}</span>
                </button>
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">{copied ? '已複製！' : '複製全部'}</span>
              </div>
            </div>
          </div>

          {/* 修正後的過濾器排版：移除重疊，改用上方小標籤 */}
          <div className="glass-card rounded-3xl p-5 md:p-6 space-y-4 shadow-inner border border-slate-100">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-2">
                <label className="text-xs font-black text-slate-400 ml-1 flex items-center gap-1">🔍 動作關鍵字</label>
                <input 
                  type="text" 
                  placeholder="輸入動作搜尋..." 
                  className="w-full px-5 py-3.5 rounded-2xl bg-white/80 border border-slate-200 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-base"
                  value={historySearchTerm}
                  onChange={(e) => setHistorySearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex flex-row items-end gap-3 shrink-0">
                <div className="space-y-2 flex-1 md:w-36">
                  <label className="text-[10px] font-black text-slate-400 ml-1">📅 開始日期</label>
                  <input 
                    type="date" 
                    className="w-full px-3 py-3 rounded-2xl bg-white/80 border border-slate-200 font-bold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <span className="text-slate-300 font-black mb-4">─</span>
                <div className="space-y-2 flex-1 md:w-36">
                  <label className="text-[10px] font-black text-slate-400 ml-1">📅 結束日期</label>
                  <input 
                    type="date" 
                    className="w-full px-3 py-3 rounded-2xl bg-white/80 border border-slate-200 font-bold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                {(historySearchTerm || startDate || endDate) && (
                  <button 
                    onClick={() => { setHistorySearchTerm(''); setStartDate(''); setEndDate(''); }}
                    className="w-11 h-11 flex items-center justify-center bg-slate-100 text-slate-400 rounded-full hover:bg-rose-50 hover:text-rose-400 transition-all active:scale-90 mb-0.5"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8 md:space-y-10">
            {groupedLogs.length > 0 ? (
              groupedLogs.map(group => (
                <div key={group.date} className="glass-card rounded-[2.5rem] md:rounded-[3rem] overflow-hidden border-2 border-white shadow-2xl bg-white/80">
                  <div className="bg-indigo-50/50 p-5 md:p-8 border-b-2 border-indigo-100 relative">
                    <div className="absolute left-0 top-0 bottom-0 w-3 md:w-4 bg-indigo-600"></div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-600 rounded-xl flex items-center justify-center text-xl md:text-2xl shadow-lg shrink-0">📅</div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-xl sm:text-2xl md:text-4xl font-black text-indigo-950 truncate">{formatDateString(group.date)}</span>
                          <span className="text-xs md:text-sm font-bold text-indigo-700/60 uppercase tracking-widest">{group.logs.length} 個動作</span>
                        </div>
                      </div>
                      <div className="flex gap-1.5 md:gap-2 shrink-0">
                        <button onClick={() => handleWriteToSheet(group.date)} disabled={isWritingId === group.date} className={`w-10 h-10 md:w-13 md:h-13 flex items-center justify-center bg-white text-emerald-600 rounded-xl border border-emerald-100 shadow-sm transition-all active:scale-90 ${isWritingId === group.date ? 'animate-pulse' : ''}`}>{isWritingId === group.date ? '⏳' : '📤'}</button>
                        <button onClick={() => handleCopyDay(group.date)} className={`w-10 h-10 md:w-13 md:h-13 flex items-center justify-center bg-white rounded-xl border shadow-sm transition-all active:scale-90 ${copiedDayId === group.date ? 'text-emerald-600 border-emerald-300' : 'text-indigo-600 border-indigo-100'}`}>{copiedDayId === group.date ? '✅' : '📋'}</button>
                        <button onClick={() => handleDeleteDay(group.date)} className="w-10 h-10 md:w-13 md:h-13 flex items-center justify-center bg-white text-rose-500 rounded-xl border border-rose-100 shadow-sm transition-all active:scale-90 hover:bg-rose-50">🗑️</button>
                      </div>
                    </div>
                    <textarea 
                      className="mt-4 md:mt-6 w-full p-4 bg-white/60 border border-indigo-100 rounded-2xl shadow-inner text-base md:text-lg font-bold text-slate-700 italic resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all placeholder:text-slate-400 block"
                      placeholder="無今日紀錄..."
                      value={dailyStatuses[group.date] || ''}
                      rows={2}
                      onChange={(e) => setDailyStatuses(prev => ({ ...prev, [group.date]: e.target.value }))}
                    />
                  </div>
                  <div className="divide-y divide-slate-100 bg-white">
                    {group.logs.map(l => (
                      <div key={l.id} className="p-4 md:p-8 hover:bg-slate-50/40 transition-all flex flex-row items-center justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl md:text-3xl font-black text-slate-950 leading-tight truncate">{l.exerciseName}</h3>
                            {l.side !== 'N/A' && (
                              <span className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full text-xs md:text-sm font-black text-white shadow-lg bg-[#f0641e] shrink-0">{l.side === '雙側' ? '雙' : l.side}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] md:text-xs font-bold text-indigo-600 bg-indigo-50 px-2 md:px-3 py-1 rounded-lg border border-indigo-100 whitespace-nowrap">{l.category}</span>
                          </div>
                          {l.notes && (
                            <div className="hidden sm:block mt-1 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                              <p className="text-xs md:text-sm font-bold text-slate-400 italic truncate">“{l.notes}”</p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-row items-center gap-3 md:gap-6 shrink-0">
                          <div className="flex flex-col items-center">
                            <div className="bg-white px-3 md:px-6 py-2 md:py-3 rounded-[1.2rem] md:rounded-[2rem] border-2 border-slate-50 shadow-lg shadow-slate-200/30 flex items-center justify-center min-w-[5rem] md:min-w-[7rem]">
                              <span className="text-sm md:text-2xl font-black text-slate-800 tracking-tight whitespace-nowrap">{l.value}</span>
                            </div>
                            <span className="mt-1 text-[10px] md:text-sm font-bold text-slate-400 whitespace-nowrap italic">{l.unit === '分鐘' ? `${l.sets}分鐘` : `× ${l.sets} 組`}</span>
                          </div>
                          <div className="flex flex-row gap-1.5 md:gap-2">
                            <button onClick={() => startEditing(l)} className="w-10 h-10 md:w-14 md:h-14 flex items-center justify-center bg-white text-indigo-600 rounded-xl md:rounded-2xl border border-indigo-50 shadow-md hover:bg-indigo-50 active:scale-90 transition-all">
                              <svg className="w-5 h-5 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                            </button>
                            <button onClick={() => handleDeleteLog(l.id, l.exerciseName)} className="w-10 h-10 md:w-14 md:h-14 flex items-center justify-center bg-white text-rose-500 rounded-xl md:rounded-2xl border border-rose-50 shadow-md hover:bg-rose-50 active:scale-90 transition-all">
                              <svg className="w-5 h-5 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-slate-50/50 rounded-[3rem] border-4 border-dashed border-slate-100">
                <span className="text-6xl block mb-4">🔍</span>
                <h3 className="text-2xl font-black text-slate-300">找不到符合條件的復健紀錄</h3>
                <button onClick={() => { setHistorySearchTerm(''); setStartDate(''); setEndDate(''); }} className="mt-4 text-indigo-500 font-bold underline">重設搜尋條件</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
