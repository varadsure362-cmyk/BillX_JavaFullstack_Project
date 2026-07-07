import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setToken, fetchCurrentUser } from '../redux/slices/authSlice';
import { Loader2 } from 'lucide-react';

export const OAuth2Callback = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const parseTokenAndRedirect = async () => {
      try {
        const hash = window.location.hash;
        if (!hash) {
          navigate('/login', { replace: true });
          return;
        }

        const params = new URLSearchParams(hash.substring(1)); // strip '#'
        const token = params.get('token');

        if (token) {
          // Store token in state and localStorage
          dispatch(setToken(token));

          // Fetch user profile from /api/auth/me
          const result = await dispatch(fetchCurrentUser());
          if (fetchCurrentUser.fulfilled.match(result)) {
            const user = result.payload;
            if (user.role === 'CASHIER') {
              navigate('/cashier/pos', { replace: true });
            } else if (user.role === 'MANAGER') {
              navigate('/manager/dashboard', { replace: true });
            } else {
              navigate('/login', { replace: true });
            }
          } else {
            navigate('/login', { replace: true });
          }
        } else {
          navigate('/login', { replace: true });
        }
      } catch (err) {
        console.error('OAuth Callback processing error:', err);
        navigate('/login', { replace: true });
      }
    };

    parseTokenAndRedirect();
  }, [dispatch, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950">
      <Loader2 className="w-10 h-10 text-brand-green animate-spin" />
      <span className="mt-3 text-sm text-gray-500 dark:text-gray-400 font-medium">Completing secure authentication...</span>
    </div>
  );
};

export default OAuth2Callback;
