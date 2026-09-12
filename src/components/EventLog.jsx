import { useEffect, useRef } from 'react';
import { ScrollText } from 'lucide-react';

const EVENT_STYLES = {
  REVEAL: { color: 'text-amber-400', icon: '◆' },
  ASSIGN: { color: 'text-accent-cyan', icon: '→' },
  COMPLETION: { color: 'text-green-400', icon: '✓' },
  QUEUE: { color: 'text-red-400', icon: '!' },
};

export default function EventLog({ events }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  return (
    <div className="glass-card p-4 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <ScrollText className="w-4 h-4 text-accent-cyan" />
        <h3 className="text-sm font-semibold text-white">Event Log</h3>
        <span className="ml-auto text-[10px] text-slate-500">{events.length} events</span>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-auto space-y-1 max-h-80 lg:max-h-96">
        {events.length === 0 ? (
          <div className="text-center text-slate-500 text-xs py-8">
            No events yet. Run the simulation to see live events.
          </div>
        ) : (
          events.map((e, idx) => {
            const style = EVENT_STYLES[e.type] || { color: 'text-slate-400', icon: '·' };
            return (
              <div
                key={idx}
                className="flex items-start gap-2 text-[11px] py-1 px-2 rounded hover:bg-navy-800/50 transition-colors animate-fade-in"
              >
                <span className="text-slate-500 font-mono flex-shrink-0">
                  [{String(e.minute).padStart(3, '0')}]
                </span>
                <span className={`${style.color} flex-shrink-0`}>{style.icon}</span>
                <span className="text-slate-300">{e.message}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
