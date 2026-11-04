export type ShuffleState = {
  roundIds: string[];
  guardIds: string[];
  historyIds: string[];
};

export const EMPTY_SHUFFLE: ShuffleState = {
  roundIds: [],
  guardIds: [],
  historyIds: [],
};

const HISTORY_LIMIT = 500;
const MAX_GUARD_SIZE = 10;
const GUARD_SHARE_OF_QUEUE = 0.5;

const pickRandom = <T>(values: T[]): T =>
  values[Math.floor(Math.random() * values.length)];

const withId = (ids: string[], id: string) =>
  ids.includes(id) ? ids : [...ids, id];

const pushHistory = (historyIds: string[], id: string) =>
  [...historyIds, id].slice(-HISTORY_LIMIT);

const avoidGuard = (candidateIds: string[], shuffle: ShuffleState) => {
  if (shuffle.roundIds.length >= shuffle.guardIds.length) {
    return candidateIds;
  }
  const guard = new Set(shuffle.guardIds);
  const safeIds = candidateIds.filter((id) => !guard.has(id));
  return safeIds.length > 0 ? safeIds : candidateIds;
};

export const recordMove = (
  shuffle: ShuffleState,
  fromId: string,
  toId: string,
): ShuffleState => ({
  ...shuffle,
  roundIds: withId(withId(shuffle.roundIds, fromId), toId),
  historyIds: pushHistory(shuffle.historyIds, fromId),
});

export const pickNextShuffled = (
  shuffle: ShuffleState,
  itemIds: string[],
  currentId: string,
  canStartNewRound: boolean,
): { nextId: string; shuffle: ShuffleState } | null => {
  const roundIds = withId(shuffle.roundIds, currentId);
  const played = new Set(roundIds);
  const unplayedIds = itemIds.filter((id) => !played.has(id));

  if (unplayedIds.length > 0) {
    const nextId = pickRandom(avoidGuard(unplayedIds, shuffle));
    return {
      nextId,
      shuffle: {
        ...shuffle,
        roundIds: [...roundIds, nextId],
        historyIds: pushHistory(shuffle.historyIds, currentId),
      },
    };
  }

  if (!canStartNewRound || itemIds.length <= 1) {
    return null;
  }

  const guardSize = Math.min(
    MAX_GUARD_SIZE,
    Math.floor(itemIds.length * GUARD_SHARE_OF_QUEUE),
  );
  const finishedRoundIds = [
    ...roundIds.filter((id) => id !== currentId),
    currentId,
  ];
  const newRound: ShuffleState = {
    ...shuffle,
    roundIds: [],
    guardIds: guardSize > 0 ? finishedRoundIds.slice(-guardSize) : [],
  };
  const candidateIds = itemIds.filter((id) => id !== currentId);
  const nextId = pickRandom(avoidGuard(candidateIds, newRound));

  return {
    nextId,
    shuffle: {
      ...newRound,
      roundIds: [nextId],
      historyIds: pushHistory(shuffle.historyIds, currentId),
    },
  };
};

export const popPrevious = (
  shuffle: ShuffleState,
  itemIds: string[],
): { previousId: string; shuffle: ShuffleState } | null => {
  const existing = new Set(itemIds);
  const historyIds = [...shuffle.historyIds];

  while (historyIds.length > 0) {
    const previousId = historyIds.pop()!;
    if (existing.has(previousId)) {
      return { previousId, shuffle: { ...shuffle, historyIds } };
    }
  }

  return null;
};
