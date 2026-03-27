import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const DEFAULT_SAVED_ARTWORK_ID = 'starry-night';

function withDefaultSavedArtwork(ids: string[] | undefined): string[] {
  const unique = new Set(ids ?? []);
  unique.delete(DEFAULT_SAVED_ARTWORK_ID);
  return [DEFAULT_SAVED_ARTWORK_ID, ...unique];
}

export interface ArtworkVisit {
  artworkId: string;
  timestamp: number;
  dwellTime: number; // seconds spent viewing
}

export interface VisitSession {
  startTime: number;
  endTime?: number;
  artworksViewed: ArtworkVisit[];
  floorsVisited: number[];
  galleriesVisited: string[];
}

// Onboarding
export interface OnboardingAnswers {
  firstTime: boolean | null;
  color: string | null;      // black | red | blue | gold
  artMedium: string | null;  // painting | sculpture | prints | photography
}

// AI Recommendations
export interface Recommendation {
  artworkId: string;
  hook: string;    // "why you'll love this" one-liner
  blurb: string;   // curated description from AI
}

// Stamps / Achievements
export interface Stamp {
  id: string;
  name: string;
  description: string;
  icon: string;      // emoji
  category: 'era' | 'movement' | 'trail' | 'explorer' | 'hidden-gem';
  stampThemeId?: string; // maps to StampVisuals theme
  earnedAt?: number; // timestamp when earned, undefined = locked
}

export const STAMP_DEFINITIONS: Stamp[] = [
  // Artwork-themed stamps mapped to achievements
  { id: 'era-1880s-1940s', name: 'The Starry Night', description: 'Visited a work from 1880s–1940s (Floor 5)', icon: '🌙', category: 'era', stampThemeId: 'starry-night' },
  { id: 'era-1950s-1970s', name: 'One: Number 31', description: 'Visited a work from 1950s–1970s (Floor 4)', icon: '🎨', category: 'era', stampThemeId: 'pollock' },
  { id: 'era-1980s-present', name: 'Deodorized Central Mass', description: 'Visited a work from 1980s–Present (Floor 2)', icon: '⚡', category: 'era', stampThemeId: 'mike-kelley' },
  { id: 'mov-cubism', name: 'Les Demoiselles', description: 'Visited a Cubist work', icon: '🔷', category: 'movement', stampThemeId: 'les-demoiselles' },
  { id: 'mov-surrealism', name: 'Dream Walker', description: 'Visited a Surrealist work', icon: '🌙', category: 'movement' },
  { id: 'mov-pop-art', name: "Campbell's Soup Cans", description: 'Visited a Pop Art work', icon: '🥫', category: 'movement', stampThemeId: 'campbell-soup' },
  { id: 'mov-abstract', name: 'Bicycle Wheel', description: 'Visited an Abstract work', icon: '🌀', category: 'movement', stampThemeId: 'bicycle-wheel' },
  { id: 'mov-impressionism', name: 'Light Chaser', description: 'Visited an Impressionist work', icon: '🌅', category: 'movement', stampThemeId: 'starry-swirl' },
  { id: 'explorer-3-floors', name: 'Broadacre City', description: 'Visited artworks on all 3 floors', icon: '🗺️', category: 'explorer', stampThemeId: 'broadacre-city' },
  { id: 'explorer-5-artworks', name: 'Curious Wanderer', description: 'Viewed 5 artworks', icon: '🔍', category: 'explorer', stampThemeId: 'self-portrait' },
  { id: 'explorer-10-artworks', name: 'Art Devotee', description: 'Viewed 10 artworks', icon: '🎨', category: 'explorer' },
  { id: 'hidden-gem', name: 'Hidden Gem Hunter', description: 'Visited a lesser-known work (popularity < 50)', icon: '💎', category: 'hidden-gem' },
  { id: 'trail-color-light', name: 'Color & Light', description: 'Visited 3 works tagged with impressionism or color-field', icon: '🌈', category: 'trail' },
  { id: 'trail-sculpture', name: 'Third Dimension', description: 'Visited 3 sculptures', icon: '🗿', category: 'trail' },
];

interface AppState {
  // Bookmarks
  bookmarks: string[];
  toggleBookmark: (artworkId: string) => void;
  isBookmarked: (artworkId: string) => boolean;
  savedArtworks: string[];
  toggleSavedArtwork: (artworkId: string) => void;
  isSavedArtwork: (artworkId: string) => boolean;

