import React, { useEffect, useRef, useState } from "react";

const Splash = ({ onSkip }) => {
  const canvasRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    const particleCount = Math.max(14, Math.round((w * h) / 90000));
    const particles = [];

    const rand = (min, max) => Math.random() * (max - min) + min;

    const initParticles = () => {
      particles.length = 0;
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: rand(0, w),
          y: rand(0, h),
          vx: rand(-0.15, 0.15),
          vy: rand(-0.05, 0.05),
          r: rand(0.6, 2.8),
          a: rand(0.06, 0.38),
        });
      }
    };

    let raf = null;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "rgba(240,249,255,0.03)");
      g.addColorStop(1, "rgba(240,255,244,0.02)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      for (let p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        ctx.beginPath();
        ctx.fillStyle = `rgba(8,145,178,${p.a})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 88) {
            ctx.strokeStyle = `rgba(16,185,129,${(0.12 * (88 - dist)) / 88})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(draw);
    };

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      initParticles();
    };

    initParticles();
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => onSkip && onSkip(), 3800);
    return () => clearTimeout(t);
  }, [onSkip]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center splash-root">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="relative z-10 flex items-center justify-center px-4">
        <div className="splash-rect transform-gpu">
          <div className="sweep-left" />
          <div className="splash-inner">
            <div className="splash-top">
              <div className="mini-logo" aria-hidden>
                <svg width="48" height="48" viewBox="0 0 86 86" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="g2" x1="0" x2="1" y1="0" y2="1">
                      <stop offset="0" stopColor="#0891b2" />
                      <stop offset="1" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                  <rect x="3" y="3" width="80" height="80" rx="16" fill="url(#g2)" opacity="0.12" />
                  <g transform="translate(14,14)">
                    <circle cx="18" cy="18" r="14" fill="url(#g2)" opacity="0.16" />
                  </g>
                </svg>
              </div>
              <div className="title-block">
                <div className="title-line small">Let's beat</div>
                <div className="title-line large">
                  <span className="glow-asd">ASD</span>
                </div>
                <div className="byline">— Dr.Thynk</div>
              </div>
            </div>

            <div className="splash-body">
              <div className="tagline">Detect • Explain • Support</div>
              <div className="moving-bands" aria-hidden>
                <div className="band band-a" />
                <div className="band band-b" />
              </div>
              <div className="cta-row">
                <button className="btn-skip btn-light" onClick={onSkip}>Skip</button>
                <button className="btn-enter btn-main" onClick={onSkip}>Enter Dr.Thynk</button>
              </div>
            </div>

            <div className="sweep-right" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Splash;
