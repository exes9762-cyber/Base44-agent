import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import { pickEnemy } from "./fighters";
import { getStyle, MARTIAL_ARTS } from "./styles";
import type {
  AttackInput,
  AttackType,
  Difficulty,
  DamageNumber,
  Fighter,
  GameState,
  LetterType,
  QTEType,
  StyleId,
} from "./types";

const SAVE_KEY = "ufg_mobile_save_v3";
const COMBO_WINDOW = 600;
const BASE_HP = 100;

function makeFighter(isPlayer: boolean): Fighter {
  return {
    hp: BASE_HP,
    maxHp: BASE_HP,
    x: isPlayer ? -3 : 3,
    isAttacking: false,
    isKicking: false,
    attackType: null,
    isHurt: false,
    isFallen: false,
    isWhiffed: false,
    comboBuffer: [],
    lastInputTime: 0,
    attackCooldown: 0,
    facingRight: isPlayer,
    isPlayer,
    animState: "idle",
  };
}

function initialState(): GameState {
  return {
    phase: "menu",
    player: makeFighter(true),
    enemy: makeFighter(false),
    currentEnemy: null,
    round: 1,
    roundsToWin: 2,
    playerRoundWins: 0,
    enemyRoundWins: 0,
    qte: null,
    damageNumbers: [],
    winStreak: 0,
    totalWins: 0,
    coins: 0,
    lastWinCoins: 0,
    difficulty: "normal",
    playerStyle: "boxing",
    unlockedStyles: ["boxing"],
    strength: 1,
    agility: 1,
    timing: 1,
    lastComboName: null,
    lastComboTime: 0,
    activeLetter: null,
    hasSeenIntroLetter: false,
    hasSeenWin50Letter: false,
  };
}

function uid(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function resolveAttackType(inputs: AttackInput[], isKick: boolean): AttackType {
  if (isKick) return "kick";
  if (inputs.length >= 2 && inputs.every((i) => i === "P")) return "hook";
  return "punch";
}

// ─── Common-sense combat logic ────────────────────────────────────────────────
// Flashy/high-risk moves have a chance to fail even when in range.
// This chance decreases with better timing stat and higher difficulty knowledge.
function highRiskWhiffChance(comboIsHighRisk: boolean, timingStat: number, dist: number): boolean {
  if (!comboIsHighRisk) return false;
  // Base 25% whiff chance for high-risk moves
  const baseChance = 0.25;
  // Timing stat reduces whiff chance (max 15% reduction at stat 10)
  const timingReduction = timingStat * 0.015;
  // Being too close or too far increases whiff chance (bad range = harder)
  const rangePenalty = dist > 3.0 ? 0.10 : 0;
  const finalChance = Math.max(0.05, baseChance - timingReduction + rangePenalty);
  return Math.random() < finalChance;
}

// Momentum: consecutive hits build momentum, increasing damage slightly
// But spamming the same combo reduces effectiveness (diminishing returns)
function momentumMultiplier(
  lastComboName: string | null,
  currentComboName: string,
  consecutiveHits: number
): number {
  if (lastComboName === currentComboName) {
    // Same combo spammed — diminishing returns
    return Math.max(0.6, 1.0 - consecutiveHits * 0.12);
  }
  // Different combo — slight momentum bonus for variety
  return Math.min(1.25, 1.0 + consecutiveHits * 0.04);
}

// Distance-based damage: close = full power, far = reduced (except for grappling which needs close)
function distanceDamageMod(dist: number, isKick: boolean, isGrappling: boolean): number {
  if (isGrappling) {
    // Grappling needs to be very close
    return dist < 2.0 ? 1.0 : Math.max(0.3, 1.0 - (dist - 2.0) * 0.2);
  }
  if (isKick) {
    // Kicks have optimal range — too close = less power (can't extend fully)
    if (dist < 1.0) return 0.75;
    if (dist < 3.0) return 1.0;
    return Math.max(0.5, 1.0 - (dist - 3.0) * 0.15);
  }
  // Punches: close = full, far = weak
  if (dist < 2.5) return 1.0;
  return Math.max(0.4, 1.0 - (dist - 2.5) * 0.2);
}

// Check if a combo name implies grappling
function isGrapplingCombo(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    lower.includes("grab") || lower.includes("takedown") || lower.includes("throw") ||
    lower.includes("hold") || lower.includes("submission") || lower.includes("ippon") ||
    lower.includes("nage") || lower.includes("hip") || lower.includes("shoulder") ||
    lower.includes("kote") || lower.includes("collar") || lower.includes("grip") ||
    lower.includes("harmony") || lower.includes("energy") || lower.includes("sweep")
  );
}