  // Onboarding
  onboardingComplete: boolean;
  onboardingAnswers: OnboardingAnswers;
  setOnboardingAnswer: <K extends keyof OnboardingAnswers>(key: K, value: OnboardingAnswers[K]) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;

  // AI Recommendations
  recommendations: Recommendation[];
  recommendationsLoading: boolean;
  setRecommendations: (recs: Recommendation[]) => void;
  setRecommendationsLoading: (loading: boolean) => void;

  // Stamps
  stamps: Stamp[];
  earnStamp: (stampId: string) => void;
  checkAndAwardStamps: (artworkId: string, tags: string[], floor: number, popularity: number) => void;

  // Visit tracking
  currentSession: VisitSession | null;
  pastSessions: VisitSession[];
  startSession: () => void;
  endSession: () => void;
  recordArtworkView: (artworkId: string, gallery: string, floor: number) => void;
  updateDwellTime: (artworkId: string, seconds: number) => void;

  // Map state
  currentFloor: number;
  setCurrentFloor: (floor: number) => void;

  // UI
  selectedArtworkId: string | null;
  setSelectedArtworkId: (id: string | null) => void;
  suppressStampToast: boolean;
  setSuppressStampToast: (suppress: boolean) => void;

  // Demo
  seedDemoData: () => void;
  resetAllData: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Bookmarks
      bookmarks: [],
      toggleBookmark: (artworkId: string) => {
        const { bookmarks } = get();
        if (bookmarks.includes(artworkId)) {
          set({ bookmarks: bookmarks.filter((id) => id !== artworkId) });
        } else {
          set({ bookmarks: [...bookmarks, artworkId] });
        }
      },
      isBookmarked: (artworkId: string) => get().bookmarks.includes(artworkId),
      savedArtworks: [DEFAULT_SAVED_ARTWORK_ID],
      toggleSavedArtwork: (artworkId: string) => {
        const { savedArtworks } = get();
        if (savedArtworks.includes(artworkId)) {
          set({ savedArtworks: withDefaultSavedArtwork(savedArtworks.filter((id) => id !== artworkId)) });
        } else {
          set({ savedArtworks: withDefaultSavedArtwork([...savedArtworks, artworkId]) });
        }
      },
      isSavedArtwork: (artworkId: string) => get().savedArtworks.includes(artworkId),

      // Onboarding
      onboardingComplete: false,
      onboardingAnswers: {
        firstTime: null,
        color: null,
        artMedium: null,
      },
      setOnboardingAnswer: (key, value) => {
        set({
          onboardingAnswers: { ...get().onboardingAnswers, [key]: value },
        });
      },
      completeOnboarding: () => {
        set({ onboardingComplete: true });
        // Auto-start session when onboarding completes
        const { currentSession } = get();
        if (!currentSession) {
          get().startSession();
        }
      },
      resetOnboarding: () => {
        set({
          onboardingComplete: false,
          onboardingAnswers: {
            firstTime: null,
            color: null,
            artMedium: null,
          },
          recommendations: [],
        });
      },

      // AI Recommendations
      recommendations: [],
      recommendationsLoading: false,
      setRecommendations: (recs) => set({ recommendations: recs, recommendationsLoading: false }),
      setRecommendationsLoading: (loading) => set({ recommendationsLoading: loading }),

