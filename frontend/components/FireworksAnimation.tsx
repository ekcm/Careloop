'use client';

import { useEffect, useRef } from 'react';
import type { FireworksHandlers } from 'fireworks-js';

export default function FireworksAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let fireworksInstance: FireworksHandlers | undefined;

    async function startFireworks() {
      const { Fireworks } = await import('fireworks-js');
      if (containerRef.current) {
        fireworksInstance = new Fireworks(containerRef.current, {
          acceleration: 1.05,
          friction: 0.97,
          gravity: 1.5,
          particles: 50,
          traceLength: 3,
          explosion: 5,
        });
        fireworksInstance.start();

        setTimeout(() => {
          fireworksInstance?.stop();
        }, 5000);
      }
    }

    startFireworks();

    return () => {
      fireworksInstance?.stop();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ background: 'transparent' }}
    />
  );
}
