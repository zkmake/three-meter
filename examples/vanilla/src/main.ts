/**
 * Vanilla three, no React. `?webgpu` swaps in `WebGPURenderer` with timestamp
 * tracking so the GPU row is real there too; the default is `WebGLRenderer`,
 * whose GPU row needs `EXT_disjoint_timer_query_webgl2` (Chrome, Edge).
 * `?count=5000` scales the scene to make the numbers move.
 *
 * The header's theme toggle sets the page's own `HudTheme` and the HUD's
 * consumer layer through `setTheme`, so both flip together (and track the OS
 * in `system`). The HUD mounts on `system` unless a previous visit chose
 * otherwise. A pick in the panel's own theme row overrides the HUD alone; the
 * page keeps following the header toggle.
 */
import { PerformanceMonitor, wrapAnimationLoop, type PerfRenderer } from "@zkmake/three-meter";
import { HudTheme, isThemeMode, mountPerfHud, type ThemeMode } from "@zkmake/three-meter/ui";
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

import "./style.css";

type Loop = (time: number) => void;

type RendererLike = PerfRenderer & {
  domElement: HTMLCanvasElement;
  setAnimationLoop: (loop: Loop | null) => void;
  setPixelRatio: (ratio: number) => void;
  setSize: (width: number, height: number) => void;
  render: (scene: Scene, camera: PerspectiveCamera) => unknown;
};

const THEME_STORAGE_KEY = "three-meter-example:theme";
const BACKGROUNDS = { dark: "#0f1115", light: "#f3f4f6" } as const;
const INSTALL_COMMANDS = {
  bun: "bun add -d @zkmake/three-meter",
  npm: "npm i -D @zkmake/three-meter",
  pnpm: "pnpm add -D @zkmake/three-meter",
} as const;

type PackageManager = keyof typeof INSTALL_COMMANDS;

const params = new URLSearchParams(location.search);
const useWebgpu = params.has("webgpu");
const count = Math.max(1, Number(params.get("count") ?? 2000));

const note = document.querySelector("#note")!;
note.innerHTML = useWebgpu
  ? 'WebGPU · <a href="./">switch to WebGL</a>'
  : 'WebGL · <a href="?webgpu">switch to WebGPU</a>';

const readStoredTheme = (): ThemeMode => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);

    return isThemeMode(stored) ? stored : "system";
  } catch {
    return "system";
  }
};

const writeStoredTheme = (mode: ThemeMode) => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // The live toggle still applies.
  }
};

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
document.body.prepend(renderer.domElement);

const scene = new Scene();
scene.background = new Color(BACKGROUNDS.dark);
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
const pageTheme = new HudTheme(readStoredTheme());
const hud = mountPerfHud(monitor, {
  storageKey: "three-meter-example:vanilla",
  theme: pageTheme.mode,
});

// Site theme: the page has its own controller so a pick inside the panel
// restyles the HUD only. The header toggle sets both.
const themeButtons = [...document.querySelectorAll<HTMLButtonElement>("#theme [data-mode]")];

const paintTheme = () => {
  const resolved = pageTheme.resolved;
  document.documentElement.dataset.theme = resolved;
  (scene.background as Color).set(BACKGROUNDS[resolved]);

  for (const button of themeButtons) {
    button.setAttribute("aria-checked", String(button.dataset.mode === pageTheme.mode));
  }
};

for (const button of themeButtons) {
  button.addEventListener("click", () => {
    const mode = button.dataset.mode;

    if (isThemeMode(mode)) {
      pageTheme.setMode(mode);
      hud.setTheme(mode);
      writeStoredTheme(mode);
    }
  });
}

pageTheme.subscribe(paintTheme);
paintTheme();

// Install panel: package-manager tabs and a copy button.
const commandEl = document.querySelector("#install-command")!;
const copyButton = document.querySelector<HTMLButtonElement>("#copy")!;
const pmButtons = [...document.querySelectorAll<HTMLButtonElement>("#pm [data-pm]")];
let packageManager: PackageManager = "bun";

const paintInstall = () => {
  commandEl.textContent = INSTALL_COMMANDS[packageManager];

  for (const button of pmButtons) {
    button.setAttribute("aria-selected", String(button.dataset.pm === packageManager));
  }
};

for (const button of pmButtons) {
  button.addEventListener("click", () => {
    const pm = button.dataset.pm;

    if (pm && pm in INSTALL_COMMANDS) {
      packageManager = pm as PackageManager;
      paintInstall();
    }
  });
}

let copiedTimer = 0;
copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(INSTALL_COMMANDS[packageManager]);
    copyButton.classList.add("is-copied");
    copyButton.setAttribute("aria-label", "Copied");
    window.clearTimeout(copiedTimer);
    copiedTimer = window.setTimeout(() => {
      copyButton.classList.remove("is-copied");
      copyButton.setAttribute("aria-label", "Copy install command");
    }, 1200);
  } catch {
    // Clipboard blocked; the command is still selectable.
  }
});

paintInstall();

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
