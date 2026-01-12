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
        url: "https://qrypto.app",
        icons: ["https://qrypto.app/icon.png"],
      },
    }),
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});
