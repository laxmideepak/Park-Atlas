/**
 * Chapter spy — a plain module-level subscribe/set store (useSyncExternalStore
 * shaped, no context provider) connecting the park page's ChapterRail to the
 * global Nav. ChapterRail already owns the IntersectionObserver active-chapter
 * state; it writes the active chapter (plus the park name it was handed via
 * the `runningHead` prop) here, and clears it on unmount so every other route
 * shows nothing. RunningHead (inside Nav) is the only reader.
 */
export interface ChapterSpyState {
  park: string;
  id: string;
  label: string;
  index: number; // 1-based position in the page's filtered chapters
}

let state: ChapterSpyState | null = null;
const listeners = new Set<() => void>();

export function setChapterSpy(next: ChapterSpyState | null): void {
  state = next;
  listeners.forEach((l) => l());
}

export function subscribeChapterSpy(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getChapterSpy(): ChapterSpyState | null {
  return state;
}

// Server snapshot for useSyncExternalStore — the running head never renders
// during SSR.
export function getChapterSpyServerSnapshot(): ChapterSpyState | null {
  return null;
}
