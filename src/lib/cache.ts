import { ParsedJob } from "@/lib/jobParser";

interface CacheEntry {
  value: ParsedJob;
  expiresAt: number;
}

// MVP용 인메모리 캐시. 서버리스 환경에서는 인스턴스 간 공유되지 않으므로
// 프로덕션에서는 Redis/Supabase 등 영속 스토리지로 교체 필요.
const store = new Map<string, CacheEntry>();
const TTL_MS = 1000 * 60 * 60 * 24; // 24시간

export function getCachedJob(url: string): ParsedJob | null {
  const entry = store.get(url);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    store.delete(url);
    return null;
  }
  return entry.value;
}

export function setCachedJob(url: string, value: ParsedJob): void {
  store.set(url, { value, expiresAt: Date.now() + TTL_MS });
}
