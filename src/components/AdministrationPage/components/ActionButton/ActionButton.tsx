"use client";
import { Button } from "@mairie360/lib-components/primitives";
import type { ButtonProps } from "@mairie360/lib-components/primitives";

export type ActionVariant = "primary" | "secondary" | "danger" | "dangerSolid" | "ghost";
const appearance: Record<ActionVariant, Pick<ButtonProps, "variant" | "tone">> = {
  primary: { variant: "solid", tone: "primary" },
  secondary: { variant: "outline", tone: "neutral" },
  danger: { variant: "outline", tone: "danger" },
  dangerSolid: { variant: "solid", tone: "danger" },
  ghost: { variant: "ghost", tone: "neutral" },
};

/** Administration action on the lib `Button`: the variant names the role, `busy` shows the spinner and disables it. */
export function ActionButton({ variant = "primary", busy = false, children, ...props }: Omit<ButtonProps, "variant" | "tone" | "loading"> & { variant?: ActionVariant; busy?: boolean }) {
  return <Button {...props} {...appearance[variant]} loading={busy} data-action-variant={variant}>{children}</Button>;
}
