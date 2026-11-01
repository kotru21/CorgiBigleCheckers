import { useId } from "react";

interface SegmentedControlProps<T extends string> {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; title: string }>;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: SegmentedControlProps<T>) {
  const labelId = useId();
  return (
    <div className="flex items-center gap-2">
      <span
        id={labelId}
        className="w-20 shrink-0 text-xs font-semibold text-zinc-400 sm:w-24 sm:text-sm">
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className="grid flex-1 gap-1 rounded-xl border border-zinc-700/80 bg-zinc-900/90 p-1"
        style={{
          gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
        }}>
        {options.map((option) => {
          const checked = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => onChange(option.value)}
              className={`min-h-8 rounded-lg px-2 text-xs font-semibold transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-orange-400/80 sm:text-sm ${
                checked
                  ? "bg-orange-600 text-zinc-950"
                  : "text-zinc-300 hover:bg-zinc-800"
              }`}>
              {option.title}
            </button>
          );
        })}
      </div>
    </div>
  );
}
