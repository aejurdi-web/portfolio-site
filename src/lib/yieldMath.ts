export type YieldModel = 'poisson' | 'murphy' | 'seeds';

export function diesPerWafer(diameterMm: number, dieAreaMm2: number) {
	const r = diameterMm / 2;
	const dpw = (Math.PI * r * r) / dieAreaMm2 - (Math.PI * diameterMm) / Math.sqrt(2 * dieAreaMm2);
	return Math.max(dpw, 0);
}

export function yieldFraction(model: YieldModel, dieAreaMm2: number, defectDensityPerCm2: number) {
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
