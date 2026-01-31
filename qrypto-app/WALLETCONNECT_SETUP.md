# WalletConnect Setup Guide

## Why You Need This

WalletConnect is required for connecting mobile wallets like:
- Trust Wallet
- Phantom
- Rainbow
- MetaMask Mobile
- And many others

Without a valid WalletConnect Project ID, users will see errors when trying to connect their wallets.

## Setup Steps (FREE - Takes 2 minutes)

### 1. Create a WalletConnect Cloud Account

1. Go to https://cloud.reown.com/ (or https://cloud.walletconnect.com/)
2. Click "Sign Up" or "Get Started"
3. Sign up with your email or GitHub account

### 2. Create a New Project

1. Once logged in, click "Create New Project"
2. Fill in the project details:
   - **Project Name**: QRypto (or any name you want)
   - **Homepage URL**: `https://qrypto.vercel.app` (or your custom domain)
3. Click "Create"

### 3. Get Your Project ID

1. After creating the project, you'll see your **Project ID**
2. Copy this Project ID

### 4. Add to Your Environment Variables

#### For Local Development:

Edit your `.env` file:
```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="paste-your-project-id-here"
```

#### For Vercel Deployment:

1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Add a new variable:
   - **Name**: `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
   - **Value**: Your Project ID from WalletConnect
   - **Environment**: Production, Preview, Development (select all)
4. Click "Save"
5. Redeploy your application

### 5. Verify It Works

After adding the Project ID and redeploying:

1. Go to your deployed app
2. Try connecting a wallet (Trust Wallet, Phantom, etc.)
3. You should no longer see 403 errors in the console
4. Wallet connection should work smoothly

## Troubleshooting

### Still seeing "403 Forbidden" errors?

- Make sure you added the environment variable correctly
- Redeploy your Vercel app after adding the variable
- Clear your browser cache

### Wallet not connecting?

- Make sure the URL in WalletConnect Cloud matches your deployment URL
- Check that you're using the correct Project ID
- Try a different wallet to isolate the issue

## Free Tier Limits

WalletConnect Cloud free tier includes:
- ✅ Unlimited wallet connections
- ✅ All wallet types supported
- ✅ Perfect for production use

No credit card required!

## Need Help?

- WalletConnect Docs: https://docs.reown.com/
- WalletConnect Discord: https://discord.gg/walletconnect
