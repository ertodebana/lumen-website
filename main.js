// The rocket: a CC0 model standing on the hero's ground line. It turns slowly,
// and "Attempt launch" lifts it off at a pace that suits the language.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const canvas = document.getElementById('rocket');
const button = document.getElementById('launch');
const status = document.getElementById('status');
const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const FOV = 30;
const DISTANCE = 9;
const VISIBLE = 2 * DISTANCE * Math.tan(THREE.MathUtils.degToRad(FOV / 2)); // world units, top to bottom
const HEIGHT = 3.3;                 // rocket height in world units
const GROUND = -VISIBLE / 2 + 0.1; // just above the bottom edge, where the page draws the ground
const LAUNCH_SECONDS = 14;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
} catch {
  // No WebGL: the page still reads fine without the rocket.
  button.hidden = true;
  status.textContent = 'The rocket needs WebGL. It was not going anywhere anyway.';
}

if (renderer) {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  camera.position.set(0, 0, DISTANCE);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x9fb0c8, 2.1));
  const sun = new THREE.DirectionalLight(0xfff1d6, 2.6);
  sun.position.set(4, 6, 5);
  scene.add(sun);

  const rig = new THREE.Group(); // moves up on launch
  rig.position.y = GROUND;
  scene.add(rig);

  // Soft contact shadow on the pad.
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.8, 48),
    new THREE.MeshBasicMaterial({ color: 0x0e1a2b, transparent: true, opacity: 0.16 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = GROUND + 0.005;
  shadow.scale.set(1, 0.4, 1);
  scene.add(shadow);

  // Exhaust flame, hidden until launch.
  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.2, 1.1, 20),
    new THREE.MeshBasicMaterial({ color: 0xf0a020, transparent: true, opacity: 0.92 }),
  );
  flame.rotation.x = Math.PI;
  flame.position.y = -0.3;
  flame.visible = false;
  rig.add(flame);

  let rocket = null;
  new GLTFLoader().load('assets/rocket.glb', (gltf) => {
    rocket = gltf.scene;
    const box = new THREE.Box3().setFromObject(rocket);
    const size = box.getSize(new THREE.Vector3());
    const scale = HEIGHT / size.y;
    rocket.scale.setScalar(scale);
    // Centre on the axis and put the feet at the rig's origin.
    const centre = box.getCenter(new THREE.Vector3());
    rocket.position.set(-centre.x * scale, -box.min.y * scale, -centre.z * scale);
    rig.add(rocket);
    rig.rotation.y = -0.5;
    render();
  }, undefined, () => {
    button.hidden = true;
    status.textContent = 'The rocket failed to load. Fitting.';
  });

  function resize() {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    render();
  }
  new ResizeObserver(resize).observe(canvas);

  function render() {
    renderer.render(scene, camera);
  }

  // --- launch state ---
  let launchedAt = null; // seconds, or null while on the pad
  let away = false;

  const lines = [
    [0, 'Ignition.'],
    [2.5, 'Lift-off. Technically.'],
    [6, 'Still climbing.'],
    [10, 'Nearly out of frame.'],
  ];

  function setOnPad(message) {
    launchedAt = null;
    away = false;
    rig.position.y = GROUND;
    flame.visible = false;
    shadow.material.opacity = 0.16;
    button.textContent = 'Attempt launch';
    button.disabled = false;
    status.textContent = message;
    render();
  }

  function setAway() {
    away = true;
    launchedAt = null;
    rig.position.y = GROUND + VISIBLE + HEIGHT;
    flame.visible = false;
    shadow.material.opacity = 0;
    button.textContent = 'Bring it back';
    button.disabled = false;
    status.textContent = `Gone. That took ${LAUNCH_SECONDS} seconds.`;
    render();
  }

  button.addEventListener('click', () => {
    if (!rocket) return;
    if (away) return setOnPad('Back on the pad. No hurry.');
    if (calm) return setAway(); // no animation requested: jump to the result
    launchedAt = performance.now() / 1000;
    button.disabled = true;
    flame.visible = true;
  });

  if (!calm) {
    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      const dt = Math.min(clock.getDelta(), 0.1);
      if (!rocket) return;
      rig.rotation.y += dt * 0.22; // a slow turn, so you can see it is 3D

      if (launchedAt !== null) {
        const t = performance.now() / 1000 - launchedAt;
        const p = Math.min(t / LAUNCH_SECONDS, 1);
        // Slow start, slow middle, slow end.
        rig.position.y = GROUND + (VISIBLE + HEIGHT) * p * p;
        rig.position.x = Math.sin(t * 9) * 0.008 * (1 - p); // a little shake
        flame.scale.set(1 + Math.sin(t * 40) * 0.12, 0.85 + Math.sin(t * 31) * 0.2, 1);
        shadow.material.opacity = 0.16 * Math.max(0, 1 - p * 6);
        const line = lines.filter(([at]) => t >= at).pop();
        if (line && status.textContent !== line[1]) status.textContent = line[1];
        if (p >= 1) {
          rig.position.x = 0;
          setAway();
        }
      }
      render();
    });
  }
}