export function useGameState() {
  const [state, setState] = useState<GameState>(initialState());
  const stateRef = useRef<GameState>(state);
  const loopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const consecutiveHitsRef = useRef(0);
  const lastComboRef = useRef<string | null>(null);

  stateRef.current = state;

  useEffect(() => {
    AsyncStorage.getItem(SAVE_KEY)
      .then((raw) => {
        if (!raw) {
          setState((s) => ({ ...s, activeLetter: "intro" }));
          return;
        }
        const saved = JSON.parse(raw);
        setState((s) => ({
          ...s,
          winStreak: saved.winStreak ?? 0,
          totalWins: saved.totalWins ?? 0,
          coins: saved.coins ?? 0,
          unlockedStyles: saved.unlockedStyles ?? ["boxing"],
          playerStyle: saved.playerStyle ?? "boxing",
          difficulty: saved.difficulty ?? "normal",
          strength: saved.strength ?? 1,
          agility: saved.agility ?? 1,
          timing: saved.timing ?? 1,
          hasSeenIntroLetter: saved.hasSeenIntroLetter ?? true,
          hasSeenWin50Letter: saved.hasSeenWin50Letter ?? false,
        }));
      })
      .catch(() => {
        setState((s) => ({ ...s, activeLetter: "intro" }));
      });
  }, []);

  const saveProgress = useCallback((s: GameState) => {
    const data = {
      winStreak: s.winStreak,
      totalWins: s.totalWins,
      coins: s.coins,
      unlockedStyles: s.unlockedStyles,
      playerStyle: s.playerStyle,
      difficulty: s.difficulty,
      strength: s.strength,
      agility: s.agility,
      timing: s.timing,
      hasSeenIntroLetter: s.hasSeenIntroLetter,
      hasSeenWin50Letter: s.hasSeenWin50Letter,
    };
    AsyncStorage.setItem(SAVE_KEY, JSON.stringify(data)).catch(() => {});
  }, []);

  const stopLoop = useCallback(() => {
    if (loopRef.current) {
      clearInterval(loopRef.current);
      loopRef.current = null;
    }
  }, []);

  const addDamageNumber = useCallback(
    (value: number, isPlayer: boolean, isCrit: boolean, x: number) => {
      const dn: DamageNumber = { id: uid(), value, x, isPlayer, isCrit, timestamp: Date.now() };
      setState((s) => ({ ...s, damageNumbers: [...s.damageNumbers.slice(-5), dn] }));
      setTimeout(() => {
        setState((s) => ({ ...s, damageNumbers: s.damageNumbers.filter((d) => d.id !== dn.id) }));
      }, 1200);
    },
    []
  );

  const resolveCombo = useCallback(
    (buffer: AttackInput[], styleId: StyleId, strength: number) => {
      const style = getStyle(styleId);
      let best = style.combos.find(
        (c) => c.inputs.length === buffer.length && c.inputs.every((inp, i) => inp === buffer[i])
      );
      if (!best) {
        best = style.combos
          .filter(
            (c) =>
              c.inputs.length <= buffer.length && c.inputs.every((inp, i) => inp === buffer[i])
          )
          .sort((a, b) => b.inputs.length - a.inputs.length)[0];
      }
      if (!best) return null;
      const bonus = 1 + (strength - 1) * 0.15;
      return { ...best, damage: Math.round(best.damage * bonus) };
    },
    []
  );

  // ─── startGameLoop: AI/physics loop with common-sense logic ───────────────
  const startGameLoop = useCallback(() => {
    stopLoop();
    const TICK = 33;

    loopRef.current = setInterval(() => {
      const s = stateRef.current;
      if (s.phase !== "fighting") return;
      const now = Date.now();

      const diff = s.difficulty;
      const aiSpeed = diff === "easy" ? 3000 : diff === "normal" ? 2000 : 1300;
      const aiMoveSpeed = diff === "easy" ? 0.06 : diff === "normal" ? 0.1 : 0.16;

      // AI exploits whiff — punishing player for missing flashy moves
      if (s.player.isWhiffed && !s.enemy.isFallen && !s.qte) {
        // Whiff punishment is bigger for high-risk moves (common sense: bigger whiff = bigger punishment)
        const whiffDmg = 18 + Math.floor(Math.random() * 14);
        addDamageNumber(whiffDmg, true, true, s.player.x);
        setState((s2) => ({
          ...s2,
          player: {
            ...s2.player,
            hp: Math.max(0, s2.player.hp - whiffDmg),
            isHurt: true,
            isWhiffed: false,
            animState: "hurt",
          },
        }));
        return;
      }

      // AI attack / move — AI also uses common sense (approaches before attacking)
      if (!s.enemy.isFallen && s.enemy.attackCooldown < now && !s.qte) {
        const dist = Math.abs(s.player.x - s.enemy.x);
        if (dist < 3.5) {
          // AI is smart enough to not always attack from max range
          // Sometimes it closes distance first (especially on hard)
          const shouldCloseIn = diff === "hard" && dist > 2.5 && Math.random() < 0.4;
          if (shouldCloseIn) {
            setState((s2) => {
              const dir = s2.player.x > s2.enemy.x ? 1 : -1;
              const newX = Math.max(-4.5, Math.min(4.5, s2.enemy.x + dir * aiMoveSpeed * 2));
              return {
                ...s2,
                enemy: { ...s2.enemy, x: newX, facingRight: dir < 0, animState: "walk" },
              };
            });
          } else {
            const qteTypes: QTEType[] = ["DODGE", "DUCK", "PARRY", "COUNTER"];
            const qteType = qteTypes[Math.floor(Math.random() * qteTypes.length)]!;
            const windowMs = diff === "easy" ? 2200 : diff === "normal" ? 1500 : 900;
            // AI damage scales with distance slightly (closer = more dangerous)
            const distMod = dist < 2.0 ? 1.15 : 1.0;
            const dmg = Math.round((14 + Math.floor(Math.random() * 14)) * distMod);
            setState((s2) => ({
              ...s2,
              qte: { type: qteType, deadline: now + windowMs, active: true, damage: dmg },
              enemy: { ...s2.enemy, attackCooldown: now + aiSpeed, animState: "attack" },
            }));
            setTimeout(
              () =>
                setState((s2) => {
                  if (!s2.qte || !s2.qte.active) return s2;
                  const newHp = Math.max(0, s2.player.hp - s2.qte.damage);
                  addDamageNumber(s2.qte.damage, true, false, s2.player.x);
                  const fallen = newHp <= 0;
                  return {
                    ...s2,
                    qte: null,
                    player: {
                      ...s2.player,
                      hp: newHp,
                      isHurt: true,
                      isFallen: fallen,
                      animState: fallen ? "fall" : "hurt",
                    },
                  };
                }),
              windowMs
            );
          }
        } else {
          setState((s2) => {
            const dir = s2.player.x > s2.enemy.x ? 1 : -1;
            const newX = Math.max(-4.5, Math.min(4.5, s2.enemy.x + dir * aiMoveSpeed));
            return {
              ...s2,
              enemy: { ...s2.enemy, x: newX, facingRight: dir < 0, animState: "walk" },
            };
          });
        }
      }

      // Clear transient hurt flag
      setState((s2) => {
        let changed = false;
        let p = s2.player;
        let e = s2.enemy;
        if (p.isHurt && !p.isFallen) { p = { ...p, isHurt: false, animState: "idle" }; changed = true; }
        if (e.isHurt && !e.isFallen) { e = { ...e, isHurt: false, animState: "idle" }; changed = true; }
        if (!changed) return s2;
        return { ...s2, player: p, enemy: e };
      });

      // Check for round / match end
      const s2 = stateRef.current;
      if (s2.player.hp <= 0 || s2.enemy.hp <= 0) {
        stopLoop();
        const playerWon = s2.enemy.hp <= 0;
        const newPWins = s2.playerRoundWins + (playerWon ? 1 : 0);
        const newEWins = s2.enemyRoundWins + (playerWon ? 0 : 1);
        const matchOver = newPWins >= s2.roundsToWin || newEWins >= s2.roundsToWin;

        if (matchOver) {
          if (playerWon) {
            const streakBonus = 1 + s2.winStreak * 0.1;
            const earned = Math.max(5, Math.round((5 + s2.round * 2) * streakBonus));
            const newTotalWins = s2.totalWins + 1;
            const hit50 = newTotalWins === 50 && !s2.hasSeenWin50Letter;
            setState((prev) => {
              const next: GameState = {
                ...prev,
                phase: "upgrade",
                playerRoundWins: newPWins,
                enemyRoundWins: newEWins,
                winStreak: prev.winStreak + 1,
                totalWins: newTotalWins,
                coins: prev.coins + earned + (hit50 ? 100 : 0),
                lastWinCoins: earned + (hit50 ? 100 : 0),
                qte: null,
                activeLetter: hit50 ? "win50" : null,
                hasSeenWin50Letter: hit50 ? true : prev.hasSeenWin50Letter,
              };
              saveProgress(next);
              return next;
            });
          } else {
            setState((prev) => {
              const next: GameState = {
                ...prev,
                phase: "lose",
                playerRoundWins: newPWins,
                enemyRoundWins: newEWins,
                winStreak: 0,
                lastWinCoins: 0,
                qte: null,
              };
              saveProgress(next);
              return next;
            });
          }
        } else {
          // Round over — next round
          setState((prev) => ({
            ...prev,
            phase: "between",
            round: prev.round + 1,
            playerRoundWins: newPWins,
            enemyRoundWins: newEWins,
            qte: null,
            damageNumbers: [],
            player: makeFighter(true),
            enemy: makeFighter(false),
          }));
          setTimeout(() => {
            setState((prev) => ({ ...prev, phase: "fighting" }));
            startGameLoop();
          }, 1800);
        }
      }
    }, TICK);
  }, [stopLoop, addDamageNumber, saveProgress]);

  const beginMatch = useCallback(() => {
    consecutiveHitsRef.current = 0;
    lastComboRef.current = null;
    stopLoop();
    setState((s) => {
      const enemy = pickEnemy(s.totalWins);
      return {
        ...s,
        phase: "fightcard",
        currentEnemy: enemy,
        player: makeFighter(true),
        enemy: makeFighter(false),
        playerRoundWins: 0,
        enemyRoundWins: 0,
        round: 1,
        qte: null,
        damageNumbers: [],
      };
    });
  }, [stopLoop]);

  const startFight = useCallback(() => {
    consecutiveHitsRef.current = 0;
    lastComboRef.current = null;
    setState((s) => ({ ...s, phase: "fighting" }));
    startGameLoop();
  }, [startGameLoop]);

  const doPlayerAttack = useCallback(
    (input: AttackInput) => {
      const s = stateRef.current;
      if (
        s.phase !== "fighting" ||
        s.player.isFallen ||
        s.player.isWhiffed ||
        s.player.attackCooldown > Date.now()
      ) return;

      const now = Date.now();
      let buffer = s.player.comboBuffer;
      if (now - s.player.lastInputTime > COMBO_WINDOW) buffer = [];
      buffer = [...buffer, input];

      const combo = resolveCombo(buffer, s.playerStyle, s.strength);
      const style = getStyle(s.playerStyle);
      const maxLen = Math.max(...style.combos.map((c) => c.inputs.length));
      const shouldFire = buffer.length >= maxLen || (combo && combo.inputs.length === buffer.length);

      if (shouldFire && combo) {
        const dist = Math.abs(s.player.x - s.enemy.x);
        const inRange = dist < 3.5;
        const cooldown = Math.max(200, 650 - s.agility * 45);
        const aType: AttackType = resolveAttackType(combo.inputs, !!combo.isKick);
        const grappling = isGrapplingCombo(combo.name);

        // ── COMMON SENSE: High-risk flashy moves can whiff even in range ──────
        if (inRange && combo.isHighRisk) {
          const whiffs = highRiskWhiffChance(true, s.timing, dist);
          if (whiffs) {
            // Move whiffed — fighter stumbles, AI gets to punish
            setState((s2) => ({
              ...s2,
              player: {
                ...s2.player,
                comboBuffer: [],
                lastInputTime: now,
                attackCooldown: now + cooldown * 2.5, // longer recovery for whiffed flashy move
                isAttacking: true,
                isKicking: !!combo.isKick,
                attackType: aType,
                isWhiffed: true,
                animState: "whiff",
              },
              lastComboName: combo.name,
              lastComboTime: now,
            }));
            setTimeout(() => {
              setState((s2) => ({
                ...s2,
                player: {
                  ...s2.player,
                  isAttacking: false,
                  isKicking: false,
                  attackType: null,
                  animState: "idle",
                },
              }));
            }, 900);
            consecutiveHitsRef.current = 0;
            return;
          }
        }

        // ── Out of range whiff ────────────────────────────────────────────────
        if (!inRange) {
          // High-risk moves out of range = guaranteed whiff (common sense)
          if (combo.isHighRisk) {
            setState((s2) => ({
              ...s2,
              player: {
                ...s2.player,
                comboBuffer: [],
                lastInputTime: now,
                attackCooldown: now + cooldown * 2,
                isAttacking: true,
                isKicking: true,
                attackType: "kick",
                isWhiffed: true,
                animState: "whiff",
              },
            }));
            setTimeout(() => {
              setState((s2) => ({
                ...s2,
                player: {
                  ...s2.player,
                  isAttacking: false,
                  isKicking: false,
                  attackType: null,
                  isWhiffed: false,
                  animState: "idle",
                },
              }));
            }, 800);
            consecutiveHitsRef.current = 0;
            return;
          }
          // Normal move out of range — just swings at air (no whiff penalty, but no damage)
          setState((s2) => ({
            ...s2,
            player: {
              ...s2.player,
              comboBuffer: [],
              lastInputTime: now,
              attackCooldown: now + cooldown,
              isAttacking: true,
              isKicking: !!combo.isKick,
              attackType: aType,
              animState: "attack",
            },
          }));
          setTimeout(() => {
            setState((s2) => ({
              ...s2,
              player: {
                ...s2.player,
                isAttacking: false,
                isKicking: false,
                attackType: null,
                animState: "idle",
              },
            }));
          }, 300);
          consecutiveHitsRef.current = 0;
          return;
        }

        // ── HIT! Apply momentum, distance, and crit logic ─────────────────────
        const isCrit = Math.random() < 0.12 + s.timing * 0.05;
        const streakMult = 1 + s.winStreak * 0.1;
        const distMod = distanceDamageMod(dist, !!combo.isKick, grappling);
        const momentum = momentumMultiplier(
          lastComboRef.current,
          combo.name,
          consecutiveHitsRef.current
        );

        // Grappling moves need closer range — if too far, reduced damage
        if (grappling && dist > 2.5) {
          // Grappling whiff — too far to grab
          setState((s2) => ({
            ...s2,
            player: {
              ...s2.player,
              comboBuffer: [],
              lastInputTime: now,
              attackCooldown: now + cooldown * 1.5,
              isAttacking: true,
              isKicking: false,
              attackType: "punch",
              animState: "attack",
            },
          }));
          setTimeout(() => {
            setState((s2) => ({
              ...s2,
              player: {
                ...s2.player,
                isAttacking: false,
                isKicking: false,
                attackType: null,
                animState: "idle",
              },
            }));
          }, 350);
          consecutiveHitsRef.current = 0;
          return;
        }

        const baseDmg = combo.damage * (isCrit ? 1.5 : 1) * streakMult;
        const finalDmg = Math.round(baseDmg * distMod * momentum);
        addDamageNumber(finalDmg, false, isCrit, s.enemy.x);

        // Update momentum tracking
        consecutiveHitsRef.current += 1;
        lastComboRef.current = combo.name;

        // Mega combos have longer recovery (physics: big move = big commitment)
        const recoveryTime = combo.isMega ? cooldown * 1.4 : cooldown;

        setState((s2) => {
          const newHp = Math.max(0, s2.enemy.hp - finalDmg);
          return {
            ...s2,
            player: {
              ...s2.player,
              comboBuffer: [],
              lastInputTime: now,
              attackCooldown: now + recoveryTime,
              isAttacking: true,
              isKicking: !!combo.isKick,
              attackType: aType,
              animState: "attack",
            },
            enemy: {
              ...s2.enemy,
              hp: newHp,
              isHurt: newHp > 0,
              isFallen: newHp <= 0,
              animState: newHp <= 0 ? "fall" : "hurt",
            },
            lastComboName: combo.name,
            lastComboTime: now,
          };
        });
        setTimeout(() => {
          setState((s2) => ({
            ...s2,
            player: {
              ...s2.player,
              isAttacking: false,
              isKicking: false,
              attackType: null,
              animState: "idle",
            },
          }));
        }, 400);
      } else {
        setState((s2) => ({
          ...s2,
          player: { ...s2.player, comboBuffer: buffer, lastInputTime: now },
        }));
      }
    },
    [resolveCombo, addDamageNumber]
  );

  const doQTEAction = useCallback(
    (type: QTEType) => {
      const s = stateRef.current;
      if (!s.qte || !s.qte.active) return;
      const now = Date.now();
      const remaining = s.qte.deadline - now;
      const windowMs = s.difficulty === "easy" ? 2200 : s.difficulty === "normal" ? 1500 : 900;
      const timingScore = remaining / windowMs;
      const isCorrect = type === s.qte.type;
      const style = getStyle(s.playerStyle);

      if (isCorrect) {
        const baseCounter = 12 + s.strength * 3;
        const timingBonus = timingScore > 0.5 ? 1.6 : 1.1;
        const counterDmg = Math.round(baseCounter * timingBonus * style.counterMultiplier);
        addDamageNumber(counterDmg, false, timingBonus > 1.4, s.enemy.x);
        consecutiveHitsRef.current += 1;
        setState((s2) => ({
          ...s2,
          qte: null,
          enemy: {
            ...s2.enemy,
            hp: Math.max(0, s2.enemy.hp - counterDmg),
            isHurt: true,
            animState: "hurt",
          },
        }));
      } else {
        // Failed QTE — takes more damage (common sense: wrong defense = worse outcome)
        const dmg = Math.round(s.qte.damage * (1.3 - s.timing * 0.02));
        addDamageNumber(dmg, true, false, s.player.x);
        consecutiveHitsRef.current = 0;
        setState((s2) => ({
          ...s2,
          qte: null,
          player: {
            ...s2.player,
            hp: Math.max(0, s2.player.hp - dmg),
            isHurt: true,
            animState: "hurt",
          },
        }));
      }
    },
    [addDamageNumber]
  );

  const movePlayer = useCallback((dir: -1 | 1) => {
    setState((s) => {
      if (s.phase !== "fighting" || s.player.isFallen || s.player.isWhiffed) return s;
      const speed = 0.14 + s.agility * 0.03;
      const newX = Math.max(-4.5, Math.min(4.5, s.player.x + dir * speed));
      return {
        ...s,
        player: { ...s.player, x: newX, facingRight: dir > 0, animState: "walk" },
      };
    });
  }, []);

  const switchStyleInFight = useCallback((id: StyleId) => {
    setState((s) => {
      if (!s.unlockedStyles.includes(id) || s.phase !== "fighting") return s;
      return { ...s, playerStyle: id };
    });
  }, []);

  const upgradeStat = useCallback(
    (stat: "strength" | "agility" | "timing") => {
      setState((s) => {
        const cost = s[stat] * 5;
        if (s.coins < cost || s[stat] >= 10) return s;
        const next = { ...s, [stat]: s[stat] + 1, coins: s.coins - cost };
        saveProgress(next);
        return next;
      });
    },
    [saveProgress]
  );

  const setStyle = useCallback(
    (id: StyleId) => {
      setState((s) => {
        if (!s.unlockedStyles.includes(id)) return s;
        const next = { ...s, playerStyle: id };
        saveProgress(next);
        return next;
      });
    },
    [saveProgress]
  );

  const hireCoach = useCallback(
    (id: StyleId) => {
      setState((s) => {
        const style = MARTIAL_ARTS.find((st) => st.id === id);
        if (!style || s.unlockedStyles.includes(id) || s.coins < style.unlockCost) return s;
        const next = {
          ...s,
          coins: s.coins - style.unlockCost,
          unlockedStyles: [...s.unlockedStyles, id],
          playerStyle: id,
        };
        saveProgress(next);
        return next;
      });
    },
    [saveProgress]
  );

  const setDifficulty = useCallback(
    (d: Difficulty) => {
      setState((s) => {
        const next = { ...s, difficulty: d };
        saveProgress(next);
        return next;
      });
    },
    [saveProgress]
  );

  const dismissLetter = useCallback(
    (letter: LetterType) => {
      setState((s) => {
        const coinReward = letter === "intro" ? 5 : 0;
        const next: GameState = {
          ...s,
          activeLetter: null,
          hasSeenIntroLetter: letter === "intro" ? true : s.hasSeenIntroLetter,
          coins: s.coins + coinReward,
        };
        saveProgress(next);
        return next;
      });
    },
    [saveProgress]
  );

  const goToMenu = useCallback(() => {
    stopLoop();
    consecutiveHitsRef.current = 0;
    lastComboRef.current = null;
    setState((s) => ({
      ...s,
      phase: "menu",
      player: makeFighter(true),
      enemy: makeFighter(false),
      playerRoundWins: 0,
      enemyRoundWins: 0,
      round: 1,
      qte: null,
      damageNumbers: [],
    }));
  }, [stopLoop]);

  useEffect(() => () => stopLoop(), [stopLoop]);

  return {
    state,
    beginMatch,
    startFight,
    doPlayerAttack,
    doQTEAction,
    movePlayer,
    switchStyleInFight,
    upgradeStat,
    setStyle,
    hireCoach,
    setDifficulty,
    dismissLetter,
    goToMenu,
  };
}
