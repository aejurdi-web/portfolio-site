import { useMemo, useState } from 'react';

type YieldModel = 'poisson' | 'murphy' | 'seeds';

const WAFER_DIAMETERS = [200, 300] as const;
type WaferDiameter = (typeof WAFER_DIAMETERS)[number];

const DEFAULT_WAFER_COST: Record<WaferDiameter, number> = {
	200: 1500,
	300: 5000,
};

const YIELD_MODEL_LABELS: Record<YieldModel, string> = {
	poisson: 'Poisson',
	murphy: 'Murphy',
	seeds: 'Seeds',
};

function diesPerWafer(diameterMm: number, dieAreaMm2: number) {
	const r = diameterMm / 2;
	const dpw = (Math.PI * r * r) / dieAreaMm2 - (Math.PI * diameterMm) / Math.sqrt(2 * dieAreaMm2);
	return Math.max(dpw, 0);
}

function yieldFraction(model: YieldModel, dieAreaMm2: number, defectDensityPerCm2: number) {
	const dieAreaCm2 = dieAreaMm2 / 100;
	const ad0 = dieAreaCm2 * defectDensityPerCm2;

	switch (model) {
		case 'poisson':
			return Math.exp(-ad0);
		case 'murphy':
			return ad0 === 0 ? 1 : ((1 - Math.exp(-ad0)) / ad0) ** 2;
		case 'seeds':
			return Math.exp(-Math.sqrt(ad0));
	}
}

function formatCurrency(value: number) {
	if (!Number.isFinite(value)) return '—';
	return value.toLocaleString('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: value < 10 ? 2 : 0,
		maximumFractionDigits: 2,
	});
}

interface SliderFieldProps {
	label: string;
	unit: string;
	value: number;
	min: number;
	max: number;
	step: number;
	onChange: (value: number) => void;
}

function SliderField({ label, unit, value, min, max, step, onChange }: SliderFieldProps) {
	return (
		<div>
			<div className="flex items-baseline justify-between">
				<label className="font-mono text-xs uppercase tracking-wide text-muted">{label}</label>
				<div className="flex items-baseline gap-1.5">
					<input
						type="number"
						className="w-20 border border-border bg-bg px-2 py-1 text-right font-mono text-sm text-ink focus:border-accent focus:outline-none"
						value={value}
						min={min}
						max={max}
						step={step}
						onChange={(e) => {
							const next = Number(e.target.value);
							if (Number.isFinite(next)) onChange(Math.min(max, Math.max(min, next)));
						}}
					/>
					<span className="font-mono text-xs text-muted">{unit}</span>
				</div>
			</div>
			<input
				type="range"
				className="mt-3 w-full accent-accent"
				value={value}
				min={min}
				max={max}
				step={step}
				onChange={(e) => onChange(Number(e.target.value))}
			/>
		</div>
	);
}

export default function YieldCalculator() {
	const [dieArea, setDieArea] = useState(100);
	const [defectDensity, setDefectDensity] = useState(0.1);
	const [waferDiameter, setWaferDiameter] = useState<WaferDiameter>(300);
	const [waferCost, setWaferCost] = useState(DEFAULT_WAFER_COST[300]);
	const [model, setModel] = useState<YieldModel>('murphy');

	const dpw = useMemo(() => diesPerWafer(waferDiameter, dieArea), [waferDiameter, dieArea]);
	const yieldPct = useMemo(() => yieldFraction(model, dieArea, defectDensity), [model, dieArea, defectDensity]);
	const goodDies = dpw * yieldPct;
	const costPerGoodDie = goodDies > 0 ? waferCost / goodDies : Infinity;

	function handleWaferDiameterChange(next: WaferDiameter) {
		setWaferDiameter(next);
		setWaferCost(DEFAULT_WAFER_COST[next]);
	}

	return (
		<div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
			<div className="space-y-8">
				<SliderField
					label="Die Area"
					unit="mm²"
					value={dieArea}
					min={10}
					max={900}
					step={1}
					onChange={setDieArea}
				/>
				<SliderField
					label="Defect Density (D0)"
					unit="defects/cm²"
					value={defectDensity}
					min={0.05}
					max={0.2}
					step={0.005}
					onChange={setDefectDensity}
				/>

				<div>
					<label className="font-mono text-xs uppercase tracking-wide text-muted">Wafer Diameter</label>
					<div className="mt-3 flex gap-2">
						{WAFER_DIAMETERS.map((d) => (
							<button
								key={d}
								type="button"
								className={`flex-1 border px-4 py-2 font-mono text-sm transition-colors ${
									waferDiameter === d
										? 'border-accent bg-accent/10 text-accent'
										: 'border-border text-muted hover:text-ink'
								}`}
								onClick={() => handleWaferDiameterChange(d)}
							>
								{d}mm
							</button>
						))}
					</div>
				</div>

				<div>
					<div className="flex items-baseline justify-between">
						<label className="font-mono text-xs uppercase tracking-wide text-muted">Wafer Cost</label>
						<div className="flex items-baseline gap-1.5">
							<span className="font-mono text-xs text-muted">$</span>
							<input
								type="number"
								className="w-24 border border-border bg-bg px-2 py-1 text-right font-mono text-sm text-ink focus:border-accent focus:outline-none"
								value={waferCost}
								min={0}
								step={50}
								onChange={(e) => {
									const next = Number(e.target.value);
									if (Number.isFinite(next)) setWaferCost(Math.max(0, next));
								}}
							/>
						</div>
					</div>
				</div>

				<div>
					<label className="font-mono text-xs uppercase tracking-wide text-muted" htmlFor="yield-model">
						Yield Model
					</label>
					<select
						id="yield-model"
						className="mt-3 w-full border border-border bg-bg px-3 py-2 font-mono text-sm text-ink focus:border-accent focus:outline-none"
						value={model}
						onChange={(e) => setModel(e.target.value as YieldModel)}
					>
						{(Object.keys(YIELD_MODEL_LABELS) as YieldModel[]).map((key) => (
							<option key={key} value={key}>
								{YIELD_MODEL_LABELS[key]}
							</option>
						))}
					</select>
				</div>
			</div>

			<div className="border border-border bg-surface p-6">
				<p className="font-mono text-xs uppercase tracking-wide text-muted">Results</p>

				<dl className="mt-6 space-y-6">
					<div className="border-b border-border pb-4">
						<dt className="font-mono text-xs uppercase tracking-wide text-muted">Yield ({YIELD_MODEL_LABELS[model]})</dt>
						<dd className="mt-1 font-mono text-3xl text-accent">{(yieldPct * 100).toFixed(1)}%</dd>
					</div>
					<div className="border-b border-border pb-4">
						<dt className="font-mono text-xs uppercase tracking-wide text-muted">Dies per Wafer</dt>
						<dd className="mt-1 font-mono text-xl text-ink">{Math.round(dpw).toLocaleString('en-US')}</dd>
					</div>
					<div className="border-b border-border pb-4">
						<dt className="font-mono text-xs uppercase tracking-wide text-muted">Good Dies per Wafer</dt>
						<dd className="mt-1 font-mono text-xl text-ink">{Math.round(goodDies).toLocaleString('en-US')}</dd>
					</div>
					<div>
						<dt className="font-mono text-xs uppercase tracking-wide text-muted">Cost per Good Die</dt>
						<dd className="mt-1 font-mono text-xl text-ink">{formatCurrency(costPerGoodDie)}</dd>
					</div>
				</dl>
			</div>
		</div>
	);
}
