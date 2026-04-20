import { HalftoneImage } from "@vandale/halftone";
import { Download, ImageIcon, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";

export function Editor() {
  const [src, setSrc] = useState<string | null>(null);
  const [darkColor, setDarkColor] = useState("#082463");
  const [lightColor, setLightColor] = useState("#39a2ff");
  const [cellW, setCellW] = useState(16);
  const [cellH, setCellH] = useState(8);
  const [gamma, setGamma] = useState(0.8);
  const [isReady, setIsReady] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setIsReady(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) loadFile(file);
    },
    [loadFile],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) loadFile(file);
    },
    [loadFile],
  );

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.download = "halftone.png";
    a.href = canvas.toDataURL("image/png");
    a.click();
  }, []);

  const resetReady = useCallback(() => setIsReady(false), []);

  return (
    <div className="flex h-dvh flex-col md:flex-row overflow-hidden bg-ink-950 text-ink-50 font-mono">
      {/* Sidebar — below preview on mobile, left column on desktop */}
      <aside className="order-last md:order-first flex flex-1 md:flex-none md:w-72 md:shrink-0 flex-col gap-4 md:gap-6 border-t border-ink-700 md:border-t-0 md:border-r p-4 md:p-5 overflow-y-auto">
        <header>
          <span className="text-xs text-ink-300 tracking-widest uppercase">
            Vandale Radio Images
          </span>
        </header>

        {/* Upload */}
        <section>
          <label className="block text-xs text-ink-300 mb-2 uppercase tracking-widest">
            Image
          </label>
          <button
            type="button"
            className={[
              "flex w-full flex-col items-center justify-center gap-2 rounded border-2 border-dashed py-6 text-sm transition-colors cursor-pointer",
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
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={20} />
            <span>{src ? "Replace image" : "Drop or click"}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileInput}
          />
        </section>

        {/* Colors */}
        <section className="flex flex-col gap-3">
          <label className="text-xs text-ink-300 uppercase tracking-widest">
            Colors
          </label>
          <div className="flex gap-3">
            <ColorPicker
              label="Dark"
              value={darkColor}
              onChange={(v) => {
                setDarkColor(v);
                resetReady();
              }}
            />
            <ColorPicker
              label="Light"
              value={lightColor}
              onChange={(v) => {
                setLightColor(v);
                resetReady();
              }}
            />
          </div>
        </section>

        {/* Sliders */}
        <section className="flex flex-col gap-4">
          <label className="text-xs text-ink-300 uppercase tracking-widest">
            Parameters
          </label>
          <Slider
            label="Cell Width"
            value={cellW}
            min={2}
            max={64}
            step={1}
            format={(v) => String(v)}
            onChange={(v) => {
              setCellW(v);
              resetReady();
            }}
          />
          <Slider
            label="Cell Height"
            value={cellH}
            min={1}
            max={64}
            step={1}
            format={(v) => String(v)}
            onChange={(v) => {
              setCellH(v);
              resetReady();
            }}
          />
          <Slider
            label="Gamma"
            value={gamma}
            min={0.1}
            max={3}
            step={0.05}
            format={(v) => v.toFixed(2)}
            onChange={(v) => {
              setGamma(v);
              resetReady();
            }}
          />
        </section>

        <div className="sticky bottom-0 -mx-4 px-4 pb-4 pt-2 bg-ink-950 md:static md:mx-0 md:px-0 md:pb-0 md:pt-0 mt-auto">
          <button
            type="button"
            disabled={!src || !isReady}
            onClick={handleDownload}
            className="flex w-full items-center justify-center gap-2 rounded bg-accent px-4 py-2.5 text-sm font-medium text-ink-950 transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Download size={16} />
            Download PNG
          </button>
        </div>
      </aside>

      {/* Preview — top on mobile, right column on desktop */}
      <main className="order-first md:order-last flex items-center justify-center overflow-hidden p-4 md:p-6 h-[45vh] md:h-auto md:flex-1">
        {src ? (
          <HalftoneImage
            ref={canvasRef}
            src={src}
            darkColor={darkColor}
            lightColor={lightColor}
            cellW={cellW}
            cellH={cellH}
            gamma={gamma}
            outputWidth={2160}
            onReady={() => setIsReady(true)}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-ink-600">
            <ImageIcon size={48} strokeWidth={1} />
            <span className="text-sm">Upload an image to get started</span>
          </div>
        )}
      </main>
    </div>
  );
}

function ColorPicker({
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

function Slider({
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
