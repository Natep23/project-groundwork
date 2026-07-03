import React from "react";

type Toast = {
  id: number;
  message: string;
  kind: "info" | "error";
};

type ToastApi = {
  toast: (message: string) => void;
  toastError: (message: string) => void;
};

const ToastContext = React.createContext<ToastApi | null>(null);

const DISMISS_AFTER_MS = 4000;
let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const timers = React.useRef<Set<number>>(new Set());

  React.useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, []);

  const push = React.useCallback((message: string, kind: Toast["kind"]) => {
    const id = nextId++;
    setToasts((prev) => [...prev.slice(-3), { id, message, kind }]);
    const timer = window.setTimeout(() => {
      timers.current.delete(timer);
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, DISMISS_AFTER_MS);
    timers.current.add(timer);
  }, []);

  const api = React.useMemo<ToastApi>(
    () => ({
      toast: (message) => push(message, "info"),
      toastError: (message) => push(message, "error"),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={t.kind === "error" ? "toast toast--error" : "toast"}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
