import { useState, useCallback } from 'react';

export const useConfirm = () => {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'danger',
    onConfirm: null,
    isLoading: false
  });

  const showConfirm = useCallback(({
    title = "Confirm Action",
    message = "Are you sure you want to proceed?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "danger",
    onConfirm
  }) => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        type,
        onConfirm: async () => {
          setConfirmState(prev => ({ ...prev, isLoading: true }));
          try {
            if (onConfirm) {
              await onConfirm();
            }
            resolve(true);
          } catch (error) {
            console.error('Confirm action error:', error);
            resolve(false);
          } finally {
            setConfirmState(prev => ({ ...prev, isOpen: false, isLoading: false }));
          }
        },
        isLoading: false
      });
    });
  }, []);

  const hideConfirm = useCallback(() => {
    setConfirmState(prev => ({ ...prev, isOpen: false, isLoading: false }));
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleConfirm = useCallback(async () => {
    if (confirmState.onConfirm) {
      await confirmState.onConfirm();
    }
  }, [confirmState.onConfirm]);

  return {
    confirmState,
    showConfirm,
    hideConfirm,
    handleConfirm
  };
};