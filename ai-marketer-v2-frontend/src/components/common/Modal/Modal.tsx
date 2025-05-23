// components/common/Modal.tsx
"use client";

import clsx from "clsx";
import { useEffect } from "react";

export default function Modal({
  isOpen,
  onClose,
  children,
  height = "sm:h-[500px]",
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: string;
}) {
  // Handle click outside the modal content to trigger close
  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }

    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [isOpen]);

  return (
    <div
      // Modal backdrop container with fade transition
      className={clsx(
        "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-200",
        isOpen
          ? "opacity-100 pointer-events-auto" // Show modal
          : "opacity-0 pointer-events-none" // Hide modal and disable interaction
      )}
      onClick={handleOutsideClick}
    >
      <div
        // Modal content box
        className={`bg-white p-2 w-full sm:w-[430px] h-full ${height} max-w-md shadow-lg flex flex-col`}
      >
        {children}
      </div>
    </div>
  );
}
