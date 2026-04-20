import logoSvg from "@/assets/logo_vndl.svg?raw";

// Patch the raw SVG so every shape inherits color via CSS currentColor,
// and so the <svg> itself scales to fill its container.
const tintableSvg = logoSvg
	.replace(
		/<svg /,
		'<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" ',
	)
	.replace(/<polygon /g, '<polygon fill="currentColor" ')
	.replace(/<rect /g, '<rect fill="currentColor" ');

export function VndlLogo({
	color,
	style,
	className,
}: {
	color: string;
	style?: React.CSSProperties;
	className?: string;
}) {
	return (
		<div
			// biome-ignore lint/security/noDangerouslySetInnerHtml: inlining a trusted, bundled SVG
			dangerouslySetInnerHTML={{ __html: tintableSvg }}
			className={className}
			style={{
				color,
				lineHeight: 0,
				...style,
			}}
		/>
	);
}
