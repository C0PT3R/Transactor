export interface ResolutionResult {
	readonly changed: boolean
	readonly maxDeltaCents: number
}

export interface IterativeResolver {
	readonly name: string
	resolve(): ResolutionResult
}

export interface IterativeResolutionOptions {
	readonly maxIterations?: number
	readonly toleranceCents?: number
}

export function runIterativeResolution(
	resolvers: readonly IterativeResolver[],
	options: IterativeResolutionOptions = {}
): void {
	const maxIterations = options.maxIterations ?? 100
	const toleranceCents = options.toleranceCents ?? 1

	if (!Number.isSafeInteger(maxIterations) || maxIterations <= 0)
		throw new Error("maxIterations must be a positive safe integer.")

	if (!Number.isSafeInteger(toleranceCents) || toleranceCents < 0)
		throw new Error("toleranceCents must be a non-negative safe integer.")

	for (let iteration = 1; iteration <= maxIterations; iteration++) {
		let maxDeltaCents = 0

		for (const resolver of resolvers) {
			const result = resolver.resolve()
			maxDeltaCents = Math.max(maxDeltaCents, result.maxDeltaCents)
		}

		/*
		 * Monetary feedback loops can alternate between adjacent cent-rounded
		 * states forever. Values are considered converged once every resolver moves
		 * by no more than the configured monetary tolerance.
		 */
		if (maxDeltaCents <= toleranceCents)
			return
	}

	throw new Error(
		`Iterative resolution did not converge after ${maxIterations} iterations. ` +
		`Resolvers: ${resolvers.map(resolver => resolver.name).join(", ")}`
	)
}

export function resolutionResult(maxDeltaCents: number): ResolutionResult {
	if (!Number.isSafeInteger(maxDeltaCents) || maxDeltaCents < 0)
		throw new Error("Resolution delta must be a non-negative safe integer number of cents.")

	return {
		changed: maxDeltaCents > 0,
		maxDeltaCents
	}
}
