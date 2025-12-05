/**
 * Progressive Multi-Step Team Login Form
 * GDPR-compliant with smooth animations and gamified UX
 */

import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  UserCircle, 
  Mail, 
  Shield, 
  FileText,
  Sparkles,
  Trophy
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getTeamByAccessCode, linkTeamToUser, updateTeamProfile } from '../../services/team.service';
import { getTenantById, applyTenantTheme } from '../../services/tenant.service';
import { LegalModal } from '../../components/legal/LegalModal';
import { TermsOfService } from '../../components/legal/TermsOfService';
import { PrivacyPolicy } from '../../components/legal/PrivacyPolicy';

// Form data interface
interface LoginFormData {
  accessCode: string;
  displayName: string;
  email: string;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
}

// Error messages interface
interface LoginFormErrors {
  accessCode?: string;
  displayName?: string;
  email?: string;
  acceptedTerms?: string;
  acceptedPrivacy?: string;
}

// Step configuration
const STEPS = [
  { id: 1, title: 'Team Code', icon: Trophy },
  { id: 2, title: 'Your Name', icon: UserCircle },
  { id: 3, title: 'Email (Optional)', icon: Mail },
  { id: 4, title: 'Legal Consent', icon: Shield },
] as const;

export function TeamCodeLogin() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<LoginFormData>({
    accessCode: '',
    displayName: '',
    email: '',
    acceptedTerms: false,
    acceptedPrivacy: false,
  });
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const { setTeam, setTenant, setError, setLoading, error, isLoading } = useAuthStore();

  // Validation for each step
  const validateStep = (step: number): boolean => {
    const newErrors: LoginFormErrors = {};
    
    switch (step) {
      case 1: // Team Code
        if (!formData.accessCode.trim()) {
          newErrors.accessCode = 'Team code is required';
        } else if (formData.accessCode.length < 3) {
          newErrors.accessCode = 'Team code must be at least 3 characters';
        }
        break;
      
      case 2: // Display Name
        if (!formData.displayName.trim()) {
          newErrors.displayName = 'Your name is required';
        } else if (formData.displayName.length < 2) {
          newErrors.displayName = 'Name must be at least 2 characters';
        } else if (formData.displayName.length > 50) {
          newErrors.displayName = 'Name must be less than 50 characters';
        }
        break;
      
      case 3: // Email (optional but validate if provided)
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Please enter a valid email address';
        }
        break;
      
      case 4: // Consent
        if (!formData.acceptedTerms) {
          newErrors.acceptedTerms = 'You must accept the Terms of Service';
        }
        if (!formData.acceptedPrivacy) {
          newErrors.acceptedPrivacy = 'You must accept the Privacy Policy';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next step
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  // Handle previous step
  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setErrors({});
  };

  // Handle final form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(4)) {
      return;
    }
    
    setIsSubmitting(true);
    setLoading(true);
    
    try {
      // 1. Find team by access code
      const team = await getTeamByAccessCode(formData.accessCode);
      
      if (!team) {
        setError('Invalid team code. Please check and try again.');
        setCurrentStep(1); // Go back to team code step
        return;
      }
      
      // 2. Check if team is active
      if (!team.isActive) {
        setError('This team has been deactivated. Contact your organizer.');
        return;
      }
      
      // 3. Get tenant/organization info
      const tenant = await getTenantById(team.tenantId);
      
      if (!tenant || !tenant.isActive) {
        setError('Event is not currently active.');
        return;
      }
      
      // 4. Link team to Firebase Anonymous Auth
      await linkTeamToUser(team.id);
      
      // 5. Update team profile with user data and GDPR consent
      // Build profile data - conditionally include email only if provided
      const baseProfileData = {
        displayName: formData.displayName,
        consentGiven: {
          terms: true,
          privacy: true,
          termsVersion: '1.0',
          privacyVersion: '1.0',
          termsAcceptedAt: new Date(),
          privacyAcceptedAt: new Date(),
        },
      };
      
      // Conditionally add email to create proper TypeScript type
      const profileData = formData.email && formData.email.trim() !== ''
        ? { ...baseProfileData, email: formData.email }
        : baseProfileData;
      
      await updateTeamProfile(team.id, profileData);
      
      // 6. Apply tenant branding
      applyTenantTheme(tenant);
      
      // 7. Update auth store
      const updatedTeam = {
        ...team,
        displayName: formData.displayName,
        ...(formData.email && formData.email.trim() !== '' && { email: formData.email }),
      };
      
      setTenant(tenant);
      setTeam(updatedTeam);
      
      console.log('✅ Team logged in with profile:', formData.displayName);
      
    } catch (err) {
      console.error('Login error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 p-4">
      <div className="w-full max-w-2xl">
        {/* Logo/Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-block mb-4">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Sparkles className="w-16 h-16 text-yellow-500 mx-auto" />
            </motion.div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            UrbanRally
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Join the adventure in {STEPS[currentStep - 1].title.toLowerCase()}
          </p>
        </motion.div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <motion.div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currentStep > step.id
                      ? 'bg-green-500 text-white'
                      : currentStep === step.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {currentStep > step.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </motion.div>
                {index < STEPS.length - 1 && (
                  <div className="flex-1 h-1 mx-2 bg-gray-300 dark:bg-gray-700 relative overflow-hidden">
                    <motion.div
                      className="absolute inset-0 bg-green-500"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: currentStep > step.id ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ transformOrigin: 'left' }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            Step {currentStep} of {STEPS.length}
          </div>
        </div>

        {/* Form Card */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 relative overflow-hidden"
          layout
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl -z-0" />
          
          <form onSubmit={handleSubmit} className="relative z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
              >
                {/* Step 1: Team Code */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Enter Your Team Code
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        You received this from your event organizer
                      </p>
                    </div>

                    <div>
                      <label 
                        htmlFor="accessCode" 
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Team Access Code *
                      </label>
                      <input
                        id="accessCode"
                        type="text"
                        value={formData.accessCode}
                        onChange={(e) => {
                          setFormData({ ...formData, accessCode: e.target.value.toUpperCase() });
                          setErrors({ ...errors, accessCode: undefined });
                        }}
                        placeholder="e.g., BERLIN2025"
                        className={`w-full px-4 py-4 text-lg font-mono tracking-wider uppercase border-2 rounded-lg transition-all ${
                          errors.accessCode
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                        } dark:bg-gray-700 dark:text-white`}
                        autoComplete="off"
                        maxLength={20}
                        autoFocus
                      />
                      {errors.accessCode && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2 text-sm text-red-600 dark:text-red-400"
                        >
                          {errors.accessCode}
                        </motion.p>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 2: Display Name */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <UserCircle className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        What's Your Name?
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        This is how you'll appear in the game
                      </p>
                    </div>

                    <div>
                      <label 
                        htmlFor="displayName" 
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Display Name *
                      </label>
                      <input
                        id="displayName"
                        type="text"
                        value={formData.displayName}
                        onChange={(e) => {
                          setFormData({ ...formData, displayName: e.target.value });
                          setErrors({ ...errors, displayName: undefined });
                        }}
                        placeholder="e.g., Alex Smith"
                        className={`w-full px-4 py-4 text-lg border-2 rounded-lg transition-all ${
                          errors.displayName
                            ? 'border-red-500 focus:ring-red-500'
                            : formData.displayName.length >= 2
                            ? 'border-green-500 focus:ring-green-500'
                            : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                        } dark:bg-gray-700 dark:text-white`}
                        maxLength={50}
                        autoFocus
                        autoComplete="name"
                      />
                      {errors.displayName && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2 text-sm text-red-600 dark:text-red-400"
                        >
                          {errors.displayName}
                        </motion.p>
                      )}
                      {formData.displayName.length >= 2 && !errors.displayName && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center"
                        >
                          <Check className="w-4 h-4 mr-1" /> Looks great!
                        </motion.p>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3: Email */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <Mail className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Email Address
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        Optional - for event updates and notifications
                      </p>
                    </div>

                    <div>
                      <label 
                        htmlFor="email" 
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Email (Optional)
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          setErrors({ ...errors, email: undefined });
                        }}
                        placeholder="e.g., alex@example.com"
                        className={`w-full px-4 py-4 text-lg border-2 rounded-lg transition-all ${
                          errors.email
                            ? 'border-red-500 focus:ring-red-500'
                            : formData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
                            ? 'border-green-500 focus:ring-green-500'
                            : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                        } dark:bg-gray-700 dark:text-white`}
                        autoFocus
                        autoComplete="email"
                      />
                      {errors.email && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2 text-sm text-red-600 dark:text-red-400"
                        >
                          {errors.email}
                        </motion.p>
                      )}
                      {formData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center"
                        >
                          <Check className="w-4 h-4 mr-1" /> Valid email
                        </motion.p>
                      )}
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        You can skip this step if you prefer
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 4: Consent */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <Shield className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Privacy & Legal
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        GDPR-compliant consent required
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Terms Checkbox */}
                      <div className={`border-2 rounded-lg p-4 transition-all ${
                        errors.acceptedTerms ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                      }`}>
                        <label className="flex items-start cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.acceptedTerms}
                            onChange={(e) => {
                              setFormData({ ...formData, acceptedTerms: e.target.checked });
                              setErrors({ ...errors, acceptedTerms: undefined });
                            }}
                            className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                            I accept the{' '}
                            <button
                              type="button"
                              onClick={() => setShowTerms(true)}
                              className="text-blue-600 dark:text-blue-400 underline hover:text-blue-700 font-medium inline-flex items-center"
                            >
                              Terms of Service <FileText className="w-4 h-4 ml-1" />
                            </button>
                            {' '}*
                          </span>
                        </label>
                        {errors.acceptedTerms && (
                          <p className="mt-2 text-sm text-red-600 dark:text-red-400 ml-8">
                            {errors.acceptedTerms}
                          </p>
                        )}
                      </div>

                      {/* Privacy Checkbox */}
                      <div className={`border-2 rounded-lg p-4 transition-all ${
                        errors.acceptedPrivacy ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                      }`}>
                        <label className="flex items-start cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.acceptedPrivacy}
                            onChange={(e) => {
                              setFormData({ ...formData, acceptedPrivacy: e.target.checked });
                              setErrors({ ...errors, acceptedPrivacy: undefined });
                            }}
                            className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                            I accept the{' '}
                            <button
                              type="button"
                              onClick={() => setShowPrivacy(true)}
                              className="text-blue-600 dark:text-blue-400 underline hover:text-blue-700 font-medium inline-flex items-center"
                            >
                              Privacy Policy <Shield className="w-4 h-4 ml-1" />
                            </button>
                            {' '}(GDPR-compliant) *
                          </span>
                        </label>
                        {errors.acceptedPrivacy && (
                          <p className="mt-2 text-sm text-red-600 dark:text-red-400 ml-8">
                            {errors.acceptedPrivacy}
                          </p>
                        )}
                      </div>

                      {/* GDPR Notice */}
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <p className="text-xs text-green-800 dark:text-green-200">
                          <strong>🇪🇺 GDPR Notice:</strong> Your data is processed in accordance with 
                          German and EU data protection laws. You can withdraw consent or request 
                          data deletion at any time by contacting privacy@urbanrally.app
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 mt-8">
              {currentStep > 1 && (
                <motion.button
                  type="button"
                  onClick={handleBack}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center min-h-[56px]"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </motion.button>
              )}
              
              {currentStep < STEPS.length ? (
                <motion.button
                  type="button"
                  onClick={handleNext}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center min-h-[56px] shadow-lg"
                >
                  Continue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </motion.button>
              ) : (
                <motion.button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center min-h-[56px] shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Joining...
                    </>
                  ) : (
                    <>
                      Start Adventure
                      <Sparkles className="w-5 h-5 ml-2" />
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </form>
        </motion.div>

        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400"
        >
          <p>Need help? Contact your event organizer</p>
        </motion.div>
      </div>

      {/* Legal Modals */}
      <LegalModal
        isOpen={showTerms}
        onClose={() => setShowTerms(false)}
        title="Terms of Service"
      >
        <TermsOfService />
      </LegalModal>

      <LegalModal
        isOpen={showPrivacy}
        onClose={() => setShowPrivacy(false)}
        title="Privacy Policy"
      >
        <PrivacyPolicy />
      </LegalModal>
    </div>
  );
}
