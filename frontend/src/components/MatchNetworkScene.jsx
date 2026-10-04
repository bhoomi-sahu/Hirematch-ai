import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import * as THREE from 'three';

const MatchNetworkScene = () => {
  const canvasRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 9);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);

    const network = new THREE.Group();
    network.position.set(1.8, 0, 0);
    scene.add(network);

    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.76, 2),
      new THREE.MeshStandardMaterial({ color: 0x75d9bb, emissive: 0x17483e, emissiveIntensity: 0.6, metalness: 0.35, roughness: 0.3, wireframe: true, transparent: true, opacity: 0.78 }),
    );
    network.add(core);

    const orbit = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.008, 8, 120), new THREE.MeshBasicMaterial({ color: 0x75d9bb, transparent: true, opacity: 0.33 }));
    orbit.rotation.set(0.92, 0.24, 0.34);
    network.add(orbit);
    const secondOrbit = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.006, 8, 120), new THREE.MeshBasicMaterial({ color: 0xe2a18a, transparent: true, opacity: 0.23 }));
    secondOrbit.rotation.set(1.12, -0.56, -0.4);
    network.add(secondOrbit);

    const points = [
      [-1.56, 0.82, 0.12], [-0.5, 1.72, -0.2], [0.68, 1.44, 0.3],
      [1.62, 0.58, -0.3], [1.48, -0.86, 0.16], [0.36, -1.58, -0.24],
      [-0.96, -1.35, 0.26], [-1.74, -0.36, -0.12], [0.1, 0.08, 1.14],
    ];
    const edges = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0], [1, 8], [3, 8], [5, 8], [7, 8]];
    const linePositions = edges.flatMap(([from, to]) => [...points[from], ...points[to]]);
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    network.add(new THREE.LineSegments(lineGeometry, new THREE.LineBasicMaterial({ color: 0x9acbbd, transparent: true, opacity: 0.2 })));

    points.forEach((position, index) => {
      const color = index % 3 === 0 ? 0xe2a18a : index % 3 === 1 ? 0x75d9bb : 0xd6e4df;
      const node = new THREE.Mesh(
        new THREE.SphereGeometry(index === 8 ? 0.1 : 0.065, 16, 12),
        new THREE.MeshStandardMaterial({ color, emissive: index % 3 === 0 ? 0x572f28 : 0x153b33, emissiveIntensity: 0.35, metalness: 0.2, roughness: 0.3 }),
      );
      node.position.set(...position);
      network.add(node);
    });

    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const keyLight = new THREE.PointLight(0x75d9bb, 18, 12);
    keyLight.position.set(2, 2, 4);
    scene.add(keyLight);

    const resizeObserver = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.position.z = width < 640 ? 11.5 : 9;
      camera.updateProjectionMatrix();
    });
    resizeObserver.observe(canvas.parentElement);

    let frameId;
    const render = (time) => {
      if (!prefersReducedMotion) {
        network.rotation.y = Math.sin(time * 0.00018) * 0.08;
        network.rotation.x = Math.sin(time * 0.00012) * 0.035;
        core.rotation.y = time * 0.00012;
      }
      renderer.render(scene, camera);
      if (!prefersReducedMotion) frameId = window.requestAnimationFrame(render);
    };
    render(0);

    return () => {
      resizeObserver.disconnect();
      window.cancelAnimationFrame(frameId);
      scene.traverse((object) => {
        object.geometry?.dispose();
        if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
        else object.material?.dispose();
      });
      renderer.dispose();
    };
  }, [prefersReducedMotion]);

  return <canvas ref={canvasRef} className="match-network-canvas" aria-hidden="true" />;
};

export default MatchNetworkScene;