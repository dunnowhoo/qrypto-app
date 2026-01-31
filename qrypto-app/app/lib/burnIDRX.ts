import { ethers } from 'ethers';

// IDRX Token Contract on Base Mainnet
// TODO: Replace with actual IDRX contract address from IDRX team
const IDRX_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_IDRX_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';

// Burn address (dead address where tokens are sent to be burned)
const BURN_ADDRESS = '0x000000000000000000000000000000000000dEaD';

// IDRX Token ABI (minimal interface for transfer and balance checking)
const IDRX_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

/**
 * Burn IDRX tokens by sending them to dead address
 * This creates an on-chain proof of burn that IDRX API requires for bank transfers
 * 
 * @param signer - ethers Signer instance from connected wallet
 * @param amount - Amount in IDR to burn (e.g., "100000" for Rp 100,000)
 * @returns Transaction hash of the burn transaction
 */
export async function burnIDRX(
  signer: ethers.Signer,
  amount: string
): Promise<string> {
  try {
    // Validate inputs
    if (!signer) {
      throw new Error('Wallet signer is required');
    }

    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      throw new Error('Invalid amount');
    }

    // Check if contract address is configured
    if (IDRX_CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
      throw new Error('IDRX contract address not configured. Please set NEXT_PUBLIC_IDRX_CONTRACT_ADDRESS in .env.local');
    }

    // Convert IDR amount to token units
    // IDRX uses 18 decimals, 1 IDRX = 1 IDR (1:1 ratio)
    const amountInWei = ethers.parseUnits(amount, 18);
    
    // Connect to IDRX contract
    const idrxContract = new ethers.Contract(
      IDRX_CONTRACT_ADDRESS,
      IDRX_ABI,
      signer
    );
    
    // Get user's wallet address
    const userAddress = await signer.getAddress();
    
    // Check current balance
    const balance = await idrxContract.balanceOf(userAddress);
    
    if (balance < amountInWei) {
      const balanceInIDR = ethers.formatUnits(balance, 18);
      throw new Error(`Insufficient IDRX balance. You have ${balanceInIDR} IDRX but need ${amount} IDRX`);
    }
    
    console.log(`Burning ${amount} IDRX tokens...`);
    console.log(`From: ${userAddress}`);
    console.log(`To: ${BURN_ADDRESS}`);
    console.log(`Amount: ${ethers.formatUnits(amountInWei, 18)} IDRX`);
    
    // Execute burn transaction (transfer to dead address)
    const tx = await idrxContract.transfer(BURN_ADDRESS, amountInWei);
    
    console.log(`Transaction sent: ${tx.hash}`);
    console.log('Waiting for confirmation...');
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    if (receipt.status === 0) {
      throw new Error('Transaction failed on blockchain');
    }
    
    console.log(`✅ Burn successful! Tx: ${tx.hash}`);
    
    return tx.hash;
  } catch (error: any) {
    console.error('Burn transaction failed:', error);
    
    // Handle specific error cases
    if (error.code === 'INSUFFICIENT_FUNDS') {
      throw new Error('Insufficient ETH for gas fees. Please add ETH to your wallet.');
    }
    
    if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
      throw new Error('Transaction cancelled by user');
    }
    
    if (error.message?.includes('Insufficient')) {
      throw error; // Re-throw balance errors as-is
    }
    
    // Generic error
    throw new Error(error.message || 'Failed to burn IDRX tokens');
  }
}

/**
 * Get user's IDRX balance
 * 
 * @param address - Wallet address to check
 * @param provider - ethers Provider instance
 * @returns Balance in IDRX (formatted as string)
 */
export async function getIDRXBalance(
  address: string,
  provider: ethers.Provider
): Promise<string> {
  try {
    if (IDRX_CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
      return '0';
    }

    const idrxContract = new ethers.Contract(
      IDRX_CONTRACT_ADDRESS,
      IDRX_ABI,
      provider
    );
    
    const balance = await idrxContract.balanceOf(address);
    return ethers.formatUnits(balance, 18);
  } catch (error) {
    console.error('Failed to get IDRX balance:', error);
    return '0';
  }
}

/**
 * Check if user has sufficient IDRX balance
 * 
 * @param address - Wallet address to check
 * @param amount - Amount needed (in IDR)
 * @param provider - ethers Provider instance
 * @returns true if balance is sufficient
 */
export async function hasEnoughIDRX(
  address: string,
  amount: string,
  provider: ethers.Provider
): Promise<boolean> {
  try {
    const balance = await getIDRXBalance(address, provider);
    const balanceNum = parseFloat(balance);
    const amountNum = parseFloat(amount);
    
    return balanceNum >= amountNum;
  } catch (error) {
    console.error('Failed to check balance:', error);
    return false;
  }
}
