"use client";

import dynamic from "next/dynamic";

const ToastContainer = dynamic(() => import("@/components/ToastContainer"), {
  ssr: false,
});

export default function ClientToastContainer() {
  return <ToastContainer />;
}
