interface Props {
  message?: string
}

export default function LoadingScreen({ message = 'Loading…' }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-bg-base flex flex-col items-center justify-center gap-8">
      {/* logo */}
      <div className="text-center">
        <h1 className="font-cinzel font-black text-3xl tracking-[0.3em] text-gold">
          YATRA<span className="text-saffron">360</span>
        </h1>
        <p className="font-cinzel text-xs tracking-[0.4em] text-text-secondary mt-1 uppercase">
          Explore India · Every Angle · Every Era
        </p>
      </div>

      {/* spinner ring */}
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-2 border-gold/10" />
        <div className="absolute inset-0 rounded-full border-2 border-t-saffron border-r-gold border-b-transparent border-l-transparent animate-spin" />
      </div>

      {/* message */}
      <p className="font-proza text-sm text-text-secondary animate-pulse">{message}</p>

      {/* bottom ornament */}
      <div className="absolute bottom-8 flex items-center gap-3">
        <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold/30" />
        <span className="font-mono text-[10px] tracking-widest text-text-muted uppercase">yatra360</span>
        <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold/30" />
      </div>
    </div>
  )
}
