import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { changelog } from '../constants/changelog';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Sparkles size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">What's New</h2>
                  <p className="text-xs text-slate-400">Update history</p>
                </div>
              </div>
              <button
                title="Close"
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-5">
              {changelog.map((entry, index) => (
                <div key={entry.version} className="relative">
                  {/* Version header */}
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${
                        index === 0
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      v{entry.version}
                    </span>
                    {index === 0 && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Latest
                      </span>
                    )}
                    <span className="text-xs text-slate-400 ml-auto">{entry.date}</span>
                  </div>

                  {/* Changes list */}
                  <ul className="space-y-1.5 ml-1">
                    {entry.changes.map((change, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          index === 0 ? 'bg-blue-400' : 'bg-slate-300'
                        }`} />
                        {change}
                      </li>
                    ))}
                  </ul>

                  {/* Divider between entries */}
                  {index < changelog.length - 1 && (
                    <div className="border-b border-slate-100 mt-4" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
