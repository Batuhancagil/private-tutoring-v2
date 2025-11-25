'use client';

import { ReactNode, useEffect } from 'react';
import { Button } from './Button';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
}: DialogProps) {
  useEffect(() => {
    if (open) {
      // Prevent body scroll when dialog is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" />

      {/* Dialog */}
      <div className="relative z-50 w-full max-w-md rounded-lg bg-white dark:bg-gray-800 shadow-xl p-6 mx-4">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
        </div>

        <div className="mb-6 text-gray-600 dark:text-gray-400">
          {children}
        </div>

        {footer && <div className="flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      {message}
    </Dialog>
  );
}

