"use client";

import { useEffect, useRef } from "react";

export default function FireworksAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let fireworksInstance: any;

    async function startFireworks() {
      const { Fireworks } = await import("fireworks-js");
      if (containerRef.current) {
        fireworksInstance = new Fireworks(containerRef.current, {
          speed: 3,
          acceleration: 1.05,
          friction: 0.97,
          gravity: 1.5,
          particles: 50,
          trace: 3,
          explosion: 5,
          boundaries: {
            top: 50,
            bottom: window.innerHeight,
            left: 50,
            right: window.innerWidth,
          },
        });
        fireworksInstance.start();

        setTimeout(() => {
          fireworksInstance.stop();
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
      style={{ background: "transparent" }}
    />
  );
}
