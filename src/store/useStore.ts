import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

interface AppState {
  // Bookmarks
  bookmarks: string[];
  toggleBookmark: (artworkId: string) => void;
  isBookmarked: (artworkId: string) => boolean;

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
    }),
    {
      name: 'moma-explorer-storage',
      partialize: (state) => ({
        bookmarks: state.bookmarks,
        currentSession: state.currentSession,
        pastSessions: state.pastSessions,
      }),
    }
  )
);
