// Tempo estimado de leitura em minutos (português, 200 ppm).
import readingTime from "reading-time";

export function computeReadingMinutes(content: string): number {
  const { minutes } = readingTime(content, { wordsPerMinute: 200 });
  return Math.max(1, Math.round(minutes));
}
