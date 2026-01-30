"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

const ONBOARDING_SLIDES = [
  {
    id: 1,
    title: "Scan & Pay Instantly",
    description: "Scan any QRIS code at merchants and pay instantly with your crypto wallet",
    icon: "https://www.figma.com/api/mcp/asset/ffdb481b-ed52-460f-bf10-739832353edf",
    gradient: "linear-gradient(135deg, rgba(81, 162, 255, 1) 0%, rgba(0, 211, 242, 1) 100%)",
  },
  {
    id: 2,
    title: "Secure Blockchain",
    description: "Bank-level security powered by blockchain technology. Your funds are always safe",
    icon: "https://www.figma.com/api/mcp/asset/69948341-77a2-4c70-b339-73164899dcdc",
    gradient: "linear-gradient(135deg, rgba(43, 127, 255, 1) 0%, rgba(81, 162, 255, 1) 100%)",
  },
  {
    id: 3,
    title: "Lightning Fast",
    description: "Complete payments in under 30 seconds. Faster than traditional payment methods",
    icon: "https://www.figma.com/api/mcp/asset/51e2677f-5f6d-4016-ba87-bd8f026774aa",
    gradient: "linear-gradient(135deg, rgba(0, 184, 219, 1) 0%, rgba(43, 127, 255, 1) 100%)",
  },
];

const decorativeIcon1 = "https://www.figma.com/api/mcp/asset/afa63fa6-4d79-4344-b593-5dadf3653a04";
const decorativeIcon2 = "https://www.figma.com/api/mcp/asset/3b7e8e7c-db0e-4c7c-abc4-404e4c415863";

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const isLastSlide = currentSlide === ONBOARDING_SLIDES.length - 1;
  const slide = ONBOARDING_SLIDES[currentSlide];

  const handleNext = () => {
    if (isLastSlide) {
      onComplete();
      router.push("/login");
    } else {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handleSkip = () => {
    onComplete();
    router.push("/login");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div
        className="h-screen w-full overflow-hidden relative shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] max-w-[480px] mx-auto"
      >
        {/* Background Gradient Overlay */}
        <div 
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(115.58deg, rgba(239, 246, 255, 1) 0%, rgba(255, 255, 255, 1) 50%, rgba(236, 254, 255, 1) 100%)",
          }}
        />
        
        {/* Background Decorative Icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute bg-gradient-to-b from-[rgba(219,234,254,0.3)] to-transparent h-64 left-0 top-0 w-full" />
          <img
            src={decorativeIcon1}
            alt=""
            className="absolute w-32 h-32 top-20 left-10 opacity-30"
          />
          <img
            src={decorativeIcon2}
            alt=""
            className="absolute w-40 h-40 bottom-72 right-12 opacity-30"
          />
        </div>

        {/* Main Content Container */}
        <div className="relative h-full px-8 py-8 flex flex-col">
          {/* Skip Button - Hide on last slide */}
          {!isLastSlide && (
            <div className="flex justify-end">
              <button
                onClick={handleSkip}
                className="text-[#6a7282] text-base font-medium rounded-lg px-4 py-2 hover:bg-gray-100 transition-colors"
              >
                Skip
              </button>
            </div>
          )}

          {/* Spacer for first two slides */}
          {!isLastSlide && <div className="h-0" />}

          {/* Center Content */}
          <div className="flex-1 flex flex-col justify-center items-center px-0 pb-20">
            {/* Icon Circle */}
            <div
              className="relative w-64 h-64 rounded-full shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] mb-12"
              style={{ background: slide.gradient }}
            >
              <div className="absolute inset-0 bg-white/10 rounded-full" />
              <div className="absolute inset-4 border-2 border-white/20 rounded-full" />
              <div className="absolute inset-16 flex items-center justify-center">
                <img src={slide.icon} alt={slide.title} className="w-32 h-32" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-[#101828] text-3xl font-normal text-center mb-5 px-4 leading-9 tracking-[0.4px]">
              {slide.title}
            </h1>

            {/* Description */}
            <p className="text-[#4a5565] text-lg text-center leading-[29.25px] tracking-[-0.44px] max-w-sm px-4">
              {slide.description}
            </p>
          </div>

          {/* Bottom Controls */}
          <div className="flex flex-col gap-6 pb-8">
            {/* Progress Dots */}
            <div className="flex items-center justify-center gap-2.5">
              {ONBOARDING_SLIDES.map((_, index) => (
                <div
                  key={index}
                  className={`rounded-full transition-all ${
                    index === currentSlide
                      ? "bg-[#155dfc] w-8 h-2"
                      : "bg-[#d1d5dc] w-1.5 h-1.5"
                  }`}
                />
              ))}
            </div>

            {/* Next/Get Started Button */}
            <button
              onClick={handleNext}
              className="w-full h-[60px] bg-gradient-to-r from-[#155dfc] to-[#0092b8] rounded-2xl shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)] flex items-center justify-center gap-2 text-white text-lg font-normal tracking-[-0.44px] hover:opacity-90 transition-opacity"
            >
              <span>{isLastSlide ? "Get Started" : "Next"}</span>
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Skip for now button - Only on last slide */}
            {isLastSlide && (
              <button
                onClick={handleSkip}
                className="w-full h-10 text-[#6a7282] text-base text-center tracking-[-0.31px] hover:text-gray-900 transition-colors"
              >
                Skip for now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
