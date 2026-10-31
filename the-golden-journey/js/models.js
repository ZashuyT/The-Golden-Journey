// ============================================================================
// THE GOLDEN JOURNEY (HÀNH TRÌNH VÀNG SON) — V3.3 HIGH-DETAIL 3D MODEL FACTORY
// - Larger, Richly Detailed Architectural Dioramas for 9 Monuments, 6 Ports & Resources
// - High-Contrast, Vividly Colored 3D Player Ships (Twin Masts, Colored Sails,
//   Glowing Water Halo Ring & Floating Captain Nameplate for Instant Identification)
// ============================================================================

class ProceduralModels {
    static createLabelCanvas(text, subtext, bgColor = "rgba(11, 19, 30, 0.92)", borderColor = "#fbbf24", scaleX = 3.8, scaleY = 1.18) {
        const canvas = document.createElement("canvas");
        canvas.width = 560;
        canvas.height = 176;
        const ctx = canvas.getContext("2d");

        ctx.fillStyle = bgColor;
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 7;

        const r = 28;
        const x = 12, y = 14, w = 536, h = 148;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 35px 'Segoe UI', Roboto, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, 280, subtext ? 64 : 88);

        if (subtext) {
            ctx.fillStyle = borderColor;
            ctx.font = "bold 27px 'Segoe UI', Roboto, sans-serif";
            ctx.fillText(subtext, 280, 118);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(scaleX, scaleY, 1);
        sprite.renderOrder = 999;
        return sprite;
    }

