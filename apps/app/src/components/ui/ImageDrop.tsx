import { Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";

export function ImageDrop({
	hasImage,
	onFile,
	label = "Image",
	compact = false,
}: {
	hasImage: boolean;
	onFile: (file: File) => void;
	label?: string;
	compact?: boolean;
}) {
	const [isDragOver, setIsDragOver] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setIsDragOver(false);
			const file = e.dataTransfer.files[0];
			if (file && file.type.startsWith("image/")) onFile(file);
		},
		[onFile],
	);

	const handleInput = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file && file.type.startsWith("image/")) onFile(file);
		},
		[onFile],
	);

	return (
		<div>
			<label className="block text-xs text-ink-300 mb-2 uppercase tracking-widest">{label}</label>
			<button
				type="button"
				className={[
					"flex w-full flex-col items-center justify-center gap-2 rounded border-2 border-dashed text-sm transition-colors cursor-pointer",
					compact ? "py-3" : "py-6",
					isDragOver
						? "border-accent bg-accent/10 text-accent"
						: "border-ink-600 text-ink-300 hover:border-ink-400 hover:text-ink-100",
				].join(" ")}
				onDragOver={(e) => {
					e.preventDefault();
					setIsDragOver(true);
				}}
				onDragLeave={() => setIsDragOver(false)}
				onDrop={handleDrop}
				onClick={() => inputRef.current?.click()}
			>
				<Upload size={compact ? 16 : 20} />
				<span>{hasImage ? "Replace image" : "Drop or click"}</span>
			</button>
			<input
				ref={inputRef}
				type="file"
				accept="image/*"
				className="hidden"
				onChange={handleInput}
			/>
		</div>
	);
}
