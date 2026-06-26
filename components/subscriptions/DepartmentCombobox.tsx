"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function DepartmentCombobox({
  value,
  onChange,
  departments,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  departments: string[];
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const trimmed = query.trim();
  const hasExactMatch = departments.some(
    (d) => d.toLowerCase() === trimmed.toLowerCase(),
  );

  const select = (val: string) => {
    onChange(val);
    setOpen(false);
    setQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={cn(!value && "text-muted-foreground")}>
            {value || "Select or type a department"}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search or add…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {trimmed && !hasExactMatch && (
              <CommandItem
                value={`__create__${trimmed}`}
                onSelect={() => select(trimmed)}
              >
                <Plus className="h-4 w-4" />
                Use &quot;{trimmed}&quot;
              </CommandItem>
            )}
            {departments.length > 0 && (
              <CommandGroup heading="Existing">
                {departments.map((d) => (
                  <CommandItem key={d} value={d} onSelect={() => select(d)}>
                    <Check
                      className={cn(
                        "h-4 w-4",
                        value === d ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {d}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {!trimmed && departments.length === 0 && (
              <CommandEmpty>Type to add a department.</CommandEmpty>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
