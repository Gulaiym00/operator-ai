"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useState } from "react";

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // данные считаются свежими 30 с — переходы между страницами не
            // перезапрашивают всё заново (важно для Gmail/Drive: это вызовы Google API)
            staleTime: 30_000,
            // по умолчанию каждый возврат на вкладку перезапрашивал все запросы
            refetchOnWindowFocus: false,
            // 4xx (не подключён Google, нет доступа, не найдено) повторять
            // бессмысленно — по умолчанию было 3 попытки с паузами ~7 с;
            // повторяем только сетевые сбои и 5xx, и то один раз
            retry: (failureCount, error) => {
              const status = (error as AxiosError).response?.status;
              if (status && status < 500) return false;
              return failureCount < 1;
            },
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
