import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  onSuccess?: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
  isSubmitting = false,
  onSuccess,
}) => {
  const [shouldCloseAfterSuccess, setShouldCloseAfterSuccess] = useState(false);

  useEffect(() => {
    if (shouldCloseAfterSuccess && !isSubmitting) {
      // Delay the close to allow toast to be visible
      const timeout = setTimeout(() => {
        onSuccess?.();
        setShouldCloseAfterSuccess(false);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [shouldCloseAfterSuccess, isSubmitting, onSuccess]);

  const handleCancel = () => {
    if (isSubmitting) {
      // Don't allow closing while submitting
      return;
    }
    onCancel();
  };

  const handleConfirm = () => {
    setShouldCloseAfterSuccess(true);
    onConfirm();
  };

  const handleBackdropClick = () => {
    if (!isSubmitting) {
      onCancel();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="relative bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden"
          >
            <div className="p-6 flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isSubmitting 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'bg-rose-50 text-rose-600'
              }`}>
                {isSubmitting ? (
                  <Loader size={20} className="animate-spin" />
                ) : (
                  <AlertTriangle size={20} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {isSubmitting ? 'Processing your submission...' : message}
                </p>
              </div>
              <button
                title="Close"
                onClick={handleCancel}
                disabled={isSubmitting}
                className={`p-2 rounded-lg transition-all ${
                  isSubmitting
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-slate-100 text-slate-400'
                }`}
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 pb-6 flex items-center gap-3 justify-end">
              <button
                onClick={handleCancel}
                disabled={isSubmitting}
                className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                  isSubmitting
                    ? 'opacity-50 cursor-not-allowed text-slate-400 bg-slate-50'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className={`px-4 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${
                  isSubmitting
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'text-white bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    {confirmLabel}...
                  </>
                ) : (
                  confirmLabel
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
