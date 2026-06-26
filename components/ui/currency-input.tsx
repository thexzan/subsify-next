"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

const formatter = new Intl.NumberFormat("id-ID");

function digitsToDisplay(digits: string): string {
  if (!digits) return "";
  // Strip leading zeros, then group with id-ID separators.
  const n = Number(digits);
  if (Number.isNaN(n)) return "";
  return formatter.format(n);
}

/**
 * Currency input for IDR. Shows live thousand separators (1.234.567) while the
 * user types and reports the raw integer via onValueChange. Only digits are
 * accepted, so leading zeros and stray characters can't be entered.
 */
export function CurrencyInput({
  value,
  onValueChange,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> & {
  value: number;
  onValueChange: (value: number) => void;
}) {
  const [display, setDisplay] = React.useState(() =>
    value ? formatter.format(value) : "",
  );
  const [prevValue, setPrevValue] = React.useState(value);

  // Adjust display when the value changes from outside (editing an existing
  // record or a form reset). This is React's "adjust state during render"
  // pattern — preferred over an effect for syncing to a prop.
  if (value !== prevValue) {
    setPrevValue(value);
    const current = Number(display.replace(/\D/g, "") || 0);
    if (current !== value) {
      setDisplay(value ? formatter.format(value) : "");
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    setDisplay(digitsToDisplay(digits));
    onValueChange(digits ? Number(digits) : 0);
  };

  return (
    <Input
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      {...props}
    />
  );
}
