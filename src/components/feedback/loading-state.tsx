type LoadingStateProps = { label: string };

export function LoadingState({ label }: LoadingStateProps) {
  return (
    <output className="flex min-h-[50vh] items-center justify-center text-[#788397]">
      {label}
    </output>
  );
}
