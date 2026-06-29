// app/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      {/* Kode Error dengan Animasi Melayang */}
      <h1 className="animate-bounce text-9xl font-extrabold tracking-widest text-blue-600 dark:text-blue-500">
        404
      </h1>
      
      {/* Label Badge */}
      <div className="absolute rotate-12 rounded bg-amber-500 px-2 py-1 text-sm font-semibold text-white shadow-md">
        Halaman Tidak Ditemukan
      </div>

      {/* Pesan Teks */}
      <div className="mt-8 flex flex-col items-center gap-2">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 sm:text-3xl">
          Waduh! Kamu Tersesat?
        </h2>
        <p className="max-w-md text-gray-500 dark:text-gray-400">
          Halaman yang kamu cari tidak ada atau mungkin sudah dipindahkan ke alamat lain.
        </p>
      </div>

      {/* Tombol Kembali ke Beranda */}
      <div className="mt-8">
        <Link
          href="/"
          className="group relative inline-flex items-center gap-2 overflow-hidden rounded-lg bg-blue-600 px-6 py-3 font-medium text-white shadow-lg transition-all duration-300 hover:bg-blue-700 hover:shadow-blue-500/20 active:scale-95 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          <span>Kembali ke Beranda</span>
          {/* Animasi panah kecil saat di-hover */}
          <svg
            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
}