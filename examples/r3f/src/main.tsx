/**
 * React Three Fiber. `PerfSampler` lives inside `<Canvas>` and is toggled with
 * `p`; `PerfHud` sits outside it and mounts only while a sampler is publishing.
 */
import { Canvas, useFrame } from "@react-three/fiber";
import { PerfHud, PerfSampler } from "@zkmake/three-meter/react";
import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import type { Group } from "three";

const COUNT = 400;
const SIDE = Math.ceil(Math.cbrt(COUNT));

const positions = Array.from({ length: COUNT }, (_, index) => {
  const x = (index % SIDE) - SIDE / 2;
  const y = (Math.floor(index / SIDE) % SIDE) - SIDE / 2;
  const z = Math.floor(index / (SIDE * SIDE)) - SIDE / 2;

  return [x * 0.9, y * 0.9, z * 0.9] as const;
});

function Cubes() {
  const group = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (group.current) {
      group.current.rotation.y = clock.elapsedTime * 0.2;
      group.current.rotation.x = Math.sin(clock.elapsedTime * 0.1) * 0.3;
    }
  });

  return (
    <group ref={group}>
      {positions.map((position, index) => (
        <mesh key={index} position={position}>
          <boxGeometry args={[0.4, 0.4, 0.4]} />
          <meshStandardMaterial color={`hsl(${(index / COUNT) * 360}, 60%, 55%)`} />
        </mesh>
      ))}
    </group>
  );
}

function App() {
  const [perf, setPerf] = useState(true);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "p") {
        setPerf((on) => !on);
      }
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <Canvas camera={{ fov: 50, position: [0, 4, 12] }}>
        <color attach="background" args={["#0f1115"]} />
        <hemisphereLight args={["#cfe4ff", "#1b1d24", 1.2]} />
        <directionalLight position={[5, 10, 4]} intensity={2} />
        <Cubes />
        {perf && <PerfSampler />}
      </Canvas>
      <PerfHud storageKey="three-meter-example:r3f" defaultPlacement={{ edge: "right" }} />
    </>
  );
}

createRoot(document.querySelector("#root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
