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
      className="fixed bg-black/50 z-[120] flex items-center justify-center p-4"
      style={{ top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">Quiz Question</h2>
          <button
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Question */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Question:
            </label>
            <p className="text-gray-900 bg-blue-50 p-4 rounded-lg border border-blue-200">
              {question}
            </p>
          </div>

          {/* Answer Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Your Answer:
            </label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              maxLength={maxLength}
              placeholder="Type your answer here..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={6}
              autoFocus
            />
            
            {/* Character Counter */}
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm text-gray-500">
                {answer.trim().length === 0 ? (
                  'Answer is required'
                ) : (
                  'Answer ready to submit'
                )}
              </p>
              <p className={`text-sm ${remainingChars < 50 ? 'text-orange-600' : 'text-gray-500'}`}>
                {remainingChars} characters remaining
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            Submit Answer
          </button>
        </div>
      </div>
    </div>
  );
};
