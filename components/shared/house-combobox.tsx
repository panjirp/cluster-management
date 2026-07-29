"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { compareBlockNumber } from "@/lib/sort";

type HouseOption = { id: string; blockNumber: string };

export function HouseCombobox({
  houses,
  value,
  onValueChange,
  placeholder = "Cari nomor rumah…",
  id,
}: {
  houses: HouseOption[];
  value: string | null | undefined;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  id?: string;
}) {
  const items = [...houses]
    .sort((a, b) => compareBlockNumber(a.blockNumber, b.blockNumber))
    .map((h) => h.id);
  const labels = Object.fromEntries(houses.map((h) => [h.id, h.blockNumber]));

  return (
    <Combobox
      items={items}
      value={value ?? null}
      onValueChange={(v) => onValueChange(v)}
      itemToStringLabel={(itemValue) => labels[itemValue as string] ?? ""}
    >
      <ComboboxInput id={id} placeholder={placeholder} />
      <ComboboxContent>
        <ComboboxEmpty>Tidak ditemukan.</ComboboxEmpty>
        <ComboboxList>
          {(itemValue: string) => (
            <ComboboxItem key={itemValue} value={itemValue}>
              {labels[itemValue]}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
