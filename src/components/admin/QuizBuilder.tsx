import { useState } from 'react';

export interface QuizConfig {
  quizType: 'text' | 'multiple-choice' | 'number';
  quizOptions?: string[];
  quizCorrectAnswer: string | number;
  quizHint?: string;
}

interface QuizBuilderProps {
  config: QuizConfig;
  onChange: (config: QuizConfig) => void;
  disabled?: boolean;
}

export function QuizBuilder({ config, onChange, disabled }: QuizBuilderProps) {
  const [newOption, setNewOption] = useState('');

  const handleTypeChange = (type: 'text' | 'multiple-choice' | 'number') => {
    onChange({
      ...config,
      quizType: type,
      quizOptions: type === 'multiple-choice' ? (config.quizOptions || []) : undefined,
      quizCorrectAnswer: type === 'number' ? 0 : '',
    });
  };

  const handleAddOption = () => {
    if (!newOption.trim()) return;
    
    const options = config.quizOptions || [];
    onChange({
      ...config,
      quizOptions: [...options, newOption.trim()],
    });
    setNewOption('');
  };

  const handleRemoveOption = (index: number) => {
    const options = config.quizOptions || [];
    onChange({
      ...config,
      quizOptions: options.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6 bg-slate-800/30 border border-slate-700 rounded-lg p-4 md:p-6">
      <h3 className="text-lg font-bold text-white mb-4">Quiz Configuration</h3>

      {/* Quiz Type */}
      <div>
        <label className="block text-sm font-bold text-slate-300 mb-3">
          Answer Type <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleTypeChange('text')}
            disabled={disabled}
            className={`
              ${config.quizType === 'text' ? 'border-green-500 bg-green-500/10' : 'border-slate-700 hover:border-green-500/50'}
              bg-[#1e293b] border-2 rounded-lg p-4
              transition-all min-h-[44px] touch-manipulation
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <div className="text-sm font-bold text-white mb-1">Text</div>
            <div className="text-xs text-slate-400">Free text answer</div>
          </button>

          <button
            type="button"
            onClick={() => handleTypeChange('multiple-choice')}
            disabled={disabled}
            className={`
              ${config.quizType === 'multiple-choice' ? 'border-green-500 bg-green-500/10' : 'border-slate-700 hover:border-green-500/50'}
              bg-[#1e293b] border-2 rounded-lg p-4
              transition-all min-h-[44px] touch-manipulation
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <div className="text-sm font-bold text-white mb-1">Multiple Choice</div>
            <div className="text-xs text-slate-400">Select from options</div>
          </button>

          <button
            type="button"
            onClick={() => handleTypeChange('number')}
            disabled={disabled}
            className={`
              ${config.quizType === 'number' ? 'border-green-500 bg-green-500/10' : 'border-slate-700 hover:border-green-500/50'}
              bg-[#1e293b] border-2 rounded-lg p-4
              transition-all min-h-[44px] touch-manipulation
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <div className="text-sm font-bold text-white mb-1">Number</div>
            <div className="text-xs text-slate-400">Numeric answer</div>
          </button>
        </div>
      </div>

      {/* Multiple Choice Options */}
      {config.quizType === 'multiple-choice' && (
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2">
            Answer Options <span className="text-red-400">*</span>
          </label>
          
          <div className="space-y-2 mb-3">
            {(config.quizOptions || []).map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white">
                  {option}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveOption(index)}
                  disabled={disabled}
                  className="bg-red-600 hover:bg-red-500 active:bg-red-700 text-white p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] touch-manipulation disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOption())}
              placeholder="Enter option text..."
              disabled={disabled}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleAddOption}
              disabled={disabled || !newOption.trim()}
              className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-blue-600/50 text-white px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors min-h-[44px] touch-manipulation"
            >
              Add
            </button>
          </div>
          
          {(config.quizOptions?.length || 0) < 2 && (
            <p className="text-xs text-yellow-400 mt-2">Add at least 2 options</p>
          )}
        </div>
      )}

      {/* Correct Answer */}
      <div>
        <label htmlFor="correctAnswer" className="block text-sm font-bold text-slate-300 mb-2">
          Correct Answer <span className="text-red-400">*</span>
        </label>
        
        {config.quizType === 'multiple-choice' ? (
          <select
            id="correctAnswer"
            value={config.quizCorrectAnswer as string}
            onChange={(e) => onChange({ ...config, quizCorrectAnswer: e.target.value })}
            disabled={disabled || (config.quizOptions?.length || 0) === 0}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
          >
            <option value="">Select correct answer...</option>
            {(config.quizOptions || []).map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : config.quizType === 'number' ? (
          <input
            id="correctAnswer"
            type="number"
            value={config.quizCorrectAnswer as number}
            onChange={(e) => onChange({ ...config, quizCorrectAnswer: Number(e.target.value) })}
            disabled={disabled}
            placeholder="Enter the correct number"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
          />
        ) : (
          <input
            id="correctAnswer"
            type="text"
            value={config.quizCorrectAnswer as string}
            onChange={(e) => onChange({ ...config, quizCorrectAnswer: e.target.value })}
            disabled={disabled}
            placeholder="Enter the correct answer (case-insensitive)"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
          />
        )}
        
        {config.quizType === 'text' && (
          <p className="text-xs text-slate-500 mt-1">Answers will be matched case-insensitively</p>
        )}
      </div>

      {/* Hint (Optional) */}
      <div>
        <label htmlFor="quizHint" className="block text-sm font-bold text-slate-300 mb-2">
          Hint (Optional)
        </label>
        <input
          id="quizHint"
          type="text"
          value={config.quizHint || ''}
          onChange={(e) => onChange({ ...config, quizHint: e.target.value })}
          disabled={disabled}
          placeholder="Provide a helpful hint..."
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
        />
      </div>
    </div>
  );
}
