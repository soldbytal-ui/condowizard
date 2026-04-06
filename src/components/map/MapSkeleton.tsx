export default function MapSkeleton() {
  return (
    <div className="w-full h-full bg-[#0A0C0F] flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#111317]/50 to-[#0A0C0F]" />
      <div className="relative flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
        <span className="text-sm text-gray-400 font-light tracking-wide">Loading Toronto...</span>
      </div>
    </div>
  );
}
