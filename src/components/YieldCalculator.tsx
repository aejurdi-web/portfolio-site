import { useMemo, useState } from 'react';
import WaferMap from './WaferMap';
import YieldCurveChart from './YieldCurveChart';
import { diesPerWafer, yieldFraction, type YieldModel } from '../lib/yieldMath';

const WAFER_DIAMETERS = [200, 300] as const;
type WaferDiameter = (typeof WAFER_DIAMETERS)[number];

const DEFAULT_WAFER_COST: Record<WaferDiameter, number> = {
	200: 3500,
	300: 17000,
};

const YIELD_MODEL_LABELS: Record<YieldModel, string> = {
	poisson: 'Poisson',
	murphy: 'Murphy',
	seeds: 'Seeds',
};

function formatCurrency(value: number) {
	if (!Number.isFinite(value)) return '—';
	return value.toLocaleString('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: value < 10 ? 2 : 0,
		maximumFractionDigits: 2,
	});
}

const RETICLE_LIMIT_MM2 = 858;

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

	const [compareMode, setCompareMode] = useState(false);
	const [totalLogicArea, setTotalLogicArea] = useState(600);
	const [numChiplets, setNumChiplets] = useState(4);
	const [interfaceOverheadPct, setInterfaceOverheadPct] = useState(8);
	const [kgdCost, setKgdCost] = useState(3);
	const [packagingCost, setPackagingCost] = useState(80);
	const [assemblyYieldPct, setAssemblyYieldPct] = useState(97);

	const dpw = useMemo(() => diesPerWafer(waferDiameter, dieArea), [waferDiameter, dieArea]);
	const yieldPct = useMemo(() => yieldFraction(model, dieArea, defectDensity), [model, dieArea, defectDensity]);
	const goodDies = dpw * yieldPct;
	const costPerGoodDie = goodDies > 0 ? waferCost / goodDies : Infinity;

	const monoExceedsReticle = totalLogicArea > RETICLE_LIMIT_MM2;
	const monoDpw = useMemo(() => diesPerWafer(waferDiameter, totalLogicArea), [waferDiameter, totalLogicArea]);
	const monoYieldPct = useMemo(
		() => yieldFraction(model, totalLogicArea, defectDensity),
		[model, totalLogicArea, defectDensity]
	);
	const monoGoodDies = monoDpw * monoYieldPct;
	const monoCostPerGoodDie = monoExceedsReticle || monoGoodDies <= 0 ? Infinity : waferCost / monoGoodDies;

	const chipletArea = (totalLogicArea / numChiplets) * (1 + interfaceOverheadPct / 100);
	const chipletDpw = useMemo(() => diesPerWafer(waferDiameter, chipletArea), [waferDiameter, chipletArea]);
	const chipletYieldPct = useMemo(
		() => yieldFraction(model, chipletArea, defectDensity),
		[model, chipletArea, defectDensity]
	);
	const chipletGoodDies = chipletDpw * chipletYieldPct;
	const costPerGoodChiplet = chipletGoodDies > 0 ? waferCost / chipletGoodDies : Infinity;
	const totalChipletCost =
		(numChiplets * costPerGoodChiplet + numChiplets * kgdCost + packagingCost) / (assemblyYieldPct / 100);

	const chipletWins = monoExceedsReticle || totalChipletCost < monoCostPerGoodDie;
	const compareDiff = Math.abs(monoCostPerGoodDie - totalChipletCost);

	function handleWaferDiameterChange(next: WaferDiameter) {
		setWaferDiameter(next);
		setWaferCost(DEFAULT_WAFER_COST[next]);
	}

	return (
		<>
		<div className="mb-10 flex items-center justify-between gap-4 border-b border-border pb-6">
			<div>
				<p className="font-mono text-xs uppercase tracking-wide text-muted">Mode</p>
				<p className="mt-1 text-sm text-ink">Compare: Monolithic vs. Chiplet</p>
			</div>
			<button
				type="button"
				role="switch"
				aria-checked={compareMode}
				onClick={() => setCompareMode((v) => !v)}
				className={`border px-4 py-2 font-mono text-xs uppercase tracking-wide transition-colors ${
					compareMode ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted hover:text-ink'
				}`}
			>
				{compareMode ? 'On' : 'Off'}
			</button>
		</div>

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
					<p className="mt-2 font-mono text-[0.65rem] leading-snug text-muted">
						Illustrative estimate ({waferDiameter}mm, {waferDiameter === 300 ? '5nm-class' : 'mature node'}) — override with your own figure.
					</p>
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

			<div className="border border-border bg-surface p-6 lg:col-span-2">
				<p className="font-mono text-xs uppercase tracking-wide text-muted">
					Yield vs. Die Area ({YIELD_MODEL_LABELS[model]})
				</p>
				<div className="mt-6">
					<YieldCurveChart model={model} defectDensityPerCm2={defectDensity} currentDieAreaMm2={dieArea} />
				</div>
			</div>

			<div className="border border-border bg-surface p-6 lg:col-span-2">
				<p className="font-mono text-xs uppercase tracking-wide text-muted">Wafer Map</p>
				<div className="mt-6">
					<WaferMap waferDiameterMm={waferDiameter} dieAreaMm2={dieArea} yieldFraction={yieldPct} />
				</div>
			</div>
		</div>

		{compareMode && (
			<div className="mt-12 border-t border-border pt-10">
				<p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Compare</p>
				<h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">
					Monolithic vs. Chiplet
				</h2>

				<div className="mt-8 grid gap-10 lg:grid-cols-[1fr_1fr]">
					<div className="space-y-8">
						<SliderField
							label="Total Logic Area Target"
							unit="mm²"
							value={totalLogicArea}
							min={10}
							max={2000}
							step={10}
							onChange={setTotalLogicArea}
						/>
						<SliderField
							label="Number of Chiplets (N)"
							unit="chiplets"
							value={numChiplets}
							min={2}
							max={8}
							step={1}
							onChange={setNumChiplets}
						/>
						<SliderField
							label="Interface Overhead per Chiplet"
							unit="%"
							value={interfaceOverheadPct}
							min={0}
							max={30}
							step={0.5}
							onChange={setInterfaceOverheadPct}
						/>
						<SliderField
							label="Assembly Yield"
							unit="%"
							value={assemblyYieldPct}
							min={80}
							max={100}
							step={0.5}
							onChange={setAssemblyYieldPct}
						/>

						<div className="flex items-baseline justify-between">
							<label className="font-mono text-xs uppercase tracking-wide text-muted">KGD Test Cost / Die</label>
							<div className="flex items-baseline gap-1.5">
								<span className="font-mono text-xs text-muted">$</span>
								<input
									type="number"
									className="w-20 border border-border bg-bg px-2 py-1 text-right font-mono text-sm text-ink focus:border-accent focus:outline-none"
									value={kgdCost}
									min={0}
									step={0.5}
									onChange={(e) => {
										const next = Number(e.target.value);
										if (Number.isFinite(next)) setKgdCost(Math.max(0, next));
									}}
								/>
							</div>
						</div>

						<div className="flex items-baseline justify-between">
							<label className="font-mono text-xs uppercase tracking-wide text-muted">
								Packaging / Assembly Fixed Cost
							</label>
							<div className="flex items-baseline gap-1.5">
								<span className="font-mono text-xs text-muted">$</span>
								<input
									type="number"
									className="w-20 border border-border bg-bg px-2 py-1 text-right font-mono text-sm text-ink focus:border-accent focus:outline-none"
									value={packagingCost}
									min={0}
									step={5}
									onChange={(e) => {
										const next = Number(e.target.value);
										if (Number.isFinite(next)) setPackagingCost(Math.max(0, next));
									}}
								/>
							</div>
						</div>
					</div>

					<div className="space-y-6">
						{monoExceedsReticle && (
							<div className="border-2 border-accent bg-accent/5 p-4">
								<p className="font-mono text-xs uppercase tracking-wide text-accent">Manufacturing Constraint</p>
								<p className="mt-2 text-sm text-ink">
									{totalLogicArea}mm² exceeds the ~858mm² reticle limit (TSMC's max single-exposure field). A
									monolithic die at this size isn't just more expensive — it's physically impossible to print
									in one exposure, regardless of cost.
								</p>
							</div>
						)}

						<div className="grid grid-cols-2 gap-4">
							<div
								className={`border p-4 ${
									!chipletWins ? 'border-accent bg-accent/5' : 'border-border bg-surface'
								}`}
							>
								<p className="font-mono text-xs uppercase tracking-wide text-muted">Monolithic</p>
								<p className="mt-3 font-mono text-2xl text-ink">
									{monoExceedsReticle ? 'N/A' : formatCurrency(monoCostPerGoodDie)}
								</p>
								<p className="mt-1 font-mono text-[0.65rem] text-muted">per good finished chip</p>
								<dl className="mt-4 space-y-1 font-mono text-[0.65rem] text-muted">
									<div className="flex justify-between">
										<dt>Die area</dt>
										<dd className="text-ink">{totalLogicArea}mm²</dd>
									</div>
									<div className="flex justify-between">
										<dt>Yield</dt>
										<dd className="text-ink">{monoExceedsReticle ? '—' : `${(monoYieldPct * 100).toFixed(1)}%`}</dd>
									</div>
								</dl>
							</div>

							<div
								className={`border p-4 ${chipletWins ? 'border-accent bg-accent/5' : 'border-border bg-surface'}`}
							>
								<p className="font-mono text-xs uppercase tracking-wide text-muted">Chiplet</p>
								<p className="mt-3 font-mono text-2xl text-ink">{formatCurrency(totalChipletCost)}</p>
								<p className="mt-1 font-mono text-[0.65rem] text-muted">per good finished package</p>
								<dl className="mt-4 space-y-1 font-mono text-[0.65rem] text-muted">
									<div className="flex justify-between">
										<dt>Chiplet area</dt>
										<dd className="text-ink">{chipletArea.toFixed(1)}mm²</dd>
									</div>
									<div className="flex justify-between">
										<dt>Yield / chiplet</dt>
										<dd className="text-ink">{(chipletYieldPct * 100).toFixed(1)}%</dd>
									</div>
								</dl>
							</div>
						</div>

						<div className="border border-border bg-surface p-4 text-center">
							<p className="font-mono text-sm text-ink">
								{monoExceedsReticle ? (
									<>
										<span className="text-accent">Chiplet</span> wins — monolithic is not manufacturable at this
										die size.
									</>
								) : (
									<>
										<span className="text-accent">{chipletWins ? 'Chiplet' : 'Monolithic'}</span> wins by{' '}
										<span className="text-accent">{formatCurrency(compareDiff)}</span> per unit.
									</>
								)}
							</p>
						</div>
					</div>
				</div>
			</div>
		)}
		</>
	);
}
