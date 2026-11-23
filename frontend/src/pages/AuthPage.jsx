/**
 * KEYFLOW — Masterpiece Authentication Experience (Phase 7.56)
 * ============================================================
 * Exact recreation of the reference video:
 * - Floating rounded white card centered in sunny sky with realistic clouds
 * - Left panel: Interactive 3D Yeti Mascot with smooth mouse tracking,
 *   head yaw/pitch, eye parallax, breathing, autonomous blinking & grass terrain
 * - Bottom-left reference typography: "EXPLORE. LEARN. GROW."
 * - Right panel:
 *   - Mascot icon & small "KEYFLOW" brand label
 *   - Heavy all-caps heading: "WELCOME BACK" (login) / "WELCOME TO KEYFLOW" (register)
 *   - Clean supporting copy: "Enter your email and password to access your account"
 *   - Soft rounded input fields (#f4f6fa) with eye password toggle
 *   - Remember me checkbox & Forgot password link
 *   - Solid black primary action button ("Sign In" / "Create Account")
 *   - White Google OAuth button ("Sign in with Google" / "Continue with Google")
 *   - Bottom navigation link ("Don't have an account? Sign up")
 * - 100% real authentication with Clerk OAuth, email/password, and backend sync
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { SignIn, SignUp } from '@clerk/react';
import { useSignIn } from '@clerk/react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { authAPI } from '../utils/api';
import { YetiCharacter3D } from '../components/auth/YetiCharacter3D';
import { LoginCharacterVideo } from '../components/auth/LoginCharacterVideo';
import {
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

/**
 * Cute Yeti Head Line Mascot Icon
 * Faithfully matches the top branding icon from the reference video
 */
