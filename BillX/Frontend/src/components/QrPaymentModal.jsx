import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { generateQr, getPaymentStatus, clearActiveQr, setPollStatus } from '../redux/slices/paymentsSlice';
import { X, Loader2, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export const QrPaymentModal = ({
  orderId,
  onSuccess = () => {},
  onFailure = () => {},
}) => {
  const dispatch = useDispatch();
  const { activeQr, pollStatus, status, error } = useSelector((state) => state.payments);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const pollIntervalRef = useRef(null);

  useEffect(() => {
    if (orderId) {
      dispatch(generateQr({ orderId }));
    }
    return () => {
      stopPolling();
      dispatch(clearActiveQr());
    };
  }, [orderId, dispatch]);

  useEffect(() => {
    if (activeQr?.qrId && pollStatus === 'polling') {
      startPolling(activeQr.qrId);
    }
  }, [activeQr, pollStatus]);

  const startPolling = (qrId) => {
    stopPolling();
    pollIntervalRef.current = setInterval(async () => {
      try {
        const actionResult = await dispatch(getPaymentStatus(qrId));
        if (getPaymentStatus.fulfilled.match(actionResult)) {
          const payment = actionResult.payload; // PaymentResponse
          if (payment.paymentStatus === 'PAID' || payment.paymentStatus === 'SUCCESS') {
            dispatch(setPollStatus('success'));
            stopPolling();
            setTimeout(() => onSuccess(payment), 1500);
          } else if (payment.paymentStatus === 'FAILED') {
            dispatch(setPollStatus('failed'));
            stopPolling();
            setTimeout(() => onFailure('Payment marked as FAILED by gateway'), 1500);
          }
        }
      } catch (err) {
        console.error('Polling error', err);
      }
    }, 3000);
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const handleCloseAttempt = () => {
    if (pollStatus === 'polling') {
      setShowCancelConfirm(true);
    } else {
      handleCancelConfirm();
    }
  };

  const handleCancelConfirm = () => {
    stopPolling();
    dispatch(clearActiveQr());
    onFailure('Payment cancelled by cashier');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={handleCloseAttempt}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-sm transform rounded-2xl bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-6 text-center shadow-xl transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close button */}
        <button
          onClick={handleCloseAttempt}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
          type="button"
        >
          <X className="w-5 h-5" />
        </button>

        {showCancelConfirm ? (
          // Cancellation confirmation dialog
          <div className="py-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Cancel Transaction?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Are you sure you want to stop waiting? The QR payment is still active.
            </p>
            <div className="mt-6 flex items-center justify-center space-x-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                type="button"
                className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                No, Keep Waiting
              </button>
              <button
                onClick={handleCancelConfirm}
                type="button"
                className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
              >
                Yes, Cancel Payment
              </button>
            </div>
          </div>
        ) : (
          // QR display and status polling
          <div className="py-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Scan UPI QR Code</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">Order ID: #{orderId}</p>

            {status === 'loading' && (
              <div className="flex flex-col items-center justify-center h-48 space-y-3">
                <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Generating QR Code...</span>
              </div>
            )}

            {status === 'failed' && (
              <div className="flex flex-col items-center justify-center h-48 space-y-3">
                <AlertCircle className="w-12 h-12 text-rose-500" />
                <span className="text-sm text-rose-500 dark:text-rose-400 font-medium">{error || 'Failed to load QR code'}</span>
                <button
                  onClick={() => dispatch(generateQr({ orderId }))}
                  className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                  type="button"
                >
                  Try Again
                </button>
              </div>
            )}

            {status === 'succeeded' && activeQr && (
              <div className="flex flex-col items-center space-y-4">
                {/* QR Frame */}
                <div className="p-3 bg-white border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm">
                  {activeQr.qrImageUrl ? (
                    <img
                      src={activeQr.qrImageUrl}
                      alt="UPI QR Code"
                      className="w-48 h-48 object-contain"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center bg-gray-50">
                      <span className="text-xs text-gray-400">Invalid QR URL</span>
                    </div>
                  )}
                </div>

                {/* Polling state indicators */}
                {pollStatus === 'polling' && (
                  <div className="flex items-center space-x-2 text-xs text-brand-blue dark:text-brand-blue-400 font-semibold bg-brand-blue-50 dark:bg-brand-blue-950/20 px-3 py-1.5 rounded-full animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Waiting for customer payment...</span>
                  </div>
                )}

                {pollStatus === 'success' && (
                  <div className="flex items-center space-x-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-full">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Payment Received!</span>
                  </div>
                )}

                {pollStatus === 'failed' && (
                  <div className="flex items-center space-x-2 text-xs text-rose-600 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/20 px-3 py-1.5 rounded-full">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Payment Failed.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default QrPaymentModal;
