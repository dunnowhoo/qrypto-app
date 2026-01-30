"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useAuth } from "../context/AuthContext";

export default function OnboardingKYC() {
  const router = useRouter();
  const { address } = useAccount();
  const { markOnboardingComplete } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    fullname: "",
    address: "",
    idNumber: "",
  });
  const [idFile, setIdFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
      if (!validTypes.includes(file.type)) {
        setError("Invalid file type. Please upload jpeg, png, jpg, or webp file.");
        return;
      }

      // Validate file size (e.g., max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size too large. Maximum 5MB allowed.");
        return;
      }

      setIdFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address) {
      setError("Please connect your wallet first");
      return;
    }

    if (!idFile) {
      setError("Please upload your ID file");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const submitData = new FormData();
      submitData.append("email", formData.email);
      submitData.append("fullname", formData.fullname);
      submitData.append("address", formData.address);
      submitData.append("idNumber", formData.idNumber);
      submitData.append("idFile", idFile);
      submitData.append("walletAddress", address);

      const response = await fetch("/api/auth/onboarding", {
        method: "POST",
        body: submitData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit onboarding");
      }

      // Mark onboarding as complete
      markOnboardingComplete();

      // Success - redirect to home or dashboard
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-600 mb-6">
            Provide your details to get started with QRypto
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="fullname"
                value={formData.fullname}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Street, City, Postal Code"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID Number
              </label>
              <input
                type="text"
                name="idNumber"
                value={formData.idNumber}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="KTP/Passport Number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID File
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                <div className="space-y-1 text-center">
                  {idFile ? (
                    <div className="text-sm text-gray-600">
                      <p className="font-medium">{idFile.name}</p>
                      <p className="text-xs">{(idFile.size / 1024).toFixed(2)} KB</p>
                    </div>
                  ) : (
                    <>
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="text-sm text-gray-600">
                        <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                          <span>Upload a file</span>
                          <input
                            type="file"
                            className="sr-only"
                            onChange={handleFileChange}
                            accept="image/jpeg,image/png,image/jpg,image/webp"
                            required
                          />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, WEBP up to 5MB
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? "Submitting..." : "Complete Onboarding"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 mb-2">
              You can complete this later in Settings
            </p>
            <button
              onClick={() => {
                // Mark as skipped but still needs onboarding
                router.push("/");
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Skip KYC for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
