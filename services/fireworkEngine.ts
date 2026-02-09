
import { Particle, Firework, FireworkType, Spark } from '../types';
import { FIREWORK_COLORS, GRAVITY, FRICTION, PARTICLE_COUNT } from '../constants';

export class FireworkEngine {
  private fireworks: Firework[] = [];
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private cursor: { x: number; y: number; active: boolean } = { x: 0, y: 0, active: false };
  
  // Charging state for visuals
  private chargingInfo: { x: number, y: number, progress: number, active: boolean } = { x: 0, y: 0, progress: 0, active: false };

  // Audio callbacks
  public onLaunch?: () => void;
  public onExplode?: (type: FireworkType) => void;

  setCanvas(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  setCursor(x: number, y: number, active: boolean) {
    this.cursor = { x, y, active };
  }

  setChargingState(x: number, y: number, progress: number, active: boolean) {
    this.chargingInfo = { x, y, progress, active };
  }

  createFirework(x: number, y: number, sizeMultiplier: number = 1.0, type?: FireworkType): Firework {
    const color = FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)];
    const types: FireworkType[] = ['Chrysanthemum', 'Peony', 'Willow', 'Ring', 'Spike', 'Palm', 'Crossette', 'Dahlia', 'Kamuro', 'Brocade'];
    const fireworkType: FireworkType = type || types[Math.floor(Math.random() * types.length)];
    
