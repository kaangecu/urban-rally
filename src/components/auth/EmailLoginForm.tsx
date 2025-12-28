import type { FormEvent } from 'react';

interface EmailLoginFormProps {
  email: string;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  onBack: () => void;
  onSwitchToRegister: () => void;
  isLoading: boolean;
  errors: {
    email?: string;
    password?: string;
  };
  onBlur: (field: string, value: string) => void;
}

export function EmailLoginForm({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onBack,
  onSwitchToRegister,
  isLoading,
  errors,
  onBlur,
}: EmailLoginFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Back Button */}
      <button
        type="button"
        onClick={onBack}
        disabled={isLoading}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors disabled:opacity-50"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Email Field */}
      <div className="group">
        <label htmlFor="email-login" className="block text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-1.5 ml-1">
          Email <span className="text-pink-500">*</span>
        </label>
        <div className={`relative flex items-center rounded-xl bg-gray-900 border transition-all ${
          errors.email 
            ? 'border-red-500/50 shadow-[0_0_15px_-3px_rgba(239,68,68,0.3)]'
            : 'border-white/10 focus-within:border-cyan-500/50 focus-within:shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)]'
        }`}>
          <svg className="w-4 h-4 text-gray-600 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <input
            id="email-login"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            onBlur={() => onBlur('email', email)}
            placeholder="your@email.com"
            disabled={isLoading}
            className="w-full bg-transparent py-3.5 px-3 text-white placeholder-gray-700 font-medium text-sm focus:outline-none disabled:opacity-50"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
        </div>
        {errors.email && (
          <p id="email-error" className="text-[10px] text-red-400 mt-1 ml-1">{errors.email}</p>
        )}
      </div>

      {/* Password Field */}
      <div className="group">
        <label htmlFor="password-login" className="block text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-1.5 ml-1">
          Password <span className="text-pink-500">*</span>
        </label>
        <div className={`relative flex items-center rounded-xl bg-gray-900 border transition-all ${
          errors.password 
            ? 'border-red-500/50 shadow-[0_0_15px_-3px_rgba(239,68,68,0.3)]'
            : 'border-white/10 focus-within:border-cyan-500/50 focus-within:shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)]'
        }`}>
          <svg className="w-4 h-4 text-gray-600 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <input
            id="password-login"
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            onBlur={() => onBlur('password', password)}
            placeholder="••••••••"
            disabled={isLoading}
            className="w-full bg-transparent py-3.5 px-3 text-white placeholder-gray-700 font-medium text-sm focus:outline-none disabled:opacity-50"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
        </div>
        {errors.password && (
          <p id="password-error" className="text-[10px] text-red-400 mt-1 ml-1">{errors.password}</p>
        )}
      </div>

      {/* Sign In Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="group relative w-full mt-6 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 p-[1px] font-bold text-white shadow-[0_0_20px_-5px_rgba(6,182,212,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        <span className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-50 blur-sm transition-opacity group-hover:opacity-100" />
        <div className="relative flex items-center justify-center rounded-xl bg-gray-900/50 backdrop-blur-md py-4 text-sm font-black uppercase tracking-widest transition-colors group-hover:bg-transparent">
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </div>
      </button>

      {/* Register Link */}
      <p className="text-center text-sm text-gray-400">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          disabled={isLoading}
          className="text-cyan-400 hover:text-cyan-300 underline decoration-cyan-500/30 hover:decoration-cyan-500 disabled:opacity-50"
        >
          Register
        </button>
      </p>
    </form>
  );
}
