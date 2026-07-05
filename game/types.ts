import type { CpuFighter } from "./fighters";

export type StyleId =
  | "boxing"
  | "kickboxing"
  | "bjj"
  | "aikido"
  | "muaythai"
  | "judo"
  | "taekwondo"
  | "kungfu"
  | "mma"
  | "wrestling";

export type Difficulty = "easy" | "normal" | "hard";
export type QTEType = "DODGE" | "DUCK" | "PARRY" | "COUNTER";
export type GamePhase = "menu" | "fightcard" | "fighting" | "between" | "win" | "lose" | "upgrade";
export type AttackInput = "P" | "K";
export type LetterType = "intro" | "win50";
export type AttackType = "punch" | "hook" | "kick" | null;

export interface ComboMove {
  inputs: AttackInput[];
  name: string;
  damage: number;
  isKick?: boolean;
  isMega?: boolean;
  isHighRisk?: boolean;
}

export interface StyleConfig {
  id: StyleId;
  name: string;
  description: string;
  color: string;
  combos: ComboMove[];
  dodgeMultiplier: number;
  counterMultiplier: number;
  unlockCost: number;
  coachName: string;
  coachTag: string;
}

export interface Fighter {
  hp: number;
  maxHp: number;
  x: number;
  isAttacking: boolean;
  isKicking: boolean;
  attackType: AttackType;
  isHurt: boolean;
  isFallen: boolean;
  isWhiffed: boolean;
  comboBuffer: AttackInput[];
  lastInputTime: number;
  attackCooldown: number;
  facingRight: boolean;
  isPlayer: boolean;
  animState: "idle" | "walk" | "attack" | "hurt" | "fall" | "win" | "whiff";
}

export interface QTEEvent {
  type: QTEType;
  deadline: number;
  active: boolean;
  damage: number;
}

export interface DamageNumber {
  id: string;
  value: number;
  x: number;
  isPlayer: boolean;
  isCrit: boolean;
  timestamp: number;
}

export interface GameState {
  phase: GamePhase;
  player: Fighter;
  enemy: Fighter;
  currentEnemy: CpuFighter | null;
  round: number;
  roundsToWin: number;
  playerRoundWins: number;
  enemyRoundWins: number;
  qte: QTEEvent | null;
  damageNumbers: DamageNumber[];
  winStreak: number;
  totalWins: number;
  coins: number;
  lastWinCoins: number;
  difficulty: Difficulty;
  playerStyle: StyleId;
  unlockedStyles: StyleId[];
  strength: number;
  agility: number;
  timing: number;
  lastComboName: string | null;
  lastComboTime: number;
  activeLetter: LetterType | null;
  hasSeenIntroLetter: boolean;
  hasSeenWin50Letter: boolean;
}
