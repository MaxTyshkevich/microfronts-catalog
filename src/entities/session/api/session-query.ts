import { queryOptions, useQuery } from "@tanstack/react-query";
import { sessionKey } from "@microfronts/contracts";
import { request, type RequestContext } from "../../../shared/api";

export interface Session {
  user: { id: string; name: string; email: string; role: "USER" | "ADMIN" } | null;
}

export function sessionQueryOptions(context: RequestContext) {
  return queryOptions({
    queryKey: sessionKey(context.apiBaseUrl),
    queryFn: async ({ signal }): Promise<Session> => {
      const value = await request<Session>(context, "/auth/me", { credentials: "include", signal });
      if (
        !value ||
        !("user" in value) ||
        (value.user !== null &&
          (typeof value.user?.id !== "string" ||
            typeof value.user.name !== "string" ||
            typeof value.user.email !== "string" ||
            !["USER", "ADMIN"].includes(value.user.role)))
      )
        throw new Error("Некорректный ответ сервера о сессии");
      return value;
    },
    staleTime: 30_000,
    retry: false,
  });
}

export function useSession(context: RequestContext) {
  return useQuery(sessionQueryOptions(context));
}
