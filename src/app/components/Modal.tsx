import { useState, useCallback } from 'react';

export type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value?: string) => void;
  title: string;
  inputLabel?: string;
  confirmText: string;
  hideInput?: boolean;
  children?: React.ReactNode;
};

export default function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  inputLabel,
  confirmText,
  hideInput,
  children
}: ModalProps) {
  const [inputValue, setInputValue] = useState('');

  const handleConfirm = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const value = hideInput ? undefined : inputValue;
    onConfirm(value);
  }, [hideInput, inputValue, onConfirm]);

  const handleClose = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="relative">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        style={{ zIndex: 9998 }}
      />
      {/* Modal Content */}
      <div 
        className="fixed inset-0 flex items-center justify-center p-4"
        style={{ zIndex: 9999 }}
      >
        <div 
          className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 relative"
          style={{ zIndex: 10000 }}
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            {title}
          </h2>

          {children}

          {!hideInput && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {inputLabel}
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="relative px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              style={{ zIndex: 10001 }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="relative px-4 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors"
              style={{ zIndex: 10001 }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 