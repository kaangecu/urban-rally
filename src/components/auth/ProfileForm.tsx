import type { FormEvent, RefObject } from 'react';

interface ProfileFormProps {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  confirmPassword?: string;
  acceptedTerms: boolean;
  acceptedDataProcessing: boolean;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange?: (value: string) => void;
  onConfirmPasswordChange?: (value: string) => void;
  onAcceptedTermsChange: (value: boolean) => void;
  onAcceptedDataProcessingChange: (value: boolean) => void;
  onSubmit: (e: FormEvent) => void;
  onBack?: () => void;
  onSwitchToLogin?: () => void;
  isLoading: boolean;
  errors: {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
  };
  onBlur: (field: string, value: string | boolean) => void;
  firstNameRef?: RefObject<HTMLInputElement | null>;
  isEmailRequired?: boolean;
  showPasswordFields?: boolean;
  submitButtonText: string;
  loadingText: string;
}

export function ProfileForm({
  firstName,
  lastName,
  email,
  password,
  confirmPassword,
  acceptedTerms,
  acceptedDataProcessing,
  onFirstNameChange,
  onLastNameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onAcceptedTermsChange,
  onAcceptedDataProcessingChange,
  onSubmit,
  onBack,
  onSwitchToLogin,
  isLoading,
  errors,
  onBlur,
  firstNameRef,
  isEmailRequired = false,
  showPasswordFields = false,
  submitButtonText,
  loadingText,
}: ProfileFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      
      {/* Back Button (optional) */}
      {onBack && (
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
      )}

      {/* Name Fields */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* First Name */}
        <div className="group">
          <label 
            htmlFor="firstName"
            className="block text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-1.5 ml-1"
          >
            First Name <span className="text-pink-500">*</span>
          </label>
          <div className={`relative flex items-center rounded-xl bg-gray-900 border transition-all ${
            errors.firstName 
              ? 'border-red-500/50 shadow-[0_0_15px_-3px_rgba(239,68,68,0.3)]'
              : 'border-white/10 focus-within:border-cyan-500/50 focus-within:shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)]'
          }`}>
            <input
              ref={firstNameRef}
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => onFirstNameChange(e.target.value)}
              onBlur={() => onBlur('firstName', firstName)}
              placeholder="ALEX"
              disabled={isLoading}
              className="w-full bg-transparent py-3.5 px-4 text-white placeholder-gray-700 font-bold uppercase tracking-wide focus:outline-none font-mono disabled:opacity-50"
              aria-invalid={!!errors.firstName}
              aria-describedby={errors.firstName ? 'firstName-error' : undefined}
            />
          </div>
          {errors.firstName && (
            <p id="firstName-error" className="text-[10px] text-red-400 mt-1 ml-1">{errors.firstName}</p>
          )}
        </div>

        {/* Last Name */}
        <div className="group">
          <label 
            htmlFor="lastName"
            className="block text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-1.5 ml-1"
          >
            Last Name <span className="text-pink-500">*</span>
          </label>
          <div className={`relative flex items-center rounded-xl bg-gray-900 border transition-all ${
            errors.lastName 
              ? 'border-red-500/50 shadow-[0_0_15px_-3px_rgba(239,68,68,0.3)]'
              : 'border-white/10 focus-within:border-cyan-500/50 focus-within:shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)]'
          }`}>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => onLastNameChange(e.target.value)}
              onBlur={() => onBlur('lastName', lastName)}
              placeholder="RIDER"
              disabled={isLoading}
              className="w-full bg-transparent py-3.5 px-4 text-white placeholder-gray-700 font-bold uppercase tracking-wide focus:outline-none font-mono disabled:opacity-50"
              aria-invalid={!!errors.lastName}
              aria-describedby={errors.lastName ? 'lastName-error' : undefined}
            />
          </div>
          {errors.lastName && (
            <p id="lastName-error" className="text-[10px] text-red-400 mt-1 ml-1">{errors.lastName}</p>
          )}
        </div>
      
      </div>

      {/* Email Field */}
      <div className="group">
        <label 
          htmlFor="email"
          className={`block text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1 ${
            isEmailRequired ? 'text-cyan-500' : 'text-gray-500'
          }`}
        >
          {isEmailRequired ? 'Email' : 'Recovery Email'}{' '}
          {isEmailRequired ? (
            <span className="text-pink-500">*</span>
          ) : (
            <span className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded ml-2 border border-white/5 text-gray-600">
              OPTIONAL
            </span>
          )}
        </label>
        <div className={`relative flex items-center rounded-xl bg-gray-900 border transition-all ${
          errors.email 
            ? 'border-red-500/50 shadow-[0_0_15px_-3px_rgba(239,68,68,0.3)]'
            : 'border-white/10 focus-within:border-pink-500/50 focus-within:shadow-[0_0_15px_-3px_rgba(236,72,153,0.3)]'
        }`}>
          <svg className="w-4 h-4 text-gray-600 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            onBlur={() => onBlur('email', email)}
            placeholder={isEmailRequired ? "your@email.com" : "backup@link.com"}
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

      {/* Password Fields (optional) */}
      {showPasswordFields && onPasswordChange && (
        <>
          {/* Password */}
          <div className="group">
            <label htmlFor="password" className="block text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-1.5 ml-1">
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
                id="password"
                type="password"
                value={password || ''}
                onChange={(e) => onPasswordChange(e.target.value)}
                onBlur={() => onBlur('password', password || '')}
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

          {/* Confirm Password */}
          {onConfirmPasswordChange && (
            <div className="group">
              <label htmlFor="confirmPassword" className="block text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-1.5 ml-1">
                Confirm Password <span className="text-pink-500">*</span>
              </label>
              <div className={`relative flex items-center rounded-xl bg-gray-900 border transition-all ${
                errors.confirmPassword 
                  ? 'border-red-500/50 shadow-[0_0_15px_-3px_rgba(239,68,68,0.3)]'
                  : 'border-white/10 focus-within:border-cyan-500/50 focus-within:shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)]'
              }`}>
                <svg className="w-4 h-4 text-gray-600 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword || ''}
                  onChange={(e) => onConfirmPasswordChange(e.target.value)}
                  onBlur={() => onBlur('confirmPassword', confirmPassword || '')}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full bg-transparent py-3.5 px-3 text-white placeholder-gray-700 font-medium text-sm focus:outline-none disabled:opacity-50"
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                />
              </div>
              {errors.confirmPassword && (
                <p id="confirmPassword-error" className="text-[10px] text-red-400 mt-1 ml-1">{errors.confirmPassword}</p>
              )}
            </div>
          )}
        </>
      )}

      {/* Consent Checkboxes */}
      <div className="space-y-3 pt-2">
        
        {/* Terms & Privacy */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative flex items-center mt-0.5">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => onAcceptedTermsChange(e.target.checked)}
              disabled={isLoading}
              className="peer sr-only"
              aria-describedby={errors.terms ? 'terms-error' : undefined}
            />
            <div className={`h-5 w-5 rounded border transition-all flex items-center justify-center shadow-inner ${
              acceptedTerms 
                ? 'bg-cyan-500 border-cyan-400' 
                : 'border-gray-600 bg-gray-900'
            }`}>
              <svg 
                className={`w-3.5 h-3.5 text-black transition-opacity ${
                  acceptedTerms ? 'opacity-100' : 'opacity-0'
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <span className="text-[10px] text-gray-400 leading-snug group-hover:text-gray-300 transition-colors">
            Agree to{' '}
            <a href="/terms" target="_blank" className="text-cyan-400 underline decoration-cyan-500/30 hover:decoration-cyan-500">
              Terms
            </a>
            {' & '}
            <a href="/privacy" target="_blank" className="text-cyan-400 underline decoration-cyan-500/30 hover:decoration-cyan-500">
              Privacy
            </a>
            .
          </span>
        </label>

        {/* Data Processing */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative flex items-center mt-0.5">
            <input
              type="checkbox"
              checked={acceptedDataProcessing}
              onChange={(e) => onAcceptedDataProcessingChange(e.target.checked)}
              disabled={isLoading}
              className="peer sr-only"
            />
            <div className={`h-5 w-5 rounded border transition-all flex items-center justify-center shadow-inner ${
              acceptedDataProcessing 
                ? 'bg-cyan-500 border-cyan-400' 
                : 'border-gray-600 bg-gray-900'
            }`}>
              <svg 
                className={`w-3.5 h-3.5 text-black transition-opacity ${
                  acceptedDataProcessing ? 'opacity-100' : 'opacity-0'
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <span className="text-[10px] text-gray-400 leading-snug group-hover:text-gray-300 transition-colors">
            Allow data processing for leaderboard.
          </span>
        </label>

        {/* Consent Errors */}
        {errors.terms && (
          <p id="terms-error" className="text-[10px] text-red-400 ml-1">{errors.terms}</p>
        )}

      </div>

      {/* Submit Button */}
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
              {loadingText}
            </>
          ) : (
            submitButtonText
          )}
        </div>
      </button>

      {/* Login Link (optional) */}
      {onSwitchToLogin && (
        <p className="text-center text-sm text-gray-400">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            disabled={isLoading}
            className="text-cyan-400 hover:text-cyan-300 underline decoration-cyan-500/30 hover:decoration-cyan-500 disabled:opacity-50"
          >
            Sign In
          </button>
        </p>
      )}
    </form>
  );
}
