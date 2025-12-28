import { useState, useEffect, useRef } from 'react';
import { createUser } from '../../services/user.service';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthStore } from '../../store/authStore';
import type { User } from '../../types/schema';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth } from '../../services/firebase.service';
import { LoginMethodSelector } from './LoginMethodSelector';
import { EmailLoginForm } from './EmailLoginForm';
import { ProfileForm } from './ProfileForm';

interface IdentityUplinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  teamName?: string;
  eventName?: string;
  tenantId: string;
  teamId?: string;
  required?: boolean; // If true, modal cannot be dismissed by clicking backdrop or ESC
}

type AuthMethod = 'selection' | 'guest' | 'email-login' | 'email-register' | 'google';

export function IdentityUplinkModal({
  isOpen,
  onClose,
  onSuccess,
  teamName,
  // eventName, // Reserved for future use
  tenantId,
  teamId,
  required = false, // Default to dismissible
}: IdentityUplinkModalProps) {
  // Get auth context for state management
  const { setAuthState } = useAuth();
  
  // Get store updater for explicit state management
  const { setUser } = useAuthStore();
  
  // Auth method selection
  const [authMethod, setAuthMethod] = useState<AuthMethod>('selection');
  
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedDataProcessing, setAcceptedDataProcessing] = useState(false);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
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
      setAuthMethod('selection');
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setAcceptedTerms(false);
      setAcceptedDataProcessing(false);
      setError(null);
      setErrors({});
    }
  }, [isOpen]);

  // Handle ESC key (only if modal is dismissible)
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading && !required) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, isLoading, onClose, required]);

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
        // For guest flow, email is optional. For email auth, it's required.
        if (authMethod === 'email-login' || authMethod === 'email-register') {
          if (!value || (value as string).trim().length === 0) {
            return 'Email is required';
          }
        }
        if (value && (value as string).trim().length > 0) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value as string)) {
            return 'Please enter a valid email address';
          }
        }
        break;
      
      case 'password':
        if (!value || (value as string).length === 0) {
          return 'Password is required';
        }
        if ((value as string).length < 6) {
          return 'Password must be at least 6 characters';
        }
        break;
      
      case 'confirmPassword':
        if (authMethod === 'email-register') {
          if (!value || (value as string).length === 0) {
            return 'Please confirm your password';
          }
          if (value !== password) {
            return 'Passwords do not match';
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
    
    // For email login, only validate email and password
    if (authMethod === 'email-login') {
      const emailError = validateField('email', email);
      if (emailError) newErrors.email = emailError;
      
      const passwordError = validateField('password', password);
      if (passwordError) newErrors.password = passwordError;
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }
    
    // For guest and email registration, validate full profile
    const firstNameError = validateField('firstName', firstName);
    if (firstNameError) newErrors.firstName = firstNameError;
    
    const lastNameError = validateField('lastName', lastName);
    if (lastNameError) newErrors.lastName = lastNameError;
    
    const emailError = validateField('email', email);
    if (emailError) newErrors.email = emailError;
    
    // For email registration, validate password
    if (authMethod === 'email-register') {
      const passwordError = validateField('password', password);
      if (passwordError) newErrors.password = passwordError;
      
      const confirmPasswordError = validateField('confirmPassword', confirmPassword);
      if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;
    }
    
    const termsError = validateField('terms', acceptedTerms);
    if (termsError) newErrors.terms = termsError;
    
    if (!acceptedDataProcessing) {
      newErrors.terms = 'You must accept data processing for leaderboard';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Email Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Sign in with email/password
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      console.log('✅ Email login successful:', userCredential.user.uid);
      
      // Fetch user document from Firestore (using Firebase Auth UID as document ID)
      const { getUserById } = await import('../../services/user.service');
      const user = await getUserById(userCredential.user.uid);
      
      if (!user) {
        throw new Error('User profile not found. Please contact support.');
      }
      
      // Update store
      setUser(user);
      setAuthState('authenticated');
      
      // Call success callback
      console.log('🎯 Email login complete, calling onSuccess callback...');
      onSuccess(user);
      
    } catch (err: any) {
      console.error('Error during email login:', err);
      
      // Handle Firebase Auth errors
      let errorMessage = 'Failed to sign in. Please try again.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      }
      
      setError(errorMessage);
      setAuthState('error');
      setIsLoading(false);
    }
  };

  // Handle Email Registration
  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      setAuthState('creating');
      
      // Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      console.log('✅ Firebase Auth account created:', userCredential.user.uid);
      
      // Create user document in Firestore
      const user = await createUser({
        displayName: `${firstName.trim()} ${lastName.trim()}`,
        email: email.trim(),
        tenantId,
        accountType: 'linked', // Email accounts are linked accounts
        consentGiven: {
          terms: acceptedTerms,
          privacy: acceptedTerms,
          termsVersion: '1.0',
          privacyVersion: '1.0',
          termsAcceptedAt: new Date(),
          privacyAcceptedAt: new Date(),
        },
      });
      
      console.log('✅ User profile created:', user.id);
      
      // Update store
      setUser(user);
      setAuthState('authenticated');
      
      // Call success callback
      console.log('🎯 Registration complete, calling onSuccess callback...');
      onSuccess(user);
      
    } catch (err: any) {
      console.error('Error during email registration:', err);
      
      // Handle Firebase Auth errors
      let errorMessage = 'Failed to create account. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please sign in instead.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use at least 6 characters.';
      }
      
      setError(errorMessage);
      setAuthState('error');
      setIsLoading(false);
    }
  };

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      setAuthState('creating');
      
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      console.log('✅ Google sign-in successful:', userCredential.user.uid);
      
      // Check if user profile exists (using Firebase Auth UID as document ID)
      const { getUserById } = await import('../../services/user.service');
      let user = await getUserById(userCredential.user.uid);
      
      // If no profile exists, create one
      if (!user) {
        const displayName = userCredential.user.displayName || 'Google User';
        
        user = await createUser({
          displayName,
          email: userCredential.user.email || undefined,
          tenantId,
          accountType: 'linked', // Google accounts are linked accounts
          consentGiven: {
            terms: true, // Google users implicitly accept terms
            privacy: true,
            termsVersion: '1.0',
            privacyVersion: '1.0',
            termsAcceptedAt: new Date(),
            privacyAcceptedAt: new Date(),
          },
        });
        
        console.log('✅ User profile created for Google user:', user.id);
      }
      
      // Update store
      setUser(user);
      setAuthState('authenticated');
      
      // Call success callback
      console.log('🎯 Google sign-in complete, calling onSuccess callback...');
      onSuccess(user);
      
    } catch (err: any) {
      console.error('Error during Google sign-in:', err);
      
      // Handle Firebase Auth errors
      let errorMessage = 'Failed to sign in with Google. Please try again.';
      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in cancelled.';
      } else if (err.code === 'auth/popup-blocked') {
        errorMessage = 'Pop-up was blocked. Please allow pop-ups and try again.';
      }
      
      setError(errorMessage);
      setAuthState('error');
      setIsLoading(false);
    }
  };

  // Handle Guest (Anonymous) Sign-In
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Set auth state to 'creating' to disable auth listener during creation
      setAuthState('creating');
      
      // Create user with Firebase (service is now a pure function)
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
      
      // Explicitly update store with returned user data
      setUser(user);
      
      // Set auth state to 'authenticated'
      setAuthState('authenticated');
      
      // Track analytics (optional)
      if (typeof window !== 'undefined' && (window as any).analytics) {
        (window as any).analytics.track('auth_completed', {
          source: teamName ? 'team_code' : 'event_browser',
          teamId: teamId,
          hasEmail: !!email,
        });
      }
      
      // Call success callback (this will handle team join)
      console.log('🎯 Calling onSuccess callback to join team...');
      onSuccess(user);
      
    } catch (err) {
      console.error('Error creating user:', err);
      setError(err instanceof Error ? err.message : 'Failed to create account. Please try again.');
      setAuthState('error'); // Set auth state to error
      setIsLoading(false); // Keep modal open on error
    }
    // Note: Don't set isLoading to false here - let parent handle modal close
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only allow dismissing if not required and not loading
    if (e.target === e.currentTarget && !isLoading && !required) {
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

          {/* Login Method Selection */}
          {authMethod === 'selection' && (
            <LoginMethodSelector
              onSelectGuest={() => setAuthMethod('guest')}
              onSelectEmail={() => setAuthMethod('email-login')}
              onSelectGoogle={handleGoogleSignIn}
              isLoading={isLoading}
            />
          )}

          {/* Email Login Form */}
          {authMethod === 'email-login' && (
            <EmailLoginForm
              email={email}
              password={password}
              onEmailChange={(value) => {
                setEmail(value);
                if (errors.email) {
                  setErrors(prev => ({ ...prev, email: undefined }));
                }
              }}
              onPasswordChange={(value) => {
                setPassword(value);
                if (errors.password) {
                  setErrors(prev => ({ ...prev, password: undefined }));
                }
              }}
              onSubmit={handleEmailLogin}
              onBack={() => setAuthMethod('selection')}
              onSwitchToRegister={() => setAuthMethod('email-register')}
              isLoading={isLoading}
              errors={errors}
              onBlur={handleBlur}
            />
          )}

          {/* Email Registration Form */}
          {authMethod === 'email-register' && (
            <ProfileForm
              firstName={firstName}
              lastName={lastName}
              email={email}
              password={password}
              confirmPassword={confirmPassword}
              acceptedTerms={acceptedTerms}
              acceptedDataProcessing={acceptedDataProcessing}
              onFirstNameChange={(value) => {
                setFirstName(value);
                if (errors.firstName) {
                  setErrors(prev => ({ ...prev, firstName: undefined }));
                }
              }}
              onLastNameChange={(value) => {
                setLastName(value);
                if (errors.lastName) {
                  setErrors(prev => ({ ...prev, lastName: undefined }));
                }
              }}
              onEmailChange={(value) => {
                setEmail(value);
                if (errors.email) {
                  setErrors(prev => ({ ...prev, email: undefined }));
                }
              }}
              onPasswordChange={(value) => {
                setPassword(value);
                if (errors.password) {
                  setErrors(prev => ({ ...prev, password: undefined }));
                }
              }}
              onConfirmPasswordChange={(value) => {
                setConfirmPassword(value);
                if (errors.confirmPassword) {
                  setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                }
              }}
              onAcceptedTermsChange={(value) => {
                setAcceptedTerms(value);
                if (errors.terms) {
                  setErrors(prev => ({ ...prev, terms: undefined }));
                }
              }}
              onAcceptedDataProcessingChange={(value) => {
                setAcceptedDataProcessing(value);
                if (errors.terms) {
                  setErrors(prev => ({ ...prev, terms: undefined }));
                }
              }}
              onSubmit={handleEmailRegister}
              onBack={() => setAuthMethod('selection')}
              onSwitchToLogin={() => setAuthMethod('email-login')}
              isLoading={isLoading}
              errors={errors}
              onBlur={handleBlur}
              isEmailRequired={true}
              showPasswordFields={true}
              submitButtonText="Create Account"
              loadingText="Creating account..."
            />
          )}

          {/* Guest Form */}
          {authMethod === 'guest' && (
            <ProfileForm
              firstName={firstName}
              lastName={lastName}
              email={email}
              acceptedTerms={acceptedTerms}
              acceptedDataProcessing={acceptedDataProcessing}
              onFirstNameChange={(value) => {
                setFirstName(value);
                if (errors.firstName) {
                  setErrors(prev => ({ ...prev, firstName: undefined }));
                }
              }}
              onLastNameChange={(value) => {
                setLastName(value);
                if (errors.lastName) {
                  setErrors(prev => ({ ...prev, lastName: undefined }));
                }
              }}
              onEmailChange={(value) => {
                setEmail(value);
                if (errors.email) {
                  setErrors(prev => ({ ...prev, email: undefined }));
                }
              }}
              onAcceptedTermsChange={(value) => {
                setAcceptedTerms(value);
                if (errors.terms) {
                  setErrors(prev => ({ ...prev, terms: undefined }));
                }
              }}
              onAcceptedDataProcessingChange={(value) => {
                setAcceptedDataProcessing(value);
                if (errors.terms) {
                  setErrors(prev => ({ ...prev, terms: undefined }));
                }
              }}
              onSubmit={handleSubmit}
              onBack={() => setAuthMethod('selection')}
              isLoading={isLoading}
              errors={errors}
              onBlur={handleBlur}
              firstNameRef={firstNameRef}
              isEmailRequired={false}
              showPasswordFields={false}
              submitButtonText="Create ID"
              loadingText="Creating ID..."
            />
          )}

          {/* Required Message - shown when modal is non-dismissible */}
          {required && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-[10px] text-center text-gray-500 font-mono uppercase tracking-widest">
                🎯 Create your profile to get started
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
