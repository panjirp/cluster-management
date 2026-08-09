"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/shared/file-upload";
import {
  createPermitSchema,
  type CreatePermitInput,
  permitTypeValues,
  permitTypeLabels,
} from "@/lib/validations/permit";

type AssetOption = { id: string; name: string };

export function PermitForm({ initialType }: { initialType?: CreatePermitInput["type"] }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [assets, setAssets] = useState<AssetOption[]>([]);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreatePermitInput>({
    resolver: zodResolver(createPermitSchema),
    defaultValues: {
      title: "",
      description: "",
      type: initialType ?? "LAINNYA",
      startDate: "",
      endDate: "",
      assetIds: [],
    },
  });

  const type = watch("type");
  const assetIds = watch("assetIds") ?? [];

  useEffect(() => {
    if (type === "ACARA" && assets.length === 0) {
      fetch("/api/assets")
        .then((res) => res.json())
        .then(setAssets);
    }
  }, [type, assets.length]);

  function toggleAsset(assetId: string, checked: boolean) {
    setValue("assetIds", checked ? [...assetIds, assetId] : assetIds.filter((id) => id !== assetId));
  }

  async function onSubmit(data: CreatePermitInput) {
    setSubmitting(true);
    const res = await fetch("/api/permits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast.error(typeof body?.error === "string" ? body.error : "Gagal mengirim permohonan.");
      return;
    }

    toast.success("Permohonan izin berhasil dikirim.");
    router.back();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Judul</Label>
        <Input id="title" {...register("title")} placeholder="Contoh: Renovasi teras rumah" />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="type">Jenis Izin</Label>
        <Select items={permitTypeLabels} value={type} onValueChange={(v) => setValue("type", v as CreatePermitInput["type"])}>
          <SelectTrigger id="type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {permitTypeValues.map((value) => (
              <SelectItem key={value} value={value}>
                {permitTypeLabels[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="startDate">Tanggal Mulai</Label>
          <Input id="startDate" type="date" {...register("startDate")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="endDate">Tanggal Selesai</Label>
          <Input id="endDate" type="date" {...register("endDate")} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea id="description" rows={5} {...register("description")} placeholder="Jelaskan detail permohonan Anda" />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
      </div>

      <FileUpload
        id="supportingDocUrl"
        label="Dokumen Pendukung (opsional)"
        value={watch("supportingDocUrl")}
        onChange={(url) => setValue("supportingDocUrl", url)}
      />

      {type === "RENOVASI" && (
        <FileUpload
          id="neighborConsentUrl"
          label="Foto Izin Tetangga Kiri-Kanan (wajib)"
          value={watch("neighborConsentUrl")}
          onChange={(url) => setValue("neighborConsentUrl", url)}
        />
      )}
      {errors.neighborConsentUrl && <p className="text-sm text-destructive">{errors.neighborConsentUrl.message}</p>}

      {type === "ACARA" && assets.length > 0 && (
        <div className="space-y-2 rounded-lg border p-4">
          <Label>Peminjaman Aset (opsional)</Label>
          <p className="text-xs text-muted-foreground">Pilih aset yang ingin dipinjam sesuai tanggal acara di atas.</p>
          {assets.map((asset) => (
            <div key={asset.id} className="flex items-center gap-2">
              <Checkbox
                id={`asset-${asset.id}`}
                checked={assetIds.includes(asset.id)}
                onCheckedChange={(checked) => toggleAsset(asset.id, checked === true)}
              />
              <Label htmlFor={`asset-${asset.id}`} className="font-normal">
                {asset.name}
              </Label>
            </div>
          ))}
        </div>
      )}

      <Button type="submit" disabled={submitting}>
        {submitting ? "Mengirim..." : "Ajukan Izin"}
      </Button>
    </form>
  );
}
