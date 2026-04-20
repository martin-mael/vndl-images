export function ColorPicker({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
}) {
	return (
		<label className="flex flex-1 cursor-pointer flex-col items-center gap-1.5">
			<div
				className="h-8 w-full rounded border border-ink-600 transition-colors"
				style={{ backgroundColor: value }}
			/>
			<span className="text-xs text-ink-300">{label}</span>
			<input
				type="color"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="sr-only"
			/>
		</label>
	);
}
