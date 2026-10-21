"use client";

import { useLayoutEffect, useRef } from "react";
import { KeyRound, Trash2 } from "lucide-react";
import { mountConfirmationNavigation } from "@/lib/confirmation-navigation";
import { ModalTitle, Body } from "@mairie360/lib-components/primitives";
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
        className="absolute inset-0 bg-[var(--mairie-text)]/55 backdrop-blur-[2px]"
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
        className="relative w-full max-w-md rounded-2xl border border-[var(--mairie-border)] bg-[var(--mairie-surface)] p-6 shadow-2xl"
      >
        <div
          className={
            "grid h-11 w-11 place-items-center rounded-xl " +
            (tone === "security"
              ? "bg-[var(--mairie-accent-surface)] text-[var(--mairie-accent)]"
              : "bg-[var(--mairie-error-surface)] text-[var(--mairie-error-text)]")
          }
        >
          <ConfirmationIcon className="h-5 w-5" aria-hidden="true" />
        </div>
        <ModalTitle id="confirmation-dialog-title" className="mt-4">{title}</ModalTitle>
        <Body id="confirmation-dialog-description" size="s" tone="muted" className="mt-2">{description}</Body>
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
