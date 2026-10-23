/**
 * Legal Modal Component
 * Animated modal for displaying Terms of Service and Privacy Policy
 * Uses Framer Motion for smooth animations
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { defaultLegalLang, type LegalLang } from './language';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: Record<LegalLang, string>;
  children: (lang: LegalLang) => React.ReactNode;
}

const LANGS: LegalLang[] = ['en', 'de'];

export function LegalModal({ isOpen, onClose, title, children }: LegalModalProps) {
  const [lang, setLang] = useState<LegalLang>(() => defaultLegalLang());
  const contentRef = useRef<HTMLDivElement>(null);

  const switchLang = (next: LegalLang) => {
    setLang(next);
    contentRef.current?.scrollTo?.({ top: 0 });
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {title[lang]}
                </h2>
                <div className="ml-auto mr-2 flex rounded-full border border-gray-300 dark:border-gray-600 overflow-hidden">
                  {LANGS.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => switchLang(l)}
                      aria-pressed={lang === l}
                      className={`px-3 text-sm font-semibold ${
                        lang === l
                          ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label={lang === 'de' ? 'Schließen' : 'Close'}
                >
                  <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div ref={contentRef} lang={lang} className="flex-1 overflow-y-auto p-6">
                {children(lang)}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={onClose}
                  className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  {lang === 'de' ? 'Schließen' : 'Close'}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
