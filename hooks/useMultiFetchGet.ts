// hooks/useMultiFetchGet.ts
import { useCallback, useEffect, useState } from "react";

interface UseMultiFetchGetResult<T = unknown> {
  data: T[];
  errors: (Error | null)[];
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useMultiFetchGet<T = unknown>(
  urls: string[],
  options?: RequestInit,
  immediate = true
): UseMultiFetchGetResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [errors, setErrors] = useState<(Error | null)[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!urls || urls.length === 0) return;
    setLoading(true);

    try {
      const results = await Promise.all(
        urls.map(async (url) => {
          try {
            const res = await fetch(url, { method: "GET", ...options });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const contentType = res.headers.get("content-type");
            const parsed = contentType?.includes("application/json")
              ? await res.json()
              : await res.text();
            return parsed as T;
          } catch (err) {
            console.error(`❌ ${url} 실패`, err);
            throw err;
          }
        })
      );
      setData(results);
      setErrors(Array(urls.length).fill(null));
    } catch (err) {
      // 개별 에러 캐치
      setErrors(
        urls.map((url, i) => {
          try {
            return (err as Error[])[i] ?? null;
          } catch {
            return err as Error;
          }
        })
      );
    } finally {
      setLoading(false);
    }
  }, [urls, options]);

  useEffect(() => {
    if (immediate) fetchAll();
  }, [fetchAll, immediate]);

  return { data, errors, loading, refetch: fetchAll };
}
