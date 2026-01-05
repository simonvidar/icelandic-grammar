import { CHUNK_COUNT, WORDS_PER_ROUND } from '@/src/config/words'
import loadRandomChunk from '@/src/data/LoadChunk'
import type { WordEntry } from '@/src/types/word'
import { randomInt } from '@/src/utils/random'

export async function loadGameWords(): Promise<WordEntry[]> {
  const used = new Set<string>()
  const result: WordEntry[] = []

  while (result.length < WORDS_PER_ROUND) {
    const chunkIndex = randomInt(CHUNK_COUNT)
    const chunk = await loadRandomChunk()

    while (chunk.length && result.length < WORDS_PER_ROUND) {
      const i = randomInt(chunk.length)
      const [word, gender] = chunk[i]

      if (!used.has(word)) {
        used.add(word)
        result.push({ word, gender })
      }
    }
  }
  return result
}
