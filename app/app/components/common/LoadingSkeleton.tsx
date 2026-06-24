interface SkeletonProps {
  count?: number;
  height?: string;
  className?: string;
}

export function LoadingSkeleton(props: SkeletonProps) {
  const count = props.count || 3;
  const items = Array.from({ length: count });
  return (
    <div className={`space-y-4 ${props.className || ''}`}>
      {items.map((_, i) => (
        <div key={i} className={`${props.height || 'h-20'} bg-gray-100 rounded-xl animate-pulse`} />
      ))}
    </div>
  );
}
