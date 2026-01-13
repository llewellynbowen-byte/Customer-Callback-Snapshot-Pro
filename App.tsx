
import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Upload, 
  Play, 
  ShieldCheck, 
  ChevronRight, 
  Trash2,
  Loader2,
  MessageSquare,
  BarChart3,
  Search,
  CheckCircle2,
  AlertTriangle,
  History,
  LayoutDashboard
} from 'lucide-react';
import { TranscriptEntry, AuditStatus } from './types';
import { analyzeTranscript } from './services/geminiService';
import AuditCard from './components/AuditCard';

const App: React.FC = () => {
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [selectedResult, setSelectedResult] = useState<TranscriptEntry | null>(null);
  const [inputText, setInputText] = useState("");
  const [activeTab, setActiveTab] = useState<'input' | 'results'>('input');
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Auto-scroll to top when changing views
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab, selectedResult]);

  const handleAddText = useCallback(() => {
    if (!inputText.trim()) return;
    const newEntry: TranscriptEntry = {
      id: crypto.randomUUID(),
      name: `Pasted Transcript ${transcripts.length + 1}`,
      content: inputText,
      status: 'pending',
      result: null,
      timestamp: Date.now()
    };
    setTranscripts(prev => [newEntry, ...prev]);
    setInputText("");
  }, [inputText, transcripts.length]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Fix: Explicitly type files as File[] to resolve 'unknown' type errors reported on line 58 and 66
    const files = Array.from(e.target.files || []) as File[];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const newEntry: TranscriptEntry = {
          id: crypto.randomUUID(),
          name: file.name,
          content: content,
          status: 'pending',
          result: null,
          timestamp: Date.now()
        };
        setTranscripts(prev => [newEntry, ...prev]);
      };
      reader.readAsText(file);
    });
    // Reset input
    e.target.value = '';
  };

  const removeTranscript = (id: string) => {
    setTranscripts(prev => prev.filter(t => t.id !== id));
    if (selectedResult?.id === id) setSelectedResult(null);
  };

  const processOne = async (id: string) => {
    const item = transcripts.find(t => t.id === id);
    if (!item || item.status === 'processing') return;

    setTranscripts(prev => prev.map(t => t.id === id ? { ...t, status: 'processing', error: undefined } : t));

    try {
      const result = await analyzeTranscript(item.content);
      setTranscripts(prev => prev.map(t => 
        t.id === id ? { ...t, status: 'completed', result } : t
      ));
    } catch (error: any) {
      setTranscripts(prev => prev.map(t => 
        t.id === id ? { ...t, status: 'error', error: error.message } : t
      ));
    }
  };

  const processAllPending = async () => {
    setIsBatchProcessing(true);
    const pending = transcripts.filter(t => t.status === 'pending');
    
    // Process sequentially to respect rate limits if any
    for (const t of pending) {
      await processOne(t.id);
    }
    
    setIsBatchProcessing(false);
    if (pending.length > 0) {
      setActiveTab('results');
      // Auto-select the first newly processed item if none selected
      const firstProcessed = pending[0];
      if (firstProcessed) setSelectedResult({ ...firstProcessed, status: 'completed', result: 'Loading...' });
    }
  };

  const filteredResults = transcripts.filter(t => 
    t.status === 'completed' && 
    (t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     (t.result?.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30 flex flex-col">
      {/* Global Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 rotate-3">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                AUDITPRO
                <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-indigo-500/30">Intelligence</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-[0.2em]">Callback Quality Control System</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-1 bg-slate-950/50 p-1 rounded-xl border border-slate-800/50">
            <button 
              onClick={() => setActiveTab('input')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'input' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Analysis Lab
            </button>
            <button 
              onClick={() => setActiveTab('results')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'results' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
            >
              <History className="w-4 h-4" />
              Audit Archive
              {transcripts.filter(t => t.status === 'completed').length > 0 && (
                <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded text-[10px] tabular-nums">
                  {transcripts.filter(t => t.status === 'completed').length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full px-6 py-10 flex-1">
        {activeTab === 'input' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Control Panel */}
            <div className="lg:col-span-5 space-y-8">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl shadow-black/40">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-lg font-bold flex items-center gap-3">
                    <Upload className="w-5 h-5 text-indigo-500" />
                    Data Intake
                  </h2>
                </div>
                
                <div className="space-y-6">
                  {/* File Drop Zone */}
                  <div className="relative group">
                    <input 
                      type="file" 
                      multiple 
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      accept=".txt,.md"
                    />
                    <div className="border-2 border-dashed border-slate-800 group-hover:border-indigo-500/50 group-hover:bg-indigo-500/5 rounded-2xl p-10 text-center transition-all duration-300">
                      <div className="w-14 h-14 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 group-hover:border-indigo-500/30 transition-all">
                        <FileText className="w-7 h-7 text-slate-600 group-hover:text-indigo-500" />
                      </div>
                      <p className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">
                        Drop transcripts here
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        or <span className="text-indigo-400 font-bold underline decoration-indigo-400/30 underline-offset-4">browse files</span>
                      </p>
                      <div className="mt-4 flex justify-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">.TXT</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">.MD</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute left-4 top-4 pointer-events-none">
                      <MessageSquare className="w-4 h-4 text-slate-600" />
                    </div>
                    <textarea 
                      placeholder="Or paste call transcript text directly..."
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 pl-12 text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all min-h-[160px] text-slate-300 placeholder:text-slate-600"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                    />
                    <button 
                      onClick={handleAddText}
                      disabled={!inputText.trim()}
                      className="mt-4 w-full bg-slate-800/80 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border border-slate-700 hover:border-slate-600"
                    >
                      Stage for Analysis
                    </button>
                  </div>
                </div>
              </div>

              {transcripts.some(t => t.status === 'pending') && (
                <button 
                  onClick={processAllPending}
                  disabled={isBatchProcessing}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 py-5 rounded-2xl font-black text-white shadow-2xl shadow-indigo-900/30 flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.98] uppercase tracking-tighter text-lg group"
                >
                  {isBatchProcessing ? (
                    <><Loader2 className="w-6 h-6 animate-spin" /> RUNNING AUDIT ENGINE...</>
                  ) : (
                    <>
                      <Play className="w-6 h-6 group-hover:fill-current transition-all" /> 
                      INITIATE BATCH INTELLIGENCE
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Queue List */}
            <div className="lg:col-span-7">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl shadow-black/40 h-full flex flex-col">
                <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-indigo-400" />
                    </div>
                    <h2 className="font-bold tracking-tight text-white">Batch Queue</h2>
                    <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-xs font-mono">
                      {transcripts.length}
                    </span>
                  </div>
                  {transcripts.length > 0 && (
                    <button 
                      onClick={() => setTranscripts([])} 
                      className="text-[10px] font-bold text-slate-500 hover:text-red-400 uppercase tracking-widest transition-colors"
                    >
                      Purge All
                    </button>
                  )}
                </div>
                
                <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
                  {transcripts.length === 0 ? (
                    <div className="p-20 text-center">
                      <div className="w-16 h-16 bg-slate-950 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-800">
                        <Search className="w-8 h-8 text-slate-800" />
                      </div>
                      <h3 className="text-slate-200 font-bold mb-1">Queue Empty</h3>
                      <p className="text-slate-500 text-sm max-w-[240px] mx-auto">Upload or paste transcripts to start the intelligence audit process.</p>
                    </div>
                  ) : (
                    transcripts.map((t) => (
                      <div key={t.id} className="p-5 flex items-center justify-between hover:bg-slate-800/30 transition-all group animate-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className={`w-2.5 h-2.5 rounded-full shrink-0 shadow-sm ${
                            t.status === 'completed' ? 'bg-emerald-500 shadow-emerald-500/50' : 
                            t.status === 'processing' ? 'bg-amber-500 shadow-amber-500/50 animate-pulse' : 
                            t.status === 'error' ? 'bg-red-500 shadow-red-500/50' : 
                            'bg-slate-700'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold truncate text-slate-100 group-hover:text-indigo-300 transition-colors">{t.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[10px] font-black uppercase tracking-widest ${
                                t.status === 'completed' ? 'text-emerald-500/80' : 
                                t.status === 'processing' ? 'text-amber-500/80' : 
                                t.status === 'error' ? 'text-red-500/80' : 
                                'text-slate-500'
                              }`}>
                                {t.status}
                              </span>
                              {t.error && (
                                <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  Error
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {t.status === 'completed' ? (
                            <button 
                              onClick={() => { setSelectedResult(t); setActiveTab('results'); }}
                              className="px-4 py-1.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-indigo-500/20 hover:bg-indigo-500 hover:text-white transition-all shadow-lg shadow-indigo-500/0 hover:shadow-indigo-500/20"
                            >
                              View Snapshot
                            </button>
                          ) : t.status === 'pending' ? (
                            <button 
                              onClick={() => processOne(t.id)}
                              className="p-2 text-slate-500 hover:text-indigo-400 transition-colors"
                              title="Process Item"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          ) : null}
                          <button 
                            onClick={() => removeTranscript(t.id)}
                            className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
            {/* Sidebar Archive */}
            <div className="lg:col-span-1 space-y-6 flex flex-col h-full max-h-[calc(100vh-16rem)] no-print">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-full">
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-600" />
                  <input 
                    type="text"
                    placeholder="Search audits..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 mb-3">Audit Archive</h3>
                <div className="space-y-1.5 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                  {filteredResults.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedResult(t)}
                      className={`w-full text-left p-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-between group border ${
                        selectedResult?.id === t.id 
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-xl shadow-indigo-900/40 translate-x-1' 
                        : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate flex-1">{t.name}</span>
                      <ChevronRight className={`w-3.5 h-3.5 transition-all ${selectedResult?.id === t.id ? 'translate-x-0.5 opacity-100' : 'opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5'}`} />
                    </button>
                  ))}
                  {filteredResults.length === 0 && (
                    <div className="py-10 text-center px-4">
                      <History className="w-8 h-8 text-slate-800 mx-auto mb-3 opacity-50" />
                      <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">No matching records found.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main Result Display */}
            <div className="lg:col-span-3">
              {selectedResult?.result ? (
                <AuditCard name={selectedResult.name} result={selectedResult.result} />
              ) : (
                <div className="h-full min-h-[500px] flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/20 no-print animate-in fade-in duration-700">
                  <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-6 border border-slate-800 shadow-inner">
                    <History className="w-10 h-10 text-slate-800" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-300">Archive Browser</h2>
                  <p className="text-slate-500 text-sm mt-2 max-w-sm text-center font-medium">Select a completed audit from the sidebar to review the full intelligence snapshot and compliance rating.</p>
                  
                  <div className="mt-8 flex gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-full">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Snapshot Ready</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-full">
                      <History className="w-4 h-4 text-indigo-400" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">History Log</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Global Footer */}
      <footer className="mt-auto border-t border-slate-800/50 py-10 px-6 no-print bg-slate-950/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
             <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-800">
                <ShieldCheck className="w-4 h-4 text-indigo-500" />
             </div>
             <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">AuditPro Callback Intelligence v2.0</p>
               <p className="text-[10px] text-slate-600 font-medium">Built for Playbook Compliance & Operator Efficiency</p>
             </div>
          </div>
          
          <div className="flex gap-8">
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Queue Health</p>
              <div className="flex gap-1">
                <div className="w-3 h-1 bg-emerald-500 rounded-full"></div>
                <div className="w-3 h-1 bg-emerald-500 rounded-full"></div>
                <div className="w-3 h-1 bg-emerald-500 rounded-full opacity-30"></div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Compute Capacity</p>
              <p className="text-[10px] font-bold text-indigo-400">OPTIMAL</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
