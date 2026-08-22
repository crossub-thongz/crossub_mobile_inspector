import { cn, personInitials } from '@/lib/utils';

export function InitialsAvatar({
  name,
  className,
}: {
  name?: string | null;
  className?: string;
}) {
  const initials = personInitials({ fullName: name });

  return (
    <span
      className={cn(
        'bg-primary/20 text-primary inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold',
        className,
      )}
      aria-hidden
    >
      {initials}
    </span>
  );
}
