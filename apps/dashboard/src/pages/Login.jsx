import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkEmail, login as apiLogin, requestAccess } from '../api/authApi';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export default function Login() {
  const [step, setStep] = useState(1); // 1: Email, 2: Login, 3: Request Access, 4: Success Message
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { isValid: false, message: '' };
    if (pwd.length < 8) return { isValid: false, message: 'Minimum 8 characters required' };
    if (!/^[a-zA-Z0-9]/.test(pwd)) return { isValid: false, message: 'First character must be a letter or number' };
    if (!/[a-zA-Z]/.test(pwd)) return { isValid: false, message: 'Must contain at least one letter' };
    if (!/[0-9]/.test(pwd)) return { isValid: false, message: 'Must contain at least one number' };
    if (!/[^a-zA-Z0-9]/.test(pwd)) return { isValid: false, message: 'Must contain at least one special character' };
    return { isValid: true, message: 'Strong password' };
  };

  const pwdStatus = getPasswordStrength(password);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!email.endsWith('@lafrontiere.co.zw')) {
      setError('Only @lafrontiere.co.zw emails are allowed.');
      return;
    }

    setLoading(true);
    try {
      const res = await checkEmail(email);
      if (res.exists) {
        setStep(2); // Ask for password
      } else {
        setStep(3); // Request access form
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiLogin(email, password);
      login(res.user, res.token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await requestAccess(name, email, password);
      setStep(4);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="mb-6 flex justify-center">
          <img src="https://i.postimg.cc/SN4R6HBX/light-logo.png" alt="Log Viewer Agent" className="h-28 rounded-lg block dark:hidden" />
          <img src="https://i.postimg.cc/GhRtF6WH/main-logo.png" alt="Log Viewer Agent" className="h-28 rounded-lg hidden dark:block" />
        </div>
        <h2 className="mt-2 text-center text-xl font-semibold text-gray-900 dark:text-gray-100">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
          Please enter your details
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-900 py-8 px-4 border border-gray-200 dark:border-gray-800 rounded-sm sm:px-10 transition-colors duration-200">
          {error && (
            <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 px-4 py-3 rounded-sm mb-6 text-sm">
              {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email address</label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@lafrontiere.co.zw"
                />
              </div>
              <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                {loading ? 'Checking...' : 'Continue'}
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email address</label>
                <Input type="email" readOnly value={email} className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                {loading ? 'Logging in...' : 'Sign In'}
              </Button>
              <div className="text-center mt-4">
                <button type="button" onClick={() => setStep(1)} className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                  Use a different account
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleRequestSubmit} className="space-y-6">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                Your email was not found. Please request access to continue.
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <Input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email address</label>
                <Input type="email" readOnly value={email} className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Desired Password</label>
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {password && (
                  <p className={`mt-2 text-xs ${pwdStatus.isValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {pwdStatus.message}
                  </p>
                )}
              </div>
              <Button type="submit" variant="primary" className="w-full" disabled={loading || !pwdStatus.isValid}>
                {loading ? 'Submitting...' : 'Request Access'}
              </Button>
              <div className="text-center mt-4">
                <button type="button" onClick={() => setStep(1)} className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {step === 4 && (
            <div className="text-center py-4">
              <div className="text-green-600 dark:text-green-400 font-medium mb-3">Request Submitted</div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Please wait for an admin to approve your account. You will be able to log in once approved.
              </p>
              <Button onClick={() => setStep(1)} className="w-full">
                Back to Login
              </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
