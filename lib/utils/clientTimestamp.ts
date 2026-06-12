import type { Timestamp } from "firebase/firestore";

export function timestampFromMillis(ms: number): Timestamp {
  const value = {
    seconds: Math.floor(ms / 1000),
    nanoseconds: (ms % 1000) * 1_000_000,
    toDate: () => new Date(ms),
    toMillis: () => ms,
    isEqual: (other: Timestamp) => other.toMillis() === ms,
    valueOf: () => String(ms).padStart(20, "0"),
    toJSON: () => ({
      seconds: Math.floor(ms / 1000),
      nanoseconds: (ms % 1000) * 1_000_000,
      type: "firestore/timestamp" as const,
    }),
  };
  return value as Timestamp;
}