      // Stamps
      stamps: STAMP_DEFINITIONS.map((s) => ({ ...s })), // all locked initially
      earnStamp: (stampId: string) => {
        const { stamps } = get();
        set({
          stamps: stamps.map((s) =>
            s.id === stampId && !s.earnedAt ? { ...s, earnedAt: Date.now() } : s
          ),
        });
      },
      checkAndAwardStamps: (artworkId: string, tags: string[], floor: number, popularity: number) => {
        const state = get();
        const session = state.currentSession;
        if (!session) return;

        const viewedCount = session.artworksViewed.length;
        const floorsVisited = session.floorsVisited;

        // Era stamps
        if (floor === 5) state.earnStamp('era-1880s-1940s');
        if (floor === 4) state.earnStamp('era-1950s-1970s');
        if (floor === 2) state.earnStamp('era-1980s-present');

        // Movement stamps
        if (tags.includes('cubism')) state.earnStamp('mov-cubism');
        if (tags.includes('surrealism')) state.earnStamp('mov-surrealism');
        if (tags.includes('pop-art')) state.earnStamp('mov-pop-art');
        if (tags.includes('abstract') || tags.includes('abstract-expressionism')) state.earnStamp('mov-abstract');
        if (tags.includes('impressionism') || tags.includes('post-impressionism')) state.earnStamp('mov-impressionism');

        // Explorer stamps
        if (floorsVisited.length >= 3) state.earnStamp('explorer-3-floors');
        if (viewedCount >= 5) state.earnStamp('explorer-5-artworks');
        if (viewedCount >= 10) state.earnStamp('explorer-10-artworks');

        // Hidden gem
        if (popularity < 50) state.earnStamp('hidden-gem');

        // Trail: Color & Light (need 3 impressionism/color-field works)
        // We check accumulated tags across all viewed artworks — this is a simplified check
        if (tags.includes('impressionism') || tags.includes('post-impressionism') || tags.includes('color-field')) {
          // Count is approximate since we only see current artwork tags here
          // A more thorough check would iterate all viewed artworks
          // For demo, award after viewing any 3rd+ artwork with these tags
        }

        // Trail: Sculpture
        if (tags.includes('sculpture')) {
          // Similar simplified check for demo
        }
      },

      // Visit tracking
      currentSession: null,
      pastSessions: [],
      startSession: () => {
        set({
          currentSession: {
            startTime: Date.now(),
            artworksViewed: [],
            floorsVisited: [],
            galleriesVisited: [],
          },
        });
      },
      endSession: () => {
        const { currentSession, pastSessions } = get();
        if (currentSession) {
          const completed = { ...currentSession, endTime: Date.now() };
          set({
            currentSession: null,
            pastSessions: [...pastSessions, completed],
          });
        }
      },
      recordArtworkView: (artworkId: string, gallery: string, floor: number) => {
        const { currentSession } = get();
        if (!currentSession) return;

        const alreadyViewed = currentSession.artworksViewed.some(
          (v) => v.artworkId === artworkId
        );

        set({
          currentSession: {
            ...currentSession,
            artworksViewed: alreadyViewed
              ? currentSession.artworksViewed
              : [
                  ...currentSession.artworksViewed,
                  { artworkId, timestamp: Date.now(), dwellTime: 0 },
                ],
            floorsVisited: currentSession.floorsVisited.includes(floor)
              ? currentSession.floorsVisited
              : [...currentSession.floorsVisited, floor],
            galleriesVisited: currentSession.galleriesVisited.includes(gallery)
              ? currentSession.galleriesVisited
              : [...currentSession.galleriesVisited, gallery],
          },
        });
      },
      updateDwellTime: (artworkId: string, seconds: number) => {
        const { currentSession } = get();
        if (!currentSession) return;
        set({
          currentSession: {
            ...currentSession,
            artworksViewed: currentSession.artworksViewed.map((v) =>
              v.artworkId === artworkId ? { ...v, dwellTime: v.dwellTime + seconds } : v
            ),
          },
        });
      },

      // Map state
      currentFloor: 5,
      setCurrentFloor: (floor: number) => set({ currentFloor: floor }),

      // UI
      selectedArtworkId: null,
      setSelectedArtworkId: (id: string | null) => set({ selectedArtworkId: id }),
      suppressStampToast: false,
      setSuppressStampToast: (suppress: boolean) => set({ suppressStampToast: suppress }),

