/**
 * Link Fantasy Premier League — dipasang di dekat logo Instagram (bawah navigasi).
 * Klik → langsung buka league FPL Barcelona Cove di browser.
 */
export function FantasyLink({ className }: { className?: string }) {
  return (
    <a
      href="https://fantasy.premierleague.com/leagues/auto-join/6dgq05"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Fantasy Premier League Barcelona Cove"
      title="Fantasy Premier League"
      className={
        "inline-flex items-center justify-center rounded-full p-2 text-muted-foreground/60 transition-colors hover:bg-primary/10 hover:text-primary" +
        (className ? ` ${className}` : "")
      }
    >
      {/* Ikon bola sepak (SVG inline) */}
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
        <circle cx="12" cy="12" r="10" />
        <path d="m6.3 7 5.7 3.2m3.7-3.2-2.4 5.3m-1.8 4.2 2.7-3.1M6.3 7h11.4M6.3 7l3.4 8.2m7.7-5.4-6.6 3.4" />
      </svg>
    </a>
  );
}
