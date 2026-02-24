"use client";

import { useCart } from "@/context/CartContext";
import Toast from "./Toast";

export default function ToastContainer() {
  const { toastMessage, toastType, hideToast } = useCart();

  return (
    <Toast
      message={toastMessage || ""}
      type={toastType}
      isVisible={!!toastMessage}
      onClose={hideToast}
    />
  );
}
