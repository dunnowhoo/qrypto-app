import { NextRequest, NextResponse } from "next/server";

// 0x API for getting swap quotes
const ZEROX_API_URL = "https://api.0x.org/swap/v1";

// Token addresses on different chains
const TOKEN_ADDRESSES: Record<string, Record<string, string>> = {
  // Ethereum Mainnet
  "1": {
    ETH: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  },
  // Base
  "8453": {
    ETH: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  },
  // Polygon
  "137": {
    MATIC: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    USDC: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    IDRX: "0x18c934eDec97b0AA1FcaC26e8D4b99EC5F88b9E9",
  },
};

// IDR exchange rates for estimation
const IDR_RATES: Record<string, number> = {
  ETH: 43200000, // 1 ETH ≈ $2,700 × 16,000 = 43,200,000 IDR
  USDC: 16000, // 1 USDC = 16,000 IDR
  MATIC: 12800, // 1 MATIC ≈ $0.80 × 16,000 = 12,800 IDR
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sellToken = searchParams.get("sellToken") || "ETH";
  const sellAmount = searchParams.get("sellAmount") || "0";
  const chainId = searchParams.get("chainId") || "1";
  const takerAddress = searchParams.get("takerAddress");

  if (!sellAmount || parseFloat(sellAmount) <= 0) {
    return NextResponse.json(
      { success: false, error: "Invalid sell amount" },
      { status: 400 }
    );
  }

  try {
    // For now, calculate estimated IDRX based on IDR rates
    // In production, you would call actual DEX API for real-time rates
    const sellAmountNum = parseFloat(sellAmount);
    const rate = IDR_RATES[sellToken] || IDR_RATES.ETH;
    const estimatedIDRX = sellAmountNum * rate;

    // Calculate decimals based on token
    const decimals = sellToken === "USDC" ? 6 : 18;
    const sellAmountWei = BigInt(Math.floor(sellAmountNum * Math.pow(10, decimals))).toString();

    // Get 0x quote if API key is available
    const zeroXApiKey = process.env.ZEROX_API_KEY;
    let zeroXQuote = null;

    if (zeroXApiKey && TOKEN_ADDRESSES[chainId]) {
      try {
        const tokenAddresses = TOKEN_ADDRESSES[chainId];
        const sellTokenAddress = tokenAddresses[sellToken];
        const buyTokenAddress = tokenAddresses["USDC"]; // First swap to USDC

        if (sellTokenAddress && buyTokenAddress && sellToken !== "USDC") {
          const quoteUrl = `${ZEROX_API_URL}/quote?` +
            `sellToken=${sellTokenAddress}&` +
            `buyToken=${buyTokenAddress}&` +
            `sellAmount=${sellAmountWei}&` +
            (takerAddress ? `takerAddress=${takerAddress}` : "");

          const response = await fetch(quoteUrl, {
            headers: {
              "0x-api-key": zeroXApiKey,
            },
          });

          if (response.ok) {
            zeroXQuote = await response.json();
          }
        }
      } catch (error) {
        console.error("0x API error:", error);
      }
    }

    return NextResponse.json({
      success: true,
      quote: {
        sellToken,
        sellAmount: sellAmountNum,
        sellAmountWei,
        buyToken: "IDRX",
        buyAmount: estimatedIDRX,
        buyAmountFormatted: estimatedIDRX.toLocaleString("id-ID"),
        rate: rate,
        chainId,
        // Include 0x quote data if available
        zeroXQuote: zeroXQuote ? {
          to: zeroXQuote.to,
          data: zeroXQuote.data,
          value: zeroXQuote.value,
          gasPrice: zeroXQuote.gasPrice,
          gas: zeroXQuote.gas,
        } : null,
        // Estimated fees
        estimatedGas: "0.0005",
        estimatedGasIDR: 21600, // ~0.0005 ETH
        processingTime: "1-24 hours",
      },
    });
  } catch (error) {
    console.error("Quote error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get quote" },
      { status: 500 }
    );
  }
}
