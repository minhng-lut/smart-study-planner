import { create } from 'zustand';

type UiStore = {
  showPlatformLinks: boolean;
  togglePlatformLinks: () => void;
};

export const useUiStore = create<UiStore>((set) => ({
  showPlatformLinks: true,
  togglePlatformLinks: () =>
    set((state) => ({
      showPlatformLinks: !state.showPlatformLinks
    }))
}));
