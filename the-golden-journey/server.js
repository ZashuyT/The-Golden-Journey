const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const PORT = process.env.PORT || 8090;
const ROOT = __dirname;
const ROOMS_DB_FILE = path.join(ROOT, "rooms_db.json");
const LIVE_URL_FILE = path.join(ROOT, "LINK_ONLINE_HIEN_TAI.txt");

// Prevent any unexpected socket/network error from crashing the server process
process.on("uncaughtException", (err) => {
    console.error("[UNCAUGHT EXCEPTION - KEPT ALIVE]", err && err.message ? err.message : err);
});
process.on("unhandledRejection", (reason) => {
    console.error("[UNHANDLED REJECTION - KEPT ALIVE]", reason);
});

let currentPublicUrl = "";
let tunnelProc = null;
let tunnelFailCount = 0;

function recordPublicUrl(url) {
    if (!url || url === currentPublicUrl) return;
    currentPublicUrl = url;
    tunnelFailCount = 0;
    console.log(`[CLOUDFLARE ONLINE TUNNEL READY] ${currentPublicUrl}`);
    try {
        const content = [
            "================================================================",
            "  THE GOLDEN JOURNEY (HANH TRINH VANG SON) - LINK CHOI ONLINE",
            "================================================================",
            "",
            `Link Online gửi cho bạn bè: ${currentPublicUrl}`,
            `Link trên máy chủ của bạn : http://localhost:${PORT}`,
            `Cập nhật lúc              : ${new Date().toLocaleString("vi-VN")}`,
            ""
        ].join("\r\n");
        fs.writeFileSync(LIVE_URL_FILE, content, "utf-8");
    } catch (e) {}
}

function startSelfHealingPublicTunnel() {
    // If deployed on Cloud (Render, Railway, Fly.io), no local tunnel needed
    if (process.env.RENDER_EXTERNAL_URL) {
        recordPublicUrl(process.env.RENDER_EXTERNAL_URL);
        return;
    }

    if (tunnelProc) {
        try { tunnelProc.kill(); } catch (e) {}
        tunnelProc = null;
    }

    const localCf = path.join(ROOT, "cloudflared.exe");
    const parentCf = path.join(ROOT, "..", "cloudflared.exe");
    const cloudflaredPath = fs.existsSync(localCf) ? localCf : parentCf;
    const useCloudflared = fs.existsSync(cloudflaredPath);

    try {
        if (useCloudflared) {
            tunnelProc = spawn(cloudflaredPath, [
                "tunnel",
                "--url", `http://localhost:${PORT}`,
                "--no-autoupdate",
                "--protocol", "http2"
            ], { windowsHide: true });

            const parseCfOutput = (chunk) => {
                const text = String(chunk || "");
                const matches = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/gi);
                if (matches && matches.length > 0) {
                    recordPublicUrl(matches[matches.length - 1]);
                }
            };

            tunnelProc.stdout.on("data", parseCfOutput);
            tunnelProc.stderr.on("data", parseCfOutput);

            tunnelProc.on("close", (code) => {
                console.log(`[ONLINE TUNNEL] cloudflared exited (${code}), reconnecting in 2s...`);
                tunnelProc = null;
                setTimeout(startSelfHealingPublicTunnel, 2000);
            });

            tunnelProc.on("error", (err) => {
                console.error("[ONLINE TUNNEL ERROR]", err.message);
            });
        } else {
            const args = [
                "-o", "StrictHostKeyChecking=no",
                "-o", "ServerAliveInterval=20",
                "-o", "ServerAliveCountMax=3",
                "-o", "ExitOnForwardFailure=yes",
                "-R", `80:localhost:${PORT}`,
                "nokey@localhost.run"
            ];
            tunnelProc = spawn("ssh", args, { windowsHide: true });

            const parseSshOutput = (chunk) => {
                const text = String(chunk || "");
                const matches = text.match(/https:\/\/[a-z0-9-]+\.lhr\.life/gi);
                if (matches && matches.length > 0) {
                    recordPublicUrl(matches[matches.length - 1]);
                }
            };

            tunnelProc.stdout.on("data", parseSshOutput);
            tunnelProc.stderr.on("data", parseSshOutput);

            tunnelProc.on("close", (code) => {
                console.log(`[ONLINE TUNNEL] SSH exited (${code}), reconnecting in 2s...`);
                tunnelProc = null;
                setTimeout(startSelfHealingPublicTunnel, 2000);
            });
        }
    } catch (e) {
        console.error("Failed to spawn public tunnel:", e.message);
    }
}

