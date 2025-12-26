
import React, { useState, useEffect, useMemo } from 'react';
import { EXERCISES, CATEGORIES, UNITS } from './constants';
import { ExerciseLog, FormData, BodyPart } from './types';

const App: React.FC = () => {
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [formData, setFormData] = useState<FormData>({
    date: new Date().toISOString().split('T')[0],
    exerciseId: EXERCISES[0].id,
    side: '雙側',
    sets: 3,
    value: '10',
    unit: '下',
    notes: ''
  });
  const [copied, setCopied] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const savedLogs = localStorage.getItem('rehab_logs_master_v3');
    if (savedLogs) setLogs(JSON.parse(savedLogs));
  }, []);

  useEffect(() => {
    localStorage.setItem('rehab_logs_master_v3', JSON.stringify(logs));
  }, [logs]);

  const currentExercise = useMemo(() => 
    EXERCISES.find(e => e.id === formData.exerciseId) || EXERCISES[0]
  , [formData.exerciseId]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      unit: currentExercise.defaultUnit,
      side: currentExercise.isUnilateral ? '左' : '雙側'
    }));
  }, [currentExercise]);

  const handleAddLog = () => {
    if (!formData.value) return alert('請輸入運動數值喔！🍬');
    
    setIsAdding(true);
    const newLog: ExerciseLog = {
      id: crypto.randomUUID(),
      date: formData.date,
      exerciseName: currentExercise.name,
      category: currentExercise.category,
      side: currentExercise.isUnilateral ? formData.side : 'N/A' as any,
      sets: formData.sets,
      value: formData.value,
      unit: formData.unit,
      notes: formData.notes
    };
    
    setTimeout(() => {
      setLogs([newLog, ...logs]);
      setFormData(prev => ({ ...prev, value: '', notes: '' }));
      setIsAdding(false);
    }, 200);
  };

  const handleClearLogs = () => {
    if (confirm('確定要清空所有紀錄嗎？🥺')) setLogs([]);
  };

  const handleDeleteLog = (id: string) => {
    setLogs(logs.filter(l => l.id !== id));
  };

  const handleCopyToClipboard = () => {
    if (logs.length === 0) return;
    const header = "日期\t分類\t動作項目\t側邊\t組數\t數值\t單位\t備註";
    const rows = logs.map(l => 
      `${l.date}\t${l.category}\t${l.exerciseName}\t${l.side}\t${l.sets}\t${l.value}\t${l.unit}\t${l.notes}`
    );
    const text = [header, ...rows].join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="pb-32 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <header className="py-12 text-center relative">
        <div className="inline-block p-5 rounded-[2rem] bg-white shadow-2xl mb-6 border-2 border-indigo-100 transform hover:scale-110 transition-transform cursor-pointer">
          <span className="text-5xl">🏋️‍♂️</span>
        </div>
        <h1 className="text-5xl font-black text-slate-900 tracking-tight">
          RehabFlow <span className="text-indigo-600">Pro</span>
        </h1>
        <p className="mt-3 text-slate-700 font-bold tracking-[0.15em] text-sm uppercase">專業復健進度管理</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left Form: 輸入區 */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card rounded-[2.5rem] p-8 border-b-8 border-indigo-600 shadow-2xl shadow-indigo-200/40">
            <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center">
              <span className="w-12 h-12 flex items-center justify-center bg-indigo-600 text-white rounded-2xl mr-4 shadow-lg text-xl">📝</span>
              記錄運動
            </h2>

            <div className="space-y-6">
              {/* Date */}
              <section>
                <label className="text-xs font-black text-slate-900 uppercase ml-2 mb-2 block tracking-widest">練習日期</label>
                <input 
                  type="date" 
                  className="w-full px-5 py-4 rounded-3xl bg-white border-2 border-slate-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition-all shadow-sm font-bold text-slate-900"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                />
              </section>

              {/* Exercise Selector */}
              <section>
                <label className="text-xs font-black text-slate-900 uppercase ml-2 mb-2 block tracking-widest">選擇動作項目 (我的清單)</label>
                <select 
                  className="w-full px-5 py-4 rounded-3xl bg-white border-2 border-slate-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition-all shadow-sm font-bold text-slate-900 appearance-none"
                  value={formData.exerciseId}
                  onChange={e => setFormData({ ...formData, exerciseId: e.target.value })}
                >
                  {CATEGORIES.map(cat => (
                    <optgroup label={cat} key={cat} className="text-slate-900 font-black bg-slate-100">
                      {EXERCISES.filter(ex => ex.category === cat).map(ex => (
                        <option value={ex.id} key={ex.id} className="text-slate-800 font-medium bg-white">{ex.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </section>

              {/* Unilateral Side */}
              {currentExercise.isUnilateral && (
                <section>
                  <label className="text-xs font-black text-slate-900 uppercase ml-2 mb-2 block tracking-widest">執行側邊</label>
                  <div className="grid grid-cols-3 gap-3 p-2 bg-slate-100 rounded-[1.8rem] shadow-inner">
                    {['左', '右', '雙側'].map(side => (
                      <button
                        key={side}
                        onClick={() => setFormData({ ...formData, side: side as any })}
                        className={`py-3.5 rounded-2xl text-sm font-black transition-all ${
                          formData.side === side 
                            ? 'bg-indigo-600 text-white shadow-xl transform scale-105' 
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                        }`}
                      >
                        {side}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <div className="grid grid-cols-2 gap-4">
                <section>
                  <label className="text-xs font-black text-slate-900 uppercase ml-2 mb-2 block tracking-widest">組數 (Sets)</label>
                  <input 
                    type="number" 
                    className="w-full px-5 py-4 rounded-3xl bg-white border-2 border-slate-200 focus:border-indigo-600 outline-none shadow-sm font-bold text-slate-900"
                    value={formData.sets}
                    onChange={e => setFormData({ ...formData, sets: parseInt(e.target.value) || 0 })}
                  />
                </section>
                <section>
                  <label className="text-xs font-black text-slate-900 uppercase ml-2 mb-2 block tracking-widest">單位</label>
                  <select 
                    className="w-full px-5 py-4 rounded-3xl bg-white border-2 border-slate-200 focus:border-indigo-600 outline-none shadow-sm font-bold text-slate-900"
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </section>
              </div>

              <section>
                <label className="text-xs font-black text-slate-900 uppercase ml-2 mb-2 block tracking-widest">數據值 (重量/次數/時間)</label>
                <input 
                  type="text" 
                  placeholder="例如: 25 或 180度"
                  className="w-full px-5 py-4 rounded-3xl bg-indigo-50 border-2 border-indigo-200 focus:border-indigo-600 focus:bg-white outline-none shadow-md font-black text-indigo-900 text-2xl"
                  value={formData.value}
                  onChange={e => setFormData({ ...formData, value: e.target.value })}
                />
              </section>

              <section>
                <label className="text-xs font-black text-slate-900 uppercase ml-2 mb-2 block tracking-widest">日誌備註</label>
                <textarea 
                  className="w-full px-5 py-4 rounded-3xl bg-white border-2 border-slate-200 focus:border-indigo-600 outline-none shadow-sm h-28 resize-none text-base font-bold text-slate-800"
                  placeholder="今天的體感如何？疼痛感？"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                />
              </section>

              <button 
                onClick={handleAddLog}
                disabled={isAdding}
                className={`w-full py-5 rounded-[2rem] font-black text-white shadow-2xl transition-all transform active:scale-95 flex items-center justify-center space-x-3 text-xl ${
                  isAdding ? 'bg-slate-500' : 'bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-900 hover:shadow-indigo-300 hover:scale-[1.02]'
                }`}
              >
                {isAdding ? <span className="animate-spin text-3xl">⚙️</span> : <span>🚀 確定新增這筆</span>}
              </button>
            </div>
          </div>
        </div>

        {/* Right List: 日誌區 */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-4">
            <div>
              <h2 className="text-3xl font-black text-slate-900 flex items-center">
                運動日誌 <span className="ml-4 px-4 py-1.5 bg-indigo-600 rounded-full text-[10px] text-white font-black uppercase tracking-widest shadow-lg">History</span>
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleClearLogs}
                className="px-5 py-3 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-2xl transition-all font-black text-sm flex items-center"
              >
                🗑️ 全部清除
              </button>
              <button 
                onClick={handleCopyToClipboard}
                disabled={logs.length === 0}
                className={`px-10 py-4 rounded-3xl font-black transition-all shadow-2xl flex items-center space-x-3 text-base ${
                  logs.length === 0 
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed shadow-none' 
                  : copied ? 'bg-emerald-600 text-white' : 'bg-white text-indigo-900 border-4 border-indigo-100 hover:bg-indigo-50 active:scale-95'
                }`}
              >
                {copied ? <span>✅ 已複製</span> : <span>📋 複製貼入 Excel</span>}
              </button>
            </div>
          </div>

          <div className="glass-card rounded-[3.5rem] overflow-hidden border-4 border-white shadow-2xl shadow-slate-300/40">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[850px]">
                <thead>
                  <tr className="bg-slate-900/5">
                    <th className="px-8 py-7 text-xs font-black text-slate-900 uppercase tracking-widest border-r border-white/40">日期資訊</th>
                    <th className="px-8 py-7 text-xs font-black text-slate-900 uppercase tracking-widest border-r border-white/40">動作項目</th>
                    <th className="px-8 py-7 text-xs font-black text-slate-900 uppercase tracking-widest text-center border-r border-white/40">側邊</th>
                    <th className="px-8 py-7 text-xs font-black text-slate-900 uppercase tracking-widest text-center border-r border-white/40">表現成果</th>
                    <th className="px-8 py-7 text-xs font-black text-slate-900 uppercase tracking-widest text-right">管理</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-white">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-56 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-9xl mb-8 grayscale opacity-40">🦋</span>
                          <p className="text-2xl font-black text-slate-800">今天休息日嗎？動一動更好喔！</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    logs.map((log, index) => (
                      <tr 
                        key={log.id} 
                        className="hover:bg-white transition-all group animate-fadeIn"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <td className="px-8 py-9 border-r border-white/20">
                          <span className="text-[10px] font-black text-indigo-700 block mb-1 uppercase tracking-tighter bg-indigo-50 px-2 py-0.5 rounded w-fit">{log.category.split(' ')[0]}</span>
                          <span className="text-base font-black text-slate-900">{log.date}</span>
                        </td>
                        <td className="px-8 py-9 border-r border-white/20">
                          <div className="text-lg font-black text-slate-900">{log.exerciseName}</div>
                          {log.notes && <div className="text-sm text-slate-800 font-bold mt-2 italic bg-amber-50 px-3 py-2 rounded-xl border-l-4 border-amber-300 line-clamp-2">「{log.notes}」</div>}
                        </td>
                        <td className="px-8 py-9 text-center border-r border-white/20">
                          <span className={`px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-md ${
                            log.side === '左' ? 'bg-orange-600 text-white' : 
                            log.side === '右' ? 'bg-purple-600 text-white' : 
                            log.side === '雙側' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-800'
                          }`}>
                            {log.side}
                          </span>
                        </td>
                        <td className="px-8 py-9 text-center border-r border-white/20">
                          <div className="flex flex-col items-center">
                            <span className="text-3xl font-black text-indigo-700 leading-none">
                              {log.value} <span className="text-xs text-indigo-900 uppercase ml-1 font-black">{log.unit}</span>
                            </span>
                            <span className="text-[10px] font-black text-slate-800 mt-3 uppercase tracking-[0.4em] bg-slate-100 px-3 py-1 rounded-full">{log.sets} 組 (Sets)</span>
                          </div>
                        </td>
                        <td className="px-8 py-9 text-right">
                          <button 
                            onClick={() => handleDeleteLog(log.id)}
                            className="p-4 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-3xl transition-all opacity-0 group-hover:opacity-100 transform hover:scale-125 active:scale-90"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-900 p-10 rounded-[3.5rem] shadow-2xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-10 text-9xl">💡</div>
            <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-4xl shadow-2xl flex-shrink-0 animate-bounce">✨</div>
            <div className="relative z-10 text-center md:text-left">
              <h4 className="font-black text-white text-xl mb-3">同步至 Google Sheets 的小技巧</h4>
              <p className="text-slate-300 text-base font-bold leading-relaxed">
                點擊上方複製按鈕後，打開您的 Excel 第一格按下 <kbd className="bg-slate-800 px-2 py-1 rounded text-white border border-slate-700 text-sm font-black mx-1">Ctrl + V</kbd>。<br/>
                系統會自動按照：<span className="text-indigo-400">日期、分類、名稱、側邊、組數、數值、單位、備註</span> 的順序幫您填好 8 個格子！
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          height: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.4);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
          border: 2px solid white;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default App;
