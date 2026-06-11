export function HotWheelsPlaceholder({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative w-full h-full bg-gradient-to-br from-orange-600 via-red-600 to-vault-900 flex items-center justify-center overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white,transparent_60%)]" />
      <div className="text-center px-4 z-10">
        <div className="font-display font-black text-2xl md:text-3xl text-white tracking-tighter italic drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
          HOT WHEELS
        </div>
        <div className="text-[10px] mt-1 text-white/70 uppercase tracking-[0.3em] font-semibold">
          WheelVault
        </div>
      </div>
    </div>
  );
}

export function ListingImage({
  src,
  alt,
  className = "",
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  if (!src) return <HotWheelsPlaceholder className={className} />;
  return <img src={src} alt={alt} className={`w-full h-full object-cover ${className}`} loading="lazy" />;
}
