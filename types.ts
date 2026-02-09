
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  decay: number;
  color: string;
  size: number;
  flicker: boolean;
  gravity: number;
  friction: number;
}

export interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
}

export type FireworkType = 'Chrysanthemum' | 'Peony' | 'Willow' | 'Ring' | 'Spike' | 'Palm' | 'Crossette' | 'Dahlia' | 'Kamuro' | 'Brocade';

export interface Firework {
  x: number;
  y: number;
  targetY: number;
  particles: Particle[];
  sparks: Spark[];
  exploded: boolean;
  type: FireworkType;
  color: string;
  sizeMultiplier: number;
}

export interface Point {
  x: number;
  y: number;
}
