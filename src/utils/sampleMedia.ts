// Generates high-fidelity offline sample visuals and real-time motion feeds
// so the user can test all features instantly with 1-click.

export function createSamplePortraitCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 1200;
  const ctx = canvas.getContext('2d')!;

  // Background
  const grad = ctx.createLinearGradient(0, 0, 1000, 1200);
  grad.addColorStop(0, '#f2ece4');
  grad.addColorStop(1, '#d8cfc0');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1000, 1200);

  // Lighting shadows
  ctx.save();
  // Woman silhouette / profile like in classic editorial fashion
  // Hair mass
  ctx.fillStyle = '#16141a';
  ctx.beginPath();
  ctx.ellipse(450, 480, 280, 360, -0.15, 0, Math.PI * 2);
  ctx.fill();

  // Face contour
  ctx.fillStyle = '#e4be9c';
  ctx.beginPath();
  ctx.moveTo(380, 320);
  ctx.bezierCurveTo(550, 320, 620, 420, 600, 560);
  ctx.bezierCurveTo(580, 680, 520, 780, 420, 840);
  ctx.bezierCurveTo(340, 880, 300, 760, 300, 660);
  ctx.bezierCurveTo(300, 500, 320, 350, 380, 320);
  ctx.fill();

  // Face shadow for dramatic halftone contrast
  ctx.fillStyle = '#b88265';
  ctx.beginPath();
  ctx.moveTo(480, 330);
  ctx.bezierCurveTo(620, 420, 600, 560, 580, 680);
  ctx.bezierCurveTo(550, 740, 490, 800, 440, 830);
  ctx.bezierCurveTo(460, 750, 480, 650, 480, 550);
  ctx.bezierCurveTo(480, 450, 470, 380, 480, 330);
  ctx.fill();

  // Deep shadow (dramatic rim lighting)
  ctx.fillStyle = '#261c22';
  ctx.beginPath();
  ctx.moveTo(540, 420);
  ctx.bezierCurveTo(620, 500, 600, 600, 560, 690);
  ctx.bezierCurveTo(540, 740, 510, 780, 470, 810);
  ctx.bezierCurveTo(510, 740, 530, 640, 530, 560);
  ctx.fill();

  // Closed eye and lashes
  ctx.strokeStyle = '#181418';
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(430, 510, 40, 0.2, Math.PI - 0.2);
  ctx.stroke();

  // Eyebrow
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.moveTo(370, 460);
  ctx.bezierCurveTo(420, 430, 460, 440, 485, 470);
  ctx.stroke();

  // Lips (Retro Crimson)
  ctx.fillStyle = '#aa2233';
  ctx.beginPath();
  ctx.moveTo(390, 670);
  ctx.bezierCurveTo(430, 650, 450, 650, 470, 675);
  ctx.bezierCurveTo(445, 695, 415, 695, 390, 670);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(395, 675);
  ctx.bezierCurveTo(430, 715, 450, 710, 465, 678);
  ctx.fill();

  // Neck and collar
  ctx.fillStyle = '#dca685';
  ctx.beginPath();
  ctx.moveTo(360, 820);
  ctx.lineTo(460, 820);
  ctx.lineTo(500, 1080);
  ctx.lineTo(310, 1080);
  ctx.fill();

  // Deep neck shadow
  ctx.fillStyle = '#8f523c';
  ctx.beginPath();
  ctx.moveTo(420, 830);
  ctx.lineTo(460, 820);
  ctx.lineTo(495, 1040);
  ctx.lineTo(425, 960);
  ctx.fill();

  // Garment (Navy with floral accents)
  ctx.fillStyle = '#172740';
  ctx.beginPath();
  ctx.moveTo(200, 1020);
  ctx.bezierCurveTo(340, 960, 520, 960, 720, 1040);
  ctx.lineTo(760, 1200);
  ctx.lineTo(150, 1200);
  ctx.fill();

  // Flowers on dress
  const flowers = [
    { x: 320, y: 1060, color: '#f26848' },
    { x: 420, y: 1120, color: '#f6d042' },
    { x: 550, y: 1040, color: '#f26848' },
    { x: 260, y: 1140, color: '#f8f4eb' },
    { x: 620, y: 1110, color: '#f8f4eb' },
  ];

  flowers.forEach((fl) => {
    ctx.fillStyle = fl.color;
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5;
      ctx.beginPath();
      ctx.arc(fl.x + Math.cos(angle) * 22, fl.y + Math.sin(angle) * 22, 16, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#172740';
    ctx.beginPath();
    ctx.arc(fl.x, fl.y, 10, 0, Math.PI * 2);
    ctx.fill();
  });

  // Editorial magazine typography in corner (like in the reference!)
  ctx.fillStyle = '#181418';
  ctx.font = 'bold 36px "Instrument Serif", Georgia, serif';
  ctx.fillText('advanced halftone', 80, 120);
  ctx.font = 'italic 28px "Instrument Serif", Georgia, serif';
  ctx.fillText('image & print effects studio', 80, 160);

  ctx.restore();
  return canvas;
}

