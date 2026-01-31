import { useState, useCallback } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from "wagmi";
import { parseUnits, decodeEventLog } from "viem";
import { IDRX_ABI, IDRX_CONTRACTS, IDRX_SUPPORTED_CHAINS } from "@/app/lib/idrx";

export type BridgeStep = "idle" | "burning" | "confirming" | "submitting" | "success" | "error";

interface BridgeState {
  step: BridgeStep;
  txHash?: string;
  bridgeNonce?: string;
  error?: string;
  bridgeRequestId?: number;
}

export function useIDRXBridge() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [state, setState] = useState<BridgeState>({ step: "idle" });

  const { writeContractAsync } = useWriteContract();

  // Step 1: Burn IDRX on source chain
  const burnBridge = useCallback(
    async (amount: string, fromChainId: number, toChainId: number) => {
      if (!address) {
        setState({ step: "error", error: "Wallet not connected" });
        return null;
      }

      const contractAddress = IDRX_CONTRACTS[fromChainId];
      if (!contractAddress) {
        setState({ step: "error", error: `IDRX not available on chain ${fromChainId}` });
        return null;
      }

      try {
        setState({ step: "burning" });

        // IDRX has 2 decimals
        const amountRaw = parseUnits(amount, 2);

        // Call burnBridge on IDRX contract
        const hash = await writeContractAsync({
          address: contractAddress,
          abi: IDRX_ABI,
          functionName: "burnBridge",
          args: [amountRaw, BigInt(toChainId)],
        });

        setState({ step: "confirming", txHash: hash });
        return hash;
      } catch (error) {
        console.error("Burn error:", error);
        setState({
          step: "error",
          error: error instanceof Error ? error.message : "Failed to burn IDRX",
        });
        return null;
      }
    },
    [address, writeContractAsync]
  );

  // Step 2: Parse burn transaction to get bridgeNonce
  const parseBurnReceipt = useCallback(
    async (txHash: `0x${string}`) => {
      if (!publicClient) return null;

      try {
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

        // Find BurnBridge event in logs
        for (const log of receipt.logs) {
          try {
            const decoded = decodeEventLog({
              abi: IDRX_ABI,
              data: log.data,
              topics: log.topics,
            });

            if (decoded.eventName === "BurnBridge") {
              const args = decoded.args as {
                _user: string;
                _amount: bigint;
                amountAfterCut: bigint;
                toChain: bigint;
                _bridgeNonce: bigint;
                platformFee: bigint;
              };
              return {
                bridgeNonce: args._bridgeNonce.toString(),
                amountAfterCut: args.amountAfterCut.toString(),
                platformFee: args.platformFee.toString(),
              };
            }
          } catch {
            // Not our event, continue
          }
        }

        return null;
      } catch (error) {
        console.error("Parse receipt error:", error);
        return null;
      }
    },
    [publicClient]
  );

  // Step 3: Submit bridge request to IDRX API
  const submitBridgeRequest = useCallback(
    async (params: {
      txHashBurn: string;
      bridgeFromChainId: number;
      bridgeToChainId: number;
      amount: string;
      bridgeNonce: string;
      destinationWalletAddress?: string;
    }) => {
      if (!address) {
        setState({ step: "error", error: "Wallet not connected" });
        return null;
      }

      try {
        setState({ step: "submitting" });

        const response = await fetch("/api/idrx/bridge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress: address,
            txHashBurn: params.txHashBurn,
            bridgeFromChainId: params.bridgeFromChainId,
            bridgeToChainId: params.bridgeToChainId,
            amount: params.amount,
            bridgeNonce: params.bridgeNonce,
            destinationWalletAddress: params.destinationWalletAddress || address,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setState({ step: "error", error: data.error || "Bridge request failed" });
          return null;
        }

        setState({
          step: "success",
          txHash: params.txHashBurn,
          bridgeNonce: params.bridgeNonce,
          bridgeRequestId: data.data?.id,
        });

        return data;
      } catch (error) {
        console.error("Bridge request error:", error);
        setState({
          step: "error",
          error: error instanceof Error ? error.message : "Failed to submit bridge request",
        });
        return null;
      }
    },
    [address]
  );

  // Full bridge flow
  const bridge = useCallback(
    async (amount: string, fromChainId: number, toChainId: number, destinationAddress?: string) => {
      // Step 1: Burn
      const txHash = await burnBridge(amount, fromChainId, toChainId);
      if (!txHash) return null;

      // Step 2: Parse receipt
      const burnData = await parseBurnReceipt(txHash);
      if (!burnData) {
        setState({ step: "error", error: "Failed to parse burn transaction" });
        return null;
      }

      // Step 3: Submit to IDRX API
      const result = await submitBridgeRequest({
        txHashBurn: txHash,
        bridgeFromChainId: fromChainId,
        bridgeToChainId: toChainId,
        amount: burnData.amountAfterCut,
        bridgeNonce: burnData.bridgeNonce,
        destinationWalletAddress: destinationAddress,
      });

      return result;
    },
    [burnBridge, parseBurnReceipt, submitBridgeRequest]
  );

  const reset = useCallback(() => {
    setState({ step: "idle" });
  }, []);

  return {
    ...state,
    bridge,
    burnBridge,
    parseBurnReceipt,
    submitBridgeRequest,
    reset,
    supportedChains: IDRX_SUPPORTED_CHAINS,
  };
}
