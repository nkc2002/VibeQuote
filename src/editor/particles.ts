/**
 * Particle Effects System
 *
 * Lightweight particle system for canvas overlay effects.
 * Effects: Snow, Dust, Sparkles
 */

// ============================================================
// Types
// ============================================================

export type ParticleType = "none" | "snow" | "dust" | "sparkles";

export interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  angle?: number; // for sparkles
  rotation?: number; // for dust
  life?: number; // for sparkles fade
}

export interface ParticleConfig {
  type: ParticleType;
  count: number;
  minSize: number;
  maxSize: number;
  minSpeed: number;
  maxSpeed: number;
  color: string;
}

// ============================================================
// Presets
// ============================================================

export const PARTICLE_PRESETS: Record<
  Exclude<ParticleType, "none">,
  ParticleConfig
> = {
  snow: {
    type: "snow",
    count: 50,
    minSize: 2,
    maxSize: 6,
    minSpeed: 0.5,
    maxSpeed: 1.5,
    color: "rgba(255, 255, 255, 0.8)",
  },
  dust: {
    type: "dust",
    count: 30,
    minSize: 1,
    maxSize: 3,
    minSpeed: 0.2,
    maxSpeed: 0.5,
    color: "rgba(255, 255, 255, 0.4)",
  },
  sparkles: {
    type: "sparkles",
    count: 25,
    minSize: 2,
    maxSize: 4,
    minSpeed: 0,
    maxSpeed: 0.1,
    color: "rgba(255, 215, 0, 0.9)",
  },
};

// ============================================================
// Particle System
// ============================================================

export class ParticleSystem {
  private particles: Particle[] = [];
  private config: ParticleConfig | null = null;
  private canvasWidth: number = 0;
  private canvasHeight: number = 0;
  private animationId: number | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d");
  }

  setSize(width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.canvas.width = width;
    this.canvas.height = height;
  }

  setEffect(type: ParticleType) {
    this.stop();
    this.particles = [];

    if (type === "none") {
      this.config = null;
      this.clear();
      return;
    }

    this.config = PARTICLE_PRESETS[type];
    this.initParticles();
    this.start();
  }

  private initParticles() {
    if (!this.config) return;

    this.particles = [];
    for (let i = 0; i < this.config.count; i++) {
      this.particles.push(this.createParticle());
    }
  }

  private createParticle(): Particle {
    if (!this.config) {
      return { x: 0, y: 0, size: 1, speed: 0, opacity: 1 };
    }

    const { minSize, maxSize, minSpeed, maxSpeed } = this.config;

    return {
      x: Math.random() * this.canvasWidth,
      y: Math.random() * this.canvasHeight,
      size: minSize + Math.random() * (maxSize - minSize),
      speed: minSpeed + Math.random() * (maxSpeed - minSpeed),
      opacity: 0.3 + Math.random() * 0.7,
      angle: Math.random() * Math.PI * 2,
      rotation: Math.random() * 360,
      life: 1,
    };
  }

  private update() {
    if (!this.config) return;

    this.particles.forEach((p) => {
      switch (this.config!.type) {
        case "snow":
          p.y += p.speed;
          p.x += Math.sin(p.y * 0.01) * 0.5;
          if (p.y > this.canvasHeight) {
            p.y = -10;
            p.x = Math.random() * this.canvasWidth;
          }
          break;

        case "dust":
          p.x += p.speed * Math.cos(p.rotation! * 0.01);
          p.y += p.speed * 0.5;
          p.rotation = (p.rotation || 0) + 0.5;
          if (p.y > this.canvasHeight || p.x > this.canvasWidth) {
            p.y = -5;
            p.x = Math.random() * this.canvasWidth;
          }
          break;

        case "sparkles":
          p.life = (p.life || 1) - 0.01;
          p.opacity = Math.max(0, p.life || 0);
          if (p.life! <= 0) {
            p.x = Math.random() * this.canvasWidth;
            p.y = Math.random() * this.canvasHeight;
            p.life = 1;
            p.opacity = 1;
          }
          break;
      }
    });
  }

  private draw() {
    if (!this.ctx || !this.config) return;

    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    this.particles.forEach((p) => {
      this.ctx!.save();
      this.ctx!.globalAlpha = p.opacity;

      switch (this.config!.type) {
        case "snow":
          this.ctx!.beginPath();
          this.ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          this.ctx!.fillStyle = this.config!.color;
          this.ctx!.fill();
          break;

        case "dust":
          this.ctx!.translate(p.x, p.y);
          this.ctx!.rotate((p.rotation || 0) * (Math.PI / 180));
          this.ctx!.fillStyle = this.config!.color;
          this.ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          break;

        case "sparkles":
          this.drawSparkle(p.x, p.y, p.size);
          break;
      }

      this.ctx!.restore();
    });
  }

  private drawSparkle(x: number, y: number, size: number) {
    if (!this.ctx || !this.config) return;

    this.ctx.beginPath();
    this.ctx.moveTo(x, y - size * 2);
    this.ctx.lineTo(x + size * 0.5, y - size * 0.5);
    this.ctx.lineTo(x + size * 2, y);
    this.ctx.lineTo(x + size * 0.5, y + size * 0.5);
    this.ctx.lineTo(x, y + size * 2);
    this.ctx.lineTo(x - size * 0.5, y + size * 0.5);
    this.ctx.lineTo(x - size * 2, y);
    this.ctx.lineTo(x - size * 0.5, y - size * 0.5);
    this.ctx.closePath();
    this.ctx.fillStyle = this.config.color;
    this.ctx.fill();
  }

  private loop = () => {
    this.update();
    this.draw();
    this.animationId = requestAnimationFrame(this.loop);
  };

  start() {
    if (this.animationId) return;
    this.loop();
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  clear() {
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    }
  }

  destroy() {
    this.stop();
    this.clear();
    this.particles = [];
    this.config = null;
  }
}

// ============================================================
// Helper Functions
// ============================================================

export function getParticleTypeLabel(type: ParticleType): string {
  const labels: Record<ParticleType, string> = {
    none: "Không",
    snow: "Tuyết",
    dust: "Bụi",
    sparkles: "Lấp lánh",
  };
  return labels[type];
}

export function getParticleTypeIcon(type: ParticleType): string {
  const icons: Record<ParticleType, string> = {
    none: "○",
    snow: "❄",
    dust: "✦",
    sparkles: "✨",
  };
  return icons[type];
}
