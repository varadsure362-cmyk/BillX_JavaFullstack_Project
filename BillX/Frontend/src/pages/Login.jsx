import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { login, fetchCurrentUser } from '../redux/slices/authSlice';
import { FormField } from '../components/FormField';

const HERO_VIDEO = '/assets/Cashier_using_tablet__manager_vi._202607052121.mp4';

export const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token, status } = useSelector((state) => state.auth);
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (token && user) {
      if (user.role === 'CASHIER') navigate('/cashier/pos');
      else if (user.role === 'MANAGER') navigate('/manager/dashboard');
    }
  }, [token, user, navigate]);

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email address').required('Email is required'),
      password: Yup.string().required('Password is required'),
    }),
    onSubmit: async (values) => {
      setLocalError(null);
      const result = await dispatch(login(values));
      if (login.fulfilled.match(result)) {
        const userResult = await dispatch(fetchCurrentUser());
        if (fetchCurrentUser.fulfilled.match(userResult)) {
          const loadedUser = userResult.payload;
          if (loadedUser.role === 'CASHIER') navigate('/cashier/pos');
          else if (loadedUser.role === 'MANAGER') navigate('/manager/dashboard');
        }
      } else {
        setLocalError(result.payload || 'Invalid email or password');
      }
    },
  });

  const handleGoogleLogin = () => {
    const backendBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://billx-javafullstack-project.onrender.com';
    window.location.href = `${backendBaseUrl}/oauth2/authorization/google`;
  };

  const isBtnLoading = status === 'loading';

  return (
    <div className="min-h-screen relative flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">

      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        src={HERO_VIDEO}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/90" />

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-block">
          <span className="text-4xl font-black tracking-tight text-white drop-shadow-md">
            <span className="text-emerald-500">Bill</span>X
          </span>
        </Link>
        <h2 className="mt-6 text-2xl sm:text-3xl font-extrabold text-white">
          Sign in to your account
        </h2>
        <p className="mt-2 text-sm text-zinc-300">
          Or{' '}
          <Link to="/signup" className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
            create a new account
          </Link>
        </p>
      </div>

      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-zinc-900/60 backdrop-blur-xl py-8 px-6 border border-zinc-700/50 rounded-2xl shadow-2xl sm:px-10">

          <form className="space-y-5" onSubmit={formik.handleSubmit} noValidate>

            {localError && (
              <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium">
                {localError}
              </div>
            )}

            <FormField
              label="Email Address"
              name="email"
              type="email"
              placeholder="you@example.com"
              formik={formik}
              disabled={isBtnLoading}
            />

            <FormField
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
              formik={formik}
              disabled={isBtnLoading}
            />

            <button
              type="submit"
              disabled={isBtnLoading}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-600/20"
            >
              {isBtnLoading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-zinc-900/60 backdrop-blur-xl text-zinc-400">or</span>
            </div>
          </div>

          {/* Google OAuth */}
          <button
            onClick={handleGoogleLogin}
            type="button"
            className="mt-6 w-full inline-flex justify-center items-center gap-3 py-3 px-4 border border-zinc-700 rounded-xl bg-zinc-800/50 text-sm font-semibold text-white hover:bg-zinc-700/70 transition-colors backdrop-blur-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.3-4.74 3.3-8.09z" />
              <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

        </div>
      </div>
    </div>
  );
};

export default Login;
