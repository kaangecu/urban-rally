interface LoginMethodSelectorProps {
  onSelectGuest: () => void;
  onSelectEmail: () => void;
  onSelectGoogle: () => void;
  isLoading: boolean;
}

export function LoginMethodSelector({ 
  onSelectGuest, 
  onSelectEmail, 
  onSelectGoogle,
  isLoading 
}: LoginMethodSelectorProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-400 text-center mb-4">Choose how you want to sign in:</p>
      
      {/* Guest Account Button */}
      <button
        type="button"
        onClick={onSelectGuest}
        disabled={isLoading}
        className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-gray-700 to-gray-600 p-[1px] font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        <div className="relative flex items-center justify-center gap-3 rounded-xl bg-gray-900/80 backdrop-blur-md py-4 text-sm font-bold uppercase tracking-wider transition-colors group-hover:bg-transparent">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Continue as Guest
        </div>
      </button>

      {/* Email Sign In Button */}
      <button
        type="button"
        onClick={onSelectEmail}
        disabled={isLoading}
        className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 p-[1px] font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        <div className="relative flex items-center justify-center gap-3 rounded-xl bg-gray-900/80 backdrop-blur-md py-4 text-sm font-bold uppercase tracking-wider transition-colors group-hover:bg-transparent">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Sign in with Email
        </div>
      </button>

      {/* Google Sign In Button */}
      <button
        type="button"
        onClick={onSelectGoogle}
        disabled={isLoading}
        className="group relative w-full overflow-hidden rounded-xl bg-white p-[1px] font-bold text-gray-900 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        <div className="relative flex items-center justify-center gap-3 rounded-xl bg-white py-4 text-sm font-bold uppercase tracking-wider">
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Signing in...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </>
          )}
        </div>
      </button>
    </div>
  );
}
