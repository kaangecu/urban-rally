import React, { useState } from 'react';
import { Check, X } from 'lucide-react';

interface QuizInputProps {
  question: string;
  onSubmit: (answer: string) => void;
  onCancel: () => void;
  maxLength?: number;
}

export const QuizInput: React.FC<QuizInputProps> = ({ 
  question, 
  onSubmit, 
  onCancel,
  maxLength = 500 
}) => {
  const [answer, setAnswer] = useState('');

  const handleSubmit = () => {
    if (answer.trim()) {
      onSubmit(answer.trim());
    }
  };

  const isValid = answer.trim().length > 0;
  const remainingChars = maxLength - answer.length;

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[120] flex items-center justify-center p-4"
    >
      {/* Glass Modal with Neon Orbs */}
      <div 
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        style={{ backgroundColor: 'rgba(17, 24, 39, 0.95)' }}
      >
        {/* Neon Gradient Orbs */}
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-pink-500/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-cyan-500/30 blur-3xl pointer-events-none" />
        
        {/* Content Container */}
        <div className="relative z-10">
          {/* Header */}
          <div className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/10 backdrop-blur-xl bg-gray-900/80">
            <h2 className="text-lg sm:text-xl font-bold text-white">Quiz Question</h2>
            <button
              onClick={onCancel}
              className="p-2 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white touch-manipulation"
              style={{ minWidth: '44px', minHeight: '44px' }}
              aria-label="Close"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 space-y-6">
            {/* Question */}
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                Question:
              </label>
              <div className="relative overflow-hidden rounded-xl border border-cyan-500/30 bg-cyan-950/30 p-4 backdrop-blur-sm">
                <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,rgba(6,182,212,0.2)_1px,transparent_1px)] bg-[length:10px_10px]" />
                <p className="relative text-white leading-relaxed">
                  {question}
                </p>
              </div>
            </div>

            {/* Answer Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                Your Answer:
              </label>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                maxLength={maxLength}
                placeholder="Type your answer here..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg 
                         text-white placeholder-gray-500 
                         focus:bg-white/10 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 
                         resize-none backdrop-blur-sm transition-all
                         text-base sm:text-sm"
                rows={6}
                autoFocus
              />
              
              {/* Character Counter */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mt-3">
                <p className="text-sm text-gray-400">
                  {answer.trim().length === 0 ? (
                    'Answer is required'
                  ) : (
                    <span className="text-cyan-300">✓ Answer ready to submit</span>
                  )}
                </p>
                <p className={`text-sm ${remainingChars < 50 ? 'text-yellow-400' : 'text-gray-400'}`}>
                  {remainingChars} characters remaining
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="sticky bottom-0 flex flex-col sm:flex-row gap-3 p-4 sm:p-6 border-t border-white/10 backdrop-blur-xl bg-gray-900/80">
            <button
              onClick={onCancel}
              className="order-2 sm:order-1 flex-1 py-4 px-6 border border-white/20 text-gray-300 
                       hover:bg-white/10 hover:text-white rounded-lg backdrop-blur-sm 
                       transition-all font-semibold touch-manipulation"
              style={{ minHeight: '48px' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isValid}
              className="order-1 sm:order-2 group relative flex-1 overflow-hidden rounded-lg font-bold py-4 px-6 
                       disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              style={{ minHeight: '48px' }}
            >
              {/* Gradient Background Layers */}
              <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 
                            group-hover:from-pink-500 group-hover:to-purple-500 
                            transition-all duration-300 group-disabled:from-gray-700 group-disabled:to-gray-600" />
              <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 
                            blur-xl opacity-50 group-hover:opacity-70 
                            transition-opacity duration-300 group-disabled:opacity-0" />
              
              {/* Button Content */}
              <span className="relative z-10 flex items-center justify-center gap-2 text-white uppercase tracking-wider">
                <Check className="w-5 h-5" />
                Submit Answer
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