    // ------------------------------------------------------------------------
    // 1. HIGH-CONTRAST 3D PLAYER SHIPS (5 Ultra-Distinct Models & Vivid Colors)
    // ------------------------------------------------------------------------
    static createPlayerShip(archetypeId, playerName = "") {
        const arch = window.GAME_DATA.shipArchetypes[archetypeId % 5];
        const group = new THREE.Group();

        const hullColor = new THREE.Color(arch.color);
        const sailColor = new THREE.Color(arch.sailColor);
        const trimColor = new THREE.Color(arch.trimColor);

        const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c2d0c, roughness: 0.55, metalness: 0.15 });
        const hullMat = new THREE.MeshStandardMaterial({
            color: hullColor,
            emissive: hullColor,
            emissiveIntensity: 0.28,
            roughness: 0.32,
            metalness: 0.22
        });
        const trimMat = new THREE.MeshStandardMaterial({
            color: trimColor,
            emissive: trimColor,
            emissiveIntensity: 0.35,
            roughness: 0.25,
            metalness: 0.75
        });
        const sailMat = new THREE.MeshStandardMaterial({
            color: sailColor,
            emissive: hullColor,
            emissiveIntensity: 0.32,
            roughness: 0.38,
            side: THREE.DoubleSide
        });

        // 1. Main Carved Hull
        const hullGeo = new THREE.CylinderGeometry(0.56, 0.34, 1.75, 10);
        hullGeo.rotateZ(Math.PI / 2);
        hullGeo.scale(1.18, 0.62, 0.78);
        const hull = new THREE.Mesh(hullGeo, hullMat);
        hull.position.y = 0.28;
        hull.castShadow = true;
        group.add(hull);

        // 2. Hardwood Deck + Glowing Gold/Vivid Gunwale Bulwarks
        const deck = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.10, 0.68), woodMat);
        deck.position.y = 0.48;
        group.add(deck);

        const bulwark = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.08, 0.76), trimMat);
        bulwark.position.y = 0.45;
        group.add(bulwark);

        // 3. Raised Stern Castle (Two-story Captain Cabin + Ornate Pagoda Roof)
        const sternCabin = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.36, 0.56), hullMat);
        sternCabin.position.set(-0.48, 0.68, 0);
        sternCabin.castShadow = true;
        group.add(sternCabin);

        const sternWindows = new THREE.Mesh(
            new THREE.BoxGeometry(0.57, 0.12, 0.58),
            new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfacc15, emissiveIntensity: 0.85 })
        );
        sternWindows.position.set(-0.48, 0.72, 0);
        group.add(sternWindows);

        const cabinRoofGeo = new THREE.ConeGeometry(0.48, 0.24, 4);
        cabinRoofGeo.rotateY(Math.PI / 4);
        const cabinRoof = new THREE.Mesh(cabinRoofGeo, trimMat);
        cabinRoof.position.set(-0.48, 0.96, 0);
        group.add(cabinRoof);

        // 4. Raised Forecastle & Dragon/Phoenix Prow Figurehead
        const foreDeck = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.20, 0.46), hullMat);
        foreDeck.position.set(0.58, 0.56, 0);
        group.add(foreDeck);

        const prowGeo = new THREE.ConeGeometry(0.18, 0.62, 6);
        prowGeo.rotateZ(-Math.PI / 3);
        const prow = new THREE.Mesh(prowGeo, trimMat);
        prow.position.set(0.95, 0.64, 0);
        group.add(prow);

        const prowHead = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), trimMat);
        prowHead.position.set(1.16, 0.78, 0);
        group.add(prowHead);

        // Side Shields / Outriggers for extra visual distinction
        if (archetypeId % 2 === 1) {
            const pontoonGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.55, 8);
            pontoonGeo.rotateZ(Math.PI / 2);
            const pLeft = new THREE.Mesh(pontoonGeo, trimMat);
            pLeft.position.set(0, 0.20, 0.48);
            const pRight = new THREE.Mesh(pontoonGeo, trimMat);
            pRight.position.set(0, 0.20, -0.48);
            group.add(pLeft, pRight);
        } else {
            for (let s = -1; s <= 1; s++) {
                const shieldL = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.04, 8), trimMat);
                shieldL.rotation.x = Math.PI / 2;
                shieldL.position.set(s * 0.36, 0.46, 0.39);
                const shieldR = shieldL.clone();
                shieldR.position.z = -0.39;
                group.add(shieldL, shieldR);
            }
        }

        // 5. Twin Masts (Main Mast + Foremast) with Billowing Vivid Sails & Battens
        const mainMast = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 1.85, 8), woodMat);
        mainMast.position.set(0.04, 1.25, 0);
        const foreMast = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.048, 1.38, 8), woodMat);
        foreMast.position.set(0.52, 1.02, 0);
        group.add(mainMast, foreMast);

        const mainSailGeo = new THREE.CylinderGeometry(0.64, 0.64, 1.12, 14, 1, true, -Math.PI * 0.34, Math.PI * 0.68);
        const mainSail = new THREE.Mesh(mainSailGeo, sailMat);
        mainSail.rotation.y = Math.PI / 2;
        mainSail.position.set(-0.34, 1.28, 0);
        mainSail.castShadow = true;
        group.add(mainSail);

        const foreSailGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.78, 12, 1, true, -Math.PI * 0.32, Math.PI * 0.64);
        const foreSail = new THREE.Mesh(foreSailGeo, sailMat);
        foreSail.rotation.y = Math.PI / 2;
        foreSail.position.set(0.24, 1.08, 0);
        foreSail.castShadow = true;
        group.add(foreSail);

        // Golden Battens across Main Sail
        for (let i = -1; i <= 1; i++) {
            const battenGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.76, 6);
            battenGeo.rotateX(Math.PI / 2);
            const batten = new THREE.Mesh(battenGeo, trimMat);
            batten.position.set(0.26, 1.28 + i * 0.32, 0);
            group.add(batten);
        }

        // 6. Masthead Banner Flag & Glowing Beacon Orb
        const flagGeo = new THREE.ConeGeometry(0.18, 0.52, 4);
        flagGeo.rotateZ(Math.PI / 2);
        const flag = new THREE.Mesh(flagGeo, hullMat);
        flag.position.set(-0.18, 2.15, 0);
        group.add(flag);

        const beaconOrb = new THREE.Mesh(
            new THREE.SphereGeometry(0.12, 10, 10),
            new THREE.MeshBasicMaterial({ color: hullColor })
        );
        beaconOrb.position.set(0.04, 2.22, 0);
        group.add(beaconOrb);

        // 7. Double High-Visibility Identification Ring on the Water Surface
        const outerRingGeo = new THREE.RingGeometry(0.95, 1.18, 32);
        outerRingGeo.rotateX(-Math.PI / 2);
        const outerRingMat = new THREE.MeshBasicMaterial({
            color: hullColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.95
        });
        const ring = new THREE.Mesh(outerRingGeo, outerRingMat);
        ring.position.y = 0.08;
        group.add(ring);

        const innerDiscGeo = new THREE.CircleGeometry(0.92, 24);
        innerDiscGeo.rotateX(-Math.PI / 2);
        const innerDiscMat = new THREE.MeshBasicMaterial({
            color: hullColor,
            transparent: true,
            opacity: 0.28,
            side: THREE.DoubleSide
        });
        const innerDisc = new THREE.Mesh(innerDiscGeo, innerDiscMat);
        innerDisc.position.y = 0.06;
        group.add(innerDisc);

        // 8. Floating Player Label Sprite above the Ship
        const labelTitle = playerName ? `⛵ ${playerName}` : `⛵ ${arch.name}`;
        const nameSprite = this.createLabelCanvas(labelTitle, arch.vesselTitle, "rgba(8, 15, 26, 0.92)", arch.color, 3.2, 0.96);
        nameSprite.position.set(0, 2.78, 0);
        group.add(nameSprite);

        // Overall 1.38x scale boost so ships are bold and easy to see on the larger board
        group.scale.setScalar(1.38);

        group.userData = { mainSail, foreSail, flag, ring, nameSprite, archetype: arch };
        return group;
    }

    // ------------------------------------------------------------------------
    // 2. DETAILED 3D RESOURCE DIORAMA MODELS (Food, Wood, Iron)
    // ------------------------------------------------------------------------
    static createResourceNodeModel(resourceType) {
        const group = new THREE.Group();

        if (resourceType === "food") {
            // Multi-layered Golden Rice Paddy Terraces + Stilt Granary Barn + Waterwheel + Rice Sheaves
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

            const goldMat = new THREE.MeshStandardMaterial({
                color: 0xfacc15,
                roughness: 0.35,
                emissive: 0xca8a04,
                emissiveIntensity: 0.22
            });
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const sheaf = new THREE.Group();
                const stalk = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.65, 8), goldMat);
                stalk.position.y = 0.32;
                const tie = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.14, 0.14, 0.08, 8),
                    new THREE.MeshStandardMaterial({ color: 0xb45309 })
                );
                tie.position.y = 0.22;
                sheaf.add(stalk, tie);
                sheaf.position.set(Math.cos(angle) * 0.72, 0.24, Math.sin(angle) * 0.72);
                group.add(sheaf);
            }

            // Detailed Stilt Granary House in Center
            const woodMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.6 });
            const roofMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.45 });
            const barnBody = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.48, 0.52), woodMat);
            barnBody.position.set(0, 0.52, 0);
            const barnRoof = new THREE.Mesh(new THREE.ConeGeometry(0.58, 0.44, 4), roofMat);
            barnRoof.rotation.y = Math.PI / 4;
            barnRoof.position.set(0, 0.96, 0);
            group.add(barnBody, barnRoof);

        } else if (resourceType === "wood") {
            // Dense Multi-Tiered Ancient Timber Forest + Sawmill Cabin + Stacked Logs
            const mound = new THREE.Mesh(
                new THREE.CylinderGeometry(1.36, 1.45, 0.18, 6),
                new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.75 })
            );
            mound.position.y = 0.09;
            group.add(mound);

            const trunkMat = new THREE.MeshStandardMaterial({ color: 0x713f12, roughness: 0.8 });
            const leafMat1 = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 });
            const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.45 });
            const leafMat3 = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.45 });

            const treeSpecs = [
                [0, -0.15, 1.38],
                [-0.62, 0.35, 1.12],
                [0.62, 0.32, 1.15],
                [-0.48, -0.55, 0.98],
                [0.52, -0.52, 1.02]
            ];
            treeSpecs.forEach(([x, z, scale]) => {
                const tGroup = new THREE.Group();
                const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 0.55, 7), trunkMat);
                trunk.position.y = 0.27;
                const c1 = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.62, 8), leafMat1);
                c1.position.y = 0.65;
                const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.54, 8), leafMat2);
                c2.position.y = 0.98;
                const c3 = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.42, 8), leafMat3);
                c3.position.y = 1.28;
                tGroup.add(trunk, c1, c2, c3);
                tGroup.position.set(x, 0.14, z);
                tGroup.scale.setScalar(scale);
                group.add(tGroup);
            });

            // Stacked Timber Logs Pile in Front
            const logGeo = new THREE.CylinderGeometry(0.10, 0.10, 0.68, 8);
            logGeo.rotateZ(Math.PI / 2);
            for (let i = 0; i < 5; i++) {
                const log = new THREE.Mesh(logGeo, trunkMat);
                const row = i < 3 ? 0 : 1;
                const col = i < 3 ? (i - 1) : (i - 3.5);
                log.position.set(0, 0.26 + row * 0.17, 0.58 + col * 0.19);
                group.add(log);
            }

        } else if (resourceType === "iron") {
            // Deep Mountain Quarry + Timbered Mine Tunnel + Glowing Ore Crystals + Minecart
            const rockMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.72, metalness: 0.3 });
            const darkRockMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
            const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
            const ironMat = new THREE.MeshStandardMaterial({
                color: 0x38bdf8,
                roughness: 0.18,
                metalness: 0.88,
                emissive: 0x0284c7,
                emissiveIntensity: 0.48
            });
            const goldVeinMat = new THREE.MeshStandardMaterial({
                color: 0xfacc15,
                roughness: 0.22,
                metalness: 0.85,
                emissive: 0xd97706,
                emissiveIntensity: 0.35
            });

            const mountain = new THREE.Mesh(new THREE.DodecahedronGeometry(0.82, 1), rockMat);
            mountain.scale.set(1.35, 1.05, 1.15);
            mountain.position.set(0, 0.52, -0.12);
            group.add(mountain);

            // Mine Portal Entrance
            const portalFrame = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.52, 0.25), woodMat);
            portalFrame.position.set(0, 0.36, 0.58);
            const portalHole = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.42, 0.28), darkRockMat);
            portalHole.position.set(0, 0.32, 0.60);
            group.add(portalFrame, portalHole);

            // Glowing Iron & Gold Crystal Clusters
            const crystalSpecs = [
                [0.48, 0.68, 0.22, ironMat, 1.2],
                [-0.52, 0.72, 0.15, ironMat, 1.15],
                [0.58, 0.42, -0.32, goldVeinMat, 1.0],
                [-0.45, 0.48, -0.38, ironMat, 1.05],
                [0, 1.05, -0.10, ironMat, 1.35]
            ];
            crystalSpecs.forEach(([x, y, z, mat, sc]) => {
                const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), mat);
                crystal.scale.set(0.75 * sc, 1.55 * sc, 0.75 * sc);
                crystal.position.set(x, y, z);
                group.add(crystal);
            });
        }

        group.scale.setScalar(1.22);
        return group;
    }

    // ------------------------------------------------------------------------
    // 3. GRAND 3D MARITIME TRADE PORT & NPC STORYTELLER MODELS
    // ------------------------------------------------------------------------
    static createTradePortModel(regionColor) {
        const group = new THREE.Group();
        const col = new THREE.Color(regionColor || "#f59e0b");

        const stoneMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.55 });
        const pierMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.65 });
        const wallMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.45 });
        const roofMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.35, emissive: col, emissiveIntensity: 0.24 });
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.75, roughness: 0.25, emissive: 0xd97706, emissiveIntensity: 0.3 });

        // Stone Harbor Quay Foundation
        const quay = new THREE.Mesh(new THREE.CylinderGeometry(1.32, 1.42, 0.22, 6), stoneMat);
        quay.position.y = 0.11;
        group.add(quay);

        // Twin Wooden Piers Extending to Sea
        const pier1 = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.14, 0.38), pierMat);
        pier1.position.set(0.55, 0.18, 0.32);
        const pier2 = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.14, 0.38), pierMat);
        pier2.position.set(0.55, 0.18, -0.32);
        group.add(pier1, pier2);

        // Two-Story Merchant Guildhall Warehouse
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

        // Stacked Trade Crates on Pier
        for (let i = 0; i < 3; i++) {
            const crate = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), goldMat);
            crate.position.set(0.35 + (i % 2) * 0.24, 0.34 + (i === 2 ? 0.22 : 0), 0.32);
            group.add(crate);
        }

        group.scale.setScalar(1.24);
        group.userData = { lantern };
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
    // 4. 9 GRAND 3D RELIC MONUMENT ARCHITECTURAL DIORAMAS (SCALED UP & ENRICHED)
    // ------------------------------------------------------------------------
    static createMonumentModel(modelType, tierLevel = 1) {
        const group = new THREE.Group();

        // Pedestal Base Ring (Colored by Difficulty Tier: 1=Emerald, 2=Amber, 3=Crimson)
        const tierColors = { 1: 0x10b981, 2: 0xf59e0b, 3: 0xef4444 };
        const tierCol = tierColors[tierLevel] || 0xf59e0b;

        const pedMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.38, metalness: 0.22 });
        const glowMat = new THREE.MeshStandardMaterial({ color: tierCol, emissive: tierCol, emissiveIntensity: 0.65, roughness: 0.2, metalness: 0.65 });
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.22, metalness: 0.82, emissive: 0xd97706, emissiveIntensity: 0.32 });

        // Grand Two-Step Stone Plinth
        const pedestal1 = new THREE.Mesh(new THREE.CylinderGeometry(1.42, 1.56, 0.24, 6), pedMat);
        pedestal1.position.y = 0.12;
        const pedestal2 = new THREE.Mesh(new THREE.CylinderGeometry(1.26, 1.36, 0.16, 6), pedMat);
        pedestal2.position.y = 0.30;
        const glowRing = new THREE.Mesh(new THREE.CylinderGeometry(1.30, 1.38, 0.10, 6), glowMat);
        glowRing.position.y = 0.25;
        group.add(pedestal1, pedestal2, glowRing);

        // Corner Ornamental Pillars on Plinth
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.36, 6), goldMat);
            post.position.set(Math.cos(a) * 1.18, 0.46, Math.sin(a) * 1.18);
            group.add(post);
        }

        if (modelType === "karst_archipelago") {
            // Ha Long Bay Towering Limestone Karst Peaks + Emerald Lagoon + Traditional Junk
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
            // Sa Pa 6-Tier Golden/Emerald Terraced Mountain + Fansipan Brass Spire & Cable Car Tower
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
            // Temple of Literature - Khuê Văn Các Two-Story Pavilion + Doctor Stelae on Turtles
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
            // Phong Nha - Ke Bang Colossal Karst Cave Arch + Glowing Emerald River & Stalactites
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
            // Hue Imperial Noon Gate (Ngọ Môn) + Five-Phoenix Pavilion + Flag Tower
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
            // My Son Sanctuary 3 Sacred Red-Brick Champa Kalan Towers
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
            // Central Highlands Towering Steep-Blade Rong House + Sacred Gong Circle
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
            // Ben Nha Rong Historic Building with Colonnade & Twin Golden Dragons on Roof
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
            // Cai Rang Floating Market Bustling Boats with Tall "Cay Beo" Poles
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

        // Storyteller NPC standing at the Monument Entrance
        const npc = this.createNPCharacterModel("#fde047", true);
        npc.position.set(0.82, 0.34, 0.68);
        npc.scale.setScalar(0.95);
        group.add(npc);

        // Floating Royal Relic Crown above the Monument
        const relicCrown = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), goldMat);
        relicCrown.position.y = 2.15;
        group.add(relicCrown);

        group.scale.setScalar(1.25);
        group.userData = { relicCrown, glowRing, npc };
        return group;
    }

    // ------------------------------------------------------------------------
    // 5. SURROUNDING OCEAN AMBIENT SCENERY MODELS
    // ------------------------------------------------------------------------
    static createDistantKarstOutcrop(scale = 1.0) {
        const group = new THREE.Group();
        const rockMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85, metalness: 0.1 });
        const foliageMat = new THREE.MeshStandardMaterial({ color: 0x1e4620, roughness: 0.75 });
        const sandMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.7 });

        const beach = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.5, 0.25, 8), sandMat);
        beach.position.y = 0.05;
        group.add(beach);

        const peaks = [
            [0, 1.8, 0, 1.35, 3.8],
            [-1.1, 1.1, 0.5, 0.95, 2.4],
            [1.0, 1.3, -0.4, 0.85, 2.7]
        ];
        peaks.forEach(([x, y, z, r, h]) => {
            const spire = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7), rockMat);
            spire.position.set(x, y, z);
            spire.castShadow = true;
            const moss = new THREE.Mesh(new THREE.ConeGeometry(r * 0.82, h * 0.45, 7), foliageMat);
            moss.position.set(x, y + h * 0.25, z);
            group.add(spire, moss);
        });

        group.scale.setScalar(scale);
        return group;
    }

    static createSeaLighthouseIsland() {
        const group = new THREE.Group();
        const rockMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
        const whiteMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 });
        const redMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.45 });
        const lampMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 0.95 });

        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4, 1), rockMat);
        rock.scale.set(1.3, 0.55, 1.2);
        rock.position.y = 0.2;
        group.add(rock);

        const towerBase = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.46, 2.2, 10), whiteMat);
        towerBase.position.y = 1.4;
        const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.40, 0.65, 10), redMat);
        stripe.position.y = 1.5;
        const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.38, 10), lampMat);
        lamp.position.y = 2.65;
        const roof = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.42, 10), redMat);
        roof.position.y = 3.0;

        const beamGeo = new THREE.ConeGeometry(1.4, 4.5, 12, 1, true);
        beamGeo.rotateZ(Math.PI / 2);
        beamGeo.translate(2.25, 0, 0);
        const beamMat = new THREE.MeshBasicMaterial({
            color: 0xfef08a,
            transparent: true,
            opacity: 0.18,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        const beam = new THREE.Mesh(beamGeo, beamMat);
        beam.position.y = 2.65;

        group.add(towerBase, stripe, lamp, roof, beam);
        group.userData = { beam };
        return group;
    }

    static createOffshoreOilRig() {
        const group = new THREE.Group();
        const steelMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.65, roughness: 0.35 });
        const deckMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.3, roughness: 0.5 });
        const flameMat = new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 0.95 });

        [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]].forEach(([lx, lz]) => {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 1.8, 8), steelMat);
            leg.position.set(lx, 0.7, lz);
            group.add(leg);
        });

        const platform = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.28, 1.9), deckMat);
        platform.position.y = 1.6;
        const derrick = new THREE.Mesh(new THREE.ConeGeometry(0.38, 1.6, 4), steelMat);
        derrick.position.set(-0.2, 2.5, 0);
        const flareBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.2, 6), steelMat);
        flareBoom.rotation.z = -Math.PI / 4;
        flareBoom.position.set(0.95, 2.1, 0);
        const flame = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), flameMat);
        flame.position.set(1.4, 2.55, 0);

        group.add(platform, derrick, flareBoom, flame);
        group.userData = { flame };
        return group;
    }

    static createAmbientFishingSampan() {
        const group = new THREE.Group();
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.75 });
        const sailMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.65, side: THREE.DoubleSide });

        const hull = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.18, 0.36), woodMat);
        hull.position.y = 0.08;
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.85, 6), woodMat);
        mast.position.set(0.1, 0.48, 0);
        const sail = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.68, 3), sailMat);
        sail.position.set(0.05, 0.56, 0);

        group.add(hull, mast, sail);
        return group;
    }

    static createSeagullFlock() {
        const group = new THREE.Group();
        const birdMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0, side: THREE.DoubleSide });
        const offsets = [[0, 0, 0], [-0.8, 0.25, -0.6], [0.75, -0.15, -0.7], [-1.4, 0.4, -1.3]];
        offsets.forEach(([bx, by, bz]) => {
            const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.03, 0.12), birdMat);
            wingL.position.set(bx - 0.14, by, bz);
            wingL.rotation.z = 0.25;
            const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.03, 0.12), birdMat);
            wingR.position.set(bx + 0.14, by, bz);
            wingR.rotation.z = -0.25;
            group.add(wingL, wingR);
        });
        return group;
    }
}

window.ProceduralModels = ProceduralModels;
