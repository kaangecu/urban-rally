type Shape = 'line' | 'title' | 'thumb' | 'card';

/** Placeholder in the real layout while content loads. Decorative, so hidden from screen readers. */
export function Skeleton({ shape = 'line', className = '' }: { shape?: Shape; className?: string }) {
  if (shape === 'card') {
    return (
      <div aria-hidden="true" className={`grid grid-cols-[88px_1fr] gap-3 p-3 rounded-card bg-surface ring-1 ring-inset ring-line ${className}`}>
        <Skeleton shape="thumb" />
        <div className="flex flex-col gap-2 pt-1">
          <Skeleton shape="line" className="w-1/3" />
          <Skeleton shape="title" className="w-4/5" />
          <Skeleton shape="line" className="w-1/2" />
        </div>
      </div>
    );
  }
  const size = { line: 'h-3.5 rounded-sm', title: 'h-[22px] rounded-sm', thumb: 'size-[88px] rounded-control' }[shape];
  return <span aria-hidden="true" className={`block bg-surface-raised animate-pulse motion-reduce:animate-none ${size} ${className}`} />;
}
