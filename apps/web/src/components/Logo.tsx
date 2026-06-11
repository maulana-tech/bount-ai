import Link from "next/link";

/**
 * Mark + wordmark, selalu menautkan ke beranda (juga berfungsi sebagai
 * navigasi "kembali" dari /app). Mark digambar via CSS (kotak bronze),
 * bukan glyph/emoji — sesuai aturan anti-slop UI_GUIDE.
 */
export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span aria-hidden className="h-3 w-3 rotate-45 border-2 border-gold" />
      <span className="text-lg font-semibold tracking-tight">ven-AI</span>
    </Link>
  );
}
