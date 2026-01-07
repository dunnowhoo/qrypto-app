"use client";
import { ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { base } from "wagmi/chains";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import "@coinbase/onchainkit/styles.css";
import { config } from "./config/wagmi";
import { AuthProvider } from "./context/AuthContext";
import Onboarding from "./components/Onboarding";
import { useOnboarding } from "./hooks/useOnboarding";

const queryClient = new QueryClient();

function OnboardingWrapper({ children }: { children: ReactNode }) {
  const { showOnboarding, isLoading, completeOnboarding } = useOnboarding();

  return (
    <>
      {!isLoading && showOnboarding && (
        <Onboarding onComplete={completeOnboarding} />
      )}
      {children}
    </>
  );
}

export function RootProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
          chain={base}
          config={{
            appearance: {
              mode: "auto",
            },
            wallet: {
              display: "modal",
              preference: "all",
            },
          }}
        >
          <AuthProvider>
            <OnboardingWrapper>{children}</OnboardingWrapper>
          </AuthProvider>
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
