// ============================================================================
// THE GOLDEN JOURNEY (HÀNH TRÌNH VÀNG SON) — V3.3 EXPANDED 3D WORLD ENGINE
// - Massive 273-Hex Board across 6 Economic Regions (Rows r = -10 to +10)
// - Enlarged Hex Tiles (hexRadius = 1.92) & Scaled-Up High-Detail 3D Dioramas
// - Zero Random Map Keys (Keys are exclusively earned via Ports & Cross-Region Trade)
// - High-Visibility 3D Ships with Smooth Step-by-Step Water Path Navigation
// ============================================================================

class World3D {
    constructor(containerId, onHexClickCallback, onHexHoverCallback) {
        this.container = document.getElementById(containerId);
        this.onHexClick = onHexClickCallback;
        this.onHexHover = onHexHoverCallback;

        // Larger hex radius so every tile and 3D diorama is big, clear, and easy to click
        this.hexRadius = 1.92;
        this.hexTiles = [];
        this.hexMap = new Map(); // "q,r" -> tileObj
        this.shipMeshes = new Map(); // playerId -> THREE.Group
        this.floatingEffects = [];
        this.waterVertices = [];
        this.activeNPCTile = null;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hoveredHex = null;
        this.reachablePaths = new Map(); // "q,r" -> { steps, path: [tile, ...] }

        this.weatherMode = "sunny"; // sunny | sunset | night | rain | storm
        this.lightningFlash = 0;

        this.clock = new THREE.Clock();
        this.initScene();
        this.initAtmosphereAndWeather();
        this.initOcean();
        this.initEvents();
    }

    initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0c4a6e);
        this.scene.fog = new THREE.FogExp2(0x0c4a6e, 0.0042);

        const w = this.container.clientWidth || window.innerWidth;
        const h = this.container.clientHeight || window.innerHeight;

        this.camera = new THREE.PerspectiveCamera(42, w / h, 0.5, 520);
        this.camera.position.set(16, 54, 44);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        this.renderer.setSize(w, h);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.15;
        this.container.innerHTML = "";
        this.container.appendChild(this.renderer.domElement);

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.07;
        this.controls.maxPolarAngle = Math.PI / 2.22;
        this.controls.minPolarAngle = Math.PI / 10;
        this.controls.minDistance = 14;
        this.controls.maxDistance = 135;
        this.controls.target.set(2, 0, 0);

        this.hemiLight = new THREE.HemisphereLight(0xfef9c3, 0x0369a1, 0.98);
        this.hemiLight.position.set(0, 70, 0);
        this.scene.add(this.hemiLight);

        this.sunLight = new THREE.DirectionalLight(0xfffbeb, 1.48);
        this.sunLight.position.set(42, 68, 34);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 5;
        this.sunLight.shadow.camera.far = 210;
        const d = 78;
        this.sunLight.shadow.camera.left = -d;
        this.sunLight.shadow.camera.right = d;
        this.sunLight.shadow.camera.top = d;
        this.sunLight.shadow.camera.bottom = -d;
        this.scene.add(this.sunLight);

        this.rimLight = new THREE.DirectionalLight(0x38bdf8, 0.52);
        this.rimLight.position.set(-45, 32, -38);
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
            color: 0xffffff,
            roughness: 0.9,
            transparent: true,
            opacity: 0.76
        });

        for (let i = 0; i < 20; i++) {
            const cGroup = new THREE.Group();
            const puffs = 3 + Math.floor(Math.random() * 3);
            for (let p = 0; p < puffs; p++) {
                const puffGeo = new THREE.DodecahedronGeometry(1.4 + Math.random() * 1.1, 1);
                puffGeo.scale(1.35, 0.55, 1.0);
                const puff = new THREE.Mesh(puffGeo, cloudMat);
                puff.position.set((p - 1.5) * 1.4, Math.random() * 0.35, (Math.random() - 0.5) * 1.0);
                cGroup.add(puff);
            }
            cGroup.position.set((Math.random() - 0.5) * 145, 20 + Math.random() * 6, (Math.random() - 0.5) * 145);
            this.weatherGroup.add(cGroup);
            this.clouds.push({
                mesh: cGroup,
                speed: 0.55 + Math.random() * 0.65
            });
        }
        this.cloudMaterial = cloudMat;

        const rainCount = 1400;
        const rainGeo = new THREE.BufferGeometry();
        const rainPositions = new Float32Array(rainCount * 6);
        for (let i = 0; i < rainCount; i++) {
            const rx = (Math.random() - 0.5) * 140;
            const ry = Math.random() * 42;
            const rz = (Math.random() - 0.5) * 140;
            const idx = i * 6;
            rainPositions[idx] = rx;
            rainPositions[idx + 1] = ry;
            rainPositions[idx + 2] = rz;
            rainPositions[idx + 3] = rx - 0.3;
            rainPositions[idx + 4] = ry - 1.5;
            rainPositions[idx + 5] = rz;
        }
        rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPositions, 3));
        const rainMat = new THREE.LineBasicMaterial({
            color: 0xbae6fd,
            transparent: true,
            opacity: 0.0
        });
        this.rainLines = new THREE.LineSegments(rainGeo, rainMat);
        this.rainLines.visible = false;
        this.weatherGroup.add(this.rainLines);

        const starCount = 420;
        const starGeo = new THREE.BufferGeometry();
        const starPos = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount; i++) {
            starPos[i * 3] = (Math.random() - 0.5) * 200;
            starPos[i * 3 + 1] = 3 + Math.random() * 45;
            starPos[i * 3 + 2] = (Math.random() - 0.5) * 200;
        }
        starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
        this.starField = new THREE.Points(
            starGeo,
            new THREE.PointsMaterial({ color: 0xfef08a, size: 0.42, transparent: true, opacity: 0.0 })
        );
        this.weatherGroup.add(this.starField);
    }

    setWeatherMode(mode) {
        this.weatherMode = mode;
        const presets = {
            sunny: {
                bg: 0x0c4a6e, fog: 0x0c4a6e, hemiSky: 0xfef9c3, hemiGround: 0x0369a1, hemiInt: 0.98,
                sunCol: 0xfffbeb, sunInt: 1.48, sunPos: [42, 68, 34], cloudCol: 0xffffff, cloudOp: 0.76,
                rain: false, waveAmp: 1.0, starsOp: 0.0
            },
            sunset: {
                bg: 0x451a03, fog: 0x7c2d12, hemiSky: 0xfda4af, hemiGround: 0x1e1b4b, hemiInt: 0.85,
                sunCol: 0xf97316, sunInt: 1.65, sunPos: [-52, 26, 38], cloudCol: 0xfed7aa, cloudOp: 0.82,
                rain: false, waveAmp: 1.05, starsOp: 0.35
            },
            night: {
                bg: 0x020617, fog: 0x020617, hemiSky: 0x38bdf8, hemiGround: 0x0f172a, hemiInt: 0.55,
                sunCol: 0x93c5fd, sunInt: 0.75, sunPos: [-30, 52, -30], cloudCol: 0x334155, cloudOp: 0.55,
                rain: false, waveAmp: 0.9, starsOp: 0.92
            },
            rain: {
                bg: 0x1e293b, fog: 0x1e293b, hemiSky: 0x94a3b8, hemiGround: 0x0f172a, hemiInt: 0.70,
                sunCol: 0xcbd5e1, sunInt: 0.78, sunPos: [22, 48, 22], cloudCol: 0x64748b, cloudOp: 0.9,
                rain: true, rainOp: 0.55, waveAmp: 1.35, starsOp: 0.0
            },
            storm: {
                bg: 0x090d16, fog: 0x090d16, hemiSky: 0x475569, hemiGround: 0x020617, hemiInt: 0.52,
                sunCol: 0x64748b, sunInt: 0.62, sunPos: [16, 44, 16], cloudCol: 0x334155, cloudOp: 0.95,
                rain: true, rainOp: 0.82, waveAmp: 1.85, starsOp: 0.0
            }
        };

        const p = presets[mode] || presets.sunny;
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

        this.rainLines.visible = p.rain;
        this.rainLines.material.opacity = p.rain ? p.rainOp : 0.0;
        this.starField.material.opacity = p.starsOp;
        this.waveMultiplier = p.waveAmp;
    }

    initOcean() {
        this.waveMultiplier = 1.0;
        const oceanGeo = new THREE.PlaneGeometry(280, 280, 110, 110);
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
            color: 0x0f3b57,
            emissive: 0x072235,
            emissiveIntensity: 0.25,
            roughness: 0.22,
            metalness: 0.45,
            flatShading: true,
            transparent: true,
            opacity: 0.96
        });

        this.oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
        this.oceanMesh.position.y = -0.18;
        this.oceanMesh.receiveShadow = true;
        this.scene.add(this.oceanMesh);

        this.foamRings = [];
        const foamMat = new THREE.MeshBasicMaterial({ color: 0xcbd5e1, transparent: true, opacity: 0.28, side: THREE.DoubleSide });
        for (let i = 0; i < 55; i++) {
            const rGeo = new THREE.RingGeometry(0.42, 0.62, 16);
            rGeo.rotateX(-Math.PI / 2);
            const ring = new THREE.Mesh(rGeo, foamMat.clone());
            ring.position.set((Math.random() - 0.5) * 160, -0.05, (Math.random() - 0.5) * 160);
            this.scene.add(ring);
            this.foamRings.push({ mesh: ring, speed: 0.6 + Math.random() * 0.8, offset: Math.random() * 6 });
        }

        this.initAmbientOceanScenery();
    }

    initAmbientOceanScenery() {
        this.sceneryGroup = new THREE.Group();
        this.scene.add(this.sceneryGroup);

        const karstLocations = [
            { x: 44, z: -38, scale: 1.85, rot: 0.4 },
            { x: 48, z: -12, scale: 1.55, rot: 1.2 },
            { x: 45, z: 18, scale: 1.9, rot: 2.1 },
            { x: -42, z: -28, scale: 1.75, rot: 0.8 },
            { x: -44, z: 28, scale: 1.8, rot: 1.9 },
            { x: 34, z: 42, scale: 1.65, rot: 2.8 }
        ];
        karstLocations.forEach(kl => {
            const kMesh = ProceduralModels.createDistantKarstOutcrop(kl.scale);
            kMesh.position.set(kl.x, -0.15, kl.z);
            kMesh.rotation.y = kl.rot;
            this.sceneryGroup.add(kMesh);
        });

        this.ambientLighthouses = [];
        const lhCoords = [
            { x: 38, z: -24 },
            { x: 39, z: 6 },
            { x: 26, z: 38 }
        ];
        lhCoords.forEach(lc => {
            const lh = ProceduralModels.createSeaLighthouseIsland();
            lh.position.set(lc.x, -0.15, lc.z);
            lh.scale.setScalar(1.35);
            this.sceneryGroup.add(lh);
            this.ambientLighthouses.push(lh);
        });

        this.ambientOilRigs = [];
        const rigCoords = [
            { x: 30, z: 28 },
            { x: 36, z: 34 }
        ];
        rigCoords.forEach(rc => {
            const rig = ProceduralModels.createOffshoreOilRig();
            rig.position.set(rc.x, -0.15, rc.z);
            rig.scale.setScalar(1.35);
            this.sceneryGroup.add(rig);
            this.ambientOilRigs.push(rig);
        });

        this.ambientSampans = [];
        for (let i = 0; i < 8; i++) {
            const sampan = ProceduralModels.createAmbientFishingSampan();
            sampan.scale.setScalar(1.4);
            const radius = 40 + (i % 3) * 6.5;
            const angle = (i / 8) * Math.PI * 2;
            this.sceneryGroup.add(sampan);
            this.ambientSampans.push({
                mesh: sampan,
                radius,
                angle,
                speed: (0.05 + (i % 3) * 0.02) * (i % 2 === 0 ? 1 : -1),
                centerX: 3,
                centerZ: 0
            });
        }

        this.ambientSeagulls = [];
        for (let i = 0; i < 6; i++) {
            const flock = ProceduralModels.createSeagullFlock();
            flock.scale.setScalar(1.35);
            this.sceneryGroup.add(flock);
            this.ambientSeagulls.push({
                mesh: flock,
                radius: 22 + i * 5.0,
                angle: i * 1.1,
                speed: 0.20 + (i % 2) * 0.07,
                height: 10.5 + (i % 3) * 2.2
            });
        }
    }

    axialToWorld(q, r) {
        const size = this.hexRadius * 1.04;
        const x = size * Math.sqrt(3) * (q + r / 2);
        const z = size * (3 / 2) * r;
        return { x, z };
    }

    static hexDistance(a, b) {
        return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
    }

    // ------------------------------------------------------------------------
    // V3.3 EXPANDED 273-HEX MAP ACROSS 6 ECONOMIC REGIONS (Rows r = -10 to +10)
    // - 21 Rows North-to-South x 13 Columns West-to-East = 273 Large Hexes!
    // - Western Mainland Mountain & Highland Ranges + Peninsulas (Impassable)
    // - Coastal Bays, Archipelagos & Open Sea Channels with Strategic Reefs
    // - All 9 Monuments, 6 Ports & 18 Resource Nodes placed on Navigable Coastal/Island Hexes
    // - Zero Random Map Keys (Keys are bought at Ports or earned via Cross-Vietnam Trade)
    // ------------------------------------------------------------------------
    buildBoard(monumentAssignments) {
        while (this.boardGroup.children.length > 0) {
            this.boardGroup.remove(this.boardGroup.children[0]);
        }
        this.hexTiles = [];
        this.hexMap.clear();
        this.activeNPCTile = null;

        // Region mapping by row r (-10 to +10)
        const getRegionIdForRow = (r) => {
            if (r <= -7) return 0; // 0: Trung du & Miền núi Bắc Bộ (r = -10..-7)
            if (r <= -4) return 1; // 1: Đồng bằng Sông Hồng (r = -6..-4)
            if (r <= 0)  return 2; // 2: Bắc Trung Bộ & Duyên hải Miền Trung (r = -3..0)
            if (r <= 3)  return 3; // 3: Tây Nguyên (r = 1..3)
            if (r <= 6)  return 4; // 4: Đông Nam Bộ (r = 4..6)
            return 5;              // 5: Đồng bằng Sông Cửu Long (r = 7..10)
        };

        // Special Landmark / Port / Resource / Reef Placements keyed by "r,col" (where col = -5..+7)
        const specialPlacements = {
            // REGION 0: TRUNG DU & MIỀN NÚI BẮC BỘ (r = -10..-7)
            "-10,-2": { terrain: "coast", monumentId: "mon_sapa", navigable: true },
            "-10,1":  { terrain: "coast", resourceType: "iron", navigable: true },
            "-9,-2":  { terrain: "coast", resourceType: "wood", navigable: true },
            "-9,1":   { terrain: "coast", isPort: true, portName: "Thương Cảng Cái Lân (Quảng Ninh)", navigable: true },
            "-9,4":   { terrain: "island", monumentId: "mon_halong", navigable: true },
            "-8,0":   { terrain: "coast", resourceType: "food", navigable: true },
            "-8,3":   { terrain: "reef", navigable: false },
            "-7,-1":  { terrain: "coast", resourceType: "iron", navigable: true },
            "-7,5":   { terrain: "reef", navigable: false },

            // REGION 1: ĐỒNG BẰNG SÔNG HỒNG (r = -6..-4)
            "-6,-2":  { terrain: "coast", monumentId: "mon_vanmieu", navigable: true },
            "-6,1":   { terrain: "delta_land", navigable: false },
            "-5,-1":  { terrain: "coast", isPort: true, portName: "Thương Cảng Hải Phòng", navigable: true },
            "-5,2":   { terrain: "coast", resourceType: "food", navigable: true },
            "-5,4":   { terrain: "reef", navigable: false },
            "-4,-2":  { terrain: "coast", resourceType: "food", navigable: true },
            "-4,0":   { terrain: "coast", resourceType: "wood", navigable: true },
            "-4,3":   { terrain: "reef", navigable: false },

            // REGION 2: BẮC TRUNG BỘ & DUYÊN HẢI MIỀN TRUNG (r = -3..0)
            "-3,-2":  { terrain: "coast", monumentId: "mon_phongnha", navigable: true },
            "-3,0":   { terrain: "coast", resourceType: "iron", navigable: true },
            "-2,-1":  { terrain: "mountain", navigable: false }, // Mũi Hoành Sơn
            "-2,2":   { terrain: "island", monumentId: "mon_hue", navigable: true },
            "-2,5":   { terrain: "reef", navigable: false },
            "-1,-2":  { terrain: "coast", resourceType: "wood", navigable: true },
            "-1,1":   { terrain: "coast", isPort: true, portName: "Thương Cảng Tiên Sa (Đà Nẵng)", navigable: true },
            "-1,3":   { terrain: "reef", navigable: false },
            "0,-2":   { terrain: "coast", resourceType: "food", navigable: true },
            "0,1":    { terrain: "sea", isCentralHub: true, navigable: true },
            "0,4":    { terrain: "island", monumentId: "mon_myson", navigable: true },

            // REGION 3: TÂY NGUYÊN & LIÊN KẾT DUYÊN HẢI (r = 1..3)
            "1,-2":   { terrain: "coast", monumentId: "mon_taynguyen", navigable: true },
            "1,1":    { terrain: "coast", isPort: true, portName: "Thương Cảng Liên Vùng Tây Nguyên – Phú Yên", navigable: true },
            "1,3":    { terrain: "reef", navigable: false },
            "2,-2":   { terrain: "coast", resourceType: "wood", navigable: true },
            "2,0":    { terrain: "highland", navigable: false },
            "2,2":    { terrain: "coast", resourceType: "iron", navigable: true },
            "3,-1":   { terrain: "coast", resourceType: "food", navigable: true },
            "3,4":    { terrain: "reef", navigable: false },

            // REGION 4: ĐÔNG NAM BỘ (r = 4..6)
            "4,-2":   { terrain: "coast", resourceType: "wood", navigable: true },
            "4,1":    { terrain: "coast", monumentId: "mon_bennharong", navigable: true },
            "5,-1":   { terrain: "coast", isPort: true, portName: "Thương Cảng Quốc Tế Cái Mép – Sài Gòn", navigable: true },
            "5,2":    { terrain: "delta_land", navigable: false },
            "5,4":    { terrain: "reef", navigable: false },
            "6,-2":   { terrain: "coast", resourceType: "iron", navigable: true },
            "6,1":    { terrain: "coast", resourceType: "wood", navigable: true },

            // REGION 5: ĐỒNG BẰNG SÔNG CỬU LONG (r = 7..10)
            "7,-2":   { terrain: "coast", resourceType: "food", navigable: true },
            "7,1":    { terrain: "delta_land", navigable: false },
            "8,-1":   { terrain: "coast", monumentId: "mon_cairang", navigable: true },
            "8,3":    { terrain: "reef", navigable: false },
            "9,-2":   { terrain: "coast", isPort: true, portName: "Thương Cảng Cần Thơ – Cửu Long", navigable: true },
            "9,1":    { terrain: "coast", resourceType: "food", navigable: true },
            "10,-1":  { terrain: "coast", resourceType: "food", navigable: true },
            "10,2":   { terrain: "coast", resourceType: "wood", navigable: true }
        };

        const layoutSpec = [];
        for (let r = -10; r <= 10; r++) {
            const regionId = getRegionIdForRow(r);
            const qCenterOffset = -Math.floor(r / 2);

            for (let col = -5; col <= 7; col++) {
                const q = qCenterOffset + col;
                const key = `${r},${col}`;
                const custom = specialPlacements[key];

                if (custom) {
                    layoutSpec.push({
                        q,
                        r,
                        regionId,
                        terrain: custom.terrain,
                        navigable: custom.navigable !== false,
                        monumentId: custom.monumentId || null,
                        isPort: !!custom.isPort,
                        portName: custom.portName || null,
                        resourceType: custom.resourceType || null,
                        isCentralHub: !!custom.isCentralHub,
                        isSpawnRim: col === 7
                    });
                } else if (col <= -3) {
                    // Western Mainland Mountain / Highland / Delta Spine (Impassable)
                    const mainTerrain = (regionId === 0 || regionId === 2)
                        ? "mountain"
                        : (regionId === 3 ? "highland" : "delta_land");
                    layoutSpec.push({
                        q,
                        r,
                        regionId,
                        terrain: mainTerrain,
                        navigable: false
                    });
                } else if (col === -2) {
                    // Coastal belt (some peninsulas jutting out, mostly navigable coastal waters)
                    const isPeninsula = ((r + 10) % 4 === 1);
                    layoutSpec.push({
                        q,
                        r,
                        regionId,
                        terrain: isPeninsula ? (regionId <= 2 ? "mountain" : "delta_land") : "coast",
                        navigable: !isPeninsula
                    });
                } else {
                    // Open East Sea shipping lanes & outer spawn rim
                    layoutSpec.push({
                        q,
                        r,
                        regionId,
                        terrain: "sea",
                        navigable: true,
                        isSpawnRim: col === 7
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
    }

    createHexTile(spec, index, monumentAssignments) {
        const region = window.GAME_DATA.regions[spec.regionId];
        const { x, z } = this.axialToWorld(spec.q, spec.r);
        const group = new THREE.Group();
        group.position.set(x, 0, z);

        let height = 0.28;
        let topColor = new THREE.Color(region.color);

        if (spec.terrain === "sea") {
            height = 0.14;
            topColor = new THREE.Color(spec.isCentralHub ? 0x164e63 : 0x0f3b57);
        } else if (spec.terrain === "reef") {
            height = 0.26;
            topColor = new THREE.Color(0x27272a);
        } else if (spec.terrain === "mountain") {
            height = 1.15;
        } else if (spec.terrain === "highland") {
            height = 0.92;
        } else if (spec.terrain === "delta_land") {
            height = 0.65;
        } else if (spec.terrain === "island") {
            height = 0.44;
        } else {
            height = 0.34;
        }

        const hexGeo = new THREE.CylinderGeometry(this.hexRadius * 0.96, this.hexRadius * 1.0, height, 6);
        const isWaterHex = (spec.terrain === "sea");
        const hexMat = new THREE.MeshStandardMaterial({
            color: topColor,
            roughness: isWaterHex ? 0.28 : 0.68,
            metalness: isWaterHex ? 0.35 : 0.16,
            transparent: isWaterHex,
            opacity: isWaterHex ? 0.58 : 1.0
        });

        const baseMesh = new THREE.Mesh(hexGeo, hexMat);
        baseMesh.position.y = height / 2 - 0.1;
        baseMesh.receiveShadow = true;
        baseMesh.castShadow = !isWaterHex;
        group.add(baseMesh);

        // Region Color Rim Border (Thicker & clearer on enlarged hexes)
        const rimGeo = new THREE.RingGeometry(this.hexRadius * 0.84, this.hexRadius * 0.96, 6);
        rimGeo.rotateX(-Math.PI / 2);
        rimGeo.rotateZ(Math.PI / 6);
        const rimMat = new THREE.MeshBasicMaterial({
            color: spec.terrain === "reef" ? new THREE.Color(0xef4444) : new THREE.Color(region.color),
            transparent: true,
            opacity: isWaterHex ? 0.48 : 0.92,
            side: THREE.DoubleSide
        });
        const rimMesh = new THREE.Mesh(rimGeo, rimMat);
        rimMesh.position.y = height - 0.09;
        group.add(rimMesh);

        // Reachable / Selection Highlight Overlay Ring
        const hlGeo = new THREE.RingGeometry(this.hexRadius * 0.68, this.hexRadius * 0.94, 6);
        hlGeo.rotateX(-Math.PI / 2);
        hlGeo.rotateZ(Math.PI / 6);
        const hlMat = new THREE.MeshBasicMaterial({
            color: 0xfde047,
            transparent: true,
            opacity: 0.0,
            side: THREE.DoubleSide
        });
        const highlightRing = new THREE.Mesh(hlGeo, hlMat);
        highlightRing.position.y = height - 0.06;
        group.add(highlightRing);

        const surfaceY = height - 0.1;

        // --------------------------------------------------------------------
        // IMPASSABLE TERRAIN 3D DIORAMA OBSTACLES
        // --------------------------------------------------------------------
        if (!spec.navigable) {
            if (spec.terrain === "mountain" || spec.terrain === "highland") {
                const rockMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.75 });
                const lushMat = new THREE.MeshStandardMaterial({ color: region.color, roughness: 0.6 });

                const p1 = new THREE.Mesh(new THREE.ConeGeometry(0.98, 1.95, 7), rockMat);
                p1.position.set(-0.28, surfaceY + 0.92, -0.14);
                p1.castShadow = true;
                const cap1 = new THREE.Mesh(new THREE.ConeGeometry(0.82, 1.05, 7), lushMat);
                cap1.position.set(-0.28, surfaceY + 1.25, -0.14);

                const p2 = new THREE.Mesh(new THREE.ConeGeometry(0.74, 1.42, 6), rockMat);
                p2.position.set(0.45, surfaceY + 0.68, 0.32);
                p2.castShadow = true;
                group.add(p1, cap1, p2);
            } else if (spec.terrain === "delta_land") {
                const hillMat = new THREE.MeshStandardMaterial({ color: region.accent, roughness: 0.65 });
                const dome = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.28, 0.55, 7), hillMat);
                dome.position.set(0, surfaceY + 0.26, 0);
                group.add(dome);

                const treeMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.55 });
                [[-0.42, -0.28], [0.42, 0.22], [0, 0.42]].forEach(([tx, tz]) => {
                    const tree = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.88, 7), treeMat);
                    tree.position.set(tx, surfaceY + 0.82, tz);
                    tree.castShadow = true;
                    group.add(tree);
                });
            } else if (spec.terrain === "reef") {
                const reefMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8, metalness: 0.2 });
                const coralMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xbe123c, emissiveIntensity: 0.35 });
                [[-0.45, 0.14, 1.15], [0.42, -0.26, 0.88], [0.08, 0.45, 0.76]].forEach(([rx, rz, h]) => {
                    const spire = new THREE.Mesh(new THREE.ConeGeometry(0.44, h, 5), reefMat);
                    spire.position.set(rx, surfaceY + h / 2, rz);
                    spire.rotation.z = (rx * 0.25);
                    spire.castShadow = true;
                    group.add(spire);
                });
                const warnOrb = new THREE.Mesh(new THREE.OctahedronGeometry(0.20, 0), coralMat);
                warnOrb.position.set(0, surfaceY + 1.25, 0);
                group.add(warnOrb);
            }
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
            isSpawnRim: !!spec.isSpawnRim,
            isPort: !!spec.isPort,
            portName: spec.portName || null,
            resourceType: spec.resourceType || null,
            resourceCooldown: 0,
            monumentId: spec.monumentId || null,
            monumentTier: spec.monumentId ? (monumentAssignments[spec.monumentId] || 1) : null,
            monumentLocked: false,
            hasNPC: false,
            group,
            baseMesh,
            highlightRing,
            propModel: null,
            labelSprite: null
        };

        baseMesh.userData = { tile: tileObj };

        // Add Scaled-Up 3D Monument / Trade Port / Resource Models + Floating Label
        if (spec.monumentId) {
            const monData = window.GAME_DATA.monuments.find(m => m.id === spec.monumentId);
            const tier = tileObj.monumentTier;
            const monModel = ProceduralModels.createMonumentModel(monData.modelType, tier);
            monModel.position.y = surfaceY;
            group.add(monModel);
            tileObj.propModel = monModel;

            const tierReqLabel = {
                1: "★ Cấp 1 (Dễ): Cần 1 Key 1 + 1 Lúa + 1 Xu",
                2: "★★ Cấp 2 (Vừa): Cần 1 Key 2 + 2 Lúa + 3 Xu",
                3: "★★★ Cấp 3 (Khó): Cần 1 Key 3 + 3 Lúa + 1 Sắt + 6 Xu"
            };
            const tierColors = { 1: "#34d399", 2: "#fbbf24", 3: "#f87171" };
            const sprite = ProceduralModels.createLabelCanvas(
                `🏛️ ${monData.name}`,
                tierReqLabel[tier],
                "rgba(11, 19, 30, 0.94)",
                tierColors[tier],
                4.4,
                1.32
            );
            sprite.position.set(0, surfaceY + 3.15, 0);
            group.add(sprite);
            tileObj.labelSprite = sprite;

        } else if (spec.isPort) {
            const portModel = ProceduralModels.createTradePortModel(region.color);
            portModel.position.y = surfaceY;
            group.add(portModel);
            tileObj.propModel = portModel;

            const sprite = ProceduralModels.createLabelCanvas(
                `⚓ ${spec.portName}`,
                `${region.specialty.icon} ${region.specialty.shortName} (2 Xu)`,
                "rgba(11, 19, 30, 0.90)",
                region.color,
                3.7,
                1.12
            );
            sprite.position.set(0, surfaceY + 2.35, 0);
            group.add(sprite);
            tileObj.labelSprite = sprite;

        } else if (spec.resourceType) {
            const resModel = ProceduralModels.createResourceNodeModel(spec.resourceType);
            resModel.position.y = surfaceY;
            group.add(resModel);
            tileObj.propModel = resModel;

            const resNames = {
                food: { title: "🌾 Vựa Lúa & Ngư Trường", sub: "Khai thác +1 Lúa & +1~2 Xu" },
                wood: { title: "🌲 Lâm Trường Ven Biển", sub: "Khai thác +1 Gỗ & +1~2 Xu" },
                iron: { title: "⛏️ Mỏ Khoáng Sản Sắt", sub: "Khai thác +1 Sắt & +1~2 Xu" }
            };
            const rInfo = resNames[spec.resourceType];
            const sprite = ProceduralModels.createLabelCanvas(
                rInfo.title,
                rInfo.sub,
                "rgba(11, 19, 30, 0.88)",
                "#38bdf8",
                3.3,
                1.02
            );
            sprite.position.set(0, surfaceY + 2.05, 0);
            group.add(sprite);
            tileObj.labelSprite = sprite;
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
    // PLAYER SHIPS & STEP-BY-STEP SAILING ANIMATION ALONG WATER PATH
    // ------------------------------------------------------------------------
    spawnShips(players) {
        this.shipMeshes.forEach(mesh => this.scene.remove(mesh));
        this.shipMeshes.clear();

        players.forEach((p, idx) => {
            const shipMesh = ProceduralModels.createPlayerShip(p.archetypeId, p.name);
            shipMesh.userData.lastQ = p.q;
            shipMesh.userData.lastR = p.r;
            shipMesh.visible = !p.eliminated;
            this.scene.add(shipMesh);
            this.shipMeshes.set(p.id, shipMesh);
            this.placeShipOnHexImmediate(p, p.q, p.r, idx, players.length);
        });
    }

    syncShipsSmoothly(players) {
        if (this.shipMeshes.size !== players.length) {
            this.spawnShips(players);
            return;
        }
        players.forEach((p, idx) => {
            const shipMesh = this.shipMeshes.get(p.id);
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
        const shipMesh = this.shipMeshes.get(player.id);
        const tile = this.hexMap.get(`${q},${r}`);
        if (!shipMesh || !tile) return;

        shipMesh.userData.lastQ = q;
        shipMesh.userData.lastR = r;
        const angle = (playerIdx / Math.max(1, totalPlayers)) * Math.PI * 2;
        const offsetRadius = totalPlayers > 1 ? 0.38 : 0;
        shipMesh.position.set(
            tile.x + Math.cos(angle) * offsetRadius,
            tile.height - 0.05,
            tile.z + Math.sin(angle) * offsetRadius
        );
    }

    animateShipAlongPath(player, pathTiles, playerIdx = 0, totalPlayers = 1, onComplete = null) {
        const shipMesh = this.shipMeshes.get(player.id);
        if (!shipMesh || !pathTiles || pathTiles.length === 0) {
            if (onComplete) onComplete();
            return;
        }
        shipMesh.userData.lastQ = player.q;
        shipMesh.userData.lastR = player.r;

        this.clearPathPreview();
        const angle = (playerIdx / Math.max(1, totalPlayers)) * Math.PI * 2;
        const offsetRadius = totalPlayers > 1 ? 0.38 : 0;

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
        const segDuration = 320;

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

                if (Math.random() < 0.55) {
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
        const startTime = performance.now();
        const duration = 520;

        const animateCam = (now) => {
            const t = Math.min(1, (now - startTime) / duration);
            const ease = 1 - Math.pow(1 - t, 3);
            this.controls.target.lerpVectors(startTarget, endTarget, ease);
            if (t < 1) requestAnimationFrame(animateCam);
        };
        requestAnimationFrame(animateCam);
    }

    updateReachableHighlights(reachablePathsMap, activeHexKey) {
        this.reachablePaths = reachablePathsMap;
        this.hexTiles.forEach(tile => {
            const key = `${tile.q},${tile.r}`;
            if (key === activeHexKey) {
                tile.highlightRing.material.color.setHex(0x38bdf8);
                tile.highlightRing.material.opacity = 0.95;
            } else if (reachablePathsMap.has(key)) {
                const info = reachablePathsMap.get(key);
                tile.highlightRing.material.color.setHex(info.steps <= 2 ? 0x4ade80 : (info.steps <= 4 ? 0xfacc15 : 0xf97316));
                tile.highlightRing.material.opacity = 0.80;
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
            }
        });
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
        this.renderer.domElement.addEventListener("pointerdown", (e) => {
            pointerDownPos = { x: e.clientX, y: e.clientY };
        });

        this.renderer.domElement.addEventListener("pointermove", (e) => {
            const rect = this.renderer.domElement.getBoundingClientRect();
            this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            this.raycaster.setFromCamera(this.mouse, this.camera);
            const meshes = this.hexTiles.map(t => t.baseMesh);
            const hits = this.raycaster.intersectObjects(meshes, false);

            if (hits.length > 0) {
                const tile = hits[0].object.userData.tile;
                if (this.hoveredHex !== tile) {
                    this.hoveredHex = tile;
                    this.renderer.domElement.style.cursor = tile.navigable ? "pointer" : "not-allowed";

                    const key = `${tile.q},${tile.r}`;
                    if (this.reachablePaths.has(key)) {
                        this.showPathPreview(this.reachablePaths.get(key).path);
                    } else {
                        this.clearPathPreview();
                    }

                    if (this.onHexHover) this.onHexHover(tile, e.clientX, e.clientY);
                }
            } else if (this.hoveredHex) {
                this.hoveredHex = null;
                this.renderer.domElement.style.cursor = "grab";
                this.clearPathPreview();
                if (this.onHexHover) this.onHexHover(null, 0, 0);
            }
        });

        this.renderer.domElement.addEventListener("pointerup", (e) => {
            const moveDist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
            if (moveDist > 8) return;

            const rect = this.renderer.domElement.getBoundingClientRect();
            this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            this.raycaster.setFromCamera(this.mouse, this.camera);
            const meshes = this.hexTiles.map(t => t.baseMesh);
            const hits = this.raycaster.intersectObjects(meshes, false);
            if (hits.length > 0 && this.onHexClick) {
                const tile = hits[0].object.userData.tile;
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

            this.clouds.forEach(c => {
                c.mesh.position.x += c.speed * delta;
                if (c.mesh.position.x > 75) c.mesh.position.x = -75;
            });

            if (this.rainLines && this.rainLines.visible) {
                const rPos = this.rainLines.geometry.attributes.position;
                const fallSpeed = this.weatherMode === "storm" ? 28 : 20;
                for (let i = 0; i < rPos.count; i += 2) {
                    let y1 = rPos.getY(i) - fallSpeed * delta;
                    if (y1 < 0) y1 = 36 + Math.random() * 5;
                    rPos.setY(i, y1);
                    rPos.setY(i + 1, y1 - 1.5);
                }
                rPos.needsUpdate = true;

                if (this.weatherMode === "storm") {
                    if (Math.random() < 0.006) {
                        this.lightningFlash = 1.0;
                    }
                    if (this.lightningFlash > 0) {
                        this.hemiLight.intensity = 0.5 + this.lightningFlash * 1.6;
                        this.lightningFlash = Math.max(0, this.lightningFlash - delta * 4.5);
                    }
                }
            }

            this.foamRings.forEach(f => {
                const s = 0.8 + Math.sin(elapsed * f.speed + f.offset) * 0.35;
                f.mesh.scale.set(s, s, s);
                f.mesh.material.opacity = 0.2 + Math.cos(elapsed * f.speed + f.offset) * 0.15;
            });

            let shipIdx = 0;
            const wavePitch = (this.waveMultiplier || 1.0) * 0.05;
            this.shipMeshes.forEach((ship) => {
                ship.rotation.z = Math.sin(elapsed * 2.2 + shipIdx) * wavePitch;
                ship.rotation.x = Math.cos(elapsed * 1.8 + shipIdx) * (wavePitch * 0.75);
                if (ship.userData.flag) {
                    ship.userData.flag.rotation.y = Math.sin(elapsed * 5.5 + shipIdx) * 0.28;
                }
                shipIdx++;
            });

            this.hexTiles.forEach(tile => {
                if (tile.propModel) {
                    if (tile.monumentId && tile.propModel.userData.relicCrown) {
                        tile.propModel.userData.relicCrown.rotation.y = elapsed * 1.8;
                        tile.propModel.userData.relicCrown.position.y = 2.15 + Math.sin(elapsed * 2.5) * 0.10;
                    }
                    if (tile.hasNPC && tile.propModel.userData.gem) {
                        tile.propModel.userData.gem.rotation.y = elapsed * 2.6;
                    }
                }
            });

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
            if (this.ambientSeagulls) {
                this.ambientSeagulls.forEach((sg, idx) => {
                    sg.angle += sg.speed * delta;
                    const gx = Math.cos(sg.angle) * sg.radius;
                    const gz = Math.sin(sg.angle) * sg.radius;
                    sg.mesh.position.set(gx, sg.height + Math.sin(elapsed * 2.5 + idx) * 0.4, gz);
                    sg.mesh.rotation.y = -sg.angle - Math.PI / 2;
                });
            }

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
                }
            }

            this.controls.update();
            this.renderer.render(this.scene, this.camera);
        };
        animate();
    }
}

window.World3D = World3D;
