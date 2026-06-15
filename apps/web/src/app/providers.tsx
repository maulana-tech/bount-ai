"use client";

import { ReactNode, useState } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit";
import { wagmiConfig } from "@/lib/wagmi";
import { BudgetProvider } from "@/lib/budget";

import "@rainbow-me/rainbowkit/styles.css";

/**
 * Re-theme RainbowKit ke palet kita (warm paper + gold) — bukan biru default,
 * biar selaras UI_GUIDE dan kabur dari laut biru dApp.
 */
const rkTheme = lightTheme({
  accentColor: "#A86B1A",
  accentColorForeground: "#FFFFFF",
  borderRadius: "small",
  fontStack: "system",
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={rkTheme} locale="en-US">
          <BudgetProvider>{children}</BudgetProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
