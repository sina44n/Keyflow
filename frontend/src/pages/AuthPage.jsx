/**
 * KEYFLOW Masterpiece Authentication Page
 * =======================================
 * Faithful implementation of the attached visual reference:
 * - Full-screen dark blurred backdrop
 * - Centered split card with thick rounded white outer border
 * - Left panel: cinematic typing character illustration with KEYFLOW badge
 * - Right panel: clean white authentication form with rounded fields
 * - Eye password toggle
 * - Prominent orange primary action button (#F95700)
 * - Switch between Login, Create Account, Forgot Password, and Reset Password
 * - Working "Continue with Google" OAuth integration
 * - Interactive social platform icons with status notifications
 * - Full integration with real Knox token Django backend and PostgreSQL
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { authAPI } from '../utils/api';
import authIllustration from '../assets/auth-illustration.jpg';
import {
  Keyboard,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export const AuthPage = ({ mode = 'login' }) => {
  const { login, register, loginWithGoogle } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const searchParams = new URLSearchParams(location.search);
  const resetToken = params.token || searchParams.get('token') || '';

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [providerNotice, setProviderNotice] = useState('');

  const isLogin = mode === 'login';
  const isRegister = mode === 'register';
  const isForgot = mode === 'forgot';
  const isReset = mode === 'reset';

  const destination = location.state?.from || '/academy';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      if (isLogin) {
        await login({ email, password });
        navigate(destination, { replace: true });
      } else if (isRegister) {
        if (password.length < 8) {
          setErrorMessage('Password must be at least 8 characters long.');
          setIsSubmitting(false);
          return;
        }
        if (password !== password2) {
          setErrorMessage('Passwords do not match.');
          setIsSubmitting(false);
          return;
        }
        await register({
          email,
          username: username.trim().toLowerCase().replace(/\s+/g, '_'),
          password,
          password2,
        });
        navigate(destination, { replace: true });
      } else if (isForgot) {
        await authAPI.passwordResetRequest(email);
        setSuccessMessage('If that email exists in our system, password reset instructions have been sent.');
      } else if (isReset) {
        if (!resetToken) {
          setErrorMessage('Password reset token is missing. Please check your reset link or request a new one.');
          setIsSubmitting(false);
          return;
        }
        if (password.length < 8) {
          setErrorMessage('Password must be at least 8 characters long.');
          setIsSubmitting(false);
          return;
        }
        if (password !== password2) {
          setErrorMessage('Passwords do not match.');
          setIsSubmitting(false);
          return;
        }
        await authAPI.passwordResetConfirm(resetToken, password);
        setSuccessMessage('Password reset successfully! Redirecting to sign in...');
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 1800);
      }
    } catch (err) {
      const data = err.response?.data;
      if (typeof data === 'string') {
        setErrorMessage(data);
      } else if (data?.non_field_errors) {
        setErrorMessage(data.non_field_errors.join(' '));
      } else if (data?.detail) {
        setErrorMessage(data.detail);
      } else if (data?.error) {
        setErrorMessage(data.error);
      } else if (data?.email) {
        setErrorMessage(Array.isArray(data.email) ? data.email.join(' ') : data.email);
      } else if (data?.username) {
        setErrorMessage(Array.isArray(data.username) ? data.username.join(' ') : data.username);
      } else if (data?.password) {
        setErrorMessage(Array.isArray(data.password) ? data.password.join(' ') : data.password);
      } else if (data?.password2) {
        setErrorMessage(Array.isArray(data.password2) ? data.password2.join(' ') : data.password2);
      } else if (err.message && err.message.includes('Network Error')) {
        setErrorMessage('Cannot reach KEYFLOW API server. Please check your connection.');
      } else {
        setErrorMessage('Authentication failed. Please verify your details and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setIsGoogleLoading(true);
    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (typeof window !== 'undefined' && window.google?.accounts?.id && clientId) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            try {
              await loginWithGoogle(response.credential);
              navigate(destination, { replace: true });
            } catch (err) {
              setErrorMessage(err.response?.data?.error || 'Google authentication failed.');
            } finally {
              setIsGoogleLoading(false);
            }
          },
        });
        window.google.accounts.id.prompt();
      } else {
        setErrorMessage(
          'Google OAuth is configured on the backend. To enable frontend Google Sign-In, configure VITE_GOOGLE_CLIENT_ID in your environment.'
        );
      }
    } catch {
      setErrorMessage('Google authentication could not be completed.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSocialClick = (provider) => {
    setProviderNotice(
      `Sign-in with ${provider} is currently in preview. To sign in now, please use Google or your registered email address.`
    );
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden bg-[#0d0f12]">
      {/* ------------------------------------------------------------------- */}
      {/* Full-viewport softly blurred background image                      */}
      {/* ------------------------------------------------------------------- */}
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-3xl scale-125 opacity-35 brightness-50 pointer-events-none"
        style={{ backgroundImage: `url(${authIllustration})` }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xl pointer-events-none" aria-hidden="true" />

      {/* ------------------------------------------------------------------- */}
      {/* Centered Split Authentication Card                                  */}
      {/* Thick white outer border, large rounded corners                      */}
      {/* ------------------------------------------------------------------- */}
      <div className="relative z-10 w-full max-w-[940px] bg-white rounded-[32px] p-2.5 sm:p-3 shadow-[0_20px_70px_rgba(0,0,0,0.65)] border-4 border-white transition-all">
        <div className="grid grid-cols-1 md:grid-cols-2 rounded-[24px] overflow-hidden min-h-[580px]">
          {/* ----------------------------------------------------------------- */}
          {/* LEFT PANEL: Cinematic Typing Illustration                         */}
          {/* ----------------------------------------------------------------- */}
          <div className="relative hidden md:block h-full min-h-[580px] rounded-[24px] overflow-hidden select-none bg-slate-900">
            <img
              src={authIllustration}
              alt="KEYFLOW Mechanical Precision Typing"
              className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
            />
            {/* Top brand badge */}
            <div className="absolute top-6 left-6 flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-black/45 backdrop-blur-md border border-white/20 shadow-lg">
              <div className="w-5 h-5 rounded-md bg-orange-500 flex items-center justify-center">
                <Keyboard className="w-3 h-3 text-white" />
              </div>
              <span className="font-mono text-xs font-black tracking-widest text-white uppercase">KEYFLOW</span>
            </div>

            {/* Bottom info banner */}
            <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/85 via-black/45 to-transparent text-white">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-orange-500/25 border border-orange-400/40 text-orange-200">
                Neuromuscular Mastery
              </span>
              <h3 className="text-sm font-semibold mt-2 text-white/95">
                4,200 progressive levels • 7 arcade games • sub-millisecond telemetry
              </h3>
            </div>
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* RIGHT PANEL: Clean White Authentication Form                      */}
          {/* ----------------------------------------------------------------- */}
          <div className="bg-white text-gray-900 p-6 sm:p-8 md:p-10 flex flex-col justify-between rounded-[24px]">
            <div className="w-full max-w-[360px] mx-auto my-auto">
              {/* Heading */}
              <div className="text-center mb-6">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                  {isLogin && (t('auth.login.title') || 'Log In')}
                  {isRegister && (t('auth.register.title') || 'Create Account')}
                  {isForgot && (t('auth.forgot.title') || 'Reset Password')}
                  {isReset && 'Set New Password'}
                </h1>
                <p className="text-xs text-gray-500 mt-1">
                  {isLogin && (t('auth.login.subtitle') || 'Enter your credentials to access your terminal.')}
                  {isRegister && (t('auth.register.subtitle') || 'Join KEYFLOW and master touch typing with precision.')}
                  {isForgot && (t('auth.forgot.subtitle') || 'Enter your email to receive a password reset link.')}
                  {isReset && 'Enter your new secure password below to regain access.'}
                </p>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Success Alert */}
              {successMessage && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-700 animate-in fade-in duration-150">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Continue with Google (Login and Register modes) */}
              {(isLogin || isRegister) && (
                <>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isSubmitting || isGoogleLoading}
                    className="w-full py-2.5 px-4 rounded-xl border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-xs transition-all flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                  >
                    {isGoogleLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                    ) : (
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                    )}
                    <span>Continue with Google</span>
                  </button>

                  <div className="relative my-4 text-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-[11px] uppercase">
                      <span className="bg-white px-2 text-gray-400 font-medium">or continue with email</span>
                    </div>
                  </div>
                </>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {isRegister && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {t('auth.fullName') || 'Full Name / Username'}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. Alex Hunter"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder:text-gray-400 text-sm focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                      />
                    </div>
                  </div>
                )}

                {!isReset && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {t('auth.emailAddress') || 'Email Address'}
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder:text-gray-400 text-sm focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                      />
                    </div>
                  </div>
                )}

                {!isForgot && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-gray-700">
                        {isReset ? 'New Password' : (t('auth.password') || 'Password')}
                      </label>
                      {isLogin && (
                        <Link
                          to="/forgot-password"
                          className="text-[11px] text-gray-500 hover:text-orange-600 font-medium transition-colors"
                        >
                          {t('auth.login.forgotPassword') || 'Forgot password?'}
                        </Link>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder:text-gray-400 text-sm focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {(isRegister || isReset) && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {isReset ? 'Confirm New Password' : (t('auth.confirmPassword') || 'Confirm Password')}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword2 ? 'text' : 'password'}
                        required
                        value={password2}
                        onChange={(e) => setPassword2(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder:text-gray-400 text-sm focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword2(!showPassword2)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                        aria-label={showPassword2 ? 'Hide confirm password' : 'Show confirm password'}
                      >
                        {showPassword2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Primary Orange Button (#F95700) */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-3 px-6 rounded-full bg-[#F95700] hover:bg-[#e04e00] active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-orange-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>
                      {isLogin && (t('auth.login.button') || 'Log In')}
                      {isRegister && (t('auth.register.button') || 'Create Account')}
                      {isForgot && (t('auth.forgot.button') || 'Send Reset Link')}
                      {isReset && 'Update Password'}
                    </span>
                  )}
                </button>
              </form>

              {/* Mode switch link */}
              <div className="mt-5 text-center text-xs text-gray-600">
                {isLogin && (
                  <p>
                    {t('auth.login.noAccount') || "Don't have an account?"}{' '}
                    <Link
                      to="/register"
                      className="font-semibold text-[#F95700] hover:underline"
                    >
                      {t('auth.login.createAccount') || 'Create Account'}
                    </Link>
                  </p>
                )}
                {isRegister && (
                  <p>
                    {t('auth.register.hasAccount') || 'Already have an account?'}{' '}
                    <Link
                      to="/login"
                      className="font-semibold text-[#F95700] hover:underline"
                    >
                      {t('auth.register.logIn') || 'Log in'}
                    </Link>
                  </p>
                )}
                {(isForgot || isReset) && (
                  <p>
                    <Link
                      to="/login"
                      className="font-semibold text-[#F95700] hover:underline"
                    >
                      {t('auth.forgot.backToLogin') || 'Back to Login'}
                    </Link>
                  </p>
                )}
              </div>

              {/* Restrained Social Links (Interactive with transparent notice) */}
              <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col items-center gap-2">
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleSocialClick('Facebook')}
                    title="Sign in with Facebook"
                    className="w-7 h-7 rounded-full border border-gray-200 hover:border-blue-400 hover:text-blue-600 flex items-center justify-center text-gray-400 transition-colors text-[11px] font-bold cursor-pointer"
                  >
                    f
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSocialClick('X')}
                    title="Sign in with X"
                    className="w-7 h-7 rounded-full border border-gray-200 hover:border-gray-500 hover:text-gray-900 flex items-center justify-center text-gray-400 transition-colors text-[11px] font-bold cursor-pointer"
                  >
                    𝕏
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSocialClick('LinkedIn')}
                    title="Sign in with LinkedIn"
                    className="w-7 h-7 rounded-full border border-gray-200 hover:border-blue-500 hover:text-blue-700 flex items-center justify-center text-gray-400 transition-colors text-[11px] font-bold cursor-pointer"
                  >
                    in
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSocialClick('Instagram')}
                    title="Sign in with Instagram"
                    className="w-7 h-7 rounded-full border border-gray-200 hover:border-pink-400 hover:text-pink-600 flex items-center justify-center text-gray-400 transition-colors text-[11px] font-bold cursor-pointer"
                  >
                    ig
                  </button>
                </div>
                {providerNotice && (
                  <div className="mt-2 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg text-center animate-in fade-in max-w-[320px]">
                    {providerNotice}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
