/**
 * Logo Instagram resmi Barcelona Cove — dipasang di paling bawah menu navigasi.
 * Klik → langsung buka Instagram resmi di browser.
 */
export function InstagramLink({ className }: { className?: string }) {
  return (
    <a
      href="https://www.instagram.com/barcelonacoveofficial?igsh=aDZoNGY1bHZ6ZzJk"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Instagram Barcelona Cove"
      title="@barcelonacoveofficial"
      className={
        "inline-flex items-center justify-center rounded-full p-2 text-muted-foreground/60 transition-colors hover:bg-primary/10 hover:text-primary" +
        (className ? ` ${className}` : "")
      }
    >
      {/* Logo Instagram (SVG inline — lucide versi baru menghapus ikon brand) */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5"
        aria-hidden
      >
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    </a>
  );
}
