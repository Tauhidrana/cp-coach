// Platform registry & shared types. Each adapter is isolated under ./adapters
// so adding a new platform is just: write adapter + register here.

export type PlatformId =
  | "codeforces"
  | "leetcode"
  | "atcoder"
  | "codechef"
  | "hackerrank"
  | "gfg"
  | "coding-ninjas";

export interface PlatformMeta {
  id: PlatformId;
  name: string;
  short: string;
  color: string; // hex for UI accents
  url: (username: string) => string;
  /** true → we can fetch data via API. false → user enters numbers manually. */
  apiSupported: boolean;
  /** Hint shown next to the username input. */
  usernameHint?: string;
}

export interface PlatformStats {
  rating: number | null;
  maxRating: number | null;
  rankLabel: string | null;
  problemsSolved: number;
  contestCount: number;
  raw?: Record<string, unknown>;
}

export const PLATFORMS: Record<PlatformId, PlatformMeta> = {
  codeforces: {
    id: "codeforces",
    name: "Codeforces",
    short: "CF",
    color: "#1f8acb",
    url: (u) => `https://codeforces.com/profile/${u}`,
    apiSupported: true,
    usernameHint: "e.g. tourist",
  },
  leetcode: {
    id: "leetcode",
    name: "LeetCode",
    short: "LC",
    color: "#ffa116",
    url: (u) => `https://leetcode.com/${u}/`,
    apiSupported: true,
    usernameHint: "your LeetCode handle",
  },
  atcoder: {
    id: "atcoder",
    name: "AtCoder",
    short: "AC",
    color: "#3b82f6",
    url: (u) => `https://atcoder.jp/users/${u}`,
    apiSupported: true,
    usernameHint: "your AtCoder ID",
  },
  codechef: {
    id: "codechef",
    name: "CodeChef",
    short: "CC",
    color: "#5b4638",
    url: (u) => `https://www.codechef.com/users/${u}`,
    apiSupported: true,
    usernameHint: "your CodeChef handle",
  },
  hackerrank: {
    id: "hackerrank",
    name: "HackerRank",
    short: "HR",
    color: "#2ec866",
    url: (u) => `https://www.hackerrank.com/${u}`,
    apiSupported: false,
    usernameHint: "manually update stats",
  },
  gfg: {
    id: "gfg",
    name: "GeeksforGeeks",
    short: "GFG",
    color: "#2f8d46",
    url: (u) => `https://auth.geeksforgeeks.org/user/${u}/practice/`,
    apiSupported: false,
    usernameHint: "manually update stats",
  },
  "coding-ninjas": {
    id: "coding-ninjas",
    name: "Coding Ninjas",
    short: "CN",
    color: "#fb7c00",
    url: (u) => `https://www.codingninjas.com/studio/profile/${u}`,
    apiSupported: false,
    usernameHint: "manually update stats",
  },
};

export const PLATFORM_LIST: PlatformMeta[] = Object.values(PLATFORMS);
