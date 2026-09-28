export type GameMode = "border-hunt" | "clue-ladder";

export const ONBOARDING = {
  "border-hunt": {
    storageKey: "maptrail:onboarding:border-hunt:v1",
    title: "Find the mystery state",
    body: "A mystery state has been chosen. Start by guessing any state on the map or searching by name. After each guess, MapTrail shows how many state borders separate your guess from the mystery state. The hotter the result, the closer you are. 🔥 means your guess directly borders the mystery state, and green means you found it.",
    action: "Start Border Hunt",
  },
  "clue-ladder": {
    storageKey: "maptrail:onboarding:clue-ladder:v1",
    title: "Find the mystery state from the clues",
    body: "Begin with a difficult clue and guess the mystery state whenever you are ready. Reveal more clues if you need them—but the earlier you solve it, the higher your score.",
    action: "Start Clue Ladder",
  },
} as const;

export type OnboardingContent = {
  title: string;
  body: string;
  action: string;
};

export const EUROPE_BORDER_HUNT_ONBOARDING: OnboardingContent = {
  title: "Find the mystery country",
  body: "A mystery country has been chosen. Guess a country to begin. MapTrail follows land borders to show how closely your guess connects to the answer. Easy Mode also points in the target’s general direction.",
  action: "Start Border Hunt",
};

type StorageReader = Pick<Storage, "getItem">;
type StorageWriter = Pick<Storage, "setItem">;

export function hasSeenOnboarding(mode: GameMode, storage: StorageReader) {
  return storage.getItem(ONBOARDING[mode].storageKey) === "seen";
}

export function markOnboardingSeen(mode: GameMode, storage: StorageWriter) {
  storage.setItem(ONBOARDING[mode].storageKey, "seen");
}
