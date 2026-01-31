"use client";
import { http, createConfig } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";

export const config = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    injected(), // MetaMask, Brave, etc.
    coinbaseWallet({
      appName: "QRypto",
      preference: "all",
    }),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo-project-id",
      metadata: {
        name: "QRypto",
        description: "QRypto - Crypto Payment App",
        url: typeof window !== 'undefined' ? window.location.origin : "https://qrypto.vercel.app",
        icons: [typeof window !== 'undefined' ? `${window.location.origin}/logo.svg` : "https://qrypto.vercel.app/logo.svg"],
      },
      showQrModal: true,
    }),
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});