// Active Self-Healing Healthcheck every 35s:
// Keeps the tunnel warm AND automatically restarts cloudflared if Wi-Fi reconnects or PC wakes from sleep
setInterval(() => {
    if (!currentPublicUrl || process.env.RENDER_EXTERNAL_URL) return;
    try {
        const req = https.get(`${currentPublicUrl}/api/room/list`, { timeout: 8000 }, (res) => {
            res.resume();
            if (res.statusCode === 200) {
                tunnelFailCount = 0;
            } else {
                tunnelFailCount++;
                if (tunnelFailCount >= 3) {
                    console.log(`[ONLINE TUNNEL] Healthcheck status ${res.statusCode} x3 -> Restarting tunnel...`);
                    tunnelFailCount = 0;
                    startSelfHealingPublicTunnel();
                }
            }
        });
        req.on("error", () => {
            tunnelFailCount++;
            if (tunnelFailCount >= 3) {
                console.log("[ONLINE TUNNEL] Unreachable x3 after network change/sleep -> Restarting tunnel...");
                tunnelFailCount = 0;
                startSelfHealingPublicTunnel();
            }
        });
        req.on("timeout", () => {
            req.destroy();
        });
    } catch (e) {}
}, 35000);

const MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".svg": "image/svg+xml"
};

const rooms = new Map();

function loadRoomsFromDisk() {
    try {
        if (fs.existsSync(ROOMS_DB_FILE)) {
            const raw = fs.readFileSync(ROOMS_DB_FILE, "utf-8");
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) {
                const now = Date.now();
                arr.forEach(r => {
                    if (r && r.code && (now - (r.updatedAt || 0) < 12 * 3600 * 1000)) {
                        rooms.set(r.code, r);
                    }
                });
            }
        }
    } catch (e) {
        console.error("Failed to load rooms_db.json:", e.message);
    }
}

let saveTimer = null;
function saveRoomsToDisk() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
        try {
            const arr = Array.from(rooms.values());
            await fs.promises.writeFile(ROOMS_DB_FILE, JSON.stringify(arr), "utf-8");
        } catch (e) {
            console.error("Failed to save rooms_db.json:", e.message);
        }
    }, 600);
}

loadRoomsFromDisk();

function generateRoomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return rooms.has(code) ? generateRoomCode() : code;
}

function normalizeCode(raw) {
    return String(raw || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

const DEFAULT_ARCHETYPES = [
    { name: "Hải Đội Hồng Hà", vesselTitle: "Chiến Thuyền Lưỡng Long (Đỏ Thẫm)", color: "#ff2424" },
    { name: "Hải Đội Hạ Long", vesselTitle: "Thương Thuyền Ngọc Lục Bảo (Xanh Lá)", color: "#00e676" },
    { name: "Hải Đội Trường Sơn", vesselTitle: "Hải Thuyền Đại Dương (Xanh Lam)", color: "#00b0ff" },
    { name: "Hải Đội Cửu Long", vesselTitle: "Ghe Ngo Hoàng Kim (Vàng Rực)", color: "#ffea00" },
    { name: "Hải Đội Sài Gòn", vesselTitle: "Viễn Dương Hạm Tím Hoàng Gia", color: "#e040fb" }
];

function parseBody(req) {
    return new Promise((resolve) => {
        let body = "";
        req.on("data", chunk => { body += chunk; });
        req.on("end", () => {
            try { resolve(JSON.parse(body || "{}")); }
            catch { resolve({}); }
        });
    });
}

function sendJSON(res, status, payload) {
    res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    });
    res.end(JSON.stringify({ ...payload, publicUrl: currentPublicUrl }));
}

