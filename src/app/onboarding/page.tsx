"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import ArtworkImage from "@/components/ArtworkImage";
import artworks from "@/data/artworks.json";
import { PassportStamp } from "@/components/StampVisuals";
import { STAMP_THEMES } from "@/components/StampVisuals";

const COLOR_OPTIONS = [
  { value: "black", label: "Black" },
  { value: "red", label: "Red" },
  { value: "blue", label: "Blue" },
  { value: "gold", label: "Gold" },
];

const MEDIUM_OPTIONS = [
  { value: "painting", label: "Painting" },
  { value: "sculpture", label: "Sculpture" },
  { value: "prints", label: "Prints" },
  { value: "photography", label: "Photography" },
];

// Curated artwork selections for the recommendation grid
const CURATED_PICKS = [
  "starry-night",
  "campbell-soup",
  "persistence-of-memory",
  "gold-marilyn",
  "drowning-girl",
  "water-lilies",
  "broadway-boogie",
  "self-portrait-cropped-hair",
  "hope-ii",
  "blue-nude-ii",
];

const curatedArtworks = CURATED_PICKS.map((id) =>
  artworks.find((a) => a.id === id)
).filter(Boolean) as (typeof artworks)[number][];

// Showcase art for the feature slides
const SHOWCASE_ART = artworks.slice(0, 6);
const DISCOVER_ART = artworks.find((a) => a.id === "map-johns")!;

// Sample stamp themes to display on the artifacts screen
const PREVIEW_STAMPS = STAMP_THEMES.slice(0, 4);

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const { onboardingAnswers, setOnboardingAnswer, completeOnboarding, setRecommendations } = useStore();

  const totalSteps = 7;

  const next = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      // Set hardcoded recommendations based on curated picks
      setRecommendations(
        CURATED_PICKS.slice(0, 3).map((id) => ({
          artworkId: id,
          hook: "",
          blurb: "",
        }))
      );
      completeOnboarding();
      router.push("/explore");
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0: return true;
      case 1: return onboardingAnswers.firstTime !== null;
      case 2: return onboardingAnswers.color !== null && onboardingAnswers.artMedium !== null;
      case 3: return true; // collect artifacts
      case 4: return true; // save what you liked
      case 5: return true; // discover
      case 6: return true; // recommendations
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
            {/* Step 0: Welcome */}
            {step === 0 && (
              <StepLayout dark>
                <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                  <h1 className="text-3xl font-black tracking-tight text-white">
                    Welcome to MoMA
                  </h1>
                </div>
              </StepLayout>
            )}

            {/* Step 1: First time? */}
            {step === 1 && (
              <StepLayout>
                <div className="flex-1 flex flex-col items-center justify-center px-8">
                  <h2 className="text-2xl font-black text-center mb-8">
                    Is this your first time here?
                  </h2>
                  <div className="w-full max-w-xs space-y-3">
                    <ChoiceButton
                      selected={onboardingAnswers.firstTime === true}
                      onClick={() => setOnboardingAnswer("firstTime", true)}
                    >
                      Yes
                    </ChoiceButton>
                    <ChoiceButton
                      selected={onboardingAnswers.firstTime === false}
                      onClick={() => setOnboardingAnswer("firstTime", false)}
                    >
                      No
                    </ChoiceButton>
                  </div>
                </div>
              </StepLayout>
            )}

            {/* Step 2: Color + Medium */}
            {step === 2 && (
              <StepLayout>
                <div className="flex-1 flex flex-col items-center justify-center px-8">
                  <div className="w-full max-w-xs space-y-10">
                    <div>
                      <h2 className="text-lg font-bold mb-4">
                        What color are you feeling?
                      </h2>
                      <div className="space-y-2">
                        {COLOR_OPTIONS.map((c) => (
                          <ChoiceButton
                            key={c.value}
                            selected={onboardingAnswers.color === c.value}
                            onClick={() => setOnboardingAnswer("color", c.value)}
                          >
                            {c.label}
                          </ChoiceButton>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold mb-4">
                        What medium of art speaks to you?
                      </h2>
                      <div className="space-y-2">
                        {MEDIUM_OPTIONS.map((m) => (
                          <ChoiceButton
                            key={m.value}
                            selected={onboardingAnswers.artMedium === m.value}
                            onClick={() => setOnboardingAnswer("artMedium", m.value)}
                          >
                            {m.label}
                          </ChoiceButton>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </StepLayout>
            )}

            {/* Step 3: Collect unique artifacts */}
            {step === 3 && (
              <StepLayout>
                <div className="flex-1 flex flex-col items-center justify-center px-8">
                  <h2 className="text-xl font-black text-center mb-2">
                    Collect unique artifacts
                  </h2>
                  <p className="text-xl font-black text-center mb-8">
                    during your visit
                  </p>
                  <div className="grid grid-cols-2 gap-6 w-full max-w-xs">
                    {PREVIEW_STAMPS.map((theme, i) => (
                      <div key={theme.id} className="flex items-center justify-center">
                        <PassportStamp
                          theme={theme}
                          earned={true}
                          size={100}
                          showAnimation={true}
                          delay={i * 0.15}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </StepLayout>
            )}

            {/* Step 4: Save what you liked */}
            {step === 4 && (
              <StepLayout>
                <div className="flex-1 flex flex-col items-center justify-center px-8">
                  <h2 className="text-xl font-black text-center mb-8">
                    Save what you liked,
                  </h2>
                  <div className="w-full max-w-xs">
                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
                      <ArtworkImage
                        src={SHOWCASE_ART[1].thumbnail}
                        alt={SHOWCASE_ART[1].title}
                        width={400}
                        height={300}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-3 right-3 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--moma-red)" stroke="none">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </StepLayout>
            )}

            {/* Step 5: Discover */}
            {step === 5 && (
              <StepLayout>
                <div className="flex-1 flex flex-col items-center justify-center px-8">
                  <h2 className="text-xl font-black text-center mb-2">
                    Discover what you
                  </h2>
                  <p className="text-xl font-black text-center mb-8">
                    didn&apos;t know you would like
                  </p>
                  <div className="w-full max-w-xs aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
                    <ArtworkImage
                      src={DISCOVER_ART.thumbnail}
                      alt={DISCOVER_ART.title}
                      width={400}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </StepLayout>
            )}

            {/* Step 6: Curated recommendations */}
            {step === 6 && (
              <StepLayout>
                <div className="flex-1 flex flex-col px-8 pt-4">
                  <h2 className="text-2xl font-black mb-1">Great!</h2>
                  <p className="text-2xl font-black mb-6">
                    Here&apos;s what we think you&apos;d like
                  </p>
                  <div className="grid grid-cols-3 gap-2 overflow-y-auto">
                    {curatedArtworks.map((art, i) => (
                      <motion.div
                        key={art.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.06 }}
                        className="aspect-square rounded-lg overflow-hidden bg-gray-100"
                      >
                        <ArtworkImage
                          src={art.thumbnail}
                          alt={art.title}
                          width={150}
                          height={150}
                          className="w-full h-full object-cover"
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </StepLayout>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Bottom CTA */}
        <div className="px-8 pb-12 pt-4">
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

function StepLayout({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div className={`flex-1 flex flex-col pt-12 ${dark ? "bg-[var(--moma-black)]" : ""}`}>
      {children}
    </div>
  );
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
