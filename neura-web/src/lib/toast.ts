// src/lib/toast.ts
import { toast as sonnerToast, type ExternalToast } from "sonner";

type ToastOptions = Omit<ExternalToast, "className">;

const defaults: ToastOptions = { position: "bottom-center" };

export const toast = {
  success: (msg: string, options?: ToastOptions) =>
    sonnerToast.success(msg, {
      ...defaults,
      ...options,
      unstyled: true,
      classNames: {
        toast: "flex items-center gap-3 w-full p-4 rounded-lg border font-sans text-sm border-green-500 bg-green-500/10 text-green-600 dark:text-green-400",
        icon: "text-green-500",
      },
    }),
  error: (msg: string, options?: ToastOptions) =>
    sonnerToast.error(msg, {
      ...defaults,
      ...options,
      unstyled: true,
      classNames: {
        toast: "flex items-center gap-3 w-full p-4 rounded-lg border font-sans text-sm border-red-500 bg-red-500/10 text-red-600 dark:text-red-400",
        icon: "text-red-500",
      },
    }),
  default: (msg: string, options?: ToastOptions) =>
    sonnerToast(msg, { ...defaults, ...options }),
};