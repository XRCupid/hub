// Simple confetti burst for canvas overlay
// Usage: confettiBurst(canvas, [x, y])
export function confettiBurst(canvas, opts = {}) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const cx = opts.x !== undefined ? opts.x : width / 2;
  const cy = opts.y !== undefined ? opts.y : height / 2;
  const particles = [];
  const colors = ['#ff6b6b', '#f7d716', '#51e898', '#4285f4', '#a259f7', '#ffb86c'];
  const count = 32;
  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count;
    const speed = Math.random() * 4 + 3;
    particles.push({
      x: cx,
      y: cy,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      color: colors[Math.floor(Math.random() * colors.length)],
      radius: Math.random() * 3 + 3,
      life: 30 + Math.random() * 20
    });
  }

  let frame = 0;
  function draw() {
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.clearRect(0, 0, width, height);
    ctx.restore();
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI);
      ctx.fillStyle = p.color;
      ctx.fill();
      p.x += p.dx;
      p.y += p.dy;
      p.dy += 0.25; // gravity
      p.life--;
    });
    frame++;
    if (frame < 40) {
      requestAnimationFrame(draw);
    }
  }
  draw();
}
