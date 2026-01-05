import { chunks } from '@/src/data/chunksIndex'
import type { Gender } from '@/src/types/word'

export default function loadRandomChunk(): [string, Gender][] {
  const index = Math.floor(Math.random() * chunks.length)
  return chunks[index] as [string, Gender][]
}
