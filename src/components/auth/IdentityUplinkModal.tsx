import { useState, useEffect, useRef } from 'react';
import { createUser } from '../../services/user.service';
// Note: useAuthStore not needed here - useFirebaseAuthListener handles user state
import type { User } from '../../types/schema';

interface IdentityUplinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  teamName?: string;
  eventName?: string;
  tenantId: string;
  teamId?: string;
}

export function IdentityUplinkModal({
  isOpen,
  onClose,
  onSuccess,
  teamName,
  // eventName, // Reserved for future use
  tenantId,
  teamId,
}: IdentityUplinkModalProps) {
  // Note: User state is managed by useFirebaseAuthListener, not here
  
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedDataProcessing, setAcceptedDataProcessing] = useState(false);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Validation errors
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    terms?: string;
  }>({});

  // Focus management
  const firstNameRef = useRef<HTMLInputElement>(null);

  // Auto-focus first field when modal opens
  useEffect(() => {
    if (isOpen && firstNameRef.current) {
      setTimeout(() => firstNameRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFirstName('');
      setLastName('');
      setEmail('');
      setAcceptedTerms(false);
      setAcceptedDataProcessing(false);
      setError(null);
      setErrors({});
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, isLoading, onClose]);

  // Validation
  const validateField = (field: string, value: string | boolean): string | undefined => {
    switch (field) {
      case 'firstName':
        if (!value || (value as string).trim().length === 0) {
          return 'First name is required';
        }
        if ((value as string).trim().length > 50) {
          return 'First name must be 50 characters or less';
        }
        break;
      
      case 'lastName':
        if (!value || (value as string).trim().length === 0) {
          return 'Last name is required';
        }
        if ((value as string).trim().length > 50) {
          return 'Last name must be 50 characters or less';
        }
        break;
      
      case 'email':
        if (value && (value as string).trim().length > 0) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value as string)) {
            return 'Please enter a valid email address';
          }
        }
        break;
      
      case 'terms':
        if (!value) {
          return 'You must accept the Terms & Privacy policy';
        }
        break;
    }
  };

  const handleBlur = (field: string, value: string | boolean) => {
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    const firstNameError = validateField('firstName', firstName);
    if (firstNameError) newErrors.firstName = firstNameError;
    
    const lastNameError = validateField('lastName', lastName);
    if (lastNameError) newErrors.lastName = lastNameError;
    
    const emailError = validateField('email', email);
    if (emailError) newErrors.email = emailError;
    
    const termsError = validateField('terms', acceptedTerms);
    if (termsError) newErrors.terms = termsError;
    
    if (!acceptedDataProcessing) {
      newErrors.terms = 'You must accept data processing for leaderboard';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Create user with Firebase
      const user = await createUser({
        displayName: `${firstName.trim()} ${lastName.trim()}`,
        email: email.trim() || undefined,
        tenantId,
        accountType: 'anonymous',
        consentGiven: {
          terms: acceptedTerms,
          privacy: acceptedTerms,
          termsVersion: '1.0',
          privacyVersion: '1.0',
          termsAcceptedAt: new Date(),
          privacyAcceptedAt: new Date(),
        },
      });
      
      console.log('✅ User created successfully:', user.id);
      
      // ⚡ OPTIMIZATION: Don't set user here - let useFirebaseAuthListener handle it
      // This eliminates a duplicate state update since Firebase auth listener 
      // will fire automatically after createUser() calls signInAnonymously()
      // Previous code: setUser(user); ← REMOVED
      
      // Track analytics (optional)
      if (typeof window !== 'undefined' && (window as any).analytics) {
        (window as any).analytics.track('auth_completed', {
          source: teamName ? 'team_code' : 'event_browser',
          teamId: teamId,
          hasEmail: !!email,
        });
      }
      
      // Call success callback (this will handle team join)
      // Note: useFirebaseAuthListener will set the user in store
      console.log('🎯 Calling onSuccess callback to join team...');
      onSuccess(user);
      
    } catch (err) {
      console.error('Error creating user:', err);
      setError(err instanceof Error ? err.message : 'Failed to create account. Please try again.');
      setIsLoading(false); // Keep modal open on error
    }
    // Note: Don't set isLoading to false here - let parent handle modal close
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans overflow-y-auto"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" />

      {/* Modal Container */}
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-[#09090b] shadow-2xl my-auto">
        
        {/* Decorative Glows */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 h-40 w-40 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 h-40 w-40 rounded-full bg-pink-500/20 blur-3xl" />
        
        <div className="relative z-10 p-6">
          
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gray-800 border border-white/10 mb-3 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0c0 .884-.5 2-2 2h4c-1.5 0-2-1.116-2-2z" />
              </svg>
            </div>
            <h2 id="auth-modal-title" className="text-xl font-black text-white uppercase italic tracking-wider">
              Identity Uplink
            </h2>
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-1">
              {teamName ? `Joining Team '${teamName}'` : 'Establishing Secure Connection...'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

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
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      if (errors.firstName) {
                        setErrors(prev => ({ ...prev, firstName: undefined }));
                      }
                    }}
                    onBlur={() => handleBlur('firstName', firstName)}
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
                    onChange={(e) => {
                      setLastName(e.target.value);
                      if (errors.lastName) {
                        setErrors(prev => ({ ...prev, lastName: undefined }));
                      }
                    }}
                    onBlur={() => handleBlur('lastName', lastName)}
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
                className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1"
              >
                Recovery Email{' '}
                <span className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded ml-2 border border-white/5 text-gray-600">
                  OPTIONAL
                </span>
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
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) {
                      setErrors(prev => ({ ...prev, email: undefined }));
                    }
                  }}
                  onBlur={() => handleBlur('email', email)}
                  placeholder="backup@link.com"
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

            {/* Consent Checkboxes */}
            <div className="space-y-3 pt-2">
              
              {/* Terms & Privacy */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex items-center mt-0.5">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => {
                      setAcceptedTerms(e.target.checked);
                      if (errors.terms) {
                        setErrors(prev => ({ ...prev, terms: undefined }));
                      }
                    }}
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
                    onChange={(e) => {
                      setAcceptedDataProcessing(e.target.checked);
                      if (errors.terms) {
                        setErrors(prev => ({ ...prev, terms: undefined }));
                      }
                    }}
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
                    Creating ID...
                  </>
                ) : (
                  'Create ID'
                )}
              </div>
            </button>

          </form>

        </div>
      </div>
    </div>
  );
}
