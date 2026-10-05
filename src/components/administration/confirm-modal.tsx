"use client";

import { useLayoutEffect, useRef } from "react";
import { KeyRound, Trash2 } from "lucide-react";
import { mountConfirmationNavigation } from "@/lib/confirmation-navigation";
import { ActionButton } from "./controls";

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  tone = "danger",
  busy = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "danger" | "security";
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ busy, onCancel });
  useLayoutEffect(() => { callbacks.current = { busy, onCancel }; }, [busy, onCancel]);
  useLayoutEffect(() => {
    if (!open || !dialogRef.current) return;
    return mountConfirmationNavigation(dialogRef.current, {
      cancel: () => callbacks.current.onCancel(),
      isBusy: () => callbacks.current.busy,
    });
  }, [open]);
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    if (busy) dialog.focus({ preventScroll: true });
    else if (document.activeElement === dialog) dialog.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus({ preventScroll: true });
  }, [busy, open]);

  if (!open) return null;

  const ConfirmationIcon = tone === "security" ? KeyRound : Trash2;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[#101828]/55 backdrop-blur-[2px]"
        aria-label="Fermer la confirmation"
        tabIndex={-1}
        disabled={busy}
        onClick={onCancel}
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmation-dialog-title"
        aria-describedby="confirmation-dialog-description"
        className="relative w-full max-w-md rounded-2xl border border-[#dedbd5] bg-white p-6 shadow-2xl"
      >
        <div
          className={
            "grid h-11 w-11 place-items-center rounded-xl " +
            (tone === "security"
              ? "bg-[#edf7f6] text-[#315f5c]"
              : "bg-[#fef3f2] text-[#b42318]")
          }
        >
          <ConfirmationIcon className="h-5 w-5" aria-hidden="true" />
        </div>
        <h2 id="confirmation-dialog-title" className="mt-4 text-xl font-bold text-[#172033]">
          {title}
        </h2>
        <p id="confirmation-dialog-description" className="mt-2 text-sm leading-6 text-[#667085]">
          {description}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <ActionButton
            variant="secondary"
            className="sm:min-w-28"
            disabled={busy}
            onClick={onCancel}
          >
            Annuler
          </ActionButton>
          <ActionButton
            variant={tone === "security" ? "primary" : "dangerSolid"}
            className="sm:min-w-36"
            busy={busy}
            onClick={onConfirm}
          >
            {!busy && <ConfirmationIcon className="h-4 w-4" aria-hidden="true" />}
            {confirmLabel}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