    return {
      x,
      y: window.innerHeight,
      targetY: y,
      particles: [],
      sparks: [],
      exploded: false,
      type: fireworkType,
      color,
      sizeMultiplier: sizeMultiplier,
    };
  }

  launch(x: number, y: number, sizeMultiplier: number = 1.0, type?: FireworkType) {
    const fw = this.createFirework(x, y, sizeMultiplier, type);
    this.fireworks.push(fw);
    this.onLaunch?.();
  }

  private explode(fw: Firework) {
    fw.exploded = true;
    this.onExplode?.(fw.type);
    
    // Scale properties based on sizeMultiplier (charge duration)
    const power = fw.sizeMultiplier || 1.0;
    let count = Math.floor(PARTICLE_COUNT * power);
    if (fw.type === 'Willow') count *= 0.8;
    if (fw.type === 'Spike') count *= 0.5;
    if (fw.type === 'Palm') count *= 0.6;
    if (fw.type === 'Crossette') count *= 0.4;
    if (fw.type === 'Kamuro') count *= 1.2;
    
    // Palm Tree - Rising particles that fall like palm fronds
    if (fw.type === 'Palm') {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const speed = (Math.random() * 3 + 2) * power;
        const vx = Math.cos(angle) * speed * 0.3; // Less horizontal spread
        const vy = -Math.abs(Math.sin(angle)) * speed * 1.5 - 3; // Strong upward
        
        fw.particles.push({
          x: fw.x,
          y: fw.targetY,
          vx,
          vy,
          alpha: 1,
          decay: 0.008 / power,
          color: fw.color,
          size: (Math.random() * 2 + 2) * power,
          flicker: false,
          gravity: 0.15, // Heavy gravity for falling effect
          friction: 0.98,
        });
      }
      return;
    }
    
    // Crossette - Explodes into multiple smaller bursts
    if (fw.type === 'Crossette') {
      const numBursts = Math.floor(8 * power);
      for (let i = 0; i < numBursts; i++) {
        const angle = (Math.PI * 2 * i) / numBursts;
        const burstSpeed = 8 * power;
        const burstX = fw.x + Math.cos(angle) * 30;
        const burstY = fw.targetY + Math.sin(angle) * 30;
        
        // Create mini burst
        for (let j = 0; j < 15; j++) {
          const subAngle = (Math.PI * 2 * j) / 15;
          const speed = (Math.random() * 3 + 2) * power;
          const vx = Math.cos(angle) * burstSpeed + Math.cos(subAngle) * speed;
          const vy = Math.sin(angle) * burstSpeed + Math.sin(subAngle) * speed;
          
          fw.particles.push({
            x: burstX,
            y: burstY,
            vx,
            vy,
            alpha: 1,
            decay: 0.02 / power,
            color: fw.color,
            size: (Math.random() * 1.5 + 1) * power,
            flicker: true,
            gravity: 0.05,
            friction: 0.95,
          });
        }
      }
      return;
    }
    
    // Dahlia - Dense flower-like pattern with layered petals
    if (fw.type === 'Dahlia') {
      const layers = 5;
      for (let layer = 0; layer < layers; layer++) {
        const layerCount = Math.floor((count / layers) * (1 + layer * 0.2));
        const layerSpeed = (4 + layer) * power;
        
        for (let i = 0; i < layerCount; i++) {
          const angle = (Math.PI * 2 * i) / layerCount + (layer * 0.1);
          const vx = Math.cos(angle) * layerSpeed;
          const vy = Math.sin(angle) * layerSpeed;
          
          fw.particles.push({
            x: fw.x,
            y: fw.targetY,
            vx,
            vy,
            alpha: 1,
            decay: (0.012 + layer * 0.002) / power,
            color: fw.color,
            size: (3 - layer * 0.3) * power,
            flicker: false,
            gravity: 0.06,
            friction: 0.97,
          });
        }
      }
      return;
    }
    
    // Kamuro - Slow-moving golden crown effect
    if (fw.type === 'Kamuro') {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const speed = (Math.random() * 2 + 3) * power;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        
        fw.particles.push({
          x: fw.x,
          y: fw.targetY,
          vx,
          vy,
          alpha: 1,
          decay: 0.006 / power,
          color: '#FFD700', // Always gold
          size: (Math.random() * 3 + 2) * power,
          flicker: false,
          gravity: 0.12,
          friction: 0.985,
        });
        
        // Add trailing sparks
        if (Math.random() > 0.7) {
          fw.sparks.push({
            x: fw.x,
            y: fw.targetY,
            vx: Math.cos(angle) * speed * 0.8,
            vy: Math.sin(angle) * speed * 0.8,
            alpha: 1,
            color: '#FFFFFF'
          });
        }
      }
      return;
    }
    
    // Brocade - Dense crown with color-changing effect
    if (fw.type === 'Brocade') {
      const secondaryColor = FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)];
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const speed = (Math.random() * 4 + 4) * power;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const useSecondary = i % 3 === 0;
        
        fw.particles.push({
          x: fw.x,
          y: fw.targetY,
          vx,
          vy,
          alpha: 1,
          decay: 0.01 / power,
          color: useSecondary ? secondaryColor : fw.color,
          size: (Math.random() * 2.5 + 1.5) * power,
          flicker: true,
          gravity: 0.08,
          friction: 0.96,
        });
      }
      
      // Add crackling sparks
      for (let i = 0; i < 30 * power; i++) {
        fw.sparks.push({
          x: fw.x,
          y: fw.targetY,
          vx: (Math.random() - 0.5) * 3 * power,
          vy: (Math.random() - 0.5) * 3 * power,
          alpha: 1,
          color: '#FFFFFF'
        });
      }
      return;
    }
    
    // Original firework types
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      let speed = (Math.random() * 5 + 3) * (0.8 + power * 0.4);
      let friction = FRICTION;
      let gravity = GRAVITY;
      let decay = (0.015 + Math.random() * 0.01) / (0.5 + power * 0.5);
      let size = (Math.random() * 2 + 1) * Math.sqrt(power);

      if (fw.type === 'Ring') {
        speed = 6 * power; 
        friction = 0.97;
        decay = 0.01 / power;
      } else if (fw.type === 'Spike') {
        speed = (Math.random() * 12 + 8) * (0.5 + power * 0.5);
        friction = 0.92;
        gravity = 0.02;
        decay = 0.02 / power;
        size = 1.5 * power;
      } else if (fw.type === 'Willow') {
        gravity = 0.04;
        friction = 0.98;
        decay = 0.005 / power;
      }

      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      
      fw.particles.push({
        x: fw.x,
        y: fw.targetY,
        vx,
        vy,
        alpha: 1,
        decay,
        color: fw.color,
        size,
        flicker: Math.random() > 0.5,
        gravity,
        friction,
      });
    }

    if (fw.type === 'Chrysanthemum' || fw.type === 'Spike') {
        const sparkCount = Math.floor((fw.type === 'Spike' ? 10 : 20) * power);
        for (let i = 0; i < sparkCount; i++) {
            fw.sparks.push({
                x: fw.x,
                y: fw.targetY,
                vx: (Math.random() - 0.5) * (fw.type === 'Spike' ? 10 : 2) * power,
                vy: (Math.random() - 0.5) * (fw.type === 'Spike' ? 10 : 2) * power,
                alpha: 1,
                color: '#FFFFFF'
            });
        }
    }
  }

  update() {
    if (!this.ctx || !this.canvas) return;

    this.fireworks = this.fireworks.filter(fw => {
      if (!fw.exploded) {
        fw.y -= 15;
        if (Math.random() > 0.3) {
            fw.sparks.push({
                x: fw.x, y: fw.y,
                vx: (Math.random() - 0.5) * 1.5, vy: Math.random() * 3,
                alpha: 1, color: '#FFFFAA'
            });
        }
        if (fw.y <= fw.targetY) this.explode(fw);
      }
      fw.sparks.forEach(s => { s.x += s.vx; s.y += s.vy; s.alpha -= 0.03; });
      fw.sparks = fw.sparks.filter(s => s.alpha > 0);
      fw.particles.forEach(p => {
        p.vx *= p.friction; p.vy *= p.friction; p.vy += p.gravity;
        p.x += p.vx; p.y += p.vy; p.alpha -= p.decay;
      });
      fw.particles = fw.particles.filter(p => p.alpha > 0);
      return !fw.exploded || fw.particles.length > 0 || fw.sparks.length > 0;
    });
  }

  draw() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;

    ctx.fillStyle = 'rgba(5, 5, 16, 0.25)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw Charging Visuals (Spirit Orb)
    if (this.chargingInfo.active) {
      const { x, y, progress } = this.chargingInfo;
      const time = Date.now() / 1000;
      
      ctx.save();
      ctx.translate(x, y);
      
      // Outer pulsing ring
      ctx.beginPath();
      const pulseSize = 60 * progress + 30 + Math.sin(time * 4) * 5;
      ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 * progress})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Ambient swirl
      ctx.rotate(time * 2);

      // Enhanced Glow
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 50 * progress + 20);
      grad.addColorStop(0, `rgba(255, 255, 255, ${0.6 * progress + 0.2})`);
      grad.addColorStop(0.3, `rgba(255, 240, 200, ${0.4 * progress + 0.1})`);
      grad.addColorStop(0.6, `rgba(255, 200, 150, ${0.2 * progress})`);
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, 50 * progress + 25, 0, Math.PI * 2);
      ctx.fill();

      // Core spirit with stronger glow
      ctx.shadowBlur = 20 * progress + 10;
      ctx.shadowColor = '#FFFFFF';
      ctx.beginPath();
      for(let i=0; i<3; i++) {
        const offset = (i * Math.PI * 2) / 3;
        const dist = 8 * progress;
        ctx.arc(Math.cos(time * 5 + offset) * dist, Math.sin(time * 5 + offset) * dist, 4 * progress + 2, 0, Math.PI * 2);
      }
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      // Multiple Spinning Rings
      for(let i = 0; i < 3; i++) {
        ctx.beginPath();
        const ringRadius = (20 + i * 15) * progress + 15;
        const ringProgress = (progress + i * 0.2) % 1;
        ctx.arc(0, 0, ringRadius, time * (3 + i), time * (3 + i) + Math.PI * 2 * ringProgress);
        ctx.strokeStyle = `rgba(255, 255, 255, ${(0.4 + progress * 0.3) * (1 - i * 0.2)})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Energy particles
      ctx.shadowBlur = 0;
      for(let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + time * 2;
        const radius = 25 * progress + 15;
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;
        ctx.beginPath();
        ctx.arc(px, py, 2 * progress + 1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + Math.sin(time * 5 + i) * 0.4})`;
        ctx.fill();
      }

      ctx.restore();
      
      // Trail effect when moving
      ctx.save();
      ctx.globalAlpha = 0.3 * progress;
      const trailGrad = ctx.createRadialGradient(x, y, 0, x, y, 80 * progress);
      trailGrad.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
      trailGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = trailGrad;
      ctx.beginPath();
      ctx.arc(x, y, 80 * progress, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Cursor tracking
    if (this.cursor.active) {
      ctx.save();
      ctx.shadowBlur = 15; ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath(); ctx.arc(this.cursor.x, this.cursor.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; ctx.fill();
      ctx.restore();
    }

    this.fireworks.forEach(fw => {
      if (!fw.exploded) {
        ctx.save();
        ctx.shadowBlur = 10; ctx.shadowColor = '#FFFFFF';
        ctx.beginPath(); ctx.arc(fw.x, fw.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF'; ctx.fill();
        ctx.restore();
      }
      fw.sparks.forEach(s => {
          ctx.globalAlpha = s.alpha; ctx.fillStyle = s.color;
          ctx.beginPath(); ctx.arc(s.x, s.y, 1.2, 0, Math.PI * 2); ctx.fill();
      });
      fw.particles.forEach(p => {
        ctx.globalAlpha = p.alpha;
        if (p.flicker && Math.random() > 0.9) ctx.globalAlpha = 0;
        ctx.fillStyle = p.color; ctx.shadowBlur = 8; ctx.shadowColor = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      });
      ctx.globalAlpha = 1;
    });
  }
}
