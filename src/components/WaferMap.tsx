import { useMemo } from 'react';

type CellStatus = 'good' | 'bad' | 'edge' | 'outside';

interface Props {
	waferDiameterMm: number;
	dieAreaMm2: number;
	yieldFraction: number;
}

const MIN_GRID = 8;
const MAX_GRID = 44;

function mulberry32(seed: number) {
	return function () {
		seed |= 0;
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function buildGrid(waferDiameterMm: number, dieAreaMm2: number, yieldFractionValue: number) {
	const dieSide = Math.sqrt(dieAreaMm2);
	const rawGrid = Math.round(waferDiameterMm / dieSide);
	const n = Math.min(MAX_GRID, Math.max(MIN_GRID, rawGrid));
	const cellSize = waferDiameterMm / n;
	const radius = waferDiameterMm / 2;

	const statuses: CellStatus[] = new Array(n * n).fill('outside');
	const fullIndices: number[] = [];

	for (let r = 0; r < n; r++) {
		for (let c = 0; c < n; c++) {
			const idx = r * n + c;
			const x = (c + 0.5 - n / 2) * cellSize;
			const y = (r + 0.5 - n / 2) * cellSize;
			const half = cellSize / 2;
			const corners: [number, number][] = [
				[x - half, y - half],
				[x + half, y - half],
				[x - half, y + half],
				[x + half, y + half],
			];
			const distances = corners.map(([cx, cy]) => Math.hypot(cx, cy));
			const maxDist = Math.max(...distances);
			const minDist = Math.min(...distances);

			if (maxDist <= radius) {
				statuses[idx] = 'bad';
				fullIndices.push(idx);
			} else if (minDist >= radius) {
				statuses[idx] = 'outside';
			} else {
				statuses[idx] = 'edge';
			}
		}
	}

	const seed = Math.floor(dieAreaMm2 * 97 + waferDiameterMm * 13 + yieldFractionValue * 100000) || 1;
	const rand = mulberry32(seed);
	const shuffled = [...fullIndices];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}

	const goodCount = Math.round(yieldFractionValue * fullIndices.length);
	const goodSet = new Set(shuffled.slice(0, goodCount));

	for (const idx of fullIndices) {
		statuses[idx] = goodSet.has(idx) ? 'good' : 'bad';
	}

	return { n, statuses, totalFull: fullIndices.length, goodCount };
}

const STATUS_CLASS: Record<CellStatus, string> = {
	good: 'bg-accent',
	bad: 'bg-muted/35',
	edge: 'border border-dashed border-muted/40 bg-muted/10',
	outside: 'bg-transparent',
};

export default function WaferMap({ waferDiameterMm, dieAreaMm2, yieldFraction }: Props) {
	const { n, statuses, totalFull, goodCount } = useMemo(
		() => buildGrid(waferDiameterMm, dieAreaMm2, yieldFraction),
		[waferDiameterMm, dieAreaMm2, yieldFraction]
	);

	return (
		<div>
			<div className="mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-full border border-border bg-bg">
				<div
					className="grid h-full w-full gap-px p-[2px]"
					style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}
				>
					{statuses.map((status, i) => (
						<div key={i} className={`aspect-square rounded-[1px] ${STATUS_CLASS[status]}`} />
					))}
				</div>
			</div>

			<div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-1.5 font-mono text-xs text-muted">
				<span className="flex items-center gap-1.5">
					<span className="h-2.5 w-2.5 rounded-[1px] bg-accent" /> Good
				</span>
				<span className="flex items-center gap-1.5">
					<span className="h-2.5 w-2.5 rounded-[1px] bg-muted/35" /> Defective
				</span>
				<span className="flex items-center gap-1.5">
					<span className="h-2.5 w-2.5 rounded-[1px] border border-dashed border-muted/40 bg-muted/10" /> Edge (partial)
				</span>
			</div>

			<p className="mt-3 text-center font-mono text-[0.65rem] leading-snug text-muted">
				Illustrative: {totalFull.toLocaleString('en-US')} representative dies shown, {goodCount.toLocaleString('en-US')} good.
			</p>
		</div>
	);
}
