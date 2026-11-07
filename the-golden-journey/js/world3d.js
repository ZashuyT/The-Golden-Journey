// ============================================================================
// THE GOLDEN JOURNEY (HÀNH TRÌNH VÀNG SON) — V5.0 LIVING S-SHAPED VIETNAM 3D WORLD
// - Borderless Open-Ocean S-Shaped Vietnam Map (No Wooden Frame)
// - Every Land Hex has a Unique, Animated 3D Diorama (Waterwheels, Windmills,
//   Village Communal Halls, Hoi An Lanterns, Campfires, Skyscrapers, Orchards)
// - Living Ocean Ecosystem: Jumping Dolphin Pods, Swimming Fish Schools,
//   Flapping Seagulls, Traditional Vietnamese Sampans, Lighthouses & Oil Rigs
// - Mathematically Balanced Port, Monument, Resource & Spawn Coordinates with
//   Wide Open Sea Lanes so Ships Route Cleanly Around Special Tiles
// ============================================================================

class World3D {
    constructor(containerId, onHexClickCallback, onHexHoverCallback) {
        this.container = document.getElementById(containerId);
        this.onHexClick = onHexClickCallback;
        this.onHexHover = onHexHoverCallback;

        this.hexRadius = 1.92;
        this.hexTiles = [];
        this.hexMap = new Map(); // "q,r" -> tileObj
        this.shipMeshes = new Map(); // playerId -> THREE.Group
        this.floatingEffects = [];
        this.waterVertices = [];
        this.animatedLandProps = [];
        this.fairSpawnAnchors = [];
        this.activeNPCTile = null;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hoveredHex = null;
        this.reachablePaths = new Map(); // "q,r" -> { steps, path: [tile, ...] }

        this.weatherMode = "sunny";
        this.lightningFlash = 0;

        this.clock = new THREE.Clock();
        this.initScene();
        this.initAtmosphereAndWeather();
        this.initOcean();
        this.initEvents();
    }

    initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a4162);
        this.scene.fog = new THREE.FogExp2(0x0a4162, 0.0036);

        const w = this.container.clientWidth || window.innerWidth;
        const h = this.container.clientHeight || window.innerHeight;

        this.camera = new THREE.PerspectiveCamera(42, w / h, 0.5, 680);
        this.camera.position.set(14, 68, 56);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        this.renderer.setSize(w, h);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.18;
        this.container.innerHTML = "";
        this.container.appendChild(this.renderer.domElement);

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.07;
        this.controls.maxPolarAngle = Math.PI / 2.22;
        this.controls.minPolarAngle = Math.PI / 10;
        this.controls.minDistance = 14;
        this.controls.maxDistance = 175;
        this.controls.target.set(2, 0, 2);

        this.hemiLight = new THREE.HemisphereLight(0xfef9c3, 0x0369a1, 1.02);
        this.hemiLight.position.set(0, 75, 0);
        this.scene.add(this.hemiLight);

        this.sunLight = new THREE.DirectionalLight(0xfffbeb, 1.52);
        this.sunLight.position.set(44, 72, 36);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 5;
        this.sunLight.shadow.camera.far = 220;
        const d = 82;
        this.sunLight.shadow.camera.left = -d;
        this.sunLight.shadow.camera.right = d;
        this.sunLight.shadow.camera.top = d;
        this.sunLight.shadow.camera.bottom = -d;
        this.scene.add(this.sunLight);

        this.rimLight = new THREE.DirectionalLight(0x38bdf8, 0.56);
        this.rimLight.position.set(-48, 36, -40);
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

        for (let i = 0; i < 24; i++) {
            const cGroup = new THREE.Group();
            const puffs = 3 + Math.floor(Math.random() * 3);
            for (let p = 0; p < puffs; p++) {
                const puffGeo = new THREE.DodecahedronGeometry(1.4 + Math.random() * 1.1, 1);
                puffGeo.scale(1.35, 0.55, 1.0);
                const puff = new THREE.Mesh(puffGeo, cloudMat);
                puff.position.set((p - 1.5) * 1.4, Math.random() * 0.35, (Math.random() - 0.5) * 1.0);
                cGroup.add(puff);
            }
            cGroup.position.set((Math.random() - 0.5) * 165, 21 + Math.random() * 7, (Math.random() - 0.5) * 165);
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
            const rx = (Math.random() - 0.5) * 150;
            const ry = Math.random() * 42;
            const rz = (Math.random() - 0.5) * 150;
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

        const starCount = 460;
        const starGeo = new THREE.BufferGeometry();
        const starPos = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount; i++) {
            starPos[i * 3] = (Math.random() - 0.5) * 220;
            starPos[i * 3 + 1] = 3 + Math.random() * 45;
            starPos[i * 3 + 2] = (Math.random() - 0.5) * 220;
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
                bg: 0x0a4162, fog: 0x0a4162, hemiSky: 0xfef9c3, hemiGround: 0x0369a1, hemiInt: 1.02,
                sunCol: 0xfffbeb, sunInt: 1.52, sunPos: [44, 72, 36], cloudCol: 0xffffff, cloudOp: 0.76,
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
        const oceanGeo = new THREE.PlaneGeometry(320, 320, 120, 120);
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
            color: 0x0c4466,
            emissive: 0x06253a,
            emissiveIntensity: 0.28,
            roughness: 0.20,
            metalness: 0.48,
            flatShading: true,
            transparent: true,
            opacity: 0.96
        });

        this.oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
        this.oceanMesh.position.y = -0.18;
        this.oceanMesh.receiveShadow = true;
        this.scene.add(this.oceanMesh);

        this.foamRings = [];
        const foamMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.30, side: THREE.DoubleSide });
        for (let i = 0; i < 65; i++) {
            const rGeo = new THREE.RingGeometry(0.42, 0.66, 16);
            rGeo.rotateX(-Math.PI / 2);
            const ring = new THREE.Mesh(rGeo, foamMat.clone());
            ring.position.set((Math.random() - 0.5) * 180, -0.05, (Math.random() - 0.5) * 180);
            this.scene.add(ring);
            this.foamRings.push({ mesh: ring, speed: 0.6 + Math.random() * 0.8, offset: Math.random() * 6 });
        }

        this.initAmbientOceanScenery();
    }

    initAmbientOceanScenery() {
        this.sceneryGroup = new THREE.Group();
        this.scene.add(this.sceneryGroup);

        // 1. 10 Picturesque Limestone Karst Islands & Atolls around the Outer Sea
        const karstLocations = [
            { x: 42, z: -38, scale: 1.9, rot: 0.4 },
            { x: 46, z: -18, scale: 1.6, rot: 1.2 },
            { x: 48, z: 2, scale: 1.75, rot: 0.9 },
            { x: 45, z: 20, scale: 1.95, rot: 2.1 },
            { x: 38, z: 40, scale: 1.7, rot: 2.8 },
            { x: 14, z: 50, scale: 1.55, rot: 1.6 },
            { x: -18, z: 48, scale: 1.65, rot: 0.5 },
            { x: -42, z: -32, scale: 1.75, rot: 0.8 },
            { x: -44, z: 28, scale: 1.8, rot: 1.9 },
            { x: 20, z: -48, scale: 1.6, rot: 2.4 }
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
            { x: 36, z: -28 },
            { x: 40, z: -4 },
            { x: 38, z: 14 },
            { x: 24, z: 42 }
        ];
        lhCoords.forEach(lc => {
            const lh = ProceduralModels.createSeaLighthouseIsland();
            lh.position.set(lc.x, -0.15, lc.z);
            lh.scale.setScalar(1.38);
            this.sceneryGroup.add(lh);
            this.ambientLighthouses.push(lh);
        });

        // 3. 3 Offshore Oil & Gas Platforms (Bạch Hổ / Lan Tây / Rồng Đôi)
        this.ambientOilRigs = [];
        const rigCoords = [
            { x: 28, z: 28 },
            { x: 35, z: 34 },
            { x: 18, z: 42 }
        ];
        rigCoords.forEach(rc => {
            const rig = ProceduralModels.createOffshoreOilRig();
            rig.position.set(rc.x, -0.15, rc.z);
            rig.scale.setScalar(1.38);
            this.sceneryGroup.add(rig);
            this.ambientOilRigs.push(rig);
        });

        // 4. 12 Traditional Vietnamese Sailing Sampans & Fishing Boats
        this.ambientSampans = [];
        for (let i = 0; i < 12; i++) {
            const sampan = ProceduralModels.createAmbientFishingSampan();
            sampan.scale.setScalar(1.42);
            const radius = 36 + (i % 4) * 5.5;
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
            { x: 30, z: -22 },
            { x: 34, z: -6 },
            { x: 32, z: 12 },
            { x: 26, z: 24 },
            { x: 8, z: 42 },
            { x: -24, z: 38 }
        ];
        dolphinCenters.forEach((dc, idx) => {
            const pod = ProceduralModels.createJumpingDolphinPod();
            pod.scale.setScalar(1.35);
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
            { x: 26, z: -30 },
            { x: 32, z: -14 },
            { x: 35, z: 4 },
            { x: 30, z: 18 },
            { x: 22, z: 32 },
            { x: 2, z: 40 },
            { x: -16, z: 34 },
            { x: 16, z: -38 }
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
        const size = this.hexRadius * 1.04;
        const x = size * Math.sqrt(3) * (q + r / 2);
        const z = size * (3 / 2) * r;
        return { x, z };
    }

    static hexDistance(a, b) {
        return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
    }

    // ------------------------------------------------------------------------
    // V5.0 S-SHAPED VIETNAM LIVING 3D MAP (Rows r = -14..+14, 551 Hexes)
    // - No Wooden Frame: Seamless transition into the living ocean
    // - Every Land Tile has a Unique, Animated 3D Diorama
    // - Mathematically Balanced Placement of 6 Ports, 9 Monuments, 15 Resource
    //   Nodes & 5 Starting Anchorages with Wide Open Sea Channels so ships can
    //   route around any Monument/Port/Resource without ever getting blocked!
    // ------------------------------------------------------------------------
    buildBoard(monumentAssignments) {
        while (this.boardGroup.children.length > 0) {
            this.boardGroup.remove(this.boardGroup.children[0]);
        }
        this.hexTiles = [];
        this.hexMap.clear();
        this.animatedLandProps = [];
        this.fairSpawnAnchors = [];
        this.activeNPCTile = null;

        // S-Curve Profile by row r (-14 to +14): [vnWestCol, vnCoastCol, regionId]
        const sCurveProfile = {
            // 1. TRUNG DU & MIỀN NÚI BẮC BỘ (Broad Northern Mountain Arc & Ha Long Bay)
            "-14": [-6,  1, 0],
            "-13": [-7,  1, 0],
            "-12": [-7,  1, 0],
            "-11": [-6,  0, 0],

            // 2. ĐỒNG BẰNG SÔNG HỒNG (Concave Gulf of Tonkin & Golden Alluvial Delta)
            "-10": [-5, -1, 1],
            "-9":  [-4, -1, 1],
            "-8":  [-4, -1, 1],
            "-7":  [-4, -1, 1],

            // 3. BẮC TRUNG BỘ & DUYÊN HẢI MIỀN TRUNG (Narrow Waist Curving South-East)
            "-6":  [-4, -1, 2],
            "-5":  [-3,  0, 2],
            "-4":  [-3,  0, 2],
            "-3":  [-2,  1, 2],
            "-2":  [-1,  2, 2],
            "-1":  [-1,  2, 2],
            "0":   [ 0,  3, 2],
            "1":   [ 0,  3, 2],

            // 4. TÂY NGUYÊN & NAM TRUNG BỘ (Elevated Basalt Plateau & Easternmost Bulge)
            "2":   [-1,  3, 3],
            "3":   [-1,  4, 3],
            "4":   [-1,  3, 3],
            "5":   [-1,  2, 3],

            // 5. ĐÔNG NAM BỘ (South-Westward Bend toward Saigon & Continental Shelf)
            "6":   [-2,  2, 4],
            "7":   [-2,  1, 4],
            "8":   [-2,  1, 4],
            "9":   [-3,  0, 4],

            // 6. ĐỒNG BẰNG SÔNG CỬU LONG (Southern Mekong Delta Hook & Mũi Cà Mau)
            "10":  [-5,  0, 5],
            "11":  [-6, -1, 5],
            "12":  [-6, -1, 5],
            "13":  [-6, -2, 5],
            "14":  [-5, -3, 5]
        };

        // 5 Mathematically Calibrated Starting Anchorages in the Open Sea Lane
        // Every anchorage has 360-degree open-water clearance and is 2-3 pure-sea steps
        // from a Port, a Resource node, and a Monument!
        const spawnAnchorKeys = new Set([
            "-10,3", // Anchor 1 (Vịnh Bắc Bộ): 3 steps to Cái Lân/Hạ Long/Hải Phòng & Food/Wood/Iron
            "-6,4",  // Anchor 2 (Bắc Trung Bộ): 3 steps to Hải Phòng/Tiên Sa & Phong Nha & Food/Wood/Iron
            "-1,5",  // Anchor 3 (Trung Trung Bộ): 3 steps to Tiên Sa/Quy Nhơn & Huế/Mỹ Sơn & Food/Wood/Iron
            "5,6",   // Anchor 4 (Nam Trung Bộ - Đông Nam Bộ): 3 steps to Quy Nhơn/Cái Mép & Tây Nguyên/Bến Nhà Rồng
            "10,3"   // Anchor 5 (Nam Bộ - Cửu Long): 3 steps to Cái Mép/Cần Thơ & Cái Răng & Food/Wood/Iron
        ]);

        // Carefully Engineered Special Placements (6 Ports, 9 Monuments, 15 Resource Nodes: 5 Food, 5 Wood, 5 Iron)
        // Every POI has open water around it so ships can ALWAYS sail around any POI without blocking!
        const specialPlacements = {
            // 1. TRUNG DU & MIỀN NÚI BẮC BỘ (r = -14..-11)
            "-14,1":  { terrain: "coast", monumentId: "mon_sapa", navigable: true },
            "-13,3":  { terrain: "coast", resourceType: "iron", navigable: true },
            "-12,1":  { terrain: "coast", isPort: true, portName: "Thương Cảng Cái Lân (Quảng Ninh)", navigable: true },
            "-12,4":  { terrain: "coast", resourceType: "wood", navigable: true },
            "-11,2":  { terrain: "island", monumentId: "mon_halong", navigable: true },
            "-13,6":  { terrain: "reef", navigable: false },

            // 2. ĐỒNG BẰNG SÔNG HỒNG (r = -10..-7)
            "-10,0":  { terrain: "coast", resourceType: "food", navigable: true },
            "-9,-1":  { terrain: "coast", monumentId: "mon_vanmieu", navigable: true },
            "-8,-1":  { terrain: "coast", isPort: true, portName: "Thương Cảng Hải Phòng", navigable: true },
            "-7,1":   { terrain: "coast", resourceType: "wood", navigable: true },
            "-8,5":   { terrain: "reef", navigable: false },

            // 3. BẮC TRUNG BỘ & DUYÊN HẢI MIỀN TRUNG (r = -6..+1)
            "-6,2":   { terrain: "coast", resourceType: "iron", navigable: true },
            "-5,0":   { terrain: "coast", monumentId: "mon_phongnha", navigable: true },
            "-4,3":   { terrain: "coast", resourceType: "food", navigable: true },
            "-3,1":   { terrain: "coast", isPort: true, portName: "Thương Cảng Tiên Sa (Đà Nẵng)", navigable: true },
            "-2,4":   { terrain: "coast", resourceType: "wood", navigable: true },
            "-2,7":   { terrain: "archipelago", archipelagoName: "QUẦN ĐẢO HOÀNG SA", archipelagoSub: "TP. Đà Nẵng • Chủ Quyền Việt Nam", navigable: false },
            "-1,2":   { terrain: "coast", monumentId: "mon_hue", navigable: true },
            "0,5":    { terrain: "coast", resourceType: "iron", navigable: true },
            "1,3":    { terrain: "coast", monumentId: "mon_myson", navigable: true },

            // 4. TÂY NGUYÊN & LIÊN KẾT NAM TRUNG BỘ (r = +2..+5)
            "2,3":    { terrain: "coast", isPort: true, portName: "Thương Cảng Liên Vùng Tây Nguyên – Quy Nhơn", navigable: true },
            "3,6":    { terrain: "coast", resourceType: "food", navigable: true },
            "4,3":    { terrain: "coast", monumentId: "mon_taynguyen", navigable: true },
            "5,4":    { terrain: "coast", resourceType: "wood", navigable: true },
            "4,8":    { terrain: "reef", navigable: false },

            // 5. ĐÔNG NAM BỘ (r = +6..+9)
            "6,3":    { terrain: "coast", resourceType: "iron", navigable: true },
            "7,1":    { terrain: "coast", isPort: true, portName: "Thương Cảng Quốc Tế Cái Mép – Sài Gòn", navigable: true },
            "8,1":    { terrain: "coast", monumentId: "mon_bennharong", navigable: true },
            "8,4":    { terrain: "coast", resourceType: "food", navigable: true },
            "8,7":    { terrain: "archipelago", archipelagoName: "QUẦN ĐẢO TRƯỜNG SA", archipelagoSub: "Tỉnh Khánh Hòa • Chủ Quyền Việt Nam", navigable: false },

            // 6. ĐỒNG BẰNG SÔNG CỬU LONG (r = +10..+14, with Navigable Mekong Channels)
            "10,1":   { terrain: "coast", resourceType: "wood", navigable: true },
            "10,-2":  { terrain: "river_channel", navigable: true },
            "11,-3":  { terrain: "river_channel", navigable: true },
            "11,-2":  { terrain: "river_channel", navigable: true },
            "11,-1":  { terrain: "coast", monumentId: "mon_cairang", navigable: true },
            "11,2":   { terrain: "coast", resourceType: "iron", navigable: true },
            "12,-3":  { terrain: "river_channel", navigable: true },
            "12,-1":  { terrain: "coast", isPort: true, portName: "Thương Cảng Cần Thơ – Cửu Long", navigable: true },
            "13,0":   { terrain: "coast", resourceType: "food", navigable: true },
            "12,5":   { terrain: "reef", navigable: false }
        };

        const layoutSpec = [];
        for (let r = -14; r <= 14; r++) {
            const [vnWest, vnCoast, regionId] = sCurveProfile[String(r)] || [-3, 0, 2];
            const qCenterOffset = -Math.floor(r / 2);

            for (let col = -9; col <= 9; col++) {
                const q = qCenterOffset + col;
                const key = `${r},${col}`;
                const custom = specialPlacements[key];
                const isSpawnAnchor = spawnAnchorKeys.has(key);

                if (isSpawnAnchor) {
                    this.fairSpawnAnchors.push({ q, r, col, regionId });
                }

                if (custom) {
                    layoutSpec.push({
                        q,
                        r,
                        col,
                        regionId,
                        terrain: custom.terrain,
                        navigable: custom.navigable !== false,
                        monumentId: custom.monumentId || null,
                        isPort: !!custom.isPort,
                        portName: custom.portName || null,
                        resourceType: custom.resourceType || null,
                        archipelagoName: custom.archipelagoName || null,
                        archipelagoSub: custom.archipelagoSub || null,
                        isSpawnRim: isSpawnAnchor
                    });
                } else if (col < vnWest) {
                    // South-West of Mekong Delta (r >= 10, col <= vnWest - 1) is Gulf of Thailand (Vịnh Thái Lan)
                    // Far West (col <= -7) blends into the ocean so there is no artificial rectangular block!
                    const isGulfOfThailand = (r >= 10 && col <= vnWest - 1);
                    const isOuterWesternSea = (col <= vnWest - 4);
                    if (isGulfOfThailand || isOuterWesternSea) {
                        continue; // Let the natural 3D Ocean & islands shine without flat border tiles!
                    }
                    layoutSpec.push({
                        q,
                        r,
                        col,
                        regionId,
                        terrain: "parchment_land",
                        navigable: false
                    });
                } else if (col >= vnWest && col < vnCoast) {
                    let mainTerrain = "delta_land";
                    if (regionId === 0) mainTerrain = "mountain";
                    else if (regionId === 1) mainTerrain = "delta_land";
                    else if (regionId === 2) mainTerrain = (col === vnWest ? "mountain" : "coast_land");
                    else if (regionId === 3) mainTerrain = "highland";
                    else if (regionId === 4) mainTerrain = "southeast_land";
                    else mainTerrain = "delta_land";

                    layoutSpec.push({
                        q,
                        r,
                        col,
                        regionId,
                        terrain: mainTerrain,
                        navigable: false
                    });
                } else {
                    layoutSpec.push({
                        q,
                        r,
                        col,
                        regionId,
                        terrain: col === vnCoast ? "coast" : "sea",
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
    }

    buildRegionBanners() {
        // 6 Region Parchment Banners floating above the S-Curve (NO Wooden Frame!)
        const regionBanners = [
            { r: -13, col: -4, line1: "1. TRUNG DU &", line2: "MIỀN NÚI BẮC BỘ", color: "#2d6a4f" },
            { r: -9,  col: -3, line1: "2. ĐỒNG BẰNG", line2: "SÔNG HỒNG", color: "#b58328" },
            { r: -3,  col: -1, line1: "3. DUYÊN HẢI", line2: "MIỀN TRUNG", color: "#2b6f86" },
            { r: 3,   col: 0,  line1: "4. TÂY NGUYÊN", line2: "CAO NGUYÊN ĐẤT ĐỎ", color: "#9c4a1a" },
            { r: 7,   col: -1, line1: "5. ĐÔNG NAM BỘ", line2: "TRUNG TÂM CÔNG NGHIỆP", color: "#8c3b4a" },
            { r: 12,  col: -4, line1: "6. ĐỒNG BẰNG", line2: "SÔNG CỬU LONG", color: "#4d7c3f" }
        ];
        regionBanners.forEach(rb => {
            const q = -Math.floor(rb.r / 2) + rb.col;
            const { x, z } = this.axialToWorld(q, rb.r);
            const sprite = ProceduralModels.createRegionBannerSprite(rb.line1, rb.line2, rb.color, 4.8, 1.36);
            sprite.position.set(x, 3.05, z);
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

        // Deterministic per-tile height & color micro-variation so adjacent land hexes never look flat or identical!
        const tileSeed = Math.abs((spec.q * 49297) ^ (spec.r * 9301));
        const jitter = ProceduralModels.seededRandom(tileSeed);

        let height = 0.28;
        let topColor = new THREE.Color(region.color);

        if (spec.terrain === "sea") {
            height = 0.14;
            topColor = new THREE.Color(spec.isSpawnRim ? 0x155e75 : 0x0f3b57);
        } else if (spec.terrain === "river_channel") {
            height = 0.19;
            topColor = new THREE.Color(0x0284c7);
        } else if (spec.terrain === "parchment_land") {
            height = 0.65 + jitter * 0.45;
            topColor = new THREE.Color(0x3f6212).lerp(new THREE.Color(0x78350f), jitter * 0.55);
        } else if (spec.terrain === "reef") {
            height = 0.26;
            topColor = new THREE.Color(0x27272a);
        } else if (spec.terrain === "archipelago") {
            height = 0.42;
            topColor = new THREE.Color(0x0f766e);
        } else if (spec.terrain === "mountain") {
            height = 1.10 + jitter * 0.48;
            topColor.offsetHSL(0, (jitter - 0.5) * 0.08, (jitter - 0.5) * 0.08);
        } else if (spec.terrain === "highland") {
            height = 0.90 + jitter * 0.36;
            topColor.offsetHSL(0, (jitter - 0.5) * 0.08, (jitter - 0.5) * 0.07);
        } else if (spec.terrain === "southeast_land") {
            height = 0.68 + jitter * 0.28;
            topColor.offsetHSL(0, (jitter - 0.5) * 0.06, (jitter - 0.5) * 0.06);
        } else if (spec.terrain === "coast_land") {
            height = 0.62 + jitter * 0.26;
            topColor.offsetHSL(0, (jitter - 0.5) * 0.06, (jitter - 0.5) * 0.06);
        } else if (spec.terrain === "delta_land") {
            height = 0.54 + jitter * 0.22;
            topColor.offsetHSL(0, (jitter - 0.5) * 0.07, (jitter - 0.5) * 0.07);
        } else if (spec.terrain === "island") {
            height = 0.44;
        } else {
            height = 0.34;
        }

        const hexGeo = new THREE.CylinderGeometry(this.hexRadius * 0.96, this.hexRadius * 1.0, height, 6);
        const isWaterHex = (spec.terrain === "sea" || spec.terrain === "river_channel");
        const hexMat = new THREE.MeshStandardMaterial({
            color: topColor,
            roughness: isWaterHex ? 0.28 : 0.65,
            metalness: isWaterHex ? 0.35 : 0.16,
            transparent: isWaterHex,
            opacity: isWaterHex ? 0.58 : 1.0
        });

        const baseMesh = new THREE.Mesh(hexGeo, hexMat);
        baseMesh.position.y = height / 2 - 0.1;
        baseMesh.receiveShadow = true;
        baseMesh.castShadow = !isWaterHex;
        group.add(baseMesh);

        const rimGeo = new THREE.RingGeometry(this.hexRadius * 0.88, this.hexRadius * 0.96, 6);
        rimGeo.rotateX(-Math.PI / 2);
        rimGeo.rotateZ(Math.PI / 6);
        const rimColor = spec.terrain === "reef" ? new THREE.Color(0x64748b) : new THREE.Color(region.color);
        const rimMat = new THREE.MeshBasicMaterial({
            color: rimColor,
            transparent: true,
            opacity: isWaterHex ? 0.03 : 0.22,
            side: THREE.DoubleSide
        });
        const rimMesh = new THREE.Mesh(rimGeo, rimMat);
        rimMesh.position.y = height - 0.09;
        group.add(rimMesh);

        const hlGeo = new THREE.RingGeometry(this.hexRadius * 0.82, this.hexRadius * 0.97, 6);
        hlGeo.rotateX(-Math.PI / 2);
        hlGeo.rotateZ(Math.PI / 6);
        const hlMat = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.0,
            side: THREE.DoubleSide
        });
        const highlightRing = new THREE.Mesh(hlGeo, hlMat);
        highlightRing.position.y = height - 0.05;
        group.add(highlightRing);

        const surfaceY = height - 0.1;

        // --------------------------------------------------------------------
        // RICH, UNIQUE, ANIMATED 3D DIORAMAS FOR ALL LAND & OBSTACLE HEXES
        // --------------------------------------------------------------------
        if (!spec.navigable) {
            if (spec.terrain === "archipelago" && spec.archipelagoName) {
                const archModel = ProceduralModels.createSovereigntyArchipelago(
                    spec.archipelagoName,
                    spec.archipelagoSub || "Chủ Quyền Biển Đảo Việt Nam"
                );
                archModel.position.y = surfaceY;
                group.add(archModel);
            } else if (spec.terrain === "reef") {
                const reefMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8, metalness: 0.2 });
                const coralMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xbe123c, emissiveIntensity: 0.38 });
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
                this.animatedLandProps.push({ type: "spin_y", mesh: warnOrb, speed: 2.0 });
            } else {
                // Every Mainland & Frontier Hex gets a Unique Animated 3D Diorama!
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
        this.activeHexKey = activeHexKey;
        this.hexTiles.forEach(tile => {
            if (this.hoveredHex === tile) {
                const key = `${tile.q},${tile.r}`;
                if (this.reachablePaths && this.reachablePaths.has(key)) {
                    tile.highlightRing.material.color.setHex(0x38bdf8);
                    tile.highlightRing.material.opacity = 0.92;
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
                    if (this.hoveredHex && this.hoveredHex.highlightRing) {
                        this.hoveredHex.highlightRing.material.opacity = 0.0;
                    }
                    this.hoveredHex = tile;

                    const key = `${tile.q},${tile.r}`;
                    const isReachable = this.reachablePaths && this.reachablePaths.has(key);
                    this.renderer.domElement.style.cursor = isReachable ? "pointer" : (tile.navigable ? "default" : "not-allowed");

                    if (isReachable) {
                        tile.highlightRing.material.color.setHex(0x38bdf8);
                        tile.highlightRing.material.opacity = 0.92;
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

            // 2. Clouds & Weather
            this.clouds.forEach(c => {
                c.mesh.position.x += c.speed * delta;
                if (c.mesh.position.x > 82) c.mesh.position.x = -82;
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

            // 3. Foam Rings
            this.foamRings.forEach(f => {
                const s = 0.8 + Math.sin(elapsed * f.speed + f.offset) * 0.35;
                f.mesh.scale.set(s, s, s);
                f.mesh.material.opacity = 0.2 + Math.cos(elapsed * f.speed + f.offset) * 0.15;
            });

            // 4. Player Ships: Pitch/Roll, Breathing Sails, Fluttering Flags & Swaying Lanterns
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
                shipIdx++;
            });

            // 5. Animated Land Hex Diorama Props (Waterwheels, Windmills, Campfires, Cranes, Smoke, Clouds)
            for (let i = 0; i < this.animatedLandProps.length; i++) {
                const item = this.animatedLandProps[i];
                if (!item.mesh) continue;
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

            // 6. Monument, Port & Resource Model Animations
            this.hexTiles.forEach(tile => {
                if (tile.propModel) {
                    if (tile.monumentId && tile.propModel.userData.relicCrown) {
                        tile.propModel.userData.relicCrown.rotation.y = elapsed * 1.8;
                        tile.propModel.userData.relicCrown.position.y = 2.15 + Math.sin(elapsed * 2.5) * 0.10;
                    }
                    if (tile.propModel.userData.spinZ) {
                        tile.propModel.userData.spinZ.rotation.z = elapsed * 2.0;
                    }
                    if (tile.propModel.userData.spinY) {
                        tile.propModel.userData.spinY.rotation.y = Math.sin(elapsed * 0.9) * 0.85;
                    }
                    if (tile.hasNPC && tile.propModel.userData.gem) {
                        tile.propModel.userData.gem.rotation.y = elapsed * 2.6;
                    }
                }
            });

            // 7. Ambient Ocean Wildlife & Fleet Animations
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
                this.ambientDolphins.forEach((dp, idx) => {
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

            // 8. Wake & Burst Particle Effects
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
