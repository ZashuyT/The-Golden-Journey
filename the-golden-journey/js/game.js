// ============================================================================
// THE GOLDEN JOURNEY (HÀNH TRÌNH VÀNG SON) — V3.2 SHARED-MAP MULTIPLAYER ENGINE
// - Removed Tidal & River Estuary mechanics for cleaner, pure coastal navigation
// - True Shared-Map Multiplayer: 1 Ship per Player on 1 Synchronized 3D Board
// - Opening Speed Quiz (Đầu trận câu hỏi xếp thứ tự lượt chơi theo tốc độ trả lời + Ảnh minh họa)
// - Auto-End Turn when AP reaches 0 (or manual End Turn button)
// - Free Spectator Camera during other players' turns + Live Shared Quiz Broadcast
//   (All players see quizzes & Visual Memory Cards live; only active player can click A/B/C/D)
// ============================================================================

class GoldenJourneyGame {
    constructor() {
        this.players = [];
        this.activePlayerIdx = 0;
        this.roundNumber = 1;
        this.monumentAssignments = {};
        this.isBusy = false;
        this.isGameStarted = false;

        // Unique client ID per browser tab so multiple tabs or devices never collide
        this.clientId = sessionStorage.getItem("golden_journey_client_id");
        if (!this.clientId) {
            this.clientId = "cj_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
            sessionStorage.setItem("golden_journey_client_id", this.clientId);
        }

        // Rare Golden/Silver Axe NPC Spawner state (Spawns every 4-5 rounds!)
        this.nextNPCSpawnRound = 4;

        // Shared Maritime Market Floor
        this.marketListings = [];
        this.nextListingId = 1;

        // Live Shared Quiz Broadcast state (synced to all players in room)
        this.liveQuizState = null;
        this.showingSpectatorQuizId = null;

        // Opening Turn-Order Speed Quiz state
        this.openingQuizState = null;
        this.openingQuizStartMs = 0;
        this.openingTimerInterval = null;
        this.hasSubmittedOpeningAnswer = false;
        this.localOpeningChoice = null;
        this.localOpeningElapsedMs = 0;

        // Auto-end turn timer guard
        this.autoEndTurnTimer = null;

        // Multiplayer Room & Waiting Screen State
        this.roomState = {
            code: null,
            isHost: false,
            localPlayerName: localStorage.getItem("golden_player_name") || "Thuyền Trưởng Hồng Hà",
            localSeatIdx: 0,
            status: "waiting", // 'waiting' | 'turn_order_quiz' | 'playing'
            seats: this.createEmptyLobbySeats(),
            version: 0
        };
        this.openRoomsList = [];
        this.roomPollTimer = null;
        this.openRoomsPollTimer = null;
        this.cleanUIMode = false;

        // Cross-tab instant synchronization channel
        try {
            this.roomChannel = new BroadcastChannel("golden_journey_v3_room");
            this.roomChannel.onmessage = (ev) => this.handleRoomBroadcast(ev.data);
        } catch (e) {
            this.roomChannel = null;
        }

        // Initialize 3D Ocean & Board Vista in the background
        this.world = new World3D(
            "canvas-container",
            (tile) => this.handleHexClick(tile),
            (tile, x, y) => this.handleHexHover(tile, x, y)
        );
        this.monumentAssignments = this.randomizeMonumentTiers();
        this.world.buildBoard(this.monumentAssignments);
        this.world.startRenderLoop();

        this.bindUIEvents();

        // Check if URL has ?room=XXXXXX invite parameter or active session room on reload (F5)
        const params = new URLSearchParams(window.location.search);
        const urlRoomCode = (params.get("room") || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
        const sessionRoomCode = (sessionStorage.getItem("golden_active_room_code") || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
        this.prefilledRoomCode = urlRoomCode || sessionRoomCode || "";

        // Show Pre-Game Waiting Screen (Do NOT enter match until started!)
        this.showWaitingScreen();

        // If player reloaded (F5) while inside an active room, automatically reconnect them!
        if (sessionRoomCode && sessionRoomCode.length >= 4) {
            setTimeout(() => {
                this.joinMultiplayerRoomByCode(sessionRoomCode);
            }, 250);
        }
    }

    createEmptyLobbySeats() {
        return window.GAME_DATA.shipArchetypes.map((arch, idx) => ({
            seatIndex: idx,
            name: idx === 0 ? "Thuyền Trưởng Hồng Hà" : "Đang chờ người chơi...",
            vesselTitle: arch.vesselTitle,
            color: arch.color,
            type: idx === 0 ? "human" : "empty", // Slot 1 = Host, Slots 2-5 = Empty!
            clientId: idx === 0 ? this.clientId : null,
            occupiedBy: idx === 0 ? "Chủ Phòng" : null,
            isHost: idx === 0
        }));
    }

    // ========================================================================
    // TURN OWNERSHIP & PLAYER IDENTITY HELPERS (SHARED MAP MULTIPLAYER)
    // ========================================================================
    getLocalPlayer() {
        if (!this.players || this.players.length === 0) return null;
        if (this.roomState.code) {
            const byClient = this.players.find(p => p.clientId === this.clientId);
            if (byClient) return byClient;
            const bySeat = this.players.find(p => p.seatIndex === this.roomState.localSeatIdx);
            if (bySeat) return bySeat;
        }
        return this.players.find(p => !p.isAI) || this.players[0];
    }

    isMyTurn() {
        if (!this.isGameStarted) return false;
        if (this.roomState.code && this.roomState.status !== "playing") return false;
        const active = this.getActivePlayer();
        if (!active || active.isAI || active.eliminated) return false;
        if (!this.roomState.code) {
            // Offline mode: local player controls human turns
            return true;
        }
        return active.clientId === this.clientId || active.seatIndex === this.roomState.localSeatIdx;
    }

    isModalOpen() {
        const overlay = document.getElementById("modal-overlay");
        return overlay && !overlay.classList.contains("hidden");
    }

    // ========================================================================
    // PRE-GAME WAITING SCREEN & ONLINE MULTIPLAYER ROOM LOBBY
    // ========================================================================
    showWaitingScreen() {
        this.isGameStarted = false;
        clearInterval(this.openingTimerInterval);
        clearTimeout(this.autoEndTurnTimer);
        document.getElementById("waiting-screen-overlay").classList.remove("hidden");
        document.getElementById("top-hud-bar").classList.add("hidden-hud");
        document.getElementById("left-hud-panel").classList.add("hidden-hud");
        document.getElementById("right-hud-panel").classList.add("hidden-hud");

        this.renderWaitingScreen();
        this.startOpenRoomsPolling();
    }

    hideWaitingScreenAndShowHUD() {
        this.isGameStarted = true;
        clearInterval(this.openRoomsPollTimer);
        document.getElementById("waiting-screen-overlay").classList.add("hidden");
        document.getElementById("top-hud-bar").classList.remove("hidden-hud");
        document.getElementById("left-hud-panel").classList.remove("hidden-hud");
        document.getElementById("right-hud-panel").classList.remove("hidden-hud");
        this.updateRoomBadgeUI();
    }

    renderWaitingScreen() {
        const container = document.getElementById("waiting-screen-body");
        if (!container) return;

        const curHostNameInput = document.getElementById("wait-host-name");
        const curJoinNameInput = document.getElementById("wait-join-name");
        const curJoinCodeInput = document.getElementById("wait-join-code");
        if (curHostNameInput && curHostNameInput.value) {
            this.roomState.localPlayerName = curHostNameInput.value;
        }
        const savedJoinName = (curJoinNameInput && curJoinNameInput.value) || this.roomState.localPlayerName;
        const savedJoinCode = (curJoinCodeInput && curJoinCodeInput.value) || this.prefilledRoomCode || "";

        // VIEW 1: NOT IN A ROOM YET
        if (!this.roomState.code) {
            const openRoomsHtml = this.openRoomsList.length === 0
                ? `<div style="color:#8899ac; font-size:12.5px; font-style:italic">Hiện chưa có phòng nào đang mở sẵn. Bạn hãy nhấn <strong>"Tạo Phòng Chơi Mới"</strong> ở khung bên trái để lấy Mã Code nhé!</div>`
                : this.openRoomsList.map(r => `
                    <div class="open-room-row">
                        <div>
                            <strong style="color:#e5c365; font-size:14px; letter-spacing:1px">🔑 Mã Phòng: ${r.code}</strong>
                            <span style="font-size:12.5px; color:#cbd5e1; margin-left:10px">
                                • Chủ phòng: <strong>${r.hostName}</strong> • Đang có: <strong style="color:#88c09c">${r.activeCount}/5</strong> (Còn ${r.emptyCount} ghế trống)
                            </span>
                        </div>
                        <button class="btn-trade-action gold" onclick="window.GAME.quickJoinRoomCode('${r.code}')">
                            🚪 Vào Phòng ${r.code}
                        </button>
                    </div>
                `).join("");

            container.innerHTML = `
                <div class="waiting-home-grid">
                    <!-- BOX 1: CREATE ROOM (HOST) -->
                    <div class="waiting-box-card">
                        <div>
                            <h3>1. ⚓ Tạo Phòng Chơi Mới (Chủ Phòng)</h3>
                            <p>
                                Tạo một phòng chơi mới với <strong>Mã Code 6 ký tự</strong>. Mỗi người chơi điều khiển <strong>1 thuyền riêng trên cùng 1 bản đồ chung</strong>, xếp lượt xuất phát bằng Câu Hỏi Tốc Độ đầu trận!
                            </p>
                            <div class="waiting-form-group">
                                <label>Tên Thuyền Trưởng Của Bạn:</label>
                                <input type="text" id="wait-host-name" class="waiting-input" 
                                    placeholder="Nhập tên của bạn..." value="${this.roomState.localPlayerName}" />
                            </div>
                        </div>
                        <button class="btn-waiting-large" onclick="window.GAME.createMultiplayerRoom()">
                            ✨ Tạo Phòng Chơi Mới (Lấy Mã Code)
                        </button>
                    </div>

                    <!-- BOX 2: JOIN EXISTING ROOM BY CODE -->
                    <div class="waiting-box-card">
                        <div>
                            <h3>2. 🚪 Vào Phòng Của Người Khác Bằng Mã Code</h3>
                            <p>
                                Nhập <strong>Mã Phòng 6 ký tự</strong> do Chủ phòng gửi để nhận thuyền của bạn và tham gia vào bản đồ chung với bạn bè.
                            </p>
                            <div class="waiting-form-group">
                                <label>Tên Thuyền Trưởng Của Bạn:</label>
                                <input type="text" id="wait-join-name" class="waiting-input" 
                                    placeholder="Nhập tên của bạn..." value="${savedJoinName}" />
                            </div>
                            <div class="waiting-form-group">
                                <label>Mã Phòng (6 Ký Tự):</label>
                                <input type="text" id="wait-join-code" class="waiting-input code-big-input" 
                                    maxlength="8" placeholder="NHẬP MÃ..." value="${savedJoinCode}" />
                            </div>
                        </div>
                        <button class="btn-waiting-large teal" onclick="window.GAME.joinMultiplayerRoomByCode()">
                            🔗 Nhập Mã &amp; Vào Phòng Ngay
                        </button>
                    </div>
                </div>

                <!-- ACTIVE WAITING ROOMS ON SERVER -->
                <div class="open-rooms-section">
                    <div class="open-rooms-header" style="flex-wrap:wrap; gap:8px">
                        <span>🌐 Link Online Cho Bạn Bè Ở Xa: <strong id="public-online-url-label" style="color:#e5c365">${this.publicOnlineUrl || 'Đang khởi tạo link...'}</strong></span>
                        <div style="display:flex; gap:6px">
                            <button class="btn-trade-action gold" style="padding:3px 9px; font-size:11px" onclick="window.GAME.copyPublicOnlineUrl()">📋 Sao Chép Link Online</button>
                            <button class="btn-trade-action" style="padding:3px 9px; font-size:11px" onclick="window.GAME.fetchOpenRoomsList()">🔄 Làm mới</button>
                        </div>
                    </div>
                    <div id="open-rooms-list-box">
                        ${openRoomsHtml}
                    </div>
                </div>

                <!-- FOOTER QUICK ACTIONS -->
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; padding-top:6px; border-top:1px solid rgba(148,163,184,0.2)">
                    <div style="display:flex; gap:8px">
                        <button class="btn-secondary" onclick="window.GAME.openAtlasModal()">🗺️ Xem Cẩm Nang 6 Vùng</button>
                        <button class="btn-secondary" onclick="window.GAME.openRulebookModal()">📜 Xem Luật Chơi</button>
                    </div>
                    <button class="btn-trade-action" onclick="window.GAME.startQuickSinglePlayerWithBots()">
                        ⚡ Chơi Thử Nhanh 1 Mình Với 3 Bot AI
                    </button>
                </div>
            `;
            return;
        }

        // VIEW 2: INSIDE A ROOM LOBBY
        const seats = this.roomState.seats || [];
        const activeSeats = seats.filter(s => s.type === "human" || s.type === "ai");
        const canStart = activeSeats.length >= 2 && activeSeats.length <= 5;

        const slotsHtml = seats.map((seat, idx) => {
            const isLocalSeat = (idx === this.roomState.localSeatIdx);
            const arch = window.GAME_DATA.shipArchetypes[idx] || window.GAME_DATA.shipArchetypes[0];

            let statusPill = "";
            let actionButtons = "";
            let cardClass = "slot-empty";
            let titleDisplay = "";

            if (seat.type === "human") {
                cardClass = "slot-human";
                titleDisplay = `👤 ${seat.name} ${seat.isHost ? '<span style="color:#e5c365">(Chủ Phòng)</span>' : ''} ${isLocalSeat ? '<span style="color:#88c09c">[Thuyền của bạn]</span>' : ''}`;
                statusPill = `<span class="slot-status-pill human">🟢 Đã nhận thuyền</span>`;
                if (this.roomState.isHost && idx > 0) {
                    actionButtons = `
                        <button class="btn-trade-action" style="background:#7f2d2d; border-color:#c96562" onclick="window.GAME.hostClearSeat(${idx})">
                            ✖ Mời ra / Để trống
                        </button>
                    `;
                }
            } else if (seat.type === "ai") {
                cardClass = "slot-ai";
                titleDisplay = `🤖 ${seat.name}`;
                statusPill = `<span class="slot-status-pill ai">🤖 Máy (Bot AI)</span>`;
                if (this.roomState.isHost) {
                    actionButtons = `
                        <button class="btn-trade-action" style="background:#475569; border-color:#94a3b8" onclick="window.GAME.hostClearSeat(${idx})">
                            🗑️ Xóa Bot (Để trống cho người vào)
                        </button>
                    `;
                }
            } else {
                cardClass = "slot-empty";
                titleDisplay = `🪑 Slot ${idx + 1} Đang Trống — Chờ người chơi nhập mã [${this.roomState.code}] vào...`;
                statusPill = `<span class="slot-status-pill empty">⏳ Đang trống</span>`;
                if (this.roomState.isHost) {
                    actionButtons = `
                        <button class="btn-trade-action gold" onclick="window.GAME.hostAddBotToSeat(${idx})">
                            🤖 + Thêm Bot AI Vào Slot Này
                        </button>
                    `;
                }
            }

            return `
                <div class="slot-card ${cardClass}">
                    <div class="slot-left-info">
                        <div class="slot-badge-num" style="background:${arch.color}">#${idx + 1}</div>
                        <div>
                            <div class="slot-player-title">${titleDisplay}</div>
                            <div class="slot-vessel-sub">Chiến thuyền riêng: ${arch.vesselTitle} – ${arch.desc}</div>
                        </div>
                    </div>
                    <div class="slot-actions-right">
                        ${statusPill}
                        ${actionButtons}
                    </div>
                </div>
            `;
        }).join("");

        container.innerHTML = `
            <div class="room-header-banner">
                <div>
                    <div style="font-size:12px; color:#c2cedb; text-transform:uppercase; font-weight:700">
                        🔑 Mã Phòng Chơi Online (Gửi mã này cho bạn bè nhập vào cùng 1 map):
                    </div>
                    <div style="display:flex; align-items:center; gap:14px; margin-top:4px">
                        <span class="room-code-huge">${this.roomState.code}</span>
                        <span style="font-size:12.5px; color:#98d4b0; background:rgba(63,122,88,0.25); padding:4px 10px; border-radius:999px; border:1px solid #579b73">
                            🟢 Đang mở phòng chờ (${activeSeats.length}/5 Hải đội)
                        </span>
                    </div>
                </div>
                <div style="display:flex; gap:8px; flex-wrap:wrap">
                    <button class="btn-trade-action gold" onclick="window.GAME.copyRoomCode()">📋 Sao Chép Mã Phòng</button>
                    <button class="btn-trade-action" onclick="window.GAME.copyInviteLink()">🔗 Sao Chép Link Mời Bạn Bè</button>
                    <button class="btn-secondary" style="padding:6px 12px" onclick="window.GAME.leaveMultiplayerRoom()">⬅️ Rời Phòng</button>
                </div>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px">
                <h3 style="font-size:14.5px; color:#e5c365; text-transform:uppercase">
                    👥 Danh Sách 5 Thuyền Trong Phòng (Mỗi người 1 thuyền trên 1 Bản Đồ Chung)
                </h3>
                <span style="font-size:12.5px; font-weight:700; color:${canStart ? '#98d4b0' : '#ebb0ae'}">
                    ${canStart
                        ? `✅ Đã đủ điều kiện khởi hành (${activeSeats.length}/5 Hải đội)`
                        : `⚠️ Mới có ${activeSeats.length}/5 Hải đội — Hãy đợi bạn bè vào hoặc bấm "+ Thêm Bot AI"`
                    }
                </span>
            </div>

            <div class="slots-list-grid">
                ${slotsHtml}
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; padding-top:10px; border-top:1px solid rgba(148,163,184,0.25)">
                <div style="font-size:12.5px; color:#a6b4c4">
                    ${this.roomState.isHost
                        ? `💡 <strong>Bạn là Chủ phòng:</strong> Khi nhấn Bắt đầu, tất cả người chơi sẽ cùng trả lời <strong>1 Câu Hỏi Tốc Độ Đầu Trận</strong> để xếp thứ tự lượt đi!`
                        : `⏳ <strong>Bạn điều khiển Thuyền #${this.roomState.localSeatIdx + 1}:</strong> Khi Chủ phòng bắt đầu, bạn sẽ thi trả lời nhanh Câu Hỏi Đầu Trận để giành quyền đi trước!`
                    }
                </div>
                ${this.roomState.isHost ? `
                    <button class="btn-waiting-large" style="width:auto; min-width:300px" ${canStart ? '' : 'disabled'} onclick="window.GAME.startRoomGameSession()">
                        🚀 BẮT ĐẦU &amp; THI XẾP LƯỢT ĐẦU TRẬN (${activeSeats.length} THUYỀN)
                    </button>
                ` : `
                    <div style="background:rgba(43,92,114,0.35); border:1px solid #6aa9bd; color:#d6ecf2; padding:10px 18px; border-radius:9px; font-weight:700; font-size:13.5px">
                        ⏳ Đang chờ Chủ phòng bắt đầu trận đấu...
                    </div>
                `}
            </div>
        `;
    }

    startOpenRoomsPolling() {
        clearInterval(this.openRoomsPollTimer);
        this.fetchOpenRoomsList();
        this.openRoomsPollTimer = setInterval(() => {
            if (!this.isGameStarted && !this.roomState.code) {
                this.fetchOpenRoomsList();
            }
        }, 2500);
    }

    async fetchOpenRoomsList() {
        try {
            const resp = await fetch("/api/room/list");
            const data = await resp.json();
            if (data && data.publicUrl) {
                this.publicOnlineUrl = data.publicUrl;
                const urlLbl = document.getElementById("public-online-url-label");
                if (urlLbl) urlLbl.textContent = this.publicOnlineUrl;
            }
            if (data && data.ok && Array.isArray(data.rooms)) {
                this.openRoomsList = data.rooms;
                const listBox = document.getElementById("open-rooms-list-box");
                if (listBox && !this.roomState.code) {
                    if (this.openRoomsList.length === 0) {
                        listBox.innerHTML = `<div style="color:#8899ac; font-size:12.5px; font-style:italic">Hiện chưa có phòng nào đang mở sẵn. Bạn hãy nhấn <strong>"Tạo Phòng Chơi Mới"</strong> ở khung bên trái để lấy Mã Code nhé!</div>`;
                    } else {
                        listBox.innerHTML = this.openRoomsList.map(r => `
                            <div class="open-room-row">
                                <div>
                                    <strong style="color:#e5c365; font-size:14px; letter-spacing:1px">🔑 Mã Phòng: ${r.code}</strong>
                                    <span style="font-size:12.5px; color:#cbd5e1; margin-left:10px">
                                        • Chủ phòng: <strong>${r.hostName}</strong> • Đang có: <strong style="color:#88c09c">${r.activeCount}/5</strong> (Còn ${r.emptyCount} ghế trống)
                                    </span>
                                </div>
                                <button class="btn-trade-action gold" onclick="window.GAME.quickJoinRoomCode('${r.code}')">
                                    🚪 Vào Phòng ${r.code}
                                </button>
                            </div>
                        `).join("");
                    }
                }
            }
        } catch (e) {}
    }

    quickJoinRoomCode(code) {
        const codeInput = document.getElementById("wait-join-code");
        if (codeInput) codeInput.value = code;
        this.joinMultiplayerRoomByCode(code);
    }

    async createMultiplayerRoom() {
        const nameInput = document.getElementById("wait-host-name");
        const hostName = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : "Thuyền Trưởng Hồng Hà";
        this.roomState.localPlayerName = hostName;
        localStorage.setItem("golden_player_name", hostName);

        try {
            const resp = await fetch("/api/room/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ hostName, clientId: this.clientId })
            });
            const data = await resp.json();
            if (data && data.ok && data.room) {
                this.roomState.code = data.room.code;
                this.roomState.isHost = true;
                this.roomState.localSeatIdx = 0;
                this.roomState.status = "waiting";
                this.roomState.seats = data.room.seats;
                this.roomState.version = data.room.version || 1;
            } else {
                throw new Error("Server create failed");
            }
        } catch (err) {
            this.showToast("⚠️ Không thể kết nối tới Máy chủ tạo phòng! Hãy đảm bảo server.js đang chạy.");
            return;
        }

        this.saveRoomToLocalStorage();
        this.broadcastRoomMessage({ type: "ROOM_UPDATED", roomState: this.roomState });
        this.startRoomPolling();
        this.updateRoomBadgeUI();
        this.renderWaitingScreen();
        this.showToast(`🔑 Đã tạo Phòng [${this.roomState.code}]! Các Slot 2–5 đang trống chờ bạn bè nhập mã vào.`);
    }

    async joinMultiplayerRoomByCode(explicitCode = null) {
        const codeEl = document.getElementById("wait-join-code");
        const nameEl = document.getElementById("wait-join-name");
        const rawCode = explicitCode || (codeEl ? codeEl.value : "");
        const code = String(rawCode || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
        const playerName = (nameEl && nameEl.value.trim()) ? nameEl.value.trim() : "Hải Đội Khách";

        if (code.length < 4) {
            this.showToast("⚠️ Vui lòng nhập Mã Phòng hợp lệ (6 ký tự chữ và số)!");
            return;
        }

        this.roomState.localPlayerName = playerName;
        localStorage.setItem("golden_player_name", playerName);

        try {
            const resp = await fetch("/api/room/join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, playerName, clientId: this.clientId })
            });
            const data = await resp.json();
            if (data && data.ok && data.room) {
                this.roomState.code = data.room.code;
                this.roomState.isHost = (data.assignedSeat === 0);
                this.roomState.localSeatIdx = data.assignedSeat;
                this.roomState.status = data.room.status;
                this.roomState.seats = data.room.seats;
                this.roomState.version = data.room.version || 1;

                this.saveRoomToLocalStorage();
                this.broadcastRoomMessage({ type: "ROOM_UPDATED", roomState: this.roomState });
                this.startRoomPolling();
                this.updateRoomBadgeUI();

                // If room is already in turn_order_quiz or playing, jump right in!
                if (data.room.status === "turn_order_quiz" && data.room.gameState) {
                    this.hideWaitingScreenAndShowHUD();
                    this.applySerializedGameState(data.room.gameState, true);
                    if (data.room.openingQuiz) {
                        this.startOpeningSpeedQuizModal(data.room.openingQuiz);
                    }
                    return;
                } else if (data.room.status === "playing" && data.room.gameState) {
                    this.hideWaitingScreenAndShowHUD();
                    this.applySerializedGameState(data.room.gameState, true);
                    return;
                }

                this.renderWaitingScreen();
                this.showToast(`🎉 Đã vào Phòng [${this.roomState.code}] thành công! Bạn điều khiển Thuyền #${data.assignedSeat + 1}.`);
                return;
            } else {
                this.showToast(`⚠️ ${data && data.error ? data.error : "Không tìm thấy phòng!"}`);
                return;
            }
        } catch (err) {
            this.showToast("⚠️ Lỗi kết nối khi vào phòng! Hãy kiểm tra lại đường truyền.");
        }
    }

    async hostAddBotToSeat(seatIdx) {
        if (!this.roomState.code || !this.roomState.isHost) return;
        try {
            const resp = await fetch("/api/room/update-seat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: this.roomState.code,
                    seatIndex: seatIdx,
                    action: "add_bot"
                })
            });
            const data = await resp.json();
            if (data && data.ok && data.room) {
                this.roomState.seats = data.room.seats;
                this.roomState.version = data.room.version;
                this.broadcastRoomMessage({ type: "ROOM_UPDATED", roomState: this.roomState });
                this.renderWaitingScreen();
                this.showToast(`🤖 Đã thêm Bot AI vào Slot #${seatIdx + 1}!`);
            }
        } catch (e) {}
    }

    async hostClearSeat(seatIdx) {
        if (!this.roomState.code || !this.roomState.isHost || seatIdx === 0) return;
        try {
            const resp = await fetch("/api/room/update-seat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: this.roomState.code,
                    seatIndex: seatIdx,
                    action: "clear_seat"
                })
            });
            const data = await resp.json();
            if (data && data.ok && data.room) {
                this.roomState.seats = data.room.seats;
                this.roomState.version = data.room.version;
                this.broadcastRoomMessage({ type: "ROOM_UPDATED", roomState: this.roomState });
                this.renderWaitingScreen();
                this.showToast(`🪑 Đã làm trống Slot #${seatIdx + 1} để chờ người chơi khác vào.`);
            }
        } catch (e) {}
    }

    async leaveMultiplayerRoom() {
        if (this.roomState.code) {
            try {
                await fetch("/api/room/leave", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code: this.roomState.code, clientId: this.clientId })
                });
            } catch (e) {}
        }
        sessionStorage.removeItem("golden_active_room_code");
        clearInterval(this.roomPollTimer);
        this.roomState.code = null;
        this.roomState.isHost = false;
        this.roomState.status = "waiting";
        this.roomState.seats = this.createEmptyLobbySeats();
        this.updateRoomBadgeUI();
        this.showWaitingScreen();
    }

    copyRoomCode() {
        if (!this.roomState.code) return;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(this.roomState.code);
        }
        this.showToast(`📋 Đã sao chép Mã Phòng: ${this.roomState.code}`);
    }

    copyPublicOnlineUrl() {
        const url = this.publicOnlineUrl || window.location.origin;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url);
        }
        this.showToast(`🌐 Đã sao chép Link Online gửi cho bạn bè: ${url}`);
    }

    copyInviteLink() {
        if (!this.roomState.code) return;
        const base = this.publicOnlineUrl || window.location.origin;
        const link = `${base}/?room=${this.roomState.code}`;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(link);
        }
        this.showToast(`🔗 Đã sao chép Link mời vào phòng: ${link}`);
    }

    // ========================================================================
    // PHASE 0: OPENING TURN-ORDER SPEED QUIZ (ĐẦU TRẬN XẾP THỨ TỰ LƯỢT CHƠI)
    // ========================================================================
    pickRandomOpeningSpeedQuiz() {
        const allPools = [
            ...(window.GAME_DATA.resourceQuizzes.food || []),
            ...(window.GAME_DATA.resourceQuizzes.wood || []),
            ...(window.GAME_DATA.resourceQuizzes.iron || [])
        ];
        const raw = allPools[Math.floor(Math.random() * allPools.length)] || window.GAME_DATA.resourceQuizzes.food[0];
        return this.prepareShuffledQuiz(raw);
    }

    startQuickSinglePlayerWithBots() {
        this.roomState.code = null;
        this.roomState.isHost = true;
        this.roomState.status = "turn_order_quiz";
        this.hideWaitingScreenAndShowHUD();
        this.initializeMatchBoardAndShips(4, 1, null);

        const quiz = this.pickRandomOpeningSpeedQuiz();
        this.startOpeningSpeedQuizModal({
            quiz,
            startedAt: Date.now(),
            completed: false,
            rankings: []
        });
    }

    async startRoomGameSession() {
        const activeSeats = (this.roomState.seats || []).filter(s => s.type === "human" || s.type === "ai");
        if (activeSeats.length < 2) {
            this.showToast("⚠️ Cần tối thiểu 2 người chơi (hoặc bấm '+ Thêm Bot AI') để bắt đầu ván đấu!");
            return;
        }
        if (activeSeats.length > 5) {
            this.showToast("⚠️ Tối đa 5 người chơi trong 1 phòng!");
            return;
        }

        const customConfigs = activeSeats.map(s => ({
            name: s.name,
            isAI: s.type === "ai",
            archetypeId: s.seatIndex,
            seatIndex: s.seatIndex,
            clientId: s.clientId
        }));

        this.roomState.status = "turn_order_quiz";
        this.hideWaitingScreenAndShowHUD();
        this.initializeMatchBoardAndShips(customConfigs.length, customConfigs.filter(c => !c.isAI).length, customConfigs);

        const openingQuiz = this.pickRandomOpeningSpeedQuiz();
        const stateSnapshot = this.serializeGameState();

        if (this.roomState.code) {
            try {
                const resp = await fetch("/api/room/start", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        code: this.roomState.code,
                        gameState: stateSnapshot,
                        openingQuiz
                    })
                });
                const data = await resp.json();
                if (data && data.room) {
                    this.roomState.version = data.room.version;
                    this.roomState.status = data.room.status;
                    if (data.room.openingQuiz) {
                        this.startOpeningSpeedQuizModal(data.room.openingQuiz);
                    }
                }
            } catch (e) {
                this.startOpeningSpeedQuizModal({ quiz: openingQuiz, startedAt: Date.now(), completed: false, rankings: [] });
            }
            this.saveRoomToLocalStorage(stateSnapshot);
            this.broadcastRoomMessage({
                type: "ROOM_OPENING_QUIZ_STARTED",
                roomState: this.roomState,
                gameState: stateSnapshot,
                openingQuiz: { quiz: openingQuiz, startedAt: Date.now(), completed: false, rankings: [] }
            });
        }
    }

    startOpeningSpeedQuizModal(openingQuizObj) {
        if (!openingQuizObj || !openingQuizObj.quiz) return;
        this.openingQuizState = openingQuizObj;
        this.openingQuizStartMs = Date.now();
        this.hasSubmittedOpeningAnswer = false;
        this.localOpeningChoice = null;
        this.localOpeningElapsedMs = 0;

        clearInterval(this.openingTimerInterval);
        this.renderOpeningSpeedQuizView();

        this.openingTimerInterval = setInterval(() => {
            if (this.hasSubmittedOpeningAnswer) {
                clearInterval(this.openingTimerInterval);
                return;
            }
            const timerEl = document.getElementById("opening-speed-timer");
            if (timerEl) {
                const elapsedSec = ((Date.now() - this.openingQuizStartMs) / 1000).toFixed(1);
                timerEl.textContent = `⏱️ ${elapsedSec}s`;
            }
        }, 100);
    }

    renderOpeningSpeedQuizView() {
        if (!this.openingQuizState || !this.openingQuizState.quiz) return;
        const quiz = this.openingQuizState.quiz;
        const localPlayer = this.getLocalPlayer();

        // Phase A: Local player has NOT answered yet -> Show question & clickable A/B/C/D options
        if (!this.hasSubmittedOpeningAnswer) {
            const html = `
                <div class="modal-header-badge" style="background:rgba(197,155,39,0.22); border-color:#e5c365">
                    <span>⚡ THỬ THÁCH ĐẦU TRẬN: ĐUA TỐC ĐỘ XẾP THỨ TỰ LƯỢT CHƠI</span>
                    <span id="opening-speed-timer" class="speed-timer-pill">⏱️ 0.0s</span>
                </div>
                <h2 class="modal-title">Ai Trả Lời Đúng &amp; Nhanh Nhất Sẽ Xuất Phát Đầu Tiên!</h2>
                <p class="modal-desc">
                    Tất cả người chơi cùng trả lời câu hỏi Địa lý khởi động dưới đây. Thứ tự lượt đi trong suốt ván đấu sẽ xếp theo <strong>tốc độ trả lời chính xác</strong> của từng người (Nhanh nhất đi Lượt 1, nhanh thứ 2 đi Lượt 2...).
                    ${localPlayer ? `<br/>⛵ <strong>Thuyền của bạn:</strong> <span style="color:${localPlayer.color}; font-weight:800">${localPlayer.name} (${localPlayer.vesselTitle})</span>` : ''}
                </p>
                <div class="quiz-box">
                    <div class="quiz-question">❓ ${quiz.q}</div>
                    <div class="quiz-options">
                        ${quiz.options.map((opt, idx) => `
                            <button class="quiz-opt-btn" onclick="window.GAME.submitOpeningQuizAnswer(${idx})">
                                <span class="opt-letter">${String.fromCharCode(65 + idx)}</span>
                                <span>${opt}</span>
                            </button>
                        `).join("")}
                    </div>
                </div>
            `;
            this.showModal(html);
            return;
        }

        // Phase B: Local player HAS answered -> Show Visual Memory Card (Answer + Photo + Citation) + Live Turn-Order Leaderboard
        const rankings = this.openingQuizState.rankings || [];
        const completed = Boolean(this.openingQuizState.completed);

        const leaderboardHtml = rankings.length === 0
            ? `<div style="color:#94a3b8; font-style:italic; padding:8px 0">⏳ Đang tổng hợp kết quả tốc độ của các thuyền trưởng...</div>`
            : rankings.map((r, idx) => `
                <div class="turn-order-leaderboard-row ${idx === 0 ? 'rank-1' : ''}">
                    <div style="display:flex; align-items:center; gap:10px">
                        <span class="slot-badge-num" style="background:${r.color}; width:26px; height:26px; font-size:12px">#${r.rank || (idx + 1)}</span>
                        <div>
                            <strong style="color:#e8eef4; font-size:13.5px">${r.name} ${r.isAI ? '🤖' : '👤'}</strong>
                            <span style="font-size:11.5px; color:#9be2b6; margin-left:6px">→ Đi lượt thứ ${r.rank || (idx + 1)}</span>
                        </div>
                    </div>
                    <div style="font-size:12.5px; font-weight:800; color:${r.correct ? '#9be2b6' : '#f2c0be'}">
                        ${r.correct ? '✅ Đúng' : '❌ Sai'} • ⏱️ ${(r.elapsedMs / 1000).toFixed(2)}s
                    </div>
                </div>
            `).join("");

        const html = `
            <div class="modal-header-badge" style="background:rgba(63,122,88,0.25); border-color:#579b73">
                <span>🏁 KẾT QUẢ XẾP THỨ TỰ LƯỢT CHƠI &amp; THẺ GHI NHỚ ĐỊA LÝ</span>
                <span class="badge-tag">Thời gian của bạn: ${(this.localOpeningElapsedMs / 1000).toFixed(2)}s</span>
            </div>
            <h2 class="modal-title">Bảng Xếp Hạng Thứ Tự Xuất Phát (Ai Nhanh Nhất Đi Trước)</h2>
            <div class="turn-order-leaderboard">
                ${leaderboardHtml}
            </div>
            ${this.renderQuizVisualMemoryCard(quiz, this.localOpeningChoice)}
            <div class="modal-actions" style="justify-content:space-between">
                <div style="font-size:12.5px; color:#a6b4c4">
                    ${completed
                        ? `✅ Đã xếp xong thứ tự lượt đi! <strong>${rankings[0] ? rankings[0].name : ''}</strong> sẽ xuất phát đầu tiên.`
                        : `⏳ Đang chờ các người chơi khác trong phòng hoàn thành câu hỏi...`
                    }
                </div>
                ${(!this.roomState.code || this.roomState.isHost) && completed ? `
                    <button class="btn-primary-gold" onclick="window.GAME.confirmStartMatchAfterOpeningQuiz()">
                        ⛵ Bắt Đầu Vòng 1 Theo Thứ Tự Này!
                    </button>
                ` : (!this.roomState.code ? `
                    <button class="btn-primary-gold" onclick="window.GAME.confirmStartMatchAfterOpeningQuiz()">
                        ⛵ Bắt Đầu Vòng 1 Ngay!
                    </button>
                ` : `
                    <span style="color:#e5c365; font-size:12.5px; font-weight:700">⏳ Chờ Chủ phòng nhấn Bắt đầu Vòng 1...</span>
                `)}
            </div>
        `;
        this.showModal(html);
    }

    async submitOpeningQuizAnswer(chosenIdx) {
        if (this.hasSubmittedOpeningAnswer || !this.openingQuizState) return;
        this.hasSubmittedOpeningAnswer = true;
        clearInterval(this.openingTimerInterval);

        const quiz = this.openingQuizState.quiz;
        const elapsedMs = Math.max(200, Date.now() - this.openingQuizStartMs);
        const isCorrect = (chosenIdx === quiz.correct);

        this.localOpeningChoice = chosenIdx;
        this.localOpeningElapsedMs = elapsedMs;

        if (isCorrect) window.SFX.playCoin();
        else window.SFX.playClick();

        // Offline mode: simulate Bot AI speeds & sort players immediately
        if (!this.roomState.code) {
            const entries = this.players.map(p => {
                if (!p.isAI) {
                    return {
                        player: p,
                        correct: isCorrect,
                        elapsedMs: elapsedMs,
                        chosenIdx
                    };
                }
                return {
                    player: p,
                    correct: Math.random() < 0.65,
                    elapsedMs: 2800 + Math.floor(Math.random() * 5500),
                    chosenIdx: 0
                };
            });

            entries.sort((a, b) => {
                if (a.correct !== b.correct) return a.correct ? -1 : 1;
                return a.elapsedMs - b.elapsedMs;
            });

            this.players = entries.map((e, idx) => {
                e.player.id = idx;
                e.player.turnRank = idx + 1;
                return e.player;
            });

            this.openingQuizState.completed = true;
            this.openingQuizState.rankings = entries.map((e, idx) => ({
                rank: idx + 1,
                name: e.player.name,
                color: e.player.color,
                isAI: e.player.isAI,
                correct: e.correct,
                elapsedMs: e.elapsedMs
            }));

            this.world.spawnShips(this.players);
            this.updateUI();
            this.renderOpeningSpeedQuizView();
            return;
        }

        // Online Room mode: submit answer to server
        try {
            const resp = await fetch("/api/room/opening-answer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: this.roomState.code,
                    clientId: this.clientId,
                    seatIndex: this.roomState.localSeatIdx,
                    correct: isCorrect,
                    elapsedMs,
                    chosenIdx
                })
            });
            const data = await resp.json();
            if (data && data.ok && data.room) {
                this.roomState.version = data.room.version;
                this.openingQuizState = data.room.openingQuiz;
                if (data.room.gameState) {
                    this.players = data.room.gameState.players;
                    this.world.spawnShips(this.players);
                    this.updateUI();
                }
            }
        } catch (e) {}

        this.renderOpeningSpeedQuizView();
    }

    async confirmStartMatchAfterOpeningQuiz() {
        this.closeModal();
        this.roomState.status = "playing";
        this.activePlayerIdx = 0;

        if (this.roomState.code) {
            try {
                const resp = await fetch("/api/room/begin-play", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code: this.roomState.code })
                });
                const data = await resp.json();
                if (data && data.ok && data.room && data.room.gameState) {
                    this.roomState.version = data.room.version;
                    this.players = data.room.gameState.players;
                }
            } catch (e) {}
        }

        const firstPlayer = this.players[0];
        if (firstPlayer) {
            this.logEvent(`🏁 Đua tốc độ đầu trận hoàn tất! Thứ tự lượt đi: ${this.players.map((p, i) => `#${i + 1} ${p.name}`).join(" → ")}.`);
            this.showToast(`⛵ ${firstPlayer.name} trả lời nhanh nhất và đi Lượt 1!`);
        }

        this.world.spawnShips(this.players);
        this.beginTurn();
    }

    // ========================================================================
    // REAL-TIME ROOM SYNC, SHARED MAP & LIVE QUIZ BROADCAST
    // ========================================================================
    startRoomPolling() {
        clearInterval(this.roomPollTimer);
        if (!this.roomState.code) return;
        this.isPollingRoom = false;

        this.roomPollTimer = setInterval(async () => {
            if (!this.roomState.code || this.isPollingRoom) return;
            this.isPollingRoom = true;
            try {
                const resp = await fetch(`/api/room/status?code=${this.roomState.code}&v=${this.roomState.version || 0}`);
                const data = await resp.json();
                if (data && data.publicUrl) {
                    this.publicOnlineUrl = data.publicUrl;
                }
                if (data && data.unchanged) {
                    return;
                }
                if (data && data.ok && data.room) {
                    const r = data.room;
                    const prevStatus = this.roomState.status;
                    const versionChanged = r.version !== this.roomState.version;
                    this.roomState.version = r.version;
                    this.roomState.seats = r.seats;
                    this.roomState.status = r.status;

                    // 1. Still on Waiting Screen -> Check if Host started Opening Speed Quiz or Match
                    if (!this.isGameStarted) {
                        if (r.status === "turn_order_quiz" && r.gameState) {
                            this.hideWaitingScreenAndShowHUD();
                            this.applySerializedGameState(r.gameState, true);
                            if (r.openingQuiz) {
                                this.startOpeningSpeedQuizModal(r.openingQuiz);
                            }
                            this.showToast(`⚡ Bắt đầu Câu Hỏi Tốc Độ Đầu Trận [Phòng ${this.roomState.code}]!`);
                        } else if (r.status === "playing" && r.gameState) {
                            this.hideWaitingScreenAndShowHUD();
                            this.applySerializedGameState(r.gameState, true);
                            this.showToast(`🚀 Trận đấu Phòng [${this.roomState.code}] đã bắt đầu!`);
                        } else if (versionChanged) {
                            this.renderWaitingScreen();
                        }
                        return;
                    }

                    // 2. Currently in Opening Speed Quiz phase
                    if (r.status === "turn_order_quiz") {
                        if (r.openingQuiz) {
                            this.openingQuizState = r.openingQuiz;
                            if (r.gameState && r.gameState.players) {
                                this.players = r.gameState.players;
                                this.world.syncShipsSmoothly(this.players);
                                this.updateUI();
                            }
                            if (this.hasSubmittedOpeningAnswer) {
                                this.renderOpeningSpeedQuizView();
                            }
                        }
                        return;
                    }

                    // 3. Transitioned from Opening Speed Quiz -> Playing
                    if (prevStatus === "turn_order_quiz" && r.status === "playing" && r.gameState) {
                        this.closeModal();
                        this.applySerializedGameState(r.gameState, false);
                        const firstP = this.players[0];
                        if (firstP) {
                            this.world.focusCameraOnHex(firstP.q, firstP.r);
                            this.showToast(`⛵ Vòng 1 bắt đầu! Lượt đầu tiên thuộc về ${firstP.name}!`);
                        }
                        return;
                    }

                    // 4. Live Match Synchronization (Shared Map + Live Spectator Quiz)
                    if (r.status === "playing" && r.gameState && versionChanged && !this.isBusy) {
                        this.applySerializedGameState(r.gameState, false);
                    }
                }
            } catch (e) {
            } finally {
                this.isPollingRoom = false;
            }
        }, 850);
    }

    serializeGameState() {
        const resourceCooldowns = {};
        let rareNPCHex = null;
        this.world.hexTiles.forEach(t => {
            if (t.resourceCooldown > 0) {
                resourceCooldowns[`${t.q},${t.r}`] = t.resourceCooldown;
            }
            if (t.hasNPC) {
                rareNPCHex = { q: t.q, r: t.r };
            }
        });

        return {
            roundNumber: this.roundNumber,
            activePlayerIdx: this.activePlayerIdx,
            monumentAssignments: this.monumentAssignments,
            players: this.players,
            marketListings: this.marketListings,
            resourceCooldowns,
            rareNPCHex,
            liveQuizState: this.liveQuizState
        };
    }

    applySerializedGameState(state, rebuildBoard = false) {
        if (!state || !state.players) return;

        const prevActiveIdx = this.activePlayerIdx;
        const prevRound = this.roundNumber;

        if (rebuildBoard && state.monumentAssignments) {
            this.monumentAssignments = state.monumentAssignments;
            this.world.buildBoard(this.monumentAssignments);
        }

        this.roundNumber = state.roundNumber;
        this.activePlayerIdx = state.activePlayerIdx;
        this.marketListings = state.marketListings || this.marketListings;
        this.players = state.players;

        if (state.resourceCooldowns) {
            this.world.hexTiles.forEach(t => {
                t.resourceCooldown = state.resourceCooldowns[`${t.q},${t.r}`] || 0;
            });
            this.world.updateResourceVisuals();
        }

        // Rebuild ships only on initial load; otherwise smoothly glide ships so spectator camera is never disturbed!
        if (rebuildBoard || this.world.shipMeshes.size !== this.players.length) {
            this.world.spawnShips(this.players);
        } else {
            this.world.syncShipsSmoothly(this.players);
        }

        // Handle Live Shared Quiz Broadcast for Spectators
        this.liveQuizState = state.liveQuizState || null;
        if (!this.isMyTurn()) {
            if (this.liveQuizState) {
                this.renderSpectatorLiveQuiz(this.liveQuizState);
            } else if (this.showingSpectatorQuizId) {
                this.showingSpectatorQuizId = null;
                this.closeModal(true);
            }
        }

        // If turn just switched to a new player
        if (prevActiveIdx !== this.activePlayerIdx || prevRound !== this.roundNumber) {
            const activeP = this.getActivePlayer();
            if (activeP) {
                if (this.isMyTurn()) {
                    window.SFX.playTurnStart();
                    this.world.focusCameraOnHex(activeP.q, activeP.r);
                    this.showToast(`🎯 Đã tới lượt của bạn (${activeP.name})! Bạn có 4 AP (Tối đa 3 AP di chuyển).`);
                } else if (activeP.isAI && (!this.roomState.code || this.roomState.isHost)) {
                    // Only Host runs Bot AI turns on the shared map!
                    setTimeout(() => this.executeAITurn(), 750);
                }
            }
        }

        this.refreshReachableHexes();
        this.updateUI();
    }

    async syncMultiplayerGameState() {
        if (!this.roomState.code) return;
        const snapshot = this.serializeGameState();
        this.saveRoomToLocalStorage(snapshot);
        try {
            const resp = await fetch("/api/room/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: this.roomState.code, gameState: snapshot })
            });
            const data = await resp.json();
            if (data && data.version) {
                this.roomState.version = data.version;
            }
        } catch (e) {}
        this.broadcastRoomMessage({
            type: "ROOM_STATE_SYNC",
            code: this.roomState.code,
            version: this.roomState.version,
            gameState: snapshot
        });
    }

    saveRoomToLocalStorage(gameState = null) {
        if (!this.roomState.code) return;
        try {
            sessionStorage.setItem("golden_active_room_code", this.roomState.code);
            const payload = { ...this.roomState, gameState };
            localStorage.setItem(`golden_room_${this.roomState.code}`, JSON.stringify(payload));
        } catch (e) {}
    }

    broadcastRoomMessage(msg) {
        if (this.roomChannel) {
            try {
                this.roomChannel.postMessage(msg);
            } catch (e) {}
        }
    }

    handleRoomBroadcast(data) {
        if (!data || !this.roomState.code) return;
        if (data.type === "ROOM_UPDATED" && data.roomState && data.roomState.code === this.roomState.code) {
            this.roomState.seats = data.roomState.seats;
            this.roomState.version = data.roomState.version;
            this.updateRoomBadgeUI();
            if (!this.isGameStarted) {
                this.renderWaitingScreen();
            }
        } else if (data.type === "ROOM_OPENING_QUIZ_STARTED" && data.roomState && data.roomState.code === this.roomState.code) {
            this.roomState.status = "turn_order_quiz";
            this.hideWaitingScreenAndShowHUD();
            this.applySerializedGameState(data.gameState, true);
            if (data.openingQuiz) {
                this.startOpeningSpeedQuizModal(data.openingQuiz);
            }
        } else if (data.type === "ROOM_STATE_SYNC" && data.code === this.roomState.code) {
            if (!this.isBusy) {
                this.applySerializedGameState(data.gameState, false);
            }
        }
    }

    updateRoomBadgeUI() {
        const pill = document.getElementById("room-code-pill");
        if (!pill) return;
        if (this.roomState.code) {
            pill.textContent = `🔑 Phòng: ${this.roomState.code}`;
            pill.classList.remove("hidden");
        } else {
            pill.classList.add("hidden");
        }
    }

    // ------------------------------------------------------------------------
    // SPECTATOR LIVE QUIZ RENDERER (ALL PLAYERS SEE QUIZZES; ONLY ACTIVE ANSWERS)
    // ------------------------------------------------------------------------
    renderSpectatorLiveQuiz(liveQuiz) {
        if (!liveQuiz || !liveQuiz.quiz) return;
        this.showingSpectatorQuizId = liveQuiz.id;
        const quiz = liveQuiz.quiz;

        if (liveQuiz.phase === "asking") {
            const html = `
                <div class="spectator-quiz-banner">
                    <span>👁️ ĐANG XEM LƯỢT CỦA <strong>${liveQuiz.actorName.toUpperCase()}</strong></span>
                    <span class="badge-tag">Chế độ Quan sát (Chỉ ${liveQuiz.actorName} được chọn đáp án)</span>
                </div>
                <div class="modal-header-badge" style="background:${liveQuiz.badgeColor || '#2d6878'}33; border-color:${liveQuiz.badgeColor || '#5c9ead'}">
                    <span>${liveQuiz.badgeTitle || '❓ CÂU HỎI ĐỊA LÝ TRỰC TIẾP TRÊN BẢN ĐỒ CHUNG'}</span>
                </div>
                <h2 class="modal-title">${liveQuiz.title}</h2>
                <p class="modal-desc">${liveQuiz.desc}</p>
                <div class="quiz-box">
                    <div class="quiz-question">❓ ${quiz.q}</div>
                    <div class="quiz-options">
                        ${quiz.options.map((opt, idx) => `
                            <button class="quiz-opt-btn spectator-disabled" disabled>
                                <span class="opt-letter">${String.fromCharCode(65 + idx)}</span>
                                <span>${opt}</span>
                            </button>
                        `).join("")}
                    </div>
                </div>
                <div style="text-align:center; font-size:12.5px; color:#e5c365; font-weight:700; margin-top:6px">
                    ⏳ Đang chờ ${liveQuiz.actorName} suy nghĩ và chọn đáp án...
                </div>
            `;
            this.showModal(html);
        } else if (liveQuiz.phase === "answered") {
            const chosenIdx = liveQuiz.chosenIdx;
            const isCorrect = (chosenIdx === quiz.correct);
            const chosenLetter = String.fromCharCode(65 + chosenIdx);

            const html = `
                <div class="spectator-quiz-banner">
                    <span>👁️ KẾT QUẢ TRẢ LỜI CỦA <strong>${liveQuiz.actorName.toUpperCase()}</strong>: Chọn phương án <strong>${chosenLetter}</strong> (${isCorrect ? '✅ CHÍNH XÁC' : '❌ CHƯA ĐÚNG'})</span>
                    <span class="badge-tag">Cùng ghi nhớ kiến thức Địa lý</span>
                </div>
                <h2 class="modal-title">${liveQuiz.outcomeTitle || `Kết Quả Khảo Nghiệm Của ${liveQuiz.actorName}`}</h2>
                ${this.renderQuizVisualMemoryCard(quiz, chosenIdx, liveQuiz.actorName)}
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="window.GAME.closeModal(true)">Đóng Cửa Sổ Quan Sát</button>
                </div>
            `;
            this.showModal(html);
        }
    }

    // ------------------------------------------------------------------------
    // COLLAPSIBLE / MINIMIZABLE HUD WINDOWS & CLEAN VIEW MODE
    // ------------------------------------------------------------------------
    togglePanel(panelId) {
        const panel = document.getElementById(panelId);
        if (!panel) return;
        panel.classList.toggle("collapsed");
        const btn = panel.querySelector(".panel-collapse-btn");
        if (btn) {
            btn.textContent = panel.classList.contains("collapsed") ? "＋" : "－";
            btn.title = panel.classList.contains("collapsed") ? "Mở rộng cửa sổ" : "Thu nhỏ cửa sổ";
        }
    }

    toggleAllPanelsCleanMode() {
        this.cleanUIMode = !this.cleanUIMode;
        const panels = ["panel-regions", "panel-roster", "panel-captain", "panel-log"];
        panels.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            if (this.cleanUIMode) {
                el.classList.add("collapsed");
            } else {
                el.classList.remove("collapsed");
            }
            const btn = el.querySelector(".panel-collapse-btn");
            if (btn) btn.textContent = this.cleanUIMode ? "＋" : "－";
        });
        const toggleBtn = document.getElementById("btn-toggle-clean-ui");
        if (toggleBtn) {
            toggleBtn.innerHTML = this.cleanUIMode ? "👁️ Hiện Cửa Sổ" : "👁️ Thu Gọn UI";
        }
    }

    // ------------------------------------------------------------------------
    // QUIZ SHUFFLER + POST-QUIZ VISUAL MEMORY CARD (WITH VERIFIED CITATIONS)
    // ------------------------------------------------------------------------
    prepareShuffledQuiz(rawQuiz) {
        const indexedOptions = rawQuiz.options.map((text, idx) => ({
            text,
            isCorrect: idx === rawQuiz.correct
        }));
        for (let i = indexedOptions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indexedOptions[i], indexedOptions[j]] = [indexedOptions[j], indexedOptions[i]];
        }
        const newCorrectIdx = indexedOptions.findIndex(o => o.isCorrect);
        const correctLetter = String.fromCharCode(65 + newCorrectIdx);
        return {
            q: rawQuiz.q,
            options: indexedOptions.map(o => o.text),
            correct: newCorrectIdx,
            correctLetter: correctLetter,
            correctText: indexedOptions[newCorrectIdx].text,
            explanation: rawQuiz.explanation,
            visualImg: rawQuiz.visualImg || "assets/monuments/halong.jpg",
            visualCaption: rawQuiz.visualCaption || "Hình ảnh thực tế minh họa kiến thức Địa lý Việt Nam.",
            visualCredit: rawQuiz.visualCredit || "Nguồn ảnh: Wikimedia Commons • Tham khảo: SGK Địa lý 12 (NXB Giáo dục Việt Nam)"
        };
    }

    renderQuizVisualMemoryCard(quiz, chosenIdx, actorLabel = null) {
        const isCorrect = (chosenIdx === quiz.correct);
        const chosenLetter = String.fromCharCode(65 + chosenIdx);
        const chosenText = quiz.options[chosenIdx] || "";
        const whoText = actorLabel ? `<strong>${actorLabel}</strong> đã chọn` : `<strong>Bạn</strong> đã chọn`;

        return `
            <div class="quiz-memory-card">
                <div class="answer-verdict-strip ${isCorrect ? 'verdict-correct' : 'verdict-wrong'}">
                    <div class="verdict-user-choice">
                        ${isCorrect
                            ? `🎯 ${whoText} chính xác: <strong>Phương án ${chosenLetter}. ${chosenText}</strong>`
                            : `⚠️ ${whoText}: <strong>${chosenLetter}. ${chosenText}</strong> <em>(Chưa chính xác)</em>`
                        }
                    </div>
                    <div class="verdict-correct-box">
                        ✅ <strong>ĐÁP ÁN ĐÚNG CẦN GHI NHỚ:</strong>
                        <span class="correct-highlight">${quiz.correctLetter}. ${quiz.correctText}</span>
                    </div>
                </div>

                <div class="visual-memory-grid">
                    <div class="visual-memory-photo-wrap">
                        <img src="${quiz.visualImg}" alt="Hình minh họa kiến thức Địa lý" class="visual-memory-img" />
                        <div class="visual-memory-caption">
                            📸 <strong>Minh họa thực tế:</strong> ${quiz.visualCaption}
                        </div>
                        <div class="visual-memory-credit">
                            ⚖️ <strong>Nguồn ảnh &amp; Trích dẫn:</strong> ${quiz.visualCredit}
                        </div>
                    </div>

                    <div class="visual-memory-explanation">
                        <div class="memory-exp-title">📘 Giải Thích &amp; Ghi Nhớ Kiến Thức Địa Lý</div>
                        <p class="memory-exp-text">${quiz.explanation}</p>
                        <div class="memory-tip-box">
                            💡 <strong>Mẹo ghi nhớ nhanh:</strong> Hãy quan sát hình ảnh thực tế bên cạnh gắn liền với từ khóa <em>"${quiz.correctText}"</em> để nhớ lâu kiến thức vùng kinh tế này!
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    randomizeMonumentTiers() {
        const tiers = [1, 1, 1, 2, 2, 2, 3, 3, 3];
        for (let i = tiers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tiers[i], tiers[j]] = [tiers[j], tiers[i]];
        }
        const map = {};
        window.GAME_DATA.monuments.forEach((m, idx) => {
            map[m.id] = tiers[idx];
        });
        return map;
    }

    generateFairOuterRimSpawns(count) {
        const rimTiles = this.world.hexTiles.filter(t => t.isSpawnRim && t.navigable);
        rimTiles.sort((a, b) => a.r - b.r);

        const chosen = [];
        const bandSize = rimTiles.length / count;
        for (let i = 0; i < count; i++) {
            const startIdx = Math.floor(i * bandSize);
            const endIdx = Math.max(startIdx + 1, Math.floor((i + 1) * bandSize));
            const bandSlice = rimTiles.slice(startIdx, endIdx);
            const pick = bandSlice[Math.floor(Math.random() * bandSlice.length)] || rimTiles[i % rimTiles.length];
            chosen.push({ q: pick.q, r: pick.r, regionName: pick.region.name });
        }

        for (let i = chosen.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [chosen[i], chosen[j]] = [chosen[j], chosen[i]];
        }
        return chosen;
    }

    initializeMatchBoardAndShips(totalPlayers = 4, humanCount = 1, customConfigs = null) {
        this.roundNumber = 1;
        this.activePlayerIdx = 0;
        this.isBusy = false;
        this.liveQuizState = null;

        this.nextNPCSpawnRound = 4 + Math.floor(Math.random() * 2);

        this.monumentAssignments = this.randomizeMonumentTiers();
        this.world.buildBoard(this.monumentAssignments);

        const fairSpawns = this.generateFairOuterRimSpawns(totalPlayers);

        this.players = [];
        for (let i = 0; i < totalPlayers; i++) {
            const archIdx = customConfigs && customConfigs[i].archetypeId !== undefined ? customConfigs[i].archetypeId : i;
            const arch = window.GAME_DATA.shipArchetypes[archIdx % window.GAME_DATA.shipArchetypes.length];
            const isAI = customConfigs ? customConfigs[i].isAI : (i >= humanCount);
            const pName = customConfigs ? customConfigs[i].name : arch.name;
            const seatIdx = customConfigs && customConfigs[i].seatIndex !== undefined ? customConfigs[i].seatIndex : i;
            const clientId = customConfigs && customConfigs[i].clientId !== undefined
                ? customConfigs[i].clientId
                : (!isAI ? this.clientId : null);

            this.players.push({
                id: i,
                seatIndex: seatIdx,
                clientId: clientId,
                name: pName,
                vesselTitle: arch.vesselTitle,
                archetypeId: archIdx,
                color: arch.color,
                isAI: isAI,
                eliminated: false,
                q: fairSpawns[i].q,
                r: fairSpawns[i].r,
                hp: 5,
                maxHp: 5,
                coins: 1,
                ap: 4,
                moveApSpent: 0,
                hexMoveCredits: 0,
                interactiveApUsed: false,
                repairedThisTurn: 0,
                food: 1,
                wood: 1,
                iron: 0,
                keys: { 1: 0, 2: 0, 3: 0 },
                specialties: [],
                relics: []
            });
        }

        this.seedInitialMarketListings();
        this.world.spawnShips(this.players);

        const roomTag = this.roomState.code ? ` [Phòng: ${this.roomState.code}]` : "";
        this.logEvent(`⚓ Khởi tạo bản đồ chung${roomTag} (${totalPlayers} Hải đội)! Bắt đầu Câu Hỏi Tốc Độ Đầu Trận để xếp lượt đi.`);
        this.updateUI();
    }

    seedInitialMarketListings() {
        this.marketListings = [
            {
                id: this.nextListingId++,
                sellerId: -1,
                sellerName: "Thương Hội Cái Lân",
                itemType: "specialty",
                regionId: 0,
                name: "Chè Shan & Than Quảng Ninh",
                icon: "🍃",
                price: 2
            },
            {
                id: this.nextListingId++,
                sellerId: -1,
                sellerName: "Thương Hội Tây Nguyên",
                itemType: "specialty",
                regionId: 3,
                name: "Cà Phê Đất Đỏ Bazan",
                icon: "☕",
                price: 2
            },
            {
                id: this.nextListingId++,
                sellerId: -1,
                sellerName: "Thương Hội Cửu Long",
                itemType: "specialty",
                regionId: 5,
                name: "Ngọc Thực Gạo ST25",
                icon: "🌾",
                price: 2
            }
        ];
    }

    getCargoCount(player) {
        const keyCount = (player.keys[1] || 0) + (player.keys[2] || 0) + (player.keys[3] || 0);
        return player.food + player.wood + player.iron + keyCount + player.specialties.length;
    }

    getActivePlayer() {
        return this.players[this.activePlayerIdx];
    }

    getCurrentTile(player) {
        return this.world.hexMap.get(`${player.q},${player.r}`);
    }

    // ------------------------------------------------------------------------
    // VIII. STANDARD TURN STRUCTURE — PHASE 1: START OF TURN & AUTO-END ON 0 AP
    // ------------------------------------------------------------------------
    beginTurn() {
        clearTimeout(this.autoEndTurnTimer);
        const p = this.getActivePlayer();
        if (!p) return;
        if (p.eliminated) {
            this.advanceToNextPlayer();
            return;
        }

        p.ap = 4;
        p.moveApSpent = 0;
        p.hexMoveCredits = 0;
        p.interactiveApUsed = false;
        p.repairedThisTurn = 0;
        this.liveQuizState = null;

        window.SFX.playTurnStart();

        // Only auto-focus camera if it's our own turn or offline mode; spectators keep free camera!
        if (this.isMyTurn() || !this.roomState.code) {
            this.world.focusCameraOnHex(p.q, p.r);
        }

        this.refreshReachableHexes();
        this.updateUI();
        this.syncMultiplayerGameState();

        // Only Host executes Bot AI turns so all clients stay 100% synchronized!
        if (p.isAI && !this.isBusy && (!this.roomState.code || this.roomState.isHost)) {
            setTimeout(() => this.executeAITurn(), 750);
        }
    }

    checkAutoEndTurnIfNoAP() {
        clearTimeout(this.autoEndTurnTimer);
        if (!this.isGameStarted || this.isBusy) return;
        if (!this.isMyTurn()) return;
        if (this.isModalOpen()) return;

        const p = this.getActivePlayer();
        if (!p || p.isAI || p.eliminated) return;

        // Player has 0 AP and no leftover hex move credits -> Automatically end turn!
        if (p.ap <= 0 && p.hexMoveCredits <= 0) {
            this.autoEndTurnTimer = setTimeout(() => {
                if (this.isMyTurn() && !this.isBusy && !this.isModalOpen()) {
                    const curP = this.getActivePlayer();
                    if (curP && curP.ap <= 0 && curP.hexMoveCredits <= 0) {
                        this.showToast(`⏭️ ${curP.name} đã sử dụng hết 4/4 AP — Tự động chuyển lượt!`);
                        this.endPlayerTurn(true);
                    }
                }
            }, 650);
        }
    }

    // ------------------------------------------------------------------------
    // REALISTIC SEA PATHFINDING (MAX 3 AP FOR MOVEMENT = UP TO 6 WATER HEXES)
    // ------------------------------------------------------------------------
    getRemainingHexSteps(player) {
        // Strict rule: Out of 4 total AP, at most 3 AP may be spent on movement!
        const remainingMoveAP = Math.max(0, Math.min(3 - (player.moveApSpent || 0), player.ap));
        return player.hexMoveCredits + remainingMoveAP * 2;
    }

    computeNavigablePaths(startQ, startR, maxSteps) {
        const reachable = new Map();
        if (maxSteps <= 0) return reachable;

        const startKey = `${startQ},${startR}`;
        const queue = [{ q: startQ, r: startR, steps: 0, path: [] }];
        const bestDist = new Map([[startKey, 0]]);
        const dirs = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];

        while (queue.length > 0) {
            const cur = queue.shift();
            if (cur.steps >= maxSteps) continue;

            for (const [dq, dr] of dirs) {
                const nq = cur.q + dq;
                const nr = cur.r + dr;
                const key = `${nq},${nr}`;
                const nextTile = this.world.hexMap.get(key);

                if (!nextTile || !nextTile.navigable) continue;

                const nextSteps = cur.steps + 1;
                if (!bestDist.has(key) || bestDist.get(key) > nextSteps) {
                    bestDist.set(key, nextSteps);
                    const nextPath = [...cur.path, nextTile];
                    reachable.set(key, { steps: nextSteps, path: nextPath });
                    queue.push({ q: nq, r: nr, steps: nextSteps, path: nextPath });
                }
            }
        }
        return reachable;
    }

    refreshReachableHexes() {
        const p = this.getActivePlayer();
        if (!p) return;
        const maxSteps = this.getRemainingHexSteps(p);
        // Only show green reachable path highlights to the player whose turn it is!
        const reachable = (this.isMyTurn() && maxSteps > 0)
            ? this.computeNavigablePaths(p.q, p.r, maxSteps)
            : new Map();

        this.world.updateReachableHighlights(reachable, `${p.q},${p.r}`);
    }

    handleHexClick(tile) {
        if (!this.isGameStarted || this.isBusy) return;
        const p = this.getActivePlayer();
        if (!p) return;

        // Strictly prevent non-active players from moving or acting during another player's turn!
        if (!this.isMyTurn()) {
            this.showToast(`👁️ Đang là lượt của [${p.name}]! Bạn có thể xoay/phóng to camera tự do để quan sát bản đồ.`);
            return;
        }

        if (!tile.navigable) {
            this.showToast("⛰️ Vùng đất liền / núi cao / rạn đá ngầm này không thể đi xuyên qua! Hãy điều khiển thuyền đi vòng trên biển.");
            return;
        }

        const key = `${tile.q},${tile.r}`;
        if (tile.q === p.q && tile.r === p.r) {
            this.triggerContextualActionOnCurrentHex();
            return;
        }

        if (!this.world.reachablePaths.has(key)) {
            this.showToast("⛵ Ô này nằm ngoài tầm di chuyển đường thủy hiện tại (Chỉ được dùng tối đa 3 AP = 6 Ô nước cho việc di chuyển)!");
            return;
        }

        const routeInfo = this.world.reachablePaths.get(key);
        this.movePlayerAlongRoute(p, tile, routeInfo.steps, routeInfo.path);
    }

    movePlayerAlongRoute(player, targetTile, stepsRequired, pathTiles, onAfterMove = null) {
        let needed = stepsRequired;
        if (player.hexMoveCredits >= needed) {
            player.hexMoveCredits -= needed;
            needed = 0;
        } else {
            needed -= player.hexMoveCredits;
            player.hexMoveCredits = 0;
            const apToSpend = Math.ceil(needed / 2);
            player.ap -= apToSpend;
            player.moveApSpent += apToSpend;
            player.hexMoveCredits = (apToSpend * 2) - needed;
        }

        player.q = targetTile.q;
        player.r = targetTile.r;
        this.isBusy = true;

        this.world.animateShipAlongPath(player, pathTiles, player.id, this.players.length, () => {
            this.isBusy = false;
            this.refreshReachableHexes();
            this.updateUI();
            this.syncMultiplayerGameState();
            if (onAfterMove) onAfterMove();
            this.checkAutoEndTurnIfNoAP();
        });
    }

    // ------------------------------------------------------------------------
    // INTERACTIVE ACTIONS (1 Mandatory Interactive AP)
    // ------------------------------------------------------------------------
    canSpendInteractiveAP(player) {
        return player.ap >= 1;
    }

    spendInteractiveAP(player) {
        player.ap -= 1;
        player.interactiveApUsed = true;
        // Once interactive AP is spent and move AP cap is reached (or 0 AP left), clear unused move credits if 0 AP
        if (player.ap <= 0 && player.hexMoveCredits <= 0) {
            player.ap = 0;
        }
        this.refreshReachableHexes();
        this.updateUI();
    }

    triggerContextualActionOnCurrentHex() {
        const p = this.getActivePlayer();
        if (!this.isMyTurn()) {
            this.showToast(`👁️ Đang là lượt của ${p ? p.name : 'người chơi khác'}!`);
            return;
        }
        const tile = this.getCurrentTile(p);
        if (!tile) return;

        if (!this.canSpendInteractiveAP(p)) {
            this.showToast("Bạn đã hết Điểm Hành Động (AP) trong lượt này!");
            this.checkAutoEndTurnIfNoAP();
            return;
        }

        if (tile.monumentId) {
            this.openMonumentModal(tile);
        } else if (tile.isPort) {
            this.openTradePortModal(tile);
        } else if (tile.resourceType) {
            this.openResourceMiningModal(tile);
        } else if (tile.hasNPC) {
            this.openNPCMinigameModal(tile);
        } else {
            this.openMaritimeMarketModal();
        }
    }

    // ------------------------------------------------------------------------
    // III. IN-SITU SHIP REPAIR (1 AP + 1 Coin + 1 Wood = +1 HP, max +2 HP/turn)
    // ------------------------------------------------------------------------
    actionRepairShip() {
        const p = this.getActivePlayer();
        if (!this.isMyTurn()) {
            this.showToast(`👁️ Chỉ được sửa tàu khi đang trong lượt của bạn!`);
            return;
        }
        if (!this.canSpendInteractiveAP(p)) {
            this.showToast("Cần ít nhất 1 AP để sửa thuyền tại chỗ!");
            return;
        }
        if (p.hp >= p.maxHp) {
            this.showToast("Thuyền đang đầy máu (5/5 HP)!");
            return;
        }
        if (p.repairedThisTurn >= 2) {
            this.showToast("Luật giới hạn tối đa hồi phục 2 HP mỗi lượt!");
            return;
        }
        if (p.coins < 1 || p.wood < 1) {
            this.showToast("Sửa thuyền tại chỗ cần: 1 AP + 1 Xu + 1 Gỗ!");
            return;
        }

        this.spendInteractiveAP(p);
        p.coins -= 1;
        p.wood -= 1;
        p.hp = Math.min(p.maxHp, p.hp + 1);
        p.repairedThisTurn += 1;

        window.SFX.playMine();
        this.world.triggerBurstAnimation(p.q, p.r, 0x4b8b64, 16);
        this.logEvent(`🛠️ ${p.name} đã sửa thuyền tại chỗ (+1 HP → ${p.hp}/${p.maxHp} HP).`);
        this.showToast(`🛠️ Đã sửa thuyền +1 HP (${p.hp}/${p.maxHp} HP)!`);
        this.updateUI();
        this.syncMultiplayerGameState();
        this.checkAutoEndTurnIfNoAP();
    }

    // ------------------------------------------------------------------------
    // V & VII.1 RESOURCE MINING + LIVE SHARED QUIZ BROADCAST
    // ------------------------------------------------------------------------
    openResourceMiningModal(tile) {
        const p = this.getActivePlayer();
        if (!this.isMyTurn()) return;
        if (!this.canSpendInteractiveAP(p)) {
            this.showToast("Cần 1 AP Tương Tác để khai thác tài nguyên!");
            return;
        }
        if (tile.resourceCooldown > 0) {
            this.showToast(`Mỏ tài nguyên đang tái tạo sinh thái! Còn ${tile.resourceCooldown} vòng nữa mới phục hồi 100%.`);
            return;
        }
        if (this.getCargoCount(p) >= 8) {
            this.showToast("Khoang tàu đã đầy (Tối đa 8 thẻ hàng)! Hãy bán bớt hoặc sử dụng tài nguyên.");
            return;
        }

        const quizPool = window.GAME_DATA.resourceQuizzes[tile.resourceType] || window.GAME_DATA.resourceQuizzes.food;
        const rawQuiz = quizPool[Math.floor(Math.random() * quizPool.length)];
        const quiz = this.prepareShuffledQuiz(rawQuiz);

        const resLabels = {
            food: { name: "Lương Thực (Lúa Gạo / Thủy Sản)", icon: "🌾", cd: 2 },
            wood: { name: "Gỗ Lâm Nghiệp Đóng Tàu", icon: "🌲", cd: 3 },
            iron: { name: "Quặng Sắt & Đinh Đóng Tàu", icon: "⛏️", cd: 4 }
        };
        const rMeta = resLabels[tile.resourceType];

        // Broadcast Live Quiz to all other players in the room so they can watch!
        this.liveQuizState = {
            id: "qz_res_" + Date.now(),
            phase: "asking",
            actorId: p.id,
            actorName: p.name,
            badgeColor: tile.region.color,
            badgeTitle: `${rMeta.icon} KHAI THÁC TÀI NGUYÊN & ĐỐ VUI ĐỊA LÝ (${tile.region.name})`,
            title: `${p.name} Đang Khai Thác ${rMeta.name}`,
            desc: `Câu hỏi Địa lý vùng ${tile.region.name}. Chỉ ${p.name} (người đang trong lượt) mới có thể bấm chọn đáp án!`,
            quiz,
            chosenIdx: null,
            outcomeTitle: null
        };
        this.syncMultiplayerGameState();

        const modalHtml = `
            <div class="modal-header-badge" style="background:${tile.region.color}33; border-color:${tile.region.color}">
                <span>${rMeta.icon} KHAI THÁC TÀI NGUYÊN &amp; ĐỐ VUI ĐỊA LÝ TRỰC QUAN</span>
                <span class="badge-tag">${tile.region.name}</span>
            </div>
            <h2 class="modal-title">Khai Thác ${rMeta.name}</h2>
            <p class="modal-desc">
                Theo luật <strong>Kinh Tế Khan Hiếm (1–10 Xu)</strong>, khi khai thác bạn nhận ngay <strong>+1 ${rMeta.icon} ${rMeta.name}</strong>. 
                Trả lời đúng câu hỏi Địa lý dưới đây để nhận thêm <strong>+2 Xu Vàng</strong> (trả lời sai vẫn nhận +1 Xu và được xem Thẻ Ghi Nhớ Hình Ảnh)!
            </p>
            <div class="quiz-box">
                <div class="quiz-question">❓ ${quiz.q}</div>
                <div class="quiz-options">
                    ${quiz.options.map((opt, idx) => `
                        <button class="quiz-opt-btn" onclick="window.GAME.resolveResourceQuiz(${idx})">
                            <span class="opt-letter">${String.fromCharCode(65 + idx)}</span>
                            <span>${opt}</span>
                        </button>
                    `).join("")}
                </div>
            </div>
        `;
        this.pendingResourceContext = { tile, quiz, rMeta };
        this.showModal(modalHtml);
    }

    resolveResourceQuiz(chosenIdx) {
        const ctx = this.pendingResourceContext;
        if (!ctx) return;
        const { tile, quiz, rMeta } = ctx;
        const p = this.getActivePlayer();

        this.spendInteractiveAP(p);

        p[tile.resourceType] += 1;
        tile.resourceCooldown = rMeta.cd;
        this.world.updateResourceVisuals();

        const isCorrect = (chosenIdx === quiz.correct);
        const coinReward = isCorrect ? 2 : 1;
        p.coins = Math.min(10, p.coins + coinReward);

        window.SFX.playMine();
        if (isCorrect) window.SFX.playCoin();
        this.world.triggerBurstAnimation(tile.q, tile.r, isCorrect ? 0xd4af37 : 0x5c9ead, 20);

        this.logEvent(`${rMeta.icon} ${p.name} khai thác +1 ${rMeta.name} và nhận +${coinReward} Xu (Hồi sau ${rMeta.cd} vòng).`);

        // Broadcast answered state + Visual Memory Card to all spectators!
        if (this.liveQuizState) {
            this.liveQuizState.phase = "answered";
            this.liveQuizState.chosenIdx = chosenIdx;
            this.liveQuizState.outcomeTitle = isCorrect
                ? `${p.name} Trả Lời Chính Xác! (+1 ${rMeta.icon} & +2 Xu)`
                : `${p.name} Hoàn Thành Khai Thác (+1 ${rMeta.icon} & +1 Xu)`;
        }

        const resultHtml = `
            <div class="modal-header-badge" style="background:${isCorrect ? '#2e6f4033' : '#9e5a2b33'}; border-color:${isCorrect ? '#4b9b68' : '#c58b43'}">
                <span>${isCorrect ? '✅ TRẢ LỜI CHÍNH XÁC! (+2 XU)' : '💡 CỦNG CỐ KIẾN THỨC ĐỊA LÝ (+1 XU)'}</span>
                <span class="badge-tag">+1 ${rMeta.icon} ${rMeta.name}</span>
            </div>
            <h2 class="modal-title">${isCorrect ? 'Xuất Sắc! Bạn Nhận +1 Tài Nguyên & +2 Xu Vàng' : 'Hoàn Thành Khai Thác! Cùng Ghi Nhớ Đáp Án Đúng'}</h2>
            ${this.renderQuizVisualMemoryCard(quiz, chosenIdx)}
            <p class="modal-desc" style="margin-top:10px; margin-bottom:4px">
                ⏳ <strong>Tái tạo sinh thái:</strong> Ô tài nguyên này sẽ tự động phục hồi 100% trữ lượng sau <strong>${rMeta.cd} vòng</strong>.
            </p>
            <div class="modal-actions">
                <button class="btn-primary-gold" onclick="window.GAME.closeModal()">Đã Ghi Nhớ &amp; Tiếp Tục Hải Trình</button>
            </div>
        `;
        this.showModal(resultHtml);
        this.updateUI();
        this.syncMultiplayerGameState();
    }

    // ------------------------------------------------------------------------
    // IV & V. TRADE PORT & SHARED PLAYER-TO-PLAYER MARITIME MARKETPLACE
    // ------------------------------------------------------------------------
    openTradePortModal(tile) {
        const p = this.getActivePlayer();
        if (!this.isMyTurn()) return;
        if (!this.canSpendInteractiveAP(p) && !this.portApDeducted) {
            this.showToast("Cần 1 AP Tương Tác để giao dịch tại Thương Cảng!");
            return;
        }

        const region = tile.region;
        const spec = region.specialty;

        const sellableListHtml = p.specialties.map((item, idx) => {
            const dist = Math.abs(region.id - item.regionId);
            const originReg = window.GAME_DATA.regions[item.regionId];
            let sellInfo = "";
            if (dist === 0) {
                sellInfo = `
                    <button class="btn-trade-action" onclick="window.GAME.listSpecialtyOnPlayerMarket(${idx}, 3)">
                        📢 Đăng Bán Lên Sàn Chợ Chung (Giá 3 Xu)
                    </button>
                `;
            } else if (dist === 1) {
                sellInfo = `
                    <div style="display:flex; gap:6px; flex-wrap:wrap">
                        <button class="btn-trade-action" onclick="window.GAME.sellSpecialtyAtPort(${idx}, 4, false)">Bán Cho Cảng (Cách 1 vùng): +4 Xu (Lời 2 Xu)</button>
                        <button class="btn-trade-action" onclick="window.GAME.listSpecialtyOnPlayerMarket(${idx}, 4)">Đăng Chợ Chung (4 Xu)</button>
                    </div>
                `;
            } else if (dist === 2) {
                sellInfo = `
                    <div style="display:flex; gap:6px; flex-wrap:wrap">
                        <button class="btn-trade-action" onclick="window.GAME.sellSpecialtyAtPort(${idx}, 6, false)">Bán Cho Cảng (Cách 2 vùng): +6 Xu (Lời 4 Xu)</button>
                        <button class="btn-trade-action" onclick="window.GAME.listSpecialtyOnPlayerMarket(${idx}, 5)">Đăng Chợ Chung (5 Xu)</button>
                    </div>
                `;
            } else {
                sellInfo = `
                    <div style="display:flex; gap:6px; flex-wrap:wrap">
                        <button class="btn-trade-action gold" onclick="window.GAME.sellSpecialtyAtPort(${idx}, 8, true)">Bán Xuyên Việt (${dist} vùng): +8 Xu &amp; +1 Key</button>
                        <button class="btn-trade-action" onclick="window.GAME.sellSpecialtyAtPort(${idx}, 10, false)">Hoặc lấy +10 Xu</button>
                    </div>
                `;
            }
            return `
                <div class="trade-row-card">
                    <div>
                        <strong>${item.icon} ${item.name}</strong>
                        <div style="font-size:12px; color:#b8c4d0">Xuất xứ: ${originReg.name} (Khoảng cách: ${dist} vùng kinh tế)</div>
                    </div>
                    <div>${sellInfo}</div>
                </div>
            `;
        }).join("") || `<div style="color:#8b9bb0; font-style:italic; padding:6px 0">Khoang tàu chưa có Đặc sản vùng miền nào.</div>`;

        const marketHtml = this.renderSharedMarketListingsHtml(p, true);

        const html = `
            <div class="modal-header-badge" style="background:${region.color}33; border-color:${region.color}">
                <span>⚓ THƯƠNG CẢNG &amp; SÀN GIAO THƯƠNG: ${tile.portName.toUpperCase()}</span>
                <span class="badge-tag">${region.name}</span>
            </div>
            <h2 class="modal-title">Trung Tâm Giao Thương Đặc Sản 6 Vùng &amp; Chợ Hàng Hải Liên Đội</h2>
            <p class="modal-desc">
                <strong>Thế mạnh kinh tế vùng:</strong> ${region.strengths}<br/>
                <em>(Mỗi lần giao dịch tại cảng tốn 1 AP Tương Tác. Bạn có thể mua đặc sản gốc, bán đặc sản xuyên vùng cho Cảng, hoặc mua/bán trực tiếp với các Người chơi khác trên Sàn Chợ Chung!)</em>
            </p>

            <div class="port-grid-sections">
                <div class="port-box">
                    <h3>1. Mua Đặc Sản Bản Địa Tại Vùng Sản Xuất (Giá gốc: 2 Xu / thẻ)</h3>
                    <div class="trade-row-card highlight">
                        <div>
                            <div style="font-size:16px; font-weight:700; color:#e5c365">${spec.icon} ${spec.name}</div>
                            <div style="font-size:12px; color:#c8d2dc; margin-top:3px">${spec.desc}</div>
                            <div style="font-size:11.5px; color:#7ab8c9; margin-top:4px">
                                📈 <strong>Bảng giá thu mua theo khoảng cách vùng (Rulebook Mục V):</strong><br/>
                                • Bán cách <strong>1 vùng</strong> = <strong>4 Xu</strong> (Lãi ròng 2 Xu) | Cách <strong>2 vùng</strong> = <strong>6 Xu</strong> (Lãi ròng 4 Xu)<br/>
                                • Bán Xuyên Việt (<strong>3–5 vùng</strong>) = <strong>8 Xu + 1 Key Ngẫu Nhiên</strong> (hoặc lấy <strong>10 Xu</strong>)
                            </div>
                        </div>
                        <button class="btn-trade-action gold" onclick="window.GAME.buySpecialtyAtPort(${region.id})">
                            🛒 Mua Đặc Sản (2 Xu)
                        </button>
                    </div>
                </div>

                <div class="port-box">
                    <h3>2. Kho Hàng Đặc Sản Trên Tàu Của Bạn (${p.specialties.length} kiện) — Bán Cho Cảng Hoặc Đăng Lên Chợ</h3>
                    ${sellableListHtml}
                </div>

                <div class="port-box" style="border-color:#4f8699">
                    <h3>3. 🤝 Sàn Giao Dịch Hàng Hải Chung (Người Chơi Đăng Bán &amp; Người Chơi Khác Mua Lại)</h3>
                    <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:8px">
                        <button class="btn-trade-action" onclick="window.GAME.listResourceOnPlayerMarket('food', 2)">📢 Đăng bán 1 🌾 Lúa (Giá 2 Xu)</button>
                        <button class="btn-trade-action" onclick="window.GAME.listResourceOnPlayerMarket('wood', 2)">📢 Đăng bán 1 🌲 Gỗ (Giá 2 Xu)</button>
                        <button class="btn-trade-action" onclick="window.GAME.listResourceOnPlayerMarket('iron', 3)">📢 Đăng bán 1 ⛏️ Sắt (Giá 3 Xu)</button>
                    </div>
                    ${marketHtml}
                </div>

                <div class="port-box">
                    <h3>4. Mua Chìa Khóa Mở Cổng Di Tích &amp; Tiếp Tế (Rulebook Mục IV)</h3>
                    <div class="key-shop-grid">
                        <div class="key-shop-item">
                            <div class="key-title">🗝️ Key 1 (Di Tích Dễ)</div>
                            <div class="key-sub">Mở cổng Di tích Cấp 1</div>
                            <button class="btn-trade-action" onclick="window.GAME.buyKeyAtPort(1, 2)">Mua: 2 Xu</button>
                        </div>
                        <div class="key-shop-item">
                            <div class="key-title">🗝️ Key 2 (Di Tích Vừa)</div>
                            <div class="key-sub">Mở cổng Di tích Cấp 2</div>
                            <button class="btn-trade-action" onclick="window.GAME.buyKeyAtPort(2, 4)">Mua: 4 Xu</button>
                        </div>
                        <div class="key-shop-item">
                            <div class="key-title">🗝️ Key 3 (Di Tích Khó)</div>
                            <div class="key-sub">Mở cổng Di tích Cấp 3</div>
                            <button class="btn-trade-action gold" onclick="window.GAME.buyKeyAtPort(3, 7)">Mua: 7 Xu</button>
                        </div>
                        <div class="key-shop-item">
                            <div class="key-title">🌾 Lương Thực Tiếp Tế</div>
                            <div class="key-sub">Phí cập bến Di tích</div>
                            <button class="btn-trade-action" onclick="window.GAME.buySupplyAtPort('food', 1)">Mua: 1 Xu</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="modal-actions">
                <button class="btn-primary-gold" onclick="window.GAME.finishPortVisit()">Rời Thương Cảng</button>
            </div>
        `;

        this.currentPortTile = tile;
        this.showModal(html);
    }

    openMaritimeMarketModal() {
        const p = this.getActivePlayer();
        const canAct = this.isMyTurn();
        const marketHtml = this.renderSharedMarketListingsHtml(p, false);

        const playerSpecHtml = (canAct ? p.specialties : []).map((item, idx) => {
            const originReg = window.GAME_DATA.regions[item.regionId];
            return `
                <div class="trade-row-card">
                    <div>
                        <strong>${item.icon} ${item.name}</strong>
                        <span style="font-size:12px; color:#94a3b8"> (Vùng gốc: ${originReg.name})</span>
                    </div>
                    <div style="display:flex; gap:6px">
                        <button class="btn-trade-action" onclick="window.GAME.listSpecialtyOnPlayerMarket(${idx}, 3, true)">Đăng bán giá 3 Xu</button>
                        <button class="btn-trade-action gold" onclick="window.GAME.listSpecialtyOnPlayerMarket(${idx}, 4, true)">Đăng bán giá 4 Xu</button>
                    </div>
                </div>
            `;
        }).join("") || `<div style="color:#94a3b8; font-style:italic">${canAct ? 'Bạn chưa có Đặc sản vùng nào trong khoang để đăng bán.' : 'Chỉ người chơi đang trong lượt mới có thể đăng bán hoặc mua hàng.'}</div>`;

        const html = `
            <div class="modal-header-badge" style="background:#2d687833; border-color:#5c9ead">
                <span>⚖️ SÀN GIAO THƯƠNG HÀNG HẢI LIÊN ĐỘI &amp; BẢNG GIÁ KINH TẾ 6 VÙNG</span>
                <span class="badge-tag">Người chơi Bán &amp; Mua trực tiếp</span>
            </div>
            <h2 class="modal-title">Chợ Giao Thương Giữa Các Hải Đội &amp; Đặc Sản Vùng Miền</h2>
            <p class="modal-desc">
                Tại đây, người chơi đang trong lượt có thể <strong>đăng bán Đặc sản vùng, Lương thực, Gỗ, Sắt</strong> lên Chợ chung và <strong>người chơi khác có thể mua lại</strong> để kịp vượt biển mở Di tích hoặc gom hàng buôn Xuyên Việt!
            </p>

            <div class="port-grid-sections">
                ${canAct ? `
                <div class="port-box" style="border-color:#c59b27">
                    <h3>📦 Đăng Bán Hàng Từ Khoang Tàu Của ${p.name} Lên Chợ Chung</h3>
                    <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:10px">
                        <button class="btn-trade-action" onclick="window.GAME.listResourceOnPlayerMarket('food', 2, true)">📢 Đăng bán 1 🌾 Lúa (2 Xu) [Có: ${p.food}]</button>
                        <button class="btn-trade-action" onclick="window.GAME.listResourceOnPlayerMarket('wood', 2, true)">📢 Đăng bán 1 🌲 Gỗ (2 Xu) [Có: ${p.wood}]</button>
                        <button class="btn-trade-action" onclick="window.GAME.listResourceOnPlayerMarket('iron', 3, true)">📢 Đăng bán 1 ⛏️ Sắt (3 Xu) [Có: ${p.iron}]</button>
                    </div>
                    ${playerSpecHtml}
                </div>
                ` : ''}

                <div class="port-box" style="border-color:#5c9ead">
                    <h3>🛒 Các Lô Hàng Đang Chào Bán Trên Sàn</h3>
                    ${marketHtml}
                </div>
            </div>

            <div class="modal-actions">
                <button class="btn-primary-gold" onclick="window.GAME.closeModal()">Đóng Sàn Giao Thương</button>
            </div>
        `;
        this.showModal(html);
    }

    renderSharedMarketListingsHtml(activePlayer, insidePortModal = false) {
        if (this.marketListings.length === 0) {
            return `<div style="color:#94a3b8; font-style:italic; padding:8px 0">Hiện chưa có lô hàng nào đang rao bán trên sàn.</div>`;
        }
        const canAct = this.isMyTurn();
        return this.marketListings.map(listing => {
            const isOwn = activePlayer && (listing.sellerId === activePlayer.id);
            const regionInfo = listing.itemType === "specialty"
                ? ` • Xuất xứ: ${window.GAME_DATA.regions[listing.regionId].name}`
                : "";
            return `
                <div class="trade-row-card">
                    <div>
                        <strong style="color:#e5c365">${listing.icon} ${listing.name}</strong>
                        <div style="font-size:12px; color:#cbd5e1">
                            Người bán: <strong>${listing.sellerName}</strong>${regionInfo} • Giá: <strong style="color:#68b684">${listing.price} Xu</strong>
                        </div>
                    </div>
                    <div>
                        ${!canAct
                            ? `<span style="font-size:11.5px; color:#94a3b8">Chờ tới lượt để giao dịch</span>`
                            : (isOwn
                                ? `<button class="btn-trade-action" style="background:#475569" onclick="window.GAME.cancelMarketListing(${listing.id}, ${insidePortModal})">Thu hồi về tàu</button>`
                                : `<button class="btn-trade-action gold" onclick="window.GAME.buyMarketListing(${listing.id}, ${insidePortModal})">🛒 Mua Ngay (${listing.price} Xu)</button>`)
                        }
                    </div>
                </div>
            `;
        }).join("");
    }

    listSpecialtyOnPlayerMarket(specIdx, price, fromMarketModal = false) {
        if (!this.isMyTurn()) return;
        const p = this.getActivePlayer();
        const item = p.specialties[specIdx];
        if (!item) return;

        if (!fromMarketModal && this.currentPortTile) this.ensurePortApDeducted();
        p.specialties.splice(specIdx, 1);

        this.marketListings.unshift({
            id: this.nextListingId++,
            sellerId: p.id,
            sellerName: p.name,
            itemType: "specialty",
            regionId: item.regionId,
            name: item.name,
            icon: item.icon,
            price: price
        });

        window.SFX.playClick();
        this.logEvent(`📢 ${p.name} đã đăng bán đặc sản [${item.icon} ${item.name}] lên Sàn Giao Thương với giá ${price} Xu!`);
        this.updateUI();
        this.syncMultiplayerGameState();
        if (fromMarketModal) this.openMaritimeMarketModal();
        else if (this.currentPortTile) this.openTradePortModal(this.currentPortTile);
    }

    listResourceOnPlayerMarket(resType, price, fromMarketModal = false) {
        if (!this.isMyTurn()) return;
        const p = this.getActivePlayer();
        if (p[resType] < 1) {
            this.showToast("Bạn không có sẵn tài nguyên này trong khoang để đăng bán!");
            return;
        }
        if (!fromMarketModal && this.currentPortTile) this.ensurePortApDeducted();
        p[resType] -= 1;

        const meta = {
            food: { name: "Lương Thực (Lúa Gạo)", icon: "🌾" },
            wood: { name: "Gỗ Đóng Tàu", icon: "🌲" },
            iron: { name: "Quặng Sắt & Đinh", icon: "⛏️" }
        }[resType];

        this.marketListings.unshift({
            id: this.nextListingId++,
            sellerId: p.id,
            sellerName: p.name,
            itemType: "resource",
            resType: resType,
            name: meta.name,
            icon: meta.icon,
            price: price
        });

        window.SFX.playClick();
        this.logEvent(`📢 ${p.name} đăng bán [1 ${meta.icon} ${meta.name}] lên Sàn Giao Thương với giá ${price} Xu.`);
        this.updateUI();
        this.syncMultiplayerGameState();
        if (fromMarketModal) this.openMaritimeMarketModal();
        else if (this.currentPortTile) this.openTradePortModal(this.currentPortTile);
    }

    buyMarketListing(listingId, insidePortModal = false) {
        if (!this.isMyTurn()) return;
        const buyer = this.getActivePlayer();
        const idx = this.marketListings.findIndex(l => l.id === listingId);
        if (idx === -1) return;
        const listing = this.marketListings[idx];

        if (buyer.coins < listing.price) {
            this.showToast(`Không đủ Xu! Cần ${listing.price} Xu để mua lô hàng này.`);
            return;
        }
        if (this.getCargoCount(buyer) >= 8) {
            this.showToast("Khoang tàu của bạn đã đầy (8/8 thẻ)!");
            return;
        }

        if (insidePortModal && this.currentPortTile) {
            this.ensurePortApDeducted();
        }

        buyer.coins -= listing.price;

        if (listing.sellerId >= 0) {
            const seller = this.players.find(pl => pl.id === listing.sellerId);
            if (seller) {
                seller.coins = Math.min(10, seller.coins + listing.price);
                this.logEvent(`🤝 Giao dịch thành công! ${buyer.name} đã mua [${listing.icon} ${listing.name}] từ ${seller.name} với giá ${listing.price} Xu!`);
            }
        } else {
            this.logEvent(`🛒 ${buyer.name} đã mua [${listing.icon} ${listing.name}] từ ${listing.sellerName} với giá ${listing.price} Xu.`);
        }

        if (listing.itemType === "specialty") {
            buyer.specialties.push({
                regionId: listing.regionId,
                name: listing.name,
                icon: listing.icon
            });
        } else if (listing.itemType === "resource") {
            buyer[listing.resType] += 1;
        }

        this.marketListings.splice(idx, 1);
        window.SFX.playCoin();
        this.updateUI();
        this.syncMultiplayerGameState();

        if (insidePortModal && this.currentPortTile) this.openTradePortModal(this.currentPortTile);
        else this.openMaritimeMarketModal();
    }

    cancelMarketListing(listingId, insidePortModal = false) {
        if (!this.isMyTurn()) return;
        const p = this.getActivePlayer();
        const idx = this.marketListings.findIndex(l => l.id === listingId);
        if (idx === -1) return;
        const listing = this.marketListings[idx];
        if (listing.sellerId !== p.id) return;

        if (this.getCargoCount(p) >= 8) {
            this.showToast("Khoang tàu đã đầy (8/8), chưa thể thu hồi hàng!");
            return;
        }

        if (listing.itemType === "specialty") {
            p.specialties.push({ regionId: listing.regionId, name: listing.name, icon: listing.icon });
        } else if (listing.itemType === "resource") {
            p[listing.resType] += 1;
        }

        this.marketListings.splice(idx, 1);
        this.updateUI();
        this.syncMultiplayerGameState();
        if (insidePortModal && this.currentPortTile) this.openTradePortModal(this.currentPortTile);
        else this.openMaritimeMarketModal();
    }

    ensurePortApDeducted() {
        const p = this.getActivePlayer();
        if (!this.portApDeducted && p.ap >= 1) {
            this.spendInteractiveAP(p);
            this.portApDeducted = true;
        }
    }

    buySpecialtyAtPort(regionId) {
        if (!this.isMyTurn()) return;
        const p = this.getActivePlayer();
        if (p.coins < 2) {
            this.showToast("Không đủ Xu! Cần 2 Xu để mua Đặc sản vùng.");
            return;
        }
        if (this.getCargoCount(p) >= 8) {
            this.showToast("Khoang tàu đã đạt giới hạn 8 thẻ hàng!");
            return;
        }
        this.ensurePortApDeducted();
        const reg = window.GAME_DATA.regions[regionId];
        p.coins -= 2;
        p.specialties.push({
            regionId: reg.id,
            name: reg.specialty.shortName,
            icon: reg.specialty.icon
        });
        window.SFX.playCoin();
        this.logEvent(`📦 ${p.name} mua đặc sản [${reg.specialty.icon} ${reg.specialty.shortName}] tại ${reg.name} với giá 2 Xu.`);
        this.updateUI();
        this.syncMultiplayerGameState();
        this.openTradePortModal(this.currentPortTile);
    }

    sellSpecialtyAtPort(specIndex, coinPrice, grantRandomKey) {
        if (!this.isMyTurn()) return;
        const p = this.getActivePlayer();
        const item = p.specialties[specIndex];
        if (!item) return;

        this.ensurePortApDeducted();
        p.specialties.splice(specIndex, 1);
        p.coins = Math.min(10, p.coins + coinPrice);

        let keyMsg = "";
        if (grantRandomKey && this.getCargoCount(p) < 8) {
            const randKey = [1, 2, 3][Math.floor(Math.random() * 3)];
            p.keys[randKey] += 1;
            keyMsg = ` + 1 Chìa Khóa Cấp ${randKey}`;
        }

        window.SFX.playCoin();
        this.world.triggerBurstAnimation(p.q, p.r, 0xd4af37, 22);
        this.logEvent(`💰 ${p.name} bán thương phẩm [${item.icon} ${item.name}] thu về ${coinPrice} Xu${keyMsg}!`);
        this.updateUI();
        this.syncMultiplayerGameState();
        this.openTradePortModal(this.currentPortTile);
    }

    buyKeyAtPort(keyLevel, cost) {
        if (!this.isMyTurn()) return;
        const p = this.getActivePlayer();
        if (p.coins < cost) {
            this.showToast(`Không đủ Xu! Cần ${cost} Xu để mua Key ${keyLevel}.`);
            return;
        }
        if (this.getCargoCount(p) >= 8) {
            this.showToast("Khoang tàu đã đầy (8/8 thẻ)!");
            return;
        }
        this.ensurePortApDeducted();
        p.coins -= cost;
        p.keys[keyLevel] += 1;
        window.SFX.playCoin();
        this.logEvent(`🗝️ ${p.name} đã mua Key ${keyLevel} tại cảng với giá ${cost} Xu.`);
        this.showToast(`🗝️ Đã mua Key ${keyLevel}!`);
        this.updateUI();
        this.syncMultiplayerGameState();
        this.openTradePortModal(this.currentPortTile);
    }

    buySupplyAtPort(type, cost) {
        if (!this.isMyTurn()) return;
        const p = this.getActivePlayer();
        if (p.coins < cost) {
            this.showToast("Không đủ Xu!");
            return;
        }
        if (this.getCargoCount(p) >= 8) {
            this.showToast("Khoang tàu đã đầy (8/8 thẻ)!");
            return;
        }
        this.ensurePortApDeducted();
        p.coins -= cost;
        p[type] += 1;
        window.SFX.playCoin();
        this.updateUI();
        this.syncMultiplayerGameState();
        this.openTradePortModal(this.currentPortTile);
    }

    finishPortVisit() {
        this.portApDeducted = false;
        this.closeModal();
        this.updateUI();
        this.checkAutoEndTurnIfNoAP();
    }

    // ------------------------------------------------------------------------
    // V. RARE GOLDEN / SILVER AXE NPC MINIGAME + LIVE SHARED QUIZ BROADCAST
    // ------------------------------------------------------------------------
    openNPCMinigameModal(tile) {
        const p = this.getActivePlayer();
        if (!this.isMyTurn()) return;
        if (!this.canSpendInteractiveAP(p)) {
            this.showToast("Cần 1 AP Tương Tác để trò chuyện với Tiên Ông!");
            return;
        }

        const rawEv = window.GAME_DATA.npcEvents[Math.floor(Math.random() * window.GAME_DATA.npcEvents.length)];
        const shuffledQuiz = this.prepareShuffledQuiz(rawEv);
        this.pendingNPCContext = { tile, rawEv, shuffledQuiz };

        this.liveQuizState = {
            id: "qz_npc_" + Date.now(),
            phase: "asking",
            actorId: p.id,
            actorName: p.name,
            badgeColor: "#c59b27",
            badgeTitle: `🧙‍♂️ SỰ KIỆN HIẾM: ${rawEv.npcName.toUpperCase()}`,
            title: `${p.name} Gặp ${rawEv.title}`,
            desc: rawEv.story,
            quiz: shuffledQuiz,
            chosenIdx: null,
            outcomeTitle: null
        };
        this.syncMultiplayerGameState();

        const html = `
            <div class="modal-header-badge" style="background:#c59b2728; border-color:#c59b27">
                <span>🧙‍♂️ SỰ KIỆN HIẾM (4–5 VÒNG 1 LẦN): ${rawEv.npcName.toUpperCase()}</span>
            </div>
            <h2 class="modal-title">${rawEv.title}</h2>
            <p class="modal-desc">${rawEv.story}</p>
            <div class="quiz-box">
                <div class="quiz-question">❓ ${shuffledQuiz.q}</div>
                <div class="quiz-options">
                    ${shuffledQuiz.options.map((opt, idx) => `
                        <button class="quiz-opt-btn" onclick="window.GAME.resolveNPCMinigame(${idx})">
                            <span class="opt-letter">${String.fromCharCode(65 + idx)}</span>
                            <span>${opt}</span>
                        </button>
                    `).join("")}
                </div>
            </div>
        `;
        this.showModal(html);
    }

    resolveNPCMinigame(chosenIdx) {
        const ctx = this.pendingNPCContext;
        if (!ctx) return;
        const { tile, rawEv, shuffledQuiz } = ctx;
        const p = this.getActivePlayer();

        this.spendInteractiveAP(p);
        const isCorrect = (chosenIdx === shuffledQuiz.correct);
        const reward = isCorrect ? 3 : 2;
        p.coins = Math.min(10, p.coins + reward);

        this.world.despawnRareNPC();
        this.nextNPCSpawnRound = this.roundNumber + 4 + Math.floor(Math.random() * 2);

        window.SFX.playCoin();
        this.world.triggerBurstAnimation(tile.q, tile.r, 0xd4af37, 24);
        this.logEvent(`🧙‍♂️ ${p.name} hoàn thành thử thách của ${rawEv.npcName}, nhận +${reward} Xu! Tiên Ông sẽ tái xuất ở Vòng ${this.nextNPCSpawnRound}.`);

        if (this.liveQuizState) {
            this.liveQuizState.phase = "answered";
            this.liveQuizState.chosenIdx = chosenIdx;
            this.liveQuizState.outcomeTitle = `${p.name} Nhận +${reward} Xu Từ ${rawEv.npcName}!`;
        }

        const html = `
            <div class="modal-header-badge" style="background:#2e6f4033; border-color:#4b9b68">
                <span>🎁 PHẦN THƯỞNG TIÊN ÔNG: +${reward} XU VÀNG</span>
            </div>
            <h2 class="modal-title">${isCorrect ? 'Tấm Lòng Trung Thực & Uyên Bác (+3 Xu)!' : 'Khích Lệ Tinh Thần Hàng Hải (+2 Xu)!'}</h2>
            ${this.renderQuizVisualMemoryCard(shuffledQuiz, chosenIdx)}
            <p class="modal-desc" style="margin-top:10px; margin-bottom:4px">
                🌫️ <em>Tiên Ông Rìu Vàng đã ẩn mình vào làn sương và sẽ xuất hiện ngẫu nhiên ở một vùng biển khác sau 4–5 vòng nữa!</em>
            </p>
            <div class="modal-actions">
                <button class="btn-primary-gold" onclick="window.GAME.closeModal()">Đã Ghi Nhớ &amp; Tiếp Tục Hải Trình</button>
            </div>
        `;
        this.showModal(html);
        this.updateUI();
        this.syncMultiplayerGameState();
    }

    // ------------------------------------------------------------------------
    // VI. CONQUERING MONUMENTS + LIVE SHARED QUIZ BROADCAST
    // ------------------------------------------------------------------------
    openMonumentModal(tile) {
        const p = this.getActivePlayer();
        const mon = window.GAME_DATA.monuments.find(m => m.id === tile.monumentId);
        if (!mon) return;

        const tier = tile.monumentTier;
        const tierMeta = {
            1: { name: "CẤP 1 – DỄ (EASY)", keyReq: "1 🗝️ Key 1", foodCost: 1, ironCost: 0, coinCost: 1, rewardCoins: 3, color: "#3f7a58" },
            2: { name: "CẤP 2 – TRUNG BÌNH (MEDIUM)", keyReq: "1 🗝️ Key 2", foodCost: 2, ironCost: 0, coinCost: 3, rewardCoins: 4, color: "#b8862d" },
            3: { name: "CẤP 3 – KHÓ (HARD)", keyReq: "1 🗝️ Key 3", foodCost: 3, ironCost: 1, coinCost: 6, rewardCoins: 5, color: "#a8423f" }
        }[tier];

        const alreadyConqueredByPlayer = p ? p.relics.some(r => r.id === mon.id) : false;
        const hasMatchingKey = p ? ((p.keys[tier] || 0) > 0) : false;
        const hasDockingFee = p ? ((p.food >= tierMeta.foodCost) && (p.iron >= tierMeta.ironCost) && (p.coins >= tierMeta.coinCost)) : false;
        const isPlayerAtMonument = p ? (p.q === tile.q && p.r === tile.r) : false;
        const canChallenge = this.isGameStarted && this.isMyTurn() && isPlayerAtMonument && !tile.monumentLocked && !alreadyConqueredByPlayer && hasMatchingKey && hasDockingFee && this.canSpendInteractiveAP(p);

        let statusNotice = "";
        if (!this.isGameStarted) {
            statusNotice = `<div class="alert-banner warning">ℹ️ Bạn đang xem hồ sơ Di tích từ Cẩm Nang. Hãy bắt đầu ván đấu để lái tàu tới chinh phục Bảo Vật!</div>`;
        } else if (!this.isMyTurn()) {
            statusNotice = `<div class="alert-banner warning">👁️ Bạn đang xem hồ sơ Di tích trong lượt của <strong>${p ? p.name : ''}</strong>. Khi tới lượt của mình, hãy lái thuyền đến đây để mở cổng!</div>`;
        } else if (tile.monumentLocked) {
            statusNotice = `<div class="alert-banner danger">🔒 Di tích Cấp Khó này đã được chinh phục và KHÓA VĨNH VIỄN trong ván đấu này (Rulebook Mục VI.3)!</div>`;
        } else if (alreadyConqueredByPlayer) {
            statusNotice = `<div class="alert-banner success">👑 Bạn đã sở hữu Bảo Vật Hoàng Gia [${mon.relicIcon} ${mon.relicName}] từ Di tích này!</div>`;
        } else if (!isPlayerAtMonument) {
            statusNotice = `<div class="alert-banner warning">⛵ Hãy điều khiển thuyền của bạn cập bến ô lục giác của <strong>${mon.name}</strong> để mở cổng chinh phục Bảo Vật!</div>`;
        } else if (!hasMatchingKey || !hasDockingFee) {
            statusNotice = `
                <div class="alert-banner warning">
                    ⚠️ <strong>Điều kiện Mở Cổng &amp; Phí Cập Bến (${tierMeta.name}):</strong><br/>
                    • Chìa khóa yêu cầu: <strong>${tierMeta.keyReq}</strong> (Đang có: Key ${tier}: ${p.keys[tier] || 0})<br/>
                    • Phí cập bến: <strong>${tierMeta.foodCost} Lương thực ${tierMeta.ironCost ? `+ ${tierMeta.ironCost} Sắt ` : ''}+ ${tierMeta.coinCost} Xu</strong>
                    (Hiện có: ${p.food} Lương thực, ${p.iron} Sắt, ${p.coins} Xu)
                </div>
            `;
        }

        const html = `
            <div class="modal-header-badge" style="background:${tierMeta.color}33; border-color:${tierMeta.color}">
                <span>🏛️ DI TÍCH LỊCH SỬ – ĐỊA LÝ: ${tierMeta.name}</span>
                <span class="badge-tag">${mon.province} (${tile.region.name})</span>
            </div>

            <div class="monument-showcase-layout">
                <div class="monument-photo-frame">
                    <img src="${mon.image}" alt="${mon.name}" class="monument-real-img" />
                    <div class="photo-caption">
                        <div>📸 <strong>Ảnh thực tế:</strong> ${mon.name} (${mon.province})</div>
                        <div class="copyright-cite-box">
                            <div>✍️ <strong>Tác giả ảnh:</strong> ${mon.photoAuthor || "Wikimedia Commons"} • <strong>Giấy phép:</strong> ${mon.photoLicense || "CC BY-SA"}</div>
                            <div>🔗 <strong>Nguồn ảnh gốc:</strong> <a href="${mon.photoSourceUrl || '#'}" target="_blank" rel="noopener noreferrer" class="cite-link">Wikimedia Commons File ↗</a></div>
                            <div>📰 <strong>Nguồn bài báo &amp; Tư liệu:</strong> ${mon.articleSourceCite || mon.sourceCite}</div>
                        </div>
                    </div>
                </div>

                <div class="monument-lore-column">
                    <h2 class="modal-title" style="margin-top:0">${mon.name}</h2>
                    <div class="npc-storyteller-card">
                        <div class="npc-avatar">🧓</div>
                        <div>
                            <div style="font-weight:700; color:#e5c365">${mon.npcName} – ${mon.npcRole}</div>
                            <div style="font-size:12.5px; color:#d8e1e8; margin-top:2px">
                                "Di tích ${mon.name} trong ván này có độ khó <strong>${tierMeta.name}</strong>. Hãy đọc kỹ hồ sơ Địa lý chính thống dưới đây trước khi bước vào khảo nghiệm!"
                            </div>
                        </div>
                    </div>

                    <div class="geography-lesson-card">
                        <div class="lesson-headline">📘 ${mon.geographyLesson.headline}</div>
                        <p class="lesson-summary">${mon.geographyLesson.summary}</p>
                        <ul class="lesson-bullets">
                            ${mon.geographyLesson.keyFacts.map(f => `<li>${f}</li>`).join("")}
                        </ul>
                        <div class="lesson-source-footer">
                            📚 <strong>Trích dẫn học thuật &amp; Báo chí:</strong> ${mon.sourceCite}
                        </div>
                    </div>
                </div>
            </div>

            ${statusNotice}

            <div class="modal-actions" style="justify-content:space-between">
                <button class="btn-secondary" onclick="window.GAME.closeModal()">Đóng Cửa Sổ</button>
                ${canChallenge ? `
                    <button class="btn-primary-gold" onclick="window.GAME.startMonumentChallenge('${tile.monumentId}')">
                        🗝️ Nộp Phí &amp; Giải Đố Cấp ${tier} (${mon.relicIcon} +1 Bảo Vật &amp; +${tierMeta.rewardCoins} Xu)
                    </button>
                ` : ''}
            </div>
        `;
        this.currentMonumentTile = tile;
        this.showModal(html);
    }

    startMonumentChallenge(monumentId) {
        if (!this.isMyTurn()) return;
        const tile = this.currentMonumentTile;
        const p = this.getActivePlayer();
        const mon = window.GAME_DATA.monuments.find(m => m.id === monumentId);
        const tier = tile.monumentTier;
        const tierMeta = {
            1: { foodCost: 1, ironCost: 0, coinCost: 1, rewardCoins: 3 },
            2: { foodCost: 2, ironCost: 0, coinCost: 3, rewardCoins: 4 },
            3: { foodCost: 3, ironCost: 1, coinCost: 6, rewardCoins: 5 }
        }[tier];

        this.spendInteractiveAP(p);
        p.keys[tier] = Math.max(0, (p.keys[tier] || 0) - 1);
        p.food -= tierMeta.foodCost;
        p.iron -= tierMeta.ironCost;
        p.coins -= tierMeta.coinCost;
        this.updateUI();

        const tierPool = (mon.tieredQuizzes && mon.tieredQuizzes[tier]) ? mon.tieredQuizzes[tier] : mon.tieredQuizzes[1];
        const rawQuiz = tierPool[Math.floor(Math.random() * tierPool.length)];
        const quiz = this.prepareShuffledQuiz(rawQuiz);

        this.pendingMonumentQuiz = { tile, mon, tier, tierMeta, quiz };

        // Broadcast Monument Quiz live to all players in the room!
        this.liveQuizState = {
            id: "qz_mon_" + Date.now(),
            phase: "asking",
            actorId: p.id,
            actorName: p.name,
            badgeColor: "#c59b27",
            badgeTitle: `👑 KHẢO NGHIỆM DI TÍCH CẤP ${tier}: ${mon.name.toUpperCase()}`,
            title: `${p.name} Đang Chinh Phục Bảo Vật Tại ${mon.name}`,
            desc: `Thử thách Cấp ${tier} tại ${mon.province}. Chỉ ${p.name} mới có quyền chọn đáp án; các thuyền trưởng khác cùng theo dõi trực tiếp!`,
            quiz,
            chosenIdx: null,
            outcomeTitle: null
        };
        this.syncMultiplayerGameState();

        const html = `
            <div class="modal-header-badge" style="background:#b8862d33; border-color:#c59b27">
                <span>👑 KHẢO NGHIỆM BẢO VẬT HOÀNG GIA (ĐỘ KHÓ CẤP ${tier}): ${mon.name.toUpperCase()}</span>
            </div>
            <h2 class="modal-title">${mon.npcName} Đặt Câu Hỏi Địa Lý Cấp ${tier}</h2>
            <p class="modal-desc">
                ${tier === 3
                    ? `<span style="color:#e07a77; font-weight:700">⚠️ CẢNH BÁO DI TÍCH CẤP 3 – KHÓ (HARD MONUMENT):</span> Nếu trả lời đúng, Di tích sẽ bị khóa vĩnh viễn sau khi bạn nhận Bảo Vật. Nếu trả lời SAI, thuyền của bạn chịu phạt <strong>-3 HP</strong>, mất phí cập bến và bị sóng đẩy lùi!`
                    : `Trả lời chính xác câu hỏi Cấp ${tier} để nhận ngay <strong>+${tierMeta.rewardCoins} Xu Vàng</strong> và <strong>1 BẢO VẬT HOÀNG GIA (${mon.relicIcon} ${mon.relicName})</strong>!`
                }
            </p>
            <div class="quiz-box">
                <div class="quiz-question">❓ ${quiz.q}</div>
                <div class="quiz-options">
                    ${quiz.options.map((opt, idx) => `
                        <button class="quiz-opt-btn" onclick="window.GAME.resolveMonumentChallenge(${idx})">
                            <span class="opt-letter">${String.fromCharCode(65 + idx)}</span>
                            <span>${opt}</span>
                        </button>
                    `).join("")}
                </div>
            </div>
        `;
        this.showModal(html);
    }

    resolveMonumentChallenge(chosenIdx) {
        const ctx = this.pendingMonumentQuiz;
        if (!ctx) return;
        const { tile, mon, tier, tierMeta, quiz } = ctx;
        const p = this.getActivePlayer();
        const isCorrect = (chosenIdx === quiz.correct);

        if (this.liveQuizState) {
            this.liveQuizState.phase = "answered";
            this.liveQuizState.chosenIdx = chosenIdx;
            this.liveQuizState.outcomeTitle = isCorrect
                ? `👑 ${p.name} Chinh Phục Thành Công [${mon.relicIcon} ${mon.relicName}]!`
                : `❌ ${p.name} Trả Lời Chưa Chính Xác Tại ${mon.name}`;
        }

        if (isCorrect) {
            p.coins = Math.min(10, p.coins + tierMeta.rewardCoins);
            p.relics.push({ id: mon.id, name: mon.relicName, icon: mon.relicIcon, monumentName: mon.name });

            if (tier === 3) {
                tile.monumentLocked = true;
            }

            window.SFX.playRelicFanfare();
            this.world.triggerBurstAnimation(tile.q, tile.r, 0xd4af37, 36);
            this.logEvent(`👑 CHIẾN CÔNG LỊCH SỬ! ${p.name} đã chinh phục [${mon.name} - Cấp ${tier}], thu thập Bảo Vật [${mon.relicIcon} ${mon.relicName}] (${p.relics.length}/3) và +${tierMeta.rewardCoins} Xu!`);

            if (p.relics.length >= 3) {
                this.updateUI();
                this.syncMultiplayerGameState();
                this.showVictoryScreen(p, quiz, chosenIdx);
                return;
            }

            const html = `
                <div class="modal-header-badge" style="background:#2e6f4033; border-color:#4b9b68">
                    <span>👑 CHINH PHỤC DI TÍCH THÀNH CÔNG! (${p.relics.length}/3 BẢO VẬT HOÀNG GIA)</span>
                </div>
                <h2 class="modal-title">Nhận Bảo Vật: ${mon.relicIcon} ${mon.relicName} &amp; +${tierMeta.rewardCoins} Xu!</h2>
                ${this.renderQuizVisualMemoryCard(quiz, chosenIdx)}
                <div class="modal-actions">
                    <button class="btn-primary-gold" onclick="window.GAME.closeModal()">Tiếp Tục Hành Trình Vàng Son</button>
                </div>
            `;
            this.showModal(html);
        } else {
            window.SFX.playDamage();
            let penaltyDesc = "Bạn đã mất phí cập bến. Hãy quan sát kỹ Đáp án đúng và Hình ảnh minh họa thực tế dưới đây để ghi nhớ kiến thức nhé!";

            if (tier === 3) {
                p.hp = Math.max(0, p.hp - 3);
                this.pushShipBack(p);
                penaltyDesc = `Theo luật Di Tích Cấp Khó (Mục VI.3): Thuyền của bạn bị phạt <strong>-3 HP</strong> (còn ${p.hp}/${p.maxHp} HP), mất phí cập bến và bị sóng dữ đẩy lùi ra biển!`;
                this.logEvent(`💥 ${p.name} trả lời sai tại Di Tích Cấp Khó [${mon.name}]! Bị phạt -3 HP (Còn ${p.hp} HP) và đẩy lùi tàu!`);

                if (p.hp <= 0) {
                    p.eliminated = true;
                    const shipMesh = this.world.shipMeshes.get(p.id);
                    if (shipMesh) shipMesh.visible = false;
                    this.logEvent(`☠️ Thuyền của ${p.name} đã bị đắm (0 HP) và BỊ LOẠI TRỰC TIẾP khỏi trò chơi!`);
                }
            }

            const html = `
                <div class="modal-header-badge" style="background:#8c2d2d33; border-color:#c95b5b">
                    <span>❌ KHẢO NGHIỆM CHƯA THÀNH CÔNG — XEM ĐÁP ÁN ĐÚNG &amp; HÌNH ẢNH THỰC TẾ</span>
                </div>
                <h2 class="modal-title">Ghi Nhớ Kiến Thức Địa Lý Tại ${mon.name}</h2>
                <p class="modal-desc">${penaltyDesc}</p>
                ${this.renderQuizVisualMemoryCard(quiz, chosenIdx)}
                <div class="modal-actions">
                    <button class="btn-primary-gold" onclick="window.GAME.closeModal()">Đã Ghi Nhớ &amp; Đóng</button>
                </div>
            `;
            this.showModal(html);
        }

        this.updateUI();
        this.syncMultiplayerGameState();
    }

    pushShipBack(player) {
        const dirs = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
        for (const [dq, dr] of dirs) {
            const adj = this.world.hexMap.get(`${player.q + dq},${player.r + dr}`);
            if (adj && adj.navigable && adj.terrain === "sea") {
                player.q = adj.q;
                player.r = adj.r;
                this.world.animateShipAlongPath(player, [adj], player.id, this.players.length);
                break;
            }
        }
    }

    // ------------------------------------------------------------------------
    // VIII. PHASE 3: END OF TURN & RARE NPC SPAWNING (4-5 ROUNDS)
    // ------------------------------------------------------------------------
    endPlayerTurn(isAuto = false) {
        clearTimeout(this.autoEndTurnTimer);
        if (this.isBusy) return;
        const p = this.getActivePlayer();
        if (!p) return;

        // If human turn, only the active player can end their turn
        if (!p.isAI && !this.isMyTurn()) {
            this.showToast(`👁️ Đang là lượt của ${p.name}! Bạn không thể bấm Kết thúc lượt hộ người khác.`);
            return;
        }

        if (p.ap > 0 && !isAuto) {
            this.logEvent(`⏭️ ${p.name} chủ động kết thúc lượt (hủy ${p.ap} AP còn dư).`);
        } else if (isAuto) {
            this.logEvent(`⏭️ ${p.name} đã dùng hết AP và hoàn tất lượt đi.`);
        }
        p.ap = 0;
        p.hexMoveCredits = 0;
        this.liveQuizState = null;

        while (this.getCargoCount(p) > 8) {
            if (p.wood > 0) p.wood--;
            else if (p.food > 0) p.food--;
            else break;
        }

        if (p.relics.length >= 3) {
            this.showVictoryScreen(p);
            return;
        }

        this.advanceToNextPlayer();
    }

    advanceToNextPlayer() {
        const alivePlayers = this.players.filter(pl => !pl.eliminated);
        if (alivePlayers.length === 0) {
            this.showToast("Tất cả các thuyền đều đã bị đắm! Hãy bắt đầu ván mới.");
            return;
        }

        let nextIdx = (this.activePlayerIdx + 1) % this.players.length;
        if (nextIdx <= this.activePlayerIdx) {
            this.advanceGlobalRound();
        }
        this.activePlayerIdx = nextIdx;

        if (this.players[this.activePlayerIdx].eliminated) {
            this.advanceToNextPlayer();
            return;
        }

        this.beginTurn();
    }

    advanceGlobalRound() {
        this.roundNumber += 1;

        this.world.hexTiles.forEach(tile => {
            if (tile.resourceCooldown > 0) {
                tile.resourceCooldown -= 1;
                if (tile.resourceCooldown === 0) {
                    this.logEvent(`🌱 Tài nguyên tại vùng [${tile.region.name}] đã tái tạo 100% trữ lượng!`);
                }
            }
        });
        this.world.updateResourceVisuals();

        if (this.roundNumber >= this.nextNPCSpawnRound) {
            const spawnedTile = this.world.spawnRareNPCOnRandomSeaHex();
            if (spawnedTile) {
                this.logEvent(`🧙‍♂️ [Sự Kiện Hiếm Vòng ${this.roundNumber}] Tiên Ông Rìu Vàng – Rìu Bạc vừa xuất hiện ngẫu nhiên trên vùng biển [${spawnedTile.region.name}]!`);
                this.showToast(`🧙‍♂️ Tiên Ông Rìu Vàng vừa xuất hiện tại vùng biển ${spawnedTile.region.name}!`);
            }
            this.nextNPCSpawnRound = this.roundNumber + 4 + Math.floor(Math.random() * 2);
        }
    }

    // ------------------------------------------------------------------------
    // SMART AI COMMANDER ENGINE (RUNS ON HOST & SYNCS TO ALL PLAYERS)
    // ------------------------------------------------------------------------
    executeAITurn() {
        if (this.roomState.code && !this.roomState.isHost) return;
        const ai = this.getActivePlayer();
        if (!ai || !ai.isAI || ai.eliminated) return;

        const reachableMap = this.computeNavigablePaths(ai.q, ai.r, 6);
        const curTile = this.getCurrentTile(ai);
        const candidates = [{ tile: curTile, steps: 0, path: [] }];
        reachableMap.forEach((info, key) => {
            const t = this.world.hexMap.get(key);
            if (t) candidates.push({ tile: t, steps: info.steps, path: info.path });
        });

        let bestChoice = candidates[0];
        let bestScore = -999;

        candidates.forEach(cand => {
            const t = cand.tile;
            let score = -cand.steps * 1.2;

            if (t.monumentId && !t.monumentLocked && !ai.relics.some(r => r.id === t.monumentId)) {
                const tier = t.monumentTier;
                const hasKey = (ai.keys[tier] || 0) > 0;
                const feeCoins = tier === 1 ? 1 : (tier === 2 ? 3 : 6);
                const feeFood = tier;
                const feeIron = tier === 3 ? 1 : 0;
                if (hasKey && ai.coins >= feeCoins && ai.food >= feeFood && ai.iron >= feeIron) {
                    score += 130;
                } else {
                    score += 10;
                }
            }

            if (t.isPort) {
                if (ai.specialties.some(s => Math.abs(s.regionId - t.regionId) >= 2)) {
                    score += 65;
                } else if (ai.coins >= 2 && this.getCargoCount(ai) < 7) {
                    score += 32;
                }
            }

            if (t.resourceType && t.resourceCooldown === 0 && this.getCargoCount(ai) < 7) {
                score += 28;
            }

            if (t.hasNPC && ai.coins < 9) {
                score += 45;
            }

            if (score > bestScore) {
                bestScore = score;
                bestChoice = cand;
            }
        });

        const afterMove = () => {
            const destTile = this.getCurrentTile(ai);
            if (ai.ap >= 1 && destTile) {
                this.performAIInteractiveAction(ai, destTile);
            }
            this.syncMultiplayerGameState();
            setTimeout(() => {
                if (ai.relics.length < 3) {
                    this.endPlayerTurn(true);
                }
            }, 650);
        };

        if (bestChoice && bestChoice.steps > 0) {
            this.movePlayerAlongRoute(ai, bestChoice.tile, bestChoice.steps, bestChoice.path, afterMove);
        } else {
            afterMove();
        }
    }

    performAIInteractiveAction(ai, tile) {
        if (tile.monumentId && !tile.monumentLocked && !ai.relics.some(r => r.id === tile.monumentId)) {
            const tier = tile.monumentTier;
            const hasKey = (ai.keys[tier] || 0) > 0;
            const feeCoins = tier === 1 ? 1 : (tier === 2 ? 3 : 6);
            const feeFood = tier;
            const feeIron = tier === 3 ? 1 : 0;

            if (hasKey && ai.coins >= feeCoins && ai.food >= feeFood && ai.iron >= feeIron) {
                this.spendInteractiveAP(ai);
                ai.keys[tier] = Math.max(0, (ai.keys[tier] || 0) - 1);
                ai.coins -= feeCoins;
                ai.food -= feeFood;
                ai.iron -= feeIron;

                const mon = window.GAME_DATA.monuments.find(m => m.id === tile.monumentId);
                const rewardCoins = tier === 1 ? 3 : (tier === 2 ? 4 : 5);
                ai.coins = Math.min(10, ai.coins + rewardCoins);
                ai.relics.push({ id: mon.id, name: mon.relicName, icon: mon.relicIcon, monumentName: mon.name });
                if (tier === 3) tile.monumentLocked = true;

                window.SFX.playRelicFanfare();
                this.world.triggerBurstAnimation(tile.q, tile.r, 0xd4af37, 30);
                this.logEvent(`🤖 [AI] ${ai.name} đã giải đố thành công tại [${mon.name}] và nhận Bảo Vật [${mon.relicIcon} ${mon.relicName}] (${ai.relics.length}/3)!`);

                if (ai.relics.length >= 3) {
                    this.showVictoryScreen(ai);
                }
                return;
            }
        }

        if (tile.isPort) {
            this.spendInteractiveAP(ai);
            for (let i = ai.specialties.length - 1; i >= 0; i--) {
                const sp = ai.specialties[i];
                const dist = Math.abs(sp.regionId - tile.regionId);
                if (dist >= 1) {
                    ai.specialties.splice(i, 1);
                    const gain = dist === 1 ? 4 : (dist === 2 ? 6 : 8);
                    ai.coins = Math.min(10, ai.coins + gain);
                    if (dist >= 3 && this.getCargoCount(ai) < 8) {
                        ai.keys[1] += 1;
                    }
                    this.logEvent(`🤖 [AI] ${ai.name} bán đặc sản [${sp.icon} ${sp.name}] tại ${tile.portName} thu về +${gain} Xu!`);
                }
            }

            if (ai.coins >= 4 && ai.keys[2] === 0 && this.getCargoCount(ai) < 8) {
                ai.coins -= 4;
                ai.keys[2] += 1;
                this.logEvent(`🤖 [AI] ${ai.name} mua Key 2 tại ${tile.portName}.`);
            } else if (ai.coins >= 2 && ai.keys[1] === 0 && this.getCargoCount(ai) < 8) {
                ai.coins -= 2;
                ai.keys[1] += 1;
                this.logEvent(`🤖 [AI] ${ai.name} mua Key 1 tại ${tile.portName}.`);
            } else if (ai.coins >= 2 && this.getCargoCount(ai) < 7) {
                ai.coins -= 2;
                const specItem = {
                    regionId: tile.regionId,
                    name: tile.region.specialty.shortName,
                    icon: tile.region.specialty.icon
                };
                if (Math.random() < 0.4 && this.marketListings.length < 6) {
                    this.marketListings.unshift({
                        id: this.nextListingId++,
                        sellerId: ai.id,
                        sellerName: ai.name,
                        itemType: "specialty",
                        regionId: specItem.regionId,
                        name: specItem.name,
                        icon: specItem.icon,
                        price: 3
                    });
                    this.logEvent(`📢 [AI] ${ai.name} vừa đăng bán đặc sản [${specItem.icon} ${specItem.name}] lên Sàn Giao Thương Chung (Giá 3 Xu)!`);
                } else {
                    ai.specialties.push(specItem);
                    this.logEvent(`🤖 [AI] ${ai.name} mua đặc sản [${specItem.icon} ${specItem.name}] tại ${tile.portName}.`);
                }
            }
            return;
        }

        if (tile.resourceType && tile.resourceCooldown === 0 && this.getCargoCount(ai) < 8) {
            this.spendInteractiveAP(ai);
            ai[tile.resourceType] += 1;
            const cds = { food: 2, wood: 3, iron: 4 };
            tile.resourceCooldown = cds[tile.resourceType];
            ai.coins = Math.min(10, ai.coins + 2);
            this.world.updateResourceVisuals();
            this.world.triggerBurstAnimation(tile.q, tile.r, 0x5c9ead, 16);
            this.logEvent(`🤖 [AI] ${ai.name} khai thác tài nguyên tại ${tile.region.name} (+2 Xu).`);
            return;
        }

        if (tile.hasNPC) {
            this.spendInteractiveAP(ai);
            ai.coins = Math.min(10, ai.coins + 3);
            this.world.despawnRareNPC();
            this.nextNPCSpawnRound = this.roundNumber + 4 + Math.floor(Math.random() * 2);
            this.logEvent(`🤖 [AI] ${ai.name} gặp Tiên Ông Rìu Vàng (+3 Xu). Tiên Ông sẽ tái xuất ở Vòng ${this.nextNPCSpawnRound}!`);
            return;
        }
    }

    // ------------------------------------------------------------------------
    // VICTORY SCREEN (3 ROYAL RELICS COLLECTED)
    // ------------------------------------------------------------------------
    showVictoryScreen(winner, lastQuiz = null, lastChosenIdx = null) {
        window.SFX.playRelicFanfare();
        const html = `
            <div class="modal-header-badge" style="background:#c59b2733; border-color:#c59b27">
                <span>🏆 CHIẾN THẮNG TUYỆT ĐỐI – THE GOLDEN JOURNEY (HÀNH TRÌNH VÀNG SON)</span>
            </div>
            <h2 class="modal-title" style="font-size:26px; color:#e5c365">
                👑 ${winner.name} (${winner.vesselTitle}) Đăng Quang!
            </h2>
            <p class="modal-desc">
                Chúc mừng <strong>${winner.name}</strong> đã xuất sắc vượt qua sóng gió Biển Đông, giao thương đặc sản qua <strong>6 Vùng Kinh Tế Việt Nam</strong> và thu thập trọn bộ <strong>3 BẢO VẬT HOÀNG GIA (ROYAL RELICS)</strong>!
            </p>
            <div class="relic-showcase-row">
                ${winner.relics.map(r => `
                    <div class="relic-victory-card">
                        <div style="font-size:36px">${r.icon}</div>
                        <div style="font-weight:700; color:#e5c365; margin-top:6px">${r.name}</div>
                        <div style="font-size:12px; color:#cbd5e1">${r.monumentName}</div>
                    </div>
                `).join("")}
            </div>
            ${lastQuiz !== null ? this.renderQuizVisualMemoryCard(lastQuiz, lastChosenIdx) : ''}
            <div class="modal-actions">
                <button class="btn-primary-gold" onclick="window.GAME.closeModal(); window.GAME.showWaitingScreen()">
                    🚪 Quay Về Màn Hình Chờ / Tạo Ván Mới
                </button>
            </div>
        `;
        this.showModal(html);
    }

    // ------------------------------------------------------------------------
    // UI UPDATES, TOOLTIPS, ATLAS & RULEBOOK MODALS
    // ------------------------------------------------------------------------
    updateUI() {
        const p = this.getActivePlayer();
        if (!p) return;
        const localP = this.getLocalPlayer() || p;
        const myTurn = this.isMyTurn();
        const tile = this.getCurrentTile(p);

        document.getElementById("hud-round").textContent = `Vòng ${this.roundNumber}`;

        // Top bar: Local player's assigned ship & live turn status
        const myShipEl = document.getElementById("hud-my-ship");
        if (myShipEl && localP) {
            myShipEl.innerHTML = `<span class="fleet-dot" style="background:${localP.color}"></span> ⛵ Thuyền của bạn: <strong>${localP.name}</strong>`;
        }

        const turnStatusEl = document.getElementById("hud-turn-status");
        if (turnStatusEl) {
            if (myTurn) {
                turnStatusEl.innerHTML = `🎯 Đang là lượt của bạn (${p.ap} AP)`;
                turnStatusEl.className = "turn-status-pill my-turn";
            } else {
                turnStatusEl.innerHTML = `👁️ Lượt của: ${p.name} (Camera tự do)`;
                turnStatusEl.className = "turn-status-pill spectator-turn";
            }
        }

        document.getElementById("active-player-dot").style.backgroundColor = p.color;
        document.getElementById("active-player-name").textContent = `${p.name} ${p.isAI ? '(Bot AI)' : (myTurn ? '(Lượt của bạn)' : '(Đang đi lượt)')}`;
        document.getElementById("active-player-vessel").textContent = p.vesselTitle;

        const moveApRemaining = Math.max(0, Math.min(3 - (p.moveApSpent || 0), p.ap));
        document.getElementById("stat-ap").textContent = `${p.ap} / 4 AP`;
        document.getElementById("stat-move-steps").textContent = `Đi tối đa: ${this.getRemainingHexSteps(p)} Ô (${moveApRemaining}/3 AP)`;
        document.getElementById("stat-hp").textContent = `${"❤️".repeat(p.hp)}${"🖤".repeat(p.maxHp - p.hp)} (${p.hp}/${p.maxHp})`;
        document.getElementById("stat-coins").textContent = `${p.coins} / 10 Xu`;
        document.getElementById("stat-cargo").textContent = `${this.getCargoCount(p)} / 8 Thẻ`;
        document.getElementById("stat-relics").textContent = `${p.relics.length} / 3 👑`;

        document.getElementById("inv-food").textContent = p.food;
        document.getElementById("inv-wood").textContent = p.wood;
        document.getElementById("inv-iron").textContent = p.iron;
        document.getElementById("inv-k1").textContent = p.keys[1] || 0;
        document.getElementById("inv-k2").textContent = p.keys[2] || 0;
        document.getElementById("inv-k3").textContent = p.keys[3] || 0;

        const specContainer = document.getElementById("inv-specialties");
        if (p.specialties.length === 0) {
            specContainer.innerHTML = `<span class="empty-tag">Chưa có đặc sản (Mua tại Cảng giá 2 Xu)</span>`;
        } else {
            specContainer.innerHTML = p.specialties.map(s => `<span class="spec-badge">${s.icon} ${s.name}</span>`).join("");
        }

        const relicContainer = document.getElementById("inv-relics-list");
        if (p.relics.length === 0) {
            relicContainer.innerHTML = `<span class="empty-tag">Chưa có Bảo Vật (Đạt 3 Bảo Vật để thắng)</span>`;
        } else {
            relicContainer.innerHTML = p.relics.map(r => `<span class="relic-badge">${r.icon} ${r.name}</span>`).join("");
        }

        const ctxBtn = document.getElementById("btn-context-action");
        const repairBtn = document.getElementById("btn-repair-ship");
        const endTurnBtn = document.getElementById("btn-end-turn");

        if (!myTurn) {
            ctxBtn.innerHTML = `👁️ Đang Xem Lượt Của ${p.name} (Góc Nhìn Tự Do)`;
            ctxBtn.disabled = true;
            ctxBtn.className = "btn-action primary-action";
            if (repairBtn) repairBtn.disabled = true;
            if (endTurnBtn) endTurnBtn.disabled = true;
        } else {
            if (repairBtn) repairBtn.disabled = false;
            if (endTurnBtn) endTurnBtn.disabled = false;
            if (tile) {
                if (tile.monumentId) {
                    const mon = window.GAME_DATA.monuments.find(m => m.id === tile.monumentId);
                    ctxBtn.innerHTML = `🏛️ Khám Phá Di Tích: ${mon.name} (1 AP)`;
                    ctxBtn.disabled = false;
                    ctxBtn.className = "btn-action primary-action";
                } else if (tile.isPort) {
                    ctxBtn.innerHTML = `⚓ Giao Thương Tại ${tile.portName} (1 AP)`;
                    ctxBtn.disabled = false;
                    ctxBtn.className = "btn-action primary-action";
                } else if (tile.resourceType) {
                    const cdText = tile.resourceCooldown > 0 ? ` (Hồi: ${tile.resourceCooldown} vòng)` : ` (1 AP)`;
                    ctxBtn.innerHTML = `⛏️ Khai Thác Tài Nguyên &amp; Đố Vui${cdText}`;
                    ctxBtn.disabled = tile.resourceCooldown > 0 || !this.canSpendInteractiveAP(p);
                    ctxBtn.className = "btn-action primary-action";
                } else if (tile.hasNPC) {
                    ctxBtn.innerHTML = `🧙‍♂️ Gặp Tiên Ông Rìu Vàng Rìu Bạc (1 AP)`;
                    ctxBtn.disabled = !this.canSpendInteractiveAP(p);
                    ctxBtn.className = "btn-action primary-action";
                } else {
                    ctxBtn.innerHTML = `⚖️ Mở Sàn Giao Thương Hàng Hải (${this.marketListings.length} lô)`;
                    ctxBtn.disabled = false;
                    ctxBtn.className = "btn-action primary-action";
                }
            }
        }

        const marketBadgeEl = document.getElementById("market-count-badge");
        if (marketBadgeEl) marketBadgeEl.textContent = this.marketListings.length;

        const rosterEl = document.getElementById("fleet-roster");
        rosterEl.innerHTML = this.players.map((pl, idx) => {
            const isMe = localP && (pl.id === localP.id);
            return `
                <div class="roster-card ${idx === this.activePlayerIdx ? 'active' : ''} ${pl.eliminated ? 'eliminated' : ''}"
                     onclick="window.GAME.world.focusCameraOnHex(${pl.q}, ${pl.r})">
                    <div class="roster-left">
                        <span class="fleet-dot" style="background:${pl.color}"></span>
                        <div>
                            <div class="roster-name">
                                #${idx + 1} ${pl.name} ${pl.isAI ? '🤖' : '👤'}
                                ${isMe ? '<span style="color:#88c09c; font-size:10.5px">[Bạn]</span>' : ''}
                            </div>
                            <div class="roster-sub">${pl.eliminated ? '☠️ Đã Đắm Tàu' : `❤️ ${pl.hp} HP • 🪙 ${pl.coins} Xu • 📦 ${this.getCargoCount(pl)}/8`}</div>
                        </div>
                    </div>
                    <div class="roster-relics" title="Số Bảo Vật Hoàng Gia đã thu thập (3 = Chiến thắng)">
                        👑 ${pl.relics.length}/3
                    </div>
                </div>
            `;
        }).join("");
    }

    handleHexHover(tile, clientX, clientY) {
        const tooltip = document.getElementById("hex-tooltip");
        if (!this.isGameStarted || !tile) {
            tooltip.classList.add("hidden");
            return;
        }

        let title = `${tile.region.name}`;
        let details = `Đặc sản vùng: ${tile.region.specialty.icon} ${tile.region.specialty.shortName} (2 Xu)`;

        if (!tile.navigable) {
            if (tile.terrain === "reef") {
                title = `🪸 Rạn Đá Ngầm Biển Đông (${tile.region.name})`;
                details = `⛔ <strong>Vật cản hàng hải:</strong> Tàu thuyền không thể đi xuyên qua rạn đá ngầm. Hãy lái vòng qua!`;
            } else {
                title = `⛰️ Địa Hình Đất Liền / Núi Cao (${tile.region.name})`;
                details = `⛔ <strong>Vật cản địa hình:</strong> Tàu chỉ di chuyển trên các vùng nước biển và ven bờ!`;
            }
        } else if (tile.monumentId) {
            const mon = window.GAME_DATA.monuments.find(m => m.id === tile.monumentId);
            const tier = tile.monumentTier;
            const reqMap = {
                1: {
                    badge: "🟢 Cấp 1 – Dễ (Easy)",
                    reqText: "1 🗝️ Key 1 + 1 🌾 Lúa + 1 🪙 Xu + 1 AP",
                    rewardText: "+1 👑 Bảo Vật & +3 🪙 Xu",
                    foodReq: 1, ironReq: 0, coinReq: 1
                },
                2: {
                    badge: "🟡 Cấp 2 – Trung Bình (Medium)",
                    reqText: "1 🗝️ Key 2 + 2 🌾 Lúa + 3 🪙 Xu + 1 AP",
                    rewardText: "+1 👑 Bảo Vật & +4 🪙 Xu",
                    foodReq: 2, ironReq: 0, coinReq: 3
                },
                3: {
                    badge: "🔴 Cấp 3 – Khó (Hard)",
                    reqText: "1 🗝️ Key 3 + 3 🌾 Lúa + 1 ⛏️ Sắt + 6 🪙 Xu + 1 AP",
                    rewardText: "+1 👑 Bảo Vật & +5 🪙 Xu (Sai phạt -3 HP)",
                    foodReq: 3, ironReq: 1, coinReq: 6
                }
            }[tier];

            const refPlayer = this.getLocalPlayer() || this.getActivePlayer();
            let playerCheckHtml = "";
            if (refPlayer) {
                const hasKey = (refPlayer.keys[tier] || 0) >= 1;
                const hasFood = refPlayer.food >= reqMap.foodReq;
                const hasIron = refPlayer.iron >= reqMap.ironReq;
                const hasCoins = refPlayer.coins >= reqMap.coinReq;
                const allReady = hasKey && hasFood && hasIron && hasCoins;
                playerCheckHtml = `
                    <div style="margin-top:5px; padding-top:4px; border-top:1px dashed rgba(197,155,39,0.35); font-size:10.5px; color:${allReady ? '#88e2a8' : '#f4b4b2'}">
                        ${allReady ? '✅ <strong>Thuyền bạn đã ĐỦ tài nguyên mở Di tích này!</strong>' : '⚠️ <strong>Khoang tàu bạn hiện có:</strong>'}<br/>
                        🗝️ Key ${tier}: <strong>${refPlayer.keys[tier] || 0}/1</strong> • 🌾 Lúa: <strong>${refPlayer.food}/${reqMap.foodReq}</strong>${reqMap.ironReq ? ` • ⛏️ Sắt: <strong>${refPlayer.iron}/${reqMap.ironReq}</strong>` : ''} • 🪙 Xu: <strong>${refPlayer.coins}/${reqMap.coinReq}</strong>
                    </div>
                `;
            }

            title = `🏛️ ${mon.name} (${mon.province})`;
            details = `
                <div style="margin-bottom:3px">Độ khó: <strong>${reqMap.badge}</strong></div>
                <div style="background:rgba(197,155,39,0.16); border:1px solid rgba(229,195,101,0.45); border-radius:6px; padding:4px 7px; margin:4px 0">
                    📋 <strong>Yêu cầu mở cổng Di tích:</strong><br/>
                    <span style="color:#ffd54f; font-weight:800">${reqMap.reqText}</span>
                </div>
                <div>🎁 Phần thưởng: <strong>${mon.relicIcon} ${mon.relicName}</strong> (${reqMap.rewardText})</div>
                ${playerCheckHtml}
            `;
        } else if (tile.isPort) {
            title = `⚓ ${tile.portName} (${tile.region.name})`;
            details = `Mua Đặc sản: ${tile.region.specialty.icon} ${tile.region.specialty.shortName} (2 Xu) | Bán xuyên vùng (4–10 Xu) | Mua Key 1, 2, 3`;
        } else if (tile.resourceType) {
            const rMap = { food: "🌾 Vựa Lúa / Ngư Trường (Hồi 2 vòng)", wood: "🌲 Lâm Trường Gỗ (Hồi 3 vòng)", iron: "⛏️ Mỏ Khoáng Sản Sắt (Hồi 4 vòng)" };
            title = rMap[tile.resourceType];
            details = tile.resourceCooldown > 0
                ? `⏳ Đang tái tạo sinh thái: Còn ${tile.resourceCooldown} vòng`
                : `✅ Sẵn sàng khai thác (+1 Tài nguyên &amp; +1~2 Xu)`;
        } else if (tile.hasNPC) {
            title = `🧙‍♂️ Tiên Ông Rìu Vàng – Rìu Bạc (Sự kiện hiếm)`;
            details = `✨ Xuất hiện 4–5 vòng 1 lần! Đến gặp để giải đố nhận <strong>+2 đến +3 Xu Vàng</strong>!`;
        }

        const routeInfo = this.world.reachablePaths.get(`${tile.q},${tile.r}`);
        if (routeInfo && this.isMyTurn() && this.getActivePlayer()) {
            const apCost = Math.ceil(Math.max(0, routeInfo.steps - this.getActivePlayer().hexMoveCredits) / 2);
            details += `<br/><span style="color:#e5c365">⛵ Nhấn để lái tàu theo luồng nước (${routeInfo.steps} ô • Tốn ${apCost} AP)</span>`;
        }

        tooltip.innerHTML = `<div class="tt-title">${title}</div><div class="tt-body">${details}</div>`;
        tooltip.style.left = `${Math.min(window.innerWidth - 300, clientX + 16)}px`;
        tooltip.style.top = `${Math.min(window.innerHeight - 140, clientY + 16)}px`;
        tooltip.classList.remove("hidden");
    }

    openAtlasModal() {
        const regionsHtml = window.GAME_DATA.regions.map(r => {
            const mons = window.GAME_DATA.monuments.filter(m => m.regionId === r.id);
            return `
                <div class="atlas-region-card" style="border-left: 5px solid ${r.color}">
                    <div class="atlas-region-header">
                        <span class="atlas-region-title" style="color:${r.color}">${r.id + 1}. ${r.name} (${r.enName})</span>
                        <span class="spec-badge">${r.specialty.icon} Đặc sản: ${r.specialty.name} (Giá gốc: 2 Xu)</span>
                    </div>
                    <div class="atlas-region-body">
                        <p><strong>🏔️ Địa hình:</strong> ${r.terrainDesc}</p>
                        <p><strong>🌤️ Khí hậu:</strong> ${r.climateDesc}</p>
                        <p><strong>📈 Thế mạnh kinh tế:</strong> ${r.strengths}</p>
                        <div class="atlas-monuments-row">
                            ${mons.map(m => `
                                <div class="atlas-mon-chip" onclick="window.GAME.previewMonumentEncyclopedia('${m.id}')">
                                    <img src="${m.image}" alt="${m.name}" />
                                    <div>
                                        <div style="font-weight:700; color:#e5c365">🏛️ ${m.name} (${m.province})</div>
                                        <div style="font-size:10.5px; color:#b8c4d0">📸 Ảnh: ${m.photoAuthor} (${m.photoLicense}) • Nhấn xem chi tiết</div>
                                    </div>
                                </div>
                            `).join("")}
                        </div>
                    </div>
                </div>
            `;
        }).join("");

        const html = `
            <div class="modal-header-badge" style="background:#2d687833; border-color:#5c9ead">
                <span>🗺️ CẨM NANG ĐỊA LÝ 6 VÙNG KINH TẾ &amp; HỒ SƠ BẢN QUYỀN TƯ LIỆU</span>
            </div>
            <h2 class="modal-title">Bách Khoa Toàn Thư Địa Lý Kinh Tế &amp; Trích Dẫn Nguồn Chính Thống</h2>
            <p class="modal-desc">
                Tìm hiểu đặc trưng tự nhiên, thế mạnh kinh tế, đặc sản bản địa của <strong>6 Vùng Kinh Tế</strong> và nhấn vào từng Di tích để xem ảnh thực tế cùng trích dẫn tác giả, giấy phép Wikimedia Commons và bài báo tham khảo.
            </p>
            <div class="atlas-list-container">
                ${regionsHtml}
            </div>
            <div class="modal-actions">
                <button class="btn-primary-gold" onclick="window.GAME.closeModal()">Đóng Cẩm Nang</button>
            </div>
        `;
        this.showModal(html);
    }

    previewMonumentEncyclopedia(monId) {
        const tile = this.world.hexTiles.find(t => t.monumentId === monId);
        if (tile) {
            this.openMonumentModal(tile);
        }
    }

    openRulebookModal() {
        const html = `
            <div class="modal-header-badge" style="background:#c59b2725; border-color:#c59b27">
                <span>📜 LUẬT CHƠI CHÍNH THỨC – THE GOLDEN JOURNEY (BẢN NÂNG CẤP V3.2)</span>
            </div>
            <h2 class="modal-title">Quy Tắc Bàn Cờ Chiến Thuật Địa Lý &amp; Kinh Tế 6 Vùng</h2>
            <div class="rulebook-grid">
                <div class="rule-card">
                    <h4>🏆 Mục Tiêu Tối Thượng (Endgame)</h4>
                    <p>Thu thập đủ <strong>3 BẢO VẬT HOÀNG GIA (Royal Relics)</strong> từ các Di tích để giành chiến thắng tuyệt đối ngay lập tức!</p>
                </div>
                <div class="rule-card">
                    <h4>⚡ Câu Hỏi Tốc Độ Đầu Trận Xếp Lượt</h4>
                    <p>• Đầu trận, tất cả người chơi cùng trả lời <strong>1 Câu Hỏi Địa Lý Khởi Động</strong> (có đáp án &amp; hình minh họa).<br/>
                    • Ai trả lời <strong>đúng và nhanh nhất</strong> sẽ xuất phát đầu tiên (Lượt 1), nhanh thứ 2 đi Lượt 2...</p>
                </div>
                <div class="rule-card">
                    <h4>⛵ 4 AP Mỗi Lượt (Tối Đa 3 AP Di Chuyển)</h4>
                    <p>• Mỗi lượt bạn có <strong>4 AP</strong>: Tối đa <strong>3 AP</strong> được dùng cho việc di chuyển (tối đa 6 ô nước/lượt) và <strong>1 AP</strong> dùng cho hành động tương tác (khai thác, buôn bán, mở Di tích).<br/>
                    • Khi hết AP hoặc bấm <strong>Kết Thúc Lượt</strong>, lượt chơi tự động chuyển sang người tiếp theo.</p>
                </div>
                <div class="rule-card">
                    <h4>👁️ Góc Nhìn Tự Do &amp; Xem Trực Tiếp Quiz</h4>
                    <p>• Khi không phải lượt của mình, bạn có <strong>góc nhìn camera tự do</strong> nhưng không được di chuyển tàu.<br/>
                    • Khi có Quiz, câu hỏi hiện lên màn hình của <strong>tất cả người chơi</strong>, nhưng chỉ người đang trong lượt mới chọn đáp án; những người còn lại quan sát trực tiếp.</p>
                </div>
                <div class="rule-card">
                    <h4>📸 Thẻ Ghi Nhớ Trực Quan &amp; Bản Quyền</h4>
                    <p>• Sau mỗi câu hỏi Quiz, hệ thống hiển thị <strong>Đáp án đúng</strong> kèm <strong>Hình ảnh thực tế minh họa</strong> và trích dẫn nguồn rõ ràng (Wikimedia Commons, UNESCO, SGK Địa lý 12).</p>
                </div>
                <div class="rule-card">
                    <h4>🤝 Giao Thương Cảng &amp; Sàn Chợ Liên Đội</h4>
                    <p>• Mua Đặc sản gốc (2 Xu): Bán cách 1 vùng = <strong>4 Xu</strong>; cách 2 vùng = <strong>6 Xu</strong>; xuyên Việt (3–5 vùng) = <strong>8 Xu + 1 Key</strong> (hoặc 10 Xu).<br/>
                    • Đăng bán hoặc mua lại hàng hóa trên <strong>Sàn Chợ Liên Đội</strong>.</p>
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn-primary-gold" onclick="window.GAME.closeModal()">Đã Hiểu Luật Chơi</button>
            </div>
        `;
        this.showModal(html);
    }

    showModal(innerHTML) {
        const overlay = document.getElementById("modal-overlay");
        const content = document.getElementById("modal-content");
        content.innerHTML = innerHTML;
        overlay.classList.remove("hidden");
    }

    closeModal(fromSpectatorSync = false) {
        document.getElementById("modal-overlay").classList.add("hidden");
        // If active player closes their quiz modal, clear liveQuizState so spectators' modals close too
        if (!fromSpectatorSync && this.isMyTurn() && this.liveQuizState) {
            this.liveQuizState = null;
            this.syncMultiplayerGameState();
        }
        // Check if active player now has 0 AP after closing modal -> Auto-end turn!
        if (!fromSpectatorSync && this.isMyTurn()) {
            this.checkAutoEndTurnIfNoAP();
        }
    }

    logEvent(msg) {
        const logBox = document.getElementById("game-log-list");
        if (!logBox) return;
        const item = document.createElement("div");
        item.className = "log-entry";
        item.innerHTML = `<span class="log-turn">[V${this.roundNumber}]</span> ${msg}`;
        logBox.prepend(item);
    }

    showToast(msg) {
        const toast = document.getElementById("toast-banner");
        toast.textContent = msg;
        toast.classList.remove("hidden");
        clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => toast.classList.add("hidden"), 4000);
    }

    bindUIEvents() {
        document.getElementById("btn-context-action").addEventListener("click", () => {
            window.SFX.playClick();
            this.triggerContextualActionOnCurrentHex();
        });
        document.getElementById("btn-repair-ship").addEventListener("click", () => {
            window.SFX.playClick();
            this.actionRepairShip();
        });
        document.getElementById("btn-end-turn").addEventListener("click", () => {
            window.SFX.playClick();
            this.endPlayerTurn(false);
        });
        document.getElementById("btn-open-market").addEventListener("click", () => {
            window.SFX.playClick();
            this.openMaritimeMarketModal();
        });
        document.getElementById("btn-open-atlas").addEventListener("click", () => {
            window.SFX.playClick();
            this.openAtlasModal();
        });
        document.getElementById("btn-open-rules").addEventListener("click", () => {
            window.SFX.playClick();
            this.openRulebookModal();
        });
        document.getElementById("btn-open-room").addEventListener("click", () => {
            window.SFX.playClick();
            this.showWaitingScreen();
        });
        const roomPill = document.getElementById("room-code-pill");
        if (roomPill) {
            roomPill.addEventListener("click", () => {
                window.SFX.playClick();
                this.showWaitingScreen();
            });
        }
        const cleanBtn = document.getElementById("btn-toggle-clean-ui");
        if (cleanBtn) {
            cleanBtn.addEventListener("click", () => {
                window.SFX.playClick();
                this.toggleAllPanelsCleanMode();
            });
        }
        document.getElementById("btn-toggle-audio").addEventListener("click", (e) => {
            const muted = window.SFX.toggleMute();
            e.currentTarget.textContent = muted ? "🔇" : "🔊";
        });
        document.getElementById("btn-reset-cam").addEventListener("click", () => {
            const localP = this.getLocalPlayer() || this.getActivePlayer();
            if (localP) this.world.focusCameraOnHex(localP.q, localP.r);
        });

        const weatherSel = document.getElementById("weather-selector");
        if (weatherSel) {
            weatherSel.addEventListener("change", (e) => {
                this.world.setWeatherMode(e.target.value);
            });
        }
    }
}

window.addEventListener("DOMContentLoaded", () => {
    window.GAME = new GoldenJourneyGame();
});
