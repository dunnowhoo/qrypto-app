# Authentication & Onboarding Flow

## User Registration & Login Flow

### 1. **New User Registration**

**Path:** `/register`

**Flow:**
1. User connects wallet
2. User fills in basic profile (Full Name, Email, Phone)
3. User signs message for authentication
4. System creates account in database
5. Automatically redirects to `/onboarding` for KYC

### 2. **Onboarding (KYC)**

**Path:** `/onboarding`

**Flow:**
1. User fills in KYC information:
   - Full Name
   - Email
   - Physical Address
   - ID Number
   - ID File (KTP/Passport image)
2. System calls IDRX API to onboard user
3. On success:
   - User data stored in database
   - `kycStatus` set to `APPROVED`
   - API keys encrypted and stored
   - Redirects to home page
4. User can skip KYC (but will be prompted later)

### 3. **Existing User Login**

**Path:** `/login`

**Flow:**
1. User connects wallet
2. User signs message for authentication
3. System checks user status:
   - **New user (no profile)** → Redirect to `/register`
   - **Has profile, needs KYC** → Redirect to `/onboarding`
   - **Fully onboarded** → Redirect to `/` (home)

## User States

### `isNewUser`
- `true`: User has no profile data (no fullName)
- `false`: User has completed profile

### `needsOnboarding`
- `true`: User needs to complete KYC (`kycStatus` is `PENDING` or missing)
- `false`: User has completed KYC (`kycStatus` is `APPROVED`)

### `kycStatus`
- `PENDING`: Not yet completed KYC
- `APPROVED`: KYC completed
- `REJECTED`: KYC rejected (can resubmit)

## API Endpoints

### POST `/api/auth/register`
Register new user with basic profile information.

**Request:**
```json
{
  "address": "0x...",
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+62812345678",
  "signature": "0x..."
}
```

### POST `/api/auth/login`
Login or create user session.

**Response:**
```json
{
  "success": true,
  "isNewUser": false,
  "needsOnboarding": true,
  "user": {
    "id": "...",
    "address": "0x...",
    "fullName": "John Doe",
    "email": "john@example.com",
    "kycStatus": "PENDING"
  }
}
```

### POST `/api/auth/onboarding`
Submit KYC information to IDRX.

**Request:** `multipart/form-data`
- `email`: String
- `fullname`: String
- `address`: String (physical address)
- `idNumber`: String
- `idFile`: File (image)
- `walletAddress`: String (blockchain address)

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "...",
    "idrxUserId": 1011,
    "fullname": "JOHN DOE",
    "createdAt": "2026-01-30T..."
  }
}
```

## Database Schema

### User Model
```prisma
model User {
  id                 String   @id @default(uuid())
  walletAddress      String   @unique
  address            String?  @unique        // Physical address
  fullName           String?
  email              String?
  phone              String?
  kycStatus          KycStatus @default(PENDING)
  encryptedApiKey    String?  // IDRX API key
  encryptedSecretKey String?  // IDRX API secret
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}

enum KycStatus {
  PENDING
  APPROVED
  REJECTED
}
```

## Environment Variables Required

```env
# IDRX API Configuration
IDRX_BASE_URL="https://idrx.co"
IDRX_API_KEY="your-organization-api-key"
IDRX_API_SECRET="your-organization-api-secret"
NEXT_PUBLIC_IDRX_BASE_URL="https://idrx.co"
```

## Frontend Components

### AuthContext
Manages authentication state and provides:
- `isAuthenticated`: Whether user is logged in
- `isNewUser`: Whether user needs to complete profile
- `needsOnboarding`: Whether user needs to complete KYC
- `user`: Current user data
- `markOnboardingComplete()`: Mark KYC as complete

### Protected Routes
Routes automatically redirect based on user state:
- `/register`: Only accessible if `isNewUser === true`
- `/onboarding`: Only accessible if `needsOnboarding === true`
- `/`: Requires full authentication

## Usage Example

```tsx
import { useAuth } from "@/app/context/AuthContext";

function MyComponent() {
  const { isAuthenticated, needsOnboarding, user } = useAuth();

  if (!isAuthenticated) {
    return <div>Please login</div>;
  }

  if (needsOnboarding) {
    return <div>Please complete KYC</div>;
  }

  return <div>Welcome {user?.fullName}!</div>;
}
```
