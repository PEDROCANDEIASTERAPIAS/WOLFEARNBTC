interface AvatarProps {
  hue: number;
  size?: number;
  className?: string;
}

export function Avatar({ hue, size = 36, className = '' }: AvatarProps) {
  const initials = 'SC';
  return (
    <div
      className={`flex items-center justify-center rounded-full font-display font-semibold text-ink-950 ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `linear-gradient(135deg, hsl(${hue}, 85%, 60%), hsl(${(hue + 40) % 360}, 80%, 50%))`,
      }}
      aria-label="User avatar"
    >
      {initials}
    </div>
  );
}
