/* ============================================================
   KREOVYA — objet 3D abstrait du Hero (Three.js, sans build)
   Un système de polyèdres imbriqués représentant les couches
   IDÉE / STRATÉGIE / IDENTITÉ / DIGITAL / IMPRESSION / IMPACT.
   Se déconstruit légèrement au scroll pour guider vers la suite.
   ============================================================ */

window.initHeroScene = function initHeroScene(){
  const container = document.getElementById('heroScene');
  if (!container) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (typeof THREE === 'undefined') return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch (e) { return; }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, 7.2);

  function setSize(){
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  container.appendChild(renderer.domElement);

  const group = new THREE.Group();
  scene.add(group);

  const palette = [0x7C2CFF, 0x5B4FE8, 0x176BFF, 0x24C7FF];
  const layers = [];
  const LAYER_COUNT = 5;

  for (let i = 0; i < LAYER_COUNT; i++) {
    const radius = 1.15 + i * 0.34;
    const geo = new THREE.IcosahedronGeometry(radius, 1);
    const edges = new THREE.EdgesGeometry(geo);
    const mat = new THREE.LineBasicMaterial({
      color: palette[i % palette.length],
      transparent: true,
      opacity: 0.55 - i * 0.06,
    });
    const mesh = new THREE.LineSegments(edges, mat);
    mesh.userData.baseRadius = radius;
    mesh.userData.dir = new THREE.Vector3(
      (Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5)
    ).normalize();
    mesh.userData.rotSpeed = 0.02 + i * 0.006;
    mesh.userData.axis = new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize();
    group.add(mesh);
    layers.push(mesh);
  }

  // Coeur lumineux
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.32, 2),
    new THREE.MeshBasicMaterial({ color: 0xF7F8FC, transparent: true, opacity: 0.9 })
  );
  group.add(core);

  // Points en orbite (particules discrètes, pas d'effet "gaming")
  const particleCount = 90;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const r = 2.4 + Math.random() * 1.4;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    positions[i*3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i*3+2] = r * Math.cos(phi);
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMat = new THREE.PointsMaterial({ color: 0x24C7FF, size: 0.028, transparent: true, opacity: 0.55 });
  const particles = new THREE.Points(particleGeo, particleMat);
  group.add(particles);

  setSize();
  window.addEventListener('resize', setSize);

  // Parallaxe souris
  let mx = 0, my = 0, tx = 0, ty = 0;
  window.addEventListener('mousemove', (e) => {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    const r = hero.getBoundingClientRect();
    mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    my = ((e.clientY - r.top) / r.height - 0.5) * 2;
  });

  // Déconstruction au scroll
  let scrollProgress = 0;
  function updateScroll(){
    const hero = document.querySelector('.hero');
    if (!hero) return;
    const rect = hero.getBoundingClientRect();
    const p = 1 - Math.max(0, Math.min(1, (rect.bottom) / (rect.height + window.innerHeight * 0.4)));
    scrollProgress = Math.max(0, Math.min(1, p));
  }
  window.addEventListener('scroll', updateScroll, { passive: true });
  updateScroll();

  // Pause hors-écran pour la performance
  let active = true;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { active = e.isIntersecting; });
  }, { threshold: 0.05 });
  io.observe(container);

  let raf;
  function animate(){
    raf = requestAnimationFrame(animate);
    if (!active) return;

    tx += (mx - tx) * 0.04;
    ty += (my - ty) * 0.04;
    group.rotation.y += 0.0022;
    group.rotation.x = ty * 0.22;
    group.rotation.z = -tx * 0.08 + Math.sin(Date.now()*0.0002)*0.02;
    group.position.x = tx * 0.25;

    layers.forEach((mesh, i) => {
      mesh.rotateOnAxis(mesh.userData.axis, mesh.userData.rotSpeed * 0.016);
      const spread = 1 + scrollProgress * (0.35 + i * 0.16);
      mesh.scale.setScalar(spread);
      mesh.material.opacity = (0.55 - i * 0.06) * (1 - scrollProgress * 0.7);
    });
    group.scale.setScalar(1 + scrollProgress * 0.18);
    particles.rotation.y -= 0.0009;
    particleMat.opacity = 0.55 * (1 - scrollProgress * 0.8);
    core.material.opacity = 0.9 * (1 - scrollProgress * 0.5);

    renderer.render(scene, camera);
  }
  animate();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(raf); } else { animate(); }
  });
};