      // Demo data seeding
      seedDemoData: () => {
        const now = Date.now();
        const twoHoursAgo = now - 2 * 60 * 60 * 1000;

        // Simulate a realistic 2-hour visit viewing 12 artworks across all floors
        const demoVisits: ArtworkVisit[] = [
          { artworkId: 'starry-night', timestamp: twoHoursAgo, dwellTime: 480 },
          { artworkId: 'persistence-of-memory', timestamp: twoHoursAgo + 10 * 60000, dwellTime: 300 },
          { artworkId: 'les-demoiselles', timestamp: twoHoursAgo + 20 * 60000, dwellTime: 240 },
          { artworkId: 'water-lilies', timestamp: twoHoursAgo + 35 * 60000, dwellTime: 420 },
          { artworkId: 'the-dream', timestamp: twoHoursAgo + 50 * 60000, dwellTime: 180 },
          { artworkId: 'i-and-village', timestamp: twoHoursAgo + 55 * 60000, dwellTime: 150 },
          { artworkId: 'campbell-soup', timestamp: twoHoursAgo + 65 * 60000, dwellTime: 360 },
          { artworkId: 'flag', timestamp: twoHoursAgo + 75 * 60000, dwellTime: 200 },
          { artworkId: 'one-number-31', timestamp: twoHoursAgo + 85 * 60000, dwellTime: 270 },
          { artworkId: 'american-people-20', timestamp: twoHoursAgo + 95 * 60000, dwellTime: 300 },
          { artworkId: 'meret-oppenheim-fur', timestamp: twoHoursAgo + 100 * 60000, dwellTime: 120 },
          { artworkId: 'echo-narcissus', timestamp: twoHoursAgo + 110 * 60000, dwellTime: 180 },
        ];

        const demoSession: VisitSession = {
          startTime: twoHoursAgo,
          artworksViewed: demoVisits,
          floorsVisited: [5, 4, 2],
          galleriesVisited: ['501', '512', '502', '515', '215', '503', '412', '408', '401', '420', '210', '204'],
        };

        // Earn a good spread of stamps for the demo
        const demoStamps = STAMP_DEFINITIONS.map((s) => {
          const earned = [
            'era-1880s-1940s', 'era-1950s-1970s', 'era-1980s-present',
            'mov-cubism', 'mov-surrealism', 'mov-pop-art', 'mov-impressionism',
            'explorer-3-floors', 'explorer-5-artworks', 'explorer-10-artworks',
            'hidden-gem',
          ].includes(s.id);
          return earned ? { ...s, earnedAt: twoHoursAgo + Math.random() * 7200000 } : { ...s };
        });

        set({
          onboardingComplete: true,
          onboardingAnswers: {
            firstTime: true,
            color: 'black',
            artMedium: 'painting',
          },
          currentSession: demoSession,
          bookmarks: ['starry-night', 'water-lilies', 'campbell-soup', 'persistence-of-memory', 'american-people-20'],
          savedArtworks: ['starry-night', 'water-lilies', 'campbell-soup', 'persistence-of-memory', 'american-people-20'],
          stamps: demoStamps,
          recommendations: [
            { artworkId: 'echo-narcissus', hook: 'Raw emotion that hits you before you understand why', blurb: 'Siqueiros painted this during the Spanish Civil War — a baby screaming into a devastated landscape. The scale shift between the tiny figure and the massive open mouth creates a visceral tension that Guernica only hints at.' },
            { artworkId: 'american-people-20', hook: 'The painting that predicted America\'s reckoning', blurb: 'Ringgold made this in 1967, directly confronting racial violence with a mural-scale painting that references both Picasso\'s Guernica and the chaos of the civil rights era. It\'s impossible to look away.' },
            { artworkId: 'meret-oppenheim-fur', hook: 'The most unsettling teacup you\'ll ever see', blurb: 'Oppenheim lined a cup, saucer, and spoon with gazelle fur — and instantly created one of Surrealism\'s most iconic objects. Your brain wants to drink from it and recoil at the same time.' },
          ],
        });
      },

      resetAllData: () => {
        set({
          bookmarks: [],
          savedArtworks: [DEFAULT_SAVED_ARTWORK_ID],
          onboardingComplete: false,
          onboardingAnswers: { firstTime: null, color: null, artMedium: null },
          recommendations: [],
          recommendationsLoading: false,
          stamps: STAMP_DEFINITIONS.map((s) => ({ ...s })),
          currentSession: null,
          pastSessions: [],
          currentFloor: 5,
          selectedArtworkId: null,
        });
      },
    }),
    {
      name: 'moma-explorer-storage',
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<AppState>;
        return {
          ...currentState,
          ...persisted,
          savedArtworks: withDefaultSavedArtwork(persisted.savedArtworks),
        };
      },
      partialize: (state) => ({
        bookmarks: state.bookmarks,
        savedArtworks: state.savedArtworks,
        currentSession: state.currentSession,
        pastSessions: state.pastSessions,
        onboardingComplete: state.onboardingComplete,
        onboardingAnswers: state.onboardingAnswers,
        recommendations: state.recommendations,
        stamps: state.stamps,
      }),
    }
  )
);
