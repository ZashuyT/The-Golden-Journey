// ============================================================================
// THE GOLDEN JOURNEY (HÀNH TRÌNH VÀNG SON) — V9.0 4X GRAND SCALE & ANTI-LAG 3D ENGINE
// - All Hexes & 3D Models Scaled 4x Larger with Generous Spacing
// - Ultra-Lightweight Low-Poly Geometry for Smooth High-FPS Performance
// - Nautical Map & Parchment Paper Badging
// - Built-in Support for Tile Fading & Ship Highlight when Ships Enter Any Hex
// ============================================================================

const MODEL_SCALE_4X = 4.0;

class ProceduralModels {
    static seededRandom(seed) {
        const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
        return x - Math.floor(x);
    }

    // ------------------------------------------------------------------------
    // A. NAUTICAL PARCHMENT LOCATION PILL BADGE (4X SCALE, CLEAN & READABLE)
    // ------------------------------------------------------------------------
    static createLabelCanvas(text, subtext = "", bgColor = "rgba(244, 233, 207, 0.94)", borderColor = "#8c5e2a", scaleX = 2.15, scaleY = 0.52) {
        const canvas = document.createElement("canvas");
        canvas.width = 480;
        canvas.height = 120;
        const ctx = canvas.getContext("2d");

        const x = 14, y = 16, w = 452, h = 88, r = 20;

        ctx.save();
        ctx.fillStyle = "rgba(18, 34, 48, 0.35)";
        ctx.beginPath();
        ctx.roundRect(x, y + 4, w, h, r);
        ctx.fill();
        ctx.restore();

        // Warm Nautical Parchment Paper Fill
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        const grad = ctx.createLinearGradient(0, y, 0, y + h);
        grad.addColorStop(0, "rgba(250, 241, 220, 0.96)");
        grad.addColorStop(1, "rgba(232, 214, 178, 0.96)");
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.lineWidth = 5;
        ctx.strokeStyle = borderColor || "#8c5e2a";
        ctx.stroke();

        const cleanTitle = String(text || "")
            .replace("Thương Cảng Liên Vùng ", "Cảng ")
            .replace("Thương Cảng Quốc Tế ", "Cảng ")
            .replace("Thương Cảng ", "Cảng ")
            .trim();

        ctx.fillStyle = "#26170a";
        ctx.font = "bold 26px 'Palatino Linotype', 'Segoe UI', serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(cleanTitle, 240, subtext ? 46 : 60);

        if (subtext) {
            const shortSub = String(subtext).length > 36 ? String(subtext).slice(0, 35) + "…" : String(subtext);
            ctx.fillStyle = "#5c3d1e";
            ctx.font = "700 18px 'Segoe UI', Roboto, sans-serif";
            ctx.fillText(shortSub, 240, 78);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        const spriteMat = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.92,
            depthTest: false
        });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(Math.min(scaleX, 2.25) * MODEL_SCALE_4X, Math.min(scaleY, 0.55) * MODEL_SCALE_4X, 1);
        sprite.renderOrder = 950;
        return sprite;
    }

    // ------------------------------------------------------------------------
    // B. PLAYER SHIP NAMEPLATE (NAUTICAL PARCHMENT & SEA-BRASS FRAME — 4X SCALE)
    // ------------------------------------------------------------------------
    static createPlayerShipNameplate(playerName, vesselTitle = "", shipColorHex = "#4399d8", isLocalPlayer = false) {
        const cleanName = String(playerName || "Thuyền Trưởng").trim().slice(0, 18);
        const canvas = document.createElement("canvas");
        canvas.width = 480;
        canvas.height = 136;
        const ctx = canvas.getContext("2d");

        const pillX = 24, pillY = 12, pillW = 432, pillH = 82, radius = 20;

        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 3;

        // Pointer triangle
        ctx.beginPath();
        ctx.moveTo(240 - 18, pillY + pillH - 2);
        ctx.lineTo(240 + 18, pillY + pillH - 2);
        ctx.lineTo(240, pillY + pillH + 24);
        ctx.closePath();
        ctx.fillStyle = isLocalPlayer ? "#c88a28" : shipColorHex;
        ctx.fill();

        // Parchment / Maritime Banner Body
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, radius);
        ctx.fillStyle = isLocalPlayer ? "rgba(252, 243, 217, 0.98)" : "rgba(242, 231, 205, 0.95)";
        ctx.fill();
        ctx.restore();

        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, radius);
        ctx.lineWidth = isLocalPlayer ? 8 : 6;
        ctx.strokeStyle = isLocalPlayer ? "#b87b1e" : shipColorHex;
        ctx.stroke();

        const dotX = pillX + 42, dotY = pillY + pillH / 2;
        ctx.beginPath();
        ctx.arc(dotX, dotY, 16, 0, Math.PI * 2);
        ctx.fillStyle = shipColorHex;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#26170a";
        ctx.stroke();

        ctx.fillStyle = "#231408";
        ctx.font = "900 34px 'Palatino Linotype', 'Segoe UI', serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(cleanName, 256, pillY + pillH / 2 + 1);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(
            (isLocalPlayer ? 2.65 : 2.38) * MODEL_SCALE_4X,
            (isLocalPlayer ? 0.75 : 0.68) * MODEL_SCALE_4X,
            1
        );
        sprite.renderOrder = isLocalPlayer ? 1025 : 1015;
        return sprite;
    }

    // ------------------------------------------------------------------------
    // B2. LOCAL PLAYER 3D ARROW MARKER (4X SCALE)
    // ------------------------------------------------------------------------
    static createLocalPlayerArrowMarker(shipColorHex = "#3ba776") {
        const markerGroup = new THREE.Group();

        const arrowMat = new THREE.MeshStandardMaterial({
            color: 0xe6b839,
            emissive: 0xb4822c,
            emissiveIntensity: 0.35,
            metalness: 0.25,
            roughness: 0.35
        });
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x3ba776,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.82
        });

        const headGeo = new THREE.ConeGeometry(0.36, 0.58, 6);
        headGeo.rotateX(Math.PI);
        const headMesh = new THREE.Mesh(headGeo, arrowMat);
        headMesh.position.y = 0;
        markerGroup.add(headMesh);

        const shaftGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.44, 6);
        const shaftMesh = new THREE.Mesh(shaftGeo, arrowMat);
        shaftMesh.position.y = 0.44;
        markerGroup.add(shaftMesh);

        const haloGeo = new THREE.RingGeometry(0.40, 0.54, 18);
        haloGeo.rotateX(-Math.PI / 2);
        const haloMesh = new THREE.Mesh(haloGeo, ringMat);
        haloMesh.position.y = -0.16;
        markerGroup.add(haloMesh);

        const canvas = document.createElement("canvas");
        canvas.width = 360;
        canvas.height = 86;
        const ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.roundRect(12, 10, 336, 66, 33);
        ctx.fillStyle = "rgba(250, 240, 212, 0.96)";
        ctx.fill();
        ctx.lineWidth = 6;
        ctx.strokeStyle = "#b87b1e";
        ctx.stroke();
        ctx.fillStyle = "#231408";
        ctx.font = "900 25px 'Segoe UI', Roboto, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("▼ THUYỀN CỦA BẠN", 180, 44);

        const tex = new THREE.CanvasTexture(canvas);
        const badgeSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
        badgeSprite.scale.set(1.85 * MODEL_SCALE_4X, 0.45 * MODEL_SCALE_4X, 1);
        badgeSprite.position.set(0, 1.02, 0);
        badgeSprite.renderOrder = 1030;
        markerGroup.add(badgeSprite);

        markerGroup.userData = { headMesh, shaftMesh, haloMesh };
        return markerGroup;
    }

    // ------------------------------------------------------------------------
    // C. COMPACT REGION BANNER PLAQUE (4X SCALE, ANTIQUE MAP RIBBON)
    // ------------------------------------------------------------------------
    static createRegionBannerSprite(line1, line2 = "", borderHex = "#8c5e2a", scaleX = 2.35, scaleY = 0.60) {
        const canvas = document.createElement("canvas");
        canvas.width = 520;
        canvas.height = 132;
        const ctx = canvas.getContext("2d");

        const x = 16, y = 14, w = 488, h = 104, r = 16;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        ctx.fillStyle = "rgba(244, 232, 204, 0.90)";
        ctx.fill();

        ctx.lineWidth = 5;
        ctx.strokeStyle = borderHex || "#8c5e2a";
        ctx.stroke();

        ctx.fillStyle = "#2b1b0c";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if (line2) {
            ctx.font = "800 22px 'Palatino Linotype', 'Segoe UI', serif";
            ctx.fillText(line1, 260, 48);
            ctx.fillStyle = "#5c3d1e";
            ctx.font = "700 18px 'Segoe UI', Roboto, sans-serif";
            ctx.fillText(line2, 260, 82);
        } else {
            ctx.font = "800 24px 'Palatino Linotype', 'Segoe UI', serif";
            ctx.fillText(line1, 260, 66);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        const spriteMat = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.88,
            depthTest: false
        });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(Math.min(scaleX, 2.45) * MODEL_SCALE_4X, Math.min(scaleY, 0.64) * MODEL_SCALE_4X, 1);
        sprite.renderOrder = 920;
        return sprite;
    }

    // ------------------------------------------------------------------------
    // 1. 4X SCALE HIGH-VISIBILITY VIETNAMESE SAILING SHIP
    //    Crisp silhouette + bright spotlight disc so it stands out when entering tiles
    // ------------------------------------------------------------------------
    static createPlayerShip(archetypeId, playerName = "", isLocalPlayer = false) {
        const arch = window.GAME_DATA.shipArchetypes[archetypeId % 5];
        const group = new THREE.Group();

        const hullColor = new THREE.Color(arch.color);
        const sailColor = new THREE.Color(arch.sailColor || "#fbf6e9");
        const trimColor = new THREE.Color(arch.trimColor || "#e2b857");

        const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c3419, roughness: 0.60, metalness: 0.08 });
        const deckMat = new THREE.MeshStandardMaterial({ color: 0xd4aa72, roughness: 0.55, metalness: 0.05 });
        const hullMat = new THREE.MeshStandardMaterial({
            color: hullColor,
            emissive: hullColor,
            emissiveIntensity: 0.22,
            roughness: 0.38,
            metalness: 0.12
        });
        const trimMat = new THREE.MeshStandardMaterial({
            color: trimColor,
            roughness: 0.35,
            metalness: 0.40
        });
        const sailMat = new THREE.MeshStandardMaterial({
            color: sailColor,
            emissive: sailColor,
            emissiveIntensity: 0.12,
            roughness: 0.45,
            side: THREE.DoubleSide
        });

        // 1. Tapered Wooden Hull + Vivid Upper Band + Warm Wood Deck
        const lowerHullGeo = new THREE.CylinderGeometry(0.48, 0.26, 1.62, 10);
        lowerHullGeo.rotateZ(Math.PI / 2);
        lowerHullGeo.scale(1.18, 0.54, 0.80);
        const lowerHull = new THREE.Mesh(lowerHullGeo, woodMat);
        lowerHull.position.y = 0.22;
        group.add(lowerHull);

        const upperHullGeo = new THREE.CylinderGeometry(0.52, 0.44, 1.58, 10);
        upperHullGeo.rotateZ(Math.PI / 2);
        upperHullGeo.scale(1.16, 0.36, 0.82);
        const upperHull = new THREE.Mesh(upperHullGeo, hullMat);
        upperHull.position.y = 0.38;
        group.add(upperHull);

        const mainDeck = new THREE.Mesh(new THREE.BoxGeometry(1.50, 0.07, 0.66), deckMat);
        mainDeck.position.y = 0.47;
        group.add(mainDeck);

        const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.25, 0.50), woodMat);
        cabin.position.set(-0.46, 0.61, 0);
        const cabinRoof = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.18, 4), hullMat);
        cabinRoof.rotation.y = Math.PI / 4;
        cabinRoof.position.set(-0.46, 0.82, 0);
        group.add(cabin, cabinRoof);

        const prow = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.30, 6), trimMat);
        prow.rotation.z = -Math.PI / 2.3;
        prow.position.set(0.92, 0.60, 0);
        group.add(prow);

        // 2. Two Crisp Masts & Sails
        const mainMast = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 1.68, 6), woodMat);
        mainMast.position.set(0.02, 1.16, 0);
        const foreMast = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.04, 1.28, 6), woodMat);
        foreMast.position.set(0.50, 0.96, 0);
        group.add(mainMast, foreMast);

        const buildCleanSail = (radius, height, xPos, yPos) => {
            const sGroup = new THREE.Group();
            const sGeo = new THREE.CylinderGeometry(radius, radius * 1.02, height, 10, 1, true, -Math.PI * 0.34, Math.PI * 0.68);
            const sMesh = new THREE.Mesh(sGeo, sailMat);
            sMesh.rotation.y = Math.PI / 2;
            sMesh.position.x = -radius * 0.55;
            sGroup.add(sMesh);

            const bandGeo = new THREE.CylinderGeometry(radius * 1.01, radius * 1.015, height * 0.24, 10, 1, true, -Math.PI * 0.34, Math.PI * 0.68);
            const bandMesh = new THREE.Mesh(bandGeo, hullMat);
            bandMesh.rotation.y = Math.PI / 2;
            bandMesh.position.set(-radius * 0.55, height * 0.34, 0);
            sGroup.add(bandMesh);

            sGroup.position.set(xPos, yPos, 0);
            return sGroup;
        };

        const mainSail = buildCleanSail(0.56, 1.02, 0.02, 1.20);
        const foreSail = buildCleanSail(0.40, 0.74, 0.50, 1.02);
        group.add(mainSail, foreSail);

        const flagGeo = new THREE.ConeGeometry(0.16, 0.46, 4);
        flagGeo.rotateZ(Math.PI / 2);
        const flag = new THREE.Mesh(flagGeo, hullMat);
        flag.position.set(-0.20, 1.98, 0);
        group.add(flag);

        // 3. High-Contrast Water Halo Ring + Spotlight Disc Under Ship
        const outerRingGeo = new THREE.RingGeometry(0.92, 1.18, 24);
        outerRingGeo.rotateX(-Math.PI / 2);
        const ring = new THREE.Mesh(
            outerRingGeo,
            new THREE.MeshBasicMaterial({ color: hullColor, side: THREE.DoubleSide, transparent: true, opacity: 0.95 })
        );
        ring.position.y = 0.06;
        group.add(ring);

        const innerDiscGeo = new THREE.CircleGeometry(0.90, 20);
        innerDiscGeo.rotateX(-Math.PI / 2);
        const innerDisc = new THREE.Mesh(
            innerDiscGeo,
            new THREE.MeshBasicMaterial({ color: 0xfef3c7, transparent: true, opacity: 0.28, side: THREE.DoubleSide })
        );
        innerDisc.position.y = 0.04;
        group.add(innerDisc);

        let localRadarRing = null;
        if (isLocalPlayer) {
            const radarGeo = new THREE.RingGeometry(1.22, 1.42, 24);
            radarGeo.rotateX(-Math.PI / 2);
            localRadarRing = new THREE.Mesh(
                radarGeo,
                new THREE.MeshBasicMaterial({ color: 0xe6c15a, side: THREE.DoubleSide, transparent: true, opacity: 0.88 })
            );
            localRadarRing.position.y = 0.07;
            group.add(localRadarRing);
        }

        const nameSprite = this.createPlayerShipNameplate(playerName || arch.name, arch.vesselTitle, arch.color, isLocalPlayer);
        nameSprite.position.set(0, 2.70, 0);
        group.add(nameSprite);

        let myArrowMarker = null;
        if (isLocalPlayer) {
            myArrowMarker = this.createLocalPlayerArrowMarker(arch.color);
            myArrowMarker.position.set(0, 3.82, 0);
            group.add(myArrowMarker);
        }

        const baseShipScale = 1.24 * MODEL_SCALE_4X;
        group.scale.setScalar(baseShipScale);
        group.userData = {
            baseShipScale,
            mainSail,
            foreSail,
            mizzenSail: null,
            flag,
            ring,
            innerDisc,
            beaconPillar: null,
            localRadarRing,
            nameSprite,
            myArrowMarker,
            archetype: arch,
            archetypeId: archetypeId % 5,
            playerName: playerName || arch.name,
            isLocalPlayer: Boolean(isLocalPlayer)
        };
        return group;
    }

    // ------------------------------------------------------------------------
    // 2. SPARSE, WELL-SPACED 4X LAND HEX DIORAMAS
    //    Only placed on ~1 in 7 inland hexes so mainland models have huge
    //    breathing room and never look dense or cluttered!
    // ------------------------------------------------------------------------
    static createLandHexDiorama(spec, surfaceY, animRegistry = null) {
        const group = new THREE.Group();
        group.position.y = surfaceY;

        // Leave a 2-hex clear buffer along the eastern coast so coastal POIs and ships are 100% uncluttered
        if (spec.maxLandCol !== undefined && spec.col >= spec.maxLandCol - 1) {
            return group;
        }

        // Only place a landmark on well-spaced inland hexes (~1 in 7 hexes, never adjacent)
        const isSpacedLandmark = (Math.abs(spec.q) % 2 === 0) && (Math.abs(spec.r) % 3 === 0);
        if (!isSpacedLandmark) {
            return group;
        }

        const seed = Math.abs((spec.q * 73856093) ^ (spec.r * 19349663));
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x6e4726, roughness: 0.78 });

        const addSimpleTree = (x, z, scale = 0.85, leafColorHex = 0x3b6e4c) => {
            const t = new THREE.Group();
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.28, 5), woodMat);
            trunk.position.y = 0.14;
            const cone = new THREE.Mesh(
                new THREE.ConeGeometry(0.24, 0.46, 6),
                new THREE.MeshStandardMaterial({ color: leafColorHex, roughness: 0.72 })
            );
            cone.position.y = 0.38;
            t.add(trunk, cone);
            t.position.set(x, 0, z);
            t.scale.setScalar(scale);
            group.add(t);
        };

        const addSimpleHouse = (x, z, w, h, d, wallCol, roofCol) => {
            const hGroup = new THREE.Group();
            const body = new THREE.Mesh(
                new THREE.BoxGeometry(w, h, d),
                new THREE.MeshStandardMaterial({ color: wallCol, roughness: 0.70 })
            );
            body.position.y = h / 2;
            const roof = new THREE.Mesh(
                new THREE.ConeGeometry(Math.max(w, d) * 0.76, h * 0.70, 4),
                new THREE.MeshStandardMaterial({ color: roofCol, roughness: 0.62 })
            );
            roof.rotation.y = Math.PI / 4;
            roof.position.y = h + h * 0.32;
            hGroup.add(body, roof);
            hGroup.position.set(x, 0, z);
            group.add(hGroup);
        };

        if (spec.regionId === 0) {
            const peak = new THREE.Mesh(
                new THREE.ConeGeometry(0.55, 0.78, 6),
                new THREE.MeshStandardMaterial({ color: 0x3f6a4e, roughness: 0.78 })
            );
            peak.position.set(0, 0.39, 0);
            group.add(peak);
        } else if (spec.regionId === 1) {
            addSimpleHouse(0, 0, 0.42, 0.24, 0.34, 0xede0c8, 0xb85242);
        } else if (spec.regionId === 2) {
            addSimpleHouse(0, 0, 0.38, 0.24, 0.32, 0xe2c785, 0x7c4d2b);
        } else if (spec.regionId === 3) {
            const base = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.14, 0.30), woodMat);
            base.position.set(0, 0.07, 0);
            const roof = new THREE.Mesh(
                new THREE.ConeGeometry(0.32, 0.64, 4),
                new THREE.MeshStandardMaterial({ color: 0x8c5230, roughness: 0.72 })
            );
            roof.rotation.y = Math.PI / 4;
            roof.position.set(0, 0.44, 0);
            group.add(base, roof);
        } else if (spec.regionId === 4) {
            addSimpleHouse(0, 0, 0.40, 0.26, 0.34, 0xe8dec8, 0x8f4850);
        } else {
            addSimpleTree(0, 0, 0.88, 0x568245);
        }

        group.scale.setScalar(0.66 * MODEL_SCALE_4X);
        group.rotation.y = (seed % 6) * (Math.PI / 3);
        return group;
    }

    // ------------------------------------------------------------------------
    // 3. 4X SCALE RESOURCE NODE MODELS (COMPACT FOOTPRINT, CLEAR SHIP BERTH)
    // ------------------------------------------------------------------------
    static createResourceNodeModel(resourceType) {
        const wrapper = new THREE.Group();
        const group = new THREE.Group();
        group.position.set(-0.42 * MODEL_SCALE_4X, 0, -0.38 * MODEL_SCALE_4X);

        const woodMat = new THREE.MeshStandardMaterial({ color: 0x6e4726, roughness: 0.70 });
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xd9a74a, roughness: 0.50, metalness: 0.22 });

        if (resourceType === "food") {
            const islet = new THREE.Mesh(
                new THREE.CylinderGeometry(0.58, 0.66, 0.14, 8),
                new THREE.MeshStandardMaterial({ color: 0x769e48, roughness: 0.75 })
            );
            islet.position.y = 0.07;
            const barn = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.25, 0.30), woodMat);
            barn.position.set(-0.06, 0.26, -0.04);
            const roof = new THREE.Mesh(
                new THREE.ConeGeometry(0.32, 0.22, 4),
                new THREE.MeshStandardMaterial({ color: 0xc28538, roughness: 0.58 })
            );
            roof.rotation.y = Math.PI / 4;
            roof.position.set(-0.06, 0.49, -0.04);
            const sheaf = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.32, 6), goldMat);
            sheaf.position.set(0.22, 0.29, 0.12);
            group.add(islet, barn, roof, sheaf);

        } else if (resourceType === "wood") {
            const islet = new THREE.Mesh(
                new THREE.CylinderGeometry(0.58, 0.66, 0.14, 8),
                new THREE.MeshStandardMaterial({ color: 0x3b6948, roughness: 0.75 })
            );
            islet.position.y = 0.07;
            group.add(islet);

            const leafMat = new THREE.MeshStandardMaterial({ color: 0x467d56, roughness: 0.65 });
            [[-0.14, -0.08, 0.88], [0.18, -0.10, 0.72]].forEach(([tx, tz, sc]) => {
                const tree = new THREE.Group();
                const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.30, 5), woodMat);
                trunk.position.y = 0.15;
                const crown = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.48, 6), leafMat);
                crown.position.y = 0.44;
                tree.add(trunk, crown);
                tree.position.set(tx, 0.12, tz);
                tree.scale.setScalar(sc);
                group.add(tree);
            });

        } else if (resourceType === "iron") {
            const rockMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.78, metalness: 0.15 });
            const oreMat = new THREE.MeshStandardMaterial({
                color: 0x60a5fa,
                roughness: 0.35,
                metalness: 0.45
            });

            const islet = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.66, 0.14, 8), rockMat);
            islet.position.y = 0.07;
            const outcrop = new THREE.Mesh(new THREE.DodecahedronGeometry(0.36, 0), rockMat);
            outcrop.position.set(-0.05, 0.34, -0.05);
            const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), oreMat);
            crystal.scale.set(0.8, 1.35, 0.8);
            crystal.position.set(0.18, 0.32, 0.10);
            group.add(islet, outcrop, crystal);
        }

        group.scale.setScalar(0.76 * MODEL_SCALE_4X);
        wrapper.add(group);
        return wrapper;
    }

    // ------------------------------------------------------------------------
    // 4. 4X SCALE MARITIME TRADE PORT (COMPACT FOOTPRINT, CLEAR SHIP BERTH)
    // ------------------------------------------------------------------------
    static createTradePortModel(regionColor) {
        const wrapper = new THREE.Group();
        const group = new THREE.Group();
        group.position.set(-0.42 * MODEL_SCALE_4X, 0, -0.38 * MODEL_SCALE_4X);

        const col = new THREE.Color(regionColor || "#d4a84f");
        const stoneMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.68 });
        const pierMat = new THREE.MeshStandardMaterial({ color: 0x6e4726, roughness: 0.72 });
        const wallMat = new THREE.MeshStandardMaterial({ color: 0xf1e6d0, roughness: 0.58 });
        const roofMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.50 });
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xd9a74a, metalness: 0.40, roughness: 0.40 });

        const quay = new THREE.Mesh(new THREE.CylinderGeometry(0.64, 0.72, 0.16, 8), stoneMat);
        quay.position.y = 0.08;
        const pier = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.09, 0.24), pierMat);
        pier.position.set(0.46, 0.11, 0.28);
        pier.rotation.y = -Math.PI / 6;

        const hall = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.32, 0.40), wallMat);
        hall.position.set(-0.06, 0.32, -0.04);
        const roof = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.24, 4), roofMat);
        roof.rotation.y = Math.PI / 4;
        roof.position.set(-0.06, 0.59, -0.04);

        const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.58, 8), stoneMat);
        tower.position.set(0.24, 0.42, -0.18);
        const lantern = new THREE.Mesh(
            new THREE.SphereGeometry(0.10, 8, 8),
            new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xd97706, emissiveIntensity: 0.35 })
        );
        lantern.position.set(0.24, 0.76, -0.18);
        const towerCap = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.18, 8), goldMat);
        towerCap.position.set(0.24, 0.90, -0.18);

        group.add(quay, pier, hall, roof, tower, lantern, towerCap);
        group.scale.setScalar(0.78 * MODEL_SCALE_4X);
        wrapper.add(group);
        wrapper.userData = { lantern };
        return wrapper;
    }

    static createNPCharacterModel(roleColor = "#d4a84f", isStoryteller = false) {
        const group = new THREE.Group();
        const robeMat = new THREE.MeshStandardMaterial({ color: roleColor, roughness: 0.50 });
        const skinMat = new THREE.MeshStandardMaterial({ color: 0xf3d7a8, roughness: 0.58 });
        const hatMat = new THREE.MeshStandardMaterial({ color: 0xd9a74a, roughness: 0.45, metalness: 0.22 });

        const pedestal = new THREE.Mesh(
            new THREE.CylinderGeometry(0.28, 0.34, 0.10, 8),
            new THREE.MeshStandardMaterial({ color: 0xd9a74a, metalness: 0.35, roughness: 0.40 })
        );
        pedestal.position.y = 0.05;
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.20, 0.44, 8), robeMat);
        body.position.y = 0.30;
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), skinMat);
        head.position.y = 0.60;
        const nonLa = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.14, 10), hatMat);
        nonLa.position.y = 0.72;
        const gem = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.11, 0),
            new THREE.MeshStandardMaterial({ color: 0xfde68a, emissive: 0xd97706, emissiveIntensity: 0.35 })
        );
        gem.position.y = 0.96;

        group.add(pedestal, body, head, nonLa, gem);
        group.scale.setScalar(MODEL_SCALE_4X);
        group.userData = { gem };
        return group;
    }

    // ------------------------------------------------------------------------
    // 5. 4X SCALE RELIC MONUMENT MODELS (COMPACT FOOTPRINT, CLEAR SHIP BERTH)
    // ------------------------------------------------------------------------
    static createMonumentModel(modelType, tierLevel = 1) {
        const wrapper = new THREE.Group();
        const group = new THREE.Group();
        group.position.set(-0.40 * MODEL_SCALE_4X, 0, -0.36 * MODEL_SCALE_4X);

        const tierColors = { 1: 0x4ead7b, 2: 0xdba13a, 3: 0xd95f5f };
        const tierCol = tierColors[tierLevel] || 0xdba13a;

        const pedMat = new THREE.MeshStandardMaterial({ color: 0xede2cc, roughness: 0.58 });
        const glowMat = new THREE.MeshStandardMaterial({ color: tierCol, emissive: tierCol, emissiveIntensity: 0.28, roughness: 0.40 });
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xd9a74a, roughness: 0.38, metalness: 0.48 });

        const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.76, 0.18, 6), pedMat);
        pedestal.position.y = 0.09;
        const glowRing = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.75, 0.06, 6), glowMat);
        glowRing.position.y = 0.15;
        group.add(pedestal, glowRing);

        if (modelType === "karst_archipelago") {
            const karstMat = new THREE.MeshStandardMaterial({ color: 0x526375, roughness: 0.70 });
            const mossMat = new THREE.MeshStandardMaterial({ color: 0x4a7c59, roughness: 0.65 });
            [[-0.16, 0.56, -0.08, 0.28, 0.85], [0.20, 0.46, 0.06, 0.22, 0.65]].forEach(([x, y, z, r, h]) => {
                const k = new THREE.Mesh(new THREE.ConeGeometry(r, h, 6), karstMat);
                k.position.set(x, y, z);
                const cap = new THREE.Mesh(new THREE.ConeGeometry(r * 0.82, h * 0.40, 6), mossMat);
                cap.position.set(x, y + h * 0.24, z);
                group.add(k, cap);
            });
        } else if (modelType === "terraced_peak") {
            const colors = [0x4a7c59, 0x659b5e, 0x99a84c, 0xd4a84f];
            for (let i = 0; i < 4; i++) {
                const layer = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.56 - i * 0.10, 0.62 - i * 0.10, 0.14, 6),
                    new THREE.MeshStandardMaterial({ color: colors[i], roughness: 0.62 })
                );
                layer.position.y = 0.24 + i * 0.13;
                group.add(layer);
            }
        } else if (modelType === "khue_van_cac") {
            const redMat = new THREE.MeshStandardMaterial({ color: 0xb8433e, roughness: 0.52 });
            const roofMat = new THREE.MeshStandardMaterial({ color: 0x9c6727, roughness: 0.58 });
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.42, 0.48), redMat);
            body.position.y = 0.39;
            const roof = new THREE.Mesh(new THREE.ConeGeometry(0.52, 0.25, 4), roofMat);
            roof.rotation.y = Math.PI / 4;
            roof.position.y = 0.72;
            group.add(body, roof);
        } else if (modelType === "limestone_cavern") {
            const archMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.72 });
            const arch = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.18, 6, 10, Math.PI), archMat);
            arch.position.set(0, 0.20, 0);
            const river = new THREE.Mesh(
                new THREE.BoxGeometry(0.46, 0.05, 0.78),
                new THREE.MeshStandardMaterial({ color: 0x3898b8, roughness: 0.38 })
            );
            river.position.y = 0.20;
            group.add(arch, river);
        } else if (modelType === "imperial_citadel") {
            const wallMat = new THREE.MeshStandardMaterial({ color: 0x8f3939, roughness: 0.55 });
            const wall = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.32, 0.38), wallMat);
            wall.position.y = 0.34;
            const pavilion = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.24, 0.32), goldMat);
            pavilion.position.y = 0.60;
            const roof = new THREE.Mesh(new THREE.ConeGeometry(0.46, 0.22, 4), wallMat);
            roof.rotation.y = Math.PI / 4;
            roof.position.y = 0.84;
            group.add(wall, pavilion, roof);
        } else if (modelType === "cham_tower") {
            const brickMat = new THREE.MeshStandardMaterial({ color: 0xa84e2e, roughness: 0.62 });
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.50, 0.40), brickMat);
            body.position.y = 0.43;
            const spire = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.32, 4), goldMat);
            spire.rotation.y = Math.PI / 4;
            spire.position.y = 0.84;
            group.add(body, spire);
        } else if (modelType === "rong_house") {
            const thatchMat = new THREE.MeshStandardMaterial({ color: 0xb8762e, roughness: 0.62 });
            const woodMat = new THREE.MeshStandardMaterial({ color: 0x6e4726, roughness: 0.70 });
            const platform = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.12, 0.36), woodMat);
            platform.position.y = 0.28;
            const bladeGeo = new THREE.ConeGeometry(0.40, 0.86, 4);
            bladeGeo.scale(1.12, 1.0, 0.56);
            bladeGeo.rotateY(Math.PI / 4);
            const roof = new THREE.Mesh(bladeGeo, thatchMat);
            roof.position.y = 0.76;
            group.add(platform, roof);
        } else if (modelType === "dragon_wharf") {
            const buildingMat = new THREE.MeshStandardMaterial({ color: 0xd98a8a, roughness: 0.52 });
            const roofMat = new THREE.MeshStandardMaterial({ color: 0xa63a3a, roughness: 0.52 });
            const mainHall = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.40, 0.42), buildingMat);
            mainHall.position.y = 0.38;
            const roof = new THREE.Mesh(new THREE.ConeGeometry(0.52, 0.25, 4), roofMat);
            roof.rotation.y = Math.PI / 4;
            roof.position.y = 0.70;
            group.add(mainHall, roof);
        } else {
            const waterPad = new THREE.Mesh(
                new THREE.CylinderGeometry(0.58, 0.62, 0.07, 8),
                new THREE.MeshStandardMaterial({ color: 0x3587a4, roughness: 0.38 })
            );
            waterPad.position.y = 0.20;
            const boat = new THREE.Mesh(
                new THREE.BoxGeometry(0.42, 0.12, 0.22),
                new THREE.MeshStandardMaterial({ color: 0x7c4d25, roughness: 0.65 })
            );
            boat.position.set(0, 0.29, 0);
            group.add(waterPad, boat);
        }

        const relicCrown = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), goldMat);
        relicCrown.position.y = 1.24;
        group.add(relicCrown);

        group.scale.setScalar(0.75 * MODEL_SCALE_4X);
        wrapper.add(group);
        wrapper.userData = { relicCrown, glowRing };
        return wrapper;
    }

    // ------------------------------------------------------------------------
    // 6. LIGHTWEIGHT DISTANT HORIZON SCENERY (4X SCALE)
    // ------------------------------------------------------------------------
    static createDistantKarstOutcrop(scale = 1.0) {
        const group = new THREE.Group();
        const rockMat = new THREE.MeshStandardMaterial({ color: 0x3b4c5e, roughness: 0.85 });
        const foliageMat = new THREE.MeshStandardMaterial({ color: 0x3b6948, roughness: 0.75 });

        const spire = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.5, 5), rockMat);
        spire.position.set(0, 1.25, 0);
        const moss = new THREE.Mesh(new THREE.ConeGeometry(0.88, 1.1, 5), foliageMat);
        moss.position.set(0, 1.85, 0);
        group.add(spire, moss);

        group.scale.setScalar(scale * MODEL_SCALE_4X);
        return group;
    }

    static createSovereigntyArchipelago(titleText, subText) {
        const group = new THREE.Group();
        const inner = new THREE.Group();
        const sandMat = new THREE.MeshStandardMaterial({ color: 0xdcc394, roughness: 0.75 });
        const greenMat = new THREE.MeshStandardMaterial({ color: 0x4a7c59, roughness: 0.68 });
        const stoneMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.55 });
        const redMat = new THREE.MeshStandardMaterial({ color: 0xc4453c, roughness: 0.48 });
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xd9a74a, metalness: 0.40, roughness: 0.38 });

        const sand = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.10, 0.16, 8), sandMat);
        sand.position.set(0, 0.08, 0);
        const veg = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.80, 0.16, 8), greenMat);
        veg.position.set(0, 0.18, 0);
        inner.add(sand, veg);

        const obeliskBody = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 0.92, 4), stoneMat);
        obeliskBody.rotation.y = Math.PI / 4;
        obeliskBody.position.set(-0.12, 0.70, 0);
        const obeliskCap = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.26, 4), redMat);
        obeliskCap.rotation.y = Math.PI / 4;
        obeliskCap.position.set(-0.12, 1.28, 0);

        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.68, 5), goldMat);
        pole.position.set(0.28, 0.58, 0.16);
        const flag = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.24, 0.03), redMat);
        flag.position.set(0.46, 0.80, 0.16);

        inner.add(obeliskBody, obeliskCap, pole, flag);
        inner.scale.setScalar(0.82 * MODEL_SCALE_4X);
        group.add(inner);

        const banner = this.createRegionBannerSprite(titleText, subText, "#8c5e2a", 2.40, 0.62);
        banner.position.set(0, 1.85 * MODEL_SCALE_4X, 0);
        group.add(banner);
        return group;
    }

    static createTabletopCompassAndTitlePlaque() {
        const group = new THREE.Group();
        const brassMat = new THREE.MeshStandardMaterial({ color: 0xb89648, metalness: 0.45, roughness: 0.40 });
        const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x3b2614, roughness: 0.75 });
        const dialMat = new THREE.MeshStandardMaterial({ color: 0xe6dac3, roughness: 0.60 });

        const compassGroup = new THREE.Group();
        const outerRim = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.15, 0.24, 18), darkWoodMat);
        outerRim.position.y = 0.12;
        const brassRing = new THREE.Mesh(new THREE.CylinderGeometry(1.80, 1.88, 0.28, 18), brassMat);
        brassRing.position.y = 0.14;
        const dialFace = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.65, 0.32, 18), dialMat);
        dialFace.position.y = 0.16;

        const needleNS = new THREE.Mesh(new THREE.ConeGeometry(0.24, 2.7, 4), new THREE.MeshStandardMaterial({ color: 0xa63a3a, roughness: 0.48 }));
        needleNS.rotation.x = Math.PI / 2;
        needleNS.position.y = 0.34;
        const needleEW = new THREE.Mesh(new THREE.ConeGeometry(0.20, 2.4, 4), brassMat);
        needleEW.rotation.z = Math.PI / 2;
        needleEW.position.y = 0.32;

        compassGroup.add(outerRim, brassRing, dialFace, needleNS, needleEW);
        compassGroup.scale.setScalar(MODEL_SCALE_4X);
        compassGroup.position.set(-24.0 * MODEL_SCALE_4X, 0.45 * MODEL_SCALE_4X, -3.5 * MODEL_SCALE_4X);
        group.add(compassGroup);

        return group;
    }

    static createStartingAnchorBuoy() {
        const group = new THREE.Group();
        const ringMat = new THREE.MeshStandardMaterial({
            color: 0x5ea8c8,
            roughness: 0.48,
            transparent: true,
            opacity: 0.42
        });
        const ringGeo = new THREE.RingGeometry(0.85 * MODEL_SCALE_4X, 1.02 * MODEL_SCALE_4X, 6);
        ringGeo.rotateX(-Math.PI / 2);
        ringGeo.rotateZ(Math.PI / 6);
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.y = 0.05 * MODEL_SCALE_4X;
        group.add(ring);
        return group;
    }
}

window.ProceduralModels = ProceduralModels;
