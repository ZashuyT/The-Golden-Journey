// ============================================================================
// THE GOLDEN JOURNEY (HÀNH TRÌNH VÀNG SON) — V5.0 LIVING 3D DIORAMA & MODEL ENGINE
// - Ultra-Detailed 3-Mast Royal Clipper/Junk Ships with Dragon Prow, Stern Pagoda
//   Gallery, Glowing Lanterns, Rigging Shrouds, Ship Wheel & Billowing Sails
// - 18+ Distinct, Animated 3D Land Hex Dioramas across 6 Economic Regions &
//   Truong Son Frontier (Waterwheels, Windmills, Village Communal Halls, Hoi An
//   Townhouses, Central Highlands Campfires, Skyscrapers, Mekong Orchards, etc.)
// - Living Ocean Wildlife & Fleet (Jumping Dolphins, Fish Schools, Flapping
//   Seagulls, Traditional Vietnamese Sampans, Basket Boats, Lighthouses, Oil Rigs)
// ============================================================================

class ProceduralModels {
    // Deterministic pseudo-random helper from integer seed
    static seededRandom(seed) {
        const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
        return x - Math.floor(x);
    }

    // ------------------------------------------------------------------------
    // A. LOCATION PLAQUE (WARM ANTIQUE PARCHMENT & BRASS SCROLL)
    // Distinctly identifies Monuments, Trading Ports & Resource Nodes
    // ------------------------------------------------------------------------
    static createLabelCanvas(text, subtext, bgColor = "rgba(11, 19, 30, 0.92)", borderColor = "#fbbf24", scaleX = 3.9, scaleY = 1.24, categoryBadge = "ĐỊA ĐIỂM") {
        const canvas = document.createElement("canvas");
        canvas.width = 620;
        canvas.height = 196;
        const ctx = canvas.getContext("2d");

        const x = 16, y = 26, w = 588, h = 152, ch = 18;

        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
        ctx.beginPath();
        ctx.moveTo(x + ch, y + 6);
        ctx.lineTo(x + w - ch, y + 6);
        ctx.lineTo(x + w, y + ch + 6);
        ctx.lineTo(x + w, y + h - ch + 6);
        ctx.lineTo(x + w - ch, y + h + 6);
        ctx.lineTo(x + ch, y + h + 6);
        ctx.lineTo(x, y + h - ch + 6);
        ctx.lineTo(x, y + ch + 6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        const drawChamferRect = (rx, ry, rw, rh, c) => {
            ctx.beginPath();
            ctx.moveTo(rx + c, ry);
            ctx.lineTo(rx + rw - c, ry);
            ctx.lineTo(rx + rw, ry + c);
            ctx.lineTo(rx + rw, ry + rh - c);
            ctx.lineTo(rx + rw - c, ry + rh);
            ctx.lineTo(rx + c, ry + rh);
            ctx.lineTo(rx, ry + rh - c);
            ctx.lineTo(rx, ry + c);
            ctx.closePath();
        };

        drawChamferRect(x, y, w, h, ch);
        const grad = ctx.createLinearGradient(0, y, 0, y + h);
        grad.addColorStop(0, "#fbf3df");
        grad.addColorStop(0.5, "#f2e2be");
        grad.addColorStop(1, "#e2c997");
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.lineWidth = 7;
        ctx.strokeStyle = "#5c3a18";
        ctx.stroke();

        drawChamferRect(x + 7, y + 7, w - 14, h - 14, ch - 4);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#b4822c";
        ctx.stroke();

        const rivets = [
            [x + 18, y + 18],
            [x + w - 18, y + 18],
            [x + 18, y + h - 18],
            [x + w - 18, y + h - 18]
        ];
        rivets.forEach(([rx, ry]) => {
            ctx.beginPath();
            ctx.arc(rx, ry, 4.5, 0, Math.PI * 2);
            ctx.fillStyle = "#854d0e";
            ctx.fill();
        });

        let catLabel = categoryBadge;
        if (text.includes("🏛️")) catLabel = "🏛️ DI TÍCH LỊCH SỬ - ĐỊA LÝ";
        else if (text.includes("⚓")) catLabel = "⚓ THƯƠNG CẢNG HÀNG HẢI";
        else if (text.includes("🌾") || text.includes("🌲") || text.includes("⛏️")) catLabel = "⛏️ ĐIỂM KHAI THÁC NGUYÊN LIỆU";
        else if (text.includes("🧙‍♂️")) catLabel = "✨ SỰ KIỆN HIẾM TRÊN BIỂN";

        const pillW = 310, pillH = 30, pillX = (620 - pillW) / 2, pillY = 10;
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, 8);
        ctx.fillStyle = "#291809";
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = borderColor || "#d97706";
        ctx.stroke();

        ctx.fillStyle = "#fde68a";
        ctx.font = "bold 17px 'Segoe UI', Roboto, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(catLabel, 310, pillY + pillH / 2 + 1);

        ctx.fillStyle = "#1c1006";
        ctx.font = "900 31px 'Segoe UI', Roboto, sans-serif";
        ctx.fillText(text, 310, subtext ? 84 : 104);

        if (subtext) {
            ctx.beginPath();
            ctx.roundRect(x + 24, 114, w - 48, 46, 8);
            ctx.fillStyle = "rgba(44, 24, 10, 0.90)";
            ctx.fill();

            ctx.fillStyle = "#fef08a";
            ctx.font = "bold 23px 'Segoe UI', Roboto, sans-serif";
            ctx.fillText(subtext, 310, 137);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(scaleX, scaleY, 1);
        sprite.renderOrder = 995;
        return sprite;
    }

    // ------------------------------------------------------------------------
    // B. PLAYER SHIP NAMEPLATE (DARK NEON-CRESTED CAPTAIN PILL + POINTER STEM)
    // ------------------------------------------------------------------------
    static createPlayerShipNameplate(playerName, vesselTitle, shipColorHex = "#38bdf8") {
        const canvas = document.createElement("canvas");
        canvas.width = 560;
        canvas.height = 190;
        const ctx = canvas.getContext("2d");

        const pillX = 24, pillY = 16, pillW = 512, pillH = 124, radius = 62;

        ctx.beginPath();
        ctx.moveTo(280 - 22, pillY + pillH - 2);
        ctx.lineTo(280 + 22, pillY + pillH - 2);
        ctx.lineTo(280, pillY + pillH + 34);
        ctx.closePath();
        ctx.fillStyle = shipColorHex;
        ctx.fill();

        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, radius);
        const bgGrad = ctx.createLinearGradient(pillX, pillY, pillX, pillY + pillH);
        bgGrad.addColorStop(0, "rgba(7, 14, 28, 0.97)");
        bgGrad.addColorStop(1, "rgba(15, 23, 42, 0.97)");
        ctx.fillStyle = bgGrad;
        ctx.fill();
        ctx.lineWidth = 7;
        ctx.strokeStyle = shipColorHex;
        ctx.stroke();

        const cx = pillX + 64, cy = pillY + pillH / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 44, 0, Math.PI * 2);
        ctx.fillStyle = shipColorHex;
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();

        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 40px 'Segoe UI Emoji', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("⛵", cx, cy + 2);

        const textX = pillX + 126;
        ctx.textAlign = "left";
        ctx.fillStyle = shipColorHex;
        ctx.font = "900 18px 'Segoe UI', Roboto, sans-serif";
        ctx.fillText("👑 HẢI ĐỘI NGƯỜI CHƠI", textX, pillY + 34);

        ctx.fillStyle = "#ffffff";
        ctx.font = "900 34px 'Segoe UI', Roboto, sans-serif";
        const cleanName = String(playerName || "Thuyền Trưởng").slice(0, 18);
        ctx.fillText(cleanName, textX, pillY + 72);

