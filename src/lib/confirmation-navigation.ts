/** Mounted only while the local confirmation is open; never changes permissions. */
export function mountConfirmationNavigation(
  dialog: HTMLElement,
  { cancel, isBusy }: { cancel: () => void; isBusy: () => boolean },
) {
  const owner = dialog.ownerDocument;
  const opener = owner.activeElement as HTMLElement | null;
  const previousOverflow = owner.body.style.overflow;
  const controls = () => Array.from(dialog.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
  const focusInside = () => (controls()[0] ?? dialog).focus({ preventScroll: true });

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      if (!isBusy()) cancel();
      return;
    }
    if (event.key !== "Tab") return;
    const buttons = controls();
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (!first || !last) {
      event.preventDefault();
      dialog.focus({ preventScroll: true });
    } else if (!dialog.contains(owner.activeElement) || owner.activeElement === dialog) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus({ preventScroll: true });
    } else if (event.shiftKey && owner.activeElement === first) {
      event.preventDefault();
      last.focus({ preventScroll: true });
    } else if (!event.shiftKey && owner.activeElement === last) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  };
  const onFocusIn = () => {
    if (!dialog.contains(owner.activeElement)) focusInside();
  };

  owner.body.style.overflow = "hidden";
  owner.addEventListener("keydown", onKeyDown, true);
  owner.addEventListener("focusin", onFocusIn);
  focusInside();

  return () => {
    owner.removeEventListener("keydown", onKeyDown, true);
    owner.removeEventListener("focusin", onFocusIn);
    owner.body.style.overflow = previousOverflow;
    if (opener?.isConnected && !opener.matches(":disabled")) opener.focus({ preventScroll: true });
  };
}
