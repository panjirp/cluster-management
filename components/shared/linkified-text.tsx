"use client";

const URL_REGEX = /(https?:\/\/[^\s<>"')\]]+)/g;

/**
 * Merender teks biasa dengan URL yang otomatis menjadi link bisa diklik
 * (buka di tab baru). Dipakai di isi notifikasi agar link seperti
 * bit.ly/Bazar-HUTRI81 bisa langsung diketuk warga.
 */
export function LinkifiedText({ text, linkClassName }: { text: string; linkClassName?: string }) {
  const parts = text.split(URL_REGEX);
  return (
    <>
      {parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={
              linkClassName ??
              "break-all font-medium text-primary underline underline-offset-2 hover:text-primary/80"
            }
          >
            {part.replace(/^https?:\/\//, "")}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
