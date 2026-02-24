"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ToastProps {
  message: string;
  type?: "default" | "error";
  isVisible: boolean;
  onClose: () => void;
}

export default function Toast({
  message,
  type = "default",
  isVisible,
  onClose,
}: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={`fixed bottom-6 right-6 z-[100] px-6 py-4 rounded-sm shadow-lg ${
            type === "error"
              ? "bg-red-600/95 text-white"
              : "bg-brand-softblack text-brand-offwhite"
          }`}
        >
          <p className="text-xs font-light uppercase tracking-[0.1em]">
            {message}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
