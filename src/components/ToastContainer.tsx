"use client";

import { useCart } from "@/context/CartContext";
import Toast from "./Toast";

export default function ToastContainer() {
  const { toastMessage, hideToast } = useCart();

  return (
    <Toast
      message={toastMessage || ""}
      isVisible={!!toastMessage}
      onClose={hideToast}
    />
  );
}
