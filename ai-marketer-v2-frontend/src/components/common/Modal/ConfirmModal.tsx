// src/components/common/Modal/ConfirmModal.tsx
import React, { useEffect, useRef } from "react";
import {
  FaExclamationTriangle,
  FaInfoCircle,
  FaQuestion,
} from "react-icons/fa";

export type ConfirmType = "alert" | "warning" | "info";

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  type?: ConfirmType;
  itemId?: string;
  onConfirm?: (itemId?: string) => void;
  onClose: () => void;
  children?: React.ReactNode;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title = "Confirmation",
  message,
  confirmButtonText = "Continue",
  cancelButtonText = "Cancel",
  type = "warning",
  itemId,
  onConfirm,
  onClose,
  children,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const isSubmitting = useRef(false);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Prevent scroll on body when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
      isSubmitting.current = false; // Reset on unmount
    };
  }, [isOpen, onClose]);

  // Handle ESC key press
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Type config for icons and styles
  const typeConfig = {
    alert: {
      icon: <FaExclamationTriangle className="h-6 w-6 text-red-500" />,
      confirmButtonClass: "bg-red-600 hover:bg-red-700 text-white",
      showConfirmButton: false,
    },
    warning: {
      icon: <FaQuestion className="h-6 w-6 text-orange-500" />,
      confirmButtonClass: "bg-black hover:bg-gray-800 text-white",
      showConfirmButton: true,
    },
    info: {
      icon: <FaInfoCircle className="h-6 w-6 text-blue-500" />,
      confirmButtonClass: "bg-black hover:bg-gray-800 text-white",
      showConfirmButton: false,
    },
  };

  const { icon, confirmButtonClass, showConfirmButton } = typeConfig[type];

  const handleConfirm = () => {
    if (isSubmitting.current || !onConfirm) return;
    isSubmitting.current = true;
    onConfirm(itemId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-opacity duration-300 opacity-100"
      >
        <div className="flex items-center mb-4">
          <div className="mr-3 flex-shrink-0">{icon}</div>
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </div>

        <div className="mb-5">
          <p className="text-sm text-gray-600 whitespace-pre-line">{message}</p>
          {children}
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 bg-white text-gray-700"
            onClick={onClose}
          >
            {cancelButtonText}
          </button>

          {showConfirmButton && onConfirm && (
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black ${confirmButtonClass} ${
                isSubmitting.current ? "opacity-75 cursor-not-allowed" : ""
              }`}
              onClick={handleConfirm}
              disabled={isSubmitting.current}
            >
              {isSubmitting.current ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                confirmButtonText
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
