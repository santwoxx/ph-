import clsx from "clsx";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx("animate-pulse rounded-md bg-acai-100/50 dark:bg-acai-800/50", className)}
      {...props}
    />
  );
}
