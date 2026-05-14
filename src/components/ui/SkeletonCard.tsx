export default function SkeletonCard() {
  return (
    <div className="card rounded-sm overflow-hidden">
      {/* image */}
      <div className="skeleton h-44 w-full" />
      <div className="p-4 space-y-3">
        {/* badge + state */}
        <div className="flex gap-2">
          <div className="skeleton h-5 w-16 rounded-full" />
          <div className="skeleton h-5 w-20 rounded-full" />
        </div>
        {/* title */}
        <div className="skeleton h-5 w-3/4" />
        {/* description */}
        <div className="space-y-1.5">
          <div className="skeleton h-3.5 w-full" />
          <div className="skeleton h-3.5 w-5/6" />
        </div>
        {/* button */}
        <div className="skeleton h-9 w-28 mt-2" />
      </div>
    </div>
  )
}
