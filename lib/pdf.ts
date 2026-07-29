import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { Permit } from "@/app/generated/prisma/client";
import { permitTypeLabels } from "@/lib/validations/permit";

function formatDate(date: Date | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(date);
}

export async function generatePermitPdf(
  permit: Permit,
  residentName: string,
  blockNumber: string | null
): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let y = 780;
  const left = 60;

  page.drawText("BARCELONA COVE", { x: left, y, size: 20, font: bold });
  y -= 20;
  page.drawText("Surat Izin Resmi Cluster", { x: left, y, size: 12, font, color: rgb(0.35, 0.35, 0.35) });
  y -= 10;
  page.drawLine({ start: { x: left, y }, end: { x: 535, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
  y -= 30;

  const rows: [string, string][] = [
    ["Jenis Izin", permitTypeLabels[permit.type]],
    ["Judul", permit.title],
    ["Pemohon", residentName],
    ["Rumah/Blok", blockNumber ?? "-"],
    ["Tanggal Mulai", formatDate(permit.startDate)],
    ["Tanggal Selesai", formatDate(permit.endDate)],
  ];

  for (const [label, value] of rows) {
    page.drawText(`${label}`, { x: left, y, size: 11, font: bold });
    page.drawText(value, { x: left + 150, y, size: 11, font });
    y -= 22;
  }

  y -= 10;
  page.drawText("Deskripsi:", { x: left, y, size: 11, font: bold });
  y -= 18;
  const description = permit.description.slice(0, 500);
  const words = description.split(" ");
  let line = "";
  for (const word of words) {
    if ((line + word).length > 80) {
      page.drawText(line, { x: left, y, size: 10, font });
      y -= 15;
      line = "";
    }
    line += `${word} `;
  }
  if (line) {
    page.drawText(line, { x: left, y, size: 10, font });
    y -= 15;
  }

  y -= 30;
  page.drawRectangle({ x: left, y: y - 50, width: 200, height: 60, borderColor: rgb(0.1, 0.5, 0.1), borderWidth: 2 });
  page.drawText("DISETUJUI", { x: left + 40, y: y - 20, size: 16, font: bold, color: rgb(0.1, 0.5, 0.1) });
  page.drawText(formatDate(permit.decidedAt ?? new Date()), { x: left + 40, y: y - 38, size: 9, font });

  if (permit.adminNotes) {
    y -= 90;
    page.drawText("Catatan Pengurus:", { x: left, y, size: 11, font: bold });
    y -= 16;
    page.drawText(permit.adminNotes.slice(0, 200), { x: left, y, size: 10, font });
  }

  page.drawText("Diterbitkan secara digital oleh Pengurus Cluster Barcelona Cove.", {
    x: left,
    y: 60,
    size: 9,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
