"use client";
import { useState, useEffect } from "react";

const ONBOARDING_COMPLETE_KEY = "qrypto_onboarding_complete";

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if onboarding has been completed
    const onboardingComplete = localStorage.getItem(ONBOARDING_COMPLETE_KEY);
    setShowOnboarding(!onboardingComplete);
    setIsLoading(false);
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
    setShowOnboarding(false);
  };

  return { showOnboarding, isLoading, completeOnboarding };
}