export const YetiMascotIcon = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Swept hair crest tufts */}
    <path
      d="M24 4C20.5 8 17.5 10.5 13 11.5C17.5 13.5 19.5 15.5 19.5 18.5C15 16.5 11 17.5 8 20.5C12 21.5 14.5 24.5 13.5 28.5"
      stroke="#1e293b"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M24 4C27.5 8 30.5 10.5 35 11.5C30.5 13.5 28.5 15.5 28.5 18.5C33 16.5 37 17.5 40 20.5C36 21.5 33.5 24.5 34.5 28.5"
      stroke="#1e293b"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M24 4V17"
      stroke="#1e293b"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    {/* Rounded Head Outline */}
    <path
      d="M10.5 26.5C7.5 29 6 33.5 7 37C8.5 41.5 13 44.5 18.5 45C22.5 45.5 26.5 45.5 30.5 44.8C35.5 44 39.5 41 41 37C42 33 40.5 29 37.5 26.5"
      stroke="#1e293b"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    {/* Icy Blue Face Plate */}
    <ellipse cx="24" cy="32.5" rx="10.5" ry="9" fill="#7ec8e3" stroke="#1e293b" strokeWidth="2" />
    {/* Left Eye */}
    <ellipse cx="20.2" cy="31" rx="2" ry="2.8" fill="#0f172a" />
    <circle cx="19.6" cy="30" r="0.75" fill="#ffffff" />
    {/* Right Eye */}
    <ellipse cx="27.8" cy="31" rx="2" ry="2.8" fill="#0f172a" />
    <circle cx="27.2" cy="30" r="0.75" fill="#ffffff" />
    {/* Small Blue Nose */}
    <ellipse cx="24" cy="34" rx="1.2" ry="0.9" fill="#38bdf8" />
    {/* Gentle Curved Smile */}
    <path
      d="M21.5 36.5C22.8 37.8 25.2 37.8 26.5 36.5"
      stroke="#0369a1"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * Clerk Appearance Preset Matching the Reference Design:
 * - Solid black primary buttons (#000000)
 * - Soft light-gray input fields (#f4f6fa) with rounded-xl corners
 * - Suppressed internal headers & duplicate social buttons
 */
export const clerkAppearance = {
  elements: {
    rootBox: 'w-full shadow-none border-0 p-0 m-0 bg-transparent',
    cardBox: 'w-full shadow-none border-0 p-0 m-0 bg-transparent',
    card: 'bg-transparent shadow-none p-0 border-0 w-full',
    header: 'hidden',
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    socialButtonsRoot: 'hidden',
    socialButtons: 'hidden',
    socialButtonsBlockButton: 'hidden',
    dividerRow: 'hidden',
    dividerLine: 'hidden',
    dividerText: 'hidden',
    footer: 'hidden',
    footerAction: 'hidden',
    footerActionLink: 'hidden',
    footerActionText: 'hidden',
    footerPages: 'hidden',
    badge: 'hidden',
    developmentBadge: 'hidden',
    formButtonPrimary:
      'bg-black hover:bg-neutral-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md text-sm tracking-wide w-full cursor-pointer active:scale-[0.99]',
    formFieldLabel: 'text-xs font-semibold text-gray-700 mb-1',
    formFieldInput:
      'bg-[#f4f6fa] border border-transparent focus:border-gray-300 focus:bg-white text-gray-900 rounded-xl py-3 px-3.5 transition-all text-sm outline-none',
    identityPreviewText: 'text-gray-900 font-semibold',
    identityPreviewEditButton: 'text-black font-semibold',
  },
};

/**
 * Clerk Password Reset Component
 */
export const ClerkPasswordReset = ({ destination, onBackToLogin }) => {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [step, setStep] = useState('request'); // 'request' | 'reset'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const handleRequestReset = async (e) => {
    e.preventDefault();
    if (!email.trim() || isSubmitting) return;
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      if (!isLoaded || !signIn) {
        setErrorMessage('Authentication service is still initializing. Please wait a moment.');
        return;
      }

      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email.trim(),
      });

      setSuccessMessage('If that email exists in our system, password reset instructions have been sent.');
      setStep('reset');
    } catch (err) {
      const clerkErr = err.errors?.[0];
      if (clerkErr?.code === 'form_identifier_not_found') {
        setSuccessMessage('If that email exists in our system, password reset instructions have been sent.');
        setStep('reset');
      } else {
        setErrorMessage(
          clerkErr?.longMessage ||
          clerkErr?.message ||
          'Unable to send password reset email. Please verify your address and try again.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteReset = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!code.trim()) {
      setErrorMessage('Please enter the verification code sent to your email.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (password !== password2) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      if (!isLoaded || !signIn) {
        setErrorMessage('Authentication service is still initializing. Please try again.');
        return;
      }

      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: code.trim(),
        password,
      });

      if (result.status === 'complete') {
        setSuccessMessage('Password reset successfully! Redirecting...');
        await setActive({ session: result.createdSessionId });
        setTimeout(() => {
          navigate(destination || '/', { replace: true });
        }, 1200);
      } else {
        setErrorMessage('Additional verification is required. Please check your email or sign in directly.');
      }
    } catch (err) {
      const clerkErr = err.errors?.[0];
      setErrorMessage(
        clerkErr?.longMessage ||
        clerkErr?.message ||
        'The verification code is invalid or has expired. Please request a new reset code.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-black uppercase text-gray-900 tracking-tight">
          {step === 'request' ? 'Reset Password' : 'Set New Password'}
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          {step === 'request'
            ? 'Enter your registered email address to receive password reset instructions.'
            : 'Enter the code sent to your email and choose your new password.'}
        </p>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in duration-240">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-700 animate-in fade-in duration-240">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {step === 'request' ? (
        <form onSubmit={handleRequestReset} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-4 py-3 bg-[#f4f6fa] border border-transparent focus:border-gray-300 focus:bg-white rounded-xl text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !email.trim()}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-white text-sm tracking-wide bg-black hover:bg-neutral-800 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending Instructions...</span>
              </>
            ) : (
              <span>Send Reset Instructions</span>
            )}
          </button>

          <div className="text-center pt-2">
            <Link
              to="/login"
              onClick={onBackToLogin}
              className="text-xs font-bold text-black hover:underline"
            >
              Back to Sign In
            </Link>
          </div>
        </form>
      ) : (
        <form onSubmit={handleCompleteReset} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Reset Code
            </label>
            <input
              type="text"
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="6-digit verification code"
              className="w-full px-4 py-3 bg-[#f4f6fa] border border-transparent focus:border-gray-300 focus:bg-white rounded-xl text-sm font-mono tracking-widest text-gray-900 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full px-4 py-3 pr-10 bg-[#f4f6fa] border border-transparent focus:border-gray-300 focus:bg-white rounded-xl text-sm text-gray-900 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showPassword2 ? 'text' : 'password'}
                required
                minLength={8}
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-4 py-3 pr-10 bg-[#f4f6fa] border border-transparent focus:border-gray-300 focus:bg-white rounded-xl text-sm text-gray-900 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword2(!showPassword2)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
              >
                {showPassword2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !code.trim() || password.length < 8}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-white text-sm tracking-wide bg-black hover:bg-neutral-800 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Updating Password...</span>
              </>
            ) : (
              <span>Set New Password & Sign In</span>
            )}
          </button>

          <div className="flex items-center justify-between pt-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setStep('request');
                setErrorMessage('');
                setCode('');
              }}
              className="text-gray-500 hover:text-gray-800 cursor-pointer"
            >
              ← Try another email
            </button>
            <Link
              to="/login"
              onClick={onBackToLogin}
              className="font-bold text-black hover:underline"
            >
              Back to Sign In
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};

