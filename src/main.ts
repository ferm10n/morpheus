import './style.css';

import * as THREE from 'three';

import Stats from 'three/addons/libs/stats.module.js';
import GUI from 'lil-gui';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let camera: THREE.PerspectiveCamera;
let scene: THREE.Scene;
let renderer: THREE.WebGLRenderer;
let object: THREE.Mesh;
let stats: Stats;

/** length of one "edge" of the scene (ground plane edge). everything scales to this */
const sceneVolumeMm = 1500;

type Memory = {
  startTime: number;
  cameraPosition: THREE.Vector3;
  cameraZoom: number;
  orbitTarget: THREE.Vector3;
  backgroundColor: number;
  ledColor: number;
};
let memory: Memory;

const defaultCameraPosition = new THREE.Vector3(sceneVolumeMm / 2, sceneVolumeMm / 2, sceneVolumeMm / 2);
const defaultCameraZoom = 1;
const defaultOrbitTarget = new THREE.Vector3(0, 0, 0);
const defaultBackgroundColor = 0x111111;

const leds: {
  material: THREE.MeshBasicMaterial;
  light: THREE.PointLight;
}[] = [];

if (import.meta.hot) {
  console.log('memory', import.meta.hot.data.memory);
  memory = import.meta.hot.data.memory;
  if (!memory) {
    memory = {
      // defaults
      startTime: Date.now(),
      cameraPosition: defaultCameraPosition.clone(),
      cameraZoom: defaultCameraZoom,
      orbitTarget: defaultOrbitTarget.clone(),
      backgroundColor: defaultBackgroundColor,
      ledColor: 0xff0000,
    };
  }
  import.meta.hot.accept();
}

init();

