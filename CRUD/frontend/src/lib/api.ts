export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly fields: Record<string, string> = {},
  ) {
    super(message);
  }
}

export const sessionExpiredEvent = "lifehub:session-expired";

export async function api<T>(path: string, options: {
  method?: string;
  json?: object;
  signal?: AbortSignal;
} = {}): Promise<T> {
  const response = await fetch("/api" + path, {
    method: options.method,
    headers: options.json ? { "Content-Type": "application/json" } : undefined,
    body: options.json ? JSON.stringify(options.json) : undefined,
    credentials: "same-origin",
    signal: options.signal,
  });

  if (!response.ok) {
    const details = await response.json().catch(() => ({})) as {
      error?: string;
      fields?: Record<string, string>;
    };
    if (response.status === 401 && !path.startsWith("/auth/")) {
      window.dispatchEvent(new Event(sessionExpiredEvent));
    }
    throw new ApiError(response.status, details.error ?? "A API não conseguiu atender à solicitação.", details.fields);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function messageOf(error: unknown) {
  return error instanceof ApiError ? error.message : "Falha de conexão. Tente novamente.";
}