export function createSampleRisoArtCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 1000;
  const ctx = canvas.getContext('2d')!;

  // Warm ochre yellow paper (like in user reference 4)
  ctx.fillStyle = '#f5c643';
  ctx.fillRect(0, 0, 1000, 1000);

  // Stylized Risograph Character / Panther
  ctx.save();
  ctx.translate(500, 480);

  // Blue head mass
  ctx.fillStyle = '#084f88';
  ctx.beginPath();
  ctx.arc(0, 0, 320, 0, Math.PI * 2);
  ctx.fill();

  // Whiskers and ears
  ctx.fillStyle = '#084f88';
  ctx.beginPath();
  ctx.moveTo(-220, -220);
  ctx.lineTo(-120, -380);
  ctx.lineTo(-40, -280);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(220, -220);
  ctx.lineTo(120, -380);
  ctx.lineTo(40, -280);
  ctx.fill();

  // White eye rings
  ctx.fillStyle = '#fef6e0';
  ctx.beginPath();
  ctx.arc(-110, -60, 80, 0, Math.PI * 2);
  ctx.arc(110, -60, 80, 0, Math.PI * 2);
  ctx.fill();

  // Pupils
  ctx.fillStyle = '#0e1724';
  ctx.beginPath();
  ctx.arc(-110, -60, 42, 0, Math.PI * 2);
  ctx.arc(110, -60, 42, 0, Math.PI * 2);
  ctx.fill();

  // Open mouth with sharp teeth
  ctx.fillStyle = '#0e1724';
  ctx.beginPath();
  ctx.ellipse(0, 130, 210, 130, 0, 0, Math.PI * 2);
  ctx.fill();

  // Red/Orange tongue
  ctx.fillStyle = '#ea4e3d';
  ctx.beginPath();
  ctx.ellipse(0, 170, 120, 75, 0, 0, Math.PI * 2);
  ctx.fill();

  // Sharp white teeth
  ctx.fillStyle = '#fef6e0';
  for (let i = -4; i <= 4; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 38 - 18, 55);
    ctx.lineTo(i * 38, 105);
    ctx.lineTo(i * 38 + 18, 55);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(i * 38 - 18, 205);
    ctx.lineTo(i * 38, 160);
    ctx.lineTo(i * 38 + 18, 205);
    ctx.fill();
  }

  // Whisker lines
  ctx.strokeStyle = '#0e1724';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(-280, 40);
  ctx.lineTo(-440, 10);
  ctx.moveTo(-280, 80);
  ctx.lineTo(-450, 80);
  ctx.moveTo(-280, 120);
  ctx.lineTo(-440, 160);

  ctx.moveTo(280, 40);
  ctx.lineTo(440, 10);
  ctx.moveTo(280, 80);
  ctx.lineTo(450, 80);
  ctx.moveTo(280, 120);
  ctx.lineTo(440, 160);
  ctx.stroke();

  ctx.restore();

  // Vintage bottom stamp
  ctx.fillStyle = '#0e1724';
  ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('ATELIER VINTAGE SCREENPRINT · NO. 24', 60, 940);

  return canvas;
}

export class LiveMotionCanvasGenerator {
  public canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animId: number | null = null;
  private startTime = performance.now();

  constructor(width = 800, height = 800) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d')!;
    this.start();
  }

  private start() {
    const render = (time: number) => {
      this.animId = requestAnimationFrame(render);
      const t = (time - this.startTime) * 0.0015;
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      // Dark warm base
      ctx.fillStyle = '#18161d';
      ctx.fillRect(0, 0, w, h);

      // Rotating hypnotic geometric ring
      ctx.save();
      ctx.translate(w / 2, h / 2);

      // Outer breathing ring
      const rings = 8;
      for (let i = 0; i < rings; i++) {
        const rad = 60 + i * 40 + Math.sin(t * 2 + i * 0.5) * 15;
        ctx.strokeStyle = i % 2 === 0 ? '#f4ece1' : '#cf4b38';
        ctx.lineWidth = 14 + Math.cos(t * 3 + i) * 6;
        ctx.beginPath();
        ctx.arc(0, 0, rad, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Rotating faceted polygon
      ctx.rotate(t * 0.8);
      ctx.fillStyle = '#e8a838';
      ctx.beginPath();
      for (let j = 0; j < 6; j++) {
        const ang = (j * Math.PI * 2) / 6;
        const dist = 110 + Math.sin(t * 4 + j) * 20;
        const x = Math.cos(ang) * dist;
        const y = Math.sin(ang) * dist;
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();

      // Inner pulsating core
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, 45 + Math.sin(t * 6) * 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Kinetic typography ribbon
      ctx.fillStyle = '#f4ece1';
      ctx.font = 'bold 36px "Instrument Serif", Georgia, serif';
      const offset = (t * 80) % 600;
      ctx.fillText('LIVE MOTION · 60 FPS RETRO PROCESSING · VINTAGE PRINT · ', 60 - offset, 80);
      ctx.fillText('LIVE MOTION · 60 FPS RETRO PROCESSING · VINTAGE PRINT · ', 660 - offset, 80);
      ctx.fillText('LIVE MOTION · 60 FPS RETRO PROCESSING · VINTAGE PRINT · ', 1260 - offset, 80);

      // Subtitle
      ctx.font = '500 18px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#e8a838';
      ctx.fillText(`FRAME CLOCK: ${Math.round(time)}ms · HARDWARE SHADER READY`, 60, h - 50);
    };

    this.animId = requestAnimationFrame(render);
  }

  public stop() {
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }
}
