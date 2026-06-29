// app/loading.tsx
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <div className="relative flex h-16 w-16 items-center justify-center">
        {/* Efek lingkaran luar yang berdenyut (Pulse) */}
        <div className="absolute h-full w-full animate-ping rounded-full bg-blue-500 opacity-20"></div>
        
        {/* Spinner berputar (Border Top & Right berwarna biru) */}
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500 border-r-blue-500"></div>
      </div>

      <div className="flex flex-col items-center gap-1">
        <h2 className="animate-pulse text-lg font-semibold text-gray-700 dark:text-gray-200">
          Memuat halaman...
        </h2>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Mohon tunggu sebentar
        </p>
      </div>
    </div>
  );
}