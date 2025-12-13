/**
 * LoginPage Component
 * Supports both team code login and recovery code login
 */

import { useState } from 'react';
import { TeamCodeLogin } from '../../features/auth/TeamCodeLogin';
import { RecoveryCodeLogin } from './RecoveryCodeLogin';

export function LoginPage() {
  const [loginMode, setLoginMode] = useState<'team-code' | 'recovery-code'>('team-code');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {loginMode === 'team-code' ? (
          <div>
            <TeamCodeLogin />
            
            {/* Recovery Code Link */}
            <div className="mt-6 text-center">
              <button
                onClick={() => setLoginMode('recovery-code')}
                className="text-sm text-gray-600 hover:text-gray-900 underline"
              >
                Lost access? Use recovery code
              </button>
            </div>
          </div>
        ) : (
          <div>
            <RecoveryCodeLogin />
            
            {/* Back to Team Code Link */}
            <div className="mt-6 text-center">
              <button
                onClick={() => setLoginMode('team-code')}
                className="text-sm text-gray-600 hover:text-gray-900 underline"
              >
                ← Back to team code login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
