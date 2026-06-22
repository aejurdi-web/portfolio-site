import { useMemo } from 'react';
import { yieldFraction, type YieldModel } from '../lib/yieldMath';

interface Props {
	model: YieldModel;
	defectDensityPerCm2: number;
	currentDieAreaMm2: number;
}

interface ReferenceMarker {
	areaMm2: number;
	label: string;
}

const MIN_AREA = 10;
const MAX_AREA = 1000;
const SAMPLE_COUNT = 140;

const REFERENCE_MARKERS: ReferenceMarker[] = [
	{ areaMm2: 858, label: 'TSMC reticle limit' },
	{ areaMm2: 814, label: 'NVIDIA H100 die size' },
];

const VIEW_W = 640;
const VIEW_H = 320;
const MARGIN = { top: 44, right: 16, bottom: 36, left: 44 };
const PLOT_W = VIEW_W - MARGIN.left - MARGIN.right;
const PLOT_H = VIEW_H - MARGIN.top - MARGIN.bottom;

function scaleX(areaMm2: number) {
	const t = (areaMm2 - MIN_AREA) / (MAX_AREA - MIN_AREA);
	return MARGIN.left + t * PLOT_W;
}

function scaleY(yieldPct: number) {
	const t = yieldPct / 100;
	return MARGIN.top + (1 - t) * PLOT_H;
}

const X_TICKS = [10, 200, 400, 600, 800, 1000];
const Y_TICKS = [0, 25, 50, 75, 100];

export default function YieldCurveChart({ model, defectDensityPerCm2, currentDieAreaMm2 }: Props) {
	const points = useMemo(() => {
		const pts: { x: number; y: number }[] = [];
		for (let i = 0; i < SAMPLE_COUNT; i++) {
			const area = MIN_AREA + ((MAX_AREA - MIN_AREA) * i) / (SAMPLE_COUNT - 1);
			const pct = yieldFraction(model, area, defectDensityPerCm2) * 100;
			pts.push({ x: scaleX(area), y: scaleY(pct) });
		}
		return pts;
	}, [model, defectDensityPerCm2]);

	const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');

	const currentArea = Math.min(MAX_AREA, Math.max(MIN_AREA, currentDieAreaMm2));
	const currentYieldPct = yieldFraction(model, currentArea, defectDensityPerCm2) * 100;
	const currentX = scaleX(currentArea);
	const currentY = scaleY(currentYieldPct);
	const currentLabelAnchor = currentX > VIEW_W - 110 ? 'end' : 'start';
	const currentLabelX = currentLabelAnchor === 'end' ? currentX - 10 : currentX + 10;

	return (
		<svg
			viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
			className="w-full"
			role="img"
			aria-label={`Yield versus die area curve for the ${model} model`}
		>
			{Y_TICKS.map((tick) => (
				<g key={tick}>
					<line
						x1={MARGIN.left}
						x2={VIEW_W - MARGIN.right}
						y1={scaleY(tick)}
						y2={scaleY(tick)}
						stroke="var(--color-border)"
						strokeWidth={1}
					/>
					<text
						x={MARGIN.left - 8}
						y={scaleY(tick)}
						textAnchor="end"
						dominantBaseline="middle"
						className="font-mono text-[9px] fill-muted"
					>
						{tick}%
					</text>
				</g>
			))}

			{X_TICKS.map((tick) => (
				<g key={tick}>
					<line
						x1={scaleX(tick)}
						x2={scaleX(tick)}
						y1={MARGIN.top}
						y2={VIEW_H - MARGIN.bottom}
						stroke="var(--color-border)"
						strokeWidth={0.5}
						opacity={0.4}
					/>
					<text
						x={scaleX(tick)}
						y={VIEW_H - MARGIN.bottom + 16}
						textAnchor="middle"
						className="font-mono text-[9px] fill-muted"
					>
						{tick}
					</text>
				</g>
			))}
			<text
				x={MARGIN.left + PLOT_W / 2}
				y={VIEW_H - 4}
				textAnchor="middle"
				className="font-mono text-[9px] uppercase tracking-wide fill-muted"
			>
				Die Area (mm²)
			</text>

			{REFERENCE_MARKERS.map((marker, i) => {
				const x = scaleX(marker.areaMm2);
				const labelY = MARGIN.top - 28 + i * 13;
				return (
					<g key={marker.label}>
						<line
							x1={x}
							x2={x}
							y1={MARGIN.top}
							y2={VIEW_H - MARGIN.bottom}
							stroke="var(--color-accent)"
							strokeWidth={1}
							strokeDasharray="3,3"
							opacity={0.6}
						/>
						<text
							x={x}
							y={labelY}
							textAnchor="middle"
							className="font-mono text-[8.5px] fill-accent"
						>
							{marker.label} ({marker.areaMm2})
						</text>
					</g>
				);
			})}

			<path d={pathD} fill="none" stroke="var(--color-accent)" strokeWidth={2} />

			<line
				x1={currentX}
				x2={currentX}
				y1={currentY}
				y2={VIEW_H - MARGIN.bottom}
				stroke="var(--color-ink)"
				strokeWidth={1}
				strokeDasharray="2,2"
				opacity={0.5}
			/>
			<circle cx={currentX} cy={currentY} r={5} fill="var(--color-bg)" stroke="var(--color-ink)" strokeWidth={2} />
			<text
				x={currentLabelX}
				y={currentY - 10}
				textAnchor={currentLabelAnchor}
				className="font-mono text-[10px] fill-ink"
			>
				{Math.round(currentArea)}mm² · {currentYieldPct.toFixed(1)}%
			</text>
		</svg>
	);
}