        ctx.fillStyle = "#cbd5e1";
        ctx.font = "bold 20px 'Segoe UI', Roboto, sans-serif";
        const cleanVessel = String(vesselTitle || "").slice(0, 28);
        ctx.fillText(cleanVessel, textX, pillY + 103);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(3.45, 1.16, 1);
        sprite.renderOrder = 1010;
        return sprite;
    }

    // ------------------------------------------------------------------------
    // C. REGION BANNER PLAQUE (1..6 REGIONS + HOÀNG SA & TRƯỜNG SA)
    // ------------------------------------------------------------------------
    static createRegionBannerSprite(line1, line2 = "", borderHex = "#b4822c", scaleX = 5.0, scaleY = 1.4) {
        const canvas = document.createElement("canvas");
        canvas.width = 640;
        canvas.height = 180;
        const ctx = canvas.getContext("2d");

        const x = 18, y = 20, w = 604, h = 140, c = 22;
        ctx.beginPath();
        ctx.moveTo(x + c, y);
        ctx.lineTo(x + w - c, y);
        ctx.lineTo(x + w, y + c);
        ctx.lineTo(x + w, y + h - c);
        ctx.lineTo(x + w - c, y + h);
        ctx.lineTo(x + c, y + h);
        ctx.lineTo(x, y + h - c);
        ctx.lineTo(x, y + c);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, y, 0, y + h);
        grad.addColorStop(0, "rgba(247, 234, 201, 0.95)");
        grad.addColorStop(1, "rgba(222, 198, 148, 0.95)");
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.lineWidth = 6;
        ctx.strokeStyle = "#5c3a18";
        ctx.stroke();

        ctx.lineWidth = 2.5;
        ctx.strokeStyle = borderHex;
        ctx.strokeRect(x + 10, y + 10, w - 20, h - 20);

        ctx.fillStyle = "#2b1706";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if (line2) {
            ctx.font = "900 28px 'Segoe UI', Roboto, sans-serif";
            ctx.fillText(line1, 320, 68);
            ctx.fillStyle = "#5c2d0c";
            ctx.font = "bold 24px 'Segoe UI', Roboto, sans-serif";
            ctx.fillText(line2, 320, 112);
        } else {
            ctx.font = "900 31px 'Segoe UI', Roboto, sans-serif";
            ctx.fillText(line1, 320, 90);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(scaleX, scaleY, 1);
        sprite.renderOrder = 980;
        return sprite;
    }

    // ------------------------------------------------------------------------
    // 1. ULTRA-DETAILED 3-MAST ROYAL VIETNAMESE CLIPPER / JUNK SHIP
    //    Includes Carved Dragon Prow, 2-Tier Stern Pagoda Cabin, Lanterns,
    //    3 Masts with Crow's Nests, Rigging Lines, Battened Sails & Ship Wheel
    // ------------------------------------------------------------------------
    static createPlayerShip(archetypeId, playerName = "") {
        const arch = window.GAME_DATA.shipArchetypes[archetypeId % 5];
        const group = new THREE.Group();

        const hullColor = new THREE.Color(arch.color);
        const sailColor = new THREE.Color(arch.sailColor);
        const trimColor = new THREE.Color(arch.trimColor);

        const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x3e1f0d, roughness: 0.52, metalness: 0.18 });
        const deckWoodMat = new THREE.MeshStandardMaterial({ color: 0x7c471e, roughness: 0.62, metalness: 0.1 });
        const hullMat = new THREE.MeshStandardMaterial({
            color: hullColor,
            emissive: hullColor,
            emissiveIntensity: 0.25,
            roughness: 0.30,
            metalness: 0.25
        });
        const trimMat = new THREE.MeshStandardMaterial({
            color: trimColor,
            emissive: trimColor,
            emissiveIntensity: 0.35,
            roughness: 0.22,
            metalness: 0.80
        });
        const sailMat = new THREE.MeshStandardMaterial({
            color: sailColor,
            emissive: hullColor,
            emissiveIntensity: 0.28,
            roughness: 0.36,
            side: THREE.DoubleSide
        });
        const lanternMat = new THREE.MeshStandardMaterial({
            color: 0xfef08a,
            emissive: 0xf59e0b,
            emissiveIntensity: 0.95
        });

        // 1. Multi-ribbed Curved Hull + Lower Keel + Wale Strakes
        const lowerHullGeo = new THREE.CylinderGeometry(0.58, 0.30, 1.92, 14);
        lowerHullGeo.rotateZ(Math.PI / 2);
        lowerHullGeo.scale(1.22, 0.58, 0.82);
        const lowerHull = new THREE.Mesh(lowerHullGeo, darkWoodMat);
        lowerHull.position.y = 0.22;
        lowerHull.castShadow = true;
        group.add(lowerHull);

        const upperHullGeo = new THREE.CylinderGeometry(0.62, 0.48, 1.86, 14);
        upperHullGeo.rotateZ(Math.PI / 2);
        upperHullGeo.scale(1.20, 0.42, 0.84);
        const upperHull = new THREE.Mesh(upperHullGeo, hullMat);
        upperHull.position.y = 0.38;
        upperHull.castShadow = true;
        group.add(upperHull);

        // Golden hull strake & gunwale rails
        const strake = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.06, 0.84), trimMat);
        strake.position.y = 0.46;
        group.add(strake);

        const mainDeck = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.08, 0.76), deckWoodMat);
        mainDeck.position.y = 0.50;
        group.add(mainDeck);

        // Side Cannon Ports & Ornamental Dragon Shields along Hull
        for (let i = -2; i <= 2; i++) {
            const shieldL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 10), trimMat);
            shieldL.rotation.x = Math.PI / 2;
            shieldL.position.set(i * 0.30, 0.44, 0.43);
            const shieldR = shieldL.clone();
            shieldR.position.z = -0.43;
            group.add(shieldL, shieldR);
        }

        // 2. Two-Story Imperial Stern Castle (Poop Deck + Pagoda Roof + Glowing Lanterns)
        const sternTier1 = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.32, 0.64), darkWoodMat);
        sternTier1.position.set(-0.56, 0.68, 0);
        sternTier1.castShadow = true;
        const sternTier2 = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.26, 0.50), hullMat);
        sternTier2.position.set(-0.62, 0.94, 0);

        const sternWindowStrip = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.11, 0.66), lanternMat);
        sternWindowStrip.position.set(-0.56, 0.72, 0);

        const pagodaRoof1 = new THREE.Mesh(new THREE.ConeGeometry(0.56, 0.22, 4), trimMat);
        pagodaRoof1.rotation.y = Math.PI / 4;
        pagodaRoof1.position.set(-0.56, 0.88, 0);

        const pagodaRoof2 = new THREE.Mesh(new THREE.ConeGeometry(0.46, 0.24, 4), trimMat);
        pagodaRoof2.rotation.y = Math.PI / 4;
        pagodaRoof2.position.set(-0.62, 1.16, 0);
        group.add(sternTier1, sternTier2, sternWindowStrip, pagodaRoof1, pagodaRoof2);

        // Twin Hanging Stern Lanterns
        const lanternL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), lanternMat);
        lanternL.position.set(-0.92, 0.82, 0.24);
        const lanternR = lanternL.clone();
        lanternR.position.z = -0.24;
        group.add(lanternL, lanternR);

        // Ship's Wheel & Cargo Barrels on Deck
        const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.02, 6, 12), trimMat);
        wheel.rotation.y = Math.PI / 2;
        wheel.position.set(-0.20, 0.66, 0);
        group.add(wheel);

        // 3. Raised Forecastle & Sculpted Dragon Figurehead + Bowsprit
        const foreDeck = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.22, 0.54), darkWoodMat);
        foreDeck.position.set(0.66, 0.58, 0);
        group.add(foreDeck);

        const bowsprit = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.05, 0.85, 8), darkWoodMat);
        bowsprit.rotation.z = -Math.PI / 3;
        bowsprit.position.set(1.12, 0.72, 0);
        group.add(bowsprit);

        // Sculpted Dragon Neck, Head & Horns
        const dragonNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 0.45, 8), trimMat);
        dragonNeck.rotation.z = -Math.PI / 4;
        dragonNeck.position.set(0.96, 0.68, 0);
        const dragonHead = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.34, 6), trimMat);
        dragonHead.rotation.z = -Math.PI / 2.2;
        dragonHead.position.set(1.16, 0.84, 0);
        const dragonPearl = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), lanternMat);
        dragonPearl.position.set(1.30, 0.86, 0);
        group.add(dragonNeck, dragonHead, dragonPearl);

        // 4. Three Masts (Main, Fore, Mizzen) + Crow's Nests + Rigging Lines
        const mainMast = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.062, 2.05, 10), darkWoodMat);
        mainMast.position.set(0.05, 1.35, 0);
        const foreMast = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.050, 1.58, 10), darkWoodMat);
        foreMast.position.set(0.58, 1.12, 0);
        const mizzenMast = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.042, 1.32, 8), darkWoodMat);
        mizzenMast.position.set(-0.52, 1.18, 0);
        group.add(mainMast, foreMast, mizzenMast);

        // Crow's Nest on Main Mast
        const crowsNest = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.10, 0.14, 10), trimMat);
        crowsNest.position.set(0.05, 2.05, 0);
        group.add(crowsNest);

        // Billowing Junk/Clipper Sails with Bamboo Battens
        const buildBattenedSail = (radius, height, xPos, yPos, battenCount) => {
            const sGroup = new THREE.Group();
            const sGeo = new THREE.CylinderGeometry(radius, radius * 1.04, height, 16, 1, true, -Math.PI * 0.35, Math.PI * 0.70);
            const sMesh = new THREE.Mesh(sGeo, sailMat);
            sMesh.rotation.y = Math.PI / 2;
            sMesh.position.x = -radius * 0.55;
            sMesh.castShadow = true;
            sGroup.add(sMesh);

            for (let b = 0; b < battenCount; b++) {
                const by = (b / (battenCount - 1) - 0.5) * (height * 0.82);
                const battenGeo = new THREE.CylinderGeometry(0.018, 0.018, radius * 1.28, 6);
                battenGeo.rotateX(Math.PI / 2);
                const batten = new THREE.Mesh(battenGeo, trimMat);
                batten.position.set(radius * 0.34, by, 0);
                sGroup.add(batten);
            }
            sGroup.position.set(xPos, yPos, 0);
            return sGroup;
        };

        const mainSail = buildBattenedSail(0.68, 1.24, 0.05, 1.36, 4);
        const foreSail = buildBattenedSail(0.48, 0.90, 0.58, 1.16, 3);
        const mizzenSail = buildBattenedSail(0.38, 0.70, -0.52, 1.32, 3);
        group.add(mainSail, foreSail, mizzenSail);

        // Fluttering Pennant Flag & Glowing Masthead Beacon
        const flagGeo = new THREE.ConeGeometry(0.20, 0.62, 4);
        flagGeo.rotateZ(Math.PI / 2);
        const flag = new THREE.Mesh(flagGeo, hullMat);
        flag.position.set(-0.22, 2.34, 0);
        group.add(flag);

        const beaconOrb = new THREE.Mesh(
            new THREE.SphereGeometry(0.11, 10, 10),
            new THREE.MeshBasicMaterial({ color: hullColor })
        );
        beaconOrb.position.set(0.05, 2.40, 0);
        group.add(beaconOrb);

        // 5. High-Visibility Water Surface Identification Halo Ring + Bow Foam
        const outerRingGeo = new THREE.RingGeometry(0.98, 1.22, 32);
        outerRingGeo.rotateX(-Math.PI / 2);
        const ring = new THREE.Mesh(
            outerRingGeo,
            new THREE.MeshBasicMaterial({ color: hullColor, side: THREE.DoubleSide, transparent: true, opacity: 0.92 })
        );
        ring.position.y = 0.08;
        group.add(ring);

        const innerDiscGeo = new THREE.CircleGeometry(0.95, 24);
        innerDiscGeo.rotateX(-Math.PI / 2);
        const innerDisc = new THREE.Mesh(
            innerDiscGeo,
            new THREE.MeshBasicMaterial({ color: hullColor, transparent: true, opacity: 0.25, side: THREE.DoubleSide })
        );
        innerDisc.position.y = 0.06;
        group.add(innerDisc);

        // 6. Floating Player Ship Nameplate
        const nameSprite = this.createPlayerShipNameplate(playerName || arch.name, arch.vesselTitle, arch.color);
        nameSprite.position.set(0, 3.22, 0);
        group.add(nameSprite);

        group.scale.setScalar(1.36);
        group.userData = { mainSail, foreSail, mizzenSail, flag, ring, lanternL, lanternR, nameSprite, archetype: arch };
        return group;
    }

    // ------------------------------------------------------------------------
    // 2. UNIQUE, DIVERSE & ANIMATED 3D LAND HEX DIORAMAS (18+ ARCHETYPES!)
    //    Every land tile on the map gets a rich, living 3D miniature world
    //    based on its Region + deterministic coordinate seed!
    // ------------------------------------------------------------------------
    static createLandHexDiorama(spec, surfaceY, animRegistry = null) {
        const group = new THREE.Group();
        group.position.y = surfaceY;

        const seed = Math.abs((spec.q * 73856093) ^ (spec.r * 19349663) ^ (spec.regionId * 83492791));
        const r1 = this.seededRandom(seed + 1);
        const r2 = this.seededRandom(seed + 2);
        const r3 = this.seededRandom(seed + 3);
        const variant = (Math.abs(spec.q * 3 + spec.r * 5)) % 3;

        const woodMat = new THREE.MeshStandardMaterial({ color: 0x6b3e1b, roughness: 0.68 });
        const stoneMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.72 });
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.65, roughness: 0.28 });
        const waterMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.35, roughness: 0.2 });
        const cloudMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.78, roughness: 0.9 });

        // Helper to build a lush multi-tiered tree
        const addTree = (x, z, scale = 1.0, style = "pine", leafColorHex = 0x15803d) => {
            const t = new THREE.Group();
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.36, 6), woodMat);
            trunk.position.y = 0.18;
            t.add(trunk);
            const leafMat = new THREE.MeshStandardMaterial({ color: leafColorHex, roughness: 0.55 });
            if (style === "palm") {
                trunk.scale.set(0.8, 1.35, 0.8);
                for (let f = 0; f < 5; f++) {
                    const frond = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.42, 4), leafMat);
                    frond.rotation.z = 1.1;
                    frond.rotation.y = (f / 5) * Math.PI * 2;
                    frond.position.y = 0.45;
                    t.add(frond);
                }
            } else if (style === "banyan") {
                const crown1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.36, 1), leafMat);
                crown1.scale.set(1.3, 0.75, 1.2);
                crown1.position.y = 0.45;
                t.add(crown1);
            } else {
                const c1 = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.44, 7), leafMat);
                c1.position.y = 0.40;
                const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.21, 0.36, 7), leafMat);
                c2.position.y = 0.64;
                t.add(c1, c2);
            }
            t.position.set(x, 0, z);
            t.scale.setScalar(scale);
            t.castShadow = true;
            group.add(t);
            return t;
        };

        // Helper to build a traditional Vietnamese house or stilt house
        const addHouse = (x, z, w, h, d, wallCol, roofCol, onStilts = false, rotY = 0) => {
            const hGroup = new THREE.Group();
            let baseY = 0;
            if (onStilts) {
                baseY = 0.18;
                [[-w * 0.4, -d * 0.4], [w * 0.4, -d * 0.4], [-w * 0.4, d * 0.4], [w * 0.4, d * 0.4]].forEach(([sx, sz]) => {
                    const stilt = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.20, 5), woodMat);
                    stilt.position.set(sx, 0.10, sz);
                    hGroup.add(stilt);
                });
            }
            const body = new THREE.Mesh(
                new THREE.BoxGeometry(w, h, d),
                new THREE.MeshStandardMaterial({ color: wallCol, roughness: 0.55 })
            );
            body.position.y = baseY + h / 2;
            body.castShadow = true;
            const roof = new THREE.Mesh(
                new THREE.ConeGeometry(Math.max(w, d) * 0.82, h * 0.78, 4),
                new THREE.MeshStandardMaterial({ color: roofCol, roughness: 0.45 })
            );
            roof.rotation.y = Math.PI / 4;
            roof.position.y = baseY + h + h * 0.34;
            hGroup.add(body, roof);
            hGroup.position.set(x, 0, z);
            hGroup.rotation.y = rotY;
            group.add(hGroup);
            return hGroup;
        };

        // Western Borderland / Indochina Truong Son Range (Varied Mountains, Waterfalls, Valleys & Forests)
        if (spec.terrain === "parchment_land") {
            if (variant === 0) {
                // Misty Truong Son Peak + Drifting Cloud Puff + Pine Forest
                const p1 = new THREE.Mesh(
                    new THREE.ConeGeometry(0.95, 1.75 + r1 * 0.65, 7),
                    new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.8 })
                );
                p1.position.set(-0.22, 0.85, -0.15);
                p1.castShadow = true;
                const cap = new THREE.Mesh(
                    new THREE.ConeGeometry(0.76, 0.95, 7),
                    new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.65 })
                );
                cap.position.set(-0.22, 1.25, -0.15);
                group.add(p1, cap);
                addTree(0.55, 0.32, 0.9 + r2 * 0.3, "pine", 0x14532d);
                addTree(0.28, -0.52, 0.85, "pine", 0x15803d);

                const cloud = new THREE.Mesh(new THREE.DodecahedronGeometry(0.34, 1), cloudMat);
                cloud.scale.set(1.5, 0.55, 1.0);
                cloud.position.set(0.15, 1.55, 0.15);
                group.add(cloud);
                if (animRegistry) animRegistry.push({ type: "orbit_cloud", mesh: cloud, basePos: cloud.position.clone(), phase: r1 * 6.28 });
            } else if (variant === 1) {
                // Highland Waterfall Valley & Mountain Lake
                const cliff = new THREE.Mesh(
                    new THREE.DodecahedronGeometry(0.76, 1),
                    new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.78 })
                );
                cliff.scale.set(1.2, 1.15, 0.95);
                cliff.position.set(-0.32, 0.55, -0.25);
                const waterfall = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.82, 0.12), waterMat);
                waterfall.position.set(0.05, 0.45, 0.12);
                waterfall.rotation.z = -0.25;
                const pond = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.55, 0.06, 10), waterMat);
                pond.position.set(0.32, 0.04, 0.28);
                group.add(cliff, waterfall, pond);
                addTree(-0.55, 0.45, 1.05, "banyan", 0x15803d);
                addTree(0.62, -0.35, 0.92, "pine", 0x166534);
                if (animRegistry) animRegistry.push({ type: "shimmer_water", mesh: waterfall, phase: r2 * 6.28 });
            } else {
                // Frontier Stilt Outpost & Rolling Foothills
                const hill = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.75, 1.18, 0.48, 7),
                    new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.75 })
                );
                hill.position.y = 0.24;
                group.add(hill);
                addHouse(-0.18, 0.08, 0.42, 0.28, 0.36, 0x92400e, 0xd97706, true, r1 * 1.5);
                addTree(0.48, -0.28, 1.1, "banyan", 0x15803d);
                addTree(-0.52, -0.36, 0.88, "pine", 0x166534);
            }
            group.rotation.y = (seed % 6) * (Math.PI / 3);
            return group;
        }

        // ====================================================================
        // 6 VIETNAMESE ECONOMIC REGIONS — UNIQUE ANIMATED DIORAMAS PER HEX
        // ====================================================================
        if (spec.regionId === 0) {
            // 1. TRUNG DU & MIỀN NÚI BẮC BỘ
            if (variant === 0) {
                // A: Bản Làng Nhà Sàn Tây Bắc & Guồng Nước (Cọn Nước Quay Tự Động!)
                const stream = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.05, 0.34), waterMat);
                stream.position.set(0, 0.03, 0.18);
                stream.rotation.y = 0.35;
                group.add(stream);

                addHouse(-0.42, -0.32, 0.48, 0.32, 0.38, 0x78350f, 0xb45309, true, 0.3);
                addHouse(0.38, -0.38, 0.40, 0.28, 0.34, 0x92400e, 0xd97706, true, -0.4);

                // Animated Bamboo Waterwheel (Cọn Nước Tây Bắc)
                const wheelGroup = new THREE.Group();
                const rim = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.03, 8, 16), woodMat);
                wheelGroup.add(rim);
                for (let s = 0; s < 6; s++) {
                    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.70, 0.03, 0.03), woodMat);
                    spoke.rotation.z = (s / 6) * Math.PI;
                    const paddle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.16), goldMat);
                    const pa = (s / 6) * Math.PI * 2;
                    paddle.position.set(Math.cos(pa) * 0.36, Math.sin(pa) * 0.36, 0);
                    wheelGroup.add(spoke, paddle);
                }
                wheelGroup.position.set(0.18, 0.40, 0.20);
                group.add(wheelGroup);
                if (animRegistry) animRegistry.push({ type: "spin_z", mesh: wheelGroup, speed: 1.4 });

                addTree(-0.68, 0.35, 1.05, "pine", 0x15803d);
                addTree(0.68, 0.25, 0.95, "pine", 0x166534);

            } else if (variant === 1) {
                // B: Ruộng Bậc Thang Mù Cang Chải 5 Tầng + Chòi Canh Lúa + Mây Đỉnh Đèo
                const terraceCols = [0x15803d, 0x16a34a, 0x65a30d, 0xca8a04, 0xfacc15];
                for (let t = 0; t < 5; t++) {
                    const step = new THREE.Mesh(
                        new THREE.CylinderGeometry(1.18 - t * 0.19, 1.26 - t * 0.19, 0.18, 7),
                        new THREE.MeshStandardMaterial({ color: terraceCols[t], roughness: 0.55 })
                    );
                    step.position.set(-0.08 * t, 0.09 + t * 0.17, -0.05 * t);
                    step.castShadow = true;
                    group.add(step);
                }
                addHouse(0.45, 0.38, 0.34, 0.26, 0.34, 0x78350f, 0xeab308, true, 0.2);

                const mist = new THREE.Mesh(new THREE.DodecahedronGeometry(0.30, 1), cloudMat);
                mist.scale.set(1.6, 0.5, 1.1);
                mist.position.set(-0.25, 1.25, 0);
                group.add(mist);
                if (animRegistry) animRegistry.push({ type: "orbit_cloud", mesh: mist, basePos: mist.position.clone(), phase: r1 * 6.28 });

            } else {
                // C: Đồi Chè Trung Du & Xưởng Sao Chè Khói Bếp Bốc Lên
                for (let row = -1; row <= 1; row++) {
                    const teaRow = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.22, 0.28, 1.15, 8),
                        new THREE.MeshStandardMaterial({ color: row === 0 ? 0x22c55e : 0x16a34a, roughness: 0.6 })
                    );
                    teaRow.rotation.z = Math.PI / 2;
                    teaRow.position.set(-0.15, 0.16, row * 0.38);
                    group.add(teaRow);
                }
                addHouse(0.48, 0.0, 0.50, 0.36, 0.42, 0xfef3c7, 0xb91c1c, false, -0.3);
                const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.48, 6), stoneMat);
                chimney.position.set(0.62, 0.42, 0.12);
                const smokePuff = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), cloudMat);
                smokePuff.position.set(0.62, 0.78, 0.12);
                group.add(chimney, smokePuff);
                if (animRegistry) animRegistry.push({ type: "smoke_rise", mesh: smokePuff, baseY: 0.72, phase: r2 * 6.28 });
            }

        } else if (spec.regionId === 1) {
            // 2. ĐỒNG BẰNG SÔNG HỒNG
            if (variant === 0) {
                // A: Đình Làng Bắc Bộ (Mái Đao Cong + Cây Đa Cổ Thụ + Cổng Làng + Cờ Hội)
                addHouse(-0.12, -0.10, 0.76, 0.38, 0.54, 0xfef3c7, 0xdc2626, false, 0.15);
                addTree(0.56, -0.28, 1.25, "banyan", 0x15803d);

                // Village Gate (Tam Quan)
                const gate = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.38, 0.14), new THREE.MeshStandardMaterial({ color: 0xd97706 }));
                gate.position.set(-0.08, 0.19, 0.62);
                group.add(gate);

                // Festival Flagpole
                const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.85, 6), goldMat);
                pole.position.set(0.35, 0.42, 0.42);
                const flag = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.03), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
                flag.position.set(0.48, 0.74, 0.42);
                group.add(pole, flag);
                if (animRegistry) animRegistry.push({ type: "sway_flag", mesh: flag, phase: r1 * 6.28 });

            } else if (variant === 1) {
                // B: Cánh Đồng Lúa Chín Vàng + Cối Xay Gió Đồng Bằng Quay Đều + Cây Rơm
                const paddy = new THREE.Mesh(
                    new THREE.CylinderGeometry(1.18, 1.25, 0.12, 6),
                    new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.55 })
                );
                paddy.position.y = 0.06;
                group.add(paddy);

                const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, 0.78, 8), woodMat);
                tower.position.set(-0.22, 0.42, -0.12);
                group.add(tower);

                const bladesGroup = new THREE.Group();
                for (let b = 0; b < 4; b++) {
                    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.10, 0.02), new THREE.MeshStandardMaterial({ color: 0xfef3c7 }));
                    blade.rotation.z = (b / 4) * Math.PI;
                    bladesGroup.add(blade);
                }
                bladesGroup.position.set(-0.22, 0.72, 0.08);
                group.add(bladesGroup);
                if (animRegistry) animRegistry.push({ type: "spin_z", mesh: bladesGroup, speed: 1.8 });

                // Golden Haystacks (Cây rơm)
                [[0.48, 0.25], [0.35, -0.38]].forEach(([hx, hz]) => {
                    const stack = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.42, 8), goldMat);
                    stack.position.set(hx, 0.26, hz);
                    group.add(stack);
                });

            } else {
                // C: Tháp Chùa Cổ & Hồ Sen Hồng Bắc Bộ
                const pond = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.80, 0.08, 10), waterMat);
                pond.position.set(0.15, 0.04, 0.15);
                group.add(pond);

                // Multi-tier Pagoda Tower (Tháp Bút / Chùa Cổ)
                for (let lv = 0; lv < 4; lv++) {
                    const tier = new THREE.Mesh(
                        new THREE.BoxGeometry(0.42 - lv * 0.07, 0.24, 0.42 - lv * 0.07),
                        new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.45 })
                    );
                    tier.position.set(-0.35, 0.16 + lv * 0.24, -0.25);
                    group.add(tier);
                }
                addTree(0.55, -0.42, 1.0, "banyan", 0x16a34a);
            }

        } else if (spec.regionId === 2) {
            // 3. BẮC TRUNG BỘ & DUYÊN HẢI MIỀN TRUNG
            if (variant === 0) {
                // A: Phố Cổ Mái Ngói Âm Dương & Đèn Lồng Hội An Phát Sáng Đung Đưa
                addHouse(-0.38, -0.18, 0.48, 0.36, 0.42, 0xfacc15, 0x78350f, false, 0.1);
                addHouse(0.28, -0.22, 0.46, 0.42, 0.40, 0xfde047, 0x92400e, false, -0.15);
                addHouse(-0.05, 0.36, 0.52, 0.32, 0.36, 0xfef08a, 0xb45309, false, 0.0);

                const lantern = new THREE.Mesh(
                    new THREE.SphereGeometry(0.13, 10, 10),
                    new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xf97316, emissiveIntensity: 0.9 })
                );
                lantern.position.set(0, 0.72, 0.05);
                group.add(lantern);
                if (animRegistry) animRegistry.push({ type: "sway_flag", mesh: lantern, phase: r3 * 6.28 });

            } else if (variant === 1) {
                // B: Cánh Đồng Điện Gió Ven Biển Miền Trung & Ruộng Muối Trắng
                const saltPan = new THREE.Mesh(
                    new THREE.BoxGeometry(0.88, 0.08, 0.88),
                    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25, metalness: 0.2 })
                );
                saltPan.position.set(0.25, 0.04, 0.22);
                group.add(saltPan);

                const mast = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.05, 0.09, 1.35, 8),
                    new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.4, roughness: 0.3 })
                );
                mast.position.set(-0.32, 0.68, -0.18);
                group.add(mast);

                const rotorGroup = new THREE.Group();
                for (let b = 0; b < 3; b++) {
                    const blade = new THREE.Mesh(
                        new THREE.BoxGeometry(0.06, 0.62, 0.02),
                        new THREE.MeshStandardMaterial({ color: 0xffffff })
                    );
                    blade.position.y = 0.28;
                    const pivot = new THREE.Group();
                    pivot.rotation.z = (b / 3) * Math.PI * 2;
                    pivot.add(blade);
                    rotorGroup.add(pivot);
                }
                rotorGroup.position.set(-0.32, 1.32, -0.08);
                group.add(rotorGroup);
                if (animRegistry) animRegistry.push({ type: "spin_z", mesh: rotorGroup, speed: 2.4 });

            } else {
                // C: Đèo Hải Vân – Núi Đá Ven Biển & Vọng Cảnh Đài
                const peak = new THREE.Mesh(new THREE.ConeGeometry(0.78, 1.45, 7), stoneMat);
                peak.position.set(-0.28, 0.72, -0.20);
                peak.castShadow = true;
                group.add(peak);
                addHouse(0.38, 0.24, 0.38, 0.42, 0.38, 0x991b1b, 0xd97706, false, 0.4);
                addTree(0.45, -0.35, 1.0, "palm", 0x16a34a);
            }

        } else if (spec.regionId === 3) {
            // 4. TÂY NGUYÊN (CAO NGUYÊN ĐẤT ĐỎ BAZAN)
            if (variant === 0) {
                // A: Buôn Làng Nhà Dài & Lửa Trại Lễ Hội Cồng Chiêng Bậpùng
                addHouse(-0.42, -0.22, 0.78, 0.32, 0.34, 0x78350f, 0xd97706, true, 0.35);
                addHouse(0.42, -0.18, 0.68, 0.30, 0.32, 0x92400e, 0xb45309, true, -0.35);

                // Central Campfire & Ceremonial Totem Pole (Cây Nêu)
                const totem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.15, 6), goldMat);
                totem.position.set(0, 0.58, 0.15);
                const flame = new THREE.Mesh(
                    new THREE.OctahedronGeometry(0.20, 0),
                    new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xef4444, emissiveIntensity: 0.95 })
                );
                flame.position.set(0, 0.24, 0.42);
                group.add(totem, flame);
                if (animRegistry) animRegistry.push({ type: "flicker_fire", mesh: flame, phase: r1 * 6.28 });

                addTree(-0.55, 0.45, 1.05, "pine", 0x14532d);
                addTree(0.55, 0.45, 0.95, "pine", 0x15803d);

            } else if (variant === 1) {
                // B: Nông Trường Cà Phê – Hồ Tiêu Đất Đỏ & Trạm Sấy Quay Tự Động
                for (let cx = -1; cx <= 1; cx++) {
                    for (let cz = -1; cz <= 0; cz++) {
                        addTree(cx * 0.46, cz * 0.42 - 0.15, 0.75, "banyan", 0x15803d);
                    }
                }
                const dryingYard = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.48, 0.06, 12), goldMat);
                dryingYard.position.set(0.15, 0.04, 0.42);
                const rakeArm = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.05, 0.06), woodMat);
                rakeArm.position.set(0.15, 0.10, 0.42);
                group.add(dryingYard, rakeArm);
                if (animRegistry) animRegistry.push({ type: "spin_y", mesh: rakeArm, speed: 1.5 });

            } else {
                // C: Thác Đray Nur Hùng Vĩ & Rừng Thông Đà Lạt
                const basaltCliff = new THREE.Mesh(
                    new THREE.BoxGeometry(1.15, 0.85, 0.65),
                    new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.75 })
                );
                basaltCliff.position.set(0, 0.42, -0.25);
                const cascade = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.82, 0.16), waterMat);
                cascade.position.set(0, 0.42, 0.12);
                group.add(basaltCliff, cascade);
                addTree(-0.58, 0.35, 1.15, "pine", 0x14532d);
                addTree(0.58, 0.35, 1.10, "pine", 0x166534);
                if (animRegistry) animRegistry.push({ type: "shimmer_water", mesh: cascade, phase: r2 * 6.28 });
            }

        } else if (spec.regionId === 4) {
            // 5. ĐÔNG NAM BỘ (ĐÔ THỊ HIỆN ĐẠI & TRUNG TÂM CÔNG NGHIỆP)
            if (variant === 0) {
                // A: Cụm Cao Ốc Đô Thị Hiện Đại & Đèn Cảnh Báo Sân Đỗ Trực Thăng Xoay
                const glassMat = new THREE.MeshStandardMaterial({
                    color: 0x38bdf8,
                    emissive: 0x0284c7,
                    emissiveIntensity: 0.32,
                    metalness: 0.78,
                    roughness: 0.18
                });
                const t1 = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 1.55, 8), glassMat);
                t1.position.set(-0.22, 0.78, -0.12);
                t1.castShadow = true;
                const t2 = new THREE.Mesh(new THREE.BoxGeometry(0.44, 1.12, 0.44), glassMat);
                t2.position.set(0.36, 0.56, 0.18);
                t2.castShadow = true;
                const t3 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.78, 0.38), stoneMat);
                t3.position.set(-0.38, 0.39, 0.42);

                const radarBeam = new THREE.Mesh(
                    new THREE.BoxGeometry(0.52, 0.05, 0.08),
                    new THREE.MeshBasicMaterial({ color: 0xfef08a })
                );
                radarBeam.position.set(-0.22, 1.60, -0.12);
                group.add(t1, t2, t3, radarBeam);
                if (animRegistry) animRegistry.push({ type: "spin_y", mesh: radarBeam, speed: 2.8 });

            } else if (variant === 1) {
                // B: Tổ Hợp Nhà Máy Công Nghiệp + Cần Cẩu Xoay + Khói Công Nghiệp
                const factory = new THREE.Mesh(
                    new THREE.BoxGeometry(0.92, 0.48, 0.68),
                    new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.5 })
                );
                factory.position.set(-0.18, 0.24, -0.10);
                const roof = new THREE.Mesh(
                    new THREE.BoxGeometry(0.96, 0.10, 0.72),
                    new THREE.MeshStandardMaterial({ color: 0x0284c7 })
                );
                roof.position.set(-0.18, 0.52, -0.10);
                group.add(factory, roof);

                // Rotating Industrial Crane
                const craneMast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.15, 6), goldMat);
                craneMast.position.set(0.48, 0.58, 0.28);
                const craneBoom = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.06, 0.06), goldMat);
                craneBoom.position.set(0.48, 1.12, 0.28);
                group.add(craneMast, craneBoom);
                if (animRegistry) animRegistry.push({ type: "spin_y", mesh: craneBoom, speed: 0.9 });

            } else {
                // C: Nông Trường Cao Su Bạt Ngàn & Nhà Chế Biến Mủ Cao Su
                [[-0.52, -0.38], [0, -0.38], [0.52, -0.38], [-0.52, 0.12], [0.52, 0.12]].forEach(([tx, tz]) => {
                    addTree(tx, tz, 0.95, "pine", 0x16a34a);
                });
                addHouse(0, 0.35, 0.54, 0.32, 0.38, 0xfef3c7, 0xdc2626, false, 0);
            }

        } else {
            // 6. ĐỒNG BẰNG SÔNG CỬU LONG (MIỀN TÂY SÔNG NƯỚC & MIỆT VƯỜN)
            if (variant === 0) {
                // A: Miệt Vườn Dừa Bến Tre + Kênh Rạch + Cầu Khỉ + Ghe Xuồng Nhấp Nhô
                const canal = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.05, 0.42), waterMat);
                canal.position.set(0, 0.03, 0);
                group.add(canal);

                const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.56), woodMat);
                bridge.position.set(-0.15, 0.18, 0);
                group.add(bridge);

                const sampan = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.10, 0.20), woodMat);
                sampan.position.set(0.32, 0.09, 0);
                group.add(sampan);
                if (animRegistry) animRegistry.push({ type: "bob_boat", mesh: sampan, baseY: 0.09, phase: r1 * 6.28 });

                addHouse(-0.38, -0.45, 0.44, 0.28, 0.34, 0x92400e, 0xd97706, true, 0.2);
                addTree(0.45, -0.42, 1.05, "palm", 0x16a34a);
                addTree(-0.45, 0.45, 1.0, "palm", 0x15803d);

            } else if (variant === 1) {
                // B: Cánh Đồng Điện Gió Bạc Liêu – Cà Mau & Rừng Ngập Mặn
                const mast = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.05, 0.08, 1.38, 8),
                    new THREE.MeshStandardMaterial({ color: 0xf8fafc })
                );
                mast.position.set(0.22, 0.69, -0.15);
                group.add(mast);

                const rotor = new THREE.Group();
                for (let b = 0; b < 3; b++) {
                    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.60, 0.02), new THREE.MeshStandardMaterial({ color: 0xffffff }));
                    blade.position.y = 0.28;
                    const p = new THREE.Group();
                    p.rotation.z = (b / 3) * Math.PI * 2;
                    p.add(blade);
                    rotor.add(p);
                }
                rotor.position.set(0.22, 1.35, -0.05);
                group.add(rotor);
                if (animRegistry) animRegistry.push({ type: "spin_z", mesh: rotor, speed: 2.2 });

                addTree(-0.48, 0.25, 0.95, "banyan", 0x15803d);
                addTree(-0.22, -0.42, 0.88, "palm", 0x16a34a);

            } else {
                // C: Vựa Lúa ST25 Cửu Long & Trạm Xay Xát Ven Sông
                const paddy = new THREE.Mesh(
                    new THREE.CylinderGeometry(1.15, 1.22, 0.12, 6),
                    new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.55 })
                );
                paddy.position.y = 0.06;
                group.add(paddy);

                addHouse(-0.22, -0.15, 0.56, 0.36, 0.42, 0xfef3c7, 0xd97706, true, -0.2);
                addTree(0.52, 0.28, 1.05, "palm", 0x15803d);
            }
        }

        // Subtle rotation offset per hex so even same-variant tiles look distinct
        group.rotation.y = ((seed % 6) * (Math.PI / 3)) + (r3 - 0.5) * 0.25;
        return group;
    }

    // ------------------------------------------------------------------------
    // 3. DETAILED 3D RESOURCE DIORAMA MODELS (WITH ANIMATED SUB-PARTS)
    // ------------------------------------------------------------------------
    static createResourceNodeModel(resourceType) {
        const group = new THREE.Group();
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 });
        const goldMat = new THREE.MeshStandardMaterial({
            color: 0xfacc15,
            roughness: 0.3,
            metalness: 0.65,
            emissive: 0xca8a04,
            emissiveIntensity: 0.24
        });

        if (resourceType === "food") {
            const baseTerrace = new THREE.Mesh(
                new THREE.CylinderGeometry(1.38, 1.48, 0.16, 6),
                new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.65 })
            );
            baseTerrace.position.y = 0.08;
            const upperTerrace = new THREE.Mesh(
                new THREE.CylinderGeometry(1.05, 1.15, 0.14, 6),
                new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.6 })
            );
            upperTerrace.position.y = 0.20;
            group.add(baseTerrace, upperTerrace);

            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const sheaf = new THREE.Group();
                const stalk = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.65, 8), goldMat);
                stalk.position.y = 0.32;
                sheaf.add(stalk);
                sheaf.position.set(Math.cos(angle) * 0.74, 0.24, Math.sin(angle) * 0.74);
                group.add(sheaf);
            }

            const barnBody = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.48, 0.52), woodMat);
            barnBody.position.set(0, 0.52, 0);
            const barnRoof = new THREE.Mesh(
                new THREE.ConeGeometry(0.58, 0.44, 4),
                new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.45 })
            );
            barnRoof.rotation.y = Math.PI / 4;
            barnRoof.position.set(0, 0.96, 0);
            group.add(barnBody, barnRoof);

            // Rotating Waterwheel on the side of the Granary
            const wheel = new THREE.Group();
            const wRim = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.03, 8, 14), goldMat);
            wheel.add(wRim);
            for (let s = 0; s < 4; s++) {
                const sp = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.04, 0.04), woodMat);
                sp.rotation.z = (s / 4) * Math.PI;
                wheel.add(sp);
            }
            wheel.position.set(0.42, 0.56, 0.32);
            group.add(wheel);
            group.userData.spinZ = wheel;

        } else if (resourceType === "wood") {
            const mound = new THREE.Mesh(
                new THREE.CylinderGeometry(1.36, 1.45, 0.18, 6),
                new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.75 })
            );
            mound.position.y = 0.09;
            group.add(mound);

            const leafMat1 = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 });
            const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.45 });

            const treeSpecs = [
                [0, -0.18, 1.38],
                [-0.62, 0.32, 1.14],
                [0.62, 0.32, 1.15],
                [-0.48, -0.55, 0.98],
                [0.52, -0.52, 1.02]
            ];
            treeSpecs.forEach(([x, z, scale]) => {
                const tGroup = new THREE.Group();
                const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 0.55, 7), woodMat);
                trunk.position.y = 0.27;
                const c1 = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.62, 8), leafMat1);
                c1.position.y = 0.65;
                const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.54, 8), leafMat2);
                c2.position.y = 0.98;
                tGroup.add(trunk, c1, c2);
                tGroup.position.set(x, 0.14, z);
                tGroup.scale.setScalar(scale);
                group.add(tGroup);
            });

            // Stacked Logs + Spinning Sawmill Blade
            const logGeo = new THREE.CylinderGeometry(0.10, 0.10, 0.68, 8);
            logGeo.rotateZ(Math.PI / 2);
            for (let i = 0; i < 5; i++) {
                const log = new THREE.Mesh(logGeo, woodMat);
                const row = i < 3 ? 0 : 1;
                const col = i < 3 ? (i - 1) : (i - 3.5);
                log.position.set(0, 0.26 + row * 0.17, 0.58 + col * 0.19);
                group.add(log);
            }

            const sawBlade = new THREE.Mesh(
                new THREE.CylinderGeometry(0.26, 0.26, 0.03, 12),
                new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 })
            );
            sawBlade.rotation.x = Math.PI / 2;
            sawBlade.position.set(0.45, 0.42, 0.58);
            group.add(sawBlade);
            group.userData.spinZ = sawBlade;

        } else if (resourceType === "iron") {
            const rockMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.72, metalness: 0.3 });
            const darkRockMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
            const ironMat = new THREE.MeshStandardMaterial({
                color: 0x38bdf8,
                roughness: 0.18,
                metalness: 0.88,
                emissive: 0x0284c7,
                emissiveIntensity: 0.52
            });

            const mountain = new THREE.Mesh(new THREE.DodecahedronGeometry(0.84, 1), rockMat);
            mountain.scale.set(1.35, 1.08, 1.15);
            mountain.position.set(0, 0.52, -0.12);
            group.add(mountain);

            const portalFrame = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.52, 0.25), woodMat);
            portalFrame.position.set(0, 0.36, 0.58);
            const portalHole = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.42, 0.28), darkRockMat);
            portalHole.position.set(0, 0.32, 0.60);
            group.add(portalFrame, portalHole);

            const crystalSpecs = [
                [0.48, 0.68, 0.22, ironMat, 1.2],
                [-0.52, 0.72, 0.15, ironMat, 1.15],
                [0.58, 0.42, -0.32, goldMat, 1.0],
                [-0.45, 0.48, -0.38, ironMat, 1.05]
            ];
            crystalSpecs.forEach(([x, y, z, mat, sc]) => {
                const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), mat);
                crystal.scale.set(0.75 * sc, 1.55 * sc, 0.75 * sc);
                crystal.position.set(x, y, z);
                group.add(crystal);
            });

            // Floating Spinning Core Crystal at Peak
            const topCrystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), ironMat);
            topCrystal.position.set(0, 1.28, -0.10);
            group.add(topCrystal);
            group.userData.spinY = topCrystal;
        }

        group.scale.setScalar(1.22);
        return group;
    }

    // ------------------------------------------------------------------------
    // 4. GRAND 3D MARITIME TRADE PORT (WITH ROTATING HARBOR CRANE & LIGHTHOUSE)
    // ------------------------------------------------------------------------
    static createTradePortModel(regionColor) {
        const group = new THREE.Group();
        const col = new THREE.Color(regionColor || "#f59e0b");

        const stoneMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.55 });
        const pierMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.65 });
        const wallMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.45 });
        const roofMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.35, emissive: col, emissiveIntensity: 0.24 });
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.75, roughness: 0.25, emissive: 0xd97706, emissiveIntensity: 0.3 });

        const quay = new THREE.Mesh(new THREE.CylinderGeometry(1.34, 1.44, 0.22, 6), stoneMat);
        quay.position.y = 0.11;
        group.add(quay);

        const pier1 = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.14, 0.38), pierMat);
        pier1.position.set(0.56, 0.18, 0.34);
        const pier2 = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.14, 0.38), pierMat);
        pier2.position.set(0.56, 0.18, -0.34);
        group.add(pier1, pier2);

        const hallFloor1 = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.46, 0.68), wallMat);
        hallFloor1.position.set(-0.22, 0.44, 0.18);
        const roof1 = new THREE.Mesh(new THREE.ConeGeometry(0.68, 0.32, 4), roofMat);
        roof1.rotation.y = Math.PI / 4;
        roof1.position.set(-0.22, 0.78, 0.18);

        const hallFloor2 = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.34, 0.48), wallMat);
        hallFloor2.position.set(-0.22, 0.98, 0.18);
        const roof2 = new THREE.Mesh(new THREE.ConeGeometry(0.52, 0.30, 4), goldMat);
        roof2.rotation.y = Math.PI / 4;
        roof2.position.set(-0.22, 1.26, 0.18);
        group.add(hallFloor1, roof1, hallFloor2, roof2);

        // Tall Port Lighthouse Watchtower
        const towerBase = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.34, 1.12, 10), stoneMat);
        towerBase.position.set(-0.45, 0.68, -0.52);
        const towerBand = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.30, 0.32, 10), roofMat);
        towerBand.position.set(-0.45, 0.74, -0.52);
        const lantern = new THREE.Mesh(
            new THREE.SphereGeometry(0.22, 12, 12),
            new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfacc15, emissiveIntensity: 0.95 })
        );
        lantern.position.set(-0.45, 1.34, -0.52);
        const towerRoof = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.32, 10), goldMat);
        towerRoof.position.set(-0.45, 1.60, -0.52);
        group.add(towerBase, towerBand, lantern, towerRoof);

        // Rotating Harbor Crane on Pier 2
        const cranePost = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.95, 8), goldMat);
        cranePost.position.set(0.52, 0.68, -0.34);
        const craneArmGroup = new THREE.Group();
        const boom = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.06, 0.06), goldMat);
        boom.position.set(0.22, 0, 0);
        const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.38, 4), stoneMat);
        cable.position.set(0.52, -0.20, 0);
        const hookCrate = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), roofMat);
        hookCrate.position.set(0.52, -0.42, 0);
        craneArmGroup.add(boom, cable, hookCrate);
        craneArmGroup.position.set(0.52, 1.14, -0.34);
        group.add(cranePost, craneArmGroup);

        for (let i = 0; i < 3; i++) {
            const crate = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), goldMat);
            crate.position.set(0.35 + (i % 2) * 0.24, 0.34 + (i === 2 ? 0.22 : 0), 0.34);
            group.add(crate);
        }

        group.scale.setScalar(1.24);
        group.userData = { lantern, spinY: craneArmGroup };
        return group;
    }

    static createNPCharacterModel(roleColor = "#f59e0b", isStoryteller = false) {
        const group = new THREE.Group();
        const robeMat = new THREE.MeshStandardMaterial({ color: roleColor, roughness: 0.35, emissive: roleColor, emissiveIntensity: 0.2 });
        const skinMat = new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.45 });
        const hatMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3, metalness: 0.4 });

        const pedestal = new THREE.Mesh(
            new THREE.CylinderGeometry(0.36, 0.42, 0.12, 12),
            new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.7, roughness: 0.25 })
        );
        pedestal.position.y = 0.06;
        group.add(pedestal);

        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, 0.58, 12), robeMat);
        body.position.y = 0.38;
        group.add(body);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 12), skinMat);
        head.position.y = 0.76;
        group.add(head);

        if (isStoryteller) {
            const khan = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.16, 0.12, 12), hatMat);
            khan.position.y = 0.88;
            group.add(khan);
        } else {
            const nonLa = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.18, 14), hatMat);
            nonLa.position.y = 0.90;
            group.add(nonLa);
        }

        const gem = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.16, 0),
            new THREE.MeshStandardMaterial({ color: 0xfde047, emissive: 0xf59e0b, emissiveIntensity: 0.9 })
        );
        gem.position.y = 1.24;
        group.add(gem);
        group.userData = { gem };
        return group;
    }

    // ------------------------------------------------------------------------
    // 5. 9 GRAND 3D RELIC MONUMENT ARCHITECTURAL DIORAMAS
    // ------------------------------------------------------------------------
    static createMonumentModel(modelType, tierLevel = 1) {
        const group = new THREE.Group();

        const tierColors = { 1: 0x10b981, 2: 0xf59e0b, 3: 0xef4444 };
        const tierCol = tierColors[tierLevel] || 0xf59e0b;

        const pedMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.38, metalness: 0.22 });
        const glowMat = new THREE.MeshStandardMaterial({ color: tierCol, emissive: tierCol, emissiveIntensity: 0.65, roughness: 0.2, metalness: 0.65 });
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.22, metalness: 0.82, emissive: 0xd97706, emissiveIntensity: 0.32 });

        const pedestal1 = new THREE.Mesh(new THREE.CylinderGeometry(1.42, 1.56, 0.24, 6), pedMat);
        pedestal1.position.y = 0.12;
        const pedestal2 = new THREE.Mesh(new THREE.CylinderGeometry(1.26, 1.36, 0.16, 6), pedMat);
        pedestal2.position.y = 0.30;
        const glowRing = new THREE.Mesh(new THREE.CylinderGeometry(1.30, 1.38, 0.10, 6), glowMat);
        glowRing.position.y = 0.25;
        group.add(pedestal1, pedestal2, glowRing);

        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.36, 6), goldMat);
            post.position.set(Math.cos(a) * 1.18, 0.46, Math.sin(a) * 1.18);
            group.add(post);
        }

        if (modelType === "karst_archipelago") {
            const karstMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.62 });
            const mossMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.55 });
            const peaks = [
                [-0.42, 1.05, -0.25, 0.46, 1.85],
                [0.45, 0.88, -0.18, 0.40, 1.52],
                [0.05, 0.72, 0.42, 0.32, 1.18],
                [-0.12, 0.65, -0.52, 0.28, 1.05]
            ];
            peaks.forEach(([x, y, z, r, h]) => {
                const k = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7), karstMat);
                k.position.set(x, y, z);
                k.castShadow = true;
                const cap = new THREE.Mesh(new THREE.ConeGeometry(r * 0.86, h * 0.48, 7), mossMat);
                cap.position.set(x, y + h * 0.28, z);
                group.add(k, cap);
            });
        } else if (modelType === "terraced_peak") {
            const colors = [0x15803d, 0x16a34a, 0x22c55e, 0x84cc16, 0xeab308, 0xfacc15];
            for (let i = 0; i < 6; i++) {
                const layer = new THREE.Mesh(
                    new THREE.CylinderGeometry(1.12 - i * 0.16, 1.20 - i * 0.16, 0.20, 8),
                    new THREE.MeshStandardMaterial({ color: colors[i], roughness: 0.48 })
                );
                layer.position.y = 0.46 + i * 0.19;
                group.add(layer);
            }
            const spire = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.58, 4), goldMat);
            spire.position.y = 1.68;
            group.add(spire);
        } else if (modelType === "khue_van_cac") {
            const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.38 });
            const roofMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.45 });
            [[-0.36, -0.36], [0.36, -0.36], [-0.36, 0.36], [0.36, 0.36]].forEach(([x, z]) => {
                const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.56, 0.16), pedMat);
                pillar.position.set(x, 0.62, z);
                group.add(pillar);
            });
            const upper = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.54, 0.88), redMat);
            upper.position.y = 1.12;
            const sunDisc1 = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.20, 0.92, 16), goldMat);
            sunDisc1.rotation.z = Math.PI / 2;
            sunDisc1.position.y = 1.12;
            const sunDisc2 = sunDisc1.clone();
            sunDisc2.rotation.x = Math.PI / 2;
            const roof1 = new THREE.Mesh(new THREE.ConeGeometry(0.92, 0.34, 4), roofMat);
            roof1.rotation.y = Math.PI / 4;
            roof1.position.y = 1.48;
            const roof2 = new THREE.Mesh(new THREE.ConeGeometry(0.68, 0.32, 4), goldMat);
            roof2.rotation.y = Math.PI / 4;
            roof2.position.y = 1.74;
            group.add(upper, sunDisc1, sunDisc2, roof1, roof2);
        } else if (modelType === "limestone_cavern") {
            const archMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.68 });
            const arch = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.32, 10, 16, Math.PI), archMat);
            arch.position.set(0, 0.38, 0);
            group.add(arch);
            const river = new THREE.Mesh(
                new THREE.BoxGeometry(0.92, 0.08, 1.55),
                new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 0.5 })
            );
            river.position.y = 0.39;
            group.add(river);
            [-0.32, 0, 0.32].forEach((x, idx) => {
                const stal = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.48, 6), goldMat);
                stal.rotation.x = Math.PI;
                stal.position.set(x, 0.96 - (idx % 2) * 0.1, 0);
                group.add(stal);
            });
        } else if (modelType === "imperial_citadel") {
            const wallMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.45 });
            const wall = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.54, 0.68), wallMat);
            wall.position.y = 0.62;
            const gateArch = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.44, 0.72), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
            gateArch.position.y = 0.58;
            const pavilion = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.46, 0.52), goldMat);
            pavilion.position.y = 1.08;
            const roof = new THREE.Mesh(new THREE.ConeGeometry(0.92, 0.40, 4), new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.55 }));
            roof.rotation.y = Math.PI / 4;
            roof.position.y = 1.48;
            group.add(wall, gateArch, pavilion, roof);
        } else if (modelType === "cham_tower") {
            const brickMat = new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.5 });
            const createTower = (x, z, scale) => {
                const t = new THREE.Group();
                const body = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.78, 0.56), brickMat);
                body.position.y = 0.39;
                const s1 = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.32, 0.44), brickMat);
                s1.position.y = 0.92;
                const s2 = new THREE.Mesh(new THREE.ConeGeometry(0.30, 0.46, 4), goldMat);
                s2.rotation.y = Math.PI / 4;
                s2.position.y = 1.28;
                t.add(body, s1, s2);
                t.position.set(x, 0.36, z);
                t.scale.setScalar(scale);
                return t;
            };
            group.add(createTower(0, -0.12, 1.12), createTower(-0.52, 0.28, 0.76), createTower(0.52, 0.28, 0.76));
        } else if (modelType === "rong_house") {
            const thatchMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.55 });
            const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.65 });
            const platform = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.16, 0.64), woodMat);
            platform.position.y = 0.58;
            const bladeGeo = new THREE.ConeGeometry(0.68, 1.68, 4);
            bladeGeo.scale(1.15, 1.0, 0.56);
            bladeGeo.rotateY(Math.PI / 4);
            const roof = new THREE.Mesh(bladeGeo, thatchMat);
            roof.position.y = 1.42;
            const gong = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.30, 0.08, 18), goldMat);
            gong.rotation.x = Math.PI / 2;
            gong.position.set(0.56, 0.68, 0.42);
            group.add(platform, roof, gong);
        } else if (modelType === "dragon_wharf") {
            const buildingMat = new THREE.MeshStandardMaterial({ color: 0xfda4af, roughness: 0.42 });
            const roofMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.42 });
            const mainHall = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.76, 0.74), buildingMat);
            mainHall.position.y = 0.74;
            const roof = new THREE.Mesh(new THREE.ConeGeometry(0.92, 0.44, 4), roofMat);
            roof.rotation.y = Math.PI / 4;
            roof.position.y = 1.32;
            const moon = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), goldMat);
            moon.position.y = 1.62;
            const dLeft = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.05, 6, 12, Math.PI), goldMat);
            dLeft.position.set(-0.30, 1.54, 0);
            const dRight = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.05, 6, 12, Math.PI), goldMat);
            dRight.position.set(0.30, 1.54, 0);
            group.add(mainHall, roof, moon, dLeft, dRight);
        } else {
            const waterPad = new THREE.Mesh(
                new THREE.CylinderGeometry(1.12, 1.16, 0.10, 12),
                new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.2 })
            );
            waterPad.position.y = 0.38;
            group.add(waterPad);
            const sampanOffsets = [[-0.42, -0.24], [0.42, -0.18], [0, 0.38]];
            sampanOffsets.forEach(([x, z]) => {
                const boat = new THREE.Mesh(
                    new THREE.BoxGeometry(0.68, 0.18, 0.30),
                    new THREE.MeshStandardMaterial({ color: 0x92400e })
                );
                boat.position.set(x, 0.50, z);
                const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.92, 6), goldMat);
                pole.position.set(x + 0.22, 0.95, z);
                const fruit = new THREE.Mesh(
                    new THREE.SphereGeometry(0.15, 10, 10),
                    new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 0.35 })
                );
                fruit.position.set(x + 0.22, 1.36, z);
                group.add(boat, pole, fruit);
            });
        }

        const npc = this.createNPCharacterModel("#fde047", true);
        npc.position.set(0.82, 0.34, 0.68);
        npc.scale.setScalar(0.95);
        group.add(npc);

        const relicCrown = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), goldMat);
        relicCrown.position.y = 2.15;
        group.add(relicCrown);

        group.scale.setScalar(1.25);
        group.userData = { relicCrown, glowRing, npc };
        return group;
    }

    // ------------------------------------------------------------------------
    // 6. RICH LIVING SURROUNDING OCEAN SCENERY MODELS
    //    (Karst Islands, Lighthouses, Oil Rigs, Sampans, Basket Boats,
    //     Jumping Dolphin Pods, Fish Schools & Flapping Seagull Flocks)
    // ------------------------------------------------------------------------
    static createDistantKarstOutcrop(scale = 1.0) {
        const group = new THREE.Group();
        const rockMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.82, metalness: 0.1 });
        const foliageMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.68 });
        const sandMat = new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.65 });

        const beach = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.7, 0.28, 9), sandMat);
        beach.position.y = 0.06;
        group.add(beach);

        const peaks = [
            [0, 1.85, 0, 1.38, 3.9],
            [-1.15, 1.15, 0.52, 0.98, 2.5],
            [1.05, 1.35, -0.45, 0.88, 2.8]
        ];
        peaks.forEach(([x, y, z, r, h]) => {
            const spire = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7), rockMat);
            spire.position.set(x, y, z);
            spire.castShadow = true;
            const moss = new THREE.Mesh(new THREE.ConeGeometry(r * 0.84, h * 0.48, 7), foliageMat);
            moss.position.set(x, y + h * 0.26, z);
            group.add(spire, moss);
        });

        group.scale.setScalar(scale);
        return group;
    }

    static createSeaLighthouseIsland() {
        const group = new THREE.Group();
        const rockMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
        const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 });
        const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
        const lampMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 0.98 });

        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.45, 1), rockMat);
        rock.scale.set(1.35, 0.58, 1.25);
        rock.position.y = 0.22;
        group.add(rock);

        const towerBase = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.48, 2.3, 12), whiteMat);
        towerBase.position.y = 1.42;
        const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.42, 0.68, 12), redMat);
        stripe.position.y = 1.52;
        const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.40, 12), lampMat);
        lamp.position.y = 2.70;
        const roof = new THREE.Mesh(new THREE.ConeGeometry(0.40, 0.45, 12), redMat);
        roof.position.y = 3.08;

        const beamGeo = new THREE.ConeGeometry(1.5, 5.2, 14, 1, true);
        beamGeo.rotateZ(Math.PI / 2);
        beamGeo.translate(2.6, 0, 0);
        const beamMat = new THREE.MeshBasicMaterial({
            color: 0xfef08a,
            transparent: true,
            opacity: 0.22,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        const beam = new THREE.Mesh(beamGeo, beamMat);
        beam.position.y = 2.70;

        group.add(towerBase, stripe, lamp, roof, beam);
        group.userData = { beam };
        return group;
    }

    static createOffshoreOilRig() {
        const group = new THREE.Group();
        const steelMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.68, roughness: 0.32 });
        const deckMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.35, roughness: 0.45 });
        const flameMat = new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 0.98 });

        [[-0.75, -0.75], [0.75, -0.75], [-0.75, 0.75], [0.75, 0.75]].forEach(([lx, lz]) => {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 1.9, 8), steelMat);
            leg.position.set(lx, 0.75, lz);
            group.add(leg);
        });

        const platform = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.30, 2.0), deckMat);
        platform.position.y = 1.65;
        const derrick = new THREE.Mesh(new THREE.ConeGeometry(0.40, 1.7, 4), steelMat);
        derrick.position.set(-0.22, 2.6, 0);
        const flareBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.3, 6), steelMat);
        flareBoom.rotation.z = -Math.PI / 4;
        flareBoom.position.set(1.0, 2.15, 0);
        const flame = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), flameMat);
        flame.position.set(1.48, 2.65, 0);

        group.add(platform, derrick, flareBoom, flame);
        group.userData = { flame };
        return group;
    }

    static createAmbientFishingSampan() {
        const group = new THREE.Group();
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x6b3e1b, roughness: 0.68 });
        const canopyMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 });
        const sailMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.55, side: THREE.DoubleSide });

        const hullGeo = new THREE.CylinderGeometry(0.26, 0.16, 1.18, 8);
        hullGeo.rotateZ(Math.PI / 2);
        hullGeo.scale(1.15, 0.55, 0.72);
        const hull = new THREE.Mesh(hullGeo, woodMat);
        hull.position.y = 0.09;

        const canopy = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.42, 8, 1, false, 0, Math.PI), canopyMat);
        canopy.rotation.z = Math.PI / 2;
        canopy.position.set(-0.18, 0.16, 0);

        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.95, 6), woodMat);
        mast.position.set(0.16, 0.52, 0);
        const sail = new THREE.Mesh(new THREE.ConeGeometry(0.40, 0.76, 4), sailMat);
        sail.position.set(0.08, 0.60, 0);

        group.add(hull, canopy, mast, sail);
        return group;
    }

    static createJumpingDolphinPod() {
        const group = new THREE.Group();
        const dolphinMat = new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            emissive: 0x0284c7,
            emissiveIntensity: 0.25,
            roughness: 0.22,
            metalness: 0.45
        });

        const buildDolphin = (offsetX, offsetZ) => {
            const d = new THREE.Group();
            const body = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.85, 8), dolphinMat);
            body.rotation.z = -Math.PI / 2;
            const dorsal = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 4), dolphinMat);
            dorsal.position.set(-0.05, 0.18, 0);
            const tail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.32), dolphinMat);
            tail.position.set(-0.44, 0, 0);
            d.add(body, dorsal, tail);
            d.position.set(offsetX, 0, offsetZ);
            return d;
        };

        const d1 = buildDolphin(0, 0);
        const d2 = buildDolphin(-0.85, 0.55);
        group.add(d1, d2);
        group.userData = { d1, d2 };
        return group;
    }

    static createGlowingFishSchool() {
        const group = new THREE.Group();
        const colors = [0xfacc15, 0xf97316, 0x38bdf8, 0x4ade80];
        for (let i = 0; i < 10; i++) {
            const a = (i / 10) * Math.PI * 2;
            const r = 0.45 + (i % 3) * 0.35;
            const fish = new THREE.Mesh(
                new THREE.ConeGeometry(0.08, 0.32, 5),
                new THREE.MeshBasicMaterial({ color: colors[i % colors.length] })
            );
            fish.rotation.z = -Math.PI / 2;
            fish.rotation.y = -a;
            fish.position.set(Math.cos(a) * r, -0.06, Math.sin(a) * r);
            group.add(fish);
        }
        return group;
    }

    static createSeagullFlock() {
        const group = new THREE.Group();
        const birdMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc, side: THREE.DoubleSide });
        const offsets = [[0, 0, 0], [-0.85, 0.25, -0.6], [0.80, -0.15, -0.7], [-1.45, 0.4, -1.3]];
        const wings = [];
        offsets.forEach(([bx, by, bz]) => {
            const bird = new THREE.Group();
            const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.03, 0.14), birdMat);
            wingL.position.set(-0.16, 0, 0);
            const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.03, 0.14), birdMat);
            wingR.position.set(0.16, 0, 0);
            bird.add(wingL, wingR);
            bird.position.set(bx, by, bz);
            group.add(bird);
            wings.push({ wingL, wingR });
        });
        group.userData = { wings };
        return group;
    }

    // ------------------------------------------------------------------------
    // 7. SOVEREIGNTY ARCHIPELAGO DIORAMA (QUẦN ĐẢO HOÀNG SA & TRƯỜNG SA)
    // ------------------------------------------------------------------------
    static createSovereigntyArchipelago(titleText, subText) {
        const group = new THREE.Group();
        const sandMat = new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.65 });
        const greenMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.55 });
        const stoneMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
        const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35, emissive: 0x991b1b, emissiveIntensity: 0.25 });
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.75, roughness: 0.25 });

        const atolls = [
            [0, 0, 1.32],
            [-1.35, -0.95, 0.78],
            [1.25, 0.85, 0.85],
            [-0.95, 1.15, 0.65]
        ];
        atolls.forEach(([ax, az, r]) => {
            const sand = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.9, r * 1.08, 0.22, 8), sandMat);
            sand.position.set(ax, 0.11, az);
            const veg = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.62, r * 0.78, 0.24, 8), greenMat);
            veg.position.set(ax, 0.26, az);
            group.add(sand, veg);
        });

        const obeliskBase = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.28, 0.68), stoneMat);
        obeliskBase.position.set(0, 0.46, 0);
        const obeliskBody = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 1.45, 4), stoneMat);
        obeliskBody.rotation.y = Math.PI / 4;
        obeliskBody.position.set(0, 1.25, 0);
        const obeliskCap = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.42, 4), redMat);
        obeliskCap.rotation.y = Math.PI / 4;
        obeliskCap.position.set(0, 2.15, 0);

        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.95, 6), goldMat);
        pole.position.set(0.45, 0.85, 0.25);
        const flag = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.36, 0.04), redMat);
        flag.position.set(0.72, 1.16, 0.25);
        const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), goldMat);
        star.position.set(0.72, 1.16, 0.28);

        group.add(obeliskBase, obeliskBody, obeliskCap, pole, flag, star);

        const banner = this.createRegionBannerSprite(titleText, subText, "#d97706", 4.9, 1.38);
        banner.position.set(0, 3.25, 0);
        group.add(banner);
        return group;
    }

    static createTabletopCompassAndTitlePlaque() {
        const group = new THREE.Group();
        const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.78, roughness: 0.25 });
        const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x3e2411, roughness: 0.65, metalness: 0.12 });
        const dialMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.45 });

        const compassGroup = new THREE.Group();
        const outerRim = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.0, 0.34, 24), darkWoodMat);
        outerRim.position.y = 0.18;
        const brassRing = new THREE.Mesh(new THREE.CylinderGeometry(2.55, 2.65, 0.40, 24), brassMat);
        brassRing.position.y = 0.21;
        const dialFace = new THREE.Mesh(new THREE.CylinderGeometry(2.35, 2.35, 0.44, 24), dialMat);
        dialFace.position.y = 0.23;

        const needleNS = new THREE.Mesh(new THREE.ConeGeometry(0.38, 4.0, 4), new THREE.MeshStandardMaterial({ color: 0xb91c1c, metalness: 0.4 }));
        needleNS.rotation.x = Math.PI / 2;
        needleNS.position.y = 0.48;
        const needleEW = new THREE.Mesh(new THREE.ConeGeometry(0.32, 3.6, 4), brassMat);
        needleEW.rotation.z = Math.PI / 2;
        needleEW.position.y = 0.46;
        const centerPin = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 12), brassMat);
        centerPin.position.y = 0.54;

        compassGroup.add(outerRim, brassRing, dialFace, needleNS, needleEW, centerPin);
        compassGroup.position.set(-22.5, 0.85, -3.5);
        group.add(compassGroup);

        return group;
    }

    static createStartingAnchorBuoy() {
        const group = new THREE.Group();
        const ringMat = new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            emissive: 0x0284c7,
            emissiveIntensity: 0.48,
            transparent: true,
            opacity: 0.76
        });
        const ringGeo = new THREE.RingGeometry(1.15, 1.38, 6);
        ringGeo.rotateX(-Math.PI / 2);
        ringGeo.rotateZ(Math.PI / 6);
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.y = 0.08;
        group.add(ring);
        return group;
    }
}

window.ProceduralModels = ProceduralModels;