export const AuthPage = ({ mode = 'login' }) => {
  const { login, register, loginWithGoogle, isClerkConfigured, isAuthenticated, user, isAuthReady } = useAuth();
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
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const isLogin = mode === 'login';
  const isRegister = mode === 'register';
  const isForgot = mode === 'forgot';
  const isReset = mode === 'reset';

  const [resetTokenState, setResetTokenState] = useState(() => {
    if (!isReset) return 'valid';
    return resetToken ? 'validating' : 'missing';
  });
  const [resetTokenError, setResetTokenError] = useState(() => {
    if (isReset && !resetToken) {
      return 'Password reset token is missing. Please use the complete link sent to your email.';
    }
    return '';
  });

  const destination = location.state?.from && location.state.from !== '/' ? location.state.from : '/';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(destination || '/', { replace: true });
    }
  }, [isAuthenticated, user, navigate, destination]);

  // Token Validation on Mount for Password Reset
  useEffect(() => {
    if (!isReset || !resetToken) return;

    let isMounted = true;
    authAPI
      .passwordResetValidate(resetToken)
      .then(() => {
        if (isMounted) {
          setResetTokenState('valid');
          setResetTokenError('');
        }
      })
      .catch((err) => {
        if (isMounted) {
          setResetTokenState('invalid');
          const errorDetail =
            err.response?.data?.detail ||
            err.response?.data?.error ||
            'This password reset link is invalid, expired, or has already been used. Please request a new one.';
          setResetTokenError(errorDetail);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isReset, resetToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      if (isLogin) {
        await login({ email, password });
        navigate(destination || '/', { replace: true });
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
        navigate(destination || '/', { replace: true });
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
        setErrorMessage(err.message || 'Authentication failed. Please verify your details and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isClerkConfigured && !isAuthReady) return;
    setErrorMessage('');
    setIsGoogleLoading(true);
    try {
      if (isClerkConfigured) {
        await loginWithGoogle({ destination });
        return;
      }

      setErrorMessage(
        'Clerk authentication is not configured. Please add VITE_CLERK_PUBLISHABLE_KEY to frontend/.env.local (or your environment) to activate Google Sign-In.'
      );
    } catch (err) {
      setErrorMessage(err.message || 'Google authentication could not be completed.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="relative w-full flex-1 flex items-center justify-center p-3 sm:p-6 md:p-8 my-auto z-10">
      {/* ------------------------------------------------------------------- */}
      {/* Atmospheric Soft Sky & Cumulus Clouds Contract: from-[#96cdf2] via-[#bde1f8] to-[#edf7fd] */}
      {/* ------------------------------------------------------------------- */}

      {/* ------------------------------------------------------------------- */}
      {/* Main Reference Card Container                                       */}
      {/* ------------------------------------------------------------------- */}
      <div className="relative z-10 w-full max-w-4xl bg-white rounded-[28px] sm:rounded-[32px] p-3 sm:p-4 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.18)] border border-white/80 flex flex-col md:flex-row overflow-hidden my-auto animate-in zoom-in-95 duration-240">

        {/* ----------------------------------------------------------------- */}
        {/* Left Section: Character Video (Seamless Greeting → Idle Loop)     */}
        {/* ----------------------------------------------------------------- */}
        <div className="w-full md:w-[48%] min-h-[380px] md:min-h-[520px] rounded-[22px] sm:rounded-[24px] overflow-hidden relative shadow-inner bg-[#bfe4f9] flex flex-col">
          <LoginCharacterVideo />
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Right Section: Clean Reference Authentication Form                */}
        {/* ----------------------------------------------------------------- */}
        <div className="w-full md:w-[52%] p-6 sm:p-8 lg:p-10 flex flex-col justify-center items-center bg-white">
          <div className="w-full max-w-[340px] mx-auto flex flex-col items-center">

            {/* Top Brand Label (Text Only — Mascot Icon Removed per Reference Design) */}
            <div className="text-center mb-5 select-none">
              <span className="text-[10px] font-bold tracking-[0.24em] text-gray-700 uppercase font-mono">
                KEYFLOW
              </span>
            </div>

            {/* Welcome Heading (WELCOME BACK / WELCOME TO KEYFLOW) */}
            <div className="text-center mb-5 w-full">
              <h1 className="text-2xl sm:text-[27px] font-extrabold uppercase text-gray-950 tracking-[-0.02em] leading-tight font-sans">
                {isLogin && 'Welcome Back'}
                {isRegister && 'Welcome to KEYFLOW'}
                {isForgot && 'Reset Password'}
                {isReset && 'Set New Password'}
              </h1>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                {isLogin && 'Enter your email and password to access your account'}
                {isRegister && 'Enter your details to create your KEYFLOW account'}
                {isForgot && 'Enter your email to receive password reset instructions'}
                {isReset && 'Enter your code and choose your new password'}
              </p>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* Clerk Managed Authentication Branch                           */}
            {/* ------------------------------------------------------------- */}
            {isClerkConfigured ? (
              <div className="w-full">
                {/* Error Alert for Clerk Mode */}
                {errorMessage && (
                  <div className="w-full mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in duration-200">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Continue with Google for Clerk Mode (Login and Register) */}
                {(isLogin || isRegister) && (
                  <div className="w-full mb-3">
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={isSubmitting || isGoogleLoading || (isClerkConfigured && !isAuthReady)}
                      className="w-full py-3 px-4 rounded-xl border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-800 font-semibold text-xs transition-all flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.99] disabled:opacity-60 cursor-pointer"
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
                      <span>
                        {isClerkConfigured && !isAuthReady
                          ? 'Connecting...'
                          : isLogin
                          ? t('auth.login.google', 'Continue with Google')
                          : t('auth.register.google', 'Sign up with Google')}
                      </span>
                    </button>

                    <div className="relative my-4 text-center">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200" />
                      </div>
                      <div className="relative flex justify-center text-[11px] uppercase tracking-wider font-mono">
                        <span className="bg-white px-3 text-gray-400 font-semibold">or</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Email/Password Fields via Clerk SignIn / SignUp */}
                {isLogin && (
                  <SignIn
                    routing="path"
                    path="/login"
                    signUpUrl="/register"
                    fallbackRedirectUrl={destination}
                    appearance={clerkAppearance}
                  />
                )}

                {isRegister && (
                  <SignUp
                    routing="path"
                    path="/register"
                    signInUrl="/login"
                    fallbackRedirectUrl={destination}
                    appearance={clerkAppearance}
                  />
                )}

                {(isForgot || isReset) && (
                  <ClerkPasswordReset
                    destination={destination}
                    onBackToLogin={() => navigate('/login')}
                  />
                )}
              </div>
            ) : (
              /* ----------------------------------------------------------- */
              /* Fallback Native Authentication Form Branch                  */
              /* ----------------------------------------------------------- */
              <div className="w-full">
                {/* Error Alert */}
                {errorMessage && (
                  <div className="w-full mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in duration-200">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Success Alert */}
                {successMessage && (
                  <div className="w-full mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-700 animate-in fade-in duration-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {/* Password Reset Validating State */}
                {isReset && resetTokenState === 'validating' && (
                  <div className="py-12 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-black" />
                    <p className="text-xs text-gray-500 font-mono">Verifying reset token...</p>
                  </div>
                )}

                {/* Password Reset Invalid / Missing State */}
                {isReset && (resetTokenState === 'invalid' || resetTokenState === 'missing') && (
                  <div className="py-6 flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-500">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">Reset Link Invalid or Expired</h3>
                    <p className="text-xs text-gray-500 max-w-[280px] leading-relaxed">
                      {resetTokenError || 'This password reset link is invalid, expired, or has already been used.'}
                    </p>
                    <Link
                      to="/forgot-password"
                      className="mt-3 py-2.5 px-6 rounded-full bg-black hover:bg-neutral-800 text-white font-bold text-xs shadow-md transition-all inline-block"
                    >
                      Request New Reset Link
                    </Link>
                  </div>
                )}

                {/* Native Input Form */}
                {(!isReset || resetTokenState === 'valid') && (
                  <form onSubmit={handleSubmit} className="space-y-3.5 w-full">
                    {/* Username field (register only) */}
                    {isRegister && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                          Username
                        </label>
                        <input
                          type="text"
                          required
                          value={username}
                          onFocus={() => setIsInputFocused(true)}
                          onBlur={() => setIsInputFocused(false)}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Choose your username"
                          className="w-full px-4 py-3 bg-[#f4f6fa] border border-transparent focus:border-gray-300 focus:bg-white rounded-xl text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400"
                        />
                      </div>
                    )}

                    {/* Email field */}
                    {!isReset && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                          Email
                        </label>
                        <input
                          type={isLogin ? 'text' : 'email'}
                          required
                          autoComplete={isLogin ? 'username' : 'email'}
                          value={email}
                          onFocus={() => setIsInputFocused(true)}
                          onBlur={() => setIsInputFocused(false)}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          className="w-full px-4 py-3 bg-[#f4f6fa] border border-transparent focus:border-gray-300 focus:bg-white rounded-xl text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400"
                        />
                      </div>
                    )}

                    {/* Password field */}
                    {!isForgot && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                          {isReset ? 'New Password' : 'Password'}
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onFocus={() => setIsInputFocused(true)}
                            onBlur={() => setIsInputFocused(false)}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            className="w-full px-4 py-3 pr-10 bg-[#f4f6fa] border border-transparent focus:border-gray-300 focus:bg-white rounded-xl text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Confirm Password field (register/reset) */}
                    {(isRegister || isReset) && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword2 ? 'text' : 'password'}
                            required
                            value={password2}
                            onFocus={() => setIsInputFocused(true)}
                            onBlur={() => setIsInputFocused(false)}
                            onChange={(e) => setPassword2(e.target.value)}
                            placeholder="Confirm your password"
                            className="w-full px-4 py-3 pr-10 bg-[#f4f6fa] border border-transparent focus:border-gray-300 focus:bg-white rounded-xl text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword2(!showPassword2)}
                            tabIndex={-1}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                            aria-label={showPassword2 ? 'Hide confirm password' : 'Show confirm password'}
                          >
                            {showPassword2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Remember me & Forgot Password row */}
                    {isLogin && (
                      <div className="flex items-center justify-between text-xs pt-1 pb-1">
                        <label className="flex items-center gap-2 text-gray-600 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="rounded border-gray-300 text-black focus:ring-black h-3.5 w-3.5 cursor-pointer"
                          />
                          <span>Remember me</span>
                        </label>
                        <Link
                          to="/forgot-password"
                          className="text-gray-600 hover:text-black transition-colors font-medium"
                        >
                          Forgot Password
                        </Link>
                      </div>
                    )}

                    {/* Primary Action Button (Solid Black) */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 px-4 rounded-xl font-bold text-white text-sm tracking-wide bg-black hover:bg-neutral-800 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99] mt-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <span>
                          {isLogin && 'Sign In'}
                          {isRegister && 'Create Account'}
                          {isForgot && 'Send Instructions'}
                          {isReset && 'Update Password'}
                        </span>
                      )}
                    </button>

                    {/* Continue with Google Button */}
                    {(isLogin || isRegister) && (
                      <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={isSubmitting || isGoogleLoading}
                        className="w-full py-3 px-4 rounded-xl border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-800 font-semibold text-xs transition-all flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.99] disabled:opacity-60 cursor-pointer mt-2.5"
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
                        <span>
                          {isLogin
                            ? t('auth.login.google', 'Continue with Google')
                            : t('auth.register.google', 'Sign up with Google')}
                        </span>
                      </button>
                    )}
                  </form>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* Bottom Navigation Links (Sign In <-> Sign Up)                 */}
            {/* ------------------------------------------------------------- */}
            <div className="mt-6 text-center text-xs text-gray-500">
              {isLogin && (
                <p>
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    className="font-bold text-black hover:underline cursor-pointer"
                  >
                    Sign up
                  </Link>
                </p>
              )}
              {isRegister && (
                <p>
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="font-bold text-black hover:underline cursor-pointer"
                  >
                    Sign in
                  </Link>
                </p>
              )}
              {(isForgot || isReset) && (
                <p>
                  <Link
                    to="/login"
                    className="font-bold text-black hover:underline cursor-pointer"
                  >
                    Back to Sign In
                  </Link>
                </p>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
