export interface BatchProcessorOptions {
  batchSize: number;
  delayBetweenBatchesMs?: number;
}

export async function processBatched<TInput, TOutput>(
  items: TInput[],
  processor: (item: TInput) => Promise<TOutput>,
  options: BatchProcessorOptions
): Promise<TOutput[]> {
  const { batchSize, delayBetweenBatchesMs = 0 } = options;
  const results: TOutput[] = [];

  const batches = createBatches(items, batchSize);

  for (const batch of batches) {
    const batchResults = await Promise.all(batch.map((item) => processor(item).catch((_) => null)));

    for (const result of batchResults) {
      if (result !== null) {
        results.push(result);
      }
    }

    if (delayBetweenBatchesMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenBatchesMs));
    }
  }

  return results;
}

export function createBatches<T>(array: T[], batchSize: number): T[][] {
  return array.reduce((result: T[][], item: T, index: number) => {
    const batchIndex = Math.floor(index / batchSize);
    if (!result[batchIndex]) result[batchIndex] = [];
    result[batchIndex].push(item);
    return result;
  }, []);
}