function init() {
  camera = new THREE.PerspectiveCamera(
    36,
    window.innerWidth / window.innerHeight,
    0.25,
    1600,
  );

  camera.position.copy(memory.cameraPosition);
  camera.zoom = memory.cameraZoom;
  camera.updateProjectionMatrix();

  scene = new THREE.Scene();
  scene.background = new THREE.Color(memory.backgroundColor);

  // Lights
  {
    scene.add(new THREE.AmbientLight(0xcccccc));

    const spotLight = new THREE.SpotLight(0xffffff, 60);
    spotLight.angle = Math.PI / 5;
    spotLight.penumbra = 0.2;
    spotLight.position.set(2, 3, 3);
    spotLight.castShadow = true;
    spotLight.shadow.camera.near = 3;
    spotLight.shadow.camera.far = 10;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    scene.add(spotLight);

    const dirLight = new THREE.DirectionalLight(0x55505a, 3);
    dirLight.position.set(0, 3, 0);
    dirLight.castShadow = true;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 10;

    dirLight.shadow.camera.right = 1;
    dirLight.shadow.camera.left = -1;
    dirLight.shadow.camera.top = 1;
    dirLight.shadow.camera.bottom = -1;

    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    function addLED (opts: {
      color: number;
      intensity: number;
      distance: number;
      position: THREE.Vector3;
    }) {
      const ledColor = new THREE.Color(opts.color);
      
      const pointLight = new THREE.PointLight(ledColor, opts.intensity, opts.distance);
      pointLight.position.copy(opts.position);
      scene.add(pointLight);

      const gHousing = new THREE.BoxGeometry(2.2, 2.0, 0.28);
      const mHousing = new THREE.MeshBasicMaterial({ color: ledColor });
      const housing = new THREE.Mesh(gHousing, mHousing);
      housing.position.copy(opts.position);
      // scene.add(housing);

      // Store the material reference
      leds.push({
        material: mHousing,
        light: pointLight,
      });
    }

    function addLEDStrip(
      start: THREE.Vector3,
      end: THREE.Vector3,
      numLEDs: number,
      color: number
    ) {
      // Calculate the direction vector from start to end
      const direction = new THREE.Vector3().subVectors(end, start);
      const length = direction.length();
      direction.normalize();
    
      // Calculate the positions of the LEDs
      const ledPositions = [];
      for (let i = 0; i < numLEDs; i++) {
        const t = i / (numLEDs - 1);
        const position = new THREE.Vector3().lerpVectors(start, end, t);
        ledPositions.push(position);
      }
    
      // Create the box geometry
      const stripWidth = 0.05; // Adjust as needed
      const stripHeight = 0.028; // Adjust as needed
      const stripLength = length;
      const stripGeometry = new THREE.BoxGeometry(stripWidth, stripHeight, stripLength);
    
      // Create the material for the strip
      const stripMaterial = new THREE.MeshPhongMaterial({
        color,
        shininess: 1,
        side: THREE.DoubleSide,
      });
    
      // Create the strip mesh
      const strip = new THREE.Mesh(stripGeometry, stripMaterial);
    
      // Position and rotate the box
      strip.position.copy(start).add(direction.clone().multiplyScalar(length / 2));
      strip.lookAt(end);
    
      // Add the strip to the scene
      scene.add(strip);

      // Add the LEDs
      ledPositions.forEach((position) => {
        addLED({
          color: 0xff0000, // Adjust LED color as needed
          intensity: 10,
          distance: 30,
          position: position.clone(),
        });
      });
    }

    // Example usage:
    addLEDStrip(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 100),
      10,
      0x00ff00
    );
  }

  // Geometry

  const material = new THREE.MeshPhongMaterial({
    color: 0x000000,
    shininess: 100,
    side: THREE.DoubleSide,
  });

  const geometry = new THREE.TorusKnotGeometry(0.4, 0.08, 95, 20);

  object = new THREE.Mesh(geometry, material);
  object.castShadow = true;
  scene.add(object);

  const ground = new THREE.Mesh(
    // new THREE.Box(memory.sceneVolumeMm, memory.sceneVolumeMm, 1, 1),
    new THREE.BoxGeometry(sceneVolumeMm, 1, sceneVolumeMm),
    new THREE.MeshPhongMaterial({ color: 0xa0adaf, shininess: 150 }),
  );

  ground.position.y -= sceneVolumeMm / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Renderer
  {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize);
  }

  // Stats

  stats = new Stats();
  document.body.appendChild(stats.dom);

  // Controls

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(memory.orbitTarget);
  controls.update();

  // GUI
  const gui = new GUI();
  const props = {
    reset: () => {
      camera.position.copy(defaultCameraPosition);
      camera.zoom = defaultCameraZoom;
      camera.updateProjectionMatrix();
      controls.target.copy(defaultOrbitTarget);
      controls.update();
      props.backgroundColor = defaultBackgroundColor;
    },
    get backgroundColor () {
      return (scene.background as THREE.Color).getHex();
    },
    set backgroundColor (value: number) {
      scene.background = new THREE.Color(value);
    },
    get ledColor () {
      return leds[0].material.color.getHex();
    },
    set ledColor (value: number) {
      for (const led of leds) {
        led.material.color.setHex(value);
        led.light.color.setHex(value);
      }
    },
  };
  {
    gui.addColor(props, 'ledColor').listen();
    gui.addColor(props, 'backgroundColor').listen();

    gui.reset();
    gui.add(props, 'reset');
  }

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      renderer.dispose();
      if (document.body.contains(renderer.domElement))
        document.body.removeChild(renderer.domElement);
      if (document.body.contains(stats.dom))
        document.body.removeChild(stats.dom);
      window.removeEventListener('resize', onWindowResize);

      const nextMemory: Memory = {
        startTime: memory.startTime,
        cameraPosition: camera.position.clone(),
        cameraZoom: camera.zoom,
        orbitTarget: controls.target.clone(),
        backgroundColor: (scene.background as THREE.Color).getHex(),
        ledColor: leds[0].material.color.getHex(),
      };
      import.meta.hot!.data.memory = nextMemory;
    });
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  const currentTime = Date.now();
  const time = (currentTime - memory.startTime) / 1000;

  object.position.y = 0.8;
  object.rotation.x = time * 0.5;
  object.rotation.y = time * 0.2;
  object.scale.setScalar(Math.cos(time) * 0.125 + 0.875);

  stats.begin();
  renderer.render(scene, camera);
  stats.end();
}
