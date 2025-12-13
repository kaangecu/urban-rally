/**
 * EventCodeEntry Component
 * Allows users to enter event code to browse teams
 */

import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateEventCode } from '../../services/event.service';
import type { Event } from '../../types/schema';

export function EventCodeEntry() {
  const [eventCode, setEventCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!eventCode.trim()) {
      setError('Please enter an event code');
      return;
    }
    
    if (eventCode.length < 6) {
      setError('Event code must be at least 6 characters');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Validate event code
      const eventData = await validateEventCode(eventCode);
      
      if (!eventData) {
        setError('Invalid event code. Please check and try again.');
        return;
      }
      
      // Event found! Show confirmation, then navigate
      setEvent(eventData);
      
      // Navigate to team browser after brief delay
      setTimeout(() => {
        navigate(`/tenant/${eventData.tenantId}/event/${eventData.id}/teams`);
      }, 800);
      
    } catch (err) {
      console.error('Event code validation error:', err);
      setError('Failed to validate event code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to options
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎪</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Browse Event
            </h1>
            <p className="text-gray-600">
              Enter your event code to see all teams
            </p>
          </div>

          {/* Event Code Form */}
          {!event ? (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label htmlFor="eventCode" className="block text-sm font-semibold text-gray-700 mb-2">
                  Event Code
                </label>
                <input
                  id="eventCode"
                  type="text"
                  value={eventCode}
                  onChange={(e) => {
                    setEventCode(e.target.value.toUpperCase());
                    setError(null);
                  }}
                  placeholder="e.g., BERLIN2025"
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none font-mono text-center text-2xl tracking-widest uppercase"
                  maxLength={12}
                  disabled={isSubmitting}
                  autoFocus
                />
                {error && (
                  <div className="mt-3 p-3 bg-red-50 border-2 border-red-200 rounded-lg">
                    <p className="text-sm text-red-600 font-medium">{error}</p>
                  </div>
                )}
              </div>

              {/* Info Box */}
              <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <p className="text-sm text-blue-900 font-semibold mb-1">
                  💡 What's an event code?
                </p>
                <p className="text-sm text-blue-700">
                  Your organizer shared a code like "BERLIN2025" or "RALLY2025". Enter it here to see all teams and join one.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !eventCode.trim() || eventCode.length < 6}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Validating...
                  </span>
                ) : (
                  'Continue to Teams'
                )}
              </button>
            </form>
          ) : (
            /* Success State */
            <div className="text-center py-8">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Event Found!
                </h2>
                <p className="text-xl text-gray-700 font-semibold mb-1">
                  {event.name}
                </p>
                <p className="text-gray-600">
                  Loading teams...
                </p>
              </div>
              
              <div className="flex items-center justify-center space-x-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an event code?{' '}
            <button
              onClick={() => navigate('/join/team')}
              className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
            >
              Try team code instead
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
