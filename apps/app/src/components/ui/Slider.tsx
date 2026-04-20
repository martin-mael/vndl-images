export function Slider({
	label,
	value,
	min,
	max,
	step,
	format,
	onChange,
}: {
	label: string;
	value: number;
	min: number;
	max: number;
	step: number;
	format: (v: number) => string;
	onChange: (v: number) => void;
}) {
	return (
		<div className="flex flex-col gap-1">
			<div className="flex justify-between text-xs">
				<span className="text-ink-300">{label}</span>
				<span className="tabular-nums text-ink-100">{format(value)}</span>
			</div>
			<input
				type="range"
				min={min}
				max={max}
				step={step}
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
				className="w-full accent-accent"
			/>
		</div>
	);
}
