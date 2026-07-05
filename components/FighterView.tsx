/**
 * FighterView.tsx — Ultra-realistic humanoid fighter
 * Full articulated body: head/face, neck, torso, biceps, forearms, gloves,
 * hips, thighs, shins, feet. Every combo has its own unique animation.
 * Physics: momentum, squash/stretch, weight shift, stumble on whiff.
 * Common sense: flashy kicks have a wider wind-up so skilled players can read them.
 */

import React, { useEffect, useRef } from "react";
import { Animated, View, StyleSheet } from "react-native";
import type { Fighter } from "@/game/types";

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  fighter: Fighter;
  screenX: number;
  screenY: number;
  scale?: number;
  color: string;
  mirrorX?: boolean;
  comboName?: string | null;
}

// ─── Color utils ──────────────────────────────────────────────────────────────
function hexRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function lighten(hex: string, a: number) {
  const [r, g, b] = hexRgb(hex);
  return `rgb(${Math.min(255,r+a)},${Math.min(255,g+a)},${Math.min(255,b+a)})`;
}
function darken(hex: string, a: number) {
  const [r, g, b] = hexRgb(hex);
  return `rgb(${Math.max(0,r-a)},${Math.max(0,g-a)},${Math.max(0,b-a)})`;
}
function rgba(hex: string, alpha: number) {
  const [r, g, b] = hexRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─── Boxing Glove ─────────────────────────────────────────────────────────────
function Glove({ s, color, dark }: { s: number; color: string; dark: string }) {
  const gw = 18 * s, gh = 14 * s;
  return (
    <View style={{ width: gw, height: gh, position: "relative" }}>
      {/* Main body */}
      <View style={{
        width: gw, height: gh,
        borderRadius: gw * 0.38,
        backgroundColor: color,
        borderWidth: 1.5,
        borderColor: dark,
      }} />
      {/* Thumb ridge */}
      <View style={{
        position: "absolute", top: 2, left: 2,
        width: gw * 0.35, height: gh * 0.38,
        borderRadius: gw * 0.18,
        backgroundColor: lighten(color, 18),
        opacity: 0.6,
      }} />
      {/* Wrist wrap */}
      <View style={{
        position: "absolute", bottom: gh * 0.22,
        left: 0, right: 0, height: 2,
        backgroundColor: rgba(dark, 0.55),
      }} />
      {/* Knuckle shine */}
      <View style={{
        position: "absolute", top: gh * 0.14,
        left: gw * 0.18, right: gw * 0.18, height: gh * 0.22,
        borderRadius: gw * 0.12,
        backgroundColor: rgba("#ffffff", 0.22),
      }} />
    </View>
  );
}

// ─── Head with full face ───────────────────────────────────────────────────────
function FighterHead({
  s, skin, shadowSkin, hurt, mirrorX,
}: {
  s: number; skin: string; shadowSkin: string; hurt: boolean; mirrorX?: boolean;
}) {
  const w = 28 * s, h = 33 * s;
  const eyeY = h * 0.37;
  const eyeGap = w * 0.22;
  const eyeW = w * 0.16, eyeH = h * 0.13;

  return (
    <View style={{ width: w, height: h, position: "relative" }}>
      {/* Skull */}
      <View style={{
        width: w, height: h,
        borderRadius: w * 0.52,
        backgroundColor: hurt ? "#ffe8d6" : skin,
        borderWidth: 2,
        borderColor: shadowSkin,
        overflow: "hidden",
      }}>
        {/* Hair */}
        <View style={{
          position: "absolute", top: 0, left: 0, right: 0,
          height: h * 0.30,
          borderRadius: w * 0.5,
          backgroundColor: "#1c1c1c",
        }} />
        {/* Forehead highlight */}
        <View style={{
          position: "absolute", top: h * 0.28, left: w * 0.2, right: w * 0.2,
          height: h * 0.06,
          borderRadius: w * 0.2,
          backgroundColor: rgba("#ffffff", 0.12),
        }} />
        {/* Left eye */}
        <View style={{
          position: "absolute",
          top: eyeY, left: w * 0.5 - eyeGap - eyeW,
          width: eyeW, height: eyeH,
          borderRadius: eyeW * 0.5,
          backgroundColor: hurt ? "#cc3300" : "#2c1a0e",
        }} />
        {/* Right eye */}
        <View style={{
          position: "absolute",
          top: eyeY, left: w * 0.5 + eyeGap,
          width: eyeW, height: eyeH,
          borderRadius: eyeW * 0.5,
          backgroundColor: hurt ? "#cc3300" : "#2c1a0e",
        }} />
        {/* Eye whites */}
        <View style={{
          position: "absolute",
          top: eyeY + eyeH * 0.1,
          left: w * 0.5 - eyeGap - eyeW + eyeW * 0.55,
          width: eyeW * 0.35, height: eyeH * 0.5,
          borderRadius: eyeW * 0.2,
          backgroundColor: "#fff",
          opacity: 0.9,
        }} />
        <View style={{
          position: "absolute",
          top: eyeY + eyeH * 0.1,
          left: w * 0.5 + eyeGap + eyeW * 0.55,
          width: eyeW * 0.35, height: eyeH * 0.5,
          borderRadius: eyeW * 0.2,
          backgroundColor: "#fff",
          opacity: 0.9,
        }} />
        {/* Nose */}
        <View style={{
          position: "absolute",
          top: h * 0.52, left: w * 0.5 - w * 0.06,
          width: w * 0.12, height: h * 0.13,
          borderRadius: w * 0.06,
          backgroundColor: rgba(shadowSkin, 0.45),
        }} />
        {/* Mouth — grimace when hurt */}
        <View style={{
          position: "absolute",
          top: h * 0.70, left: w * 0.25, right: w * 0.25,
          height: h * 0.06,
          borderRadius: h * 0.03,
          backgroundColor: hurt ? rgba("#aa0000", 0.65) : rgba(shadowSkin, 0.4),
        }} />
        {/* Jaw shadow */}
        <View style={{
          position: "absolute", bottom: 0, left: w * 0.08, right: w * 0.08,
          height: h * 0.25,
          borderRadius: w * 0.3,
          backgroundColor: rgba(shadowSkin, 0.18),
        }} />
      </View>
      {/* Ear */}
      <View style={{
        position: "absolute",
        top: h * 0.43,
        left: mirrorX ? undefined : -w * 0.06,
        right: mirrorX ? -w * 0.06 : undefined,
        width: w * 0.14, height: h * 0.2,
        borderRadius: w * 0.07,
        backgroundColor: skin,
        borderWidth: 1.5,
        borderColor: shadowSkin,
      }} />
    </View>
  );
}

// ─── Main FighterView ─────────────────────────────────────────────────────────
export function FighterView({
  fighter,
  screenX,
  screenY,
  scale = 1,
  color,
  mirrorX,
  comboName,
}: Props) {
  const s = scale;

  // ── Colors ─────────────────────────────────────────────────────────────────
  const hurt = fighter.isHurt;
  const skin       = hurt ? "#ffe0cc" : "#d4956a";
  const shadowSkin = darken("#d4956a", 35);
  const outfit     = hurt ? lighten(color, 60) : color;
  const outfitDark = darken(color, 45);
  const shortsC    = hurt ? "#555" : "#12122a";
  const stripeC    = color;
  const gloveC     = hurt ? "#ff9999" : darken(color, 10);
  const gloveDark  = darken(color, 55);
  const shoeC      = "#111";

  // ── Dimensions ─────────────────────────────────────────────────────────────
  const HEAD_W  = 28 * s, HEAD_H  = 33 * s;
  const NECK_W  = 12 * s, NECK_H  = 10 * s;
  const SH_W    = 50 * s, SH_H    = 13 * s; // shoulder bar
  const TOR_W   = 42 * s, TOR_H   = 48 * s; // torso
  const BIC_W   = 16 * s, BIC_H   = 20 * s; // bicep
  const FOR_W   = 12 * s, FOR_H   = 18 * s; // forearm
  const HIP_W   = 38 * s, HIP_H   = 11 * s;
  const THI_W   = 18 * s, THI_H   = 26 * s; // thigh
  const SHN_W   = 13 * s, SHN_H   = 22 * s; // shin
  const FOOT_W  = 20 * s, FOOT_H  = 9  * s;
  const TOTAL_H = HEAD_H + NECK_H + TOR_H + HIP_H + THI_H + SHN_H + FOOT_H + 4 * s;

  // ── Animated values ─────────────────────────────────────────────────────────
  // Root
  const rootX     = useRef(new Animated.Value(0)).current;
  const rootY     = useRef(new Animated.Value(0)).current;
  const shakeX    = useRef(new Animated.Value(0)).current;
  const shakeY    = useRef(new Animated.Value(0)).current;
  const stumbleX  = useRef(new Animated.Value(0)).current;
  const fallRot   = useRef(new Animated.Value(0)).current;
  const globalScale = useRef(new Animated.Value(1)).current; // impact squash

  // Body
  const torsoRot  = useRef(new Animated.Value(0)).current;
  const torsoY    = useRef(new Animated.Value(0)).current;
  const crouchY   = useRef(new Animated.Value(0)).current; // squat

  // Head
  const headRot   = useRef(new Animated.Value(0)).current;
  const headY     = useRef(new Animated.Value(0)).current;

  // Right arm (lead / jab arm in orthodox)
  const rBicep    = useRef(new Animated.Value(-18)).current; // slightly forward guard
  const rFore     = useRef(new Animated.Value(12)).current;
  const rArmX     = useRef(new Animated.Value(0)).current;
  const rArmY     = useRef(new Animated.Value(0)).current;

  // Left arm (rear / power hand)
  const lBicep    = useRef(new Animated.Value(22)).current;  // tucked back guard
  const lFore     = useRef(new Animated.Value(-18)).current;
  const lArmX     = useRef(new Animated.Value(0)).current;
  const lArmY     = useRef(new Animated.Value(0)).current;

  // Legs
  const lThigh    = useRef(new Animated.Value(-10)).current; // stance splay
  const rThigh    = useRef(new Animated.Value(10)).current;
  const lShin     = useRef(new Animated.Value(6)).current;
  const rShin     = useRef(new Animated.Value(-6)).current;
  const lLegY     = useRef(new Animated.Value(0)).current;
  const rLegY     = useRef(new Animated.Value(0)).current;

  // ── Idle breath ─────────────────────────────────────────────────────────────
  const breath = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(breath, { toValue: -2.5, duration: 850, useNativeDriver: true }),
      Animated.timing(breath, { toValue: 0,    duration: 850, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  // ── Walk bob ─────────────────────────────────────────────────────────────────
  const walkBob = useRef(new Animated.Value(0)).current;
  const walkAnim = useRef<Animated.CompositeAnimation | null>(null);
  useEffect(() => {
    if (fighter.animState === "walk") {
      walkAnim.current = Animated.loop(Animated.sequence([
        Animated.timing(walkBob, { toValue: -4, duration: 170, useNativeDriver: true }),
        Animated.timing(walkBob, { toValue: 0,  duration: 170, useNativeDriver: true }),
      ]));
      walkAnim.current.start();
    } else {
      walkAnim.current?.stop();
      walkBob.setValue(0);
    }
  }, [fighter.animState]);

  // ── Guard reset ──────────────────────────────────────────────────────────────
  function resetGuard(delay = 0) {
    const cfg = { tension: 130, friction: 10, useNativeDriver: true };
    const run = () => Animated.parallel([
      Animated.spring(torsoRot, { toValue: 0,   ...cfg }),
      Animated.spring(torsoY,   { toValue: 0,   ...cfg }),
      Animated.spring(crouchY,  { toValue: 0,   ...cfg }),
      Animated.spring(headRot,  { toValue: 0,   ...cfg }),
      Animated.spring(headY,    { toValue: 0,   ...cfg }),
      Animated.spring(rBicep,   { toValue: -18, ...cfg }),
      Animated.spring(rFore,    { toValue: 12,  ...cfg }),
      Animated.spring(rArmX,    { toValue: 0,   ...cfg }),
      Animated.spring(rArmY,    { toValue: 0,   ...cfg }),
      Animated.spring(lBicep,   { toValue: 22,  ...cfg }),
      Animated.spring(lFore,    { toValue: -18, ...cfg }),
      Animated.spring(lArmX,    { toValue: 0,   ...cfg }),
      Animated.spring(lArmY,    { toValue: 0,   ...cfg }),
      Animated.spring(lThigh,   { toValue: -10, ...cfg }),
      Animated.spring(rThigh,   { toValue: 10,  ...cfg }),
      Animated.spring(lShin,    { toValue: 6,   ...cfg }),
      Animated.spring(rShin,    { toValue: -6,  ...cfg }),
      Animated.spring(lLegY,    { toValue: 0,   ...cfg }),
      Animated.spring(rLegY,    { toValue: 0,   ...cfg }),
      Animated.spring(rootX,    { toValue: 0,   ...cfg }),
      Animated.spring(rootY,    { toValue: 0,   ...cfg }),
    ]).start();
    if (delay > 0) setTimeout(run, delay); else run();
  }

  // Helper: spring to value
  function sp(val: Animated.Value, toValue: number, tension = 400, friction = 8) {
    return Animated.spring(val, { toValue, tension, friction, useNativeDriver: true });
  }
  function tm(val: Animated.Value, toValue: number, duration: number) {
    return Animated.timing(val, { toValue, duration, useNativeDriver: true });
  }

  // ── ATTACK ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!fighter.isAttacking) return;
    const dir = mirrorX ? 1 : -1; // rotational direction (facing left = negative angles fwd)
    const fwd = mirrorX ? -1 : 1; // linear forward direction on screen
    const cn = (comboName ?? "").toLowerCase();

    // ══ KICKS ══════════════════════════════════════════════════════════════════
    if (fighter.isKicking) {

      // ── FLYING / JUMP KICK (High-risk: visible wind-up, big payoff) ─────────
      if (cn.includes("jump") || cn.includes("flying")) {
        Animated.sequence([
          // Wind-up crouch — TELEGRAPHS the move (common sense: flashy = readable)
          Animated.parallel([
            tm(crouchY, 14, 110),
            tm(lThigh,  -28, 110),
            tm(rThigh,   28, 110),
            tm(rBicep, dir * 38, 110),
            tm(lBicep, dir * -38, 110),
          ]),
          // Launch — full body extension
          Animated.parallel([
            tm(rootY,  -42, 180),
            tm(crouchY, 0,  180),
            tm(rThigh, dir * -108, 160),
            tm(rShin,  dir *  32,  160),
            tm(lThigh, dir *  40,  160),
            tm(rBicep, dir *  60,  155),
            tm(lBicep, dir * -60,  155),
            tm(torsoRot, dir * -15, 160),
          ]),
          // Hold airborne pose briefly
          tm(rootY, -38, 80),
          // Land + squash (physics: impact absorption)
          Animated.parallel([
            sp(rootY, 0, 75, 5),
            Animated.sequence([
              tm(globalScale, 0.68, 65),
              sp(globalScale, 1, 280, 8),
            ]),
            sp(rThigh, 10, 100, 8),
            sp(rShin, -6, 100, 8),
            sp(lThigh, -10, 100, 8),
          ]),
        ]).start(() => resetGuard());
      }

      // ── SPINNING HEEL KICK (High-risk: long wind-up, body rotates 180°) ─────
      else if (cn.includes("spinning")) {
        Animated.sequence([
          // Pivot prep — compress sideways (telegraphed!)
          Animated.parallel([
            tm(torsoRot, dir * -55, 130),
            tm(rootY,    -8,        130),
            tm(lBicep,   dir * -65, 120),
            tm(rBicep,   dir *  50, 120),
          ]),
          // Spin + heel drives through
          Animated.parallel([
            tm(torsoRot, dir * 40,   190),
            tm(rThigh,   dir * -112, 175),
            tm(rShin,    dir *  28,  175),
            tm(lBicep,   dir * -75,  170),
            tm(rBicep,   dir *  45,  170),
          ]),
          // Recover — momentum carries through
          Animated.parallel([
            sp(torsoRot, 0,  80, 8),
            sp(rThigh,  10,  90, 8),
            sp(rShin,   -6,  90, 8),
          ]),
        ]).start(() => resetGuard());
      }

      // ── TRIPLE KICK (Rapid alternating, each with micro wind-up) ────────────
      else if (cn.includes("triple")) {
        Animated.sequence([
          // Kick 1 — right leg snap
          Animated.parallel([
            tm(rThigh, dir * -82, 90),
            tm(rShin,  dir *  22, 90),
            tm(torsoRot, dir * -14, 80),
          ]),
          Animated.parallel([
            sp(rThigh, 10, 180, 9),
            sp(rShin, -6, 180, 9),
          ]),
          // Kick 2 — left leg roundhouse
          Animated.parallel([
            tm(lThigh, dir * 82,  90),
            tm(lShin,  dir * -22, 90),
            tm(torsoRot, dir * 14, 80),
          ]),
          Animated.parallel([
            sp(lThigh, -10, 180, 9),
            sp(lShin,    6, 180, 9),
          ]),
          // Kick 3 — spinning back kick finish (slower = feels heavier)
          Animated.parallel([
            tm(rThigh,   dir * -100, 105),
            tm(torsoRot, dir *  -28, 105),
            tm(rShin,    dir *   26, 105),
          ]),
        ]).start(() => resetGuard());
      }

      // ── DOUBLE KICK / DOUBLE KNEE ─────────────────────────────────────────────
      else if (cn.includes("double")) {
        Animated.sequence([
          Animated.parallel([
            tm(rThigh, dir * -82, 95),
            tm(rShin,  dir *  20, 95),
            tm(torsoRot, dir * -12, 85),
          ]),
          Animated.parallel([
            sp(rThigh, 10, 180, 9),
            sp(rShin,  -6, 180, 9),
            sp(torsoRot, 0, 120, 9),
          ]),
          Animated.parallel([
            tm(lThigh, dir * 82,  95),
            tm(lShin,  dir * -20, 95),
            tm(torsoRot, dir * 12, 85),
          ]),
        ]).start(() => resetGuard());
      }

      // ── ROUNDHOUSE ────────────────────────────────────────────────────────────
      else if (cn.includes("roundhouse")) {
        Animated.parallel([
          Animated.sequence([
            tm(torsoRot, dir * -22, 85),
            tm(lThigh,   dir *  95, 150),
            tm(lShin,    dir * -28, 150),
            sp(torsoRot, 0, 90, 8),
            sp(lThigh,  -10, 90, 8),
            sp(lShin,     6, 90, 8),
          ]),
          Animated.sequence([
            tm(rBicep, dir * 48, 85),
            sp(rBicep, -18, 110, 9),
          ]),
        ]).start();
      }

      // ── KNEE STRIKE ───────────────────────────────────────────────────────────
      else if (cn.includes("knee")) {
        Animated.parallel([
          Animated.sequence([
            tm(rootY,  -12, 85),
            sp(rootY,    0, 100, 7),
          ]),
          Animated.sequence([
            tm(rThigh, dir * -90, 100),
            tm(rShin,  dir *  18, 100),
            sp(rThigh, 10, 110, 8),
            sp(rShin,  -6, 110, 8),
          ]),
          Animated.sequence([
            tm(lBicep, dir * -55, 95),
            tm(rBicep, dir *  55, 95),
            sp(lBicep, 22, 110, 9),
            sp(rBicep,-18, 110, 9),
          ]),
        ]).start();
      }

      // ── LOW KICK / FOOT SWEEP / LEG TRIP / DRAGON SWEEP ─────────────────────
      else if (
        cn.includes("low kick") || cn.includes("sweep") ||
        cn.includes("foot") || cn.includes("leg trip") || cn.includes("dragon")
      ) {
        Animated.parallel([
          Animated.sequence([
            tm(lThigh, dir * 52, 100),
            tm(lShin,  dir * -14, 100),
            sp(lThigh, -10, 120, 9),
            sp(lShin,    6, 120, 9),
          ]),
          Animated.sequence([
            tm(torsoRot, dir * -12, 95),
            sp(torsoRot, 0, 110, 9),
          ]),
          Animated.sequence([
            tm(crouchY, 8, 80),
            sp(crouchY, 0, 110, 8),
          ]),
        ]).start();
      }

      // ── DEFAULT FRONT KICK / TEEP / REDIRECT KICK ────────────────────────────
      else {
        Animated.parallel([
          Animated.sequence([
            tm(rThigh, dir * -80, 95),
            tm(rShin,  dir *  24, 95),
            sp(rThigh, 10, 110, 8),
            sp(rShin,  -6, 110, 8),
          ]),
          Animated.sequence([
            tm(torsoRot, dir * -15, 100),
            sp(torsoRot, 0, 110, 9),
          ]),
          Animated.sequence([
            tm(rBicep, dir * 44, 90),
            sp(rBicep, -18, 110, 9),
          ]),
        ]).start();
      }

    // ══ HOOK ════════════════════════════════════════════════════════════════════
    } else if (fighter.attackType === "hook") {
      // Left hook — hip drives first (common sense: power from rotation, not arm)
      Animated.parallel([
        Animated.sequence([
          tm(torsoRot, dir * -24, 78),  // hip load
          tm(torsoRot, dir *  20, 105), // hip explosion
          sp(torsoRot, 0, 90, 8),
        ]),
        Animated.sequence([
          tm(lBicep, dir * -75, 85),
          tm(lFore,  dir *  22, 85),
          sp(lBicep, 22, 110, 9),
          sp(lFore, -18, 110, 9),
        ]),
        Animated.sequence([
          tm(lArmX, dir * -22, 78),
          tm(lArmX, dir *  16, 100),
          sp(lArmX, 0, 120, 9),
        ]),
        Animated.sequence([
          tm(lArmY, -14, 80),
          sp(lArmY, 0, 110, 9),
        ]),
        Animated.sequence([
          tm(torsoY, -6, 80),
          sp(torsoY, 0, 100, 9),
        ]),
        Animated.sequence([
          tm(headRot, dir * -10, 78),
          sp(headRot, 0, 100, 9),
        ]),
      ]).start();

    // ══ PUNCHES ════════════════════════════════════════════════════════════════
    } else {

      // ── UPPERCUT ──────────────────────────────────────────────────────────────
      if (cn.includes("uppercut") || cn.includes("cross-uppercut")) {
        Animated.parallel([
          Animated.sequence([
            tm(crouchY, 10, 65),  // dip
            tm(crouchY, -14, 95), // drive up
            sp(crouchY, 0, 110, 8),
          ]),
          Animated.sequence([
            tm(rArmY, 10, 65),
            tm(rArmY, -28, 95),
            sp(rArmY, 0, 150, 8),
          ]),
          Animated.sequence([
            sp(rBicep, dir * -65, 650, 7),
            sp(rFore,  dir * -35, 550, 7),
            sp(rBicep, -18, 130, 9),
            sp(rFore,   12, 130, 9),
          ]),
          Animated.sequence([
            tm(torsoRot, dir * -14, 80),
            sp(torsoRot, 0, 100, 8),
          ]),
          Animated.sequence([
            tm(headRot, dir * -8, 70),
            sp(headRot, 0, 90, 9),
          ]),
        ]).start();
      }

      // ── ELBOW / SPINNING ELBOW ────────────────────────────────────────────────
      else if (cn.includes("elbow")) {
        const isSpin = cn.includes("spinning");
        Animated.parallel([
          Animated.sequence([
            isSpin ? tm(torsoRot, dir * -50, 125) : tm(torsoRot, dir * -28, 72),
            tm(torsoRot, dir * 22, isSpin ? 190 : 90),
            sp(torsoRot, 0, 85, 8),
          ]),
          Animated.sequence([
            sp(lBicep, dir * -100, isSpin ? 500 : 600, 7),
            tm(lArmX, dir * -20, isSpin ? 130 : 68),
            sp(lBicep, 22, 120, 9),
            sp(lArmX, 0, 130, 9),
          ]),
          Animated.sequence([
            tm(torsoY, -8, 80),
            sp(torsoY, 0, 100, 8),
          ]),
          Animated.sequence([
            tm(headRot, dir * -12, 80),
            sp(headRot, 0, 90, 9),
          ]),
        ]).start();
      }

      // ── GRAPPLING (Grab, Takedown, Throw, Submission, Sweep, Ippon, Hip/Shoulder Throw) ──
      else if (
        cn.includes("grab") || cn.includes("takedown") || cn.includes("throw") ||
        cn.includes("hold") || cn.includes("submission") || cn.includes("ippon") ||
        cn.includes("nage") || cn.includes("hip") || cn.includes("shoulder") ||
        cn.includes("kote") || cn.includes("collar") || cn.includes("grip") ||
        cn.includes("harmony") || cn.includes("energy") || cn.includes("redirect") ||
        cn.includes("sweep")
      ) {
        Animated.sequence([
          // Step in (weight shift forward)
          Animated.parallel([
            tm(rootX,    fwd * 24,  110),
            tm(crouchY,  10,        90),
            tm(torsoRot, dir * -18, 90),
            tm(rBicep,   dir * -42, 85),
            tm(lBicep,   dir * -42, 85),
          ]),
          // Execute throw — body rotates, opponent goes over hip/shoulder
          Animated.parallel([
            tm(torsoRot, dir * 38,  140),
            sp(rootX,    0,  55,  5),
            sp(crouchY,  0, 200,  8),
            sp(rBicep, -18, 100,  8),
            sp(lBicep,  22, 100,  8),
          ]),
          // Impact squash
          Animated.sequence([
            tm(globalScale, 0.82, 80),
            sp(globalScale, 1, 220, 8),
          ]),
        ]).start(() => resetGuard());
      }

      // ── 3-HIT MEGA COMBOS (Jab → Cross → Power hook) ─────────────────────────
      else if (
        cn.includes("triple jab") || cn.includes("jab-cross") ||
        cn.includes("five animal") || cn.includes("submission hold") ||
        cn.includes("1-2") || cn.includes("double palm") ||
        cn.includes("kote-gaeshi") || cn.includes("praying mantis")
      ) {
        Animated.sequence([
          // HIT 1: Jab (right/lead arm)
          Animated.parallel([
            tm(rArmX, dir * -30, 62),
            sp(rBicep, dir * -38, 600, 7),
            sp(rFore,  dir *  18, 500, 7),
          ]),
          Animated.parallel([
            sp(rArmX,  0,   320, 9),
            sp(rBicep, -18, 130, 9),
            sp(rFore,   12, 130, 9),
          ]),
          // HIT 2: Cross (left/rear arm, hip rotates)
          Animated.parallel([
            tm(lArmX,    dir * -28, 60),
            tm(torsoRot, dir * -16, 60),
            sp(lBicep,   dir * -48, 500, 7),
            sp(lFore,    dir *  16, 420, 7),
          ]),
          Animated.parallel([
            sp(lArmX,    0,   280, 9),
            sp(lBicep,   22,  130, 9),
            sp(lFore,   -18,  130, 9),
            sp(torsoRot, 0,   100, 9),
          ]),
          // HIT 3: Power hook (biggest rotation, most impact)
          Animated.parallel([
            tm(lArmX,    dir * -38, 56),
            tm(lArmY,    -15,       56),
            tm(torsoRot, dir *  24, 100),
            sp(lBicep,   dir * -80, 480, 6),
            sp(lFore,    dir *  26, 400, 6),
          ]),
          Animated.parallel([
            sp(lArmX,    0,   130, 9),
            sp(lArmY,    0,   130, 9),
            sp(torsoRot, 0,    90, 8),
            sp(lBicep,  22,   130, 9),
            sp(lFore,  -18,   130, 9),
          ]),
        ]).start();
      }

      // ── DOUBLE JAB / 1-2 COMBO / COLLAR TIE / DOUBLE GRIP / DOUBLE PALM ─────
      else if (
        cn.includes("double jab") || cn.includes("1-2") ||
        cn.includes("collar tie") || cn.includes("double grip") ||
        cn.includes("double palm") || cn.includes("praying mantis")
      ) {
        Animated.sequence([
          // Jab 1
          Animated.parallel([
            tm(rArmX, dir * -28, 62),
            sp(rBicep, dir * -35, 560, 7),
          ]),
          Animated.parallel([
            sp(rArmX,  0,   300, 9),
            sp(rBicep, -18, 130, 9),
          ]),
          // Jab 2 / Cross
          Animated.parallel([
            tm(lArmX,    dir * -26, 60),
            tm(torsoRot, dir * -13, 58),
            sp(lBicep,   dir * -40, 500, 7),
          ]),
          Animated.parallel([
            sp(lArmX,    0,   280, 9),
            sp(lBicep,   22,  130, 9),
            sp(torsoRot, 0,   110, 9),
          ]),
        ]).start();
      }

      // ── PALM STRIKE / CRANE / TIGER / LEOPARD ────────────────────────────────
      else if (
        cn.includes("palm") || cn.includes("crane") ||
        cn.includes("tiger") || cn.includes("leopard") || cn.includes("mantis")
      ) {
        Animated.parallel([
          Animated.sequence([
            tm(rArmX,  dir * -34, 68),
            tm(rArmY,  -12,       68),
            sp(rArmX,  0, 270, 9),
            sp(rArmY,  0, 270, 9),
          ]),
          Animated.sequence([
            sp(rBicep, dir * -44, 580, 7),
            sp(rFore,  dir * -22, 500, 7),
            sp(rBicep, -18, 130, 9),
            sp(rFore,   12, 130, 9),
          ]),
          Animated.sequence([
            tm(torsoRot, dir * -11, 68),
            sp(torsoRot, 0, 110, 9),
          ]),
          Animated.sequence([
            tm(headRot, dir * -6, 65),
            sp(headRot, 0, 90, 9),
          ]),
        ]).start();
      }

      // ── TEEP / GRAB (single-input punch-coded grapple) ────────────────────────
      else if (cn.includes("teep") || cn.includes("body hook")) {
        Animated.parallel([
          Animated.sequence([
            tm(rThigh,   dir * -55, 90),
            tm(rShin,    dir *  18, 90),
            tm(torsoRot, dir * -12, 80),
            sp(rThigh,   10, 110, 8),
            sp(rShin,    -6, 110, 8),
            sp(torsoRot, 0,  110, 9),
          ]),
        ]).start();
      }

      // ── DEFAULT JAB ───────────────────────────────────────────────────────────
      else {
        Animated.parallel([
          Animated.sequence([
            tm(rArmX,  dir * -34, 72),
            sp(rArmX,  0, 280, 9),
          ]),
          Animated.sequence([
            sp(rBicep, dir * -40, 580, 7),
            sp(rFore,  dir *  18, 500, 7),
            sp(rBicep, -18, 130, 9),
            sp(rFore,   12, 130, 9),
          ]),
          Animated.sequence([
            tm(torsoY, -5, 68),
            sp(torsoY, 0, 100, 9),
          ]),
          Animated.sequence([
            tm(torsoRot, dir * -9, 68),
            sp(torsoRot, 0, 100, 9),
          ]),
        ]).start();
      }
    }
  }, [fighter.isAttacking, fighter.isKicking, fighter.attackType, comboName]);

  // ── HURT ──────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!fighter.isHurt) return;
    const dir = mirrorX ? 1 : -1;
    Animated.parallel([
      Animated.sequence([
        tm(shakeX,    dir * 18,  48),
        tm(shakeX,    dir * -14, 48),
        sp(shakeX,    0, 230, 6),
      ]),
      Animated.sequence([
        tm(shakeY,    -11, 58),
        sp(shakeY,    0, 140, 6),
      ]),
      Animated.sequence([
        tm(globalScale, 0.80, 58),
        sp(globalScale, 1, 300, 9),
      ]),
      Animated.sequence([
        tm(headRot,   dir * -28, 58),
        sp(headRot,   0, 180, 6),
      ]),
      Animated.sequence([
        tm(torsoRot,  dir * -20, 60),
        sp(torsoRot,  0, 140, 7),
      ]),
      // Arms flung wide on impact (physics: hit reaction)
      sp(lBicep, dir * -95, 65, 5),
      sp(rBicep, dir *  95, 65, 5),
    ]).start(() => resetGuard(80));
  }, [fighter.isHurt]);

  // ── WHIFF stumble ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!fighter.isWhiffed) return;
    const fwd = mirrorX ? -1 : 1;
    // Lurch forward — lost balance because attack found no target
    Animated.sequence([
      Animated.parallel([
        tm(stumbleX, fwd * 28,  220),
        tm(torsoRot, fwd * 34,  210),
        tm(crouchY,  12,        200),
      ]),
      Animated.parallel([
        sp(stumbleX, 0, 55, 6),
        sp(torsoRot, 0, 60, 7),
        sp(crouchY,  0, 70, 7),
      ]),
    ]).start();
  }, [fighter.isWhiffed]);

  // ── KO FALL — ragdoll ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!fighter.isFallen) return;
    const dir = mirrorX ? -1 : 1;
    Animated.parallel([
      sp(fallRot,  dir * 90, 20, 5),
      sp(rootY,    42,       16, 5),
      sp(lBicep,  -140,      16, 4),
      sp(rBicep,   140,      16, 4),
      sp(lFore,   -50,       16, 4),
      sp(rFore,    50,       16, 4),
      sp(lThigh,   55,       16, 4),
      sp(rThigh,  -45,       16, 4),
      sp(lShin,   -35,       16, 4),
      sp(rShin,    35,       16, 4),
    ]).start();
  }, [fighter.isFallen]);

  // ── Interpolations ────────────────────────────────────────────────────────────
  const rot = (v: Animated.Value, lo: number, hi: number) =>
    v.interpolate({ inputRange: [lo, hi], outputRange: [`${lo}deg`, `${hi}deg`] });

  const fallDeg  = rot(fallRot,  -90,  90);
  const torsoDeg = rot(torsoRot, -65,  65);
  const headDeg  = rot(headRot,  -50,  50);
  const rBicepD  = rot(rBicep,  -160, 160);
  const rForeD   = rot(rFore,    -60,  60);
  const lBicepD  = rot(lBicep,  -160, 160);
  const lForeD   = rot(lFore,    -60,  60);
  const lThighD  = rot(lThigh,  -130, 130);
  const rThighD  = rot(rThigh,  -130, 130);
  const lShinD   = rot(lShin,    -60,  60);
  const rShinD   = rot(rShin,    -60,  60);

  const idleY = fighter.isFallen
    ? new Animated.Value(0)
    : fighter.animState === "walk"
    ? walkBob
    : breath;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <Animated.View
      style={{
        position: "absolute",
        left: screenX - SH_W / 2,
        top:  screenY - TOTAL_H,
        transform: [
          { translateX: shakeX },
          { translateX: stumbleX },
          { translateX: rootX },
          { translateY: shakeY },
          { translateY: rootY },
          { translateY: idleY },
          { scaleX: mirrorX ? -1 : 1 },
          { scale: globalScale },
          { rotate: fallDeg },
        ],
      }}
    >
      {/* ── TORSO WRAPPER ─────────────────────────────────────────────────────── */}
      <Animated.View style={{
        transform: [{ translateY: torsoY }, { translateY: crouchY }, { rotate: torsoDeg }],
        alignItems: "center",
      }}>

        {/* ── HEAD ─────────────────────────────────────────────────────────────── */}
        <Animated.View style={{ transform: [{ translateY: headY }, { rotate: headDeg }] }}>
          <FighterHead s={s} skin={skin} shadowSkin={shadowSkin} hurt={hurt} mirrorX={mirrorX} />
        </Animated.View>

        {/* ── NECK ─────────────────────────────────────────────────────────────── */}
        <View style={{
          width: NECK_W, height: NECK_H,
          backgroundColor: skin,
          borderRadius: NECK_W / 2,
          borderLeftWidth: 1, borderRightWidth: 1,
          borderColor: rgba(shadowSkin, 0.3),
          marginTop: -2,
        }} />

        {/* ── SHOULDERS + ARMS + TORSO ROW ─────────────────────────────────────── */}
        <View style={{ flexDirection: "row", alignItems: "flex-start", marginTop: -4 }}>

          {/* LEFT ARM ─────────────────────────────────────────────────────────── */}
          <Animated.View style={{
            alignItems: "center",
            transform: [{ translateX: lArmX }, { translateY: lArmY }, { rotate: lBicepD }],
          }}>
            {/* Shoulder cap */}
            <View style={{
              width: BIC_W + 4, height: BIC_W + 4,
              borderRadius: (BIC_W + 4) / 2,
              backgroundColor: outfit,
              borderWidth: 2, borderColor: outfitDark,
              marginBottom: -4,
            }} />
            {/* Bicep */}
            <View style={{
              width: BIC_W, height: BIC_H,
              borderRadius: BIC_W / 2,
              backgroundColor: outfit,
              borderWidth: 1.5, borderColor: outfitDark,
            }} />
            {/* Elbow joint */}
            <View style={{
              width: BIC_W * 0.82, height: BIC_W * 0.82,
              borderRadius: BIC_W * 0.41,
              backgroundColor: skin,
              borderWidth: 1, borderColor: rgba(shadowSkin, 0.35),
              marginTop: -4,
            }} />
            {/* Forearm */}
            <Animated.View style={{ alignItems: "center", transform: [{ rotate: lForeD }] }}>
              <View style={{
                width: FOR_W, height: FOR_H,
                borderRadius: FOR_W / 2,
                backgroundColor: skin,
                borderWidth: 1, borderColor: rgba(shadowSkin, 0.3),
                marginTop: -3,
              }} />
              <View style={{ marginTop: -2 }}>
                <Glove s={s} color={gloveC} dark={gloveDark} />
              </View>
            </Animated.View>
          </Animated.View>

          {/* TORSO ────────────────────────────────────────────────────────────── */}
          <View style={{ alignItems: "center" }}>
            {/* Upper chest */}
            <View style={{
              width: TOR_W, height: TOR_H * 0.44,
              borderRadius: TOR_W * 0.12,
              backgroundColor: outfit,
              borderWidth: 2, borderColor: outfitDark,
              overflow: "hidden",
            }}>
              {/* Chest highlight */}
              <View style={{
                position: "absolute", top: 7, left: 8, right: 8,
                height: TOR_H * 0.18,
                borderRadius: TOR_W * 0.1,
                backgroundColor: rgba("#ffffff", 0.14),
              }} />
              {/* Chest muscles division line */}
              <View style={{
                position: "absolute", top: 0, bottom: 0,
                left: TOR_W / 2 - 1, width: 2,
                backgroundColor: rgba(outfitDark, 0.38),
              }} />
            </View>
            {/* Lower torso / abs */}
            <View style={{
              width: TOR_W * 0.86, height: TOR_H * 0.40,
              borderRadius: TOR_W * 0.10,
              backgroundColor: lighten(color, 8),
              borderWidth: 1.5, borderColor: outfitDark,
              marginTop: 2, overflow: "hidden",
            }}>
              {/* Ab lines */}
              {[0.28, 0.56, 0.82].map((t, i) => (
                <View key={i} style={{
                  position: "absolute",
                  top: TOR_H * 0.40 * t,
                  left: 8, right: 8, height: 1.5,
                  backgroundColor: rgba(outfitDark, 0.28),
                }} />
              ))}
              {/* Vertical ab divide */}
              <View style={{
                position: "absolute", top: 0, bottom: 0,
                left: TOR_W * 0.86 / 2 - 1, width: 1.5,
                backgroundColor: rgba(outfitDark, 0.22),
              }} />
            </View>
          </View>

          {/* RIGHT ARM ────────────────────────────────────────────────────────── */}
          <Animated.View style={{
            alignItems: "center",
            transform: [{ translateX: rArmX }, { translateY: rArmY }, { rotate: rBicepD }],
          }}>
            <View style={{
              width: BIC_W + 4, height: BIC_W + 4,
              borderRadius: (BIC_W + 4) / 2,
              backgroundColor: outfit,
              borderWidth: 2, borderColor: outfitDark,
              marginBottom: -4,
            }} />
            <View style={{
              width: BIC_W, height: BIC_H,
              borderRadius: BIC_W / 2,
              backgroundColor: outfit,
              borderWidth: 1.5, borderColor: outfitDark,
            }} />
            <View style={{
              width: BIC_W * 0.82, height: BIC_W * 0.82,
              borderRadius: BIC_W * 0.41,
              backgroundColor: skin,
              borderWidth: 1, borderColor: rgba(shadowSkin, 0.35),
              marginTop: -4,
            }} />
            <Animated.View style={{ alignItems: "center", transform: [{ rotate: rForeD }] }}>
              <View style={{
                width: FOR_W, height: FOR_H,
                borderRadius: FOR_W / 2,
                backgroundColor: skin,
                borderWidth: 1, borderColor: rgba(shadowSkin, 0.3),
                marginTop: -3,
              }} />
              <View style={{ marginTop: -2 }}>
                <Glove s={s} color={gloveC} dark={gloveDark} />
              </View>
            </Animated.View>
          </Animated.View>

        </View>{/* end arms+torso */}

        {/* ── BELT ──────────────────────────────────────────────────────────────── */}
        <View style={{
          width: TOR_W * 0.92, height: 9 * s,
          backgroundColor: "#0a0a1e",
          borderRadius: 4 * s,
          borderWidth: 1.5, borderColor: "#2a2a3e",
          alignSelf: "center", marginTop: 2,
          overflow: "hidden",
        }}>
          {/* Fighter-color stripe */}
          <View style={{
            position: "absolute", top: 2, bottom: 2,
            left: 7 * s, width: 16 * s,
            borderRadius: 2 * s,
            backgroundColor: rgba(color, 0.72),
          }} />
          {/* Belt buckle */}
          <View style={{
            position: "absolute",
            top: 1.5, bottom: 1.5,
            left: TOR_W * 0.92 / 2 - 7 * s,
            width: 14 * s,
            borderRadius: 3 * s,
            backgroundColor: "#c0a830",
            borderWidth: 1,
            borderColor: "#a08820",
          }} />
        </View>

        {/* ── HIPS ──────────────────────────────────────────────────────────────── */}
        <View style={{
          width: HIP_W, height: HIP_H,
          backgroundColor: shortsC,
          borderRadius: 4 * s,
          alignSelf: "center", marginTop: 1,
        }} />

        {/* ── LEGS ──────────────────────────────────────────────────────────────── */}
        <View style={{ flexDirection: "row", gap: 4 * s, alignSelf: "center", marginTop: 1 }}>

          {/* LEFT LEG */}
          <Animated.View style={{ alignItems: "center", transform: [{ translateY: lLegY }, { rotate: lThighD }] }}>
            {/* Shorts / thigh */}
            <View style={{
              width: THI_W, height: THI_H * 0.68,
              borderRadius: THI_W / 2,
              backgroundColor: shortsC,
              borderWidth: 1, borderColor: "#222",
              overflow: "hidden",
            }}>
              <View style={{
                position: "absolute", left: 3 * s, top: 0, bottom: 0,
                width: 3 * s, backgroundColor: rgba(stripeC, 0.65),
              }} />
            </View>
            {/* Knee cap */}
            <View style={{
              width: THI_W * 0.84, height: THI_W * 0.84,
              borderRadius: THI_W * 0.42,
              backgroundColor: skin,
              borderWidth: 1, borderColor: rgba(shadowSkin, 0.3),
              marginTop: -4,
            }} />
            {/* Shin */}
            <Animated.View style={{ alignItems: "center", transform: [{ rotate: lShinD }] }}>
              <View style={{
                width: SHN_W, height: SHN_H,
                borderRadius: SHN_W / 2,
                backgroundColor: skin,
                borderWidth: 1, borderColor: rgba(shadowSkin, 0.25),
                marginTop: -3,
              }} />
              {/* Foot / shoe */}
              <View style={{
                width: FOOT_W, height: FOOT_H,
                borderRadius: FOOT_H * 0.45,
                backgroundColor: shoeC,
                marginTop: -3,
                marginLeft: mirrorX ? -FOOT_W * 0.22 : FOOT_W * 0.22,
                borderWidth: 1, borderColor: "#2a2a2a",
                overflow: "hidden",
              }}>
                <View style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  height: 3, backgroundColor: "#555", borderRadius: 2,
                }} />
                <View style={{
                  position: "absolute", top: 2, left: 3, right: FOOT_W * 0.3,
                  height: FOOT_H * 0.35, borderRadius: 2,
                  backgroundColor: rgba("#ffffff", 0.08),
                }} />
              </View>
            </Animated.View>
          </Animated.View>

          {/* RIGHT LEG */}
          <Animated.View style={{ alignItems: "center", transform: [{ translateY: rLegY }, { rotate: rThighD }] }}>
            <View style={{
              width: THI_W, height: THI_H * 0.68,
              borderRadius: THI_W / 2,
              backgroundColor: shortsC,
              borderWidth: 1, borderColor: "#222",
              overflow: "hidden",
            }}>
              <View style={{
                position: "absolute", left: 3 * s, top: 0, bottom: 0,
                width: 3 * s, backgroundColor: rgba(stripeC, 0.65),
              }} />
            </View>
            <View style={{
              width: THI_W * 0.84, height: THI_W * 0.84,
              borderRadius: THI_W * 0.42,
              backgroundColor: skin,
              borderWidth: 1, borderColor: rgba(shadowSkin, 0.3),
              marginTop: -4,
            }} />
            <Animated.View style={{ alignItems: "center", transform: [{ rotate: rShinD }] }}>
              <View style={{
                width: SHN_W, height: SHN_H,
                borderRadius: SHN_W / 2,
                backgroundColor: skin,
                borderWidth: 1, borderColor: rgba(shadowSkin, 0.25),
                marginTop: -3,
              }} />
              <View style={{
                width: FOOT_W, height: FOOT_H,
                borderRadius: FOOT_H * 0.45,
                backgroundColor: shoeC,
                marginTop: -3,
                marginLeft: mirrorX ? -FOOT_W * 0.22 : FOOT_W * 0.22,
                borderWidth: 1, borderColor: "#2a2a2a",
                overflow: "hidden",
              }}>
                <View style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  height: 3, backgroundColor: "#555", borderRadius: 2,
                }} />
                <View style={{
                  position: "absolute", top: 2, left: 3, right: FOOT_W * 0.3,
                  height: FOOT_H * 0.35, borderRadius: 2,
                  backgroundColor: rgba("#ffffff", 0.08),
                }} />
              </View>
            </Animated.View>
          </Animated.View>

        </View>{/* end legs */}
      </Animated.View>
    </Animated.View>
  );
}
