"use client";

import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "ลบรายการ",
  cancelLabel = "ยกเลิก",
  busy = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const cancelButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelButton.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) {
        event.preventDefault();
        onCancel();
        return;
      }
      if (event.key !== "Tab") return;
      const buttons = [cancelButton.current, document.getElementById("confirm-dialog-action")]
        .filter((element): element is HTMLElement => element instanceof HTMLElement && !element.hasAttribute("disabled"));
      if (buttons.length === 0) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="confirm-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <section aria-labelledby="confirm-dialog-title" aria-modal="true" className="confirm-dialog" role="alertdialog">
        <div className="confirm-icon" aria-hidden="true">
          <span className="material-icons-round">delete_outline</span>
        </div>
        <h2 className="confirm-title" id="confirm-dialog-title">{title}</h2>
        <p className="confirm-description">{description}</p>
        <div className="confirm-actions">
          <button className="confirm-cancel" disabled={busy} onClick={onCancel} ref={cancelButton} type="button">
            {cancelLabel}
          </button>
          <button className="confirm-danger" disabled={busy} id="confirm-dialog-action" onClick={onConfirm} type="button">
            {busy ? "กำลังลบ..." : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