function finalizeRoomTurnOrder(room) {
    if (!room || !room.gameState || !room.gameState.players || !room.openingQuiz || !room.openingQuiz.quiz) return;
    if (room.openingQuiz.completed) return;

    const answers = room.openingAnswers || {};
    const quiz = room.openingQuiz.quiz;
    const correctIdx = quiz.correct;

    // Ensure every player has an answer entry
    room.gameState.players.forEach(p => {
        const key = p.clientId || `seat_${p.seatIndex}`;
        if (!answers[key]) {
            const fallbackChoice = p.isAI
                ? (Math.random() < 0.7 ? correctIdx : (correctIdx + 1) % 4)
                : 0;
            const fallbackTime = p.isAI
                ? Math.floor(3500 + Math.random() * 5200)
                : 19000;
            answers[key] = {
                clientId: key,
                playerName: p.name,
                chosenIdx: fallbackChoice,
                correct: fallbackChoice === correctIdx,
                elapsedMs: fallbackTime
            };
        }
    });

    // Sort players:
    // 1. Correct answers come BEFORE wrong answers
    // 2. Faster response time (smaller elapsedMs) comes FIRST!
    const playersWithStats = room.gameState.players.map(p => {
        const key = p.clientId || `seat_${p.seatIndex}`;
        const ans = answers[key];
        return {
            player: p,
            chosenIdx: ans.chosenIdx,
            correct: Boolean(ans.correct),
            elapsedMs: Number(ans.elapsedMs) || 15000
        };
    });

    playersWithStats.sort((a, b) => {
        if (a.correct !== b.correct) {
            return a.correct ? -1 : 1;
        }
        return a.elapsedMs - b.elapsedMs;
    });

    const rankings = [];
    const sortedPlayers = playersWithStats.map((item, newTurnIdx) => {
        const p = item.player;
        p.id = newTurnIdx;
        p.turnRank = newTurnIdx + 1;
        rankings.push({
            rank: newTurnIdx + 1,
            name: p.name,
            vesselTitle: p.vesselTitle,
            color: p.color,
            isAI: p.isAI,
            clientId: p.clientId,
            chosenIdx: item.chosenIdx,
            correct: item.correct,
            elapsedMs: item.elapsedMs
        });
        return p;
    });

    room.gameState.players = sortedPlayers;
    room.gameState.activePlayerIdx = 0;
    room.openingQuiz.rankings = rankings;
    room.openingQuiz.completed = true;
}

