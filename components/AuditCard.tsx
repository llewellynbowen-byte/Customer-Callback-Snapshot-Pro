
import React from 'react';
import { BarChart3, Printer, ExternalLink } from 'lucide-react';

interface AuditCardProps {
  name: string;
  result: string;
}

const AuditCard: React.FC<AuditCardProps> = ({ name, result }) => {
  // Simple parser for the specific structure requested in the prompt
  const parseResult = (text: string) => {
    const sections = text.split(/## /).filter(s => s.trim().length > 0);
    return sections.map(section => {
      const lines = section.split('\n');
      const title = lines[0].replace('---', '').trim();
      const content = lines.slice(1).join('\n').trim();
      return { title, content };
    });
  };

  const sections = parseResult(result);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-indigo-600 px-6 py-5 flex justify-between items-center no-print">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Intelligence Snapshot</h2>
          <p className="text-indigo-100 text-[10px] mt-0.5 font-medium flex items-center gap-1.5 opacity-80 uppercase tracking-widest">
            <BarChart3 className="w-3 h-3" />
            Analysis Engine v3-Flash
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => window.print()}
            className="bg-white/10 hover:bg-white/20 p-2 rounded-lg text-white transition-colors"
            title="Print Report"
          >
            <Printer className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-8 lg:p-10 space-y-10">
        <div className="border-b border-slate-800 pb-4 mb-4">
          <h1 className="text-2xl font-bold text-slate-100">{name}</h1>
          <p className="text-sm text-slate-500 mt-1">Audit Generation Timestamp: {new Date().toLocaleString()}</p>
        </div>

        {sections.map((section, idx) => {
          const isMainHeading = section.title.includes('CUSTOMER PROFILE SNAPSHOT') || 
                               section.title.includes('CALLBACK PLAYBOOK COMPLIANCE AUDIT');
          
          if (isMainHeading) {
             return (
               <div key={idx} className="border-l-4 border-indigo-500 pl-4 py-2 mt-12 first:mt-0">
                 <h2 className="text-xl font-black text-indigo-400 uppercase tracking-tighter italic">
                   {section.title}
                 </h2>
               </div>
             );
          }

          return (
            <div key={idx} className="group transition-all">
              <h3 className="text-indigo-500 font-bold text-[11px] uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full group-hover:scale-125 transition-transform"></span>
                {section.title}
              </h3>
              <div className="bg-slate-950/40 border border-slate-800/50 rounded-xl p-6 transition-colors group-hover:border-slate-700">
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                  {section.content.split('\n').map((line, lIdx) => (
                    <div key={lIdx} className="mb-2 last:mb-0">
                      {line.trim().startsWith('-') ? (
                        <div className="flex gap-3">
                          <span className="text-indigo-500 font-bold">•</span>
                          <span>{line.trim().substring(1).trim()}</span>
                        </div>
                      ) : (
                        line
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AuditCard;
