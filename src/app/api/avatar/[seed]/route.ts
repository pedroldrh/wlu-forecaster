import { NextRequest, NextResponse } from "next/server";

const PALETTES = [
  { h: 210, s: 80, name: "sky" },       // Blue sky (like the reference image)
  { h: 220, s: 75, name: "ocean" },     // Deep blue
  { h: 195, s: 70, name: "arctic" },    // Ice blue
  { h: 260, s: 60, name: "lavender" },  // Lavender
  { h: 290, s: 55, name: "iris" },      // Violet
  { h: 330, s: 60, name: "rose" },      // Rose
  { h: 350, s: 65, name: "coral" },     // Coral
  { h: 25, s: 70, name: "sunset" },     // Warm sunset
  { h: 40, s: 65, name: "amber" },      // Amber
  { h: 160, s: 55, name: "sage" },      // Sage green
  { h: 175, s: 60, name: "teal" },      // Teal
  { h: 145, s: 50, name: "mint" },      // Mint
];

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// Simple seeded random
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateSvg(seed: string): string {
  const hash = hashCode(seed);
  const palette = PALETTES[hash % PALETTES.length];
  const rand = seededRandom(hash);
  const h = palette.h;
  const s = palette.s;

  // Generate 4-6 blurred circles for the watercolor effect
  const numCircles = 4 + Math.floor(rand() * 3);
  let circles = "";

  for (let i = 0; i < numCircles; i++) {
    const cx = 20 + rand() * 160;
    const cy = 20 + rand() * 160;
    const r = 30 + rand() * 60;
    const opacity = 0.25 + rand() * 0.4;
    // Vary hue slightly for each circle
    const circleH = h + (rand() - 0.5) * 30;
    const circleS = s + (rand() - 0.5) * 20;
    const circleL = 40 + rand() * 30;
    circles += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="hsl(${circleH.toFixed(0)}, ${circleS.toFixed(0)}%, ${circleL.toFixed(0)}%)" opacity="${opacity.toFixed(2)}"/>`;
  }

  // Add a couple of light/white circles for the bright cloud areas
  for (let i = 0; i < 2; i++) {
    const cx = 40 + rand() * 120;
    const cy = 20 + rand() * 100;
    const r = 25 + rand() * 50;
    const opacity = 0.3 + rand() * 0.35;
    circles += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="hsl(${h}, 20%, 95%)" opacity="${opacity.toFixed(2)}"/>`;
  }

  // Gradient center position (slightly off-center for natural look)
  const gx = 25 + rand() * 30;
  const gy = 20 + rand() * 30;

  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="c"><circle cx="100" cy="100" r="100"/></clipPath>
    <radialGradient id="bg" cx="${gx}%" cy="${gy}%" r="75%">
      <stop offset="0%" stop-color="hsl(${h}, ${Math.max(s - 30, 20)}%, 93%)"/>
      <stop offset="60%" stop-color="hsl(${h}, ${s - 10}%, 78%)"/>
      <stop offset="100%" stop-color="hsl(${h}, ${s}%, 58%)"/>
    </radialGradient>
    <filter id="blur">
      <feGaussianBlur stdDeviation="18"/>
    </filter>
  </defs>
  <g clip-path="url(#c)">
    <rect width="200" height="200" fill="url(#bg)"/>
    <g filter="url(#blur)">${circles}</g>
  </g>
</svg>`;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ seed: string }> }
) {
  const { seed } = await params;
  const svg = generateSvg(seed);

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
