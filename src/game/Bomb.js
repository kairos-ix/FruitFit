let _bombId = 0;

export class Bomb {
  constructor(x, y, vx, vy) {
    this.id = _bombId++;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.rotation = 0;
    this.rotSpeed = 1.5;
    this.radius = 32;
    this.state = 'flying'; // 'flying' | 'exploded' | 'missed'
    this.score = 0;
    this.juiceColor = '#ff4500';

    // Explosion animation
    this.explodeAlpha = 0;
    this.explodeRadius = 0;

    // Fuse animation
    this.fuseTime = 0;
  }

  update(delta, gravity) {
    const dt = delta / 1000;
    this.fuseTime += dt;

    if (this.state === 'flying') {
      this.vy += gravity * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.rotation += this.rotSpeed * dt;
    } else if (this.state === 'exploded') {
      this.explodeAlpha -= dt * 3;
      this.explodeRadius += delta * 0.5;
    }
  }

  explode() {
    if (this.state !== 'flying') return false;
    this.state = 'exploded';
    this.explodeAlpha = 1;
    this.explodeRadius = this.radius;
    return true;
  }

  isOffScreen(W, H) {
    if (this.state === 'flying') return this.y > H + 80;
    return this.explodeAlpha <= 0;
  }

  draw(ctx) {
    if (this.state === 'flying') {
      this._drawBomb(ctx);
    } else if (this.state === 'exploded') {
      this._drawExplosion(ctx);
    }
  }

  _drawBomb(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    // Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 8;

    // Body
    const grad = ctx.createRadialGradient(-10, -10, 0, 0, 0, this.radius);
    grad.addColorStop(0, '#555');
    grad.addColorStop(1, '#111');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = 'transparent';

    // Skull / danger marker
    ctx.fillStyle = 'rgba(255,50,50,0.85)';
    ctx.font = `bold ${this.radius}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💣', 0, 2);

    // Fuse
    const fuseFlicker = Math.sin(this.fuseTime * 15) > 0;
    ctx.strokeStyle = '#8d6e63';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -this.radius);
    ctx.quadraticCurveTo(this.radius * 0.6, -this.radius * 1.5, this.radius * 0.3, -this.radius * 2);
    ctx.stroke();

    // Spark
    if (fuseFlicker) {
      ctx.fillStyle = '#ffcc02';
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(this.radius * 0.3, -this.radius * 2, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  _drawExplosion(ctx) {
    const alpha = Math.max(0, this.explodeAlpha);
    ctx.save();
    ctx.globalAlpha = alpha;

    // Outer ring
    const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.explodeRadius);
    grad.addColorStop(0, 'rgba(255,200,0,0.9)');
    grad.addColorStop(0.4, 'rgba(255,80,0,0.7)');
    grad.addColorStop(1, 'rgba(255,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.explodeRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
