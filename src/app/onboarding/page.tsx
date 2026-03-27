"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import Image from "next/image";
import Link from "next/link";
import artworks from "@/data/artworks.json";

const SHOWCASE_ART = artworks.slice(0, 6);

const MOODS = [
  { value: "contemplative", label: "Contemplative", icon: "🧘" },
  { value: "energized", label: "Energized", icon: "⚡" },
  { value: "curious", label: "Curious", icon: "🔍" },
  { value: "surprised", label: "Surprise me", icon: "✨" },
];

const PREFERENCES = [
  { value: "bold-color", label: "Bold color", icon: "🎨" },
  { value: "quiet-moments", label: "Quiet moments", icon: "🤫" },
  { value: "big-ideas", label: "Big ideas", icon: "💡" },
  { value: "strange-beauty", label: "Strange beauty", icon: "🦋" },
];

const TIME_OPTIONS = [
  { value: "1hr", label: "1 hour" },
  { value: "2hrs", label: "2 hours" },
  { value: "half-day", label: "Half day" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const { onboardingAnswers, setOnboardingAnswer, completeOnboarding } = useStore();

  const totalSteps = 7;

  const next = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      completeOnboarding();
      router.push("/recommendations");
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0: return true; // welcome
      case 1: return onboardingAnswers.starryNight !== null;
      case 2: return onboardingAnswers.mood !== null;
      case 3: return onboardingAnswers.preference !== null;
      case 4: return true; // showcase - collect artifacts
      case 5: return true; // showcase - save what you liked
      case 6: return true; // showcase - discover
      default: return true;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-100">
        <motion.div
          className="h-full bg-[var(--moma-black)]"
          animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col"
          >
            {step === 0 && (
              <StepLayout>
                <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                  {/* MoMA wordmark */}
                  <div className="w-24 h-24 bg-[var(--moma-black)] rounded-2xl flex items-center justify-center mb-8">
                    <span className="text-white text-2xl font-black">MoMA</span>
                  </div>
                  <h1 className="text-3xl font-black tracking-tight mb-2">Welcome to MoMA</h1>
                  <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                    Your personal guide to the Museum of Modern Art.
                  </p>
                </div>
              </StepLayout>
            )}

            {step === 1 && (
              <StepLayout>
                <div className="flex-1 flex flex-col items-center justify-center px-8">
                  <h2 className="text-2xl font-black text-center mb-2">
                    Is this your first time here?
                  </h2>
                  <p className="text-sm text-gray-500 mb-8">
                    We&apos;ll tailor your experience
                  </p>
                  <div className="w-full max-w-xs space-y-3">
                    <ChoiceButton
                      selected={onboardingAnswers.starryNight === true}
                      onClick={() => setOnboardingAnswer("starryNight", true)}
                    >
                      Yes, show me the essentials!
                    </ChoiceButton>
                    <ChoiceButton
                      selected={onboardingAnswers.starryNight === false}
                      onClick={() => setOnboardingAnswer("starryNight", false)}
                    >
                      No, show me something new
                    </ChoiceButton>
                  </div>
                  {onboardingAnswers.starryNight === true && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 text-center max-w-xs"
                    >
                      <Link
                        href="/map"
                        className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-3"
                      >
                        <span className="text-lg">🌟</span>
                        <div className="text-left">
                          <p className="text-xs font-bold">Starry Night · Floor 5 · Gallery 501</p>
                          <p className="text-[10px] text-gray-500">Tap to see on map</p>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 ml-1">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </Link>
                      <p className="text-sm text-gray-500">
                        But let&apos;s also find 3 works you&apos;ll love just as much.
                      </p>
                    </motion.div>
                  )}
                </div>
              </StepLayout>
            )}

            {step === 2 && (
              <StepLayout>
                <div className="flex-1 flex flex-col items-center justify-center px-8">
                  <h2 className="text-2xl font-black text-center mb-2">
                    What mood are you in?
                  </h2>
                  <p className="text-sm text-gray-500 mb-8">Pick one</p>
                  <div className="w-full max-w-xs space-y-3">
                    {MOODS.map((m) => (
                      <ChoiceButton
                        key={m.value}
                        selected={onboardingAnswers.mood === m.value}
                        onClick={() => setOnboardingAnswer("mood", m.value)}
                      >
                        <span className="mr-2">{m.icon}</span> {m.label}
                      </ChoiceButton>
                    ))}
                  </div>
                </div>
              </StepLayout>
            )}

            {step === 3 && (
              <StepLayout>
                <div className="flex-1 flex flex-col items-center justify-center px-8">
                  <h2 className="text-2xl font-black text-center mb-2">
                    What draws you in?
                  </h2>
                  <p className="text-sm text-gray-500 mb-8">Pick one</p>
                  <div className="w-full max-w-xs space-y-3">
                    {PREFERENCES.map((p) => (
                      <ChoiceButton
                        key={p.value}
                        selected={onboardingAnswers.preference === p.value}
                        onClick={() => setOnboardingAnswer("preference", p.value)}
                      >
                        <span className="mr-2">{p.icon}</span> {p.label}
                      </ChoiceButton>
                    ))}
                  </div>
                </div>
              </StepLayout>
            )}

            {step === 4 && (
              <StepLayout>
                <div className="flex-1 flex flex-col items-center justify-center px-8">
                  <div className="grid grid-cols-2 gap-3 mb-8 w-full max-w-xs">
                    {SHOWCASE_ART.slice(0, 4).map((art) => (
                      <div key={art.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={art.thumbnail}
                          alt={art.title}
                          width={200}
                          height={200}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  <h2 className="text-xl font-black text-center mb-2">
                    Collect unique artifacts
                  </h2>
                  <p className="text-xl font-black text-center">
                    during your visit
                  </p>
                </div>
              </StepLayout>
            )}

            {step === 5 && (
              <StepLayout>
                <div className="flex-1 flex flex-col items-center justify-center px-8">
                  <div className="w-full max-w-xs mb-8">
                    {/* Single large image with heart overlay */}
                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={SHOWCASE_ART[1].thumbnail}
                        alt={SHOWCASE_ART[1].title}
                        width={400}
                        height={300}
                        className="w-full h-full object-cover"
                      />
                      {/* Heart overlay */}
                      <div className="absolute bottom-3 right-3 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--moma-red)" stroke="none">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <h2 className="text-xl font-black text-center">
                    Save what you liked.
                  </h2>
                </div>
              </StepLayout>
            )}

            {step === 6 && (
              <StepLayout>
                <div className="flex-1 flex flex-col items-center justify-center px-8">
                  <div className="w-full max-w-xs mb-8 aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={SHOWCASE_ART[0].thumbnail}
                      alt={SHOWCASE_ART[0].title}
                      width={400}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h2 className="text-xl font-black text-center mb-2">
                    Discover what you
                  </h2>
                  <p className="text-xl font-black text-center">
                    didn&apos;t know you would like
                  </p>
                </div>
              </StepLayout>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Bottom section with time picker (on relevant step) and CTA */}
        <div className="px-8 pb-12 pt-4">
          {step === 3 && onboardingAnswers.preference && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <p className="text-sm font-semibold text-center mb-3">How much time do you have?</p>
              <div className="flex gap-2 justify-center">
                {TIME_OPTIONS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setOnboardingAnswer("timeAvailable", t.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      onboardingAnswers.timeAvailable === t.value
                        ? "bg-[var(--moma-black)] text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
          <button
            onClick={next}
            disabled={!canProceed()}
            className="w-full bg-[var(--moma-black)] text-white py-4 rounded-xl font-semibold text-center transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {step === totalSteps - 1 ? "Start" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StepLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 flex flex-col pt-12">{children}</div>;
}

function ChoiceButton({
  children,
  selected,
  onClick,
}: {
  children: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full py-3.5 px-6 rounded-xl font-medium text-left transition-all active:scale-[0.98] ${
        selected
          ? "bg-[var(--moma-black)] text-white"
          : "bg-gray-50 text-gray-800 border border-gray-200"
      }`}
    >
      {children}
    </button>
  );
}
