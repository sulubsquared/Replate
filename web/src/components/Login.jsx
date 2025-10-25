import { useState } from 'react';
import { Mail, ChefHat } from 'lucide-react';

const Login = ({ supabase }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        setMessage('Error: ' + error.message);
      } else {
        setMessage('Check your email for the login link!');
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="logo text-6xl mb-4">🍽️</div>
          <h2 className="text-4xl font-bold text-burgundy-700 mb-2">Replate</h2>
          <p className="text-lg text-gray-600 mb-8">
            Plan meals from what's already in your pantry
          </p>
        </div>

        <div className="card">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input pl-10"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <ChefHat className="h-5 w-5" />
                  <span>Send Magic Link</span>
                </>
              )}
            </button>

            {message && (
              <div className={`text-center text-sm ${
                message.includes('Error') ? 'text-red-600' : 'text-green-600'
              }`}>
                {message}
              </div>
            )}
          </form>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            We'll send you a secure login link to your email
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