http.createServer(async (req, res) => {
    if (req.method === "OPTIONS") {
        return sendJSON(res, 200, { ok: true });
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const urlPath = decodeURIComponent(parsedUrl.pathname);

    // 1. CREATE ROOM
    if (urlPath === "/api/room/create" && req.method === "POST") {
        const body = await parseBody(req);
        const code = generateRoomCode();
        const clientId = body.clientId || ("client_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7));
        const hostName = (body.hostName || body.playerName || DEFAULT_ARCHETYPES[0].name).trim();

        const seats = DEFAULT_ARCHETYPES.map((arch, idx) => ({
            seatIndex: idx,
            name: idx === 0 ? hostName : "Đang chờ người chơi...",
            vesselTitle: arch.vesselTitle,
            color: arch.color,
            type: idx === 0 ? "human" : "empty",
            clientId: idx === 0 ? clientId : null,
            occupiedBy: idx === 0 ? `${hostName} (Chủ Phòng)` : null,
            isHost: idx === 0
        }));

        const room = {
            code,
            hostClientId: clientId,
            hostName,
            status: "waiting", // 'waiting' | 'turn_order_quiz' | 'playing'
            seats,
            version: 1,
            openingQuiz: null,
            openingAnswers: {},
            gameState: null,
            updatedAt: Date.now()
        };
        rooms.set(code, room);
        saveRoomsToDisk();
        return sendJSON(res, 200, { ok: true, room, assignedSeat: 0, clientId });
    }

    // 2. JOIN ROOM BY 6-CHAR CODE
    if (urlPath === "/api/room/join" && req.method === "POST") {
        const body = await parseBody(req);
        const code = normalizeCode(body.code);
        const clientId = body.clientId || ("client_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7));
        const playerName = (body.playerName || "Thuyền Trưởng Khách").trim();

        const room = rooms.get(code);
        if (!room) {
            return sendJSON(res, 404, {
                ok: false,
                error: `Không tìm thấy phòng có mã [${code || "TRỐNG"}]! Vui lòng kiểm tra lại mã 6 ký tự từ Chủ phòng.`
            });
        }

        const existingSeat = room.seats.find(s => s.clientId && s.clientId === clientId);
        if (existingSeat) {
            if (playerName) {
                existingSeat.name = playerName;
                existingSeat.occupiedBy = existingSeat.isHost ? `${playerName} (Chủ Phòng)` : `${playerName} (Người chơi)`;
            }
            room.version++;
            room.updatedAt = Date.now();
            saveRoomsToDisk();
            return sendJSON(res, 200, { ok: true, room, assignedSeat: existingSeat.seatIndex, clientId });
        }

        if (room.status !== "waiting") {
            // Allow returning player who reloaded the page (F5) or re-entered by name to seamlessly reconnect!
            const seatByName = room.seats.find(s =>
                s.type === "human" &&
                s.name &&
                playerName &&
                s.name.toLowerCase() === playerName.toLowerCase()
            ) || room.seats.find(s => s.type === "human" && !s.isHost);

            if (seatByName) {
                const oldClientId = seatByName.clientId;
                seatByName.clientId = clientId;
                if (room.gameState && Array.isArray(room.gameState.players)) {
                    const gp = room.gameState.players.find(
                        p => p.clientId === oldClientId || p.seatIndex === seatByName.seatIndex
                    );
                    if (gp) gp.clientId = clientId;
                }
                room.version++;
                room.updatedAt = Date.now();
                saveRoomsToDisk();
                return sendJSON(res, 200, { ok: true, room, assignedSeat: seatByName.seatIndex, clientId, reconnected: true });
            }

            return sendJSON(res, 400, {
                ok: false,
                error: `Phòng [${code}] đã bắt đầu trận đấu rồi!`
            });
        }

        const targetSeat = room.seats.find(s => s.type === "empty");
        if (!targetSeat) {
            return sendJSON(res, 400, {
                ok: false,
                error: `Phòng [${code}] hiện đã đầy 5/5 vị trí! Hãy nhờ Chủ phòng xóa bớt Bot để lấy slot trống.`
            });
        }

        targetSeat.type = "human";
        targetSeat.name = playerName || DEFAULT_ARCHETYPES[targetSeat.seatIndex].name;
        targetSeat.clientId = clientId;
        targetSeat.occupiedBy = `${targetSeat.name} (Người chơi)`;

        room.version++;
        room.updatedAt = Date.now();
        saveRoomsToDisk();
        return sendJSON(res, 200, { ok: true, room, assignedSeat: targetSeat.seatIndex, clientId });
    }

    // 3. UPDATE SEAT
    if (urlPath === "/api/room/update-seat" && req.method === "POST") {
        const body = await parseBody(req);
        const code = normalizeCode(body.code);
        const room = rooms.get(code);
        if (!room) return sendJSON(res, 404, { ok: false, error: "Không tìm thấy phòng!" });

        const seatIdx = Number(body.seatIndex);
        const seat = room.seats[seatIdx];
        if (!seat) return sendJSON(res, 400, { ok: false, error: "Slot không hợp lệ!" });

        const action = body.action;
        if (action === "add_bot") {
            const arch = DEFAULT_ARCHETYPES[seatIdx] || DEFAULT_ARCHETYPES[1];
            seat.type = "ai";
            seat.name = `${arch.name} (Bot)`;
            seat.clientId = `bot_seat_${seatIdx}`;
            seat.occupiedBy = "Máy (Bot AI)";
        } else if (action === "clear_seat" && seatIdx > 0) {
            seat.type = "empty";
            seat.name = "Đang chờ người chơi...";
            seat.clientId = null;
            seat.occupiedBy = null;
        }

        room.version++;
        room.updatedAt = Date.now();
        saveRoomsToDisk();
        return sendJSON(res, 200, { ok: true, room });
    }

    // 4. LEAVE ROOM
    if (urlPath === "/api/room/leave" && req.method === "POST") {
        const body = await parseBody(req);
        const code = normalizeCode(body.code);
        const clientId = body.clientId;
        const room = rooms.get(code);
        if (room) {
            const seat = room.seats.find(s => s.clientId === clientId);
            if (seat && seat.seatIndex > 0) {
                seat.type = "empty";
                seat.name = "Đang chờ người chơi...";
                seat.clientId = null;
                seat.occupiedBy = null;
                room.version++;
                room.updatedAt = Date.now();
                saveRoomsToDisk();
            }
        }
        return sendJSON(res, 200, { ok: true });
    }

    // 5. LIST ACTIVE WAITING ROOMS
    if (urlPath === "/api/room/list" && req.method === "GET") {
        const now = Date.now();
        const waitingRooms = [];
        rooms.forEach((r) => {
            if (now - (r.updatedAt || 0) < 2 * 3600 * 1000 && r.status === "waiting") {
                const activeCount = r.seats.filter(s => s.type === "human" || s.type === "ai").length;
                const emptyCount = r.seats.filter(s => s.type === "empty").length;
                waitingRooms.push({
                    code: r.code,
                    hostName: r.seats[0] ? r.seats[0].name : r.hostName,
                    activeCount,
                    emptyCount,
                    updatedAt: r.updatedAt
                });
            }
        });
        waitingRooms.sort((a, b) => b.updatedAt - a.updatedAt);
        return sendJSON(res, 200, { ok: true, rooms: waitingRooms.slice(0, 10) });
    }

    // 6. START ROOM -> LAUNCHES PHASE 0: OPENING TURN-ORDER SPEED QUIZ FOR ALL PLAYERS!
    if (urlPath === "/api/room/start" && req.method === "POST") {
        const body = await parseBody(req);
        const code = normalizeCode(body.code);
        const room = rooms.get(code);
        if (!room) return sendJSON(res, 404, { ok: false, error: "Không tìm thấy phòng!" });

        const activeSeats = room.seats.filter(s => s.type === "human" || s.type === "ai");
        if (activeSeats.length < 2) {
            return sendJSON(res, 400, {
                ok: false,
                error: "Cần tối thiểu 2 vị trí (Người chơi hoặc Bot AI) trong phòng để bắt đầu ván đấu!"
            });
        }

        const quizObj = (body.openingQuiz && body.openingQuiz.quiz) ? body.openingQuiz.quiz : body.openingQuiz;

        room.status = "turn_order_quiz";
        room.gameState = body.gameState || null;
        room.openingQuiz = {
            quiz: quizObj,
            startedAt: Date.now(),
            completed: false,
            rankings: []
        };
        room.openingAnswers = {};

        // Pre-populate simulated Bot AI response times so Bots also compete fairly in the turn-order race
        if (room.gameState && Array.isArray(room.gameState.players) && quizObj) {
            const correctIdx = quizObj.correct;
            room.gameState.players.forEach(p => {
                if (p.isAI) {
                    const key = p.clientId || `seat_${p.seatIndex}`;
                    const botIsCorrect = Math.random() < 0.72;
                    const botChoice = botIsCorrect ? correctIdx : ((correctIdx + 1 + Math.floor(Math.random() * 3)) % 4);
                    const botTimeMs = Math.floor(3400 + Math.random() * 5200);
                    room.openingAnswers[key] = {
                        clientId: key,
                        playerName: p.name,
                        chosenIdx: botChoice,
                        correct: botIsCorrect,
                        elapsedMs: botTimeMs
                    };
                }
            });
        }

        room.version++;
        room.updatedAt = Date.now();
        saveRoomsToDisk();
        return sendJSON(res, 200, { ok: true, room });
    }

    // 7. SUBMIT ANSWER TO OPENING TURN-ORDER SPEED QUIZ
    if (urlPath === "/api/room/opening-answer" && req.method === "POST") {
        const body = await parseBody(req);
        const code = normalizeCode(body.code);
        const room = rooms.get(code);
        if (!room) return sendJSON(res, 404, { ok: false, error: "Room not found" });

        const clientId = body.clientId || `seat_${body.seatIndex}`;
        const chosenIdx = Number(body.chosenIdx);
        const elapsedMs = Math.max(100, Number(body.elapsedMs) || 5000);
        const quizObj = room.openingQuiz ? room.openingQuiz.quiz : null;

        if (clientId && quizObj && !room.openingAnswers[clientId]) {
            const p = (room.gameState && room.gameState.players)
                ? room.gameState.players.find(pl => pl.clientId === clientId || pl.seatIndex === body.seatIndex)
                : null;
            const key = (p && p.clientId) ? p.clientId : clientId;
            room.openingAnswers[key] = {
                clientId: key,
                playerName: p ? p.name : "Thuyền Trưởng",
                chosenIdx,
                correct: chosenIdx === quizObj.correct,
                elapsedMs
            };

            // Build partial rankings so early finishers immediately see their speed entry
            const partialList = Object.values(room.openingAnswers).map((ans) => {
                const pl = (room.gameState && room.gameState.players)
                    ? room.gameState.players.find(x => x.clientId === ans.clientId)
                    : null;
                return {
                    name: ans.playerName,
                    color: pl ? pl.color : "#c59b27",
                    isAI: pl ? pl.isAI : false,
                    correct: ans.correct,
                    elapsedMs: ans.elapsedMs
                };
            });
            partialList.sort((a, b) => {
                if (a.correct !== b.correct) return a.correct ? -1 : 1;
                return a.elapsedMs - b.elapsedMs;
            });
            room.openingQuiz.rankings = partialList.map((item, i) => ({ ...item, rank: i + 1 }));
        }

        // Check if all human players have answered
        const humanPlayers = (room.gameState && room.gameState.players)
            ? room.gameState.players.filter(pl => !pl.isAI)
            : [];
        const allHumansAnswered = humanPlayers.every(pl => {
            const key = pl.clientId || `seat_${pl.seatIndex}`;
            return Boolean(room.openingAnswers[key]);
        });

        if (allHumansAnswered || body.forceFinalize) {
            finalizeRoomTurnOrder(room);
        }

        room.version++;
        room.updatedAt = Date.now();
        saveRoomsToDisk();
        return sendJSON(res, 200, { ok: true, room });
    }

    // 8. BEGIN ACTUAL BOARD PLAY AFTER TURN-ORDER QUIZ LEADERBOARD
    if (urlPath === "/api/room/begin-play" && req.method === "POST") {
        const body = await parseBody(req);
        const code = normalizeCode(body.code);
        const room = rooms.get(code);
        if (!room) return sendJSON(res, 404, { ok: false, error: "Room not found" });

        if (room.openingQuiz && !room.openingQuiz.completed) {
            finalizeRoomTurnOrder(room);
        }
        room.status = "playing";
        if (body.gameState) {
            room.gameState = body.gameState;
        }
        room.version++;
        room.updatedAt = Date.now();
        saveRoomsToDisk();
        return sendJSON(res, 200, { ok: true, room });
    }

    // 9. SYNC LIVE GAME STATE
    if (urlPath === "/api/room/sync" && req.method === "POST") {
        const body = await parseBody(req);
        const code = normalizeCode(body.code);
        const room = rooms.get(code);
        if (!room) return sendJSON(res, 404, { ok: false, error: "Room not found" });

        if (body.gameState) {
            room.gameState = body.gameState;
            room.version++;
            room.updatedAt = Date.now();
            saveRoomsToDisk();
        }
        return sendJSON(res, 200, { ok: true, version: room.version });
    }

    // 10. POLL ROOM STATUS (WITH LIGHTWEIGHT VERSION DELTA CHECK)
    if (urlPath === "/api/room/status" && req.method === "GET") {
        const code = normalizeCode(parsedUrl.searchParams.get("code"));
        const clientVersion = Number(parsedUrl.searchParams.get("v") || 0);
        const room = rooms.get(code);
        if (!room) return sendJSON(res, 404, { ok: false, error: "Không tìm thấy phòng!" });
        if (clientVersion > 0 && clientVersion === room.version) {
            return sendJSON(res, 200, { ok: true, unchanged: true, version: room.version });
        }
        return sendJSON(res, 200, { ok: true, room });
    }

    // STATIC FILES
    let staticPath = urlPath === "/" ? "/index.html" : urlPath;
    const filePath = path.join(ROOT, staticPath);

    if (!filePath.startsWith(ROOT)) {
        res.writeHead(403);
        return res.end("Forbidden");
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            return res.end("Not found");
        }
        const ext = path.extname(filePath).toLowerCase();
        const isImage = ext === ".jpg" || ext === ".jpeg" || ext === ".png" || ext === ".svg";
        res.writeHead(200, {
            "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
            "Cache-Control": isImage ? "public, max-age=3600" : "no-cache"
        });
        res.end(data);
    });
}).listen(PORT, () => {
    console.log(`The Golden Journey V3.3 Server running at http://localhost:${PORT}`);
    startSelfHealingPublicTunnel();
});
