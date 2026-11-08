// ============================================================================
// THE GOLDEN JOURNEY (HÀNH TRÌNH VÀNG SON) — V6.0 ULTRA-HD TRUE S-CURVE VIETNAM 3D WORLD
// - True Mathematical S-Curve of Vietnam (North Crown -> West Bend at Bắc Trung Bộ ->
//   East Bulge at Tây Nguyên & Nam Trung Bộ -> South-West Tail Hook at ĐBSCL & Cà Mau)
// - 6 Economic Regions Modeled Faithfully After Reference Diorama (Inland Tây Nguyên
//   West of Central Coast, 9 Mekong River Channels, Golden Red River Delta, Northern Peaks)
// - High-Resolution 4096x4096 Soft Shadows, Tropical Lagoon Gradients & Living Ocean
// - Toggleable Sky Clouds, Local-Player-Only 3D Arrow Marker, and Immutable Ship Identity Keys
// ============================================================================

class World3D {
    constructor(containerId, onHexClickCallback, onHexHoverCallback) {
        this.container = document.getElementById(containerId);
        this.onHexClick = onHexClickCallback;
        this.onHexHover = onHexHoverCallback;

        this.hexRadius = 2.26;
        this.hexTiles = [];
        this.hexMap = new Map(); // "q,r" -> tileObj
        this.shipMeshes = new Map(); // shipKey -> THREE.Group
        this.floatingEffects = [];
        this.waterVertices = [];
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
        this.scene.background = new THREE.Color(0x074e78);
        this.scene.fog = new THREE.FogExp2(0x074e78, 0.0028);

        const w = this.container.clientWidth || window.innerWidth;
        const h = this.container.clientHeight || window.innerHeight;

        this.camera = new THREE.PerspectiveCamera(42, w / h, 0.5, 850);
        this.camera.position.set(12, 84, 66);

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(w, h);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.26;
        this.container.innerHTML = "";
        this.container.appendChild(this.renderer.domElement);

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.07;
        this.controls.maxPolarAngle = Math.PI / 2.18;
        this.controls.minPolarAngle = Math.PI / 11;
        this.controls.minDistance = 14;
        this.controls.maxDistance = 225;
        this.controls.target.set(0, 0, 2);

        // Rich Tropical Sunlight & Hemisphere Illumination
        this.hemiLight = new THREE.HemisphereLight(0xfffbeb, 0x0284c7, 1.15);
        this.hemiLight.position.set(0, 95, 0);
        this.scene.add(this.hemiLight);

        this.sunLight = new THREE.DirectionalLight(0xfffef0, 1.72);
        this.sunLight.position.set(54, 92, 48);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 4096;
        this.sunLight.shadow.mapSize.height = 4096;
        this.sunLight.shadow.bias = -0.0004;
        this.sunLight.shadow.camera.near = 5;
        this.sunLight.shadow.camera.far = 280;
        const d = 104;
        this.sunLight.shadow.camera.left = -d;
        this.sunLight.shadow.camera.right = d;
        this.sunLight.shadow.camera.top = d;
        this.sunLight.shadow.camera.bottom = -d;
        this.scene.add(this.sunLight);

        this.rimLight = new THREE.DirectionalLight(0x38bdf8, 0.68);
        this.rimLight.position.set(-55, 42, -45);
        this.scene.add(this.rimLight);

        this.warmFillLight = new THREE.DirectionalLight(0xfde047, 0.35);
        this.warmFillLight.position.set(0, 35, 65);
        this.scene.add(this.warmFillLight);

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
            color: 0xffffff,
            roughness: 0.88,
            transparent: true,
            opacity: 0.72
        });

        for (let i = 0; i < 20; i++) {
            const cGroup = new THREE.Group();
            const puffs = 3 + Math.floor(Math.random() * 3);
            for (let p = 0; p < puffs; p++) {
                const puffGeo = new THREE.DodecahedronGeometry(1.35 + Math.random() * 1.0, 1);
                puffGeo.scale(1.35, 0.52, 1.0);
                const puff = new THREE.Mesh(puffGeo, cloudMat);
                puff.position.set((p - 1.5) * 1.35, Math.random() * 0.32, (Math.random() - 0.5) * 0.95);
                cGroup.add(puff);
            }
            cGroup.position.set((Math.random() - 0.5) * 175, 23 + Math.random() * 7, (Math.random() - 0.5) * 175);
            cGroup.visible = this.cloudsVisible;
            this.weatherGroup.add(cGroup);
            this.clouds.push({
                mesh: cGroup,
                speed: 0.52 + Math.random() * 0.60
            });
        }
        this.cloudMaterial = cloudMat;

        const starCount = 520;
        const starGeo = new THREE.BufferGeometry();
        const starPos = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount; i++) {
            starPos[i * 3] = (Math.random() - 0.5) * 230;
            starPos[i * 3 + 1] = 4 + Math.random() * 48;
            starPos[i * 3 + 2] = (Math.random() - 0.5) * 230;
        }
        starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
        this.starField = new THREE.Points(
            starGeo,
            new THREE.PointsMaterial({ color: 0xfef08a, size: 0.45, transparent: true, opacity: 0.0 })
        );
        this.weatherGroup.add(this.starField);

        // Rain Particle Field for Tropical Rain, Thunderstorm & Super Typhoon Yagi
        const rainCount = 900;
        const rainGeo = new THREE.BufferGeometry();
        const rainPos = new Float32Array(rainCount * 3);
        for (let i = 0; i < rainCount; i++) {
            rainPos[i * 3] = (Math.random() - 0.5) * 180;
            rainPos[i * 3 + 1] = Math.random() * 45;
            rainPos[i * 3 + 2] = (Math.random() - 0.5) * 180;
        }
        rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPos, 3));
        this.rainField = new THREE.Points(
            rainGeo,
            new THREE.PointsMaterial({ color: 0xbae6fd, size: 0.36, transparent: true, opacity: 0.0 })
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
        if (this.animatedLandProps) {
            this.animatedLandProps.forEach(item => {
                if (item.type === "orbit_cloud" && item.mesh) {
                    item.mesh.visible = this.cloudsVisible && !this.minimalistMode;
                }
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
        if (this.ambientSeagulls) {
            this.ambientSeagulls.forEach(sg => { if (sg.mesh) sg.mesh.visible = showExtra; });
        }
        if (this.ambientDolphins) {
            this.ambientDolphins.forEach(dp => { if (dp.mesh) dp.mesh.visible = showExtra; });
        }
        if (this.ambientFishSchools) {
            this.ambientFishSchools.forEach(fs => { if (fs.mesh) fs.mesh.visible = showExtra; });
        }
        if (this.ambientSampans) {
            this.ambientSampans.forEach(sp => { if (sp.mesh) sp.mesh.visible = showExtra; });
        }
        if (this.ambientLighthouses) {
            this.ambientLighthouses.forEach(lh => {
                if (lh.userData && lh.userData.beam) lh.userData.beam.visible = showExtra;
            });
        }
        if (this.ambientOilRigs) {
            this.ambientOilRigs.forEach(rig => {
                if (rig.userData && rig.userData.flame) rig.userData.flame.visible = showExtra;
            });
        }
        if (this.foamRings) {
            this.foamRings.forEach(f => { if (f.mesh) f.mesh.visible = showExtra; });
        }
        if (this.animatedLandProps) {
            this.animatedLandProps.forEach(item => {
                if (!item.mesh) return;
                if (item.type === "orbit_cloud") {
                    item.mesh.visible = showExtra && this.cloudsVisible;
                } else if (item.type === "smoke_rise" || item.type === "flicker_fire" || item.type === "bob_boat" || item.type === "shimmer_water") {
                    item.mesh.visible = showExtra;
                }
            });
        }
        if (this.shipMeshes) {
            this.shipMeshes.forEach(ship => {
                if (ship.userData && ship.userData.beaconPillar) {
                    ship.userData.beaconPillar.visible = showExtra;
                }
            });
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
                bg: 0x074e78, fog: 0x074e78, hemiSky: 0xfffbeb, hemiGround: 0x0284c7, hemiInt: 1.12,
                sunCol: 0xfffef0, sunInt: 1.68, sunPos: [48, 82, 42], cloudCol: 0xffffff, cloudOp: 0.72,
                waveAmp: 1.0, starsOp: 0.0, rainOp: 0.0
            },
            tropical_rain: {
                bg: 0x1e3a4c, fog: 0x1e3a4c, hemiSky: 0x94a3b8, hemiGround: 0x0f172a, hemiInt: 0.85,
                sunCol: 0xcbd5e1, sunInt: 1.05, sunPos: [30, 75, 25], cloudCol: 0x64748b, cloudOp: 0.88,
                waveAmp: 1.45, starsOp: 0.0, rainOp: 0.72
            },
            thunderstorm: {
                bg: 0x0f172a, fog: 0x0f172a, hemiSky: 0x64748b, hemiGround: 0x020617, hemiInt: 0.68,
                sunCol: 0x93c5fd, sunInt: 0.82, sunPos: [20, 68, 20], cloudCol: 0x334155, cloudOp: 0.94,
                waveAmp: 1.85, starsOp: 0.15, rainOp: 0.88
            },
            sunset: {
                bg: 0x451a03, fog: 0x7c2d12, hemiSky: 0xfda4af, hemiGround: 0x1e1b4b, hemiInt: 0.92,
                sunCol: 0xf97316, sunInt: 1.75, sunPos: [-52, 28, 38], cloudCol: 0xfed7aa, cloudOp: 0.80,
                waveAmp: 1.05, starsOp: 0.38, rainOp: 0.0
            },
            night: {
                bg: 0x020617, fog: 0x020617, hemiSky: 0x38bdf8, hemiGround: 0x0f172a, hemiInt: 0.62,
                sunCol: 0x93c5fd, sunInt: 0.85, sunPos: [-30, 56, -30], cloudCol: 0x334155, cloudOp: 0.55,
                waveAmp: 0.90, starsOp: 0.95, rainOp: 0.0
            },
            super_typhoon_yagi: {
                bg: 0x1a0612, fog: 0x280819, hemiSky: 0xf43f5e, hemiGround: 0x090206, hemiInt: 0.72,
                sunCol: 0xfda4af, sunInt: 0.95, sunPos: [10, 64, 15], cloudCol: 0x4c0519, cloudOp: 0.96,
                waveAmp: 2.30, starsOp: 0.10, rainOp: 0.96
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
        this.waveMultiplier = 1.0;
        const oceanGeo = new THREE.PlaneGeometry(340, 340, 140, 140);
        oceanGeo.rotateX(-Math.PI / 2);

        const pos = oceanGeo.attributes.position;
        this.waterVertices = [];
        for (let i = 0; i < pos.count; i++) {
            this.waterVertices.push({
                x: pos.getX(i),
                y: pos.getY(i),
                z: pos.getZ(i),
                phase: Math.random() * Math.PI * 2
            });
        }

        const oceanMat = new THREE.MeshStandardMaterial({
            color: 0x0369a1,
            emissive: 0x082f49,
            emissiveIntensity: 0.34,
            roughness: 0.16,
            metalness: 0.52,
            flatShading: true,
            transparent: true,
            opacity: 0.97
        });

        this.oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
        this.oceanMesh.position.y = -0.18;
        this.oceanMesh.receiveShadow = true;
        this.scene.add(this.oceanMesh);

        this.foamRings = [];
        const foamMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.32, side: THREE.DoubleSide });
        for (let i = 0; i < 72; i++) {
            const rGeo = new THREE.RingGeometry(0.42, 0.68, 18);
            rGeo.rotateX(-Math.PI / 2);
            const ring = new THREE.Mesh(rGeo, foamMat.clone());
            ring.position.set((Math.random() - 0.5) * 185, -0.05, (Math.random() - 0.5) * 185);
            this.scene.add(ring);
            this.foamRings.push({ mesh: ring, speed: 0.65 + Math.random() * 0.8, offset: Math.random() * 6 });
        }

        this.initAmbientOceanScenery();
    }

    initAmbientOceanScenery() {
        this.sceneryGroup = new THREE.Group();
        this.scene.add(this.sceneryGroup);

        // 1. 10 Picturesque Limestone Karst Islands & Atolls around the Outer Sea
        const karstLocations = [
            { x: 44, z: -38, scale: 1.95, rot: 0.4 },
            { x: 48, z: -18, scale: 1.65, rot: 1.2 },
            { x: 50, z: 2, scale: 1.80, rot: 0.9 },
            { x: 46, z: 20, scale: 2.00, rot: 2.1 },
            { x: 40, z: 40, scale: 1.75, rot: 2.8 },
            { x: 14, z: 52, scale: 1.60, rot: 1.6 },
            { x: -24, z: 48, scale: 1.75, rot: 0.5 }, // Phú Quốc / Thổ Chu area
            { x: -42, z: -32, scale: 1.75, rot: 0.8 },
            { x: -44, z: 28, scale: 1.80, rot: 1.9 },
            { x: 20, z: -48, scale: 1.65, rot: 2.4 }
        ];
        karstLocations.forEach(kl => {
            const kMesh = ProceduralModels.createDistantKarstOutcrop(kl.scale);
            kMesh.position.set(kl.x, -0.15, kl.z);
            kMesh.rotation.y = kl.rot;
            this.sceneryGroup.add(kMesh);
        });

        // 2. 4 Coastal & Island Lighthouses with Rotating Light Beams
        this.ambientLighthouses = [];
        const lhCoords = [
            { x: 38, z: -28 },
            { x: 42, z: -4 },
            { x: 40, z: 14 },
            { x: 24, z: 44 }
        ];
        lhCoords.forEach(lc => {
            const lh = ProceduralModels.createSeaLighthouseIsland();
            lh.position.set(lc.x, -0.15, lc.z);
            lh.scale.setScalar(1.42);
            this.sceneryGroup.add(lh);
            this.ambientLighthouses.push(lh);
        });

        // 3. 3 Offshore Oil & Gas Platforms (Bạch Hổ / Lan Tây / Rồng Đôi)
        this.ambientOilRigs = [];
        const rigCoords = [
            { x: 28, z: 28 },
            { x: 36, z: 35 },
            { x: 16, z: 42 }
        ];
        rigCoords.forEach(rc => {
            const rig = ProceduralModels.createOffshoreOilRig();
            rig.position.set(rc.x, -0.15, rc.z);
            rig.scale.setScalar(1.42);
            this.sceneryGroup.add(rig);
            this.ambientOilRigs.push(rig);
        });

        // 4. 12 Traditional Vietnamese Sailing Sampans & Fishing Boats
        this.ambientSampans = [];
        for (let i = 0; i < 12; i++) {
            const sampan = ProceduralModels.createAmbientFishingSampan();
            sampan.scale.setScalar(1.45);
            const radius = 38 + (i % 4) * 5.5;
            const angle = (i / 12) * Math.PI * 2;
            this.sceneryGroup.add(sampan);
            this.ambientSampans.push({
                mesh: sampan,
                radius,
                angle,
                speed: (0.055 + (i % 3) * 0.02) * (i % 2 === 0 ? 1 : -1),
                centerX: 6,
                centerZ: 0
            });
        }

        // 5. 6 Jumping Dolphin Pods leaping out of the waves!
        this.ambientDolphins = [];
        const dolphinCenters = [
            { x: 32, z: -22 },
            { x: 36, z: -6 },
            { x: 34, z: 12 },
            { x: 28, z: 24 },
            { x: 8, z: 42 },
            { x: -26, z: 38 }
        ];
        dolphinCenters.forEach((dc, idx) => {
            const pod = ProceduralModels.createJumpingDolphinPod();
            pod.scale.setScalar(1.38);
            this.sceneryGroup.add(pod);
            this.ambientDolphins.push({
                mesh: pod,
                centerX: dc.x,
                centerZ: dc.z,
                radius: 4.5 + (idx % 2) * 1.8,
                angle: idx * 1.2,
                speed: 0.45 + (idx % 3) * 0.08,
                jumpPhase: idx * 1.1
            });
        });

        // 6. 8 Glowing Fish Schools swimming beneath the crystal water
        this.ambientFishSchools = [];
        const fishCenters = [
            { x: 28, z: -30 },
            { x: 34, z: -14 },
            { x: 36, z: 4 },
            { x: 32, z: 18 },
            { x: 22, z: 32 },
            { x: 2, z: 40 },
            { x: -18, z: 34 },
            { x: 18, z: -38 }
        ];
        fishCenters.forEach((fc, idx) => {
            const school = ProceduralModels.createGlowingFishSchool();
            school.position.set(fc.x, -0.08, fc.z);
            this.sceneryGroup.add(school);
            this.ambientFishSchools.push({
                mesh: school,
                speed: 0.65 + (idx % 3) * 0.2
            });
        });

        // 7. 10 Flocks of Seagulls & Lac Birds with Animated Flapping Wings
        this.ambientSeagulls = [];
        for (let i = 0; i < 10; i++) {
            const flock = ProceduralModels.createSeagullFlock();
            flock.scale.setScalar(1.38);
            this.sceneryGroup.add(flock);
            this.ambientSeagulls.push({
                mesh: flock,
                radius: 18 + i * 3.8,
                angle: i * 0.9,
                speed: 0.22 + (i % 3) * 0.06,
                height: 9.5 + (i % 4) * 2.0
            });
        }
    }

    axialToWorld(q, r) {
        const size = this.hexRadius * 1.03;
        const x = size * Math.sqrt(3) * (q + r / 2);
        const z = size * (3 / 2) * r;
        return { x, z };
    }

    static hexDistance(a, b) {
        return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
    }

    // ------------------------------------------------------------------------
    // V6.0 TRUE S-CURVE VIETNAM MAP & 6 ECONOMIC REGIONS (Modeled on Reference Photo)
    // - `col` is the true horizontal screen column (West = negative, East = positive):
    //   1. North (`r = -14..-8`): Wide Northern Crown (`col = -5..+4`), divided into
    //      Region 0 (Trung du & Miền núi Bắc Bộ — Deep Green) & Region 1 (Đồng bằng Sông Hồng — Bright Yellow)
    //   2. Upper-Left Bend of 'S' (`r = -7..-3`): Curves strongly West (`col = -5..-2`),
    //      forming Bắc Trung Bộ & Vịnh Bắc Bộ (Region 2 — Slate-Teal)
    //   3. Middle-Right Bulge of 'S' (`r = -2..+4`): Curves strongly East (`col = -1..+4`),
    //      with Region 3 (Tây Nguyên — Basalt Brown) on the elevated INLAND WEST (`col = -1..+2`)
    //      and Region 2 (Duyên hải Miền Trung — Slate-Teal) hugging the OUTER EAST COAST (`col = +2..+4`)!
    //   4. Lower-Right to SW Transition (`r = +5..+8`): Curves SW (`col = -4..+1`),
    //      forming Region 4 (Đông Nam Bộ — Crimson-Burgundy)
    //   5. Bottom-Left Hook of 'S' (`r = +8..+14`): Sweeps far SW (`col = -8..-3`) to Mũi Cà Mau,
    //      forming Region 5 (Đồng bằng Sông Cửu Long — Alluvial Green) with navigable Mekong River channels!
    // ------------------------------------------------------------------------
    getVietnamLandRowSpec(r) {
        const table = {
            // 1. TRUNG DU & MIỀN NÚI BẮC BỘ (Region 0) + 2. ĐỒNG BẰNG SÔNG HỒNG (Region 1 — Wide, Solid Golden Plain)
            "-14": { minCol: -2, maxCol: 2,  getReg: () => 0 },
            "-13": { minCol: -4, maxCol: 3,  getReg: () => 0 },
            "-12": { minCol: -5, maxCol: 3,  getReg: () => 0 },
            "-11": { minCol: -5, maxCol: 2,  getReg: (c) => (c >= -1 ? 1 : 0) },
            "-10": { minCol: -5, maxCol: 2,  getReg: (c) => (c >= -2 ? 1 : 0) },
            "-9":  { minCol: -4, maxCol: 1,  getReg: (c) => (c >= -3 ? 1 : 0) },
            "-8":  { minCol: -4, maxCol: 0,  getReg: () => 1 },

            // Upper-Left Concave Bend of the Letter S (Bắc Trung Bộ — Region 2)
            "-7":  { minCol: -5, maxCol: -1, getReg: () => 2 },
            "-6":  { minCol: -5, maxCol: -2, getReg: () => 2 },
            "-5":  { minCol: -5, maxCol: -2, getReg: () => 2 },
            "-4":  { minCol: -4, maxCol: -1, getReg: () => 2 },
            "-3":  { minCol: -3, maxCol: 0,  getReg: () => 2 },
            "-2":  { minCol: -2, maxCol: 2,  getReg: () => 2 },

            // Middle-Right Convex Bulge of the Letter S:
            // Inland West = 4. Tây Nguyên (Region 3), Outer East Coast = 3. Duyên hải Miền Trung (Region 2)
            "-1":  { minCol: -1, maxCol: 2,  getReg: (c) => (c <= 0 ? 3 : 2) },
            "0":   { minCol: -1, maxCol: 3,  getReg: (c) => (c <= 1 ? 3 : 2) },
            "1":   { minCol: 0,  maxCol: 4,  getReg: (c) => (c <= 2 ? 3 : 2) },
            "2":   { minCol: 0,  maxCol: 4,  getReg: (c) => (c <= 2 ? 3 : 2) },
            "3":   { minCol: -1, maxCol: 3,  getReg: (c) => (c <= 1 ? 3 : 2) },
            "4":   { minCol: -1, maxCol: 2,  getReg: (c) => (c <= 0 ? 3 : 2) },

            // South-Westward Curve into Đông Nam Bộ (Region 4)
            "5":   { minCol: -3, maxCol: 1,  getReg: (c) => (c <= 0 ? 4 : 2) },
            "6":   { minCol: -4, maxCol: 0,  getReg: () => 4 },
            "7":   { minCol: -5, maxCol: 0,  getReg: () => 4 },

            // Bottom-Left Tail Hook of the Letter S: Đồng bằng Sông Cửu Long (Region 5) — 100% Solid Lush Delta!
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
        this.animatedLandProps = [];
        this.fairSpawnAnchors = [];
        this.activeNPCTile = null;

        // 5 Balanced Starting Anchorages along the S-Shaped Sea Lane
        const spawnAnchorKeys = new Set([
            "-10,7", // Anchor 1 (Vịnh Bắc Bộ)
            "-5,4",  // Anchor 2 (Bắc Trung Bộ)
            "0,6",   // Anchor 3 (Duyên hải Miền Trung – Tây Nguyên)
            "6,4",   // Anchor 4 (Đông Nam Bộ)
            "11,0"   // Anchor 5 (Đồng bằng Sông Cửu Long)
        ]);

        // 6 Trading Ports, 9 Monuments, 25 Resource Nodes (15 Coastal + 10 Offshore Sea Nodes),
        // 10 Navigable Sea Reefs (Bãi Đá Ngầm: -1 HP if sailed through),
        // & 2 Sovereignty Archipelagos (Hoàng Sa & Trường Sa).
        // ALL coastal POIs sit cleanly in the coastal waters (`col > rowSpec.maxCol`),
        // so the mainland & deltas (`minCol..maxCol`) are 100% solid with ZERO holes!
        const specialPlacements = {
            // 1. TRUNG DU & MIỀN NÚI BẮC BỘ (Region 0)
            "-14,3":  { terrain: "coast", monumentId: "mon_sapa", regionId: 0, navigable: true },
            "-13,5":  { terrain: "coast", resourceType: "iron", regionId: 0, navigable: true },
            "-12,4":  { terrain: "coast", isPort: true, portName: "Thương Cảng Cái Lân (Quảng Ninh)", regionId: 0, navigable: true },
            "-12,7":  { terrain: "coast", resourceType: "wood", regionId: 0, navigable: true },
            "-11,4":  { terrain: "island", monumentId: "mon_halong", regionId: 0, navigable: true },
            // Offshore Region 0 Resources & Reef
            "-13,8":  { terrain: "sea", resourceType: "food", regionId: 0, navigable: true, isOffshore: true },
            "-11,9":  { terrain: "sea", resourceType: "iron", regionId: 0, navigable: true, isOffshore: true },
            "-12,5":  { terrain: "reef", isReef: true, regionId: 0, navigable: true },

            // 2. ĐỒNG BẰNG SÔNG HỒNG (Region 1)
            "-10,3":  { terrain: "coast", monumentId: "mon_vanmieu", regionId: 1, navigable: true },
            "-10,5":  { terrain: "coast", resourceType: "food", regionId: 1, navigable: true },
            "-9,2":   { terrain: "coast", isPort: true, portName: "Thương Cảng Hải Phòng", regionId: 1, navigable: true },
            "-8,2":   { terrain: "coast", resourceType: "wood", regionId: 1, navigable: true },
            // Offshore Region 1 Resources & Reefs
            "-9,8":   { terrain: "sea", resourceType: "wood", regionId: 1, navigable: true, isOffshore: true },
            "-8,10":  { terrain: "sea", resourceType: "food", regionId: 1, navigable: true, isOffshore: true },
            "-9,4":   { terrain: "reef", isReef: true, regionId: 1, navigable: true },
            "-8,6":   { terrain: "reef", isReef: true, regionId: 1, navigable: true },

            // 3. BẮC TRUNG BỘ & DUYÊN HẢI MIỀN TRUNG (Region 2)
            "-7,0":   { terrain: "coast", resourceType: "iron", regionId: 2, navigable: true },
            "-5,-1":  { terrain: "coast", monumentId: "mon_phongnha", regionId: 2, navigable: true },
            "-5,2":   { terrain: "coast", resourceType: "food", regionId: 2, navigable: true },
            "-3,1":   { terrain: "coast", monumentId: "mon_hue", regionId: 2, navigable: true },
            "-3,4":   { terrain: "coast", resourceType: "wood", regionId: 2, navigable: true },
            "-2,3":   { terrain: "coast", isPort: true, portName: "Thương Cảng Tiên Sa (Đà Nẵng)", regionId: 2, navigable: true },
            "-2,7":   { terrain: "archipelago", archipelagoName: "QUẦN ĐẢO HOÀNG SA", archipelagoSub: "TP. Đà Nẵng • Chủ Quyền Việt Nam", regionId: 2, navigable: false },
            "-1,3":   { terrain: "coast", monumentId: "mon_myson", regionId: 2, navigable: true },
            "-1,5":   { terrain: "coast", resourceType: "iron", regionId: 2, navigable: true },
            // Offshore Region 2 Resources & Reefs
            "-6,7":   { terrain: "sea", resourceType: "iron", regionId: 2, navigable: true, isOffshore: true },
            "-4,9":   { terrain: "sea", resourceType: "food", regionId: 2, navigable: true, isOffshore: true },
            "-6,2":   { terrain: "reef", isReef: true, regionId: 2, navigable: true },
            "-4,3":   { terrain: "reef", isReef: true, regionId: 2, navigable: true },
            "-1,6":   { terrain: "reef", isReef: true, regionId: 2, navigable: true },

            // 4. TÂY NGUYÊN & LIÊN KẾT NAM TRUNG BỘ (Region 3)
            "1,5":    { terrain: "coast", isPort: true, portName: "Thương Cảng Liên Vùng Tây Nguyên – Quy Nhơn", regionId: 3, navigable: true },
            "2,7":    { terrain: "coast", resourceType: "food", regionId: 3, navigable: true },
            "3,4":    { terrain: "coast", monumentId: "mon_taynguyen", regionId: 3, navigable: true },
            "4,5":    { terrain: "coast", resourceType: "wood", regionId: 3, navigable: true },
            // Offshore Region 3 Resources & Reefs
            "1,9":    { terrain: "sea", resourceType: "wood", regionId: 3, navigable: true, isOffshore: true },
            "4,9":    { terrain: "sea", resourceType: "iron", regionId: 3, navigable: true, isOffshore: true },
            "2,5":    { terrain: "reef", isReef: true, regionId: 3, navigable: true },
            "5,5":    { terrain: "reef", isReef: true, regionId: 3, navigable: true },

            // 5. ĐÔNG NAM BỘ (Region 4)
            "6,2":    { terrain: "coast", resourceType: "iron", regionId: 4, navigable: true },
            "7,1":    { terrain: "coast", isPort: true, portName: "Thương Cảng Quốc Tế Cái Mép – Sài Gòn", regionId: 4, navigable: true },
            "7,4":    { terrain: "coast", resourceType: "food", regionId: 4, navigable: true },
            "8,0":    { terrain: "coast", monumentId: "mon_bennharong", regionId: 4, navigable: true },
            "8,6":    { terrain: "archipelago", archipelagoName: "QUẦN ĐẢO TRƯỜNG SA", archipelagoSub: "Tỉnh Khánh Hòa • Chủ Quyền Việt Nam", regionId: 4, navigable: false },
            // Offshore Region 4 Resource & Reef
            "6,8":    { terrain: "sea", resourceType: "food", regionId: 4, navigable: true, isOffshore: true },
            "7,3":    { terrain: "reef", isReef: true, regionId: 4, navigable: true },

            // 6. ĐỒNG BẰNG SÔNG CỬU LONG (Region 5 — Solid Delta Mainland + Coastal POIs)
            "9,-1":   { terrain: "coast", resourceType: "wood", regionId: 5, navigable: true },
            "10,-1":  { terrain: "coast", monumentId: "mon_cairang", regionId: 5, navigable: true },
            "11,-2":  { terrain: "coast", isPort: true, portName: "Thương Cảng Cần Thơ – Cửu Long", regionId: 5, navigable: true },
            "11,1":   { terrain: "coast", resourceType: "iron", regionId: 5, navigable: true },
            "12,-3":  { terrain: "coast", resourceType: "food", regionId: 5, navigable: true },
            // Offshore Region 5 Resource & Reef
            "11,6":   { terrain: "sea", resourceType: "wood", regionId: 5, navigable: true, isOffshore: true },
            "10,2":   { terrain: "reef", isReef: true, regionId: 5, navigable: true }
        };

        const layoutSpec = [];
        for (let r = -14; r <= 14; r++) {
            const rowSpec = this.getVietnamLandRowSpec(r);
            const qCenterOffset = -Math.floor(r / 2);

            // Generate hexes from the western coastal waters across the S-shaped mainland to the East Sea
            const minSeaCol = rowSpec.minCol - 1;
            const maxSeaCol = 10;

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

                // STRICT GUARANTEE: Every tile inside `rowSpec.minCol..rowSpec.maxCol` is 100% solid mainland (zero holes!)
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
        // 6 Golden Regional Plaques Placed Around the S-Curve (Matching Reference Image Layout!)
        const regionBanners = [
            { r: -13, col: -2, line1: "1. TRUNG DU &", line2: "MIỀN NÚI BẮC BỘ", color: "#2d7a36" },
            { r: -10, col: 0,  line1: "2. ĐỒNG BẰNG", line2: "SÔNG HỒNG", color: "#f5b81c" },
            { r: -4,  col: -3, line1: "3. DUYÊN HẢI", line2: "MIỀN TRUNG", color: "#5a7f91" },
            { r: 2,   col: 1,  line1: "4. TÂY NGUYÊN", line2: "CAO NGUYÊN BAZAN", color: "#994920" },
            { r: 6,   col: -2, line1: "5. ĐÔNG NAM BỘ", line2: "ĐẦU TÀU KINH TẾ", color: "#8a2430" },
            { r: 11,  col: -6, line1: "6. ĐỒNG BẰNG", line2: "SÔNG CỬU LONG", color: "#659b38" }
        ];
        regionBanners.forEach(rb => {
            const q = -Math.floor(rb.r / 2) + rb.col;
            const { x, z } = this.axialToWorld(q, rb.r);
            const sprite = ProceduralModels.createRegionBannerSprite(rb.line1, rb.line2, rb.color, 4.8, 1.36);
            sprite.position.set(x, 3.25, z);
            this.boardGroup.add(sprite);
        });

        // 3D Nautical Compass Rose in the Western Waters
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

        let height = 0.28;
        let topColor = new THREE.Color(region.color);

        if (spec.terrain === "sea") {
            height = 0.14;
            const seaDist = Math.max(1, (spec.col || 0) - (spec.maxLandCol !== undefined ? spec.maxLandCol : 0));
            if (spec.isSpawnRim) {
                topColor = new THREE.Color(0x0891b2);
            } else if (seaDist <= 2) {
                topColor = new THREE.Color(0x0284c7);
            } else if (seaDist <= 4) {
                topColor = new THREE.Color(0x0369a1);
            } else {
                topColor = new THREE.Color(0x075985);
            }
        } else if (spec.terrain === "coast") {
            height = 0.22;
            topColor = new THREE.Color(0x06b6d4).lerp(new THREE.Color(region.color), 0.22);
        } else if (spec.terrain === "river_channel") {
            height = 0.22;
            topColor = new THREE.Color(0x0ea5e9);
        } else if (spec.terrain === "reef") {
            height = 0.26;
            topColor = new THREE.Color(0x27272a);
        } else if (spec.terrain === "archipelago") {
            height = 0.50;
            topColor = new THREE.Color(0x0f766e);
        } else if (spec.terrain === "mountain") {
            height = 1.32 + jitter * 0.56;
            topColor.offsetHSL(0, (jitter - 0.5) * 0.05, (jitter - 0.5) * 0.05);
        } else if (spec.terrain === "highland") {
            height = 1.08 + jitter * 0.38;
            topColor.offsetHSL(0, (jitter - 0.5) * 0.05, (jitter - 0.5) * 0.04);
        } else if (spec.terrain === "southeast_land") {
            height = 0.78 + jitter * 0.22;
            topColor.offsetHSL(0, (jitter - 0.5) * 0.04, (jitter - 0.5) * 0.04);
        } else if (spec.terrain === "coast_land") {
            height = 0.70 + jitter * 0.20;
            topColor.offsetHSL(0, (jitter - 0.5) * 0.04, (jitter - 0.5) * 0.04);
        } else if (spec.terrain === "delta_land") {
            height = 0.62 + jitter * 0.14;
            topColor.offsetHSL(0, (jitter - 0.5) * 0.03, (jitter - 0.5) * 0.03);
        } else if (spec.terrain === "island") {
            height = 0.48;
        } else {
            height = 0.36;
        }

        const isWaterHex = (spec.terrain === "sea" || spec.terrain === "coast" || spec.terrain === "river_channel");

        // Realistic Stratified Terrain Relief for Mainland & Island Hexes:
        // 1) Sandy Coastal Shelf Skirt at water level so land meets sea naturally
        if (!isWaterHex && spec.terrain !== "reef") {
            const sandGeo = new THREE.CylinderGeometry(this.hexRadius * 1.01, this.hexRadius * 1.06, 0.22, 6);
            const sandMat = new THREE.MeshStandardMaterial({
                color: 0xdcc08e,
                roughness: 0.78,
                metalness: 0.08
            });
            const sandSkirt = new THREE.Mesh(sandGeo, sandMat);
            sandSkirt.position.y = 0.01;
            sandSkirt.receiveShadow = true;
            group.add(sandSkirt);
        }

        const hexGeo = new THREE.CylinderGeometry(this.hexRadius * 0.97, this.hexRadius * 1.01, height, 6);
        const cliffOrTopColor = isWaterHex ? topColor : topColor.clone().multiplyScalar(0.84);
        const hexMat = new THREE.MeshStandardMaterial({
            color: cliffOrTopColor,
            roughness: isWaterHex ? 0.16 : 0.68,
            metalness: isWaterHex ? 0.46 : 0.12,
            transparent: isWaterHex,
            opacity: spec.terrain === "sea" ? 0.54 : (isWaterHex ? 0.76 : 1.0)
        });

        const baseMesh = new THREE.Mesh(hexGeo, hexMat);
        baseMesh.position.y = height / 2 - 0.1;
        baseMesh.receiveShadow = true;
        baseMesh.castShadow = !isWaterHex;
        group.add(baseMesh);

        // 2) Beveled Lush Top Plateau Cap on Land Hexes for Realistic 3D Depth
        if (!isWaterHex && spec.terrain !== "reef") {
            const capGeo = new THREE.CylinderGeometry(this.hexRadius * 0.91, this.hexRadius * 0.96, 0.09, 6);
            const capMat = new THREE.MeshStandardMaterial({
                color: topColor,
                roughness: 0.50,
                metalness: 0.10
            });
            const capMesh = new THREE.Mesh(capGeo, capMat);
            capMesh.position.y = height - 0.08;
            capMesh.receiveShadow = true;
            capMesh.castShadow = true;
            group.add(capMesh);
        }

        const rimGeo = new THREE.RingGeometry(this.hexRadius * 0.88, this.hexRadius * 0.96, 6);
        rimGeo.rotateX(-Math.PI / 2);
        rimGeo.rotateZ(Math.PI / 6);
        const rimColor = spec.terrain === "reef" ? new THREE.Color(0x64748b) : new THREE.Color(region.color);
        const rimMat = new THREE.MeshBasicMaterial({
            color: rimColor,
            transparent: true,
            opacity: isWaterHex ? 0.04 : 0.28,
            side: THREE.DoubleSide
        });
        const rimMesh = new THREE.Mesh(rimGeo, rimMat);
        rimMesh.position.y = height - 0.09;
        group.add(rimMesh);

        const hlGeo = new THREE.RingGeometry(this.hexRadius * 0.82, this.hexRadius * 0.98, 6);
        hlGeo.rotateX(-Math.PI / 2);
        hlGeo.rotateZ(Math.PI / 6);
        const hlMat = new THREE.MeshBasicMaterial({
            color: 0x00f5d4,
            transparent: true,
            opacity: 0.0,
            side: THREE.DoubleSide
        });
        const highlightRing = new THREE.Mesh(hlGeo, hlMat);
        highlightRing.position.y = height - 0.05;
        group.add(highlightRing);

        const surfaceY = height - 0.1;

        if (spec.terrain === "reef" || spec.isReef) {
            const reefMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.78, metalness: 0.22 });
            const coralMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xe11d48, emissiveIntensity: 0.65 });
            [[-0.45, 0.14, 1.05], [0.42, -0.26, 0.85], [0.08, 0.45, 0.74], [-0.15, -0.35, 0.65]].forEach(([rx, rz, h]) => {
                const spire = new THREE.Mesh(new THREE.ConeGeometry(0.40, h, 5), reefMat);
                spire.position.set(rx, surfaceY + h / 2, rz);
                spire.rotation.z = (rx * 0.25);
                spire.castShadow = true;
                group.add(spire);
            });
            const warnRingGeo = new THREE.RingGeometry(0.75, 1.05, 18);
            warnRingGeo.rotateX(-Math.PI / 2);
            const warnRing = new THREE.Mesh(
                warnRingGeo,
                new THREE.MeshBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
            );
            warnRing.position.y = surfaceY + 0.04;
            group.add(warnRing);

            const warnOrb = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), coralMat);
            warnOrb.position.set(0, surfaceY + 1.25, 0);
            group.add(warnOrb);
            this.animatedLandProps.push({ type: "spin_y", mesh: warnOrb, speed: 2.4 });
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

        // Respect current cloud visibility setting for mountain clouds
        if (!this.cloudsVisible) {
            this.animatedLandProps.forEach(item => {
                if (item.type === "orbit_cloud" && item.mesh) item.mesh.visible = false;
            });
        }

        const tileObj = {
            index,
            q: spec.q,
            r: spec.r,
            x,
            z,
            height,
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
            highlightRing,
            propModel: null,
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

            // Radiant Monument Sky Beacon + Double Magic Halo Rings + Orbiting Crystals
            // Makes Monuments unmistakably luminous from anywhere on the map!
            const tierHexColors = { 1: 0x34d399, 2: 0xfbbf24, 3: 0xf43f5e };
            const glowHex = tierHexColors[tier] || 0xfbbf24;
            const glowGroup = new THREE.Group();
            glowGroup.position.y = surfaceY;

            const outerHaloGeo = new THREE.RingGeometry(this.hexRadius * 0.92, this.hexRadius * 1.18, 24);
            outerHaloGeo.rotateX(-Math.PI / 2);
            const outerHalo = new THREE.Mesh(
                outerHaloGeo,
                new THREE.MeshBasicMaterial({ color: glowHex, transparent: true, opacity: 0.72, side: THREE.DoubleSide })
            );
            outerHalo.position.y = 0.06;
            glowGroup.add(outerHalo);

            const innerHaloGeo = new THREE.RingGeometry(this.hexRadius * 0.56, this.hexRadius * 0.78, 6);
            innerHaloGeo.rotateX(-Math.PI / 2);
            const innerHalo = new THREE.Mesh(
                innerHaloGeo,
                new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.65, side: THREE.DoubleSide })
            );
            innerHalo.position.y = 0.09;
            glowGroup.add(innerHalo);

            const skyBeamGeo = new THREE.CylinderGeometry(0.26, 1.05, 5.8, 16, 1, true);
            const skyBeamMat = new THREE.MeshBasicMaterial({
                color: glowHex,
                transparent: true,
                opacity: 0.24,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            const skyBeam = new THREE.Mesh(skyBeamGeo, skyBeamMat);
            skyBeam.position.y = 2.9;
            glowGroup.add(skyBeam);

            const orbitOrbsGroup = new THREE.Group();
            orbitOrbsGroup.position.y = 1.45;
            for (let oi = 0; oi < 3; oi++) {
                const ang = (oi / 3) * Math.PI * 2;
                const orb = new THREE.Mesh(
                    new THREE.OctahedronGeometry(0.18, 0),
                    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: glowHex, emissiveIntensity: 1.1 })
                );
                orb.position.set(Math.cos(ang) * 1.25, 0, Math.sin(ang) * 1.25);
                orbitOrbsGroup.add(orb);
            }
            glowGroup.add(orbitOrbsGroup);

            glowGroup.userData = { outerHalo, innerHalo, skyBeam, orbitOrbsGroup, baseColor: glowHex };
            group.add(glowGroup);
            tileObj.monumentGlowGroup = glowGroup;

            const tierReqLabel = {
                1: "★ Cấp 1 (Dễ - Tối đa 1 lần): Cần 1 Key 1 + 1 Lúa + 2 Xu",
                2: "★★ Cấp 2 (Vừa): Cần 1 Key 2 + 2 Lúa + 3 Xu",
                3: "★★★ Cấp 3 (Khó): Cần 1 Key 3 + 3 Lúa + 1 Sắt + 6 Xu"
            };
            const tierColors = { 1: "#34d399", 2: "#fbbf24", 3: "#f87171" };
            const sprite = ProceduralModels.createLabelCanvas(
                `✨🏛️ ${monData.name}`,
                tierReqLabel[tier],
                "rgba(11, 19, 30, 0.95)",
                tierColors[tier],
                4.6,
                1.36
            );
            sprite.position.set(0, surfaceY + 3.45, 0);
            group.add(sprite);
            tileObj.labelSprite = sprite;

        } else if (spec.isPort) {
            const portModel = ProceduralModels.createTradePortModel(region.color);
            portModel.position.y = surfaceY;
            group.add(portModel);
            tileObj.propModel = portModel;

            const sprite = ProceduralModels.createLabelCanvas(
                `⚓ ${spec.portName}`,
                `${region.specialty.icon} ${region.specialty.shortName} • Lúa/Gỗ/Sắt • 1 Key`,
                "rgba(11, 19, 30, 0.90)",
                region.color,
                3.9,
                1.14
            );
            sprite.position.set(0, surfaceY + 2.35, 0);
            group.add(sprite);
            tileObj.labelSprite = sprite;

        } else if (spec.resourceType) {
            const resModel = ProceduralModels.createResourceNodeModel(spec.resourceType);
            resModel.position.y = surfaceY;
            group.add(resModel);
            tileObj.propModel = resModel;

            const prefix = spec.isOffshore ? "🌊 Biển Xa: " : "";
            const resNames = {
                food: { title: `🌾 ${prefix}Vựa Lúa & Ngư Trường`, sub: "Khai thác nhận +1~2 Lúa" },
                wood: { title: `🌲 ${prefix}Lâm Trường & Gỗ Quý`, sub: "Khai thác nhận +1~2 Gỗ" },
                iron: { title: `⛏️ ${prefix}Mỏ Khoáng Sản Sắt`, sub: "Khai thác nhận +1~2 Sắt" }
            };
            const rInfo = resNames[spec.resourceType];
            const sprite = ProceduralModels.createLabelCanvas(
                rInfo.title,
                rInfo.sub,
                "rgba(11, 19, 30, 0.88)",
                spec.isOffshore ? "#22d3ee" : "#38bdf8",
                3.4,
                1.04
            );
            sprite.position.set(0, surfaceY + 2.05, 0);
            group.add(sprite);
            tileObj.labelSprite = sprite;
        } else if (tileObj.isReef) {
            const sprite = ProceduralModels.createLabelCanvas(
                "⚠️ Bãi Đá Ngầm",
                "Đi qua bị -1 ❤️ HP (Nhấp đúp giữ kéo để né)",
                "rgba(45, 10, 20, 0.92)",
                "#fb7185",
                3.4,
                0.98
            );
            sprite.position.set(0, surfaceY + 1.85, 0);
            group.add(sprite);
            tileObj.labelSprite = sprite;
        }

        // Tag all 3D meshes inside navigable tiles (Ports, Monuments, Resources, Buoys)
        // so clicking any part of the 3D building/boat accurately picks that navigable tile!
        if (tileObj.navigable) {
            group.traverse(child => {
                if (child.isMesh) {
                    child.userData = child.userData || {};
                    child.userData.tile = tileObj;
                }
            });
        }

        return tileObj;
    }

    despawnRareNPC() {
        if (!this.activeNPCTile) return;
        const t = this.activeNPCTile;
        t.hasNPC = false;
        if (t.propModel) {
            t.group.remove(t.propModel);
            t.propModel = null;
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
            !t.isSpawnRim
        );
        if (seaCandidates.length === 0) return null;

        const chosen = seaCandidates[Math.floor(Math.random() * seaCandidates.length)];
        chosen.hasNPC = true;
        const surfaceY = chosen.height - 0.1;

        const npcModel = ProceduralModels.createNPCharacterModel("#38bdf8", false);
        npcModel.position.y = surfaceY;
        npcModel.scale.setScalar(1.6);
        npcModel.traverse(child => {
            if (child.isMesh) {
                child.userData = child.userData || {};
                child.userData.tile = chosen;
            }
        });
        chosen.group.add(npcModel);
        chosen.propModel = npcModel;

        const sprite = ProceduralModels.createLabelCanvas(
            "🧙‍♂️ Tiên Ông Rìu Vàng (Hiếm)",
            "Giải đố nhận +2~3 Xu Vàng!",
            "rgba(11, 19, 30, 0.94)",
            "#fde047",
            3.5,
            1.08
        );
        sprite.position.set(0, surfaceY + 2.25, 0);
        chosen.group.add(sprite);
        chosen.labelSprite = sprite;

        this.activeNPCTile = chosen;
        this.triggerBurstAnimation(chosen.q, chosen.r, 0xfde047, 24);
        return chosen;
    }

    // ------------------------------------------------------------------------
    // PLAYER SHIPS — IMMUTABLE SHIP KEY MAPPING & LOCAL PLAYER ARROW MARKER
    // Fixes perspective/ship-name swap bug permanently!
    // ------------------------------------------------------------------------
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

        // Verify that every player's shipKey, name, archetypeId, and local marker match 100%
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
        const seatOrIdx = player.seatIndex !== undefined ? player.seatIndex : playerIdx;
        const angle = (seatOrIdx / Math.max(1, totalPlayers)) * Math.PI * 2;
        const offsetRadius = totalPlayers > 1 ? 0.36 : 0;
        shipMesh.position.set(
            tile.x + Math.cos(angle) * offsetRadius,
            tile.height - 0.05,
            tile.z + Math.sin(angle) * offsetRadius
        );
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
        const seatOrIdx = player.seatIndex !== undefined ? player.seatIndex : playerIdx;
        const angle = (seatOrIdx / Math.max(1, totalPlayers)) * Math.PI * 2;
        const offsetRadius = totalPlayers > 1 ? 0.36 : 0;

        const waypoints = [shipMesh.position.clone()];
        pathTiles.forEach((t, idx) => {
            const isLast = (idx === pathTiles.length - 1);
            waypoints.push(new THREE.Vector3(
                t.x + (isLast ? Math.cos(angle) * offsetRadius : 0),
                t.height - 0.05,
                t.z + (isLast ? Math.sin(angle) * offsetRadius : 0)
            ));
        });

        let segIndex = 0;
        const segDuration = 290;

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
                    const swell = 1.0 + Math.sin(t * Math.PI) * 0.16;
                    shipMesh.userData.mainSail.scale.set(swell, 1.0, swell);
                }

                if (Math.random() < 0.58) {
                    this.spawnWakeParticle(shipMesh.position.x, shipMesh.position.y, shipMesh.position.z);
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

    showPathPreview(pathTiles) {
        this.clearPathPreview();
        if (!pathTiles || pathTiles.length === 0) return;

        const points = [];
        pathTiles.forEach(t => {
            points.push(new THREE.Vector3(t.x, t.height + 0.26, t.z));
            const dot = new THREE.Mesh(
                new THREE.SphereGeometry(0.22, 10, 10),
                new THREE.MeshBasicMaterial({ color: 0xfde047 })
            );
            dot.position.set(t.x, t.height + 0.26, t.z);
            this.pathPreviewGroup.add(dot);
        });

        if (points.length >= 2) {
            const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
            const lineMat = new THREE.LineBasicMaterial({ color: 0xfde047, linewidth: 3 });
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
        const geo = new THREE.RingGeometry(0.12, 0.34, 12);
        geo.rotateX(-Math.PI / 2);
        const mat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.78, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y + 0.02, z);
        this.effectsGroup.add(mesh);

        this.floatingEffects.push({
            mesh,
            type: "wake",
            birth: performance.now(),
            life: 680
        });
    }

    triggerBurstAnimation(q, r, colorHex = 0xfacc15, count = 18) {
        const tile = this.hexMap.get(`${q},${r}`);
        if (!tile) return;

        for (let i = 0; i < count; i++) {
            const geo = new THREE.OctahedronGeometry(0.18, 0);
            const mat = new THREE.MeshStandardMaterial({
                color: colorHex,
                emissive: colorHex,
                emissiveIntensity: 0.75,
                transparent: true,
                opacity: 1
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(tile.x, tile.height + 0.6, tile.z);
            this.effectsGroup.add(mesh);

            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
            const speed = 1.4 + Math.random() * 2.1;
            this.floatingEffects.push({
                mesh,
                type: "burst",
                vx: Math.cos(angle) * speed,
                vy: 2.5 + Math.random() * 2.2,
                vz: Math.sin(angle) * speed,
                birth: performance.now(),
                life: 1100
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
        const duration = 520;

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
                    tile.highlightRing.material.color.setHex(0x00f5d4);
                    tile.highlightRing.material.opacity = 0.95;
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
                tile.propModel.scale.setScalar(depleted ? 0.55 : 1.22);
                tile.propModel.position.y = (tile.height - 0.1) - (depleted ? 0.12 : 0);

                // Storm-restricted resource node indicator during Giông Bão
                if (tile.stormRestricted && !tile.stormRestrictGroup) {
                    const restrictGroup = new THREE.Group();
                    restrictGroup.position.y = tile.height - 0.05;
                    const barRingGeo = new THREE.RingGeometry(0.95, 1.32, 24);
                    barRingGeo.rotateX(-Math.PI / 2);
                    const barRing = new THREE.Mesh(
                        barRingGeo,
                        new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
                    );
                    restrictGroup.add(barRing);

                    const domeGeo = new THREE.CylinderGeometry(1.18, 1.18, 1.9, 16, 1, true);
                    const dome = new THREE.Mesh(
                        domeGeo,
                        new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.24, side: THREE.DoubleSide, depthWrite: false })
                    );
                    dome.position.y = 0.95;
                    restrictGroup.add(dome);

                    const badge = ProceduralModels.createLabelCanvas(
                        "⛔ BÃO CẤM VÀO",
                        "Giông Bão phong tỏa mỏ",
                        "rgba(127, 29, 29, 0.96)",
                        "#fca5a5",
                        3.1,
                        0.92
                    );
                    badge.position.set(0, 2.85, 0);
                    restrictGroup.add(badge);

                    tile.group.add(restrictGroup);
                    tile.stormRestrictGroup = restrictGroup;
                } else if (!tile.stormRestricted && tile.stormRestrictGroup) {
                    tile.group.remove(tile.stormRestrictGroup);
                    tile.stormRestrictGroup = null;
                }
            }
        });
    }

    // ------------------------------------------------------------------------
    // 3D LIGHTNING STRIKE & MONUMENT TRAP ANIMATIONS (ARROW / BOULDER / LIGHTNING)
    // ------------------------------------------------------------------------
    triggerLightningStrikeEffect(q, r) {
        const tile = this.hexMap.get(`${q},${r}`);
        if (!tile) return;

        // 1. Jagged 3D Sky Lightning Bolt
        const boltGroup = new THREE.Group();
        boltGroup.position.set(tile.x, tile.height, tile.z);
        const boltPts = [];
        const segs = 10;
        for (let i = 0; i <= segs; i++) {
            const y = (1 - i / segs) * 26;
            const jx = (i === 0 || i === segs) ? 0 : (Math.random() - 0.5) * 2.2;
            const jz = (i === 0 || i === segs) ? 0 : (Math.random() - 0.5) * 2.2;
            boltPts.push(new THREE.Vector3(jx, y, jz));
        }
        const boltGeo = new THREE.BufferGeometry().setFromPoints(boltPts);
        const boltMat = new THREE.LineBasicMaterial({ color: 0xe0f2fe, linewidth: 4, transparent: true, opacity: 1.0 });
        const boltLine = new THREE.Line(boltGeo, boltMat);
        boltGroup.add(boltLine);

        // Glowing plasma core cylinder along the strike column
        const beamGeo = new THREE.CylinderGeometry(0.18, 0.55, 25, 8);
        const beamMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.72 });
        const beamMesh = new THREE.Mesh(beamGeo, beamMat);
        beamMesh.position.y = 12.5;
        boltGroup.add(beamMesh);

        // Shockwave ring on water/land surface
        const ringGeo = new THREE.RingGeometry(0.3, 0.9, 24);
        ringGeo.rotateX(-Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.95, side: THREE.DoubleSide });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.y = 0.15;
        boltGroup.add(ringMesh);

        this.effectsGroup.add(boltGroup);
        this.floatingEffects.push({
            mesh: boltGroup,
            beamMat,
            ringMesh,
            ringMat,
            type: "lightning_bolt",
            birth: performance.now(),
            life: 850
        });

        this.triggerBurstAnimation(q, r, 0x38bdf8, 26);
    }

    triggerMonumentTrapEffect(q, r, tier = 1) {
        const tile = this.hexMap.get(`${q},${r}`);
        if (!tile) return;

        if (tier === 1) {
            // Tier 1 (Easy): Bẫy Mũi Tên (Volley of 10 glowing red-tipped arrows raining down!)
            for (let i = 0; i < 10; i++) {
                const arrowGroup = new THREE.Group();
                const shaft = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.04, 0.04, 1.35, 6),
                    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 })
                );
                const tip = new THREE.Mesh(
                    new THREE.ConeGeometry(0.12, 0.35, 6),
                    new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 0.85 })
                );
                tip.position.y = -0.75;
                tip.rotation.x = Math.PI;
                arrowGroup.add(shaft);
                arrowGroup.add(tip);

                const ox = (Math.random() - 0.5) * 1.9;
                const oz = (Math.random() - 0.5) * 1.9;
                arrowGroup.position.set(tile.x + ox, tile.height + 7.5 + i * 0.45, tile.z + oz);
                this.effectsGroup.add(arrowGroup);

                this.floatingEffects.push({
                    mesh: arrowGroup,
                    type: "trap_arrow",
                    targetY: tile.height + 0.45,
                    vy: -14.5,
                    birth: performance.now(),
                    life: 1250
                });
            }
            this.triggerBurstAnimation(q, r, 0xef4444, 18);
        } else if (tier === 2) {
            // Tier 2 (Medium): Bẫy Đá Lăn (4 giant jagged boulders crashing and tumbling across the Monument!)
            for (let i = 0; i < 4; i++) {
                const boulder = new THREE.Mesh(
                    new THREE.DodecahedronGeometry(0.52, 0),
                    new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.88, metalness: 0.15 })
                );
                const angle = (i / 4) * Math.PI * 2;
                boulder.position.set(
                    tile.x + Math.cos(angle) * 1.6,
                    tile.height + 4.8 + i * 0.5,
                    tile.z + Math.sin(angle) * 1.6
                );
                this.effectsGroup.add(boulder);

                this.floatingEffects.push({
                    mesh: boulder,
                    type: "trap_boulder",
                    vx: -Math.cos(angle) * 1.6,
                    vy: -6.5,
                    vz: -Math.sin(angle) * 1.6,
                    floorY: tile.height + 0.42,
                    birth: performance.now(),
                    life: 1450
                });
            }
            this.triggerBurstAnimation(q, r, 0xf97316, 24);
        } else {
            // Tier 3 (Hard): Bẫy Sét Đánh & Đá Lăn (Combined Lightning Bolt + Crashing Boulders!)
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
        let lastTapTime = 0;
        let lastTapTileKey = null;
        this.isDrawingCustomPath = false;

        const pickTileAtClientPos = (clientX, clientY) => {
            const rect = this.renderer.domElement.getBoundingClientRect();
            this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

            this.raycaster.setFromCamera(this.mouse, this.camera);
            // Raycast recursively against boardGroup so clicking 3D Port/Monument/Resource models or water hexes works!
            const rawHits = this.raycaster.intersectObjects(this.boardGroup.children, true);
            const tileHits = [];
            for (let i = 0; i < rawHits.length; i++) {
                const obj = rawHits[i].object;
                if (obj && obj.isMesh && obj.userData && obj.userData.tile) {
                    tileHits.push({ tile: obj.userData.tile, distance: rawHits[i].distance });
                }
            }
            if (tileHits.length === 0) return null;

            // If the first hit is navigable, return it immediately.
            // If the first hit is a tall mainland cliff edge slightly overlapping a coastal water hex,
            // prefer any reachable/navigable tile hit within 2.4 units of the first hit!
            const firstHit = tileHits[0];
            if (firstHit.tile.navigable) return firstHit.tile;
            for (let i = 1; i < tileHits.length; i++) {
                if (tileHits[i].tile.navigable && (tileHits[i].distance - firstHit.distance) <= 2.4) {
                    return tileHits[i].tile;
                }
            }
            return firstHit.tile;
        };

        this.renderer.domElement.addEventListener("pointerdown", (e) => {
            pointerDownPos = { x: e.clientX, y: e.clientY };
            const tile = pickTileAtClientPos(e.clientX, e.clientY);
            const now = performance.now();

            if (tile && tile.navigable) {
                const tKey = `${tile.q},${tile.r}`;
                // Double-click + Hold on the 2nd click enters Manual Drag-Path Mode!
                if (lastTapTileKey === tKey && (now - lastTapTime) <= 600 && this.onCustomPathStart) {
                    const started = this.onCustomPathStart(tile);
                    if (started) {
                        this.isDrawingCustomPath = true;
                        this.controls.enabled = false;
                        lastTapTime = 0;
                        lastTapTileKey = null;
                        return;
                    }
                }
                lastTapTime = now;
                lastTapTileKey = tKey;
            }
        });

        this.renderer.domElement.addEventListener("pointermove", (e) => {
            const tile = pickTileAtClientPos(e.clientX, e.clientY);

            // If currently holding & dragging a custom manual path, append adjacent hexes live!
            if (this.isDrawingCustomPath) {
                if (tile && tile.navigable && this.onCustomPathStep) {
                    this.onCustomPathStep(tile);
                }
                return;
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
                        tile.highlightRing.material.color.setHex(0x00f5d4);
                        tile.highlightRing.material.opacity = 0.95;
                        this.showPathPreview(this.reachablePaths.get(key).path);
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
                this.renderer.domElement.style.cursor = "grab";
                this.clearPathPreview();
                if (this.onHexHover) this.onHexHover(null, 0, 0);
            }
        });

        this.renderer.domElement.addEventListener("pointerup", (e) => {
            if (this.isDrawingCustomPath) {
                this.isDrawingCustomPath = false;
                this.controls.enabled = true;
                if (this.onCustomPathCommit) {
                    this.onCustomPathCommit();
                }
                return;
            }

            const moveDist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
            // Allow up to 28px pointer jitter so mouse clicks, trackpads, and tablet touch taps never drop!
            if (moveDist > 28) return;

            const tile = pickTileAtClientPos(e.clientX, e.clientY);
            if (tile && this.onHexClick) {
                this.onHexClick(tile);
            }
        });
    }

    startRenderLoop() {
        const animate = () => {
            requestAnimationFrame(animate);
            const delta = this.clock.getDelta();
            const elapsed = this.clock.getElapsedTime();
            const now = performance.now();

            // 1. Dynamic Ocean Waves
            if (this.oceanMesh) {
                const pos = this.oceanMesh.geometry.attributes.position;
                const amp = this.waveMultiplier || 1.0;
                for (let i = 0; i < pos.count; i++) {
                    const v = this.waterVertices[i];
                    const wave1 = Math.sin(v.x * 0.22 + elapsed * 1.7 + v.phase) * 0.15 * amp;
                    const wave2 = Math.cos(v.z * 0.20 + elapsed * 1.4) * 0.12 * amp;
                    pos.setY(i, wave1 + wave2);
                }
                pos.needsUpdate = true;
                this.oceanMesh.geometry.computeVertexNormals();
            }

            // 1b. Rain Particle Field (During Mưa Nhiệt Đới, Giông Bão & Siêu Bão Yagi)
            if (this.rainField && this.rainField.material.opacity > 0.01) {
                const rPos = this.rainField.geometry.attributes.position;
                const fallSpeed = 28 * delta;
                for (let i = 0; i < rPos.count; i++) {
                    let y = rPos.getY(i) - fallSpeed;
                    if (y < 0) y = 38;
                    rPos.setY(i, y);
                }
                rPos.needsUpdate = true;
            }

            // 2. Sky Clouds (Only animate when visible)
            if (this.cloudsVisible) {
                this.clouds.forEach(c => {
                    c.mesh.position.x += c.speed * delta;
                    if (c.mesh.position.x > 86) c.mesh.position.x = -86;
                });
            }

            // 3. Foam Rings (Skipped in Minimalist Mode)
            if (!this.minimalistMode) {
                this.foamRings.forEach(f => {
                    const s = 0.8 + Math.sin(elapsed * f.speed + f.offset) * 0.35;
                    f.mesh.scale.set(s, s, s);
                    f.mesh.material.opacity = 0.2 + Math.cos(elapsed * f.speed + f.offset) * 0.15;
                });
            }

            // 4. Player Ships + High-Visibility Locator Rings + Local Player 3D Arrow Marker Animation
            let shipIdx = 0;
            const wavePitch = (this.waveMultiplier || 1.0) * 0.048;
            this.shipMeshes.forEach((ship) => {
                ship.rotation.z = Math.sin(elapsed * 2.2 + shipIdx) * wavePitch;
                ship.rotation.x = Math.cos(elapsed * 1.8 + shipIdx) * (wavePitch * 0.75);
                if (ship.userData.flag) {
                    ship.userData.flag.rotation.y = Math.sin(elapsed * 5.8 + shipIdx) * 0.32;
                }
                if (ship.userData.mainSail) {
                    const breath = 1.0 + Math.sin(elapsed * 2.6 + shipIdx) * 0.045;
                    ship.userData.mainSail.scale.set(breath, 1.0, breath);
                }
                if (ship.userData.foreSail) {
                    const breath2 = 1.0 + Math.cos(elapsed * 2.8 + shipIdx) * 0.045;
                    ship.userData.foreSail.scale.set(breath2, 1.0, breath2);
                }
                // Pulse every ship's water locator ring on the horizontal XZ plane so all ships are easy to spot!
                if (ship.userData.ring) {
                    const rPulse = 1.0 + Math.sin(elapsed * 3.6 + shipIdx) * 0.08;
                    ship.userData.ring.scale.set(rPulse, 1, rPulse);
                }
                if (ship.userData.localRadarRing) {
                    const radarPulse = 1.0 + ((elapsed * 1.15) % 1.0) * 0.48;
                    ship.userData.localRadarRing.scale.set(radarPulse, 1, radarPulse);
                    ship.userData.localRadarRing.material.opacity = 0.90 * (1.0 - ((elapsed * 1.15) % 1.0) * 0.75);
                }
                if (ship.userData.myArrowMarker) {
                    ship.userData.myArrowMarker.position.y = 4.55 + Math.sin(elapsed * 4.5) * 0.28;
                    if (ship.userData.myArrowMarker.userData.headMesh) {
                        ship.userData.myArrowMarker.userData.headMesh.rotation.y = elapsed * 2.6;
                    }
                    if (ship.userData.myArrowMarker.userData.haloMesh) {
                        const pulse = 0.92 + Math.sin(elapsed * 5.0) * 0.22;
                        ship.userData.myArrowMarker.userData.haloMesh.scale.set(pulse, 1, pulse);
                    }
                }
                shipIdx++;
            });

            // 5. Animated Land Hex Diorama Props (Skipped in Minimalist Mode)
            if (!this.minimalistMode) {
                for (let i = 0; i < this.animatedLandProps.length; i++) {
                    const item = this.animatedLandProps[i];
                    if (!item.mesh || !item.mesh.visible) continue;
                    if (item.type === "spin_z") {
                        item.mesh.rotation.z += (item.speed || 1.5) * delta;
                    } else if (item.type === "spin_y") {
                        item.mesh.rotation.y += (item.speed || 1.2) * delta;
                    } else if (item.type === "orbit_cloud") {
                        item.mesh.position.x = item.basePos.x + Math.sin(elapsed * 0.8 + item.phase) * 0.22;
                        item.mesh.position.z = item.basePos.z + Math.cos(elapsed * 0.7 + item.phase) * 0.18;
                    } else if (item.type === "smoke_rise") {
                        const cycle = (elapsed * 0.65 + item.phase) % 1.0;
                        item.mesh.position.y = item.baseY + cycle * 0.55;
                        const sc = 0.65 + cycle * 0.75;
                        item.mesh.scale.setScalar(sc);
                    } else if (item.type === "sway_flag") {
                        item.mesh.rotation.y = Math.sin(elapsed * 3.5 + item.phase) * 0.25;
                    } else if (item.type === "flicker_fire") {
                        const sc = 0.85 + Math.sin(elapsed * 11.0 + item.phase) * 0.22;
                        item.mesh.scale.set(sc, sc * 1.25, sc);
                        item.mesh.rotation.y += 2.2 * delta;
                    } else if (item.type === "bob_boat") {
                        item.mesh.position.y = item.baseY + Math.sin(elapsed * 2.4 + item.phase) * 0.03;
                        item.mesh.rotation.z = Math.sin(elapsed * 2.0 + item.phase) * 0.06;
                    } else if (item.type === "shimmer_water") {
                        const pulse = 0.92 + Math.sin(elapsed * 5.0 + item.phase) * 0.10;
                        item.mesh.scale.set(pulse, 1.0, 1.0);
                    }
                }
            }

            // 6. Monument Radiant Beacons, Port & Resource Model Animations
            this.hexTiles.forEach((tile, tIdx) => {
                if (tile.monumentGlowGroup) {
                    const mg = tile.monumentGlowGroup.userData;
                    if (mg.outerHalo) {
                        const s = 1.0 + Math.sin(elapsed * 3.2 + tIdx) * 0.12;
                        mg.outerHalo.scale.set(s, s, 1);
                    }
                    if (mg.innerHalo) {
                        mg.innerHalo.rotation.z = elapsed * 1.5;
                    }
                    if (mg.skyBeam) {
                        mg.skyBeam.material.opacity = tile.monumentLocked
                            ? 0.06
                            : (0.18 + Math.sin(elapsed * 2.8 + tIdx) * 0.10);
                    }
                    if (mg.orbitOrbsGroup) {
                        mg.orbitOrbsGroup.rotation.y = elapsed * 2.1 + tIdx;
                        mg.orbitOrbsGroup.position.y = 1.45 + Math.sin(elapsed * 2.4 + tIdx) * 0.22;
                    }
                }
                if (tile.propModel) {
                    if (tile.monumentId && tile.propModel.userData.relicCrown) {
                        tile.propModel.userData.relicCrown.rotation.y = elapsed * 1.8;
                        tile.propModel.userData.relicCrown.position.y = 2.15 + Math.sin(elapsed * 2.5) * 0.10;
                    }
                    if (!this.minimalistMode) {
                        if (tile.propModel.userData.spinZ) {
                            tile.propModel.userData.spinZ.rotation.z = elapsed * 2.0;
                        }
                        if (tile.propModel.userData.spinY) {
                            tile.propModel.userData.spinY.rotation.y = Math.sin(elapsed * 0.9) * 0.85;
                        }
                    }
                    if (tile.hasNPC && tile.propModel.userData.gem) {
                        tile.propModel.userData.gem.rotation.y = elapsed * 2.6;
                    }
                }
            });

            // 7. Ambient Ocean Wildlife & Fleet Animations (Skipped in Minimalist Mode)
            if (!this.minimalistMode) {
                if (this.ambientLighthouses) {
                    this.ambientLighthouses.forEach((lh, idx) => {
                        if (lh.userData.beam) {
                            lh.userData.beam.rotation.y = elapsed * 0.9 + idx * 2.0;
                        }
                    });
                }
                if (this.ambientOilRigs) {
                    this.ambientOilRigs.forEach((rig, idx) => {
                        if (rig.userData.flame) {
                            const s = 0.85 + Math.sin(elapsed * 8.0 + idx) * 0.22;
                            rig.userData.flame.scale.set(s, s * 1.3, s);
                        }
                    });
                }
                if (this.ambientSampans) {
                    this.ambientSampans.forEach((sp, idx) => {
                        sp.angle += sp.speed * delta;
                        const nx = sp.centerX + Math.cos(sp.angle) * sp.radius;
                        const nz = sp.centerZ + Math.sin(sp.angle) * (sp.radius * 0.85);
                        const dx = nx - sp.mesh.position.x;
                        const dz = nz - sp.mesh.position.z;
                        sp.mesh.position.set(nx, -0.08 + Math.sin(elapsed * 2.0 + idx) * 0.05, nz);
                        if (Math.hypot(dx, dz) > 0.001) {
                            sp.mesh.rotation.y = -Math.atan2(dz, dx);
                        }
                    });
                }
                if (this.ambientDolphins) {
                    this.ambientDolphins.forEach((dp) => {
                        dp.angle += dp.speed * delta;
                        const dx = dp.centerX + Math.cos(dp.angle) * dp.radius;
                        const dz = dp.centerZ + Math.sin(dp.angle) * dp.radius;
                        const leapArc = Math.sin(elapsed * 2.8 + dp.jumpPhase);
                        const yPos = Math.max(-0.35, leapArc * 1.15);
                        dp.mesh.position.set(dx, yPos, dz);
                        dp.mesh.rotation.y = -dp.angle - Math.PI / 2;
                        dp.mesh.rotation.z = Math.cos(elapsed * 2.8 + dp.jumpPhase) * 0.45;
                    });
                }
                if (this.ambientFishSchools) {
                    this.ambientFishSchools.forEach((fs) => {
                        fs.mesh.rotation.y += fs.speed * delta;
                    });
                }
                if (this.ambientSeagulls) {
                    this.ambientSeagulls.forEach((sg, idx) => {
                        sg.angle += sg.speed * delta;
                        const gx = Math.cos(sg.angle) * sg.radius;
                        const gz = Math.sin(sg.angle) * sg.radius;
                        sg.mesh.position.set(gx, sg.height + Math.sin(elapsed * 2.5 + idx) * 0.4, gz);
                        sg.mesh.rotation.y = -sg.angle - Math.PI / 2;
                        if (sg.mesh.userData.wings) {
                            const flap = Math.sin(elapsed * 7.5 + idx) * 0.38;
                            sg.mesh.userData.wings.forEach(w => {
                                w.wingL.rotation.z = flap;
                                w.wingR.rotation.z = -flap;
                            });
                        }
                    });
                }
            }

            // 8. Wake, Burst, Lightning Bolt & Monument Trap Effects
            for (let i = this.floatingEffects.length - 1; i >= 0; i--) {
                const fx = this.floatingEffects[i];
                const age = now - fx.birth;
                const progress = age / fx.life;
                if (progress >= 1) {
                    this.effectsGroup.remove(fx.mesh);
                    this.floatingEffects.splice(i, 1);
                } else if (fx.type === "wake") {
                    const s = 1 + progress * 2.8;
                    fx.mesh.scale.set(s, s, s);
                    fx.mesh.material.opacity = 0.78 * (1 - progress);
                } else if (fx.type === "burst") {
                    fx.mesh.position.x += fx.vx * 0.016;
                    fx.mesh.position.y += fx.vy * 0.016;
                    fx.mesh.position.z += fx.vz * 0.016;
                    fx.vy -= 4.8 * 0.016;
                    fx.mesh.rotation.x += 0.1;
                    fx.mesh.rotation.y += 0.12;
                    fx.mesh.material.opacity = 1 - progress;
                } else if (fx.type === "lightning_bolt") {
                    if (fx.beamMat) fx.beamMat.opacity = 0.85 * (1 - progress);
                    if (fx.ringMesh) {
                        const rs = 1.0 + progress * 3.8;
                        fx.ringMesh.scale.set(rs, rs, 1);
                    }
                    if (fx.ringMat) fx.ringMat.opacity = 0.95 * (1 - progress);
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
                        fx.vy -= 12.0 * 0.016;
                    }
                    fx.mesh.rotation.x += 0.18;
                    fx.mesh.rotation.z += 0.15;
                }
            }

            // 9. Camera Follow Lock (Smoothly tracks the local player's ship in real time!)
            if (this.cameraLockEnabled && this.cameraLockShipKey) {
                const lockedShip = this.shipMeshes.get(this.cameraLockShipKey);
                if (lockedShip) {
                    const dx = lockedShip.position.x - this.controls.target.x;
                    const dz = lockedShip.position.z - this.controls.target.z;
                    if (Math.hypot(dx, dz) > 0.001) {
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
