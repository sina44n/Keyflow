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
 * - Switch between Login and Create Account
 * - Restrained social links footer
 * - Full integration with real Knox token Django backend
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { authAPI } from '../utils/api';
import authIllustration from '../assets/auth-illustration.jpg';
import {
  Keyboard,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User as UserIcon,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export const AuthPage = ({ mode = 'login' }) => {
  const { login, register } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const isLogin = mode === 'login';
  const isRegister = mode === 'register';
  const isForgot = mode === 'forgot';

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
        // Send reset email via API
        await authAPI.passwordResetRequest(email);
        setSuccessMessage('If that email exists in our system, password reset instructions have been sent.');
      }
    } catch (err) {
      const data = err.response?.data;
      if (typeof data === 'string') {
        setErrorMessage(data);
      } else if (data?.non_field_errors) {
        setErrorMessage(data.non_field_errors.join(' '));
      } else if (data?.email) {
        setErrorMessage(Array.isArray(data.email) ? data.email.join(' ') : data.email);
      } else if (data?.username) {
        setErrorMessage(Array.isArray(data.username) ? data.username.join(' ') : data.username);
      } else if (data?.password) {
        setErrorMessage(Array.isArray(data.password) ? data.password.join(' ') : data.password);
      } else if (data?.error) {
        setErrorMessage(data.error);
      } else {
        setErrorMessage('Authentication failed. Please verify your details and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
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
                </h1>
                <p className="text-xs text-gray-500 mt-1">
                  {isLogin && (t('auth.login.subtitle') || 'Enter your credentials to access your terminal.')}
                  {isRegister && (t('auth.register.subtitle') || 'Join KEYFLOW and master touch typing with precision.')}
                  {isForgot && (t('auth.forgot.subtitle') || 'Enter your email to receive a password reset link.')}
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

                {!isForgot && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-gray-700">
                        {t('auth.password') || 'Password'}
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

                {isRegister && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {t('auth.confirmPassword') || 'Confirm Password'}
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
                {isForgot && (
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

              {/* Restrained Social Links (Exact visual match from reference image) */}
              <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-center gap-3">
                <span className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors text-[11px] font-bold">
                  f
                </span>
                <span className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors text-[11px] font-bold">
                  𝕏
                </span>
                <span className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors text-[11px] font-bold">
                  in
                </span>
                <span className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors text-[11px] font-bold">
                  ig
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
