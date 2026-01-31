"use client";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

export default function KYCRequired() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-orange-500" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          KYC Verification Required
        </h1>
        
        <p className="text-gray-600 mb-6">
          You need to complete KYC (Know Your Customer) verification before you can make transactions.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-blue-900 mb-2">What you'll need:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Full name</li>
            <li>• Email address</li>
            <li>• Physical address</li>
            <li>• ID number (KTP/Passport)</li>
            <li>• Photo of your ID</li>
          </ul>
        </div>

        <button
          onClick={() => router.push("/onboarding")}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-600 transition-all mb-3"
        >
          Complete KYC Now
        </button>

        <button
          onClick={() => router.push("/")}
          className="w-full text-gray-600 hover:text-gray-900 text-sm"
        >
          Go Back Home
        </button>
      </div>
    </div>
  );
}
