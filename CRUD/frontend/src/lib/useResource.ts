import { useEffect, useState } from "react";
import { api } from "./api";

type RequestState<T> =
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: unknown };

export function useResource<T>(path: string) {
  const [revision, setRevision] = useState(0);
  const [snapshot, setSnapshot] = useState<{ key: string; state: RequestState<T> }>();
  const key = path + "|" + revision;

  useEffect(() => {
    const controller = new AbortController();
    api<T>(path, { signal: controller.signal }).then(
      data => { if (!controller.signal.aborted) setSnapshot({ key, state: { status: "success", data } }); },
      error => { if (!controller.signal.aborted) setSnapshot({ key, state: { status: "error", error } }); },
    );
    return () => controller.abort();
  }, [key, path]);

  const state: RequestState<T> = snapshot?.key === key ? snapshot.state : { status: "loading" };
  return { ...state, retry: () => setRevision(value => value + 1) };
}
