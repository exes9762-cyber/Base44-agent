import type { StyleId } from "./types";

export interface CpuFighter {
  id: string;
  name: string;
  nickname: string;
  age: number;
  styleId: StyleId;
  weakness: string;
  record: string;
  description: string;
  color: string;
}

export const CPU_FIGHTERS: CpuFighter[] = [
  {
    id: "brick",
    name: "Brick McFist",
    nickname: "The Demolisher",
    age: 22,
    styleId: "boxing",
    weakness: "Low kicks — he never guards his legs",
    record: "8-3-0",
    description: "Street brawler turned boxer. Wild right hand, zero footwork.",
    color: "#e74c3c",
  },
  {
    id: "yuki",
    name: "Yuki Chen",
    nickname: "The Typhoon",
    age: 24,
    styleId: "kickboxing",
    weakness: "Clinch him up — she hates being grabbed",
    record: "14-4-0",
    description: "Olympic alternate. Devastating leg kicks, weak in the clinch.",
    color: "#f39c12",
  },
  {
    id: "tito",
    name: "Tito Gracias",
    nickname: "Granite",
    age: 28,
    styleId: "bjj",
    weakness: "Keep your distance — he needs to grab you",
    record: "21-2-0",
    description: "Submission specialist from Recife. Dangerous on the ground.",
    color: "#1abc9c",
  },
  {
    id: "akira",
    name: "Master Akira",
    nickname: "The Phantom",
    age: 47,
    styleId: "aikido",
    weakness: "Relentless pressure — he can't redirect chaos",
    record: "38-6-0",
    description: "Former royal bodyguard. Reads attacks like a book.",
    color: "#9b59b6",
  },
  {
    id: "somchai",
    name: "Somchai Moo",
    nickname: "Iron Elbows",
    age: 27,
    styleId: "muaythai",
    weakness: "Long jabs — he struggles at distance",
    record: "34-3-0",
    description: "Lumpinee champion. Brutal clinch fighter, terrifying elbows.",
    color: "#e67e22",
  },
  {
    id: "ivan",
    name: "Ivan Petrov",
    nickname: "The Wall",
    age: 32,
    styleId: "wrestling",
    weakness: "Move constantly — static fighters get taken down",
    record: "29-1-0",
    description: "Olympic gold medalist turned MMA. Unstoppable takedowns.",
    color: "#3498db",
  },
  {
    id: "zhang",
    name: "Zhang Wei",
    nickname: "Shaolin Thunder",
    age: 40,
    styleId: "kungfu",
    weakness: "Power shots — he trained for finesse, not raw force",
    record: "61-5-0",
    description: "35 years temple training. Unpredictable, fast strikes.",
    color: "#f1c40f",
  },
  {
    id: "diablo",
    name: "El Diablo",
    nickname: "The End",
    age: 30,
    styleId: "mma",
    weakness: "Classified — nobody who figured it out came back",
    record: "89-0-0",
    description: "Undefeated. Two-weight world champion. Final boss.",
    color: "#ff0033",
  },
];

export function pickEnemy(totalWins: number): CpuFighter {
  const idx = Math.min(Math.floor(totalWins / 1), CPU_FIGHTERS.length - 1);
  const randomOffset = Math.floor(Math.random() * 2);
  const finalIdx = Math.min(idx + randomOffset, CPU_FIGHTERS.length - 1);
  return CPU_FIGHTERS[finalIdx]!;
}
