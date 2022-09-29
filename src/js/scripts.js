import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as CANNON from "cannon-es";

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Sets the color of the background
renderer.setClearColor(0xfefefe);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(0, 50, 0);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
scene.add(directionalLight);

const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.81, 0) });

// Sets orbit control to move the camera around
const orbit = new OrbitControls(camera, renderer.domElement);

// Camera positioning
camera.position.set(6, 8, 14);
orbit.update();

// Sets the x, y, and z axes with each having a length of 4
const axesHelper = new THREE.AxesHelper(4);
scene.add(axesHelper);

const sphereBodyMat = new CANNON.Material();

const createSphere = () => {
  const sphereGeo = new THREE.SphereGeometry(0.4, 20, 20);
  const sphereMat = new THREE.MeshStandardMaterial({
    color: Math.random() * 0xffffff,
  });
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);

  const sphereBody = new CANNON.Body({
    shape: new CANNON.Sphere(0.4),
    mass: 1,
    material: sphereMat,
  });

  return { mesh: sphere, body: sphereBody };
};

const planeGeo = new THREE.PlaneGeometry(20, 20, 20);
const planeMat = new THREE.MeshStandardMaterial({
  color: 0xccfeff,
});
const planeMesh = new THREE.Mesh(planeGeo, planeMat);
planeMesh.receiveShadow = true;

scene.background = new THREE.Color(0x333333);
scene.add(planeMesh);

const planeBodyMat = new CANNON.Material();

const planeBody = new CANNON.Body({
  shape: new CANNON.Box(new CANNON.Vec3(10, 10, 0.001)),
  type: CANNON.Body.STATIC,
  material: planeBodyMat,
});
planeBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(planeBody);

const contactPlaneSphereMat = new CANNON.ContactMaterial(
  sphereBodyMat,
  planeBodyMat,
  { restitution: 0.25 }
);

world.addContactMaterial(contactPlaneSphereMat);

const raycaster = new THREE.Raycaster();
const mousePosition = new THREE.Vector2();
const intersectionPoint = new THREE.Vector3();
const planeNormal = new THREE.Vector3();
const plane = new THREE.Plane();

document.addEventListener("mousemove", (e) => {
  mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1;
  mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1;
  planeNormal.copy(camera.position).normalize();
  plane.setFromNormalAndCoplanarPoint(planeNormal, scene.position);
  raycaster.setFromCamera(mousePosition, camera);
  raycaster.ray.intersectPlane(plane, intersectionPoint);
});

const meshes = [];

document.addEventListener("click", (e) => {
  const sphere = createSphere();
  scene.add(sphere.mesh);
  sphere.mesh.castShadow = true;
  sphere.mesh.receiveShadow = true;
  world.addBody(sphere.body);

  sphere.body.position = new CANNON.Vec3(
    intersectionPoint.x,
    intersectionPoint.y,
    intersectionPoint.z
  );

  meshes.push(sphere);
});

const step = 1 / 60;
function animate() {
  world.step(step);
  planeMesh.position.copy(planeBody.position);
  planeMesh.quaternion.copy(planeBody.quaternion);
  for (const msh of meshes) {
    msh.mesh.position.copy(msh.body.position);
    msh.mesh.quaternion.copy(msh.body.quaternion);
  }
  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener("resize", function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
