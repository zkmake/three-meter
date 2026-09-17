/**
 * Vanilla three, no React. `?webgpu` swaps in `WebGPURenderer` with timestamp
 * tracking so the GPU row is real there too; the default is `WebGLRenderer`,
 * whose GPU row needs `EXT_disjoint_timer_query_webgl2` (Chrome, Edge).
 * `?count=5000` scales the scene to make the numbers move.
 */
import { PerformanceMonitor, wrapAnimationLoop, type PerfRenderer } from "@zkmake/three-meter";
import { mountPerfHud } from "@zkmake/three-meter/ui";
import {
  BoxGeometry,
  Color,
  DirectionalLight,
  HemisphereLight,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";

type Loop = (time: number) => void;

type RendererLike = PerfRenderer & {
  domElement: HTMLCanvasElement;
  setAnimationLoop: (loop: Loop | null) => void;
  setPixelRatio: (ratio: number) => void;
  setSize: (width: number, height: number) => void;
  render: (scene: Scene, camera: PerspectiveCamera) => unknown;
};

const params = new URLSearchParams(location.search);
const useWebgpu = params.has("webgpu");
const count = Math.max(1, Number(params.get("count") ?? 2000));

const note = document.querySelector("#note")!;
note.innerHTML = useWebgpu
  ? 'WebGPU · <a href="./">switch to WebGL</a>'
  : 'WebGL · <a href="?webgpu">switch to WebGPU</a>';

const createRenderer = async (): Promise<RendererLike> => {
  if (useWebgpu) {
    const { WebGPURenderer } = await import("three/webgpu");
    const renderer = new WebGPURenderer({ antialias: true, trackTimestamp: true });
    await renderer.init();

    return renderer as unknown as RendererLike;
  }

  return new WebGLRenderer({ antialias: true }) as unknown as RendererLike;
};

const renderer = await createRenderer();
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.append(renderer.domElement);

const scene = new Scene();
scene.background = new Color("#0f1115");
const camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 6, 18);
camera.lookAt(0, 0, 0);

scene.add(new HemisphereLight("#cfe4ff", "#1b1d24", 1.2));
const sun = new DirectionalLight("#ffffff", 2);
sun.position.set(5, 10, 4);
scene.add(sun);

const cubes = new InstancedMesh(
  new BoxGeometry(0.4, 0.4, 0.4),
  new MeshStandardMaterial({ roughness: 0.5 }),
  count,
);
const matrix = new Matrix4();
const color = new Color();
const side = Math.ceil(Math.cbrt(count));

for (let index = 0; index < count; index += 1) {
  const x = (index % side) - side / 2;
  const y = (Math.floor(index / side) % side) - side / 2;
  const z = Math.floor(index / (side * side)) - side / 2;
  matrix.makeTranslation(x * 0.7, y * 0.7, z * 0.7);
  cubes.setMatrixAt(index, matrix);
  cubes.setColorAt(index, color.setHSL(index / count, 0.6, 0.55));
}

scene.add(cubes);

const monitor = new PerformanceMonitor({ renderer });
mountPerfHud(monitor, { storageKey: "three-meter-example:vanilla" });

renderer.setAnimationLoop(
  wrapAnimationLoop(monitor, (time) => {
    cubes.rotation.y = time * 0.0002;
    cubes.rotation.x = Math.sin(time * 0.0001) * 0.3;
    renderer.render(scene, camera);
  }),
);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
