"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function formatThousands(digits: string) {
  if (!digits) return "";
  return new Intl.NumberFormat("id-ID").format(Number(digits));
}

export function CurrencyInput({
  id,
  value,
  onChange,
  placeholder,
  className,
  disabled,
}: {
  id?: string;
  value: number | undefined;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  const displayValue = value ? formatThousands(String(value)) : "";

  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
        Rp
      </span>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        disabled={disabled}
        value={displayValue}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "");
          onChange(digits ? Number(digits) : 0);
        }}
        className={cn("pl-9", className)}
      />
    </div>
  );
}
