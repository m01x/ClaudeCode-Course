import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <div
        className="text-[clamp(64px,14vw,140px)] leading-none"
        style={{
          fontFamily: "var(--pixel)",
          color: "var(--magenta)",
          textShadow: "0 0 12px rgba(255,0,110,0.7), 0 0 32px rgba(0,245,255,0.35)",
        }}
      >
        404
      </div>
      <p
        className="text-[11px] tracking-[0.2em] sm:text-sm"
        style={{ fontFamily: "var(--pixel)", color: "var(--cyan)", textShadow: "0 0 8px rgba(0,245,255,0.6)" }}
      >
        SEÑAL PERDIDA EN EL VAULT
      </p>
      <p className="max-w-md text-sm" style={{ color: "var(--ink-dim)" }}>
        Esta pantalla no existe o el cartucho fue removido. Vuelve a la biblioteca antes de que se acabe el crédito.
      </p>
      <Link href="/biblioteca" className="btn lg mt-4">
        VOLVER AL VAULT
      </Link>
    </div>
  );
}
