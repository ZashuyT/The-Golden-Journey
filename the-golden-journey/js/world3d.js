// ============================================================================
// THE GOLDEN JOURNEY (HÀNH TRÌNH VÀNG SON) — V9.0 4X GRAND SCALE & HIGH-FPS 3D WORLD
// - 4x Larger Hex Tiles (hexRadius = 9.04) & 4x Larger 3D Models with Wide Spacing
// - Well-Spaced POIs (Ports, Monuments, Resources, Reefs) — Zero Crowding
// - Ship Spotlight & Occupied-Tile Fade: When a Ship Enters a Tile, the Tile &
//   Its Model Fade Out while the Ship Scales Up & Glows Prominently
// - Ultra-Smooth Anti-Lag Performance (No Per-Frame 12k Vertex Normals, No 4K
//   Shadow Map Overhead, Fast Pickable Raycasting & Throttled Hover)
// ============================================================================

const WORLD_SCALE_4X = 4.0;

class World3D {
    constructor(containerId, onHexClickCallback, onHexHoverCallback) {
        this.container = document.getElementById(containerId);
        this.onHexClick = onHexClickCallback;
        this.onHexHover = onHexHoverCallback;

        // 4x larger than previous 2.26 -> 9.04!
        this.hexRadius = 2.26 * WORLD_SCALE_4X;
        this.hexTiles = [];
        this.hexMap = new Map(); // "q,r" -> tileObj
        this.pickableMeshes = [];
        this.shipMeshes = new Map(); // shipKey -> THREE.Group
        this.floatingEffects = [];
        this.animatedLandProps = [];
        this.fairSpawnAnchors = [];
        this.activeNPCTile = null;

        this.cloudsVisible = true;
        this.minimalistMode = false;
        this.cameraLockEnabled = false;
        this.cameraLockShipKey = null;
        this.weatherMode = "sunny";

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hoveredHex = null;
        this.reachablePaths = new Map(); // "q,r" -> { steps, path: [tile, ...] }

        this.clock = new THREE.Clock();
        this.initScene();
        this.initAtmosphereAndWeather();
        this.initOcean();
        this.initEvents();
    }

    static getPlayerShipKey(player, fallbackIdx = 0) {
        if (!player) return `ship_${fallbackIdx}`;
        if (player.shipKey) return String(player.shipKey);
        if (player.clientId) return `client_${player.clientId}`;
        if (player.seatIndex !== undefined && player.seatIndex !== null) return `seat_${player.seatIndex}`;
        return `id_${player.id !== undefined ? player.id : fallbackIdx}`;
    }

    initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x18384e);
        this.scene.fog = new THREE.FogExp2(0x18384e, 0.00055);

        const w = this.container.clientWidth || window.innerWidth;
        const h = this.container.clientHeight || window.innerHeight;

        this.camera = new THREE.PerspectiveCamera(42, w / h, 2.0, 3200);
        // Closer relative camera view so the 4x hexes and models look huge and spacious on screen
        this.camera.position.set(36, 175, 145);

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(w, h);
        // Capped at 1.25 for silky-smooth FPS without GPU fillrate lag
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
        this.renderer.shadowMap.enabled = false;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.96;
        this.container.innerHTML = "";
        this.container.appendChild(this.renderer.domElement);

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.enablePan = false; // Panning is controlled via W A S D keys
        this.controls.mouseButtons = {
            LEFT: -1, // Left mouse button is reserved for selecting hexes & custom path drawing
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.ROTATE // Right mouse button rotates camera view
        };
        this.controls.maxPolarAngle = Math.PI / 2.18;
        this.controls.minPolarAngle = Math.PI / 11;
        this.controls.minDistance = 40;
        this.controls.maxDistance = 760;
        this.controls.target.set(0, 0, 8);

        // Soft, Eye-Friendly Natural Daylight (No Heavy Shadow Map Overhead)
        this.hemiLight = new THREE.HemisphereLight(0xf4f1ea, 0x1e3f5a, 0.88);
        this.hemiLight.position.set(0, 320, 0);
        this.scene.add(this.hemiLight);

        this.sunLight = new THREE.DirectionalLight(0xfff6e5, 1.08);
        this.sunLight.position.set(180, 320, 160);
        this.sunLight.castShadow = false;
        this.scene.add(this.sunLight);

        this.rimLight = new THREE.DirectionalLight(0x7dd3fc, 0.25);
        this.rimLight.position.set(-180, 140, -150);
        this.scene.add(this.rimLight);

        this.boardGroup = new THREE.Group();
        this.scene.add(this.boardGroup);

        this.pathPreviewGroup = new THREE.Group();
        this.scene.add(this.pathPreviewGroup);

        this.effectsGroup = new THREE.Group();
        this.scene.add(this.effectsGroup);
    }

    initAtmosphereAndWeather() {
        this.weatherGroup = new THREE.Group();
        this.scene.add(this.weatherGroup);

        this.clouds = [];
        const cloudMat = new THREE.MeshStandardMaterial({
            color: 0xf1f5f9,
            roughness: 0.92,
            transparent: true,
            opacity: 0.30
        });

        // 5 lightweight outer clouds
        for (let i = 0; i < 5; i++) {
            const cGroup = new THREE.Group();
            for (let p = 0; p < 2; p++) {
                const puffGeo = new THREE.DodecahedronGeometry((1.3 + p * 0.4) * WORLD_SCALE_4X, 0);
                puffGeo.scale(1.4, 0.45, 1.0);
                const puff = new THREE.Mesh(puffGeo, cloudMat);
                puff.position.set((p - 0.5) * 1.4 * WORLD_SCALE_4X, 0, 0);
                cGroup.add(puff);
            }
            const sideZ = (i % 2 === 0 ? 1 : -1) * (150 + i * 25);
            cGroup.position.set((i - 2) * 90, 98 + (i % 2) * 12, sideZ);
            cGroup.visible = this.cloudsVisible;
            this.weatherGroup.add(cGroup);
            this.clouds.push({
                mesh: cGroup,
                speed: (0.35 + (i % 3) * 0.12) * WORLD_SCALE_4X
            });
        }
        this.cloudMaterial = cloudMat;

        const starCount = 160;
        const starGeo = new THREE.BufferGeometry();
        const starPos = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount; i++) {
            starPos[i * 3] = (Math.random() - 0.5) * 850;
            starPos[i * 3 + 1] = 16 + Math.random() * 180;
            starPos[i * 3 + 2] = (Math.random() - 0.5) * 850;
        }
        starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
        this.starField = new THREE.Points(
            starGeo,
            new THREE.PointsMaterial({ color: 0xfde68a, size: 1.4, transparent: true, opacity: 0.0 })
        );
        this.weatherGroup.add(this.starField);

        // Lightweight Rain Particle Field (240 drops instead of 900)
        const rainCount = 240;
        const rainGeo = new THREE.BufferGeometry();
        const rainPos = new Float32Array(rainCount * 3);
        for (let i = 0; i < rainCount; i++) {
            rainPos[i * 3] = (Math.random() - 0.5) * 650;
            rainPos[i * 3 + 1] = Math.random() * 160;
            rainPos[i * 3 + 2] = (Math.random() - 0.5) * 650;
        }
        rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPos, 3));
        this.rainField = new THREE.Points(
            rainGeo,
            new THREE.PointsMaterial({ color: 0xbae6fd, size: 1.1, transparent: true, opacity: 0.0 })
        );
        this.weatherGroup.add(this.rainField);
    }

    toggleClouds() {
        this.cloudsVisible = !this.cloudsVisible;
        if (this.clouds) {
            this.clouds.forEach(c => {
                if (c.mesh) c.mesh.visible = this.cloudsVisible;
            });
        }
        return this.cloudsVisible;
    }

    toggleMinimalistMode() {
        this.minimalistMode = !this.minimalistMode;
        this.applyMinimalistMode();
        return this.minimalistMode;
    }

    applyMinimalistMode() {
        const showExtra = !this.minimalistMode;
        if (this.sceneryGroup) {
            this.sceneryGroup.visible = showExtra;
        }
    }

    setCameraLockTarget(player = null) {
        if (player) {
            this.cameraLockShipKey = World3D.getPlayerShipKey(player);
        }
    }

    toggleCameraLock(player = null) {
        if (player) {
            this.cameraLockShipKey = World3D.getPlayerShipKey(player);
        }
        this.cameraLockEnabled = !this.cameraLockEnabled;
        if (this.cameraLockEnabled && this.cameraLockShipKey) {
            const shipMesh = this.shipMeshes.get(this.cameraLockShipKey);
            if (shipMesh) {
                const offset = this.camera.position.clone().sub(this.controls.target);
                this.controls.target.set(shipMesh.position.x, 0, shipMesh.position.z);
                this.camera.position.copy(this.controls.target).add(offset);
            }
        }
        return this.cameraLockEnabled;
    }

    setWeatherMode(mode) {
        const validModes = new Set(["sunny", "tropical_rain", "thunderstorm", "sunset", "night", "super_typhoon_yagi"]);
        const validMode = validModes.has(mode) ? mode : "sunny";
        this.weatherMode = validMode;
        const presets = {
            sunny: {
                bg: 0x18384e, fog: 0x18384e, hemiSky: 0xf4f1ea, hemiGround: 0x1e3f5a, hemiInt: 0.88,
                sunCol: 0xfff6e5, sunInt: 1.08, sunPos: [180, 320, 160], cloudCol: 0xf1f5f9, cloudOp: 0.30,
                waveAmp: 0.70, starsOp: 0.0, rainOp: 0.0
            },
            tropical_rain: {
                bg: 0x1c3142, fog: 0x1c3142, hemiSky: 0x94a3b8, hemiGround: 0x0f172a, hemiInt: 0.74,
                sunCol: 0xcbd5e1, sunInt: 0.86, sunPos: [120, 280, 100], cloudCol: 0x64748b, cloudOp: 0.42,
                waveAmp: 0.90, starsOp: 0.0, rainOp: 0.48
            },
            thunderstorm: {
                bg: 0x121f2e, fog: 0x121f2e, hemiSky: 0x64748b, hemiGround: 0x09111c, hemiInt: 0.62,
                sunCol: 0x93c5fd, sunInt: 0.72, sunPos: [80, 260, 80], cloudCol: 0x475569, cloudOp: 0.48,
                waveAmp: 1.10, starsOp: 0.12, rainOp: 0.62
            },
            sunset: {
                bg: 0x2d1e28, fog: 0x38242e, hemiSky: 0xf3c6b6, hemiGround: 0x1f2438, hemiInt: 0.78,
                sunCol: 0xe89b6c, sunInt: 1.05, sunPos: [-180, 130, 140], cloudCol: 0xf5d0b5, cloudOp: 0.35,
                waveAmp: 0.72, starsOp: 0.30, rainOp: 0.0
            },
            night: {
                bg: 0x0c1826, fog: 0x0c1826, hemiSky: 0x5c8ab5, hemiGround: 0x0c1624, hemiInt: 0.58,
                sunCol: 0x93c5fd, sunInt: 0.72, sunPos: [-120, 220, -120], cloudCol: 0x334155, cloudOp: 0.25,
                waveAmp: 0.65, starsOp: 0.75, rainOp: 0.0
            },
            super_typhoon_yagi: {
                bg: 0x1c1018, fog: 0x24131d, hemiSky: 0xd97788, hemiGround: 0x0e080c, hemiInt: 0.64,
                sunCol: 0xe2a8b4, sunInt: 0.78, sunPos: [40, 240, 60], cloudCol: 0x4c1d2e, cloudOp: 0.50,
                waveAmp: 1.25, starsOp: 0.08, rainOp: 0.70
            }
        };

        const p = presets[validMode] || presets.sunny;
        this.scene.background.setHex(p.bg);
        this.scene.fog.color.setHex(p.fog);
        this.hemiLight.color.setHex(p.hemiSky);
        this.hemiLight.groundColor.setHex(p.hemiGround);
        this.hemiLight.intensity = p.hemiInt;
        this.sunLight.color.setHex(p.sunCol);
        this.sunLight.intensity = p.sunInt;
        this.sunLight.position.set(...p.sunPos);
        this.cloudMaterial.color.setHex(p.cloudCol);
        this.cloudMaterial.opacity = p.cloudOp;
        this.starField.material.opacity = p.starsOp;
        if (this.rainField) {
            this.rainField.material.opacity = p.rainOp || 0.0;
        }
        this.waveMultiplier = p.waveAmp;
    }

    initOcean() {
        this.waveMultiplier = 0.70;
        // Ultra-fast 2x2 plane (Zero per-frame CPU vertex deformation or normal recalculation!)
        const oceanGeo = new THREE.PlaneGeometry(2400, 2400, 2, 2);
        oceanGeo.rotateX(-Math.PI / 2);

        const oceanMat = new THREE.MeshStandardMaterial({
            color: 0x1c4660,
            emissive: 0x0b2233,
            emissiveIntensity: 0.12,
            roughness: 0.56,
            metalness: 0.12
        });

        this.oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
        this.oceanMesh.position.y = -0.20 * WORLD_SCALE_4X;
        this.scene.add(this.oceanMesh);

        this.foamRings = [];
        this.initAmbientOceanScenery();
    }

    initAmbientOceanScenery() {
        this.sceneryGroup = new THREE.Group();
        this.scene.add(this.sceneryGroup);

        // 4 Static Distant Karst Outcrops on the outer horizon (zero per-frame CPU cost)
        const karstLocations = [
            { x: 66 * WORLD_SCALE_4X, z: -44 * WORLD_SCALE_4X, scale: 1.35, rot: 0.4 },
            { x: 70 * WORLD_SCALE_4X, z: 8 * WORLD_SCALE_4X, scale: 1.30, rot: 0.9 },
            { x: 62 * WORLD_SCALE_4X, z: 50 * WORLD_SCALE_4X, scale: 1.35, rot: 2.8 },
            { x: -54 * WORLD_SCALE_4X, z: -36 * WORLD_SCALE_4X, scale: 1.30, rot: 0.8 }
        ];
        karstLocations.forEach(kl => {
            const kMesh = ProceduralModels.createDistantKarstOutcrop(kl.scale);
            kMesh.position.set(kl.x, -0.18 * WORLD_SCALE_4X, kl.z);
            kMesh.rotation.y = kl.rot;
            this.sceneryGroup.add(kMesh);
        });
    }

    axialToWorld(q, r) {
        // 1.15 spacing factor creates a generous, clean gap between all 4x hexes so models never feel cramped!
        const size = this.hexRadius * 1.15;
        const x = size * Math.sqrt(3) * (q + r / 2);
        const z = size * (3 / 2) * r;
        return { x, z };
    }

    static hexDistance(a, b) {
        return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
    }

    getVietnamLandRowSpec(r) {
        const table = {
            "-14": { minCol: -2, maxCol: 2,  getReg: () => 0 },
            "-13": { minCol: -4, maxCol: 3,  getReg: () => 0 },
            "-12": { minCol: -5, maxCol: 3,  getReg: () => 0 },
            "-11": { minCol: -5, maxCol: 2,  getReg: (c) => (c >= -1 ? 1 : 0) },
            "-10": { minCol: -5, maxCol: 2,  getReg: (c) => (c >= -2 ? 1 : 0) },
            "-9":  { minCol: -4, maxCol: 1,  getReg: (c) => (c >= -3 ? 1 : 0) },
            "-8":  { minCol: -4, maxCol: 0,  getReg: () => 1 },

            "-7":  { minCol: -5, maxCol: -1, getReg: () => 2 },
            "-6":  { minCol: -5, maxCol: -2, getReg: () => 2 },
            "-5":  { minCol: -5, maxCol: -2, getReg: () => 2 },
            "-4":  { minCol: -4, maxCol: -1, getReg: () => 2 },
            "-3":  { minCol: -3, maxCol: 0,  getReg: () => 2 },
            "-2":  { minCol: -2, maxCol: 2,  getReg: () => 2 },

            "-1":  { minCol: -1, maxCol: 2,  getReg: (c) => (c <= 0 ? 3 : 2) },
            "0":   { minCol: -1, maxCol: 3,  getReg: (c) => (c <= 1 ? 3 : 2) },
            "1":   { minCol: 0,  maxCol: 4,  getReg: (c) => (c <= 2 ? 3 : 2) },
            "2":   { minCol: 0,  maxCol: 4,  getReg: (c) => (c <= 2 ? 3 : 2) },
            "3":   { minCol: -1, maxCol: 3,  getReg: (c) => (c <= 1 ? 3 : 2) },
            "4":   { minCol: -1, maxCol: 2,  getReg: (c) => (c <= 0 ? 3 : 2) },

            "5":   { minCol: -3, maxCol: 1,  getReg: (c) => (c <= 0 ? 4 : 2) },
            "6":   { minCol: -4, maxCol: 0,  getReg: () => 4 },
            "7":   { minCol: -5, maxCol: 0,  getReg: () => 4 },

            "8":   { minCol: -6, maxCol: -1, getReg: (c) => (c >= -2 ? 4 : 5) },
            "9":   { minCol: -7, maxCol: -2, getReg: () => 5 },
            "10":  { minCol: -8, maxCol: -2, getReg: () => 5 },
            "11":  { minCol: -8, maxCol: -3, getReg: () => 5 },
            "12":  { minCol: -8, maxCol: -4, getReg: () => 5 },
            "13":  { minCol: -8, maxCol: -5, getReg: () => 5 },
            "14":  { minCol: -7, maxCol: -5, getReg: () => 5 }
        };
        return table[String(r)] || { minCol: -2, maxCol: 1, getReg: () => 2 };
    }

    buildBoard(monumentAssignments) {
        while (this.boardGroup.children.length > 0) {
            this.boardGroup.remove(this.boardGroup.children[0]);
        }
        this.hexTiles = [];
        this.hexMap.clear();
        this.pickableMeshes = [];
        this.animatedLandProps = [];
        this.fairSpawnAnchors = [];
        this.activeNPCTile = null;

        // 5 Balanced Starting Anchorages along the S-Shaped Sea Lane
        const spawnAnchorKeys = new Set([
            "-10,7", // Anchor 1 (Vịnh Bắc Bộ)
            "-5,4",  // Anchor 2 (Bắc Trung Bộ)
            "0,7",   // Anchor 3 (Duyên hải Miền Trung – Tây Nguyên)
            "6,5",   // Anchor 4 (Đông Nam Bộ)
            "11,2"   // Anchor 5 (Đồng bằng Sông Cửu Long)
        ]);

        // WELL-SPACED POIs across a wider sea expanse (col up to 12):
        // Every Monument (9), Trading Port (6), Resource Node (15), Reef (6), and Archipelago (2)
        // is separated by open water hexes so NO two 3D models sit bunched up next to each other!
        const specialPlacements = {
            // 1. TRUNG DU & MIỀN NÚI BẮC BỘ (Region 0)
            "-14,3":  { terrain: "coast", monumentId: "mon_sapa", regionId: 0, navigable: true },
            "-14,7":  { terrain: "sea", resourceType: "iron", regionId: 0, navigable: true },
            "-13,11": { terrain: "sea", resourceType: "food", regionId: 0, navigable: true, isOffshore: true },
            "-12,5":  { terrain: "coast", isPort: true, portName: "Thương Cảng Cái Lân (Quảng Ninh)", regionId: 0, navigable: true },
            "-12,9":  { terrain: "reef", isReef: true, regionId: 0, navigable: true },
            "-11,3":  { terrain: "island", monumentId: "mon_halong", regionId: 0, navigable: true },
            "-11,12": { terrain: "sea", resourceType: "wood", regionId: 0, navigable: true, isOffshore: true },

            // 2. ĐỒNG BẰNG SÔNG HỒNG (Region 1)
            "-9,2":   { terrain: "coast", monumentId: "mon_vanmieu", regionId: 1, navigable: true },
            "-9,6":   { terrain: "sea", resourceType: "food", regionId: 1, navigable: true },
            "-9,10":  { terrain: "sea", resourceType: "iron", regionId: 1, navigable: true, isOffshore: true },
            "-8,4":   { terrain: "reef", isReef: true, regionId: 1, navigable: true },
            "-7,1":   { terrain: "coast", isPort: true, portName: "Thương Cảng Hải Phòng", regionId: 1, navigable: true },
            "-7,8":   { terrain: "sea", resourceType: "wood", regionId: 1, navigable: true, isOffshore: true },

            // 3. BẮC TRUNG BỘ & DUYÊN HẢI MIỀN TRUNG (Region 2)
            "-5,-1":  { terrain: "coast", monumentId: "mon_phongnha", regionId: 2, navigable: true },
            "-5,7":   { terrain: "sea", resourceType: "iron", regionId: 2, navigable: true },
            "-5,11":  { terrain: "sea", resourceType: "food", regionId: 2, navigable: true, isOffshore: true },
            "-4,2":   { terrain: "reef", isReef: true, regionId: 2, navigable: true },
            "-3,1":   { terrain: "coast", monumentId: "mon_hue", regionId: 2, navigable: true },
            "-3,9":   { terrain: "archipelago", archipelagoName: "QUẦN ĐẢO HOÀNG SA", archipelagoSub: "TP. Đà Nẵng • Chủ Quyền Việt Nam", regionId: 2, navigable: false },
            "-2,4":   { terrain: "coast", isPort: true, portName: "Thương Cảng Tiên Sa (Đà Nẵng)", regionId: 2, navigable: true },
            "-1,3":   { terrain: "coast", monumentId: "mon_myson", regionId: 2, navigable: true },
            "-1,7":   { terrain: "sea", resourceType: "wood", regionId: 2, navigable: true },

            // 4. TÂY NGUYÊN & LIÊN KẾT NAM TRUNG BỘ (Region 3)
            "1,5":    { terrain: "coast", isPort: true, portName: "Thương Cảng Liên Vùng Tây Nguyên – Quy Nhơn", regionId: 3, navigable: true },
            "1,10":   { terrain: "sea", resourceType: "wood", regionId: 3, navigable: true, isOffshore: true },
            "2,8":    { terrain: "reef", isReef: true, regionId: 3, navigable: true },
            "3,4":    { terrain: "coast", monumentId: "mon_taynguyen", regionId: 3, navigable: true },
            "4,7":    { terrain: "sea", resourceType: "food", regionId: 3, navigable: true },
            "4,11":   { terrain: "sea", resourceType: "iron", regionId: 3, navigable: true, isOffshore: true },

            // 5. ĐÔNG NAM BỘ (Region 4)
            "5,3":    { terrain: "reef", isReef: true, regionId: 4, navigable: true },
            "6,2":    { terrain: "coast", isPort: true, portName: "Thương Cảng Quốc Tế Cái Mép – Sài Gòn", regionId: 4, navigable: true },
            "6,9":    { terrain: "sea", resourceType: "food", regionId: 4, navigable: true, isOffshore: true },
            "8,0":    { terrain: "coast", monumentId: "mon_bennharong", regionId: 4, navigable: true },
            "8,4":    { terrain: "sea", resourceType: "iron", regionId: 4, navigable: true },
            "8,10":   { terrain: "archipelago", archipelagoName: "QUẦN ĐẢO TRƯỜNG SA", archipelagoSub: "Tỉnh Khánh Hòa • Chủ Quyền Việt Nam", regionId: 4, navigable: false },

            // 6. ĐỒNG BẰNG SÔNG CỬU LONG (Region 5)
            "10,-1":  { terrain: "coast", monumentId: "mon_cairang", regionId: 5, navigable: true },
            "10,4":   { terrain: "reef", isReef: true, regionId: 5, navigable: true },
            "11,7":   { terrain: "sea", resourceType: "wood", regionId: 5, navigable: true, isOffshore: true },
            "12,-3":  { terrain: "coast", isPort: true, portName: "Thương Cảng Cần Thơ – Cửu Long", regionId: 5, navigable: true },
            "13,-1":  { terrain: "coast", resourceType: "food", regionId: 5, navigable: true }
        };

        const layoutSpec = [];
        for (let r = -14; r <= 14; r++) {
            const rowSpec = this.getVietnamLandRowSpec(r);
            const qCenterOffset = -Math.floor(r / 2);

            const minSeaCol = rowSpec.minCol - 1;
            const maxSeaCol = 12;

            for (let col = minSeaCol; col <= maxSeaCol; col++) {
                const q = qCenterOffset + col;
                const key = `${r},${col}`;
                const custom = specialPlacements[key];
                const isSpawnAnchor = spawnAnchorKeys.has(key);
                const regId = custom && custom.regionId !== undefined
                    ? custom.regionId
                    : rowSpec.getReg(col);

                if (isSpawnAnchor) {
                    this.fairSpawnAnchors.push({ q, r, col, regionId: regId });
                }

                if (col >= rowSpec.minCol && col <= rowSpec.maxCol) {
                    let mainTerrain = "delta_land";
                    if (regId === 0) mainTerrain = "mountain";
                    else if (regId === 1) mainTerrain = "delta_land";
                    else if (regId === 2) mainTerrain = (col === rowSpec.minCol && r <= -3) ? "mountain" : "coast_land";
                    else if (regId === 3) mainTerrain = "highland";
                    else if (regId === 4) mainTerrain = "southeast_land";
                    else mainTerrain = "delta_land";

                    layoutSpec.push({
                        q,
                        r,
                        col,
                        maxLandCol: rowSpec.maxCol,
                        regionId: regId,
                        terrain: mainTerrain,
                        navigable: false
                    });
                } else if (custom) {
                    layoutSpec.push({
                        q,
                        r,
                        col,
                        maxLandCol: rowSpec.maxCol,
                        regionId: regId,
                        terrain: custom.terrain,
                        navigable: custom.navigable !== false,
                        isReef: !!custom.isReef || custom.terrain === "reef",
                        isOffshore: !!custom.isOffshore,
                        monumentId: custom.monumentId || null,
                        isPort: !!custom.isPort,
                        portName: custom.portName || null,
                        resourceType: custom.resourceType || null,
                        archipelagoName: custom.archipelagoName || null,
                        archipelagoSub: custom.archipelagoSub || null,
                        isSpawnRim: isSpawnAnchor
                    });
                } else {
                    const isCoastalWater = (col === rowSpec.maxCol + 1 || col === rowSpec.minCol - 1);
                    layoutSpec.push({
                        q,
                        r,
                        col,
                        maxLandCol: rowSpec.maxCol,
                        regionId: regId,
                        terrain: isCoastalWater ? "coast" : "sea",
                        navigable: true,
                        isSpawnRim: isSpawnAnchor
                    });
                }
            }
        }

        layoutSpec.forEach((spec, idx) => {
            const tile = this.createHexTile(spec, idx, monumentAssignments);
            this.hexTiles.push(tile);
            this.hexMap.set(`${spec.q},${spec.r}`, tile);
            this.boardGroup.add(tile.group);
        });

        this.buildRegionBanners();
        this.applyMinimalistMode();
    }

    buildRegionBanners() {
        const regionBanners = [
            { r: -13, col: -2, line1: "1. TRUNG DU &", line2: "MIỀN NÚI BẮC BỘ", color: "#4d7c5b" },
            { r: -10, col: -2, line1: "2. ĐỒNG BẰNG", line2: "SÔNG HỒNG", color: "#d4a84f" },
            { r: -5,  col: -3, line1: "3. DUYÊN HẢI", line2: "MIỀN TRUNG", color: "#5b8291" },
            { r: 2,   col: 1,  line1: "4. TÂY NGUYÊN", line2: "CAO NGUYÊN BAZAN", color: "#9e6240" },
            { r: 6,   col: -2, line1: "5. ĐÔNG NAM BỘ", line2: "ĐẦU TÀU KINH TẾ", color: "#8f4850" },
            { r: 11,  col: -6, line1: "6. ĐỒNG BẰNG", line2: "SÔNG CỬU LONG", color: "#6d9958" }
        ];
        regionBanners.forEach(rb => {
            const q = -Math.floor(rb.r / 2) + rb.col;
            const { x, z } = this.axialToWorld(q, rb.r);
            const sprite = ProceduralModels.createRegionBannerSprite(rb.line1, rb.line2, rb.color, 2.35, 0.58);
            sprite.position.set(x, 1.85 * WORLD_SCALE_4X, z);
            this.boardGroup.add(sprite);
        });

        const compass = ProceduralModels.createTabletopCompassAndTitlePlaque();
        this.boardGroup.add(compass);
    }

    createHexTile(spec, index, monumentAssignments) {
        const region = window.GAME_DATA.regions[spec.regionId];
        const { x, z } = this.axialToWorld(spec.q, spec.r);
        const group = new THREE.Group();
        group.position.set(x, 0, z);

        const tileSeed = Math.abs((spec.q * 49297) ^ (spec.r * 9301));
        const jitter = ProceduralModels.seededRandom(tileSeed);

        let unitHeight = 0.22;
        let topColor = new THREE.Color(region.color);

        if (spec.terrain === "sea") {
            unitHeight = 0.14;
            const seaDist = Math.max(1, (spec.col || 0) - (spec.maxLandCol !== undefined ? spec.maxLandCol : 0));
            if (spec.isSpawnRim) {
                topColor = new THREE.Color(0x2a6680);
            } else if (seaDist <= 2) {
                topColor = new THREE.Color(0x265875);
            } else if (seaDist <= 4) {
                topColor = new THREE.Color(0x22506b);
            } else {
                topColor = new THREE.Color(0x1e4760);
            }
        } else if (spec.terrain === "coast") {
            unitHeight = 0.18;
            topColor = new THREE.Color(0x2b667d).lerp(new THREE.Color(region.color), 0.18);
        } else if (spec.terrain === "river_channel") {
            unitHeight = 0.18;
            topColor = new THREE.Color(0x2d6d86);
        } else if (spec.terrain === "reef") {
            unitHeight = 0.20;
            topColor = new THREE.Color(0x273545);
        } else if (spec.terrain === "archipelago") {
            unitHeight = 0.34;
            topColor = new THREE.Color(0x2e6b68);
        } else if (spec.terrain === "mountain") {
            unitHeight = 0.56 + jitter * 0.16;
            topColor.offsetHSL(0, (jitter - 0.5) * 0.03, (jitter - 0.5) * 0.03);
        } else if (spec.terrain === "highland") {
            unitHeight = 0.48 + jitter * 0.12;
            topColor.offsetHSL(0, (jitter - 0.5) * 0.03, (jitter - 0.5) * 0.03);
        } else if (spec.terrain === "southeast_land") {
            unitHeight = 0.40 + jitter * 0.08;
        } else if (spec.terrain === "coast_land") {
            unitHeight = 0.36 + jitter * 0.06;
        } else if (spec.terrain === "delta_land") {
            unitHeight = 0.32 + jitter * 0.05;
        } else if (spec.terrain === "island") {
            unitHeight = 0.30;
        } else {
            unitHeight = 0.26;
        }

        const height = unitHeight * WORLD_SCALE_4X;
        const isWaterHex = (spec.terrain === "sea" || spec.terrain === "coast" || spec.terrain === "river_channel");
        const defaultBaseOpacity = spec.terrain === "sea" ? 0.36 : (isWaterHex ? 0.52 : 1.0);

        // Single Lightweight Cylinder per Hex (0.90 * hexRadius leaves a clean channel between hexes!)
        const hexGeo = new THREE.CylinderGeometry(this.hexRadius * 0.88, this.hexRadius * 0.92, height, 6);
        const hexMat = new THREE.MeshStandardMaterial({
            color: topColor,
            roughness: isWaterHex ? 0.48 : 0.72,
            metalness: isWaterHex ? 0.14 : 0.05,
            transparent: true,
            opacity: defaultBaseOpacity
        });

        const baseMesh = new THREE.Mesh(hexGeo, hexMat);
        baseMesh.position.y = height / 2 - 0.1 * WORLD_SCALE_4X;
        group.add(baseMesh);
        this.pickableMeshes.push(baseMesh);

        const defaultRimOpacity = isWaterHex ? 0.04 : 0.20;
        const rimGeo = new THREE.RingGeometry(this.hexRadius * 0.82, this.hexRadius * 0.88, 6);
        rimGeo.rotateX(-Math.PI / 2);
        rimGeo.rotateZ(Math.PI / 6);
        const rimColor = spec.terrain === "reef" ? new THREE.Color(0x64748b) : new THREE.Color(region.color);
        const rimMat = new THREE.MeshBasicMaterial({
            color: rimColor,
            transparent: true,
            opacity: defaultRimOpacity,
            side: THREE.DoubleSide
        });
        const rimMesh = new THREE.Mesh(rimGeo, rimMat);
        rimMesh.position.y = height - 0.09 * WORLD_SCALE_4X;
        group.add(rimMesh);

        const hlGeo = new THREE.RingGeometry(this.hexRadius * 0.78, this.hexRadius * 0.90, 6);
        hlGeo.rotateX(-Math.PI / 2);
        hlGeo.rotateZ(Math.PI / 6);
        const hlMat = new THREE.MeshBasicMaterial({
            color: 0x6ee7b7,
            transparent: true,
            opacity: 0.0,
            side: THREE.DoubleSide
        });
        const highlightRing = new THREE.Mesh(hlGeo, hlMat);
        highlightRing.position.y = height - 0.05 * WORLD_SCALE_4X;
        group.add(highlightRing);

        const surfaceY = height - 0.1 * WORLD_SCALE_4X;

        let reefPropGroup = null;
        if (spec.terrain === "reef" || spec.isReef) {
            reefPropGroup = new THREE.Group();
            reefPropGroup.position.y = surfaceY;
            const reefSub = new THREE.Group();
            reefSub.scale.setScalar(WORLD_SCALE_4X);
            const reefMat = new THREE.MeshStandardMaterial({ color: 0x3b4959, roughness: 0.82, metalness: 0.12 });
            [[-0.48, -0.32, 0.46], [-0.20, -0.46, 0.36]].forEach(([rx, rz, h]) => {
                const spire = new THREE.Mesh(new THREE.ConeGeometry(0.24, h, 5), reefMat);
                spire.position.set(rx, h / 2, rz);
                reefSub.add(spire);
            });
            const warnRingGeo = new THREE.RingGeometry(0.48, 0.68, 14);
            warnRingGeo.rotateX(-Math.PI / 2);
            const warnRing = new THREE.Mesh(
                warnRingGeo,
                new THREE.MeshBasicMaterial({ color: 0xe06c75, transparent: true, opacity: 0.38, side: THREE.DoubleSide })
            );
            warnRing.position.set(-0.35, 0.03, -0.35);
            reefSub.add(warnRing);
            reefPropGroup.add(reefSub);
            group.add(reefPropGroup);
        } else if (!spec.navigable) {
            if (spec.terrain === "archipelago" && spec.archipelagoName) {
                const archModel = ProceduralModels.createSovereigntyArchipelago(
                    spec.archipelagoName,
                    spec.archipelagoSub || "Chủ Quyền Biển Đảo Việt Nam"
                );
                archModel.position.y = surfaceY;
                group.add(archModel);
            } else {
                const landDiorama = ProceduralModels.createLandHexDiorama(spec, surfaceY, this.animatedLandProps);
                group.add(landDiorama);
            }
        } else if (spec.isSpawnRim) {
            const buoy = ProceduralModels.createStartingAnchorBuoy();
            buoy.position.y = surfaceY;
            group.add(buoy);
        }

        const tileObj = {
            index,
            q: spec.q,
            r: spec.r,
            x,
            z,
            height,
            defaultBaseOpacity,
            defaultRimOpacity,
            regionId: spec.regionId,
            region,
            terrain: spec.terrain,
            navigable: spec.navigable !== false,
            isReef: !!spec.isReef || spec.terrain === "reef",
            isOffshore: !!spec.isOffshore,
            isSpawnRim: !!spec.isSpawnRim,
            isPort: !!spec.isPort,
            portName: spec.portName || null,
            resourceType: spec.resourceType || null,
            resourceCooldown: 0,
            stormRestricted: false,
            stormRestrictGroup: null,
            monumentId: spec.monumentId || null,
            monumentTier: spec.monumentId ? (monumentAssignments[spec.monumentId] || 1) : null,
            monumentLocked: false,
            monumentGlowGroup: null,
            hasNPC: false,
            group,
            baseMesh,
            rimMesh,
            highlightRing,
            propModel: reefPropGroup,
            propMeshes: [],
            labelSprite: null
        };

        baseMesh.userData = { tile: tileObj };
        rimMesh.userData = { tile: tileObj };
        highlightRing.userData = { tile: tileObj };

        if (spec.monumentId) {
            const monData = window.GAME_DATA.monuments.find(m => m.id === spec.monumentId);
            const tier = tileObj.monumentTier;
            const monModel = ProceduralModels.createMonumentModel(monData.modelType, tier);
            monModel.position.y = surfaceY;
            group.add(monModel);
            tileObj.propModel = monModel;

            const tierHexColors = { 1: 0x52b788, 2: 0xe0a943, 3: 0xe06c75 };
            const glowHex = tierHexColors[tier] || 0xe0a943;
            const glowGroup = new THREE.Group();
            glowGroup.position.y = surfaceY;

            const outerHaloGeo = new THREE.RingGeometry(this.hexRadius * 0.80, this.hexRadius * 0.94, 6);
            outerHaloGeo.rotateX(-Math.PI / 2);
            outerHaloGeo.rotateZ(Math.PI / 6);
            const outerHalo = new THREE.Mesh(
                outerHaloGeo,
                new THREE.MeshBasicMaterial({ color: glowHex, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
            );
            outerHalo.position.y = 0.04 * WORLD_SCALE_4X;
            glowGroup.add(outerHalo);

            glowGroup.userData = { outerHalo, baseColor: glowHex };
            group.add(glowGroup);
            tileObj.monumentGlowGroup = glowGroup;

            const tierShortLabel = {
                1: "★ Cấp 1 (Dễ)",
                2: "★★ Cấp 2 (Vừa)",
                3: "★★★ Cấp 3 (Khó)"
            };
            const tierColors = { 1: "#2d7a4d", 2: "#b4781e", 3: "#b83b3b" };
            const sprite = ProceduralModels.createLabelCanvas(
                `🏛️ ${monData.name}`,
                tierShortLabel[tier],
                "rgba(244, 233, 207, 0.94)",
                tierColors[tier],
                2.05,
                0.48
            );
            sprite.position.set(-0.40 * WORLD_SCALE_4X, surfaceY + 1.65 * WORLD_SCALE_4X, -0.36 * WORLD_SCALE_4X);
            group.add(sprite);
            tileObj.labelSprite = sprite;

        } else if (spec.isPort) {
            const portModel = ProceduralModels.createTradePortModel(region.color);
            portModel.position.y = surfaceY;
            group.add(portModel);
            tileObj.propModel = portModel;

            const sprite = ProceduralModels.createLabelCanvas(
                `⚓ ${spec.portName}`,
                `${region.specialty.icon} ${region.specialty.shortName}`,
                "rgba(244, 233, 207, 0.94)",
                region.color,
                2.00,
                0.46
            );
            sprite.position.set(-0.40 * WORLD_SCALE_4X, surfaceY + 1.48 * WORLD_SCALE_4X, -0.36 * WORLD_SCALE_4X);
            group.add(sprite);
            tileObj.labelSprite = sprite;

        } else if (spec.resourceType) {
            const resModel = ProceduralModels.createResourceNodeModel(spec.resourceType);
            resModel.position.y = surfaceY;
            group.add(resModel);
            tileObj.propModel = resModel;
        }

        // Cache propModel meshes so we can smoothly fade the tile's 3D model when a ship enters the tile!
        if (tileObj.propModel) {
            this.cacheTilePropMeshes(tileObj);
        }

        return tileObj;
    }

    cacheTilePropMeshes(tileObj) {
        tileObj.propMeshes = [];
        if (!tileObj.propModel) return;
        tileObj.propModel.traverse(child => {
            if (child.isMesh && child.material) {
                // Clone shared material if needed so fading one tile never fades another tile
                child.material = child.material.clone();
                child.material.userData = child.material.userData || {};
                if (child.material.userData.baseOpacity === undefined) {
                    child.material.userData.baseOpacity = child.material.opacity !== undefined ? child.material.opacity : 1.0;
                }
                child.userData = child.userData || {};
                child.userData.tile = tileObj;
                tileObj.propMeshes.push(child);
                if (tileObj.navigable) {
                    this.pickableMeshes.push(child);
                }
            }
        });
    }

    despawnRareNPC() {
        if (!this.activeNPCTile) return;
        const t = this.activeNPCTile;
        t.hasNPC = false;
        if (t.propModel) {
            t.group.remove(t.propModel);
            t.propModel = null;
            t.propMeshes = [];
        }
        if (t.labelSprite) {
            t.group.remove(t.labelSprite);
            t.labelSprite = null;
        }
        this.activeNPCTile = null;
    }

    spawnRareNPCOnRandomSeaHex() {
        this.despawnRareNPC();
        const seaCandidates = this.hexTiles.filter(t =>
            t.terrain === "sea" &&
            t.navigable &&
            !t.monumentId &&
            !t.isPort &&
            !t.resourceType &&
            !t.isReef &&
            !t.isSpawnRim
        );
        if (seaCandidates.length === 0) return null;

        const chosen = seaCandidates[Math.floor(Math.random() * seaCandidates.length)];
        chosen.hasNPC = true;
        const surfaceY = chosen.height - 0.1 * WORLD_SCALE_4X;

        const npcModel = ProceduralModels.createNPCharacterModel("#5ea8c8", false);
        npcModel.position.set(-0.38 * WORLD_SCALE_4X, surfaceY, -0.34 * WORLD_SCALE_4X);
        chosen.group.add(npcModel);
        chosen.propModel = npcModel;
        this.cacheTilePropMeshes(chosen);

        const sprite = ProceduralModels.createLabelCanvas(
            "🧙‍♂️ Tiên Ông Rìu Vàng",
            "Giải đố +2~3 Xu",
            "rgba(244, 233, 207, 0.94)",
            "#b4781e",
            2.00,
            0.46
        );
        sprite.position.set(-0.38 * WORLD_SCALE_4X, surfaceY + 1.55 * WORLD_SCALE_4X, -0.34 * WORLD_SCALE_4X);
        chosen.group.add(sprite);
        chosen.labelSprite = sprite;

        this.activeNPCTile = chosen;
        this.triggerBurstAnimation(chosen.q, chosen.r, 0xe6c15a, 12);
        return chosen;
    }

    // ------------------------------------------------------------------------
    // PLAYER SHIPS — CLEAR HARBOR BERTH & OCCUPIED-TILE FADE / SHIP SPOTLIGHT
    // ------------------------------------------------------------------------
    getShipDockPositionOnTile(tile, player, playerIdx = 0, totalPlayers = 1) {
        const hasLandmark = Boolean(tile.monumentId || tile.isPort || tile.resourceType || tile.isReef || tile.hasNPC);
        const berthOffsetX = (hasLandmark ? 0.26 : 0) * WORLD_SCALE_4X;
        const berthOffsetZ = (hasLandmark ? 0.24 : 0) * WORLD_SCALE_4X;
        const seatOrIdx = (player && player.seatIndex !== undefined) ? player.seatIndex : playerIdx;
        const angle = (seatOrIdx / Math.max(1, totalPlayers)) * Math.PI * 2;
        const multiRadius = (totalPlayers > 1 ? 0.26 : 0) * WORLD_SCALE_4X;
        return new THREE.Vector3(
            tile.x + berthOffsetX + Math.cos(angle) * multiRadius,
            tile.height + 0.08 * WORLD_SCALE_4X,
            tile.z + berthOffsetZ + Math.sin(angle) * multiRadius
        );
    }

    spawnShips(players, localPlayer = null) {
        this.shipMeshes.forEach(mesh => this.scene.remove(mesh));
        this.shipMeshes.clear();

        const localKey = localPlayer ? World3D.getPlayerShipKey(localPlayer) : null;
        if (localKey) {
            this.cameraLockShipKey = localKey;
        }

        players.forEach((p, idx) => {
            const shipKey = World3D.getPlayerShipKey(p, idx);
            const isLocal = Boolean(localKey && shipKey === localKey);
            const shipMesh = ProceduralModels.createPlayerShip(p.archetypeId, p.name, isLocal);
            shipMesh.userData.shipKey = shipKey;
            shipMesh.userData.playerName = p.name;
            shipMesh.userData.archetypeId = p.archetypeId % 5;
            shipMesh.userData.isLocalPlayer = isLocal;
            shipMesh.userData.lastQ = p.q;
            shipMesh.userData.lastR = p.r;
            shipMesh.visible = !p.eliminated;
            this.scene.add(shipMesh);
            this.shipMeshes.set(shipKey, shipMesh);
            this.placeShipOnHexImmediate(p, p.q, p.r, idx, players.length);
        });
        this.applyMinimalistMode();
    }

    syncShipsSmoothly(players, localPlayer = null) {
        if (this.shipMeshes.size !== players.length) {
            this.spawnShips(players, localPlayer);
            return;
        }

        const localKey = localPlayer ? World3D.getPlayerShipKey(localPlayer) : null;

        const needsRebuild = players.some((p, idx) => {
            const shipKey = World3D.getPlayerShipKey(p, idx);
            const mesh = this.shipMeshes.get(shipKey);
            if (!mesh) return true;
            const isLocal = Boolean(localKey && shipKey === localKey);
            return (
                mesh.userData.playerName !== p.name ||
                mesh.userData.archetypeId !== (p.archetypeId % 5) ||
                mesh.userData.isLocalPlayer !== isLocal
            );
        });

        if (needsRebuild) {
            this.spawnShips(players, localPlayer);
            return;
        }

        players.forEach((p, idx) => {
            const shipKey = World3D.getPlayerShipKey(p, idx);
            const shipMesh = this.shipMeshes.get(shipKey);
            if (!shipMesh) return;
            shipMesh.visible = !p.eliminated;
            if (shipMesh.userData.lastQ !== p.q || shipMesh.userData.lastR !== p.r) {
                shipMesh.userData.lastQ = p.q;
                shipMesh.userData.lastR = p.r;
                const destTile = this.hexMap.get(`${p.q},${p.r}`);
                if (destTile) {
                    this.animateShipAlongPath(p, [destTile], idx, players.length);
                }
            }
        });
    }

    placeShipOnHexImmediate(player, q, r, playerIdx = 0, totalPlayers = 1) {
        const shipKey = World3D.getPlayerShipKey(player, playerIdx);
        const shipMesh = this.shipMeshes.get(shipKey);
        const tile = this.hexMap.get(`${q},${r}`);
        if (!shipMesh || !tile) return;

        shipMesh.userData.lastQ = q;
        shipMesh.userData.lastR = r;
        const dockPos = this.getShipDockPositionOnTile(tile, player, playerIdx, totalPlayers);
        shipMesh.position.copy(dockPos);
    }

    animateShipAlongPath(player, pathTiles, playerIdx = 0, totalPlayers = 1, onComplete = null) {
        const shipKey = World3D.getPlayerShipKey(player, playerIdx);
        const shipMesh = this.shipMeshes.get(shipKey);
        if (!shipMesh || !pathTiles || pathTiles.length === 0) {
            if (onComplete) onComplete();
            return;
        }
        shipMesh.userData.lastQ = player.q;
        shipMesh.userData.lastR = player.r;

        this.clearPathPreview();

        const waypoints = [shipMesh.position.clone()];
        pathTiles.forEach((t, idx) => {
            const isLast = (idx === pathTiles.length - 1);
            if (isLast) {
                waypoints.push(this.getShipDockPositionOnTile(t, player, playerIdx, totalPlayers));
            } else {
                const hasLandmark = Boolean(t.monumentId || t.isPort || t.resourceType || t.isReef || t.hasNPC);
                waypoints.push(new THREE.Vector3(
                    t.x + (hasLandmark ? 0.22 * WORLD_SCALE_4X : 0),
                    t.height + 0.08 * WORLD_SCALE_4X,
                    t.z + (hasLandmark ? 0.20 * WORLD_SCALE_4X : 0)
                ));
            }
        });

        let segIndex = 0;
        const segDuration = 280;

        const runNextSegment = () => {
            if (segIndex >= waypoints.length - 1) {
                if (onComplete) onComplete();
                return;
            }

            const startPos = waypoints[segIndex];
            const endPos = waypoints[segIndex + 1];
            const startRotY = shipMesh.rotation.y;
            const dx = endPos.x - startPos.x;
            const dz = endPos.z - startPos.z;
            let targetRotY = startRotY;
            if (Math.hypot(dx, dz) > 0.02) {
                targetRotY = -Math.atan2(dz, dx);
            }

            let deltaAngle = targetRotY - startRotY;
            while (deltaAngle > Math.PI) deltaAngle -= Math.PI * 2;
            while (deltaAngle < -Math.PI) deltaAngle += Math.PI * 2;

            window.SFX.playSail();
            const segStart = performance.now();

            const step = (now) => {
                const t = Math.min(1, (now - segStart) / segDuration);
                const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

                shipMesh.position.lerpVectors(startPos, endPos, ease);
                shipMesh.rotation.y = startRotY + deltaAngle * Math.min(1, t * 1.65);

                if (shipMesh.userData.mainSail) {
                    const swell = 1.0 + Math.sin(t * Math.PI) * 0.14;
                    shipMesh.userData.mainSail.scale.set(swell, 1.0, swell);
                }

                if (t < 1) {
                    requestAnimationFrame(step);
                } else {
                    if (shipMesh.userData.mainSail) {
                        shipMesh.userData.mainSail.scale.set(1, 1, 1);
                    }
                    segIndex++;
                    runNextSegment();
                }
            };
            requestAnimationFrame(step);
        };

        runNextSegment();
    }

    showPathPreview(pathTiles, isCustomDrawn = false) {
        this.clearPathPreview();
        if (!pathTiles || pathTiles.length === 0) return;

        const accentColor = isCustomDrawn ? 0x6ee7b7 : 0xe6c15a;
        const points = [];
        pathTiles.forEach((t, idx) => {
            const py = t.height + 0.22 * WORLD_SCALE_4X;
            points.push(new THREE.Vector3(t.x, py, t.z));
            const dot = new THREE.Mesh(
                new THREE.SphereGeometry((isCustomDrawn ? 0.22 : 0.16) * WORLD_SCALE_4X, 10, 10),
                new THREE.MeshBasicMaterial({ color: accentColor })
            );
            dot.position.set(t.x, py, t.z);
            this.pathPreviewGroup.add(dot);

            if (idx > 0 || isCustomDrawn) {
                const ringGeo = new THREE.RingGeometry(this.hexRadius * 0.68, this.hexRadius * 0.84, 6);
                ringGeo.rotateX(-Math.PI / 2);
                ringGeo.rotateY(Math.PI / 6);
                const ringMat = new THREE.MeshBasicMaterial({
                    color: accentColor,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: isCustomDrawn ? 0.85 : 0.55
                });
                const ringMesh = new THREE.Mesh(ringGeo, ringMat);
                ringMesh.position.set(t.x, t.height + 0.08 * WORLD_SCALE_4X, t.z);
                this.pathPreviewGroup.add(ringMesh);
            }
        });

        if (points.length >= 2) {
            const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
            const lineMat = new THREE.LineBasicMaterial({ color: accentColor, linewidth: 2 });
            const line = new THREE.Line(lineGeo, lineMat);
            this.pathPreviewGroup.add(line);
        }
    }

    clearPathPreview() {
        while (this.pathPreviewGroup.children.length > 0) {
            this.pathPreviewGroup.remove(this.pathPreviewGroup.children[0]);
        }
    }

    spawnWakeParticle(x, y, z) {
        const geo = new THREE.RingGeometry(0.12 * WORLD_SCALE_4X, 0.28 * WORLD_SCALE_4X, 10);
        geo.rotateX(-Math.PI / 2);
        const mat = new THREE.MeshBasicMaterial({ color: 0xcbd5e1, transparent: true, opacity: 0.45, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y + 0.02 * WORLD_SCALE_4X, z);
        this.effectsGroup.add(mesh);

        this.floatingEffects.push({
            mesh,
            type: "wake",
            birth: performance.now(),
            life: 580
        });
    }

    triggerBurstAnimation(q, r, colorHex = 0xe6c15a, count = 10) {
        const tile = this.hexMap.get(`${q},${r}`);
        if (!tile) return;

        for (let i = 0; i < count; i++) {
            const geo = new THREE.OctahedronGeometry(0.14 * WORLD_SCALE_4X, 0);
            const mat = new THREE.MeshBasicMaterial({
                color: colorHex,
                transparent: true,
                opacity: 0.90
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(tile.x, tile.height + 0.5 * WORLD_SCALE_4X, tile.z);
            this.effectsGroup.add(mesh);

            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
            const speed = (1.2 + Math.random() * 1.5) * WORLD_SCALE_4X;
            this.floatingEffects.push({
                mesh,
                type: "burst",
                vx: Math.cos(angle) * speed,
                vy: (2.0 + Math.random() * 1.5) * WORLD_SCALE_4X,
                vz: Math.sin(angle) * speed,
                birth: performance.now(),
                life: 850
            });
        }
    }

    focusCameraOnHex(q, r) {
        const tile = this.hexMap.get(`${q},${r}`);
        if (!tile) return;
        const startTarget = this.controls.target.clone();
        const endTarget = new THREE.Vector3(tile.x, 0, tile.z);
        const camOffset = this.camera.position.clone().sub(startTarget);
        const startTime = performance.now();
        const duration = 500;

        const animateCam = (now) => {
            const t = Math.min(1, (now - startTime) / duration);
            const ease = 1 - Math.pow(1 - t, 3);
            this.controls.target.lerpVectors(startTarget, endTarget, ease);
            this.camera.position.copy(this.controls.target).add(camOffset);
            if (t < 1) requestAnimationFrame(animateCam);
        };
        requestAnimationFrame(animateCam);
    }

    updateReachableHighlights(reachablePathsMap, activeHexKey) {
        this.reachablePaths = reachablePathsMap;
        this.activeHexKey = activeHexKey;
        this.hexTiles.forEach(tile => {
            if (this.hoveredHex === tile) {
                const key = `${tile.q},${tile.r}`;
                if (this.reachablePaths && this.reachablePaths.has(key)) {
                    tile.highlightRing.material.color.setHex(0x6ee7b7);
                    tile.highlightRing.material.opacity = 0.85;
                } else {
                    tile.highlightRing.material.opacity = 0.0;
                }
            } else {
                tile.highlightRing.material.opacity = 0.0;
            }
        });
    }

    updateResourceVisuals() {
        this.hexTiles.forEach(tile => {
            if (tile.resourceType && tile.propModel) {
                const depleted = tile.resourceCooldown > 0;
                tile.propModel.position.y = (tile.height - 0.1 * WORLD_SCALE_4X) - (depleted ? 0.08 * WORLD_SCALE_4X : 0);

                if (tile.stormRestricted && !tile.stormRestrictGroup) {
                    const restrictGroup = new THREE.Group();
                    restrictGroup.position.y = tile.height - 0.05 * WORLD_SCALE_4X;
                    const barRingGeo = new THREE.RingGeometry(this.hexRadius * 0.72, this.hexRadius * 0.88, 18);
                    barRingGeo.rotateX(-Math.PI / 2);
                    const barRing = new THREE.Mesh(
                        barRingGeo,
                        new THREE.MeshBasicMaterial({ color: 0xe06c75, transparent: true, opacity: 0.65, side: THREE.DoubleSide })
                    );
                    restrictGroup.add(barRing);

                    tile.group.add(restrictGroup);
                    tile.stormRestrictGroup = restrictGroup;
                } else if (!tile.stormRestricted && tile.stormRestrictGroup) {
                    tile.group.remove(tile.stormRestrictGroup);
                    tile.stormRestrictGroup = null;
                }
            }
        });
    }

    triggerLightningStrikeEffect(q, r) {
        const tile = this.hexMap.get(`${q},${r}`);
        if (!tile) return;

        const boltGroup = new THREE.Group();
        boltGroup.position.set(tile.x, tile.height, tile.z);
        const boltPts = [];
        const segs = 8;
        for (let i = 0; i <= segs; i++) {
            const y = (1 - i / segs) * 24 * WORLD_SCALE_4X;
            const jx = (i === 0 || i === segs) ? 0 : (Math.random() - 0.5) * 2.0 * WORLD_SCALE_4X;
            const jz = (i === 0 || i === segs) ? 0 : (Math.random() - 0.5) * 2.0 * WORLD_SCALE_4X;
            boltPts.push(new THREE.Vector3(jx, y, jz));
        }
        const boltGeo = new THREE.BufferGeometry().setFromPoints(boltPts);
        const boltMat = new THREE.LineBasicMaterial({ color: 0xe0f2fe, linewidth: 3, transparent: true, opacity: 1.0 });
        const boltLine = new THREE.Line(boltGeo, boltMat);
        boltGroup.add(boltLine);

        const beamGeo = new THREE.CylinderGeometry(0.16 * WORLD_SCALE_4X, 0.45 * WORLD_SCALE_4X, 24 * WORLD_SCALE_4X, 6);
        const beamMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.68 });
        const beamMesh = new THREE.Mesh(beamGeo, beamMat);
        beamMesh.position.y = 12 * WORLD_SCALE_4X;
        boltGroup.add(beamMesh);

        const ringGeo = new THREE.RingGeometry(0.3 * WORLD_SCALE_4X, 0.9 * WORLD_SCALE_4X, 18);
        ringGeo.rotateX(-Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.90, side: THREE.DoubleSide });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.y = 0.12 * WORLD_SCALE_4X;
        boltGroup.add(ringMesh);

        this.effectsGroup.add(boltGroup);
        this.floatingEffects.push({
            mesh: boltGroup,
            beamMat,
            ringMesh,
            ringMat,
            type: "lightning_bolt",
            birth: performance.now(),
            life: 800
        });

        this.triggerBurstAnimation(q, r, 0x38bdf8, 12);
    }

    triggerMonumentTrapEffect(q, r, tier = 1) {
        const tile = this.hexMap.get(`${q},${r}`);
        if (!tile) return;

        if (tier === 1) {
            for (let i = 0; i < 6; i++) {
                const arrowGroup = new THREE.Group();
                const shaft = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.04 * WORLD_SCALE_4X, 0.04 * WORLD_SCALE_4X, 1.2 * WORLD_SCALE_4X, 5),
                    new THREE.MeshBasicMaterial({ color: 0x78350f })
                );
                const tip = new THREE.Mesh(
                    new THREE.ConeGeometry(0.12 * WORLD_SCALE_4X, 0.32 * WORLD_SCALE_4X, 5),
                    new THREE.MeshBasicMaterial({ color: 0xef4444 })
                );
                tip.position.y = -0.68 * WORLD_SCALE_4X;
                tip.rotation.x = Math.PI;
                arrowGroup.add(shaft, tip);

                const ox = (Math.random() - 0.5) * 1.6 * WORLD_SCALE_4X;
                const oz = (Math.random() - 0.5) * 1.6 * WORLD_SCALE_4X;
                arrowGroup.position.set(tile.x + ox, tile.height + (6.5 + i * 0.4) * WORLD_SCALE_4X, tile.z + oz);
                this.effectsGroup.add(arrowGroup);

                this.floatingEffects.push({
                    mesh: arrowGroup,
                    type: "trap_arrow",
                    targetY: tile.height + 0.4 * WORLD_SCALE_4X,
                    vy: -14.0 * WORLD_SCALE_4X,
                    birth: performance.now(),
                    life: 1150
                });
            }
            this.triggerBurstAnimation(q, r, 0xef4444, 12);
        } else if (tier === 2) {
            for (let i = 0; i < 3; i++) {
                const boulder = new THREE.Mesh(
                    new THREE.DodecahedronGeometry(0.46 * WORLD_SCALE_4X, 0),
                    new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.85 })
                );
                const angle = (i / 3) * Math.PI * 2;
                boulder.position.set(
                    tile.x + Math.cos(angle) * 1.4 * WORLD_SCALE_4X,
                    tile.height + (4.2 + i * 0.4) * WORLD_SCALE_4X,
                    tile.z + Math.sin(angle) * 1.4 * WORLD_SCALE_4X
                );
                this.effectsGroup.add(boulder);

                this.floatingEffects.push({
                    mesh: boulder,
                    type: "trap_boulder",
                    vx: -Math.cos(angle) * 1.4 * WORLD_SCALE_4X,
                    vy: -6.0 * WORLD_SCALE_4X,
                    vz: -Math.sin(angle) * 1.4 * WORLD_SCALE_4X,
                    floorY: tile.height + 0.4 * WORLD_SCALE_4X,
                    birth: performance.now(),
                    life: 1300
                });
            }
            this.triggerBurstAnimation(q, r, 0xf97316, 14);
        } else {
            this.triggerLightningStrikeEffect(q, r);
            this.triggerMonumentTrapEffect(q, r, 2);
        }
    }

    initEvents() {
        window.addEventListener("resize", () => {
            const w = this.container.clientWidth || window.innerWidth;
            const h = this.container.clientHeight || window.innerHeight;
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(w, h);
        });

        let pointerDownPos = { x: 0, y: 0 };
        let pointerDownTile = null;
        let isLeftPointerDown = false;
        let lastTapTime = 0;
        let lastHoverRaycastTime = 0;
        this.singleClickTimer = null;
        this.isDrawingCustomPath = false;
        this.isClickDrawMode = false;
        this.hasDraggedToOtherHex = false;

        this.renderer.domElement.addEventListener("contextmenu", (e) => {
            e.preventDefault();
        });

        this.keyState = { w: false, a: false, s: false, d: false };
        const updateKeyState = (e, isDown) => {
            if (isDown && e.target) {
                const tag = (e.target.tagName || "").toUpperCase();
                if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target.isContentEditable) {
                    return;
                }
            }
            const code = e.code || "";
            const key = (e.key || "").toLowerCase();
            if (code === "KeyW" || key === "w" || code === "ArrowUp") this.keyState.w = isDown;
            if (code === "KeyS" || key === "s" || code === "ArrowDown") this.keyState.s = isDown;
            if (code === "KeyA" || key === "a" || code === "ArrowLeft") this.keyState.a = isDown;
            if (code === "KeyD" || key === "d" || code === "ArrowRight") this.keyState.d = isDown;
        };
        window.addEventListener("keydown", (e) => updateKeyState(e, true));
        window.addEventListener("keyup", (e) => updateKeyState(e, false));
        window.addEventListener("blur", () => {
            this.keyState = { w: false, a: false, s: false, d: false };
        });

        const pickTileAtClientPos = (clientX, clientY) => {
            const rect = this.renderer.domElement.getBoundingClientRect();
            this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

            this.raycaster.setFromCamera(this.mouse, this.camera);
            // Fast raycast against cached pickableMeshes (no deep scene-graph traversal!)
            const rawHits = this.raycaster.intersectObjects(this.pickableMeshes, false);
            if (rawHits.length === 0) return null;

            const firstObj = rawHits[0].object;
            const firstTile = firstObj && firstObj.userData ? firstObj.userData.tile : null;
            if (!firstTile) return null;
            if (firstTile.navigable) return firstTile;

            for (let i = 1; i < rawHits.length; i++) {
                const t = rawHits[i].object && rawHits[i].object.userData ? rawHits[i].object.userData.tile : null;
                if (t && t.navigable && (rawHits[i].distance - rawHits[0].distance) <= 2.4 * WORLD_SCALE_4X) {
                    return t;
                }
            }
            return firstTile;
        };

        this.renderer.domElement.addEventListener("pointerdown", (e) => {
            if (e.button !== 0) return;

            pointerDownPos = { x: e.clientX, y: e.clientY };
            const tile = pickTileAtClientPos(e.clientX, e.clientY);
            pointerDownTile = tile;
            isLeftPointerDown = true;
            const now = performance.now();

            if (this.isClickDrawMode) {
                this.isClickDrawMode = false;
                this.isDrawingCustomPath = false;
                if (tile && tile.navigable && this.onCustomPathStep) {
                    this.onCustomPathStep(tile);
                }
                if (this.onCustomPathCommit) {
                    this.onCustomPathCommit();
                }
                lastTapTime = 0;
                return;
            }

            if (tile && tile.navigable) {
                if ((now - lastTapTime) <= 680 && this.onCustomPathStart) {
                    clearTimeout(this.singleClickTimer);
                    this.singleClickTimer = null;
                    const started = this.onCustomPathStart(tile);
                    if (started) {
                        this.isDrawingCustomPath = true;
                        this.hasDraggedToOtherHex = false;
                        try {
                            this.renderer.domElement.setPointerCapture(e.pointerId);
                        } catch (_) {}
                        lastTapTime = 0;
                        return;
                    }
                }
                lastTapTime = now;
            }
        });

        this.renderer.domElement.addEventListener("pointermove", (e) => {
            const now = performance.now();
            // Throttle hover raycasting to 30ms (~33Hz) when not actively drawing a path to eliminate mouse-move lag!
            if (!this.isDrawingCustomPath && !this.isClickDrawMode && !isLeftPointerDown) {
                if (now - lastHoverRaycastTime < 30) return;
            }
            lastHoverRaycastTime = now;

            const tile = pickTileAtClientPos(e.clientX, e.clientY);

            if (this.isDrawingCustomPath || this.isClickDrawMode) {
                if (tile && tile.navigable && this.onCustomPathStep) {
                    if (pointerDownTile && (tile.q !== pointerDownTile.q || tile.r !== pointerDownTile.r)) {
                        this.hasDraggedToOtherHex = true;
                    }
                    this.onCustomPathStep(tile);
                }
                return;
            }

            if (isLeftPointerDown && pointerDownTile && pointerDownTile.navigable && tile && tile.navigable) {
                const moveDist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
                if ((tile.q !== pointerDownTile.q || tile.r !== pointerDownTile.r) && moveDist > 14 && this.onCustomPathStart) {
                    clearTimeout(this.singleClickTimer);
                    this.singleClickTimer = null;
                    const started = this.onCustomPathStart(pointerDownTile);
                    if (started) {
                        this.isDrawingCustomPath = true;
                        this.hasDraggedToOtherHex = true;
                        if (this.onCustomPathStep) {
                            this.onCustomPathStep(tile);
                        }
                        return;
                    }
                }
            }

            if (tile) {
                if (this.hoveredHex !== tile) {
                    if (this.hoveredHex && this.hoveredHex.highlightRing) {
                        this.hoveredHex.highlightRing.material.opacity = 0.0;
                    }
                    this.hoveredHex = tile;

                    const key = `${tile.q},${tile.r}`;
                    const isReachable = this.reachablePaths && this.reachablePaths.has(key);
                    this.renderer.domElement.style.cursor = isReachable ? "pointer" : (tile.navigable ? "default" : "not-allowed");

                    if (isReachable) {
                        tile.highlightRing.material.color.setHex(0x6ee7b7);
                        tile.highlightRing.material.opacity = 0.85;
                        this.showPathPreview(this.reachablePaths.get(key).path, false);
                    } else {
                        tile.highlightRing.material.opacity = 0.0;
                        this.clearPathPreview();
                    }

                    if (this.onHexHover) this.onHexHover(tile, e.clientX, e.clientY);
                }
            } else if (this.hoveredHex) {
                if (this.hoveredHex.highlightRing) {
                    this.hoveredHex.highlightRing.material.opacity = 0.0;
                }
                this.hoveredHex = null;
                this.renderer.domElement.style.cursor = "default";
                this.clearPathPreview();
                if (this.onHexHover) this.onHexHover(null, 0, 0);
            }
        });

        this.renderer.domElement.addEventListener("pointerup", (e) => {
            if (e.button !== 0) return;
            isLeftPointerDown = false;
            try {
                this.renderer.domElement.releasePointerCapture(e.pointerId);
            } catch (_) {}

            if (this.isDrawingCustomPath) {
                this.isDrawingCustomPath = false;
                if (this.hasDraggedToOtherHex) {
                    this.isClickDrawMode = false;
                    if (this.onCustomPathCommit) {
                        this.onCustomPathCommit();
                    }
                } else {
                    this.isClickDrawMode = true;
                }
                return;
            }

            const moveDist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
            if (moveDist > 28) return;

            const tile = pickTileAtClientPos(e.clientX, e.clientY);
            if (tile && this.onHexClick) {
                clearTimeout(this.singleClickTimer);
                this.singleClickTimer = setTimeout(() => {
                    this.singleClickTimer = null;
                    if (!this.isDrawingCustomPath && !this.isClickDrawMode) {
                        this.onHexClick(tile);
                    }
                }, 240);
            }
        });
    }

    startRenderLoop() {
        const animate = () => {
            requestAnimationFrame(animate);
            const delta = Math.min(0.05, this.clock.getDelta());
            const elapsed = this.clock.getElapsedTime();
            const now = performance.now();

            // 1. Lightweight Ocean Swell (Zero vertex buffer recalculation!)
            if (this.oceanMesh) {
                const amp = this.waveMultiplier || 0.70;
                this.oceanMesh.position.y = (-0.20 + Math.sin(elapsed * 1.1) * 0.03 * amp) * WORLD_SCALE_4X;
            }

            // 1b. Rain Particle Field (Only during Rain / Storm)
            if (this.rainField && this.rainField.material.opacity > 0.01) {
                const rPos = this.rainField.geometry.attributes.position;
                const fallSpeed = 75 * delta;
                for (let i = 0; i < rPos.count; i++) {
                    let y = rPos.getY(i) - fallSpeed;
                    if (y < 0) y = 150;
                    rPos.setY(i, y);
                }
                rPos.needsUpdate = true;
            }

            // 2. Sky Clouds
            if (this.cloudsVisible) {
                this.clouds.forEach(c => {
                    c.mesh.position.x += c.speed * delta;
                    if (c.mesh.position.x > 340) c.mesh.position.x = -340;
                });
            }

            // 3. Player Ships: Prominent Scale & Spotlight when Docked on a Tile!
            const occupiedHexKeys = new Set();
            let shipIdx = 0;
            const wavePitch = (this.waveMultiplier || 0.70) * 0.028;
            this.shipMeshes.forEach((ship) => {
                if (ship.visible && ship.userData.lastQ !== undefined && ship.userData.lastR !== undefined) {
                    const key = `${ship.userData.lastQ},${ship.userData.lastR}`;
                    occupiedHexKeys.add(key);

                    // Make ship stand out prominently ("thuyền sẽ nổi bật hơn"):
                    const baseSc = ship.userData.baseShipScale || (1.24 * WORLD_SCALE_4X);
                    const targetShipSc = baseSc * 1.16;
                    const curShipSc = ship.scale.x || baseSc;
                    if (Math.abs(curShipSc - targetShipSc) > 0.01) {
                        ship.scale.setScalar(curShipSc + (targetShipSc - curShipSc) * Math.min(1, delta * 8.0));
                    }
                    if (ship.userData.innerDisc) {
                        ship.userData.innerDisc.material.opacity = 0.45 + Math.sin(elapsed * 3.0 + shipIdx) * 0.12;
                    }
                }
                ship.rotation.z = Math.sin(elapsed * 2.0 + shipIdx) * wavePitch;
                ship.rotation.x = Math.cos(elapsed * 1.6 + shipIdx) * (wavePitch * 0.75);
                if (ship.userData.flag) {
                    ship.userData.flag.rotation.y = Math.sin(elapsed * 4.2 + shipIdx) * 0.22;
                }
                if (ship.userData.mainSail) {
                    const breath = 1.0 + Math.sin(elapsed * 2.2 + shipIdx) * 0.032;
                    ship.userData.mainSail.scale.set(breath, 1.0, breath);
                }
                if (ship.userData.ring) {
                    const rPulse = 1.04 + Math.sin(elapsed * 2.8 + shipIdx) * 0.07;
                    ship.userData.ring.scale.set(rPulse, 1, rPulse);
                }
                if (ship.userData.localRadarRing) {
                    const radarPulse = 1.0 + ((elapsed * 0.9) % 1.0) * 0.36;
                    ship.userData.localRadarRing.scale.set(radarPulse, 1, radarPulse);
                    ship.userData.localRadarRing.material.opacity = 0.85 * (1.0 - ((elapsed * 0.9) % 1.0) * 0.70);
                }
                if (ship.userData.myArrowMarker) {
                    ship.userData.myArrowMarker.position.y = 3.82 + Math.sin(elapsed * 3.8) * 0.20;
                    if (ship.userData.myArrowMarker.userData.headMesh) {
                        ship.userData.myArrowMarker.userData.headMesh.rotation.y = elapsed * 2.0;
                    }
                }
                shipIdx++;
            });

            // 4. Occupied-Tile Fade Effect ("Làm cho khi thuyền đi vào ô đó thuyền sẽ nổi bật hơn và ô đó sẽ mờ đi")!
            const lerpRate = Math.min(1, delta * 9.0);
            for (let i = 0; i < this.hexTiles.length; i++) {
                const tile = this.hexTiles[i];
                const isOccupied = occupiedHexKeys.has(`${tile.q},${tile.r}`);

                // A. Fade the tile's baseMesh & rimMesh when occupied by a ship
                const targetBaseOp = isOccupied ? 0.14 : tile.defaultBaseOpacity;
                if (Math.abs(tile.baseMesh.material.opacity - targetBaseOp) > 0.008) {
                    tile.baseMesh.material.opacity += (targetBaseOp - tile.baseMesh.material.opacity) * lerpRate;
                }
                if (tile.rimMesh) {
                    const targetRimOp = isOccupied ? 0.02 : tile.defaultRimOpacity;
                    if (Math.abs(tile.rimMesh.material.opacity - targetRimOp) > 0.005) {
                        tile.rimMesh.material.opacity += (targetRimOp - tile.rimMesh.material.opacity) * lerpRate;
                    }
                }

                // B. Fade & shrink the tile's 3D propModel (Monument, Port, Resource, Reef, NPC) when occupied by a ship!
                if (tile.propModel) {
                    const basePropScale = (tile.resourceType && tile.resourceCooldown > 0) ? 0.52 : 1.0;
                    const targetPropScale = isOccupied ? (basePropScale * 0.68) : basePropScale;
                    const curScale = tile.propModel.scale.x || 1.0;
                    if (Math.abs(curScale - targetPropScale) > 0.006) {
                        tile.propModel.scale.setScalar(curScale + (targetPropScale - curScale) * lerpRate);
                    }

                    if (tile.propMeshes && tile.propMeshes.length > 0) {
                        for (let m = 0; m < tile.propMeshes.length; m++) {
                            const pm = tile.propMeshes[m];
                            const mat = pm.material;
                            const origOp = (mat.userData && mat.userData.baseOpacity !== undefined) ? mat.userData.baseOpacity : 1.0;
                            const targetMeshOp = isOccupied ? (origOp * 0.22) : origOp;
                            if (Math.abs(mat.opacity - targetMeshOp) > 0.01) {
                                mat.transparent = true;
                                mat.opacity += (targetMeshOp - mat.opacity) * lerpRate;
                            }
                        }
                    }

                    if (tile.monumentId && tile.propModel.userData.relicCrown) {
                        tile.propModel.userData.relicCrown.rotation.y = elapsed * 1.4;
                    }
                }

                // C. Fade Monument Halo Ring & Floating Label Sprite when occupied by a ship
                if (tile.monumentGlowGroup && tile.monumentGlowGroup.userData.outerHalo) {
                    const halo = tile.monumentGlowGroup.userData.outerHalo;
                    const targetHaloOp = tile.monumentLocked ? 0.12 : (isOccupied ? 0.14 : 0.45);
                    if (Math.abs(halo.material.opacity - targetHaloOp) > 0.01) {
                        halo.material.opacity += (targetHaloOp - halo.material.opacity) * lerpRate;
                    }
                }
                if (tile.labelSprite && tile.labelSprite.material) {
                    const targetLabelOp = isOccupied ? 0.08 : 0.92;
                    if (Math.abs(tile.labelSprite.material.opacity - targetLabelOp) > 0.01) {
                        tile.labelSprite.material.opacity += (targetLabelOp - tile.labelSprite.material.opacity) * lerpRate;
                    }
                }
            }

            // 5. Wake, Burst, Lightning Bolt & Monument Trap Effects
            for (let i = this.floatingEffects.length - 1; i >= 0; i--) {
                const fx = this.floatingEffects[i];
                const age = now - fx.birth;
                if (age >= fx.life) {
                    this.effectsGroup.remove(fx.mesh);
                    this.floatingEffects.splice(i, 1);
                    continue;
                }
                const progress = age / fx.life;
                if (fx.type === "wake") {
                    const s = 1 + progress * 2.2;
                    fx.mesh.scale.set(s, s, s);
                    fx.mesh.material.opacity = (1 - progress) * 0.45;
                } else if (fx.type === "burst") {
                    fx.mesh.position.x += fx.vx * 0.016;
                    fx.mesh.position.y += fx.vy * 0.016;
                    fx.mesh.position.z += fx.vz * 0.016;
                    fx.vy -= 5.8 * WORLD_SCALE_4X * 0.016;
                    fx.mesh.rotation.x += 0.12;
                    fx.mesh.rotation.y += 0.15;
                    fx.mesh.material.opacity = 1 - progress;
                } else if (fx.type === "lightning_bolt") {
                    const flash = (Math.floor(age / 55) % 2 === 0) ? 1.0 : 0.25;
                    if (fx.beamMat) fx.beamMat.opacity = (1 - progress) * 0.75 * flash;
                    if (fx.ringMesh) {
                        const rs = 1 + progress * 4.2;
                        fx.ringMesh.scale.set(rs, rs, rs);
                    }
                    if (fx.ringMat) fx.ringMat.opacity = (1 - progress) * 0.90;
                } else if (fx.type === "trap_arrow") {
                    if (fx.mesh.position.y > fx.targetY) {
                        fx.mesh.position.y = Math.max(fx.targetY, fx.mesh.position.y + fx.vy * 0.016);
                    }
                } else if (fx.type === "trap_boulder") {
                    fx.mesh.position.x += fx.vx * 0.016;
                    fx.mesh.position.z += fx.vz * 0.016;
                    fx.mesh.position.y += fx.vy * 0.016;
                    if (fx.mesh.position.y <= fx.floorY) {
                        fx.mesh.position.y = fx.floorY;
                        fx.vy = Math.abs(fx.vy) * 0.45;
                    } else {
                        fx.vy -= 12.0 * WORLD_SCALE_4X * 0.016;
                    }
                    fx.mesh.rotation.x += 0.16;
                    fx.mesh.rotation.z += 0.14;
                }
            }

            // 6. WASD / Arrow Keys Camera Panning (Scaled 4x for the 4x World!)
            if (this.keyState && (this.keyState.w || this.keyState.s || this.keyState.a || this.keyState.d)) {
                const moveF = (this.keyState.w ? 1 : 0) - (this.keyState.s ? 1 : 0);
                const moveR = (this.keyState.d ? 1 : 0) - (this.keyState.a ? 1 : 0);
                if (moveF !== 0 || moveR !== 0) {
                    const fx = this.controls.target.x - this.camera.position.x;
                    const fz = this.controls.target.z - this.camera.position.z;
                    const fLen = Math.hypot(fx, fz) || 1;
                    const dirX = fx / fLen;
                    const dirZ = fz / fLen;
                    const rightX = -dirZ;
                    const rightZ = dirX;
                    const panSpeed = 168 * delta;
                    const dx = (dirX * moveF + rightX * moveR) * panSpeed;
                    const dz = (dirZ * moveF + rightZ * moveR) * panSpeed;
                    const maxBound = 360;
                    this.controls.target.x = Math.max(-maxBound, Math.min(maxBound, this.controls.target.x + dx));
                    this.controls.target.z = Math.max(-maxBound, Math.min(maxBound, this.controls.target.z + dz));
                    this.camera.position.x += dx;
                    this.camera.position.z += dz;
                }
            }

            // 7. Camera Follow Lock
            if (this.cameraLockEnabled && this.cameraLockShipKey) {
                const lockedShip = this.shipMeshes.get(this.cameraLockShipKey);
                if (lockedShip) {
                    const dx = lockedShip.position.x - this.controls.target.x;
                    const dz = lockedShip.position.z - this.controls.target.z;
                    if (Math.hypot(dx, dz) > 0.005) {
                        const lerpFactor = Math.min(1, delta * 9.5);
                        this.controls.target.x += dx * lerpFactor;
                        this.controls.target.z += dz * lerpFactor;
                        this.camera.position.x += dx * lerpFactor;
                        this.camera.position.z += dz * lerpFactor;
                    }
                }
            }

            this.controls.update();
            this.renderer.render(this.scene, this.camera);
        };
        animate();
    }
}

window.World3D = World3D;
