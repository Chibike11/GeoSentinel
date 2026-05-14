import { Phone, Users, Flame, ShieldAlert, HeartPulse, Siren } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export function HotlineWidget() {
  const [isOpen, setIsOpen] = useState(false);

  const hotlines = [
    { name: 'Emergency', number: '112', icon: Siren, color: 'bg-red-500' },
    { name: 'Police', number: '112', icon: ShieldAlert, color: 'bg-blue-600' },
    { name: 'Fire Service', number: '01-7944608', icon: Flame, color: 'bg-orange-600' },
    { name: 'FRSC', number: '122', icon: Users, color: 'bg-yellow-600' },
    { name: 'NEMA', number: '08052082800', icon: HeartPulse, color: 'bg-green-600' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[1000]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-72 rounded-2xl bg-white p-4 shadow-2xl border border-slate-200"
          >
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">Emergency Hotlines</h3>
            <div className="space-y-2">
              {hotlines.map((hotline) => (
                <a
                  key={hotline.name}
                  href={`tel:${hotline.number}`}
                  className="flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-slate-50 border border-transparent hover:border-slate-100"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${hotline.color} text-white`}>
                      <hotline.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{hotline.name}</p>
                      <p className="text-xs text-slate-500 font-mono">{hotline.number}</p>
                    </div>
                  </div>
                  <Phone className="h-4 w-4 text-slate-300" />
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl shadow-blue-200 transition-transform active:scale-95 hover:scale-105"
      >
        <Phone className={`h-6 w-6 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>
    </div>
  );
}
