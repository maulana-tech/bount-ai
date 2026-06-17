import Link from "next/link";
import Image from "next/image";

/**
 * Mark + wordmark, selalu menautkan ke beranda (juga berfungsi sebagai
 * navigasi "kembali" dari /app). Mark memakai aset `public/logo.png`.
 */
export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <Image
        src="/logo.png"
        alt="bount-AI"
        width={28}
        height={28}
        priority
        className="h-7 w-7 rounded"
      />
      <span className="text-lg font-semibold tracking-tight">bount-AI</span>
    </Link>
  );
}
