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

        // Shared Maritime Market Floor & Live Trade Bulletin Board + 6 Port Inventories (Reset every 8m30s)
        this.marketListings = [];
        this.nextListingId = 1;
        this.tradeBulletinNotices = [];
        this.portInventories = {};
        this.portResetIntervalSec = 510; // 8 minutes 30 seconds = 510s
        this.portResetRemainingSec = 510;
        this.selectedMarketPortFilter = "all";

        // 45-Minute In-Game Clock & Automatic Phased Weather Engine
        this.matchElapsedSec = 0;
        this.currentWeatherPhase = "sunny";
        this.weatherClockInterval = null;
        this.thunderstormChallengeTriggered = false;
        this.stormReadingTimerInterval = null;
        this.tickerCollapsed = false;

        // Manual Custom Drag-Path State (Double-click + Hold-drag to steer around Reefs)
        this.customDrawnPath = [];
        this.selectedRuleCategory = "overview";

        // Live Shared Quiz Broadcast state (synced to all players in room)
        this.liveQuizState = null;
        this.showingSpectatorQuizId = null;
        this.spectatorClosedAskingQuizId = null;
        this.spectatorHiddenAnsweredQuizId = null;
        this.lastSpectatorQuizSnapshot = null;
        this.quizAutoCloseInterval = null;

        // Hover Tooltip 0.5s Delay State (Only for POIs: Monument, Port, Resource, Rare NPC)
        this.hoverTooltipTimer = null;
        this.hoveredPOITileKey = null;
        this.lastHoverMouseX = 0;
        this.lastHoverMouseY = 0;

        // Sandbox / Creative Mode State (Minecraft-style creative controls)
        this.sandboxMode = false;
        this.sandboxInfiniteMove = false;
        this.sandboxTeleport = false;

        // Match Victory state (synced to all players + 15s auto-return to room lobby)
        this.matchWinner = null;
        this.victoryShownForMatch = false;
        this.victoryCountdownInterval = null;

        // Opening Turn-Order Speed Quiz state + 10s Pre-Game Countdown
        this.openingQuizState = null;
        this.openingQuizStartMs = 0;
        this.openingTimerInterval = null;
        this.preGameCountdownInterval = null;
        this.isPreGameCountingDown = false;
        this.hasSubmittedOpeningAnswer = false;
        this.localOpeningChoice = null;
        this.localOpeningElapsedMs = 0;

        // Auto-end turn timer guard
        this.autoEndTurnTimer = null;

        // Multiplayer Room & Waiting Screen State
        this.lobbySubView = "welcome"; // 'welcome' | 'browse'
        this.createRoomIsPrivate = false;
        this.roomState = {
            code: null,
            roomName: "",
            isPrivate: false,
            isHost: false,
            localPlayerName: localStorage.getItem("golden_player_name") || "Thuyền Trưởng",
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
        this.world.onCustomPathStart = (tile) => this.startCustomPathDrag(tile);
        this.world.onCustomPathStep = (tile) => this.stepCustomPathDrag(tile);
        this.world.onCustomPathCommit = () => this.commitCustomPathDrag();
        this.monumentAssignments = this.randomizeMonumentTiers();
        this.world.buildBoard(this.monumentAssignments);
        this.resetAllPortInventories(false);
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
        const myClientKey = `client_${this.clientId}`;
        const byShipKey = this.players.find(p => p.shipKey && p.shipKey === myClientKey);
        if (byShipKey) return byShipKey;
        const byClient = this.players.find(p => p.clientId && p.clientId === this.clientId);
        if (byClient) return byClient;
        if (this.roomState.code) {
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
            // Offline / Solo Sandbox mode: local player controls human turns
            return true;
        }
        const localP = this.getLocalPlayer();
        if (localP) {
            return World3D.getPlayerShipKey(active) === World3D.getPlayerShipKey(localP);
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
        clearInterval(this.quizAutoCloseInterval);
        clearInterval(this.weatherClockInterval);
        clearInterval(this.stormReadingTimerInterval);
        clearTimeout(this.autoEndTurnTimer);
        clearTimeout(this.hoverTooltipTimer);
        document.getElementById("waiting-screen-overlay").classList.remove("hidden");
        document.getElementById("top-hud-bar").classList.add("hidden-hud");
        document.getElementById("left-hud-panel").classList.add("hidden-hud");
        document.getElementById("right-hud-panel").classList.add("hidden-hud");
        const tickerWrap = document.getElementById("bottom-live-ticker-wrap");
        if (tickerWrap) tickerWrap.classList.add("hidden-hud");
        const yagiBanner = document.getElementById("yagi-red-alert-banner");
        if (yagiBanner) yagiBanner.classList.add("hidden");
        const sbPanel = document.getElementById("sandbox-creative-panel");
        if (sbPanel) sbPanel.classList.add("hidden");

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
        const tickerWrap = document.getElementById("bottom-live-ticker-wrap");
        if (tickerWrap) tickerWrap.classList.remove("hidden-hud");
        this.startMatchClockAndWeatherEngine();
        this.updateRoomBadgeUI();
    }

    renderWaitingScreen() {
        const container = document.getElementById("waiting-screen-body");
        if (!container) return;

        const nameInputEl = document.getElementById("welcome-player-name");
        if (nameInputEl && nameInputEl.value.trim()) {
            this.roomState.localPlayerName = nameInputEl.value.trim();
            localStorage.setItem("golden_player_name", this.roomState.localPlayerName);
        }

        // ====================================================================
        // VIEW 1A: WELCOME SCREEN (GREETING + PLAYER NAME + MAIN BUTTONS)
        // ====================================================================
        if (!this.roomState.code && this.lobbySubView !== "browse") {
            container.innerHTML = `
                <div class="lobby-hero">
                    <div class="lobby-hero-badge">⛵ Board Game Chiến Thuật 3D Địa Lý &amp; Kinh Tế</div>
                    <h1>HÀNH TRÌNH VÀNG SON</h1>
                    <p>Khám phá 6 Vùng Kinh Tế Việt Nam, giao thương đặc sản và chinh phục 3 Bảo Vật Hoàng Gia</p>
                </div>

                <div class="welcome-name-card">
                    <label for="welcome-player-name">👤 Đặt Tên Thuyền Trưởng Của Bạn</label>
                    <input type="text" id="welcome-player-name" class="clean-input"
                        placeholder="Nhập tên hiển thị trong phòng..."
                        value="${this.roomState.localPlayerName}"
                        oninput="window.GAME.updateLocalPlayerName(this.value)" />
                </div>

                <div class="welcome-actions-grid">
                    <button class="btn-lobby-main primary" onclick="window.GAME.openCreateRoomModal()">
                        <span class="btn-title">➕ Tạo Phòng Chơi</span>
                        <span class="btn-sub">Đặt tên phòng, chọn chế độ Công khai (Public) hoặc Riêng tư (Private có mật khẩu)</span>
                    </button>

                    <button class="btn-lobby-main" onclick="window.GAME.switchToBrowseRoomsView()">
                        <span class="btn-title">🚪 Vào Phòng / Tìm Phòng</span>
                        <span class="btn-sub">Xem danh sách các phòng đang mở hoặc nhập nhanh Mã Code 6 ký tự để tham gia</span>
                    </button>
                </div>

                <div class="welcome-footer-bar">
                    <div style="display:flex; gap:8px; flex-wrap:wrap">
                        <button class="btn-secondary" onclick="window.GAME.openAtlasModal()">🗺️ Cẩm Nang 6 Vùng</button>
                        <button class="btn-secondary" onclick="window.GAME.openRulebookModal()">📜 Luật Chơi</button>
                    </div>
                    <div style="display:flex; gap:8px; flex-wrap:wrap">
                        <button class="btn-trade-action gold" onclick="window.GAME.startSoloSandboxMode()" style="background:linear-gradient(135deg,#c026d3,#7e22ce); color:#fff; border:1px solid #f0abfc; box-shadow:0 4px 14px rgba(192,38,211,0.4)">
                            🛠️ Chế Độ Sáng Tạo (Sandbox 1 Mình)
                        </button>
                        <button class="btn-trade-action" onclick="window.GAME.startQuickSinglePlayerWithBots()">
                            ⚡ Chơi Đơn Cùng Máy (Bot AI)
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        // ====================================================================
        // VIEW 1B: BROWSE OPEN ROOMS & QUICK CODE ENTRY
        // ====================================================================
        if (!this.roomState.code && this.lobbySubView === "browse") {
            const curCodeEl = document.getElementById("wait-join-code");
            const savedJoinCode = (curCodeEl && curCodeEl.value) || this.prefilledRoomCode || "";

            const openRoomsHtml = this.openRoomsList.length === 0
                ? `<div style="color:#94a3b8; font-size:13px; text-align:center; padding:24px 0">Hiện chưa có phòng nào đang mở. Bạn có thể nhập mã phòng ở trên hoặc quay lại tạo phòng mới!</div>`
                : this.openRoomsList.map(r => `
                    <div class="room-item-row">
                        <div>
                            <div style="display:flex; align-items:center; gap:6px">
                                <strong style="color:#f8fafc; font-size:14.5px">${r.roomName || ('Phòng ' + r.code)}</strong>
                                <span class="room-privacy-tag ${r.isPrivate ? 'private' : 'public'}">
                                    ${r.isPrivate ? '🔒 Riêng tư' : '🌐 Công khai'}
                                </span>
                            </div>
                            <div style="font-size:12px; color:#94a3b8; margin-top:3px">
                                Mã: <strong style="color:#38bdf8">${r.code}</strong> • Chủ phòng: <strong>${r.hostName}</strong> • Người chơi: <strong>${r.activeCount}/5</strong>
                            </div>
                        </div>
                        <button class="btn-trade-action gold" onclick="window.GAME.attemptJoinListedRoom('${r.code}', ${Boolean(r.isPrivate)}, '${(r.roomName || r.code).replace(/'/g, "\\'")}')">
                            ${r.isPrivate ? '🔒 Nhập Mật Khẩu' : '🚪 Vào Phòng'}
                        </button>
                    </div>
                `).join("");

            container.innerHTML = `
                <div class="browse-top-bar">
                    <button class="btn-secondary" onclick="window.GAME.backToWelcomeView()">⬅️ Quay lại</button>
                    <h3 style="font-size:16px; font-weight:700; color:#f8fafc">Danh Sách Phòng Đang Mở</h3>
                    <button class="btn-secondary" onclick="window.GAME.fetchOpenRoomsList()">🔄 Làm mới</button>
                </div>

                <div class="quick-code-bar">
                    <input type="text" id="wait-join-code" class="clean-input code-input"
                        maxlength="8" placeholder="NHẬP MÃ PHÒNG (6 KÝ TỰ)..." value="${savedJoinCode}" />
                    <button class="btn-primary-gold" style="white-space:nowrap" onclick="window.GAME.joinMultiplayerRoomByCode()">
                        Vào Bằng Mã
                    </button>
                </div>

                <div id="open-rooms-list-box" class="rooms-directory-list">
                    ${openRoomsHtml}
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; padding-top:10px; border-top:1px solid rgba(255,255,255,0.08); font-size:12px; color:#94a3b8">
                    <span>Người chơi: <strong style="color:#f8fafc">${this.roomState.localPlayerName}</strong></span>
                    <button class="btn-trade-action" onclick="window.GAME.openCreateRoomModal()">➕ Tạo Phòng Mới</button>
                </div>
            `;
            return;
        }

        // ====================================================================
        // VIEW 2: INSIDE A WAITING ROOM LOBBY (5 PLAYER SEATS, RANDOM SHIPS)
        // ====================================================================
        const seats = this.roomState.seats || [];
        const activeSeats = seats.filter(s => s.type === "human" || s.type === "ai");
        const canStart = activeSeats.length >= 1 && activeSeats.length <= 5;

        const slotsHtml = seats.map((seat, idx) => {
            const isLocalSeat = (seat.clientId === this.clientId || idx === this.roomState.localSeatIdx);
            let cardClass = "slot-empty";
            let titleDisplay = "";
            let subText = "🎲 Chiến thuyền & màu sắc sẽ được phát ngẫu nhiên khi vào trận";
            let actionButtons = "";

            if (seat.type === "human") {
                cardClass = "slot-human";
                titleDisplay = `👤 ${seat.name} ${seat.isHost ? '<span style="color:#fbbf24; font-size:12px">(Chủ phòng)</span>' : ''} ${isLocalSeat ? '<span style="color:#34d399; font-size:12px">[Bạn]</span>' : ''}`;
                if (this.roomState.isHost && !seat.isHost) {
                    actionButtons = `
                        <button class="btn-trade-action danger" onclick="window.GAME.hostClearSeat(${idx})">
                            Mời ra
                        </button>
                    `;
                }
            } else if (seat.type === "ai") {
                cardClass = "slot-ai";
                titleDisplay = `🤖 ${seat.name}`;
                if (this.roomState.isHost) {
                    actionButtons = `
                        <button class="btn-secondary" style="padding:5px 10px; font-size:11.5px" onclick="window.GAME.hostClearSeat(${idx})">
                            Xóa Bot
                        </button>
                    `;
                }
            } else {
                cardClass = "slot-empty";
                titleDisplay = `Vị trí #${idx + 1} đang trống`;
                subText = "Đang chờ người chơi tham gia...";
                if (this.roomState.isHost) {
                    actionButtons = `
                        <button class="btn-trade-action" onclick="window.GAME.hostAddBotToSeat(${idx})">
                            + Thêm Bot AI
                        </button>
                    `;
                }
            }

            return `
                <div class="slot-card ${cardClass}">
                    <div class="slot-left-info">
                        <div class="slot-badge-num">${idx + 1}</div>
                        <div>
                            <div class="slot-player-title">${titleDisplay}</div>
                            <div class="slot-vessel-sub">${subText}</div>
                        </div>
                    </div>
                    <div class="slot-actions-right">
                        ${actionButtons}
                    </div>
                </div>
            `;
        }).join("");

        container.innerHTML = `
            <div class="room-lobby-banner">
                <div>
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px">
                        <strong style="font-size:16px; color:#f8fafc">${this.roomState.roomName || ('Phòng ' + this.roomState.code)}</strong>
                        <span class="room-privacy-tag ${this.roomState.isPrivate ? 'private' : 'public'}">
                            ${this.roomState.isPrivate ? '🔒 Riêng tư (Có mật khẩu)' : '🌐 Công khai'}
                        </span>
                    </div>
                    <div style="display:flex; align-items:center; gap:10px">
                        <span style="font-size:12px; color:#94a3b8">Mã phòng:</span>
                        <span class="room-code-badge">${this.roomState.code}</span>
                        <button class="btn-secondary" style="padding:5px 10px; font-size:11.5px" onclick="window.GAME.copyRoomCode()">📋 Copy Mã</button>
                    </div>
                </div>
                <div style="display:flex; gap:8px; flex-wrap:wrap">
                    ${this.roomState.isHost ? `
                        <button class="btn-trade-action danger" onclick="window.GAME.closeMultiplayerRoom()">🗑️ Đóng Phòng</button>
                    ` : ''}
                    <button class="btn-secondary" onclick="window.GAME.leaveMultiplayerRoom()">⬅️ Rời Phòng</button>
                </div>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; font-size:12.5px">
                <span style="color:#94a3b8; font-weight:600">Danh sách người chơi (${activeSeats.length}/5)</span>
                <span style="color:#38bdf8">🎲 Thuyền được chia ngẫu nhiên khi bắt đầu</span>
            </div>

            <div class="slots-list-grid">
                ${slotsHtml}
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.08)">
                <div style="font-size:12px; color:#94a3b8">
                    ${this.roomState.isHost
                        ? `Bạn là <strong>Chủ phòng</strong> (Nếu rời đi, quyền Chủ phòng sẽ tự động chuyển cho người vào sau bạn).`
                        : `Đang chờ Chủ phòng bắt đầu trận đấu...`
                    }
                </div>
                ${this.roomState.isHost ? `
                    <div style="display:flex; gap:8px; flex-wrap:wrap">
                        <button class="btn-trade-action" style="background:linear-gradient(135deg,#c026d3,#7e22ce); color:#fff; border:1px solid #f0abfc; padding:9px 14px; font-weight:800" onclick="window.GAME.startRoomGameSession(true)">
                            🛠️ Vào Chế Độ Sáng Tạo (Sandbox)
                        </button>
                        <button class="btn-primary-gold" ${canStart ? '' : 'disabled'} onclick="window.GAME.startRoomGameSession(false)">
                            🚀 Bắt Đầu Ván Đấu (${activeSeats.length} Người)
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    updateLocalPlayerName(val) {
        const clean = String(val || "").trim();
        if (clean) {
            this.roomState.localPlayerName = clean;
            localStorage.setItem("golden_player_name", clean);
        }
    }

    switchToBrowseRoomsView() {
        const nameEl = document.getElementById("welcome-player-name");
        if (nameEl && nameEl.value.trim()) {
            this.updateLocalPlayerName(nameEl.value.trim());
        }
        this.lobbySubView = "browse";
        this.renderWaitingScreen();
        this.fetchOpenRoomsList();
    }

    backToWelcomeView() {
        this.lobbySubView = "welcome";
        this.renderWaitingScreen();
    }

    openCreateRoomModal() {
        const nameEl = document.getElementById("welcome-player-name");
        if (nameEl && nameEl.value.trim()) {
            this.updateLocalPlayerName(nameEl.value.trim());
        }
        this.createRoomIsPrivate = false;
        const defaultRoomName = `Phòng của ${this.roomState.localPlayerName}`;

        const html = `
            <div class="modal-header-badge">
                <span>➕ TẠO PHÒNG CHƠI MỚI</span>
            </div>
            <h2 class="modal-title">Thiết Lập Phòng Chơi</h2>
            <p class="modal-desc">Đặt tên phòng và chọn chế độ Công khai (Public) hoặc Riêng tư (Private có mật khẩu).</p>

            <div style="display:flex; flex-direction:column; gap:14px; margin-bottom:16px">
                <div>
                    <label style="display:block; font-size:12px; color:#94a3b8; font-weight:600; margin-bottom:6px">Tên Phòng Chơi</label>
                    <input type="text" id="modal-room-name" class="clean-input" value="${defaultRoomName}" placeholder="Nhập tên phòng..." />
                </div>

                <div>
                    <label style="display:block; font-size:12px; color:#94a3b8; font-weight:600; margin-bottom:6px">Chế Độ Phòng</label>
                    <div class="mode-toggle-group">
                        <button type="button" id="mode-btn-public" class="mode-option-btn active" onclick="window.GAME.setCreateRoomPrivacy(false)">
                            🌐 Công Khai (Public)<br/>
                            <small style="font-weight:400; font-size:11px">Ai cũng có thể tham gia</small>
                        </button>
                        <button type="button" id="mode-btn-private" class="mode-option-btn" onclick="window.GAME.setCreateRoomPrivacy(true)">
                            🔒 Riêng Tư (Private)<br/>
                            <small style="font-weight:400; font-size:11px">Cần mật khẩu để vào</small>
                        </button>
                    </div>
                </div>

                <div id="modal-room-password-wrap" class="hidden">
                    <label style="display:block; font-size:12px; color:#fbbf24; font-weight:600; margin-bottom:6px">🔑 Đặt Mật Khẩu Phòng</label>
                    <input type="password" id="modal-room-password" class="clean-input" placeholder="Nhập mật khẩu cho phòng riêng tư..." />
                </div>
            </div>

            <div class="modal-actions">
                <button class="btn-secondary" onclick="window.GAME.closeModal()">Hủy</button>
                <button class="btn-primary-gold" onclick="window.GAME.createMultiplayerRoom()">✨ Tạo Phòng Ngay</button>
            </div>
        `;
        this.showModal(html);
    }

    setCreateRoomPrivacy(isPrivate) {
        this.createRoomIsPrivate = Boolean(isPrivate);
        const pubBtn = document.getElementById("mode-btn-public");
        const privBtn = document.getElementById("mode-btn-private");
        const passWrap = document.getElementById("modal-room-password-wrap");
        if (pubBtn) pubBtn.classList.toggle("active", !isPrivate);
        if (privBtn) privBtn.classList.toggle("active", isPrivate);
        if (passWrap) passWrap.classList.toggle("hidden", !isPrivate);
    }

    openPasswordPromptModal(code, roomName = "", wrongPassError = "") {
        const html = `
            <div class="modal-header-badge">
                <span>🔒 PHÒNG RIÊNG TƯ (PRIVATE)</span>
            </div>
            <h2 class="modal-title">Nhập Mật Khẩu Vào Phòng</h2>
            <p class="modal-desc">
                Phòng <strong>${roomName || code}</strong> (Mã: <strong>${code}</strong>) yêu cầu mật khẩu từ Chủ phòng để tham gia.
            </p>
            ${wrongPassError ? `<div style="color:#fb7185; font-size:12.5px; font-weight:600; margin-bottom:10px">⚠️ ${wrongPassError}</div>` : ''}
            <div style="margin-bottom:16px">
                <input type="password" id="prompt-room-password" class="clean-input" placeholder="Nhập mật khẩu phòng..." autofocus
                    onkeydown="if(event.key==='Enter') window.GAME.submitPasswordJoin('${code}')" />
            </div>
            <div class="modal-actions">
                <button class="btn-secondary" onclick="window.GAME.closeModal()">Hủy</button>
                <button class="btn-primary-gold" onclick="window.GAME.submitPasswordJoin('${code}')">🚪 Xác Nhận Vào Phòng</button>
            </div>
        `;
        this.showModal(html);
    }

    submitPasswordJoin(code) {
        const passEl = document.getElementById("prompt-room-password");
        const pwd = passEl ? passEl.value.trim() : "";
        if (!pwd) {
            this.showToast("⚠️ Vui lòng nhập mật khẩu phòng!");
            return;
        }
        this.closeModal();
        this.joinMultiplayerRoomByCode(code, pwd);
    }

    attemptJoinListedRoom(code, isPrivate, roomName) {
        if (isPrivate) {
            this.openPasswordPromptModal(code, roomName);
        } else {
            this.joinMultiplayerRoomByCode(code, "");
        }
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
            }
            if (data && data.ok && Array.isArray(data.rooms)) {
                this.openRoomsList = data.rooms;
                if (!this.roomState.code && this.lobbySubView === "browse") {
                    this.renderWaitingScreen();
                }
            }
        } catch (e) {}
    }

    quickJoinRoomCode(code) {
        this.joinMultiplayerRoomByCode(code);
    }

    async createMultiplayerRoom() {
        const roomNameEl = document.getElementById("modal-room-name");
        const passEl = document.getElementById("modal-room-password");
        const hostName = (this.roomState.localPlayerName || "Thuyền Trưởng").trim();
        const roomName = (roomNameEl && roomNameEl.value.trim()) ? roomNameEl.value.trim() : `Phòng của ${hostName}`;
        const isPrivate = Boolean(this.createRoomIsPrivate);
        const password = isPrivate && passEl ? passEl.value.trim() : "";

        if (isPrivate && !password) {
            this.showToast("⚠️ Vui lòng nhập mật khẩu cho phòng Riêng tư!");
            return;
        }

        try {
            const resp = await fetch("/api/room/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hostName,
                    roomName,
                    isPrivate,
                    password,
                    clientId: this.clientId
                })
            });
            const data = await resp.json();
            if (data && data.ok && data.room) {
                this.closeModal();
                this.roomState.code = data.room.code;
                this.roomState.roomName = data.room.roomName || roomName;
                this.roomState.isPrivate = Boolean(data.room.isPrivate);
                this.roomState.isHost = true;
                this.roomState.localSeatIdx = 0;
                this.roomState.status = "waiting";
                this.roomState.seats = data.room.seats;
                this.roomState.version = data.room.version || 1;
            } else {
                this.showToast(`⚠️ ${data && data.error ? data.error : "Không thể tạo phòng!"}`);
                return;
            }
        } catch (err) {
            this.showToast("⚠️ Không thể kết nối tới Máy chủ tạo phòng!");
            return;
        }

        this.saveRoomToLocalStorage();
        this.broadcastRoomMessage({ type: "ROOM_UPDATED", roomState: this.roomState });
        this.startRoomPolling();
        this.updateRoomBadgeUI();
        this.renderWaitingScreen();
        this.showToast(`🔑 Đã tạo "${this.roomState.roomName}" [Mã: ${this.roomState.code}]!`);
    }

    async joinMultiplayerRoomByCode(explicitCode = null, explicitPassword = "") {
        const codeEl = document.getElementById("wait-join-code");
        const rawCode = explicitCode || (codeEl ? codeEl.value : "");
        const code = String(rawCode || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
        const playerName = (this.roomState.localPlayerName || "Thuyền Trưởng").trim();

        if (code.length < 4) {
            this.showToast("⚠️ Vui lòng nhập Mã Phòng hợp lệ (6 ký tự)!");
            return;
        }

        try {
            const resp = await fetch("/api/room/join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code,
                    playerName,
                    password: explicitPassword,
                    clientId: this.clientId
                })
            });
            const data = await resp.json();

            if (data && data.requirePassword) {
                this.openPasswordPromptModal(
                    data.code || code,
                    data.roomName || `Phòng ${code}`,
                    data.wrongPassword ? "Mật khẩu chưa chính xác! Vui lòng nhập lại." : ""
                );
                return;
            }

            if (data && data.ok && data.room) {
                this.roomState.code = data.room.code;
                this.roomState.roomName = data.room.roomName || `Phòng ${data.room.code}`;
                this.roomState.isPrivate = Boolean(data.room.isPrivate);
                const mySeat = (data.room.seats || []).find(s => s.clientId === this.clientId) || data.room.seats[data.assignedSeat];
                this.roomState.isHost = mySeat ? Boolean(mySeat.isHost) : (data.assignedSeat === 0);
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
                this.showToast(`🎉 Đã vào "${this.roomState.roomName}" [${this.roomState.code}]!`);
                return;
            } else {
                sessionStorage.removeItem("golden_active_room_code");
                this.showToast(`⚠️ ${data && data.error ? data.error : "Không tìm thấy phòng!"}`);
                return;
            }
        } catch (err) {
            this.showToast("⚠️ Lỗi kết nối khi vào phòng!");
        }
    }

    async closeMultiplayerRoom() {
        if (!this.roomState.code || !this.roomState.isHost) return;
        const closingCode = this.roomState.code;
        try {
            await fetch("/api/room/close", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: closingCode, clientId: this.clientId })
            });
        } catch (e) {}
        sessionStorage.removeItem("golden_active_room_code");
        clearInterval(this.roomPollTimer);
        this.roomState.code = null;
        this.roomState.isHost = false;
        this.roomState.status = "waiting";
        this.roomState.seats = this.createEmptyLobbySeats();
        this.lobbySubView = "welcome";
        this.updateRoomBadgeUI();
        this.showWaitingScreen();
        this.showToast(`🗑️ Đã đóng phòng [${closingCode}].`);
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
        if (!this.roomState.code || !this.roomState.isHost) return;
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
                this.showToast(`🪑 Đã làm trống Vị trí #${seatIdx + 1}.`);
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
        this.sandboxMode = false;
        this.sandboxInfiniteMove = false;
        this.sandboxTeleport = false;
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

    startSoloSandboxMode() {
        const nameEl = document.getElementById("welcome-player-name");
        if (nameEl && nameEl.value.trim()) {
            this.updateLocalPlayerName(nameEl.value.trim());
        }
        this.roomState.code = null;
        this.roomState.isHost = true;
        this.roomState.status = "playing";
        this.hideWaitingScreenAndShowHUD();
        this.initializeMatchBoardAndShips(1, 1, [{
            name: this.roomState.localPlayerName || "Thuyền Trưởng Sáng Tạo",
            isAI: false,
            archetypeId: 0,
            seatIndex: 0,
            clientId: this.clientId
        }]);
        this.enableSandboxCreativeMode(true);
        this.beginTurn();
        this.showToast("🛠️ Đã vào Chế Độ Sáng Tạo (Sandbox 1 Mình)! Tự do di chuyển vô hạn, chỉnh tài nguyên hoặc bấm Chiến Thắng ngay!");
    }

    async startRoomGameSession(enableSandbox = false) {
        const activeSeats = (this.roomState.seats || []).filter(s => s.type === "human" || s.type === "ai");
        if (activeSeats.length < 1) {
            this.showToast("⚠️ Cần tối thiểu 1 người chơi trong phòng để bắt đầu!");
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

        const isSoloOrSandbox = Boolean(enableSandbox || activeSeats.length === 1);
        this.roomState.status = isSoloOrSandbox ? "playing" : "turn_order_quiz";
        this.hideWaitingScreenAndShowHUD();
        this.initializeMatchBoardAndShips(customConfigs.length, customConfigs.filter(c => !c.isAI).length, customConfigs);

        if (isSoloOrSandbox) {
            this.enableSandboxCreativeMode(true);
        } else {
            this.sandboxMode = false;
            this.sandboxInfiniteMove = false;
            this.sandboxTeleport = false;
        }

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
                        openingQuiz,
                        skipOpeningQuiz: isSoloOrSandbox
                    })
                });
                const data = await resp.json();
                if (data && data.room) {
                    this.roomState.version = data.room.version;
                    this.roomState.status = data.room.status;
                    if (data.room.status === "playing") {
                        this.beginTurn();
                        if (isSoloOrSandbox) {
                            this.showToast("🛠️ Đã bắt đầu phòng chơi Chế Độ Sáng Tạo (Sandbox)!");
                        }
                        return;
                    }
                    if (data.room.openingQuiz) {
                        this.startOpeningSpeedQuizModal(data.room.openingQuiz);
                    }
                }
            } catch (e) {
                if (isSoloOrSandbox) {
                    this.beginTurn();
                    return;
                }
                this.startOpeningSpeedQuizModal({ quiz: openingQuiz, startedAt: Date.now(), completed: false, rankings: [] });
            }
            this.saveRoomToLocalStorage(stateSnapshot);
            this.broadcastRoomMessage({
                type: "ROOM_OPENING_QUIZ_STARTED",
                roomState: this.roomState,
                gameState: stateSnapshot,
                openingQuiz: isSoloOrSandbox ? null : { quiz: openingQuiz, startedAt: Date.now(), completed: false, rankings: [] }
            });
        } else if (isSoloOrSandbox) {
            this.beginTurn();
        }
    }

    startOpeningSpeedQuizModal(openingQuizObj) {
        if (!openingQuizObj || !openingQuizObj.quiz) return;
        this.openingQuizState = openingQuizObj;
        this.hasSubmittedOpeningAnswer = false;
        this.localOpeningChoice = null;
        this.localOpeningElapsedMs = 0;
        this.matchWinner = null;
        this.victoryShownForMatch = false;

        clearInterval(this.openingTimerInterval);
        clearInterval(this.preGameCountdownInterval);

        // Close any open modal so players can see the 3D S-shaped Vietnam map & their starting ship first!
        document.getElementById("modal-overlay").classList.add("hidden");

        const localP = this.getLocalPlayer();
        if (localP) {
            this.world.focusCameraOnHex(localP.q, localP.r);
        }

        // Snappy 3-Second Pre-Game Countdown before showing the Opening Turn-Order Speed Quiz
        const banner = document.getElementById("pregame-countdown-banner");
        const secEl = document.getElementById("pregame-countdown-sec");
        const barEl = document.getElementById("pregame-progress-bar");

        let remainingSec = 3;
        if (openingQuizObj.countdownEndsAt) {
            const diffSec = Math.ceil((openingQuizObj.countdownEndsAt - Date.now()) / 1000);
            if (diffSec >= 1 && diffSec <= 5) {
                remainingSec = Math.min(3, diffSec);
            }
        }

        this.isPreGameCountingDown = true;
        if (banner) {
            banner.classList.remove("hidden");
            banner.style.cursor = "pointer";
            banner.title = "Bấm để mở câu hỏi khởi động ngay lập tức";
        }
        if (secEl) secEl.textContent = String(remainingSec);
        if (barEl) barEl.style.width = `${(remainingSec / 3) * 100}%`;

        const launchQuizNow = () => {
            clearInterval(this.preGameCountdownInterval);
            this.isPreGameCountingDown = false;
            if (banner) banner.classList.add("hidden");

            this.openingQuizStartMs = Date.now();
            window.SFX.playTurnStart();
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
        };

        this.launchOpeningQuizNow = launchQuizNow;
        if (banner) {
            banner.onclick = () => launchQuizNow();
        }

        this.preGameCountdownInterval = setInterval(() => {
            remainingSec -= 1;
            if (remainingSec <= 0) {
                launchQuizNow();
            } else {
                if (secEl) secEl.textContent = String(remainingSec);
                if (barEl) barEl.style.width = `${Math.max(0, (remainingSec / 3) * 100)}%`;
            }
        }, 1000);
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
                <span class="badge-tag">${completed ? `⏱️ Tự bắt đầu sau <span id="quiz-autoclose-sec">10</span>s` : `Thời gian: ${(this.localOpeningElapsedMs / 1000).toFixed(2)}s`}</span>
            </div>
            <h2 class="modal-title">Bảng Xếp Hạng Thứ Tự Xuất Phát (Ai Nhanh Nhất Đi Trước)</h2>
            <div class="turn-order-leaderboard">
                ${leaderboardHtml}
            </div>
            ${this.renderQuizVisualMemoryCard(quiz, this.localOpeningChoice)}
            <div class="modal-actions" style="justify-content:space-between">
                <div style="font-size:12.5px; color:#a6b4c4">
                    ${completed
                        ? `✅ Đã xếp xong thứ tự lượt đi! <strong>${rankings[0] ? rankings[0].name : ''}</strong> xuất phát đầu tiên (Tự đóng sau <span id="quiz-autoclose-sec-sub">10</span>s).`
                        : `⏳ Đang chờ các người chơi khác trong phòng hoàn thành câu hỏi...`
                    }
                </div>
                ${completed ? `
                    <button class="btn-primary-gold" onclick="window.GAME.confirmStartMatchAfterOpeningQuiz()">
                        ⛵ Bắt Đầu Vòng 1 Ngay!
                    </button>
                ` : (!this.roomState.code ? `
                    <button class="btn-primary-gold" onclick="window.GAME.confirmStartMatchAfterOpeningQuiz()">
                        ⛵ Bắt Đầu Vòng 1 Ngay!
                    </button>
                ` : `
                    <button class="btn-primary-gold" onclick="window.GAME.confirmStartMatchAfterOpeningQuiz()">
                        ⛵ Vào Vòng 1 Ngay
                    </button>
                `)}
            </div>
        `;
        this.showModal(html);

        if (completed || !this.roomState.code) {
            this.startQuizResultAutoCloseTimer(10, () => {
                this.confirmStartMatchAfterOpeningQuiz();
            });
        }
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

        // Offline mode: simulate Bot AI speeds & sort players immediately (Human players always placed ahead of Bot AIs!)
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
                    elapsedMs: 3800 + Math.floor(Math.random() * 5200),
                    chosenIdx: 0
                };
            });

            entries.sort((a, b) => {
                if (a.player.isAI !== b.player.isAI) return a.player.isAI ? 1 : -1;
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

            this.world.spawnShips(this.players, this.getLocalPlayer());
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
                    this.world.spawnShips(this.players, this.getLocalPlayer());
                    this.updateUI();
                }
            }
        } catch (e) {}

        this.renderOpeningSpeedQuizView();
    }

    async confirmStartMatchAfterOpeningQuiz() {
        clearInterval(this.preGameCountdownInterval);
        clearInterval(this.openingTimerInterval);
        clearInterval(this.quizAutoCloseInterval);
        this.currentQuizCloseCallback = null;
        this.isPreGameCountingDown = false;
        const banner = document.getElementById("pregame-countdown-banner");
        if (banner) banner.classList.add("hidden");
        if (this.openingQuizState) {
            this.openingQuizState.completed = true;
            this.openingQuizState.matchStarted = true;
        }

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

        this.ensureValidPlayerPositions();

        const firstPlayer = this.players[0];
        if (firstPlayer) {
            this.logEvent(`🏁 Đua tốc độ đầu trận hoàn tất! Thứ tự lượt đi: ${this.players.map((p, i) => `#${i + 1} ${p.name}`).join(" → ")}.`);
            this.showToast(`⛵ ${firstPlayer.name} xuất phát Lượt 1! Hãy bấm vào các ô nước trên biển để di chuyển thuyền!`);
        }

        this.world.spawnShips(this.players, this.getLocalPlayer());
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
                if (data && data.roomClosed) {
                    sessionStorage.removeItem("golden_active_room_code");
                    clearInterval(this.roomPollTimer);
                    this.roomState.code = null;
                    this.roomState.isHost = false;
                    this.roomState.status = "waiting";
                    this.lobbySubView = "welcome";
                    this.updateRoomBadgeUI();
                    this.showWaitingScreen();
                    this.showToast("ℹ️ Phòng chơi đã được đóng.");
                    return;
                }
                if (data && data.unchanged) {
                    return;
                }
                if (data && data.ok && data.room) {
                    const r = data.room;
                    const prevStatus = this.roomState.status;
                    const prevWasHost = this.roomState.isHost;
                    const versionChanged = r.version !== this.roomState.version;
                    this.roomState.version = r.version;
                    this.roomState.roomName = r.roomName || this.roomState.roomName;
                    this.roomState.isPrivate = Boolean(r.isPrivate);
                    this.roomState.seats = r.seats;
                    this.roomState.status = r.status;

                    // Update local seat & check if Host role was transferred to this player!
                    const mySeat = (r.seats || []).find(s => s.clientId === this.clientId);
                    if (mySeat) {
                        this.roomState.localSeatIdx = mySeat.seatIndex;
                        this.roomState.isHost = Boolean(mySeat.isHost);
                        if (!prevWasHost && this.roomState.isHost) {
                            this.showToast("👑 Chủ phòng trước đã rời đi — Quyền Chủ phòng đã được chuyển cho bạn!");
                        }
                    } else if (!this.isGameStarted) {
                        // Local player was removed from seat by host
                        sessionStorage.removeItem("golden_active_room_code");
                        clearInterval(this.roomPollTimer);
                        this.roomState.code = null;
                        this.roomState.isHost = false;
                        this.lobbySubView = "welcome";
                        this.renderWaitingScreen();
                        this.showToast("ℹ️ Bạn đã rời khỏi phòng chờ.");
                        return;
                    }

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
                                this.world.syncShipsSmoothly(this.players, this.getLocalPlayer());
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
                        const myP = this.getLocalPlayer() || this.players[0];
                        const firstP = this.players[0];
                        if (myP) {
                            this.world.focusCameraOnHex(myP.q, myP.r);
                        }
                        if (firstP) {
                            this.showToast(`⛵ Vòng 1 bắt đầu! Lượt đầu tiên thuộc về ${firstP.name}!`);
                        }
                        return;
                    }

                    // 3b. Transitioned from Playing -> Waiting (After 15s Victory Celebration)
                    if (prevStatus !== "waiting" && r.status === "waiting") {
                        clearInterval(this.victoryCountdownInterval);
                        document.getElementById("modal-overlay").classList.add("hidden");
                        this.showWaitingScreen();
                        this.showToast("🏁 Ván đấu đã kết thúc — Toàn bộ người chơi đã trở lại Phòng chờ!");
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
            tradeBulletinNotices: this.tradeBulletinNotices,
            portInventories: this.portInventories,
            portResetRemainingSec: this.portResetRemainingSec,
            matchElapsedSec: this.matchElapsedSec,
            currentWeatherPhase: this.currentWeatherPhase,
            resourceCooldowns,
            rareNPCHex,
            liveQuizState: this.liveQuizState,
            matchWinner: this.matchWinner
        };
    }

    applySerializedGameState(state, rebuildBoard = false) {
        if (!state || !state.players) return;

        const prevActiveIdx = this.activePlayerIdx;
        const prevRound = this.roundNumber;

        if (rebuildBoard && state.monumentAssignments) {
            this.monumentAssignments = state.monumentAssignments;
            this.world.buildBoard(this.monumentAssignments);
            this.startMatchClockAndWeatherEngine();
        }

        this.roundNumber = state.roundNumber;
        this.activePlayerIdx = state.activePlayerIdx;
        this.marketListings = state.marketListings || this.marketListings;
        if (Array.isArray(state.tradeBulletinNotices)) {
            this.tradeBulletinNotices = state.tradeBulletinNotices;
        }
        if (state.portInventories && typeof state.portInventories === "object") {
            this.portInventories = state.portInventories;
        }
        if (typeof state.portResetRemainingSec === "number") {
            this.portResetRemainingSec = state.portResetRemainingSec;
        }
        if (typeof state.matchElapsedSec === "number" && !this.roomState.isHost) {
            this.matchElapsedSec = state.matchElapsedSec;
        }
        if (state.currentWeatherPhase && state.currentWeatherPhase !== this.currentWeatherPhase) {
            this.applyWeatherPhase(state.currentWeatherPhase, false);
        }
        this.players = state.players;
        this.ensureValidPlayerPositions();

        if (state.resourceCooldowns) {
            this.world.hexTiles.forEach(t => {
                t.resourceCooldown = state.resourceCooldowns[`${t.q},${t.r}`] || 0;
            });
            this.world.updateResourceVisuals();
        }

        // Rebuild ships only on initial load; otherwise smoothly glide ships so spectator camera is never disturbed!
        if (rebuildBoard || this.world.shipMeshes.size !== this.players.length) {
            this.world.spawnShips(this.players, this.getLocalPlayer());
        } else {
            this.world.syncShipsSmoothly(this.players, this.getLocalPlayer());
        }

        // Check if someone won the match (3 Royal Relics) -> Show Victory Celebration Screen for ALL players!
        const winnerFromState = state.matchWinner || this.players.find(pl => pl.relics && pl.relics.length >= 3);
        if (winnerFromState && !this.victoryShownForMatch) {
            this.matchWinner = winnerFromState;
            this.refreshReachableHexes();
            this.updateUI();
            this.showVictoryScreen(winnerFromState);
            return;
        }

        // If turn just switched to a new player, reset spectator quiz snapshots
        if (prevActiveIdx !== this.activePlayerIdx || prevRound !== this.roundNumber) {
            this.showingSpectatorQuizId = null;
            this.showingAnsweredSpectatorQuizId = null;
            this.spectatorClosedAskingQuizId = null;
            this.spectatorHiddenAnsweredQuizId = null;
            this.lastSpectatorQuizSnapshot = null;

            const activeP = this.getActivePlayer();
            if (activeP) {
                if (this.isMyTurn()) {
                    const myP = this.getLocalPlayer() || activeP;
                    window.SFX.playTurnStart();
                    this.world.focusCameraOnHex(myP.q, myP.r);
                    this.showToast(`🎯 Đã tới lượt của bạn (${myP.name})! Bạn có 4 AP (Tối đa 3 AP di chuyển).`);
                } else if (activeP.isAI && (!this.roomState.code || this.roomState.isHost)) {
                    // Only Host runs Bot AI turns on the shared map!
                    setTimeout(() => this.executeAITurn(), 750);
                }
            }
        }

        // Handle Live Shared Quiz Broadcast for Spectators (with 10s Auto-Close or Instant Close)
        this.liveQuizState = state.liveQuizState || null;
        if (!this.isMyTurn() && this.liveQuizState) {
            this.renderSpectatorLiveQuiz(this.liveQuizState);
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
    // SPECTATOR LIVE QUIZ RENDERER & 10-SECOND AUTO-CLOSE / INSTANT CLOSE
    // - Spectators can close the asking quiz at any time to interact with map/market.
    // - Once answered ("answered"), the result modal shows for 10s then auto-closes,
    //   or can be closed immediately at any time (no reopen/review button).
    // ------------------------------------------------------------------------
    renderSpectatorLiveQuiz(liveQuiz) {
        if (!liveQuiz || !liveQuiz.quiz) return;
        this.showingSpectatorQuizId = liveQuiz.id;
        const quiz = liveQuiz.quiz;

        if (liveQuiz.phase === "asking") {
            if (this.spectatorClosedAskingQuizId === liveQuiz.id) {
                return;
            }

            const html = `
                <div class="spectator-quiz-banner">
                    <span>👁️ ĐANG XEM LƯỢT CỦA <strong>${liveQuiz.actorName.toUpperCase()}</strong></span>
                    <span class="badge-tag">Chỉ ${liveQuiz.actorName} được chọn đáp án</span>
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
                <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap; margin-top:10px">
                    <div style="font-size:12px; color:#e5c365; font-weight:700">
                        ⏳ Đang chờ ${liveQuiz.actorName} suy nghĩ và chọn đáp án...
                    </div>
                    <button class="btn-secondary" onclick="window.GAME.spectatorCloseQuizDuringAsking('${liveQuiz.id}')">
                        ✕ Đóng Cửa Sổ Ngay
                    </button>
                </div>
            `;
            this.showModal(html);
        } else if (liveQuiz.phase === "answered") {
            if (this.spectatorHiddenAnsweredQuizId === liveQuiz.id || this.showingAnsweredSpectatorQuizId === liveQuiz.id) {
                return;
            }
            this.showingAnsweredSpectatorQuizId = liveQuiz.id;

            const chosenIdx = liveQuiz.chosenIdx;
            const isCorrect = (chosenIdx === quiz.correct);
            const chosenLetter = String.fromCharCode(65 + chosenIdx);

            const html = `
                <div class="spectator-quiz-banner">
                    <span>👁️ KẾT QUẢ TRẢ LỜI CỦA <strong>${liveQuiz.actorName.toUpperCase()}</strong>: Chọn phương án <strong>${chosenLetter}</strong> (${isCorrect ? '✅ CHÍNH XÁC' : '❌ CHƯA ĐÚNG'})</span>
                    <span class="badge-tag">⏱️ Tự đóng sau <span id="quiz-autoclose-sec">10</span>s</span>
                </div>
                <h2 class="modal-title">${liveQuiz.outcomeTitle || `Kết Quả Khảo Nghiệm Của ${liveQuiz.actorName}`}</h2>
                ${this.renderQuizVisualMemoryCard(quiz, chosenIdx, liveQuiz.actorName)}
                <div class="modal-actions" style="justify-content:space-between">
                    <span style="font-size:12px; color:#fbbf24; font-weight:700">⏳ Tự động đóng cửa sổ sau <span id="quiz-autoclose-sec-sub">10</span> giây...</span>
                    <button class="btn-primary-gold" onclick="window.GAME.spectatorHideAnsweredQuiz('${liveQuiz.id}')">
                        ✕ Đóng Ngay Lập Tức
                    </button>
                </div>
            `;
            this.showModal(html);
            this.startQuizResultAutoCloseTimer(10, () => {
                this.spectatorHideAnsweredQuiz(liveQuiz.id);
            });
        }
    }

    startQuizResultAutoCloseTimer(seconds = 10, onAutoClose = null) {
        clearInterval(this.quizAutoCloseInterval);
        let secLeft = seconds;
        this.currentQuizCloseCallback = onAutoClose || (() => this.closeModal());

        this.quizAutoCloseInterval = setInterval(() => {
            secLeft -= 1;
            const el1 = document.getElementById("quiz-autoclose-sec");
            const el2 = document.getElementById("quiz-autoclose-sec-sub");
            if (el1) el1.textContent = String(Math.max(0, secLeft));
            if (el2) el2.textContent = String(Math.max(0, secLeft));
            if (secLeft <= 0) {
                clearInterval(this.quizAutoCloseInterval);
                if (this.currentQuizCloseCallback) {
                    const cb = this.currentQuizCloseCallback;
                    this.currentQuizCloseCallback = null;
                    cb();
                } else {
                    this.closeModal();
                }
            }
        }, 1000);
    }

    closeQuizResultNow() {
        clearInterval(this.quizAutoCloseInterval);
        if (this.currentQuizCloseCallback) {
            const cb = this.currentQuizCloseCallback;
            this.currentQuizCloseCallback = null;
            cb();
        } else {
            this.closeModal();
        }
    }

    spectatorCloseQuizDuringAsking(quizId) {
        clearInterval(this.quizAutoCloseInterval);
        this.spectatorClosedAskingQuizId = quizId;
        document.getElementById("modal-overlay").classList.add("hidden");
        const actorName = (this.liveQuizState && this.liveQuizState.actorName) ? this.liveQuizState.actorName : "người chơi trong lượt";
        this.showToast(`👁️ Đã đóng cửa sổ câu hỏi. Cửa sổ đáp án sẽ hiện lên khi ${actorName} trả lời xong!`);
    }

    spectatorHideAnsweredQuiz(quizId) {
        clearInterval(this.quizAutoCloseInterval);
        this.spectatorHiddenAnsweredQuizId = quizId;
        this.currentQuizCloseCallback = null;
        document.getElementById("modal-overlay").classList.add("hidden");
    }

    updateSpectatorQuizPillUI() {
        // Review button removed per user request (replaced by 10s auto-close / instant close)
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
            btn.textContent = panel.classList.contains("collapsed") ? "＋" : "✕";
            btn.title = panel.classList.contains("collapsed") ? "Mở lại cửa sổ" : "Đóng / Thu gọn cửa sổ";
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
            if (btn) btn.textContent = this.cleanUIMode ? "＋" : "✕";
        });
        const toggleBtn = document.getElementById("btn-toggle-clean-ui");
        if (toggleBtn) {
            toggleBtn.innerHTML = this.cleanUIMode ? "👁️ Hiện Cửa Sổ" : "👁️ Thu Gọn UI";
        }
    }

    // ------------------------------------------------------------------------
    // QUIZ SHUFFLER + POST-QUIZ VISUAL MEMORY CARD (WITH QUESTION RECAP & CITATIONS)
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
                <div class="memory-question-recap">
                    ❓ <strong>Câu hỏi:</strong> ${quiz.q}
                </div>
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
        // Zoned Monument Balancing across the S-shaped Vietnam Map:
        // North (3 monuments), Central (3 monuments), South (3 monuments) each receive 1 Easy (Tier 1), 1 Medium (Tier 2), and 1 Hard (Tier 3)
        // so no player ever spawns surrounded only by Tier 2/3 monuments or too many Tier 1 monuments!
        const zones = [
            ["mon_sapa", "mon_halong", "mon_vanmieu"],
            ["mon_phongnha", "mon_hue", "mon_myson"],
            ["mon_taynguyen", "mon_bennharong", "mon_cairang"]
        ];
        const map = {};
        zones.forEach(zoneIds => {
            const zTiers = [1, 2, 3];
            for (let i = zTiers.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [zTiers[i], zTiers[j]] = [zTiers[j], zTiers[i]];
            }
            zoneIds.forEach((id, idx) => {
                map[id] = zTiers[idx];
            });
        });
        return map;
    }

    generateFairOuterRimSpawns(count) {
        // Use the pre-calibrated fair anchorages along the S-shaped Vietnam coast
        // (Each anchorage is 3-4 water hexes from the nearest Port, Monument, and Resource node)
        const anchors = (this.world.fairSpawnAnchors && this.world.fairSpawnAnchors.length >= 5)
            ? this.world.fairSpawnAnchors
            : this.world.hexTiles.filter(t => t.isSpawnRim && t.navigable);

        // Pick `count` evenly spaced anchorages from North to South so players don't crowd the same bay
        const indexPatterns = {
            1: [2],
            2: [1, 3],
            3: [0, 2, 4],
            4: [0, 1, 3, 4],
            5: [0, 1, 2, 3, 4]
        };
        const pattern = indexPatterns[Math.min(5, Math.max(1, count))] || [0, 1, 2, 3, 4];

        const chosen = pattern.map(idx => {
            const a = anchors[idx % anchors.length];
            const tile = this.world.hexMap.get(`${a.q},${a.r}`) || a;
            return {
                q: tile.q,
                r: tile.r,
                regionName: tile.region ? tile.region.name : "Hải Phận Việt Nam"
            };
        });

        // Randomly shuffle which player gets which balanced anchorage
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

        this.matchElapsedSec = 0;
        this.currentWeatherPhase = "sunny";
        this.thunderstormChallengeTriggered = false;
        this.portResetRemainingSec = this.portResetIntervalSec;

        this.nextNPCSpawnRound = 4 + Math.floor(Math.random() * 2);

        this.monumentAssignments = this.randomizeMonumentTiers();
        this.world.buildBoard(this.monumentAssignments);
        this.world.setWeatherMode("sunny");
        this.resetAllPortInventories(false);
        this.startMatchClockAndWeatherEngine();

        const fairSpawns = this.generateFairOuterRimSpawns(totalPlayers);

        // Randomly shuffle all 5 ship archetypes so each player gets a RANDOM ship (not tied to lobby slot!)
        const randomArchIndices = window.GAME_DATA.shipArchetypes.map((_, idx) => idx);
        for (let i = randomArchIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [randomArchIndices[i], randomArchIndices[j]] = [randomArchIndices[j], randomArchIndices[i]];
        }

        this.players = [];
        for (let i = 0; i < totalPlayers; i++) {
            const archIdx = randomArchIndices[i % randomArchIndices.length];
            const arch = window.GAME_DATA.shipArchetypes[archIdx];
            const isAI = customConfigs ? customConfigs[i].isAI : (i >= humanCount);
            const pName = customConfigs ? customConfigs[i].name : (i === 0 ? (this.roomState.localPlayerName || arch.name) : arch.name);
            const seatIdx = customConfigs && customConfigs[i].seatIndex !== undefined ? customConfigs[i].seatIndex : i;
            const clientId = (customConfigs && customConfigs[i].clientId)
                ? customConfigs[i].clientId
                : (!isAI ? this.clientId : null);
            const shipKey = clientId ? `client_${clientId}` : `seat_${seatIdx}`;

            this.players.push({
                id: i,
                seatIndex: seatIdx,
                clientId: clientId,
                shipKey: shipKey,
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
                ap: 5,
                moveApSpent: 0,
                hexMoveCredits: 0,
                interactiveApUsed: false,
                repairedThisTurn: 0,
                tier1Visited: 0,
                hasSerpentCoin: false,
                yagiWrongCount: 0,
                yagiQuizTriggeredThisTurn: false,
                food: 1,
                wood: 1,
                iron: 0,
                keys: { 1: 0, 2: 0, 3: 0 },
                specialties: [],
                relics: []
            });
        }

        this.ensureValidPlayerPositions();
        this.seedInitialMarketListings();
        this.world.spawnShips(this.players, this.getLocalPlayer());
        this.refreshReachableHexes();

        const roomTag = this.roomState.code ? ` [Phòng: ${this.roomState.code}]` : "";
        this.logEvent(`⚓ Khởi tạo bản đồ chung${roomTag} (${totalPlayers} Hải đội • 5 AP/lượt • Tối đa 15 Xu)!`);
        this.updateUI();
    }

    // Ensure every player's ship is on a valid navigable water hex with open sea routes
    ensureValidPlayerPositions() {
        if (!this.players || !this.world || !this.world.hexMap) return;
        const validAnchors = (this.world.fairSpawnAnchors && this.world.fairSpawnAnchors.length > 0)
            ? this.world.fairSpawnAnchors
            : this.world.hexTiles.filter(t => t.navigable && t.terrain === "sea");

        this.players.forEach((pl, idx) => {
            const curTile = this.world.hexMap.get(`${pl.q},${pl.r}`);
            const hasRoute = curTile && curTile.navigable && this.computeNavigablePaths(pl.q, pl.r, 2).size > 0;
            if (!hasRoute) {
                // Find nearest navigable sea/coast hex with open routes
                let bestTile = null;
                let bestDist = Infinity;
                for (let i = 0; i < this.world.hexTiles.length; i++) {
                    const cand = this.world.hexTiles[i];
                    if (!cand.navigable || cand.isReef) continue;
                    if (cand.monumentId || cand.isPort || cand.resourceType) continue;
                    const d = Math.abs(cand.q - (pl.q || 0)) + Math.abs(cand.r - (pl.r || 0));
                    if (d < bestDist && this.computeNavigablePaths(cand.q, cand.r, 2).size >= 3) {
                        bestDist = d;
                        bestTile = cand;
                    }
                }
                if (!bestTile && validAnchors.length > 0) {
                    const anc = validAnchors[idx % validAnchors.length];
                    bestTile = this.world.hexMap.get(`${anc.q},${anc.r}`) || anc;
                }
                if (bestTile) {
                    pl.q = bestTile.q;
                    pl.r = bestTile.r;
                }
            }
        });
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
                price: 1
            },
            {
                id: this.nextListingId++,
                sellerId: -1,
                sellerName: "Thương Hội Tây Nguyên",
                itemType: "specialty",
                regionId: 3,
                name: "Cà Phê Đất Đỏ Bazan",
                icon: "☕",
                price: 1
            },
            {
                id: this.nextListingId++,
                sellerId: -1,
                sellerName: "Thương Hội Cửu Long",
                itemType: "specialty",
                regionId: 5,
                name: "Ngọc Thực Gạo ST25",
                icon: "🌾",
                price: 1
            }
        ];
        this.tradeBulletinNotices = [
            {
                id: "init_1",
                round: 1,
                text: "⚓ 6 Thương Cảng mở bán Đặc sản (1 Xu), Lúa/Gỗ/Sắt, Đồng Xu Mãng Xà (10 Xu) & 1 Key ngẫu nhiên!"
            },
            {
                id: "init_2",
                round: 1,
                text: "📢 Kho hàng 6 Cảng tự động làm mới mỗi 8 phút 30 giây • Chợ giữa người chơi tự do đặt giá (0 AP)."
            }
        ];
    }

    addTradeBulletinNotice(text) {
        if (!this.tradeBulletinNotices) this.tradeBulletinNotices = [];
        this.tradeBulletinNotices.unshift({
            id: Date.now() + "_" + Math.random().toString(36).slice(2, 6),
            round: this.roundNumber || 1,
            text
        });
        if (this.tradeBulletinNotices.length > 10) {
            this.tradeBulletinNotices.length = 10;
        }
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
    // DAMAGE & SERPENT COIN (🐍 ĐỒNG XU MÃNG XÀ: HỒI 2 HP KHI MÁU VỀ 0)
    // ------------------------------------------------------------------------
    applyPlayerDamage(player, damageAmount, reason = "Sát thương trên biển") {
        if (!player || player.eliminated || damageAmount <= 0) return;
        window.SFX.playDamage();
        player.hp = Math.max(0, player.hp - damageAmount);
        this.logEvent(`💥 ${player.name} chịu -${damageAmount} ❤️ HP (${reason}) → Còn ${player.hp}/${player.maxHp} HP.`);

        if (player.hp <= 0) {
            if (player.hasSerpentCoin) {
                player.hasSerpentCoin = false;
                player.hp = 2;
                player.eliminated = false;
                window.SFX.playRelicFanfare();
                this.world.triggerBurstAnimation(player.q, player.r, 0xec4899, 32);
                this.logEvent(`🐍 PHÉP MÀU ĐỒNG XU MÃNG XÀ! Thuyền của ${player.name} thoát khỏi cảnh đắm tàu và tự động hồi phục 2 ❤️ HP!`);
                this.showToast(`🐍 Đồng Xu Mãng Xà kích hoạt! ${player.name} được hồi sinh ngay với 2 ❤️ HP!`);
            } else {
                player.hp = 0;
                player.eliminated = true;
                const shipMesh = this.world.shipMeshes.get(World3D.getPlayerShipKey(player));
                if (shipMesh) shipMesh.visible = false;
                this.logEvent(`☠️ Thuyền của ${player.name} đã bị đắm (0 HP) và BỊ LOẠI khỏi hành trình!`);
                this.showToast(`☠️ Thuyền của ${player.name} đã bị đắm (0 HP)!`);
            }
        }
    }

    // ------------------------------------------------------------------------
    // VIII. STANDARD TURN STRUCTURE — PHASE 1: START OF TURN (5 AP, MAX 3 MOVE)
    // ------------------------------------------------------------------------
    beginTurn() {
        clearTimeout(this.autoEndTurnTimer);
        const p = this.getActivePlayer();
        if (!p) return;
        if (p.eliminated) {
            this.advanceToNextPlayer();
            return;
        }

        p.ap = 5;
        p.moveApSpent = 0;
        p.hexMoveCredits = 0;
        p.interactiveApUsed = false;
        p.repairedThisTurn = 0;
        p.yagiQuizTriggeredThisTurn = false;
        this.liveQuizState = null;

        window.SFX.playTurnStart();

        // Always focus camera on the local player's own ship when it's their turn (or in solo/offline mode)
        const localP = this.getLocalPlayer() || p;
        if (this.isMyTurn() || !this.roomState.code) {
            this.world.focusCameraOnHex(localP.q, localP.r);
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
        if (this.sandboxInfiniteMove) return;
        if (!this.isMyTurn()) return;
        if (this.isModalOpen()) return;

        const p = this.getActivePlayer();
        if (!p || p.isAI || p.eliminated) return;

        // During Super Typhoon Yagi, spending 4 AP triggers the mandatory Yagi Storm Quiz!
        if (this.currentWeatherPhase === "super_typhoon_yagi" && (5 - p.ap) >= 4 && !p.yagiQuizTriggeredThisTurn) {
            this.triggerYagiTurnQuiz(p);
            return;
        }

        // Player has 0 AP and no leftover hex move credits -> Automatically end turn!
        if (p.ap <= 0 && p.hexMoveCredits <= 0) {
            this.autoEndTurnTimer = setTimeout(() => {
                if (this.isMyTurn() && !this.isBusy && !this.isModalOpen() && !this.sandboxInfiniteMove) {
                    const curP = this.getActivePlayer();
                    if (curP && curP.ap <= 0 && curP.hexMoveCredits <= 0) {
                        this.showToast(`⏭️ ${curP.name} đã sử dụng hết 5/5 AP — Tự động chuyển lượt!`);
                        this.endPlayerTurn(true);
                    }
                }
            }, 650);
        }
    }

    // ------------------------------------------------------------------------
    // REALISTIC SEA PATHFINDING (5 AP TOTAL, MAX 3 AP FOR MOVEMENT)
    // - Normal Weather: 1 AP = 2 hexes (Max 6 hexes/turn)
    // - Super Typhoon Yagi: 1 AP = 1 hex (Max 3 hexes/turn)
    // - Single-click pathfinding does NOT avoid Reefs (-1 HP if sailed through)
    // - Double-click + Hold-drag lets players draw a custom path around Reefs!
    // ------------------------------------------------------------------------
    getStepsPerMoveAP() {
        return this.currentWeatherPhase === "super_typhoon_yagi" ? 1 : 2;
    }

    getRemainingHexSteps(player) {
        if (this.sandboxInfiniteMove && !player.isAI) {
            return 999;
        }
        // Strict rule: Out of 5 total AP, at most 3 AP may be spent on movement!
        const remainingMoveAP = Math.max(0, Math.min(3 - (player.moveApSpent || 0), player.ap));
        const stepsPerAp = this.getStepsPerMoveAP();
        return player.hexMoveCredits + remainingMoveAP * stepsPerAp;
    }

    hexDistance(q1, r1, q2, r2) {
        return (Math.abs(q1 - q2) + Math.abs(q1 + r1 - q2 - r2) + Math.abs(r1 - r2)) / 2;
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
                if (nextTile.stormRestricted && !this.sandboxInfiniteMove) continue;

                const nextSteps = cur.steps + 1;
                if (!bestDist.has(key) || bestDist.get(key) > nextSteps) {
                    bestDist.set(key, nextSteps);
                    const nextPath = [...cur.path, nextTile];
                    reachable.set(key, { steps: nextSteps, path: nextPath });

                    // REALISTIC MARITIME NAVIGATION:
                    // Ships can dock at a Monument, Trading Port, Resource Extraction Node, or Rare NPC tile
                    // as their final destination, but CANNOT sail straight *through* them to reach another hex!
                    // Note: Reefs (`nextTile.isReef`) ARE passed straight through by automatic single-click pathfinding!
                    // To avoid Reefs, players use Double-Click + Hold-Drag manual path drawing!
                    const isDockOnlyPOI = Boolean(
                        nextTile.monumentId ||
                        nextTile.isPort ||
                        nextTile.resourceType ||
                        nextTile.hasNPC
                    );
                    if (!isDockOnlyPOI || this.sandboxInfiniteMove) {
                        queue.push({ q: nq, r: nr, steps: nextSteps, path: nextPath });
                    }
                }
            }
        }
        return reachable;
    }

    refreshReachableHexes() {
        this.ensureValidPlayerPositions();
        const p = this.getActivePlayer();
        if (!p) return;
        const maxSteps = this.getRemainingHexSteps(p);
        // Only show green reachable path highlights to the player whose turn it is!
        const reachable = (this.isMyTurn() && maxSteps > 0)
            ? this.computeNavigablePaths(p.q, p.r, maxSteps)
            : new Map();

        this.world.updateReachableHighlights(reachable, `${p.q},${p.r}`);
    }

    // ------------------------------------------------------------------------
    // DOUBLE-CLICK + HOLD-DRAG MANUAL PATH DRAWING (STEER AROUND REEFS!)
    // ------------------------------------------------------------------------
    startCustomPathDrag(firstTile) {
        if (!this.isGameStarted || this.isBusy || !this.isMyTurn()) return false;
        const p = this.getActivePlayer();
        if (!p || !firstTile || !firstTile.navigable) return false;
        if (firstTile.stormRestricted && !this.sandboxInfiniteMove) {
            this.showToast("⛔ Ô tài nguyên này đang bị phong tỏa bởi Giông Bão!");
            return false;
        }

        const maxSteps = this.getRemainingHexSteps(p);
        if (maxSteps <= 0) {
            this.showToast("⛵ Bạn đã hết lượt di chuyển trong lượt này (Tối đa 3 AP di chuyển)!");
            return false;
        }

        const distFromShip = this.hexDistance(p.q, p.r, firstTile.q, firstTile.r);
        if (distFromShip > 1) {
            this.showToast("✏️ Để tự vẽ đường đi: Hãy nhấp đúp (2 lần) và giữ chuột từ ô thuyền đang đứng hoặc ô ngay sát cạnh thuyền rồi kéo qua từng ô!");
            return false;
        }

        this.customDrawnPath = [];
        if (distFromShip === 1) {
            this.customDrawnPath.push(firstTile);
        }

        const startTile = this.getCurrentTile(p);
        this.world.showPathPreview(startTile ? [startTile, ...this.customDrawnPath] : [...this.customDrawnPath]);
        this.showToast(`✏️ Đang vẽ đường đi thủ công (${this.customDrawnPath.length}/${maxSteps} ô) — Kéo chuột qua từng ô nước để né Đá Ngầm rồi thả chuột!`);
        return true;
    }

    stepCustomPathDrag(tile) {
        if (!this.isGameStarted || !this.isMyTurn() || !tile || !tile.navigable) return;
        if (tile.stormRestricted && !this.sandboxInfiniteMove) return;

        const p = this.getActivePlayer();
        if (!p) return;
        const maxSteps = this.getRemainingHexSteps(p);

        // Ignore if dragging on current ship hex when path is empty
        if (this.customDrawnPath.length === 0 && tile.q === p.q && tile.r === p.r) return;

        // Allow backtracking if dragging back onto the previous hex in customDrawnPath
        if (this.customDrawnPath.length >= 2) {
            const prevTile = this.customDrawnPath[this.customDrawnPath.length - 2];
            if (prevTile.q === tile.q && prevTile.r === tile.r) {
                this.customDrawnPath.pop();
                const startTile = this.getCurrentTile(p);
                this.world.showPathPreview(startTile ? [startTile, ...this.customDrawnPath] : [...this.customDrawnPath]);
                return;
            }
        } else if (this.customDrawnPath.length === 1 && tile.q === p.q && tile.r === p.r) {
            this.customDrawnPath.pop();
            this.world.clearPathPreview();
            return;
        }

        const lastNode = this.customDrawnPath.length > 0
            ? this.customDrawnPath[this.customDrawnPath.length - 1]
            : { q: p.q, r: p.r };

        if (lastNode.q === tile.q && lastNode.r === tile.r) return;

        // If the previous node in the path is already a dock-only POI, cannot drag through it unless sandboxInfiniteMove
        if (this.customDrawnPath.length > 0 && !this.sandboxInfiniteMove) {
            const prev = this.customDrawnPath[this.customDrawnPath.length - 1];
            if (prev.monumentId || prev.isPort || prev.resourceType || prev.hasNPC) {
                return;
            }
        }

        // Must be adjacent (distance === 1) to the last hex in the custom path and within maxSteps
        const stepDist = this.hexDistance(lastNode.q, lastNode.r, tile.q, tile.r);
        if (stepDist === 1 && this.customDrawnPath.length < maxSteps) {
            if (!this.customDrawnPath.some(t => t.q === tile.q && t.r === tile.r)) {
                this.customDrawnPath.push(tile);
                const startTile = this.getCurrentTile(p);
                this.world.showPathPreview(startTile ? [startTile, ...this.customDrawnPath] : [...this.customDrawnPath]);
            }
        }
    }

    commitCustomPathDrag() {
        const p = this.getActivePlayer();
        if (!p || !this.customDrawnPath || this.customDrawnPath.length === 0) {
            this.customDrawnPath = [];
            this.world.clearPathPreview();
            return;
        }
        const path = [...this.customDrawnPath];
        const destTile = path[path.length - 1];
        const steps = path.length;
        this.customDrawnPath = [];
        this.movePlayerAlongRoute(p, destTile, steps, path);
    }

    handleHexClick(tile) {
        if (!this.isGameStarted || this.isBusy) return;
        const p = this.getActivePlayer();
        if (!p) return;

        // If the player clicks on the map while the pre-game countdown is still running
        // or after closing the Opening Speed Quiz modal, immediately transition to "playing" so they can move!
        if (this.isPreGameCountingDown || this.roomState.status === "turn_order_quiz") {
            if (!this.isModalOpen()) {
                this.confirmStartMatchAfterOpeningQuiz();
            } else {
                return;
            }
        }

        // Strictly prevent non-active players from moving or acting during another player's turn!
        if (!this.isMyTurn()) {
            this.showToast(`👁️ Đang là lượt của [${p.name}]! Bạn có thể xoay/phóng to camera tự do để quan sát bản đồ.`);
            return;
        }

        if (!tile.navigable) {
            this.showToast("⛰️ Vùng đất liền / núi cao này không thể đi xuyên qua! Hãy điều khiển thuyền đi vòng trên biển.");
            return;
        }

        if (tile.stormRestricted && !this.sandboxInfiniteMove) {
            this.showToast("⛔ Mỏ tài nguyên này đang bị phong tỏa bởi Giông Bão! Không thể di chuyển vào lúc này.");
            return;
        }

        const key = `${tile.q},${tile.r}`;
        if (tile.q === p.q && tile.r === p.r) {
            this.triggerContextualActionOnCurrentHex();
            return;
        }

        // Sandbox Click-to-Teleport mode: instantly teleport ship to clicked water hex!
        if (this.sandboxTeleport) {
            p.q = tile.q;
            p.r = tile.r;
            this.world.syncShipsSmoothly(this.players, this.getLocalPlayer());
            this.world.triggerBurstAnimation(tile.q, tile.r, 0xfbbf24, 24);
            window.SFX.playClick();
            this.refreshReachableHexes();
            this.updateUI();
            this.syncMultiplayerGameState();
            this.showToast(`⚡ [Sáng Tạo] Đã dịch chuyển tức thời tới ô (${tile.q}, ${tile.r})!`);
            return;
        }

        // Guarantee reachablePaths is freshly computed for the active player before checking!
        if ((!this.world.reachablePaths || this.world.reachablePaths.size === 0) && this.getRemainingHexSteps(p) > 0) {
            this.refreshReachableHexes();
        }

        if (!this.world.reachablePaths.has(key)) {
            const maxMoveDesc = this.currentWeatherPhase === "super_typhoon_yagi"
                ? "Trong Siêu Bão Yagi: 1 AP = 1 ô (Tối đa 3 AP = 3 ô)"
                : "Tối đa 3 AP = 6 ô nước cho việc di chuyển";
            this.showToast(`⛵ Ô này nằm ngoài tầm di chuyển hiện tại (${maxMoveDesc})!`);
            return;
        }

        const routeInfo = this.world.reachablePaths.get(key);
        this.movePlayerAlongRoute(p, tile, routeInfo.steps, routeInfo.path);
    }

    movePlayerAlongRoute(player, targetTile, stepsRequired, pathTiles, onAfterMove = null) {
        const stepsPerAp = this.getStepsPerMoveAP();
        if (this.sandboxInfiniteMove && !player.isAI) {
            player.ap = Math.max(5, player.ap);
            player.moveApSpent = 0;
            player.hexMoveCredits = 0;
        } else {
            let needed = stepsRequired;
            if (player.hexMoveCredits >= needed) {
                player.hexMoveCredits -= needed;
                needed = 0;
            } else {
                needed -= player.hexMoveCredits;
                player.hexMoveCredits = 0;
                const apToSpend = Math.ceil(needed / stepsPerAp);
                player.ap = Math.max(0, player.ap - apToSpend);
                player.moveApSpent += apToSpend;
                player.hexMoveCredits = (apToSpend * stepsPerAp) - needed;
            }
        }

        player.q = targetTile.q;
        player.r = targetTile.r;
        this.isBusy = true;

        this.world.animateShipAlongPath(player, pathTiles, player.id, this.players.length, () => {
            this.isBusy = false;

            // Check if the ship sailed through or landed on any Reef (Bãi Đá Ngầm -> -1 HP per Reef!)
            const reefHits = (pathTiles || []).filter(t => t && (t.isReef || t.terrain === "reef"));
            if (reefHits.length > 0) {
                reefHits.forEach(rt => {
                    this.world.triggerBurstAnimation(rt.q, rt.r, 0xf43f5e, 22);
                });
                this.applyPlayerDamage(player, reefHits.length, `Đi qua ${reefHits.length} Bãi Đá Ngầm (Nhấp đúp giữ kéo để vẽ đường né!)`);
                if (!player.eliminated) {
                    this.showToast(`⚠️ Thuyền của ${player.name} va phải Bãi Đá Ngầm (-${reefHits.length} ❤️ HP)! Mẹo: Nhấp đúp & giữ kéo để tự vẽ đường né!`);
                }
            }

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
        if (this.sandboxInfiniteMove && !player.isAI) return true;
        return player.ap >= 1;
    }

    spendInteractiveAP(player) {
        if (this.sandboxInfiniteMove && !player.isAI) {
            player.ap = Math.max(5, player.ap);
            this.refreshReachableHexes();
            this.updateUI();
            return;
        }
        player.ap = Math.max(0, player.ap - 1);
        player.interactiveApUsed = true;
        if (player.ap <= 0 && player.hexMoveCredits <= 0) {
            player.ap = 0;
        }
        this.refreshReachableHexes();
        this.updateUI();
    }

    triggerContextualActionOnCurrentHex() {
        const p = this.getActivePlayer();
        if (!this.isMyTurn()) {
            return;
        }
        const tile = this.getCurrentTile(p);
        if (!tile) return;

        if (!tile.monumentId && !tile.isPort && !tile.resourceType && !tile.hasNPC) {
            this.showToast("⛵ Hãy di chuyển thuyền đến ô Thương Cảng, Di Tích, Mỏ Tài Nguyên hoặc Tiên Ông để tương tác!");
            return;
        }

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
    // V & VII.1 RESOURCE MINING (NO COINS FROM MINING — RESOURCES ONLY!)
    // - Correct answer: +2 Resource (0 Xu)
    // - Wrong answer: +1 Resource (0 Xu; during Yagi also triggers -1 HP Lightning!)
    // - Sunset / Starry Night: Cooldown reduced by 1 round (-1 vòng)
    // ------------------------------------------------------------------------
    openResourceMiningModal(tile) {
        const p = this.getActivePlayer();
        if (!this.isMyTurn()) return;
        if (tile.stormRestricted && !this.sandboxInfiniteMove) {
            this.showToast("⛔ Mỏ tài nguyên này đang bị phong tỏa bởi Giông Bão! Hãy đợi bão tan hoặc khai thác mỏ khác.");
            return;
        }
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

        const isNightOrSunsetBonus = (this.currentWeatherPhase === "sunset" || this.currentWeatherPhase === "night");
        const resLabels = {
            food: { name: "Lương Thực (Lúa Gạo / Thủy Sản)", icon: "🌾", cd: isNightOrSunsetBonus ? 1 : 2 },
            wood: { name: "Gỗ Lâm Nghiệp Đóng Tàu", icon: "🌲", cd: isNightOrSunsetBonus ? 2 : 3 },
            iron: { name: "Quặng Sắt & Đinh Đóng Tàu", icon: "⛏️", cd: isNightOrSunsetBonus ? 3 : 4 }
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

        const yagiWarnHtml = this.currentWeatherPhase === "super_typhoon_yagi"
            ? `<div style="color:#fca5a5; font-weight:700; margin-top:4px">⚡ Cảnh báo Siêu Bão Yagi: Nếu trả lời SAI câu hỏi khai thác, thuyền sẽ bị Sét Đánh (-1 ❤️ HP)!</div>`
            : "";

        const modalHtml = `
            <div class="modal-header-badge" style="background:${tile.region.color}33; border-color:${tile.region.color}">
                <span>${rMeta.icon} KHAI THÁC TÀI NGUYÊN &amp; ĐỐ VUI ĐỊA LÝ TRỰC QUAN</span>
                <span class="badge-tag">${tile.region.name}</span>
            </div>
            <h2 class="modal-title">Khai Thác ${rMeta.name}</h2>
            <p class="modal-desc">
                📦 <strong>Luật Khai Thác Mới:</strong> Khai thác tài nguyên <strong>chỉ nhận Tài nguyên</strong> (Xu chỉ kiếm từ buôn bán ở Thương Cảng hoặc chinh phục Di Tích).<br/>
                • Trả lời <strong>ĐÚNG</strong>: Nhận <strong>+2 ${rMeta.icon} ${rMeta.name}</strong>!<br/>
                • Trả lời <strong>SAI</strong>: Nhận <strong>+1 ${rMeta.icon} ${rMeta.name}</strong>.${yagiWarnHtml}
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

        const isCorrect = (chosenIdx === quiz.correct);
        const freeSpace = Math.max(0, 8 - this.getCargoCount(p));
        const resGain = Math.max(1, Math.min(freeSpace, isCorrect ? 2 : 1));
        p[tile.resourceType] += resGain;

        tile.resourceCooldown = rMeta.cd;
        this.world.updateResourceVisuals();

        window.SFX.playMine();
        this.world.triggerBurstAnimation(tile.q, tile.r, isCorrect ? 0x34d399 : 0x5c9ead, 20);

        let yagiPenaltyNote = "";
        if (!isCorrect && this.currentWeatherPhase === "super_typhoon_yagi") {
            this.world.triggerLightningStrikeEffect(tile.q, tile.r);
            this.applyPlayerDamage(p, 1, "Sét đánh khi trả lời sai khai thác trong Siêu Bão Yagi");
            yagiPenaltyNote = " • ⚡ Bị Sét Đánh -1 ❤️ HP do trả lời sai trong Siêu Bão Yagi!";
        }

        this.logEvent(`${rMeta.icon} ${p.name} khai thác +${resGain} ${rMeta.name} (Hồi sau ${rMeta.cd} vòng)${yagiPenaltyNote}.`);

        // Broadcast answered state + Visual Memory Card to all spectators!
        if (this.liveQuizState) {
            this.liveQuizState.phase = "answered";
            this.liveQuizState.chosenIdx = chosenIdx;
            this.liveQuizState.outcomeTitle = isCorrect
                ? `${p.name} Trả Lời Chính Xác! (+${resGain} ${rMeta.icon} ${rMeta.name})`
                : `${p.name} Hoàn Thành Khai Thác (+${resGain} ${rMeta.icon}${yagiPenaltyNote})`;
        }

        const resultHtml = `
            <div class="modal-header-badge" style="background:${isCorrect ? '#2e6f4033' : '#9e5a2b33'}; border-color:${isCorrect ? '#4b9b68' : '#c58b43'}">
                <span>${isCorrect ? `✅ TRẢ LỜI CHÍNH XÁC! (+${resGain} ${rMeta.icon})` : `💡 CỦNG CỐ KIẾN THỨC ĐỊA LÝ (+${resGain} ${rMeta.icon})`}</span>
                <span class="badge-tag">+${resGain} ${rMeta.icon} ${rMeta.name} • ⏱️ Tự đóng <span id="quiz-autoclose-sec">10</span>s</span>
            </div>
            <h2 class="modal-title">${isCorrect ? `Xuất Sắc! Bạn Nhận +${resGain} ${rMeta.icon} ${rMeta.name}` : `Hoàn Thành Khai Thác (+${resGain} ${rMeta.icon})${yagiPenaltyNote}`}</h2>
            ${this.renderQuizVisualMemoryCard(quiz, chosenIdx)}
            <p class="modal-desc" style="margin-top:10px; margin-bottom:4px">
                ⏳ <strong>Tái tạo sinh thái:</strong> Ô tài nguyên này sẽ tự động phục hồi 100% trữ lượng sau <strong>${rMeta.cd} vòng</strong>.
            </p>
            <div class="modal-actions" style="justify-content:space-between">
                <span style="font-size:12px; color:#fbbf24; font-weight:700">⏳ Tự động đóng sau <span id="quiz-autoclose-sec-sub">10</span> giây...</span>
                <button class="btn-primary-gold" onclick="window.GAME.closeQuizResultNow()">✕ Đóng Ngay Lập Tức</button>
            </div>
        `;
        this.showModal(resultHtml);
        this.startQuizResultAutoCloseTimer(10);
        this.updateUI();
        this.syncMultiplayerGameState();
    }

    // ------------------------------------------------------------------------
    // IV & V. 8M30S PORT MARKET RESET, 6 PORTS INSPECTOR & P2P MARKETPLACE
    // - Every 8m30s (510s), each of the 6 Ports refreshes:
    //   + Sells ONLY 1 random Key tier (Key 1, Key 2, or Key 3)
    //   + Sells Specialty (1 Xu -> Sell 1 region away = 2 Xu [+1 Xu], 2+ regions = 3 Xu [+2 Xu])
    //   + Standard resource exchange: 1 Xu = 2 Lúa | 1 Xu = 3 Gỗ | 1 Xu = 1 Sắt
    //   + Randomized port resource batch deals
    //   + 🐍 Đồng Xu Mãng Xà (10 Xu: Passive revival to 2 HP when HP hits 0)
    // ------------------------------------------------------------------------
    resetAllPortInventories(notify = true) {
        this.portResetRemainingSec = this.portResetIntervalSec;
        const portNames = [
            "Thương Cảng Cái Lân (Quảng Ninh)",
            "Thương Cảng Hải Phòng",
            "Thương Cảng Tiên Sa (Đà Nẵng)",
            "Thương Cảng Liên Vùng Tây Nguyên – Quy Nhơn",
            "Thương Cảng Quốc Tế Cái Mép – Sài Gòn",
            "Thương Cảng Cần Thơ – Cửu Long"
        ];
        // Guarantee that across the 6 Ports, all 3 Key tiers (Key 1, Key 2, Key 3) are represented (2 ports each, shuffled!)
        const keyDistribution = [1, 1, 2, 2, 3, 3];
        for (let i = keyDistribution.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [keyDistribution[i], keyDistribution[j]] = [keyDistribution[j], keyDistribution[i]];
        }
        const keyPrices = { 1: 2, 2: 4, 3: 6 };

        this.portInventories = {};
        for (let regId = 0; regId < 6; regId++) {
            const keyTier = keyDistribution[regId];
            const randFoodQty = 2 + Math.floor(Math.random() * 2); // 2 or 3
            const randWoodQty = 3 + Math.floor(Math.random() * 2); // 3 or 4
            const randIronQty = 1 + Math.floor(Math.random() * 2); // 1 or 2
            this.portInventories[regId] = {
                regionId: regId,
                portName: portNames[regId],
                availableKeyTier: keyTier,
                keyPrice: keyPrices[keyTier],
                keyStock: 1,
                specialtyStock: 3,
                randomBatches: [
                    { resType: "food", icon: "🌾", name: "Lô Lúa Tiếp Tế", qty: randFoodQty, cost: 1 },
                    { resType: "wood", icon: "🌲", name: "Lô Gỗ Đóng Tàu", qty: randWoodQty, cost: 1 },
                    { resType: "iron", icon: "⛏️", name: "Lô Quặng Sắt", qty: randIronQty, cost: randIronQty }
                ]
            };
        }

        if (notify && this.isGameStarted) {
            this.logEvent("🔄 [Chu kỳ 8p30s] Toàn bộ 6 Thương Cảng vừa làm mới ngẫu nhiên Chìa Khóa (Key 1/2/3) và lô tài nguyên!");
            this.addTradeBulletinNotice("🔄 6 Thương Cảng vừa làm mới vật phẩm & Key ngẫu nhiên!");
            this.showToast("🔄 Kho hàng & Chìa Khóa tại 6 Thương Cảng vừa được làm mới (Chu kỳ 8p30s)!");
            this.updateUI();
        }
    }

    getPortInventory(regionId) {
        if (!this.portInventories || !this.portInventories[regionId]) {
            const rId = regionId || 0;
            const tier = (rId % 3) + 1;
            return {
                regionId: rId,
                portName: (window.GAME_DATA.regions[rId] && window.GAME_DATA.regions[rId].portName) || `Thương Cảng ${rId + 1}`,
                availableKeyTier: tier,
                keyPrice: tier * 2,
                keyStock: 1,
                specialtyStock: 3
            };
        }
        return this.portInventories[regionId];
    }

    openTradePortModal(tile) {
        const p = this.getActivePlayer();
        if (!this.isMyTurn()) return;
        if (!this.canSpendInteractiveAP(p) && !this.portApDeducted) {
            this.showToast("Cần 1 AP Tương Tác để giao dịch tại Thương Cảng!");
            return;
        }

        const region = tile.region;
        const spec = region.specialty;
        const portInv = (this.portInventories && this.portInventories[region.id]) || {
            availableKeyTier: (region.id % 3) + 1,
            keyPrice: ((region.id % 3) + 1) * 2
        };

        const sellableListHtml = p.specialties.map((item, idx) => {
            const dist = Math.abs(region.id - item.regionId);
            const originReg = window.GAME_DATA.regions[item.regionId];
            let sellInfo = "";
            if (dist === 0) {
                sellInfo = `
                    <button class="btn-trade-action" onclick="window.GAME.listSpecialtyOnPlayerMarket(${idx}, 2)">
                        📢 Đăng Bán Lên Chợ Chung (Giá 2 Xu • 0 AP)
                    </button>
                `;
            } else if (dist === 1) {
                sellInfo = `
                    <div style="display:flex; gap:6px; flex-wrap:wrap">
                        <button class="btn-trade-action gold" onclick="window.GAME.sellSpecialtyAtPort(${idx}, 2)">
                            💰 Bán Cách 1 Vùng: Thu 2 Xu (Lời +1 Xu)
                        </button>
                        <button class="btn-trade-action" onclick="window.GAME.listSpecialtyOnPlayerMarket(${idx}, 2)">Đăng Chợ (2 Xu • 0 AP)</button>
                    </div>
                `;
            } else {
                sellInfo = `
                    <div style="display:flex; gap:6px; flex-wrap:wrap">
                        <button class="btn-trade-action gold" onclick="window.GAME.sellSpecialtyAtPort(${idx}, 3)">
                            💰 Bán Cách ${dist} Vùng (≥2 vùng): Thu 3 Xu (Lời +2 Xu)
                        </button>
                        <button class="btn-trade-action" onclick="window.GAME.listSpecialtyOnPlayerMarket(${idx}, 3)">Đăng Chợ (3 Xu • 0 AP)</button>
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

        const kTier = portInv.availableKeyTier;
        const kCost = portInv.keyPrice;
        const hasMaxThisKey = (p.keys[kTier] || 0) >= 1;

        const html = `
            <div class="modal-header-badge" style="background:${region.color}33; border-color:${region.color}">
                <span>⚓ THƯƠNG CẢNG: ${tile.portName.toUpperCase()}</span>
                <span class="badge-tag">🔄 Reset cảng sau: ${this.formatMMSS(this.portResetRemainingSec)}</span>
            </div>
            <h2 class="modal-title">Giao Thương Đặc Sản, Tài Nguyên Định Lượng &amp; Vật Phẩm Cảng</h2>

            <div class="port-wallet-bar">
                <div class="wallet-coin-pill">
                    💰 Ngân khố: <strong>${p.coins} / 15 Xu</strong>
                </div>
                <div class="wallet-cargo-pill">
                    📦 Kho: <strong>${this.getCargoCount(p)} / 8 thẻ</strong>
                    &nbsp;•&nbsp; 🌾 Lúa: <strong>${p.food}</strong>
                    &nbsp;•&nbsp; 🌲 Gỗ: <strong>${p.wood}</strong>
                    &nbsp;•&nbsp; ⛏️ Sắt: <strong>${p.iron}</strong>
                    &nbsp;•&nbsp; 🗝️ Key 1/2/3 (Tối đa 1 mỗi loại): <strong>${p.keys[1] || 0}/1 • ${p.keys[2] || 0}/1 • ${p.keys[3] || 0}/1</strong>
                    ${p.hasSerpentCoin ? '&nbsp;•&nbsp; <strong style="color:#f472b6">🐍 Đã có Xu Mãng Xà</strong>' : ''}
                </div>
            </div>

            <div class="port-grid-sections">
                <div class="port-box">
                    <h3>1. Mua Đặc Sản Bản Địa (Giá: 1 💰 Xu — Cách 1 vùng lời +1 Xu, Cách ≥2 vùng lời +2 Xu)</h3>
                    <div class="trade-row-card highlight">
                        <div>
                            <div style="font-size:15.5px; font-weight:700; color:#e5c365">${spec.icon} ${spec.name}</div>
                            <div style="font-size:12px; color:#c8d2dc; margin-top:2px">${spec.desc}</div>
                            <div style="font-size:11.5px; color:#7ab8c9; margin-top:4px">
                                📈 <strong>Luật giá đặc sản mới:</strong> Mua giá gốc <strong>1 Xu</strong> → Bán cách <strong>1 vùng = 2 Xu (+1 Xu lãi)</strong> | Bán cách <strong>2 vùng trở lên = 3 Xu (+2 Xu lãi)</strong>.
                            </div>
                        </div>
                        <button class="btn-trade-action gold" onclick="window.GAME.buySpecialtyAtPort(${region.id})">
                            🛒 Mua Đặc Sản (1 💰 Xu)
                        </button>
                    </div>
                </div>

                <div class="port-box">
                    <h3>2. Bán Đặc Sản Đang Chở Trên Tàu (${p.specialties.length} kiện)</h3>
                    ${sellableListHtml}
                </div>

                <div class="port-box">
                    <h3>3. Mở Bán Lúa, Gỗ, Sắt Định Lượng &amp; Vật Phẩm Cảng (Làm mới mỗi 8p30s)</h3>
                    <div class="key-shop-grid">
                        <div class="key-shop-item">
                            <div class="key-title">🌾 Mua 2 Lúa Gạo</div>
                            <div class="key-sub">Định lượng: 1 Xu = 2 Lúa</div>
                            <button class="btn-trade-action" onclick="window.GAME.buyPortResourceBundle('food', 2, 1)">Mua 2 🌾 (1 💰 Xu)</button>
                        </div>
                        <div class="key-shop-item">
                            <div class="key-title">🌲 Mua 3 Gỗ Quý</div>
                            <div class="key-sub">Định lượng: 1 Xu = 3 Gỗ</div>
                            <button class="btn-trade-action" onclick="window.GAME.buyPortResourceBundle('wood', 3, 1)">Mua 3 🌲 (1 💰 Xu)</button>
                        </div>
                        <div class="key-shop-item">
                            <div class="key-title">⛏️ Mua 1 Quặng Sắt</div>
                            <div class="key-sub">Định lượng: 1 Xu = 1 Sắt</div>
                            <button class="btn-trade-action" onclick="window.GAME.buyPortResourceBundle('iron', 1, 1)">Mua 1 ⛏️ (1 💰 Xu)</button>
                        </div>
                        <div class="key-shop-item" style="border-color:#fbbf24">
                            <div class="key-title">🗝️ Key ${kTier} (Độc quyền Cảng)</div>
                            <div class="key-sub">Mỗi cảng bán 1 loại Key (${p.keys[kTier] || 0}/1)</div>
                            <button class="btn-trade-action gold" ${hasMaxThisKey ? 'disabled' : ''} onclick="window.GAME.buyKeyAtPort(${kTier}, ${kCost})">
                                ${hasMaxThisKey ? `Đã Tối Đa (1/1)` : `Mua Key ${kTier} (${kCost} 💰 Xu)`}
                            </button>
                        </div>
                    </div>

                    <div class="trade-row-card" style="margin-top:8px; border-color:#ec4899; background:rgba(131, 24, 67, 0.25)">
                        <div>
                            <strong style="color:#f9a8d4; font-size:13.5px">🐍 Đồng Xu Mãng Xà (Vật Phẩm Bảo Hộ Tự Động — Giá: 10 💰 Xu)</strong>
                            <div style="font-size:11.5px; color:#fbcfe8">
                                Nội tại tự động kích hoạt khi máu thuyền giảm về <strong>0 HP</strong>: Ngay lập tức cứu thuyền thoát đắm và <strong>hồi phục 2 ❤️ HP</strong>!
                            </div>
                        </div>
                        <button class="btn-trade-action gold" ${p.hasSerpentCoin ? 'disabled' : ''} onclick="window.GAME.buySerpentCoinAtPort()">
                            ${p.hasSerpentCoin ? '✅ Đã Sở Hữu' : '🐍 Mua Xu Mãng Xà (10 💰 Xu)'}
                        </button>
                    </div>
                </div>
            </div>

            <div class="modal-actions" style="justify-content:space-between">
                <button class="btn-secondary" onclick="window.GAME.openMaritimeMarketModal()">⚖️ Xem Kho Hàng 6 Cảng &amp; Chợ Người Chơi</button>
                <button class="btn-primary-gold" onclick="window.GAME.finishPortVisit()">Rời Thương Cảng</button>
            </div>
        `;

        this.currentPortTile = tile;
        this.showModal(html);
    }

    openMaritimeMarketModal(portFilter = null) {
        if (portFilter !== null) {
            this.selectedMarketPortFilter = portFilter;
        }
        const p = this.getLocalPlayer() || this.getActivePlayer();
        if (!p) return;

        // 1. Port Inspector Tabs: Players can click each of the 6 Ports to see what it sells!
        const filter = this.selectedMarketPortFilter || "all";
        const tabsHtml = `
            <div class="port-filter-tabs">
                <button class="port-tab-btn ${filter === 'all' ? 'active' : ''}" onclick="window.GAME.openMaritimeMarketModal('all')">
                    🌐 Tất Cả 6 Cảng
                </button>
                ${window.GAME_DATA.regions.map(r => `
                    <button class="port-tab-btn ${String(filter) === String(r.id) ? 'active' : ''}" onclick="window.GAME.openMaritimeMarketModal('${r.id}')">
                        ⚓ Cảng Vùng ${r.id + 1} (${r.specialty.icon})
                    </button>
                `).join("")}
            </div>
        `;

        const portsToShow = filter === "all"
            ? window.GAME_DATA.regions
            : window.GAME_DATA.regions.filter(r => String(r.id) === String(filter));

        const portCardsHtml = portsToShow.map(r => {
            const inv = (this.portInventories && this.portInventories[r.id]) || {
                portName: `Thương Cảng Vùng ${r.id + 1}`,
                availableKeyTier: (r.id % 3) + 1,
                keyPrice: ((r.id % 3) + 1) * 2
            };
            const portTile = this.world.hexTiles.find(t => t.isPort && t.regionId === r.id);
            const isDockedHere = this.isMyTurn() && portTile && p.q === portTile.q && p.r === portTile.r;
            return `
                <div class="trade-row-card" style="border-left:4px solid ${r.color}">
                    <div>
                        <strong style="color:#f8fafc; font-size:13px">⚓ ${inv.portName} (${r.name})</strong>
                        <div style="font-size:11.5px; color:#cbd5e1; margin-top:3px">
                            • Đặc sản bán ra: <strong style="color:#fde047">${r.specialty.icon} ${r.specialty.shortName} (1 💰 Xu)</strong><br/>
                            • Chìa khóa đang bán (Chu kỳ này): <strong style="color:#34d399">🗝️ Key ${inv.availableKeyTier} (${inv.keyPrice} 💰 Xu)</strong><br/>
                            • Tài nguyên &amp; Bảo vật: <strong>1 Xu = 2🌾 Lúa | 1 Xu = 3🌲 Gỗ | 1 Xu = 1⛏️ Sắt | 🐍 Xu Mãng Xà (10 Xu)</strong>
                        </div>
                    </div>
                    <div>
                        ${isDockedHere
                            ? `<button class="btn-trade-action gold" onclick="window.GAME.openTradePortModal(window.GAME.world.hexTiles.find(t=>t.isPort&&t.regionId===${r.id}))">⚓ Mở Cảng Ngay</button>`
                            : `<button class="btn-secondary" style="font-size:11px; padding:5px 9px" onclick="window.GAME.closeModal(true); window.GAME.world.focusCameraOnHex(${portTile ? portTile.q : 0}, ${portTile ? portTile.r : 0})">🔭 Xem Vị Trí</button>`
                        }
                    </div>
                </div>
            `;
        }).join("");

        // 2. P2P Player Marketplace (Sell Lúa, Gỗ, Sắt, Specialties at custom price; Keys cannot be sold)
        const marketHtml = this.renderSharedMarketListingsHtml(p, false);
        const playerSpecHtml = (p.specialties || []).map((item, idx) => {
            const originReg = window.GAME_DATA.regions[item.regionId];
            return `
                <div class="trade-row-card">
                    <div>
                        <strong>${item.icon} ${item.name}</strong>
                        <span style="font-size:12px; color:#94a3b8"> (Vùng gốc: ${originReg.name})</span>
                    </div>
                    <div style="display:flex; gap:6px; align-items:center">
                        <button class="btn-trade-action" onclick="window.GAME.listSpecialtyOnPlayerMarket(${idx}, 2, true)">Đăng 2 💰 Xu</button>
                        <button class="btn-trade-action gold" onclick="window.GAME.listSpecialtyOnPlayerMarket(${idx}, 3, true)">Đăng 3 💰 Xu</button>
                    </div>
                </div>
            `;
        }).join("") || `<div style="color:#94a3b8; font-style:italic; font-size:12px">Thuyền của bạn (${p.name}) chưa có Đặc sản vùng nào trong khoang để đăng bán.</div>`;

        const html = `
            <div class="modal-header-badge" style="background:#2d687833; border-color:#5c9ead">
                <span>⚖️ KHO HÀNG 6 THƯƠNG CẢNG &amp; CHỢ GIAO THƯƠNG TỰ DO (0 AP)</span>
                <span class="badge-tag">🔄 Reset 6 Cảng sau: ${this.formatMMSS(this.portResetRemainingSec)}</span>
            </div>
            <h2 class="modal-title">Tra Cứu Vật Phẩm 6 Cảng &amp; Mua Bán Giữa Người Chơi</h2>

            <div class="port-wallet-bar">
                <div class="wallet-coin-pill">
                    💰 Số Xu của ${p.name}: <strong>${p.coins} / 15 Xu</strong>
                </div>
                <div class="wallet-cargo-pill">
                    📦 Kho: <strong>${this.getCargoCount(p)} / 8 thẻ</strong>
                    &nbsp;•&nbsp; 🌾 Lúa: <strong>${p.food}</strong>
                    &nbsp;•&nbsp; 🌲 Gỗ: <strong>${p.wood}</strong>
                    &nbsp;•&nbsp; ⛏️ Sắt: <strong>${p.iron}</strong>
                    &nbsp;•&nbsp; 🗝️ Key 1/2/3: <strong>${p.keys[1] || 0}/1 • ${p.keys[2] || 0}/1 • ${p.keys[3] || 0}/1</strong>
                </div>
            </div>

            <div class="port-grid-sections">
                <div class="port-box" style="border-color:#38bdf8">
                    <h3>⚓ 1. Bấm Chọn Từng Cảng Để Xem Cảng Đó Đang Bán Key &amp; Vật Phẩm Gì (Làm mới mỗi 8p30s)</h3>
                    ${tabsHtml}
                    <div style="max-height:210px; overflow-y:auto; padding-right:4px">
                        ${portCardsHtml}
                    </div>
                </div>

                <div class="port-box" style="border-color:#c59b27">
                    <h3>📦 2. Đăng Bán Tài Nguyên / Đặc Sản Của Bạn (${p.name}) Với Giá Tự Đặt — 0 AP (Không được bán Key)</h3>
                    <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:10px; background:rgba(15,23,42,0.75); padding:8px 10px; border-radius:8px">
                        <span style="font-size:12px; color:#fde047; font-weight:700">Đặt giá bán (Xu):</span>
                        <input type="number" id="custom-p2p-price" min="1" max="15" value="2" style="width:58px; padding:4px 6px; border-radius:6px; border:1px solid #38bdf8; background:#0f172a; color:#fff; font-weight:800" />
                        <button class="btn-trade-action" onclick="window.GAME.listResourceWithCustomPrice('food')">📢 Bán 1 🌾 Lúa [Có: ${p.food}]</button>
                        <button class="btn-trade-action" onclick="window.GAME.listResourceWithCustomPrice('wood')">📢 Bán 1 🌲 Gỗ [Có: ${p.wood}]</button>
                        <button class="btn-trade-action" onclick="window.GAME.listResourceWithCustomPrice('iron')">📢 Bán 1 ⛏️ Sắt [Có: ${p.iron}]</button>
                    </div>
                    ${playerSpecHtml}
                </div>

                <div class="port-box" style="border-color:#5c9ead">
                    <h3>🛒 3. Các Lô Hàng Đang Chào Bán Trên Sàn Chợ Chung (Mua Ngay Không Tốn AP)</h3>
                    ${marketHtml}
                </div>
            </div>

            <div class="modal-actions">
                <button class="btn-primary-gold" onclick="window.GAME.closeModal(true)">Đóng Cửa Sổ Chợ &amp; Cảng</button>
            </div>
        `;
        this.showModal(html);
    }

    listResourceWithCustomPrice(resType) {
        const priceEl = document.getElementById("custom-p2p-price");
        const price = Math.max(1, Math.min(15, parseInt(priceEl ? priceEl.value : "2", 10) || 2));
        this.listResourceOnPlayerMarket(resType, price, true);
    }

    renderSharedMarketListingsHtml(viewerPlayer, insidePortModal = false) {
        const p = viewerPlayer || this.getLocalPlayer() || this.getActivePlayer();
        if (this.marketListings.length === 0) {
            return `<div style="color:#94a3b8; font-style:italic; padding:8px 0">Hiện chưa có lô hàng nào đang rao bán trên sàn.</div>`;
        }
        return this.marketListings.map(listing => {
            const isOwn = p && (listing.sellerId === p.id);
            const regionInfo = listing.itemType === "specialty"
                ? ` • Xuất xứ: ${window.GAME_DATA.regions[listing.regionId].name}`
                : "";
            return `
                <div class="trade-row-card">
                    <div>
                        <strong style="color:#e5c365">${listing.icon} ${listing.name}</strong>
                        <div style="font-size:12px; color:#cbd5e1">
                            Người bán: <strong>${listing.sellerName}</strong>${regionInfo} • Giá: <strong style="color:#68b684">${listing.price} 💰 Xu</strong> <span style="font-size:10.5px; color:#9be2b6">(0 AP)</span>
                        </div>
                    </div>
                    <div>
                        ${isOwn
                            ? `<button class="btn-trade-action" style="background:#475569" onclick="window.GAME.cancelMarketListing(${listing.id}, ${insidePortModal})">Thu hồi về tàu (0 AP)</button>`
                            : `<button class="btn-trade-action gold" onclick="window.GAME.buyMarketListing(${listing.id}, ${insidePortModal})">🛒 Mua Ngay (${listing.price} 💰 Xu • 0 AP)</button>`
                        }
                    </div>
                </div>
            `;
        }).join("");
    }

    async syncMarketTransaction() {
        if (!this.roomState.code) return;
        const snapshot = this.serializeGameState();
        this.saveRoomToLocalStorage(snapshot);
        try {
            const resp = await fetch("/api/room/market-tx", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: this.roomState.code,
                    players: this.players,
                    updatedPlayers: this.players,
                    marketListings: this.marketListings,
                    tradeBulletinNotices: this.tradeBulletinNotices
                })
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

    listSpecialtyOnPlayerMarket(specIdx, price, fromMarketModal = false) {
        const p = this.getLocalPlayer() || this.getActivePlayer();
        if (!p) return;
        const item = p.specialties[specIdx];
        if (!item) return;

        p.specialties.splice(specIdx, 1);

        this.marketListings.unshift({
            id: Date.now() + Math.floor(Math.random() * 1000),
            sellerId: p.id,
            sellerName: p.name,
            itemType: "specialty",
            regionId: item.regionId,
            name: item.name,
            icon: item.icon,
            price: Math.max(1, Math.min(15, price))
        });

        window.SFX.playClick();
        this.logEvent(`📢 ${p.name} đã đăng bán đặc sản [${item.icon} ${item.name}] lên Sàn Giao Thương với giá ${price} Xu (0 AP)!`);
        this.addTradeBulletinNotice(`📢 ${p.name} rao bán [${item.icon} ${item.name}] giá ${price} Xu`);
        this.updateUI();
        this.syncMarketTransaction();
        if (fromMarketModal || !this.isMyTurn()) this.openMaritimeMarketModal();
        else if (this.currentPortTile) this.openTradePortModal(this.currentPortTile);
    }

    listResourceOnPlayerMarket(resType, price, fromMarketModal = false) {
        const p = this.getLocalPlayer() || this.getActivePlayer();
        if (!p) return;
        if (p[resType] < 1) {
            this.showToast("Bạn không có sẵn tài nguyên này trong khoang để đăng bán!");
            return;
        }
        p[resType] -= 1;

        const meta = {
            food: { name: "Lương Thực (Lúa Gạo)", icon: "🌾" },
            wood: { name: "Gỗ Đóng Tàu", icon: "🌲" },
            iron: { name: "Quặng Sắt & Đinh", icon: "⛏️" }
        }[resType];

        this.marketListings.unshift({
            id: Date.now() + Math.floor(Math.random() * 1000),
            sellerId: p.id,
            sellerName: p.name,
            itemType: "resource",
            resType: resType,
            name: meta.name,
            icon: meta.icon,
            price: Math.max(1, Math.min(15, price))
        });

        window.SFX.playClick();
        this.logEvent(`📢 ${p.name} đăng bán [1 ${meta.icon} ${meta.name}] lên Sàn Giao Thương với giá ${price} Xu (0 AP).`);
        this.addTradeBulletinNotice(`📢 ${p.name} rao bán [1 ${meta.icon} ${meta.name}] giá ${price} Xu`);
        this.updateUI();
        this.syncMarketTransaction();
        if (fromMarketModal || !this.isMyTurn()) this.openMaritimeMarketModal();
        else if (this.currentPortTile) this.openTradePortModal(this.currentPortTile);
    }

    buyMarketListing(listingId, insidePortModal = false, fromHudBulletin = false) {
        const buyer = this.getLocalPlayer() || this.getActivePlayer();
        if (!buyer) return;
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

        buyer.coins -= listing.price;

        if (listing.sellerId >= 0) {
            const seller = this.players.find(pl => pl.id === listing.sellerId);
            if (seller) {
                seller.coins = Math.min(15, seller.coins + listing.price);
                this.logEvent(`🤝 Giao dịch thành công (0 AP)! ${buyer.name} đã mua [${listing.icon} ${listing.name}] từ ${seller.name} với giá ${listing.price} Xu!`);
                this.addTradeBulletinNotice(`🤝 ${buyer.name} mua [${listing.icon} ${listing.name}] từ ${seller.name} (${listing.price} Xu)`);
            }
        } else {
            this.logEvent(`🛒 ${buyer.name} đã mua [${listing.icon} ${listing.name}] từ ${listing.sellerName} với giá ${listing.price} Xu (0 AP).`);
            this.addTradeBulletinNotice(`🛒 ${buyer.name} mua [${listing.icon} ${listing.name}] từ ${listing.sellerName} (${listing.price} Xu)`);
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
        this.showToast(`🛒 Đã mua [${listing.icon} ${listing.name}] (-${listing.price} Xu • 0 AP)!`);
        this.updateUI();
        this.syncMarketTransaction();

        if (!fromHudBulletin) {
            if (insidePortModal && this.currentPortTile && this.isMyTurn()) this.openTradePortModal(this.currentPortTile);
            else this.openMaritimeMarketModal();
        }
    }

    cancelMarketListing(listingId, insidePortModal = false, fromHudBulletin = false) {
        const p = this.getLocalPlayer() || this.getActivePlayer();
        if (!p) return;
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
        this.addTradeBulletinNotice(`↩️ ${p.name} thu hồi [${listing.icon} ${listing.name}] về tàu`);
        this.updateUI();
        this.syncMarketTransaction();
        if (!fromHudBulletin) {
            if (insidePortModal && this.currentPortTile && this.isMyTurn()) this.openTradePortModal(this.currentPortTile);
            else this.openMaritimeMarketModal();
        }
    }

    ensurePortApDeducted() {
        const p = this.getActivePlayer();
        if (!this.portApDeducted && p.ap >= 1) {
            this.spendInteractiveAP(p);
            this.portApDeducted = true;
        }
    }

    buySpecialtyAtPort(regionId = null) {
        if (!this.isMyTurn()) return;
        const p = this.getActivePlayer();
        if (p.coins < 1) {
            this.showToast("Không đủ Xu! Cần 1 Xu để mua Đặc sản vùng.");
            return;
        }
        if (this.getCargoCount(p) >= 8) {
            this.showToast("Khoang tàu đã đạt giới hạn 8 thẻ hàng!");
            return;
        }
        this.ensurePortApDeducted();
        const rId = regionId !== null ? regionId : (this.currentPortTile ? this.currentPortTile.regionId : 0);
        const reg = window.GAME_DATA.regions[rId] || window.GAME_DATA.regions[0];
        p.coins -= 1;
        p.specialties.push({
            regionId: reg.id,
            name: reg.specialty.shortName,
            icon: reg.specialty.icon
        });
        window.SFX.playCoin();
        this.logEvent(`📦 ${p.name} mua đặc sản [${reg.specialty.icon} ${reg.specialty.shortName}] tại ${reg.name} với giá 1 Xu.`);
        this.addTradeBulletinNotice(`📦 ${p.name} nhập [${reg.specialty.icon} ${reg.specialty.shortName}] tại ${reg.name} (1 Xu)`);
        this.updateUI();
        this.syncMultiplayerGameState();
        this.openTradePortModal(this.currentPortTile);
    }

    sellSpecialtyAtPort(specIndex, coinPrice = null) {
        if (!this.isMyTurn()) return;
        const p = this.getActivePlayer();
        const item = p.specialties[specIndex];
        if (!item) return;

        const portRegId = this.currentPortTile ? this.currentPortTile.regionId : 0;
        const dist = Math.abs(portRegId - item.regionId);
        // Rule: 1 region away = +1 Xu profit (sell for 2 Xu); 2+ regions away = +2 Xu profit (sell for 3 Xu)
        const finalPayout = coinPrice !== null ? coinPrice : (dist <= 1 ? 2 : 3);
        const netProfit = finalPayout - 1;

        this.ensurePortApDeducted();
        p.specialties.splice(specIndex, 1);
        p.coins = Math.min(15, p.coins + finalPayout);

        window.SFX.playCoin();
        this.world.triggerBurstAnimation(p.q, p.r, 0xd4af37, 22);
        this.logEvent(`💰 ${p.name} bán đặc sản [${item.icon} ${item.name}] (cách ${dist} vùng) thu về ${finalPayout} Xu (Lời +${netProfit} Xu)!`);
        this.addTradeBulletinNotice(`💰 ${p.name} bán [${item.icon} ${item.name}] thu ${finalPayout} Xu (Lời +${netProfit} Xu)`);
        this.updateUI();
        this.syncMultiplayerGameState();
        this.openTradePortModal(this.currentPortTile);
    }

    buyKeyAtPort(keyLevel, cost = null) {
        if (!this.isMyTurn()) return;
        const p = this.getActivePlayer();
        const actualCost = cost !== null ? cost : (keyLevel * 2);
        if ((p.keys[keyLevel] || 0) >= 1) {
            this.showToast(`⚠️ Trong kho chỉ có thể chứa tối đa 1 Chìa khóa mỗi loại (Key ${keyLevel} đã đầy 1/1)!`);
            return;
        }
        if (p.coins < actualCost) {
            this.showToast(`Không đủ Xu! Cần ${actualCost} Xu để mua Key ${keyLevel}.`);
            return;
        }
        if (this.getCargoCount(p) >= 8) {
            this.showToast("Khoang tàu đã đầy (8/8 thẻ)!");
            return;
        }
        this.ensurePortApDeducted();
        p.coins -= actualCost;
        p.keys[keyLevel] = 1;
        window.SFX.playCoin();
        this.logEvent(`🗝️ ${p.name} đã mua Key ${keyLevel} (1/1) tại cảng với giá ${actualCost} Xu.`);
        this.showToast(`🗝️ Đã mua Key ${keyLevel} (Tối đa 1/1)!`);
        this.updateUI();
        this.syncMultiplayerGameState();
        this.openTradePortModal(this.currentPortTile);
    }

    buyPortResourceBundle(resType, qty, cost) {
        if (!this.isMyTurn()) return;
        const p = this.getActivePlayer();
        if (p.coins < cost) {
            this.showToast(`Không đủ Xu! Cần ${cost} Xu.`);
            return;
        }
        const freeCargo = 8 - this.getCargoCount(p);
        if (freeCargo <= 0) {
            this.showToast("Khoang tàu đã đầy (8/8 thẻ)!");
            return;
        }
        const actualQty = Math.min(qty, freeCargo);
        this.ensurePortApDeducted();
        p.coins -= cost;
        p[resType] += actualQty;
        const labels = { food: "🌾 Lúa", wood: "🌲 Gỗ", iron: "⛏️ Sắt" };
        window.SFX.playCoin();
        this.logEvent(`🛒 ${p.name} mua +${actualQty} ${labels[resType]} tại cảng với giá ${cost} Xu.`);
        this.showToast(`🛒 Đã mua +${actualQty} ${labels[resType]} (-${cost} Xu)!`);
        this.updateUI();
        this.syncMultiplayerGameState();
        this.openTradePortModal(this.currentPortTile);
    }

    buySupplyAtPort(type, cost) {
        const defaultQty = type === "food" ? 2 : (type === "wood" ? 3 : 1);
        this.buyPortResourceBundle(type, defaultQty, cost);
    }

    buySerpentCoinAtPort() {
        if (!this.isMyTurn()) return;
        const p = this.getActivePlayer();
        if (p.hasSerpentCoin) {
            this.showToast("🐍 Bạn đang sở hữu Đồng Xu Mãng Xà trên tàu rồi!");
            return;
        }
        if (p.coins < 10) {
            this.showToast("Không đủ Xu! Cần 10 Xu để mua 🐍 Đồng Xu Mãng Xà.");
            return;
        }
        this.ensurePortApDeducted();
        p.coins -= 10;
        p.hasSerpentCoin = true;
        window.SFX.playRelicFanfare();
        this.world.triggerBurstAnimation(p.q, p.r, 0xec4899, 28);
        this.logEvent(`🐍 ${p.name} đã mua [Đồng Xu Mãng Xà] với giá 10 Xu! (Tự động hồi 2 HP khi máu về 0).`);
        this.showToast("🐍 Đã trang bị Đồng Xu Mãng Xà! Tự động hồi 2 HP nếu máu giảm về 0!");
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
        p.coins = Math.min(15, p.coins + reward);

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
                <span class="badge-tag">⏱️ Tự đóng <span id="quiz-autoclose-sec">10</span>s</span>
            </div>
            <h2 class="modal-title">${isCorrect ? 'Tấm Lòng Trung Thực & Uyên Bác (+3 Xu)!' : 'Khích Lệ Tinh Thần Hàng Hải (+2 Xu)!'}</h2>
            ${this.renderQuizVisualMemoryCard(shuffledQuiz, chosenIdx)}
            <p class="modal-desc" style="margin-top:10px; margin-bottom:4px">
                🌫️ <em>Tiên Ông Rìu Vàng đã ẩn mình vào làn sương và sẽ xuất hiện ngẫu nhiên ở một vùng biển khác sau 4–5 vòng nữa!</em>
            </p>
            <div class="modal-actions" style="justify-content:space-between">
                <span style="font-size:12px; color:#fbbf24; font-weight:700">⏳ Tự động đóng sau <span id="quiz-autoclose-sec-sub">10</span> giây...</span>
                <button class="btn-primary-gold" onclick="window.GAME.closeQuizResultNow()">✕ Đóng Ngay Lập Tức</button>
            </div>
        `;
        this.showModal(html);
        this.startQuizResultAutoCloseTimer(10);
        this.updateUI();
        this.syncMultiplayerGameState();
    }

    // ------------------------------------------------------------------------
    // VI. CONQUERING MONUMENTS + TRAP PENALTIES + TIER 1 VISIT LIMIT (MAX 1)
    // ------------------------------------------------------------------------
    openMonumentModal(tile) {
        const p = this.getActivePlayer();
        const mon = window.GAME_DATA.monuments.find(m => m.id === tile.monumentId);
        if (!mon) return;

        const tier = tile.monumentTier;
        const tierMeta = {
            1: {
                name: "CẤP 1 – DỄ (EASY)",
                keyReq: "1 🗝️ Key 1",
                foodCost: 1,
                ironCost: 0,
                coinCost: 2,
                rewardCoins: 3,
                trapDesc: "🏹 Bẫy Mũi Tên (-1 HP nếu trả lời sai)",
                color: "#3f7a58"
            },
            2: {
                name: "CẤP 2 – TRUNG BÌNH (MEDIUM)",
                keyReq: "1 🗝️ Key 2",
                foodCost: 2,
                ironCost: 0,
                coinCost: 3,
                rewardCoins: 4,
                trapDesc: "🪨 Bẫy Đá Lăn (-2 HP nếu trả lời sai)",
                color: "#b8862d"
            },
            3: {
                name: "CẤP 3 – KHÓ (HARD)",
                keyReq: "1 🗝️ Key 3",
                foodCost: 3,
                ironCost: 1,
                coinCost: 6,
                rewardCoins: 5,
                trapDesc: "⚡🪨 Bẫy Sét Đánh & Đá Lăn (-3 HP & đẩy lùi nếu trả lời sai)",
                color: "#a8423f"
            }
        }[tier];

        const alreadyConqueredByPlayer = p ? p.relics.some(r => r.id === mon.id) : false;
        const tier1LimitReached = Boolean(tier === 1 && p && (p.tier1Visited || 0) >= 1 && !alreadyConqueredByPlayer);
        const hasMatchingKey = p ? ((p.keys[tier] || 0) > 0) : false;
        const hasDockingFee = p ? ((p.food >= tierMeta.foodCost) && (p.iron >= tierMeta.ironCost) && (p.coins >= tierMeta.coinCost)) : false;
        const isPlayerAtMonument = p ? (p.q === tile.q && p.r === tile.r) : false;
        const canChallenge = this.isGameStarted && this.isMyTurn() && isPlayerAtMonument && !tile.monumentLocked && !alreadyConqueredByPlayer && !tier1LimitReached && hasMatchingKey && hasDockingFee && this.canSpendInteractiveAP(p);

        let statusNotice = "";
        if (!this.isGameStarted) {
            statusNotice = `<div class="alert-banner warning">ℹ️ Bạn đang xem hồ sơ Di tích từ Cẩm Nang. Hãy bắt đầu ván đấu để lái tàu tới chinh phục Bảo Vật!</div>`;
        } else if (!this.isMyTurn()) {
            statusNotice = `<div class="alert-banner warning">👁️ Bạn đang xem hồ sơ Di tích trong lượt của <strong>${p ? p.name : ''}</strong>. Khi tới lượt của mình, hãy lái thuyền đến đây để mở cổng!</div>`;
        } else if (tile.monumentLocked) {
            statusNotice = `<div class="alert-banner danger">🔒 Di tích Cấp Khó này đã được chinh phục và KHÓA VĨNH VIỄN trong ván đấu này!</div>`;
        } else if (alreadyConqueredByPlayer) {
            statusNotice = `<div class="alert-banner success">👑 Bạn đã sở hữu Bảo Vật Hoàng Gia [${mon.relicIcon} ${mon.relicName}] từ Di tích này!</div>`;
        } else if (tier1LimitReached) {
            statusNotice = `<div class="alert-banner danger">⛔ <strong>Giới hạn Di tích Cấp 1 (Easy):</strong> Mỗi người chơi chỉ được vào Di tích Cấp 1 tối đa <strong>1 lần</strong> trong ván đấu (Bạn đã vào ${p.tier1Visited}/1 lần). Hãy chinh phục Di tích Cấp 2 hoặc Cấp 3!</div>`;
        } else if (!isPlayerAtMonument) {
            statusNotice = `<div class="alert-banner warning">⛵ Hãy điều khiển thuyền của bạn cập bến ô lục giác của <strong>${mon.name}</strong> để mở cổng chinh phục Bảo Vật!</div>`;
        } else if (!hasMatchingKey || !hasDockingFee) {
            statusNotice = `
                <div class="alert-banner warning">
                    ⚠️ <strong>Điều kiện Mở Cổng &amp; Phí Cập Bến (${tierMeta.name}):</strong><br/>
                    • Chìa khóa yêu cầu: <strong>${tierMeta.keyReq}</strong> (Đang có: Key ${tier}: ${p.keys[tier] || 0}/1)<br/>
                    • Phí cập bến: <strong>${tierMeta.foodCost} Lương thực ${tierMeta.ironCost ? `+ ${tierMeta.ironCost} Sắt ` : ''}+ ${tierMeta.coinCost} Xu</strong>
                    (Hiện có: ${p.food} Lương thực, ${p.iron} Sắt, ${p.coins} Xu)<br/>
                    • Cơ chế phòng vệ cổ đại: <strong>${tierMeta.trapDesc}</strong>
                </div>
            `;
        } else {
            statusNotice = `
                <div class="alert-banner success">
                    ✅ <strong>Đủ điều kiện mở cổng (${tierMeta.name}):</strong> Phí <strong>${tierMeta.foodCost} Lúa ${tierMeta.ironCost ? `+ ${tierMeta.ironCost} Sắt ` : ''}+ ${tierMeta.coinCost} Xu + 1 Key ${tier}</strong> • ⚠️ Cẩn trọng: <strong>${tierMeta.trapDesc}</strong>
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
                                "Di tích ${mon.name} trong ván này có độ khó <strong>${tierMeta.name}</strong> (${tierMeta.trapDesc}). Hãy đọc kỹ hồ sơ Địa lý chính thống dưới đây trước khi bước vào khảo nghiệm!"
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

        if (tier === 1 && (p.tier1Visited || 0) >= 1) {
            this.showToast("⛔ Mỗi người chơi chỉ được vào Di tích Cấp 1 (Easy) tối đa 1 lần!");
            return;
        }

        const tierMeta = {
            1: { foodCost: 1, ironCost: 0, coinCost: 2, rewardCoins: 3, trapName: "🏹 Bẫy Mũi Tên (-1 HP)" },
            2: { foodCost: 2, ironCost: 0, coinCost: 3, rewardCoins: 4, trapName: "🪨 Bẫy Đá Lăn (-2 HP)" },
            3: { foodCost: 3, ironCost: 1, coinCost: 6, rewardCoins: 5, trapName: "⚡🪨 Bẫy Sét Đánh & Đá Lăn (-3 HP)" }
        }[tier];

        this.spendInteractiveAP(p);
        p.keys[tier] = Math.max(0, (p.keys[tier] || 0) - 1);
        p.food -= tierMeta.foodCost;
        p.iron -= tierMeta.ironCost;
        p.coins -= tierMeta.coinCost;
        if (tier === 1) {
            p.tier1Visited = (p.tier1Visited || 0) + 1;
        }
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
                Trả lời chính xác câu hỏi Cấp ${tier} để nhận ngay <strong>+${tierMeta.rewardCoins} Xu Vàng</strong> và <strong>1 BẢO VẬT HOÀNG GIA (${mon.relicIcon} ${mon.relicName})</strong>!<br/>
                <span style="color:#fca5a5; font-weight:700">⚠️ CẢNH BÁO CƠ QUAN PHÒNG VỆ DI TÍCH (${tierMeta.trapName}):</span> Nếu trả lời SAI, cơ quan bẫy cổ đại sẽ kích hoạt khiến thuyền mất <strong>-${tier} HP</strong>!
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
                : `💥 ${p.name} Kích Hoạt Bẫy Cổ Đại Tại ${mon.name} (-${tier} HP)`;
        }

        if (isCorrect) {
            p.coins = Math.min(15, p.coins + tierMeta.rewardCoins);
            p.relics.push({ id: mon.id, name: mon.relicName, icon: mon.relicIcon, monumentName: mon.name });

            if (tier === 3) {
                tile.monumentLocked = true;
            }

            window.SFX.playRelicFanfare();
            this.world.triggerBurstAnimation(tile.q, tile.r, 0xd4af37, 36);
            this.logEvent(`👑 CHIẾN CÔNG LỊCH SỬ! ${p.name} đã chinh phục [${mon.name} - Cấp ${tier}], thu thập Bảo Vật [${mon.relicIcon} ${mon.relicName}] (${p.relics.length}/3) và +${tierMeta.rewardCoins} Xu!`);

            if (p.relics.length >= 3) {
                this.matchWinner = p;
                this.updateUI();
                this.syncMultiplayerGameState();
                this.showVictoryScreen(p, quiz, chosenIdx);
                return;
            }

            const html = `
                <div class="modal-header-badge" style="background:#2e6f4033; border-color:#4b9b68">
                    <span>👑 CHINH PHỤC DI TÍCH THÀNH CÔNG! (${p.relics.length}/3 BẢO VẬT HOÀNG GIA)</span>
                    <span class="badge-tag">⏱️ Tự đóng <span id="quiz-autoclose-sec">10</span>s</span>
                </div>
                <h2 class="modal-title">Nhận Bảo Vật: ${mon.relicIcon} ${mon.relicName} &amp; +${tierMeta.rewardCoins} Xu!</h2>
                ${this.renderQuizVisualMemoryCard(quiz, chosenIdx)}
                <div class="modal-actions" style="justify-content:space-between">
                    <span style="font-size:12px; color:#fbbf24; font-weight:700">⏳ Tự động đóng sau <span id="quiz-autoclose-sec-sub">10</span> giây...</span>
                    <button class="btn-primary-gold" onclick="window.GAME.closeQuizResultNow()">✕ Đóng Ngay Lập Tức</button>
                </div>
            `;
            this.showModal(html);
            this.startQuizResultAutoCloseTimer(10);
        } else {
            // Trigger 3D Monument Trap Animation (Tier 1: Arrow Volley, Tier 2: Rolling Boulders, Tier 3: Lightning + Boulders)
            this.world.triggerMonumentTrapEffect(tile.q, tile.r, tier);

            const trapLabels = {
                1: "🏹 Bẫy Mũi Tên Cổ Đại (Di tích Cấp 1 - Easy)",
                2: "🪨 Bẫy Đá Lăn Sườn Núi (Di tích Cấp 2 - Medium)",
                3: "⚡🪨 Bẫy Sét Đánh & Đá Lăn (Di tích Cấp 3 - Hard)"
            };
            const trapName = trapLabels[tier] || "Bẫy Di Tích";

            this.applyPlayerDamage(p, tier, `${trapName} tại ${mon.name}`);
            if (tier === 3 && !p.eliminated) {
                this.pushShipBack(p);
            }

            const penaltyDesc = `💥 <strong>${trapName} đã kích hoạt!</strong> Thuyền của bạn chịu phạt <strong>-${tier} ❤️ HP</strong> (Hiện còn ${p.hp}/${p.maxHp} HP)${tier === 3 ? ' và bị sóng xung kích đẩy lùi ra biển' : ''}!`;

            const html = `
                <div class="modal-header-badge" style="background:#8c2d2d33; border-color:#c95b5b">
                    <span>💥 CƠ QUAN BẪY DI TÍCH KÍCH HOẠT (-${tier} HP) — XEM ĐÁP ÁN ĐÚNG</span>
                    <span class="badge-tag">⏱️ Tự đóng <span id="quiz-autoclose-sec">10</span>s</span>
                </div>
                <h2 class="modal-title">Ghi Nhớ Kiến Thức Địa Lý Tại ${mon.name}</h2>
                <p class="modal-desc">${penaltyDesc}</p>
                ${this.renderQuizVisualMemoryCard(quiz, chosenIdx)}
                <div class="modal-actions" style="justify-content:space-between">
                    <span style="font-size:12px; color:#fbbf24; font-weight:700">⏳ Tự động đóng sau <span id="quiz-autoclose-sec-sub">10</span> giây...</span>
                    <button class="btn-primary-gold" onclick="window.GAME.closeQuizResultNow()">✕ Đóng Ngay Lập Tức</button>
                </div>
            `;
            this.showModal(html);
            this.startQuizResultAutoCloseTimer(10);
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
    // VII. IN-GAME CLOCK, PHASED WEATHER TIMELINE, GIÔNG BÃO READING & YAGI QUIZ
    // ------------------------------------------------------------------------
    startMatchClockAndWeatherEngine() {
        clearInterval(this.matchClockInterval);
        this.updateClockAndTickerUI();
        this.matchClockInterval = setInterval(() => {
            this.tickMatchClockAndWeather();
        }, 1000);
    }

    getWeatherPhaseMeta(phaseKey) {
        const map = {
            sunny: {
                key: "sunny",
                label: "☀️ Nắng Biển Đông",
                timeRange: "00:00–15:00",
                effectText: "Biển êm (1 AP = 2 ô • Tối đa 6 ô/lượt)",
                nextLabel: "🌧️ Mưa Nhiệt Đới lúc 15:00"
            },
            tropical_rain: {
                key: "tropical_rain",
                label: "🌧️ Mưa Nhiệt Đới",
                timeRange: "15:00–20:00",
                effectText: "Mưa rào cảnh báo trước Giông Bão (1 AP = 2 ô)",
                nextLabel: "⛈️ Giông Bão lúc 20:00"
            },
            thunderstorm: {
                key: "thunderstorm",
                label: "⛈️ Giông Bão",
                timeRange: "20:00–27:00",
                effectText: "Đọc hiểu 1p30s (Sai/Hết giờ -2 HP) • Cấm vào 4 ô tài nguyên!",
                nextLabel: "🌅 Hoàng Hôn lúc 27:00"
            },
            sunset: {
                key: "sunset",
                label: "🌅 Hoàng Hôn",
                timeRange: "27:00–29:00",
                effectText: "Khai thác dễ dàng hơn: Giảm 1 vòng hồi tài nguyên!",
                nextLabel: "🌌 Đêm Sao lúc 29:00"
            },
            night: {
                key: "night",
                label: "🌌 Đêm Sao",
                timeRange: "29:00–34:00",
                effectText: "Đêm thuận lợi: Giảm 1 vòng hồi tài nguyên!",
                nextLabel: "🌀 Siêu Bão Yagi lúc 34:00"
            },
            super_typhoon_yagi: {
                key: "super_typhoon_yagi",
                label: "🌀 Siêu Bão Yagi",
                timeRange: "34:00–45:00",
                effectText: "BÁO ĐỘNG ĐỎ: 1 AP = 1 ô • Hết 4 AP hỏi Quiz (Đúng +1 Xu, Sai sét đánh -1/-2/-3 HP)!",
                nextLabel: "🏁 Cuối trận (45:00)"
            }
        };
        return map[phaseKey] || map.sunny;
    }

    computePhaseKeyFromElapsed(sec) {
        if (sec < 900) return "sunny";               // 00:00 - 15:00
        if (sec < 1200) return "tropical_rain";      // 15:00 - 20:00
        if (sec < 1620) return "thunderstorm";       // 20:00 - 27:00 (7 mins)
        if (sec < 1740) return "sunset";             // 27:00 - 29:00 (2 mins)
        if (sec < 2040) return "night";              // 29:00 - 34:00 (5 mins)
        return "super_typhoon_yagi";                 // 34:00 - 45:00 (11 mins)
    }

    tickMatchClockAndWeather() {
        if (!this.isGameStarted || this.matchWinner) return;

        this.matchElapsedSec = (this.matchElapsedSec || 0) + 1;
        this.portResetRemainingSec = Math.max(0, (this.portResetRemainingSec || this.portResetIntervalSec) - 1);

        if (this.portResetRemainingSec <= 0) {
            this.portResetRemainingSec = this.portResetIntervalSec;
            if (!this.roomState.code || this.roomState.isHost) {
                this.resetAllPortInventories(true);
                this.syncMultiplayerGameState();
            }
        }

        const expectedPhase = this.computePhaseKeyFromElapsed(this.matchElapsedSec);
        if (expectedPhase !== this.currentWeatherPhase) {
            this.applyWeatherPhase(expectedPhase, true);
        }

        this.updateClockAndTickerUI();
    }

    applyWeatherPhase(phaseKey, notify = true) {
        this.currentWeatherPhase = phaseKey;
        this.world.setWeatherMode(phaseKey);

        const yagiBanner = document.getElementById("yagi-red-alert-banner");
        if (yagiBanner) {
            if (phaseKey === "super_typhoon_yagi") {
                yagiBanner.classList.remove("hidden");
            } else {
                yagiBanner.classList.add("hidden");
            }
        }

        // Clear all storm restrictions first
        this.world.hexTiles.forEach(t => {
            t.stormRestricted = false;
        });

        // During Thunderstorm (Giông Bão), restrict 4 resource extraction nodes
        if (phaseKey === "thunderstorm") {
            const resTiles = this.world.hexTiles.filter(t =>
                t.resourceType &&
                !this.players.some(pl => !pl.eliminated && pl.q === t.q && pl.r === t.r)
            );
            for (let i = 0; i < Math.min(4, resTiles.length); i++) {
                const pickIdx = (i * 3) % resTiles.length;
                resTiles[pickIdx].stormRestricted = true;
            }
        }

        this.world.updateResourceVisuals();
        this.refreshReachableHexes();

        const meta = this.getWeatherPhaseMeta(phaseKey);
        if (notify) {
            this.logEvent(`🌦️ [THỜI TIẾT CHUYỂN PHA] ${meta.label} (${meta.timeRange}): ${meta.effectText}`);
            this.addTradeBulletinNotice(`🌦️ Thời tiết chuyển sang ${meta.label}: ${meta.effectText}`);
            this.showToast(`🌦️ Thời tiết biển chuyển sang: ${meta.label} — ${meta.effectText}`);
        }

        if (phaseKey === "thunderstorm" && !this.thunderstormChallengeTriggered) {
            this.thunderstormChallengeTriggered = true;
            this.triggerThunderstormReadingChallenge();
        }

        this.updateClockAndTickerUI();
    }

    formatMMSS(totalSeconds) {
        const s = Math.max(0, Math.floor(totalSeconds));
        const mm = String(Math.floor(s / 60)).padStart(2, "0");
        const ss = String(s % 60).padStart(2, "0");
        return `${mm}:${ss}`;
    }

    updateClockAndTickerUI() {
        const clockTimeEl = document.getElementById("hud-clock-time");
        const weatherPhaseEl = document.getElementById("hud-weather-phase");
        const portResetMiniEl = document.getElementById("hud-port-reset-mini");

        const meta = this.getWeatherPhaseMeta(this.currentWeatherPhase);
        const clockStr = this.formatMMSS(this.matchElapsedSec || 0);
        const portResetStr = this.formatMMSS(this.portResetRemainingSec || 0);

        if (clockTimeEl) clockTimeEl.textContent = `⏱️ ${clockStr}`;
        if (weatherPhaseEl) weatherPhaseEl.textContent = meta.label;
        if (portResetMiniEl) portResetMiniEl.textContent = `⚓ Reset: ${portResetStr}`;

        const tickerTrack = document.getElementById("live-ticker-track");
        if (tickerTrack) {
            const portKeySummary = [0, 1, 2, 3, 4, 5].map(rId => {
                const inv = this.getPortInventory(rId);
                const pName = String(inv.portName || `Cảng ${rId + 1}`).replace("Thương Cảng ", "");
                return `${pName}: Key ${inv.availableKeyTier}`;
            }).join(" • ");

            const latestTrade = (this.tradeBulletinNotices && this.tradeBulletinNotices[0])
                ? this.tradeBulletinNotices[0].text
                : "Giao thương tự do giữa các thuyền trưởng (0 AP)";

            const tickerMsg = `⏱️ Giờ biển: ${clockStr}/45:00 — Đang ở pha [${meta.label}]: ${meta.effectText} &nbsp;|&nbsp; ⏭️ Sắp tới: ${meta.nextLabel} &nbsp;|&nbsp; 🔄 Làm mới 6 Cảng sau ${portResetStr} (${portKeySummary}) &nbsp;|&nbsp; 📢 ${latestTrade}`;
            if (this._lastTickerSnapshot !== tickerMsg) {
                this._lastTickerSnapshot = tickerMsg;
                tickerTrack.innerHTML = `<span class="ticker-item">${tickerMsg}</span><span class="ticker-item">${tickerMsg}</span>`;
            }
        }
    }

    toggleLiveTicker() {
        window.SFX.playClick();
        const wrap = document.getElementById("bottom-live-ticker-wrap");
        if (!wrap) return;
        this.tickerCollapsed = !this.tickerCollapsed;
        wrap.classList.toggle("collapsed", this.tickerCollapsed);
    }

    // ------------------------------------------------------------------------
    // THUNDERSTORM (⛈️ GIÔNG BÃO) SHARED READING PASSAGE + 1M30S TIMER (-2 HP)
    // ------------------------------------------------------------------------
    triggerThunderstormReadingChallenge() {
        if (!this.isGameStarted || this.matchWinner) return;
        const passages = window.GAME_DATA.stormReadingPassages || [];
        if (passages.length === 0) return;

        const passage = passages[Math.floor(Math.random() * passages.length)];
        const localP = this.getLocalPlayer() || this.getActivePlayer() || this.players[0];
        const qIdx = (localP ? localP.id : 0) % passage.questions.length;
        const rawQ = passage.questions[qIdx];
        const shuffledQuiz = this.prepareShuffledQuiz({
            ...rawQ,
            visualImg: "assets/monuments/halong.jpg",
            visualCaption: passage.title,
            visualCredit: passage.source
        });

        this.pendingStormReading = {
            passage,
            shuffledQuiz,
            targetPlayer: localP,
            answered: false
        };

        clearInterval(this.stormReadingTimerInterval);
        let remainingSec = 90; // 1 minute 30 seconds

        const html = `
            <div class="modal-header-badge" style="background:rgba(185,28,28,0.28); border-color:#f87171">
                <span>⛈️ THỬ THÁCH ĐỌC HIỂU GIÔNG BÃO TOÀN BẢN ĐỒ (4 Ô TÀI NGUYÊN ĐANG BỊ PHONG TỎA)</span>
                <span id="storm-reading-timer" class="speed-timer-pill">⏱️ 01:30</span>
            </div>
            <h2 class="modal-title">${passage.title}</h2>
            <p class="modal-desc">
                ⛈️ <strong>Giông Bão đang đổ bộ trên toàn vùng biển!</strong> Toàn bộ người chơi cùng đọc văn bản Địa lý dưới đây, nhưng <strong>mỗi thuyền trưởng nhận 1 câu hỏi riêng biệt</strong> trong thời gian <strong>1 phút 30 giây</strong>. Nếu trả lời <strong>SAI hoặc HẾT GIỜ</strong>, thuyền sẽ bị <strong>Sét Đánh (-2 ❤️ HP)</strong>!
            </p>
            <div class="storm-passage-box">
                <div class="storm-passage-title">📖 Tư Liệu Đọc Hiểu Chung Toàn Bản Đồ:</div>
                <div>${passage.passage}</div>
                <div style="font-size:11px; color:#94a3b8; margin-top:6px">📚 Nguồn trích dẫn: ${passage.source}</div>
            </div>
            <div class="quiz-box">
                <div class="quiz-question">❓ Câu hỏi dành riêng cho thuyền ${localP ? localP.name : 'của bạn'}: ${shuffledQuiz.q}</div>
                <div class="quiz-options">
                    ${shuffledQuiz.options.map((opt, idx) => `
                        <button class="quiz-opt-btn" onclick="window.GAME.resolveThunderstormReadingQuiz(${idx}, false)">
                            <span class="opt-letter">${String.fromCharCode(65 + idx)}</span>
                            <span>${opt}</span>
                        </button>
                    `).join("")}
                </div>
            </div>
        `;
        this.showModal(html);

        this.stormReadingTimerInterval = setInterval(() => {
            if (!this.pendingStormReading || this.pendingStormReading.answered) {
                clearInterval(this.stormReadingTimerInterval);
                return;
            }
            remainingSec -= 1;
            const timerEl = document.getElementById("storm-reading-timer");
            if (timerEl) {
                timerEl.textContent = `⏱️ ${this.formatMMSS(remainingSec)}`;
            }
            if (remainingSec <= 0) {
                clearInterval(this.stormReadingTimerInterval);
                this.resolveThunderstormReadingQuiz(-1, true);
            }
        }, 1000);
    }

    resolveThunderstormReadingQuiz(chosenIdx, isTimeout = false) {
        clearInterval(this.stormReadingTimerInterval);
        const ctx = this.pendingStormReading;
        if (!ctx || ctx.answered) return;
        ctx.answered = true;

        const { shuffledQuiz, targetPlayer } = ctx;
        const p = targetPlayer || this.getLocalPlayer() || this.getActivePlayer();
        const isCorrect = !isTimeout && (chosenIdx === shuffledQuiz.correct);

        if (isCorrect) {
            window.SFX.playCoin();
            if (p) this.world.triggerBurstAnimation(p.q, p.r, 0x38bdf8, 22);
            this.logEvent(`⛈️ ${p ? p.name : 'Thuyền trưởng'} vượt qua bài Đọc Hiểu Giông Bão an toàn!`);
        } else {
            if (p) {
                this.world.triggerLightningStrikeEffect(p.q, p.r);
                this.applyPlayerDamage(p, 2, isTimeout ? "Hết giờ (1p30s) đọc hiểu Giông Bão ⛈️" : "Trả lời sai đọc hiểu Giông Bão ⛈️");
            }
        }

        const html = `
            <div class="modal-header-badge" style="background:${isCorrect ? '#2e6f4033' : '#8c2d2d33'}; border-color:${isCorrect ? '#4b9b68' : '#c95b5b'}">
                <span>${isCorrect ? '✅ VƯỢT QUA GIÔNG BÃO AN TOÀN!' : '⚡ SÉT ĐÁNH GIÔNG BÃO (-2 HP)!'}</span>
                <span class="badge-tag">⏱️ Tự đóng <span id="quiz-autoclose-sec">10</span>s</span>
            </div>
            <h2 class="modal-title">
                ${isCorrect
                    ? 'Chính Xác! Thuyền Của Bạn Vững Vàng Vượt Qua Cơn Giông!'
                    : (isTimeout ? 'Hết Thời Gian 1 Phút 30 Giây — Sét Đánh Trúng Thuyền (-2 HP)!' : 'Chưa Chính Xác — Sét Đánh Trúng Thuyền (-2 HP)!')}
            </h2>
            ${this.renderQuizVisualMemoryCard(shuffledQuiz, isTimeout ? -1 : chosenIdx)}
            <div class="modal-actions" style="justify-content:space-between">
                <span style="font-size:12px; color:#fbbf24; font-weight:700">⏳ Tự động đóng sau <span id="quiz-autoclose-sec-sub">10</span> giây...</span>
                <button class="btn-primary-gold" onclick="window.GAME.closeQuizResultNow()">✕ Đóng Ngay Lập Tức</button>
            </div>
        `;
        this.showModal(html);
        this.startQuizResultAutoCloseTimer(10);
        this.updateUI();
        this.syncMultiplayerGameState();
    }

    // ------------------------------------------------------------------------
    // SUPER TYPHOON YAGI (🌀 SIÊU BÃO YAGI) MANDATORY QUIZ AFTER 4 AP SPENT
    // - Correct: +1 Coin (max 15)
    // - Wrong: Stacking Lightning Strike (-1 HP -> -2 HP -> -3 HP max)
    // ------------------------------------------------------------------------
    triggerYagiTurnQuiz(player) {
        if (!player || player.yagiQuizTriggeredThisTurn) return;
        player.yagiQuizTriggeredThisTurn = true;

        const rawQuiz = this.pickRandomOpeningSpeedQuiz();
        this.pendingYagiQuiz = { player, quiz: rawQuiz };
        const nextWrongDmg = Math.min(3, (player.yagiWrongCount || 0) + 1);

        const html = `
            <div class="modal-header-badge" style="background:rgba(220,38,38,0.32); border-color:#ef4444">
                <span>🌀 KHẢO NGHIỆM SINH TỒN SIÊU BÃO YAGI (SAU KHI DÙNG 4 AP)</span>
                <span class="badge-tag">Đúng +1 Xu • Sai Sét Đánh -${nextWrongDmg} HP</span>
            </div>
            <h2 class="modal-title">🚨 Thử Thách Vượt Tâm Bão Yagi Của ${player.name}</h2>
            <p class="modal-desc">
                Bạn đã sử dụng 4 AP trong lượt dưới sức gió của <strong>Siêu Bão Yagi</strong>!
                Trả lời <strong>ĐÚNG</strong> để nhận thưởng <strong>+1 💰 Xu</strong>.
                Nếu trả lời <strong>SAI</strong>, thuyền sẽ bị <strong>Sét Đánh -${nextWrongDmg} ❤️ HP</strong> (Lần sai 1: -1 HP, Lần 2: -2 HP, Lần 3+: tối đa -3 HP)!
            </p>
            <div class="quiz-box">
                <div class="quiz-question">❓ ${rawQuiz.q}</div>
                <div class="quiz-options">
                    ${rawQuiz.options.map((opt, idx) => `
                        <button class="quiz-opt-btn" onclick="window.GAME.resolveYagiTurnQuiz(${idx})">
                            <span class="opt-letter">${String.fromCharCode(65 + idx)}</span>
                            <span>${opt}</span>
                        </button>
                    `).join("")}
                </div>
            </div>
        `;
        this.showModal(html);
    }

    resolveYagiTurnQuiz(chosenIdx) {
        const ctx = this.pendingYagiQuiz;
        if (!ctx) return;
        const { player, quiz } = ctx;
        this.pendingYagiQuiz = null;

        const isCorrect = (chosenIdx === quiz.correct);
        let outcomeBanner = "";

        if (isCorrect) {
            player.coins = Math.min(15, player.coins + 1);
            window.SFX.playCoin();
            this.world.triggerBurstAnimation(player.q, player.r, 0xfbbf24, 24);
            this.logEvent(`🌀 ${player.name} trả lời ĐÚNG câu hỏi Siêu Bão Yagi → Thưởng +1 Xu (${player.coins}/15 Xu)!`);
            outcomeBanner = `✅ Chúc mừng! Bạn trả lời chính xác và nhận được <strong>+1 💰 Xu</strong> giữa tâm bão Yagi!`;
        } else {
            player.yagiWrongCount = (player.yagiWrongCount || 0) + 1;
            const dmg = Math.min(3, player.yagiWrongCount);
            this.world.triggerLightningStrikeEffect(player.q, player.r);
            this.applyPlayerDamage(player, dmg, `Sét đánh Siêu Bão Yagi (Lần sai thứ ${player.yagiWrongCount})`);
            outcomeBanner = `⚡ <strong>SÉT ĐÁNH TÂM BÃO YAGI (Lần sai thứ ${player.yagiWrongCount})!</strong> Thuyền của bạn bị phạt <strong>-${dmg} ❤️ HP</strong> (Còn ${player.hp}/${player.maxHp} HP)!`;
        }

        const html = `
            <div class="modal-header-badge" style="background:${isCorrect ? '#2e6f4033' : '#8c2d2d33'}; border-color:${isCorrect ? '#4b9b68' : '#c95b5b'}">
                <span>${isCorrect ? '🌀 VƯỢT TÂM BÃO YAGI THÀNH CÔNG (+1 XU)' : '⚡ SÉT ĐÁNH TÂM BÃO YAGI'}</span>
                <span class="badge-tag">⏱️ Tự đóng <span id="quiz-autoclose-sec">10</span>s</span>
            </div>
            <h2 class="modal-title">${isCorrect ? 'Bản Lĩnh Thuyền Trưởng Giữa Siêu Bão (+1 Xu)!' : 'Sét Đánh Trúng Cột Buồm Giữa Siêu Bão!'}</h2>
            <p class="modal-desc">${outcomeBanner}</p>
            ${this.renderQuizVisualMemoryCard(quiz, chosenIdx)}
            <div class="modal-actions" style="justify-content:space-between">
                <span style="font-size:12px; color:#fbbf24; font-weight:700">⏳ Tự động đóng sau <span id="quiz-autoclose-sec-sub">10</span> giây...</span>
                <button class="btn-primary-gold" onclick="window.GAME.closeQuizResultNow()">✕ Đóng Ngay Lập Tức</button>
            </div>
        `;
        this.showModal(html);
        this.startQuizResultAutoCloseTimer(10);
        this.updateUI();
        this.syncMultiplayerGameState();
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
            this.matchWinner = p;
            this.syncMultiplayerGameState();
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

        const maxSteps = this.getRemainingHexSteps(ai);
        const reachableMap = this.computeNavigablePaths(ai.q, ai.r, maxSteps);
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
            const reefCount = (cand.path || []).filter(step => step.isReef).length;
            score -= reefCount * 18;

            if (t.monumentId && !t.monumentLocked && !ai.relics.some(r => r.id === t.monumentId)) {
                const tier = t.monumentTier;
                const tier1Blocked = (tier === 1 && (ai.tier1Visited || 0) >= 1);
                const hasKey = (ai.keys[tier] || 0) > 0;
                const feeCoins = tier === 1 ? 2 : (tier === 2 ? 3 : 6);
                const feeFood = tier;
                const feeIron = tier === 3 ? 1 : 0;
                if (!tier1Blocked && hasKey && ai.coins >= feeCoins && ai.food >= feeFood && ai.iron >= feeIron) {
                    score += 130;
                } else if (!tier1Blocked) {
                    score += 10;
                }
            }

            if (t.isPort) {
                if (ai.specialties.some(s => Math.abs(s.regionId - t.regionId) >= 1)) {
                    score += 65;
                } else if (ai.coins >= 1 && this.getCargoCount(ai) < 7) {
                    score += 32;
                }
            }

            if (t.resourceType && t.resourceCooldown === 0 && !t.stormRestricted && this.getCargoCount(ai) < 7) {
                score += 28;
            }

            if (t.hasNPC && ai.coins < 14) {
                score += 45;
            }

            if (score > bestScore) {
                bestScore = score;
                bestChoice = cand;
            }
        });

        const afterMove = () => {
            const destTile = this.getCurrentTile(ai);
            if (ai.ap >= 1 && destTile && !ai.eliminated) {
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
            const tier1Blocked = (tier === 1 && (ai.tier1Visited || 0) >= 1);
            const hasKey = (ai.keys[tier] || 0) > 0;
            const feeCoins = tier === 1 ? 2 : (tier === 2 ? 3 : 6);
            const feeFood = tier;
            const feeIron = tier === 3 ? 1 : 0;

            if (!tier1Blocked && hasKey && ai.coins >= feeCoins && ai.food >= feeFood && ai.iron >= feeIron) {
                this.spendInteractiveAP(ai);
                ai.keys[tier] = Math.max(0, (ai.keys[tier] || 0) - 1);
                ai.coins -= feeCoins;
                ai.food -= feeFood;
                ai.iron -= feeIron;
                if (tier === 1) ai.tier1Visited = (ai.tier1Visited || 0) + 1;

                const mon = window.GAME_DATA.monuments.find(m => m.id === tile.monumentId);
                const rewardCoins = tier === 1 ? 3 : (tier === 2 ? 4 : 5);
                ai.coins = Math.min(15, ai.coins + rewardCoins);
                ai.relics.push({ id: mon.id, name: mon.relicName, icon: mon.relicIcon, monumentName: mon.name });
                if (tier === 3) tile.monumentLocked = true;

                window.SFX.playRelicFanfare();
                this.world.triggerBurstAnimation(tile.q, tile.r, 0xd4af37, 30);
                this.logEvent(`🤖 [AI] ${ai.name} đã giải đố thành công tại [${mon.name}] và nhận Bảo Vật [${mon.relicIcon} ${mon.relicName}] (${ai.relics.length}/3)!`);

                if (ai.relics.length >= 3) {
                    this.matchWinner = ai;
                    this.syncMultiplayerGameState();
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
                    const gain = dist === 1 ? 2 : 3;
                    ai.coins = Math.min(15, ai.coins + gain);
                    this.logEvent(`🤖 [AI] ${ai.name} bán đặc sản [${sp.icon} ${sp.name}] tại ${tile.portName} thu về +${gain} Xu!`);
                    this.addTradeBulletinNotice(`💰 ${ai.name} bán [${sp.icon} ${sp.name}] tại ${tile.portName} (+${gain} Xu)`);
                }
            }

            const portInv = this.getPortInventory(tile.regionId);
            const kTier = portInv.availableKeyTier;
            if (portInv.keyStock > 0 && (ai.keys[kTier] || 0) === 0 && ai.coins >= portInv.keyPrice && this.getCargoCount(ai) < 8) {
                ai.coins -= portInv.keyPrice;
                ai.keys[kTier] = 1;
                portInv.keyStock = 0;
                this.logEvent(`🤖 [AI] ${ai.name} mua Key ${kTier} tại ${tile.portName}.`);
            } else if (ai.coins >= 1 && this.getCargoCount(ai) < 7 && portInv.specialtyStock > 0) {
                ai.coins -= 1;
                portInv.specialtyStock -= 1;
                const specItem = {
                    regionId: tile.regionId,
                    name: tile.region.specialty.shortName,
                    icon: tile.region.specialty.icon
                };
                if (Math.random() < 0.35 && this.marketListings.length < 6) {
                    this.marketListings.unshift({
                        id: this.nextListingId++,
                        sellerId: ai.id,
                        sellerName: ai.name,
                        itemType: "specialty",
                        regionId: specItem.regionId,
                        name: specItem.name,
                        icon: specItem.icon,
                        price: 2
                    });
                    this.logEvent(`📢 [AI] ${ai.name} vừa đăng bán đặc sản [${specItem.icon} ${specItem.name}] lên Sàn Giao Thương Chung (Giá 2 Xu)!`);
                    this.addTradeBulletinNotice(`📢 ${ai.name} rao bán [${specItem.icon} ${specItem.name}] giá 2 Xu`);
                } else {
                    ai.specialties.push(specItem);
                    this.logEvent(`🤖 [AI] ${ai.name} mua đặc sản [${specItem.icon} ${specItem.name}] tại ${tile.portName} (1 Xu).`);
                    this.addTradeBulletinNotice(`📦 ${ai.name} nhập [${specItem.icon} ${specItem.name}] tại ${tile.portName}`);
                }
            }
            return;
        }

        if (tile.resourceType && tile.resourceCooldown === 0 && !tile.stormRestricted && this.getCargoCount(ai) < 8) {
            this.spendInteractiveAP(ai);
            const space = Math.max(0, 8 - this.getCargoCount(ai));
            const gainAmt = Math.min(space, 2);
            ai[tile.resourceType] += gainAmt;
            const cds = { food: 2, wood: 3, iron: 4 };
            const cdBonus = (this.currentWeatherPhase === "sunset" || this.currentWeatherPhase === "night") ? 1 : 0;
            tile.resourceCooldown = Math.max(1, cds[tile.resourceType] - cdBonus);
            this.world.updateResourceVisuals();
            this.world.triggerBurstAnimation(tile.q, tile.r, 0x5c9ead, 16);
            this.logEvent(`🤖 [AI] ${ai.name} khai thác +${gainAmt} tài nguyên tại ${tile.region.name}.`);
            return;
        }

        if (tile.hasNPC) {
            this.spendInteractiveAP(ai);
            ai.coins = Math.min(15, ai.coins + 3);
            this.world.despawnRareNPC();
            this.nextNPCSpawnRound = this.roundNumber + 4 + Math.floor(Math.random() * 2);
            this.logEvent(`🤖 [AI] ${ai.name} gặp Tiên Ông Rìu Vàng (+3 Xu). Tiên Ông sẽ tái xuất ở Vòng ${this.nextNPCSpawnRound}!`);
            return;
        }
    }

    // ------------------------------------------------------------------------
    // VICTORY SCREEN (3 ROYAL RELICS COLLECTED + 15-SECOND AUTO RETURN TO ROOM)
    // ------------------------------------------------------------------------
    showVictoryScreen(winner, lastQuiz = null, lastChosenIdx = null) {
        if (!winner) return;
        this.victoryShownForMatch = true;
        this.matchWinner = winner;
        clearTimeout(this.autoEndTurnTimer);
        clearInterval(this.victoryCountdownInterval);

        window.SFX.playRelicFanfare();

        const sortedStandings = [...this.players].sort((a, b) => {
            const relDiff = (b.relics ? b.relics.length : 0) - (a.relics ? a.relics.length : 0);
            if (relDiff !== 0) return relDiff;
            return (b.coins || 0) - (a.coins || 0);
        });

        const standingsHtml = sortedStandings.map((pl, idx) => `
            <div class="turn-order-leaderboard-row ${pl.id === winner.id ? 'rank-1' : ''}">
                <div style="display:flex; align-items:center; gap:10px">
                    <span class="slot-badge-num" style="background:${pl.color}; width:26px; height:26px; font-size:12px">#${idx + 1}</span>
                    <div>
                        <strong style="color:#e8eef4; font-size:13.5px">${pl.name} (${pl.vesselTitle})</strong>
                        ${pl.id === winner.id ? '<span style="color:#ffd54f; font-weight:800; margin-left:6px">🏆 NHÀ VÔ ĐỊCH</span>' : ''}
                    </div>
                </div>
                <div style="font-size:12.5px; font-weight:800; color:#e5c365">
                    👑 ${(pl.relics || []).length}/3 Bảo Vật • 💰 ${pl.coins} Xu
                </div>
            </div>
        `).join("");

        const html = `
            <div class="modal-header-badge" style="background:#c59b2733; border-color:#c59b27">
                <span>🏆 MÀN HÌNH CHÚC MỪNG CHIẾN THẮNG – THE GOLDEN JOURNEY (HÀNH TRÌNH VÀNG SON)</span>
                <span class="badge-tag">Kết Thúc Ván Đấu</span>
            </div>
            <h2 class="modal-title" style="font-size:24px; color:#ffd54f; text-align:center">
                🎉👑 CHÚC MỪNG ${winner.name.toUpperCase()} (${winner.vesselTitle}) GIÀNH CHIẾN THẮNG! 👑🎉
            </h2>
            <p class="modal-desc" style="text-align:center">
                Thuyền trưởng <strong>${winner.name}</strong> đã xuất sắc vượt qua sóng gió Biển Đông, giao thương đặc sản dọc <strong>Bản Đồ Hình Chữ S 6 Vùng Kinh Tế Việt Nam</strong> và chinh phục trọn bộ <strong>3 BẢO VẬT HOÀNG GIA (ROYAL RELICS)</strong>!
            </p>
            <div class="relic-showcase-row">
                ${(winner.relics || []).map(r => `
                    <div class="relic-victory-card">
                        <div style="font-size:36px">${r.icon}</div>
                        <div style="font-weight:700; color:#e5c365; margin-top:6px">${r.name}</div>
                        <div style="font-size:12px; color:#cbd5e1">${r.monumentName}</div>
                    </div>
                `).join("")}
            </div>

            <div class="turn-order-leaderboard" style="margin:10px 0">
                ${standingsHtml}
            </div>

            ${lastQuiz !== null ? this.renderQuizVisualMemoryCard(lastQuiz, lastChosenIdx, winner.name) : ''}

            <div class="victory-countdown-box">
                <div>⏳ Ván đấu sẽ tự động đóng và đưa toàn bộ người chơi về lại <strong>Phòng Chờ Ban Đầu</strong> sau:</div>
                <div id="victory-countdown-sec" class="victory-countdown-sec">15s</div>
            </div>

            <div class="modal-actions" style="justify-content:center">
                <button class="btn-primary-gold" onclick="window.GAME.returnToRoomLobbyAfterVictory()">
                    🚪 Quay Về Phòng Ban Đầu Ngay
                </button>
            </div>
        `;
        this.showModal(html);

        let secLeft = 15;
        this.victoryCountdownInterval = setInterval(() => {
            secLeft -= 1;
            const secEl = document.getElementById("victory-countdown-sec");
            if (secEl) secEl.textContent = `${Math.max(0, secLeft)}s`;
            if (secLeft <= 0) {
                clearInterval(this.victoryCountdownInterval);
                this.returnToRoomLobbyAfterVictory();
            }
        }, 1000);
    }

    async returnToRoomLobbyAfterVictory() {
        clearInterval(this.victoryCountdownInterval);
        clearTimeout(this.autoEndTurnTimer);
        this.matchWinner = null;
        this.liveQuizState = null;

        if (this.roomState.code) {
            try {
                const resp = await fetch("/api/room/return-to-lobby", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code: this.roomState.code })
                });
                const data = await resp.json();
                if (data && data.room) {
                    this.roomState.status = "waiting";
                    this.roomState.seats = data.room.seats || this.roomState.seats;
                    this.roomState.version = data.room.version || (this.roomState.version + 1);
                }
            } catch (e) {
                this.roomState.status = "waiting";
            }
        } else {
            this.roomState.status = "waiting";
        }

        document.getElementById("modal-overlay").classList.add("hidden");
        this.showWaitingScreen();
        this.showToast("🏁 Ván đấu đã khép lại! Đã đưa bạn về lại Phòng chờ ban đầu.");
    }

    // ------------------------------------------------------------------------
    // UI UPDATES (ALWAYS DISPLAY LOCAL PLAYER'S OWN STATS IN #panel-captain)
    // ------------------------------------------------------------------------
    focusOnPlayerShip(playerId) {
        const pl = this.players.find(item => item.id === playerId);
        if (!pl) return;
        window.SFX.playClick();
        this.world.focusCameraOnHex(pl.q, pl.r);
        this.showToast(`🔭 Đã di chuyển góc nhìn tới thuyền của [${pl.name}] (${pl.vesselTitle})!`);
    }

    updateUI() {
        const p = this.getActivePlayer();
        if (!p) return;
        const localP = this.getLocalPlayer() || p;
        const myTurn = this.isMyTurn();
        const activeTile = this.getCurrentTile(p);

        this.world.setCameraLockTarget(localP);
        this.updateClockAndTickerUI();

        document.getElementById("hud-round").textContent = `Vòng ${this.roundNumber}`;

        const mktBadge = document.getElementById("market-count-badge");
        if (mktBadge) {
            mktBadge.textContent = String((this.marketListings || []).length);
        }

        // Top bar: Local player's assigned ship & live turn status (click to focus on your ship!)
        const myShipEl = document.getElementById("hud-my-ship");
        if (myShipEl && localP) {
            myShipEl.style.cursor = "pointer";
            myShipEl.title = "Bấm để đưa góc nhìn về thuyền của bạn";
            myShipEl.onclick = () => this.world.focusCameraOnHex(localP.q, localP.r);
            myShipEl.innerHTML = `<span class="fleet-dot" style="background:${localP.color}"></span> ⛵ Bạn: <strong>${localP.name}</strong>`;
        }

        const turnStatusEl = document.getElementById("hud-turn-status");
        if (turnStatusEl) {
            if (myTurn) {
                turnStatusEl.innerHTML = `🎯 Lượt bạn (${p.ap}/5 AP)`;
                turnStatusEl.className = "hud-pill turn-pill my-turn";
            } else {
                turnStatusEl.innerHTML = `👁️ Lượt: ${p.name}`;
                turnStatusEl.className = "hud-pill turn-pill spectator-turn";
            }
        }

        this.updateSpectatorQuizPillUI();

        // Compact banner inside #panel-captain showing who is currently taking their turn when spectating
        const specBannerEl = document.getElementById("spectator-active-turn-banner");
        if (specBannerEl) {
            if (!myTurn) {
                specBannerEl.classList.remove("hidden");
                specBannerEl.innerHTML = `👁️ Lượt: <strong>${p.name}</strong> (${p.ap}/5 AP)`;
            } else {
                specBannerEl.classList.add("hidden");
            }
        }

        // #panel-captain ALWAYS displays the LOCAL player's own ship info (`localP`)
        document.getElementById("active-player-dot").style.backgroundColor = localP.color;
        document.getElementById("active-player-name").textContent = `${localP.name} ${myTurn ? '🎯' : '⛵'}`;
        document.getElementById("active-player-vessel").textContent = localP.vesselTitle;

        const moveApRemaining = myTurn
            ? Math.max(0, Math.min(3 - (localP.moveApSpent || 0), localP.ap))
            : 3;
        document.getElementById("stat-ap").textContent = this.sandboxInfiniteMove
            ? `♾️ AP`
            : (myTurn ? `${localP.ap}/5 AP` : `Chờ lượt`);
        document.getElementById("stat-move-steps").textContent = this.sandboxInfiniteMove
            ? `Tự do`
            : (myTurn
                ? `Đi ${this.getRemainingHexSteps(localP)} ô (${moveApRemaining}/3)`
                : `Lượt ${p.name}`);
        document.getElementById("stat-hp").textContent = `${localP.hp}/${localP.maxHp}`;
        document.getElementById("stat-coins").textContent = `${localP.coins}/15`;
        document.getElementById("stat-cargo").textContent = `Kho:${this.getCargoCount(localP)}/8`;
        document.getElementById("stat-relics").textContent = `${localP.relics.length}/3`;

        document.getElementById("inv-food").textContent = localP.food;
        document.getElementById("inv-wood").textContent = localP.wood;
        document.getElementById("inv-iron").textContent = localP.iron;
        document.getElementById("inv-k1").textContent = `${localP.keys[1] || 0}/1`;
        document.getElementById("inv-k2").textContent = `${localP.keys[2] || 0}/1`;
        document.getElementById("inv-k3").textContent = `${localP.keys[3] || 0}/1`;

        const serpentChip = document.getElementById("inv-serpent-chip");
        if (serpentChip) {
            serpentChip.classList.toggle("hidden", !localP.hasSerpentCoin);
        }

        const specContainer = document.getElementById("inv-specialties");
        if (localP.specialties.length === 0) {
            specContainer.innerHTML = `<span class="empty-tag">0 Đặc sản</span>`;
        } else {
            specContainer.innerHTML = localP.specialties.map(s => `<span class="spec-badge">${s.icon} ${s.name}</span>`).join("");
        }

        const relicContainer = document.getElementById("inv-relics-list");
        if (localP.relics.length === 0) {
            relicContainer.innerHTML = ``;
        } else {
            relicContainer.innerHTML = localP.relics.map(r => `<span class="relic-badge">${r.icon} ${r.name}</span>`).join("");
        }

        const ctxBtn = document.getElementById("btn-context-action");
        const repairBtn = document.getElementById("btn-repair-ship");
        const endTurnBtn = document.getElementById("btn-end-turn");

        // #btn-end-turn and #btn-repair-ship are anchored in the header of #panel-captain so they are NEVER pushed outside!
        if (!myTurn) {
            if (ctxBtn) ctxBtn.classList.add("hidden");
            if (repairBtn) repairBtn.disabled = true;
            if (endTurnBtn) endTurnBtn.disabled = true;
        } else {
            if (repairBtn) repairBtn.disabled = false;
            if (endTurnBtn) endTurnBtn.disabled = false;
            if (activeTile && ctxBtn) {
                if (activeTile.monumentId) {
                    const mon = window.GAME_DATA.monuments.find(m => m.id === activeTile.monumentId);
                    ctxBtn.innerHTML = `🏛️ Mở ${mon.name} (1 AP)`;
                    ctxBtn.disabled = false;
                    ctxBtn.classList.remove("hidden");
                } else if (activeTile.isPort) {
                    ctxBtn.innerHTML = `⚓ Cảng ${activeTile.portName} (1 AP)`;
                    ctxBtn.disabled = false;
                    ctxBtn.classList.remove("hidden");
                } else if (activeTile.resourceType) {
                    const cdText = activeTile.resourceCooldown > 0 ? ` (Hồi ${activeTile.resourceCooldown}v)` : ` (1 AP)`;
                    ctxBtn.innerHTML = `⛏️ Khai Thác${cdText}`;
                    ctxBtn.disabled = activeTile.resourceCooldown > 0 || activeTile.stormRestricted || !this.canSpendInteractiveAP(p);
                    ctxBtn.classList.remove("hidden");
                } else if (activeTile.hasNPC) {
                    ctxBtn.innerHTML = `🧙‍♂️ Gặp Tiên Ông (1 AP)`;
                    ctxBtn.disabled = !this.canSpendInteractiveAP(p);
                    ctxBtn.classList.remove("hidden");
                } else {
                    ctxBtn.classList.add("hidden");
                }
            }
        }

        // Sleek, Compact Leaderboard sorted by Relics -> Coins -> Turn Order
        const rosterEl = document.getElementById("fleet-roster");
        if (rosterEl) {
            const rankedPlayers = this.players.map((pl, turnIdx) => ({ pl, turnIdx })).sort((a, b) => {
                if (a.pl.eliminated !== b.pl.eliminated) return a.pl.eliminated ? 1 : -1;
                const rDiff = (b.pl.relics ? b.pl.relics.length : 0) - (a.pl.relics ? a.pl.relics.length : 0);
                if (rDiff !== 0) return rDiff;
                const cDiff = (b.pl.coins || 0) - (a.pl.coins || 0);
                if (cDiff !== 0) return cDiff;
                return a.turnIdx - b.turnIdx;
            });

            const rankMedals = ["🥇", "🥈", "🥉", "#4", "#5"];
            rosterEl.innerHTML = rankedPlayers.map((entry, rankIdx) => {
                const { pl, turnIdx } = entry;
                const isMe = localP && (World3D.getPlayerShipKey(pl) === World3D.getPlayerShipKey(localP));
                const isTurn = (turnIdx === this.activePlayerIdx);
                const medal = rankMedals[rankIdx] || `#${rankIdx + 1}`;
                return `
                    <div class="lb-row-card ${isTurn ? 'active-turn' : ''} ${isMe ? 'is-me' : ''} ${pl.eliminated ? 'eliminated' : ''}"
                         title="Bấm để xem vị trí thuyền của ${pl.name}"
                         onclick="window.GAME.focusOnPlayerShip(${pl.id})">
                        <div class="lb-left">
                            <span class="lb-rank-badge">${medal}</span>
                            <span class="lb-color-dot" style="background:${pl.color}"></span>
                            <div class="lb-info">
                                <div class="lb-name-line">
                                    ${pl.name} ${isMe ? '<span style="color:#fde047">[Bạn]</span>' : ''} ${isTurn ? '🎯' : ''}
                                </div>
                                <div class="lb-sub-line">
                                    ${pl.eliminated ? '☠️ Đắm' : `❤️${pl.hp} • 💰${pl.coins}/15 • 📦${this.getCargoCount(pl)}/8${pl.hasSerpentCoin ? ' • 🐍' : ''}`}
                                </div>
                            </div>
                        </div>
                        <div class="lb-relic-pill" title="Bảo Vật Hoàng Gia (3 = Thắng)">
                            👑${pl.relics.length}/3
                        </div>
                    </div>
                `;
            }).join("");
        }
    }

    // ------------------------------------------------------------------------
    // HOVER TOOLTIP: ONLY ON INTERACTIVE POIs (MONUMENT, PORT, RESOURCE, NPC)
    // AND ONLY AFTER HOVERING FOR 0.5 SECONDS (500ms)
    // ------------------------------------------------------------------------
    handleHexHover(tile, clientX, clientY) {
        const tooltip = document.getElementById("hex-tooltip");
        this.lastHoverMouseX = clientX;
        this.lastHoverMouseY = clientY;

        const isInteractivePOI = Boolean(
            this.isGameStarted &&
            tile &&
            (tile.monumentId || tile.isPort || tile.resourceType || tile.hasNPC)
        );

        if (!isInteractivePOI) {
            clearTimeout(this.hoverTooltipTimer);
            this.hoverTooltipTimer = null;
            this.hoveredPOITileKey = null;
            if (tooltip) tooltip.classList.add("hidden");
            return;
        }

        const poiKey = `${tile.q},${tile.r}`;
        if (this.hoveredPOITileKey !== poiKey) {
            clearTimeout(this.hoverTooltipTimer);
            this.hoveredPOITileKey = poiKey;
            if (tooltip) tooltip.classList.add("hidden");

            this.hoverTooltipTimer = setTimeout(() => {
                if (this.hoveredPOITileKey === poiKey) {
                    this.renderPOITooltip(tile, this.lastHoverMouseX, this.lastHoverMouseY);
                }
            }, 500);
        } else if (tooltip && !tooltip.classList.contains("hidden")) {
            tooltip.style.left = `${Math.min(window.innerWidth - 310, clientX + 16)}px`;
            tooltip.style.top = `${Math.min(window.innerHeight - 150, clientY + 16)}px`;
        }
    }

    renderPOITooltip(tile, clientX, clientY) {
        const tooltip = document.getElementById("hex-tooltip");
        if (!tooltip || !this.isGameStarted || !tile) return;

        let title = "";
        let details = "";

        if (tile.monumentId) {
            const mon = window.GAME_DATA.monuments.find(m => m.id === tile.monumentId);
            const tier = tile.monumentTier;
            const reqMap = {
                1: {
                    badge: "🟢 Cấp 1 – Dễ (Easy • Tối đa vào 1 lần)",
                    reqText: "1 🗝️ Key 1 + 1 🌾 Lúa + 2 💰 Xu + 1 AP",
                    rewardText: "+1 👑 Bảo Vật & +3 💰 Xu (Sai: 🏹 Bẫy Mũi Tên -1 HP)",
                    foodReq: 1, ironReq: 0, coinReq: 2
                },
                2: {
                    badge: "🟡 Cấp 2 – Trung Bình (Medium)",
                    reqText: "1 🗝️ Key 2 + 2 🌾 Lúa + 3 💰 Xu + 1 AP",
                    rewardText: "+1 👑 Bảo Vật & +4 💰 Xu (Sai: 🪨 Bẫy Đá Lăn -2 HP)",
                    foodReq: 2, ironReq: 0, coinReq: 3
                },
                3: {
                    badge: "🔴 Cấp 3 – Khó (Hard)",
                    reqText: "1 🗝️ Key 3 + 3 🌾 Lúa + 1 ⛏️ Sắt + 6 💰 Xu + 1 AP",
                    rewardText: "+1 👑 Bảo Vật & +5 💰 Xu (Sai: ⚡🪨 Bẫy Sét & Đá Lăn -3 HP)",
                    foodReq: 3, ironReq: 1, coinReq: 6
                }
            }[tier];

            const refPlayer = this.getLocalPlayer() || this.getActivePlayer();
            let playerCheckHtml = "";
            if (refPlayer) {
                const tier1Blocked = (tier === 1 && (refPlayer.tier1Visited || 0) >= 1);
                const hasKey = (refPlayer.keys[tier] || 0) >= 1;
                const hasFood = refPlayer.food >= reqMap.foodReq;
                const hasIron = refPlayer.iron >= reqMap.ironReq;
                const hasCoins = refPlayer.coins >= reqMap.coinReq;
                const allReady = !tier1Blocked && hasKey && hasFood && hasIron && hasCoins;
                playerCheckHtml = `
                    <div style="margin-top:5px; padding-top:4px; border-top:1px dashed rgba(197,155,39,0.35); font-size:10.5px; color:${allReady ? '#88e2a8' : '#f4b4b2'}">
                        ${tier1Blocked
                            ? '⛔ <strong>Bạn đã vào Di tích Cấp 1 đủ 1/1 lần tối đa!</strong>'
                            : (allReady ? '✅ <strong>Thuyền bạn đã ĐỦ tài nguyên mở Di tích này!</strong>' : '⚠️ <strong>Khoang tàu bạn hiện có:</strong>')
                        }<br/>
                        🗝️ Key ${tier}: <strong>${refPlayer.keys[tier] || 0}/1</strong> • 🌾 Lúa: <strong>${refPlayer.food}/${reqMap.foodReq}</strong>${reqMap.ironReq ? ` • ⛏️ Sắt: <strong>${refPlayer.iron}/${reqMap.ironReq}</strong>` : ''} • 💰 Xu: <strong>${refPlayer.coins}/${reqMap.coinReq}</strong>
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
            const portInv = this.getPortInventory(tile.regionId);
            title = `⚓ ${tile.portName} (${tile.region.name})`;
            details = `Mua Đặc sản: ${tile.region.specialty.icon} ${tile.region.specialty.shortName} (1 Xu) • Bán cách 1 vùng: 2 Xu (+1) / ≥2 vùng: 3 Xu (+2)<br/>📦 Mở bán: 1 Xu = 2 Lúa / 3 Gỗ / 1 Sắt • 🐍 Xu Mãng Xà (10 Xu) • Đang có: <strong>🗝️ Key ${portInv.availableKeyTier} (${portInv.keyStock}/1)</strong>`;
        } else if (tile.resourceType) {
            const rMap = { food: "🌾 Vựa Lúa / Ngư Trường (Hồi 2 vòng)", wood: "🌲 Lâm Trường Gỗ (Hồi 3 vòng)", iron: "⛏️ Mỏ Khoáng Sản Sắt (Hồi 4 vòng)" };
            title = rMap[tile.resourceType];
            if (tile.stormRestricted) {
                details = `⛔ <strong>Đang bị phong tỏa bởi Giông Bão (Không thể vào khai thác)!</strong>`;
            } else if (tile.resourceCooldown > 0) {
                details = `⏳ Đang tái tạo sinh thái: Còn ${tile.resourceCooldown} vòng`;
            } else {
                details = `✅ Sẵn sàng khai thác (Đúng +2 Tài nguyên / Sai +1 Tài nguyên • Không nhận Xu)`;
            }
        } else if (tile.hasNPC) {
            title = `🧙‍♂️ Tiên Ông Rìu Vàng – Rìu Bạc (Sự kiện hiếm)`;
            details = `✨ Xuất hiện 4–5 vòng 1 lần! Đến gặp để giải đố nhận <strong>+2 đến +3 Xu Vàng</strong>!`;
        }

        const routeInfo = this.world.reachablePaths.get(`${tile.q},${tile.r}`);
        if (routeInfo && this.isMyTurn() && this.getActivePlayer()) {
            const stepsPerAp = this.getStepsPerMoveAP();
            const apCost = this.sandboxInfiniteMove
                ? 0
                : Math.ceil(Math.max(0, routeInfo.steps - this.getActivePlayer().hexMoveCredits) / stepsPerAp);
            details += `<br/><span style="color:#e5c365">⛵ Nhấn để lái tàu (${routeInfo.steps} ô • Tốn ${apCost} AP) hoặc Nhấp đúp + Kéo để tự vẽ đường</span>`;
        }

        tooltip.innerHTML = `<div class="tt-title">${title}</div><div class="tt-body">${details}</div>`;
        tooltip.style.left = `${Math.min(window.innerWidth - 310, clientX + 16)}px`;
        tooltip.style.top = `${Math.min(window.innerHeight - 150, clientY + 16)}px`;
        tooltip.classList.remove("hidden");
    }

    openAtlasModal() {
        const regionsHtml = window.GAME_DATA.regions.map(r => {
            const mons = window.GAME_DATA.monuments.filter(m => m.id === r.id || m.regionId === r.id);
            return `
                <div class="atlas-region-card" style="border-left: 5px solid ${r.color}">
                    <div class="atlas-region-header">
                        <span class="atlas-region-title" style="color:${r.color}">${r.id + 1}. ${r.name} (${r.enName})</span>
                        <span class="spec-badge">${r.specialty.icon} Đặc sản: ${r.specialty.name} (Giá gốc: 1 Xu)</span>
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

    // ------------------------------------------------------------------------
    // DETAILED CATEGORIZED RULEBOOK MODAL (SUMMARY + FULL ENCYCLOPEDIA TABS)
    // ------------------------------------------------------------------------
    openRulebookModal(category = null) {
        if (!category) {
            const html = `
                <div class="modal-header-badge" style="background:#c59b2725; border-color:#c59b27">
                    <span>📜 LUẬT CHƠI CHÍNH THỨC – THE GOLDEN JOURNEY (BẢN NÂNG CẤP V7.0)</span>
                </div>
                <h2 class="modal-title">Tóm Tắt Quy Tắc Bàn Cờ Chiến Thuật Địa Lý &amp; Kinh Tế 6 Vùng</h2>
                <div class="rulebook-grid">
                    <div class="rule-card">
                        <h4>🏆 Mục Tiêu Chiến Thắng</h4>
                        <p>Thu thập đủ <strong>3 BẢO VẬT HOÀNG GIA (Royal Relics)</strong> từ các Di tích phát sáng dọc đất nước để giành chiến thắng ngay lập tức!</p>
                    </div>
                    <div class="rule-card">
                        <h4>⛵ 5 AP Mỗi Lượt &amp; Vẽ Đường Đi</h4>
                        <p>• Mỗi lượt có <strong>5 AP</strong> (tối đa <strong>3 AP</strong> cho việc di chuyển: 1 AP = 2 ô nước bình thường, hoặc 1 AP = 1 ô khi có Siêu Bão Yagi).<br/>
                        • <strong>Click 1 lần:</strong> Tự tìm đường (không tự né Đá Ngầm -1 HP).<br/>
                        • <strong>Click đúp 2 lần + Giữ kéo:</strong> Chủ động vẽ đường đi qua từng ô nước để né Bãi Đá Ngầm!</p>
                    </div>
                    <div class="rule-card">
                        <h4>⚓ Giao Thương 6 Cảng &amp; Reset 8p30s</h4>
                        <p>• Mua Đặc sản <strong>1 Xu</strong>: Bán cách 1 vùng = <strong>2 Xu (+1 Xu lãi)</strong>; cách ≥2 vùng = <strong>3 Xu (+2 Xu lãi)</strong>.<br/>
                        • Cảng mở bán: <strong>1 Xu = 2 Lúa | 1 Xu = 3 Gỗ | 1 Xu = 1 Sắt</strong> và <strong>🐍 Đồng Xu Mãng Xà (10 Xu)</strong>.<br/>
                        • Mỗi Cảng chỉ bán <strong>1 loại Key ngẫu nhiên</strong>, tự động làm mới sau mỗi <strong>8 phút 30 giây</strong>!</p>
                    </div>
                    <div class="rule-card">
                        <h4>📦 Kho Chứa, Key &amp; Khai Thác</h4>
                        <p>• Ngân khố tối đa <strong>15 Xu</strong>, kho hàng tối đa <strong>8 ô</strong>.<br/>
                        • Mỗi loại Chìa Khóa chỉ chứa tối đa <strong>1 cái</strong> (Key 1: 1/1, Key 2: 1/1, Key 3: 1/1).<br/>
                        • <strong>Khai thác tài nguyên:</strong> Chỉ nhận tài nguyên (Đúng +2, Sai +1), <strong>không nhận Xu</strong>.</p>
                    </div>
                    <div class="rule-card">
                        <h4>🏛️ Di Tích, Giới Hạn Cấp 1 &amp; Bẫy</h4>
                        <p>• Mỗi người chơi chỉ được vào <strong>Di tích Cấp 1 (Easy) tối đa 1 lần</strong> (Phí: 2 Xu + 1 Lúa + 1 Key 1).<br/>
                        • Trả lời sai kích hoạt bẫy: Cấp 1 <strong>🏹 Bẫy Mũi Tên (-1 HP)</strong>, Cấp 2 <strong>🪨 Bẫy Đá Lăn (-2 HP)</strong>, Cấp 3 <strong>⚡🪨 Bẫy Sét &amp; Đá Lăn (-3 HP)</strong>.</p>
                    </div>
                    <div class="rule-card">
                        <h4>🌦️ Đồng Hồ 45 Phút &amp; Thời Tiết Biển</h4>
                        <p>• 00–15p: <strong>☀️ Nắng</strong> | 15–20p: <strong>🌧️ Mưa</strong> | 20–27p: <strong>⛈️ Giông Bão</strong> (Đọc hiểu 1p30s, sai -2 HP, cấm 4 ô mỏ) | 27–34p: <strong>🌅 Hoàng Hôn &amp; 🌌 Đêm Sao</strong> (-1 vòng hồi mỏ) | 34–45p: <strong>🌀 Siêu Bão Yagi</strong> (Báo động đỏ, 1 AP = 1 ô, hết 4 AP hỏi Quiz).</p>
                    </div>
                </div>
                <div class="modal-actions" style="justify-content:space-between; flex-wrap:wrap; gap:10px">
                    <button class="btn-primary-gold" onclick="window.GAME.openRulebookModal('overview')" style="background:linear-gradient(135deg,#0284c7,#0369a1); color:#fff; border-color:#7dd3fc">
                        📘 Xem Chi Tiết Toàn Bộ Luật &amp; Cơ Chế Game
                    </button>
                    <button class="btn-primary-gold" onclick="window.GAME.closeModal()">Đã Hiểu Luật Chơi</button>
                </div>
            `;
            this.showModal(html);
            return;
        }

        const tabs = [
            { id: "overview", label: "🏆 Tổng Quan & Lượt Chơi" },
            { id: "movement_reef", label: "⛵ Di Chuyển (5 AP) & Đá Ngầm" },
            { id: "port_market", label: "⚓ 6 Cảng, Giá Buôn & Xu Mãng Xà" },
            { id: "storage_keys", label: "📦 Kho Chứa, Key & Khai Thác" },
            { id: "monuments_traps", label: "🏛️ Di Tích & Cơ Quan Bẫy" },
            { id: "weather_events", label: "🌦️ Chu Kỳ Thời Tiết & Bão Yagi" }
        ];

        const sectionContent = {
            overview: `
                <div class="rule-detail-section">
                    <h4>1. Mục Tiêu Chiến Thắng Tuyệt Đối (Endgame)</h4>
                    <ul>
                        <li>Trên Bản Đồ Hình Chữ S gồm 6 Vùng Kinh Tế Việt Nam có <strong>9 Di Tích Lịch Sử – Địa Lý</strong> luôn phát sáng cột hào quang để người chơi dễ dàng quan sát vị trí.</li>
                        <li>Người chơi đầu tiên chinh phục và thu thập đủ <strong>3 BẢO VẬT HOÀNG GIA (👑 3/3 Royal Relics)</strong> sẽ giành chiến thắng ngay lập tức!</li>
                    </ul>
                    <h4>2. Đua Tốc Độ Đầu Trận &amp; Cấu Trúc Lượt Đi (5 AP)</h4>
                    <ul>
                        <li><strong>Câu hỏi tốc độ đầu trận:</strong> Tất cả người chơi cùng trả lời 1 câu hỏi khởi động. Ai trả lời đúng và nhanh nhất đi Lượt 1, nhanh thứ 2 đi Lượt 2...</li>
                        <li><strong>5 AP mỗi lượt:</strong> Mỗi khi tới lượt, thuyền trưởng nhận <strong>5 AP</strong>. Trong đó tối đa <strong>3 AP</strong> được phép dùng cho việc di chuyển thuyền, phần AP còn lại dùng để tương tác (khai thác tài nguyên, giao dịch tại cảng, mở cổng di tích, sửa tàu).</li>
                    </ul>
                </div>
            `,
            movement_reef: `
                <div class="rule-detail-section">
                    <h4>1. Quy Tắc Di Chuyển (Tối Đa 3 AP Di Chuyển / 5 AP Tổng)</h4>
                    <ul>
                        <li><strong>Thời tiết bình thường:</strong> <code>1 AP = 2 ô nước</code> → Tối đa đi được <strong>6 ô nước/lượt</strong> (tốn 3 AP di chuyển).</li>
                        <li><strong>Khi Siêu Bão Yagi đổ bộ (phút 34–45):</strong> <code>1 AP = 1 ô nước</code> → Tối đa đi được <strong>3 ô nước/lượt</strong>.</li>
                        <li><strong>Luật cập bến thực tế:</strong> Thuyền không thể đi xuyên qua các ô Di Tích, Thương Cảng hoặc Mỏ Tài Nguyên để sang ô khác mà phải đi vòng qua luồng biển (trừ khi chọn ô đó làm điểm dừng cập bến).</li>
                    </ul>
                    <h4>2. Hai Cách Điều Khiển Thuyền &amp; Cách Né Bãi Đá Ngầm (⚠️ Reefs)</h4>
                    <ul>
                        <li><strong>⚠️ Bãi Đá Ngầm trên biển:</strong> Các cụm đá ngầm nhọn có cảnh báo đỏ nằm rải rác trên hải trình. Nếu thuyền đi xuyên qua hoặc dừng trên ô Bãi Đá Ngầm sẽ bị va chạm mất <strong>-1 ❤️ HP</strong> mỗi ô đá ngầm!</li>
                        <li><strong>Cách 1 — Click đơn (1 lần) vào ô đích:</strong> Thuyền tự động tìm đường ngắn nhất theo luồng nước nhưng <strong>KHÔNG tự động né Bãi Đá Ngầm</strong>.</li>
                        <li><strong>Cách 2 — Nhấp đúp (Click 2 lần) + Giữ kéo chuột qua từng ô:</strong> Nhấp đúp vào ô thuyền đang đứng (hoặc ô sát cạnh thuyền), ở lần nhấp thứ 2 giữ chuột và kéo lần lượt qua từng ô lục giác bạn muốn đi qua để <strong>chủ động lách tránh Bãi Đá Ngầm</strong>, sau đó thả chuột để thuyền chạy theo đúng lộ trình bạn vừa vẽ!</li>
                    </ul>
                </div>
            `,
            port_market: `
                <div class="rule-detail-section">
                    <h4>1. Bảng Giá Giao Thương Tại 6 Thương Cảng</h4>
                    <ul>
                        <li><strong>Mua Đặc sản vùng tại Cảng:</strong> Giá gốc <strong>1 💰 Xu / 1 Đặc sản</strong>.</li>
                        <li><strong>Bán Đặc sản xuyên vùng:</strong>
                            <ul>
                                <li>Bán tại Cảng cách <strong>1 vùng kinh tế</strong>: Thu về <strong>2 💰 Xu</strong> (Lãi <code>+1 Xu</code>).</li>
                                <li>Bán tại Cảng cách <strong>từ 2 vùng kinh tế trở lên</strong>: Thu về <strong>3 💰 Xu</strong> (Lãi <code>+2 Xu</code>).</li>
                            </ul>
                        </li>
                        <li><strong>Định lượng mua Tài Nguyên tại Cảng:</strong>
                            <ul>
                                <li><code>1 💰 Xu = 2 🌾 Lúa (Lương thực)</code></li>
                                <li><code>1 💰 Xu = 3 🌲 Gỗ</code></li>
                                <li><code>1 💰 Xu = 1 ⛏️ Sắt</code></li>
                            </ul>
                        </li>
                    </ul>
                    <h4>2. Chu Kỳ Reset Kho Cảng (8 Phút 30 Giây) &amp; Đồng Xu Mãng Xà</h4>
                    <ul>
                        <li><strong>Reset Cảng mỗi 8p30s:</strong> Cứ sau <strong>8 phút 30 giây</strong>, cả 6 Thương Cảng tự động làm mới toàn bộ hàng hóa. Mỗi Cảng chỉ mở bán <strong>duy nhất 1 loại Chìa Khóa ngẫu nhiên</strong> (Key 1: 2 Xu, Key 2: 4 Xu, hoặc Key 3: 6 Xu) trong mỗi chu kỳ!</li>
                        <li><strong>🐍 Đồng Xu Mãng Xà (Giá 10 Xu):</strong> Bán tại các Thương Cảng. Đây là bảo vật hộ mệnh tự động kích hoạt khi máu (HP) của bạn giảm về <code>0</code>, giúp thuyền không bị đắm và lập tức hồi lại <strong>2 ❤️ HP</strong>!</li>
                        <li><strong>⚖️ Chợ Liên Đội &amp; Xem Kho 6 Cảng (0 AP):</strong> Bất kỳ lượt nào bạn cũng có thể bấm nút <strong>⚖️ Chợ &amp; 6 Cảng</strong> để xem từng Cảng đang bán loại Key nào, hoặc đăng bán/mua lại Lúa, Gỗ, Sắt, Đặc sản giữa các người chơi với mức giá tự đặt (Không được phép bán Chìa khóa trên chợ người chơi).</li>
                    </ul>
                </div>
            `,
            storage_keys: `
                <div class="rule-detail-section">
                    <h4>1. Quy Tắc Kho Chứa &amp; Ngân Khố (Tối Đa 15 Xu)</h4>
                    <ul>
                        <li><strong>Ngân khố tối đa:</strong> Mỗi thuyền được tích trữ tối đa <strong>15 💰 Xu</strong>.</li>
                        <li><strong>Lưu ý nguồn kiếm Xu:</strong> Tiền Xu <strong>chỉ có thể kiếm được</strong> thông qua việc buôn bán tại Thương Cảng / Chợ hoặc chinh phục Di Tích (cùng Sự kiện Tiên Ông / câu hỏi tâm bão Yagi).</li>
                        <li><strong>Kho hàng (Cargo):</strong> Sức chứa tối đa <strong>8 đơn vị</strong> (Tổng Lúa + Gỗ + Sắt + Key + Đặc sản). Cuối lượt nếu vượt quá 8 đơn vị sẽ phải bỏ bớt Gỗ/Lúa dư.</li>
                        <li><strong>Giới hạn Chìa Khóa trong kho:</strong> Mỗi loại Chìa Khóa chỉ có thể chứa <strong>tối đa 1 cái</strong> trong kho tại một thời điểm (Ví dụ: <code>Key 1 tối đa 1/1</code>, <code>Key 2 tối đa 1/1</code>, <code>Key 3 tối đa 1/1</code>).</li>
                    </ul>
                    <h4>2. Luật Khai Thác Tài Nguyên (Ngoài Khơi &amp; Ven Bờ)</h4>
                    <ul>
                        <li>Các ô khai thác Lúa (hồi 2 vòng), Gỗ (hồi 3 vòng), Sắt (hồi 4 vòng) phân bố cả ven bờ lẫn ngoài biển xa đất liền.</li>
                        <li>Khi khai thác (tốn 1 AP) và trả lời câu hỏi Địa lý:
                            <ul>
                                <li><strong>Trả lời ĐÚNG:</strong> Nhận <strong>+2 Tài nguyên</strong> cùng loại (Không nhận Xu).</li>
                                <li><strong>Trả lời SAI:</strong> Nhận <strong>+1 Tài nguyên</strong> cùng loại (Không nhận Xu; riêng trong pha Siêu Bão Yagi nếu trả lời sai sẽ bị Sét đánh <code>-1 HP</code>).</li>
                            </ul>
                        </li>
                    </ul>
                </div>
            `,
            monuments_traps: `
                <div class="rule-detail-section">
                    <h4>1. Chi Phí Mở Cổng &amp; Giới Hạn Di Tích Cấp 1 (Easy)</h4>
                    <ul>
                        <li><strong>🟢 Di tích Cấp 1 – Dễ (Easy):</strong> Yêu cầu <code>1 Key 1 + 1 Lúa + 2 Xu + 1 AP</code> → Thưởng <strong>1 Bảo Vật + 3 Xu</strong>.<br/>
                        ⛔ <strong>Giới hạn quan trọng:</strong> Mỗi người chơi <strong>chỉ được phép vào Di tích Cấp 1 tối đa 1 lần</strong> trong cả ván đấu! Để thắng đủ 3 Bảo Vật, bạn bắt buộc phải chinh phục thêm các Di tích Cấp 2 và Cấp 3.</li>
                        <li><strong>🟡 Di tích Cấp 2 – Trung Bình (Medium):</strong> Yêu cầu <code>1 Key 2 + 2 Lúa + 3 Xu + 1 AP</code> → Thưởng <strong>1 Bảo Vật + 4 Xu</strong>.</li>
                        <li><strong>🔴 Di tích Cấp 3 – Khó (Hard):</strong> Yêu cầu <code>1 Key 3 + 3 Lúa + 1 Sắt + 6 Xu + 1 AP</code> → Thưởng <strong>1 Bảo Vật + 5 Xu</strong> (Sau khi có người chinh phục thành công, Di tích Cấp 3 sẽ khóa vĩnh viễn).</li>
                    </ul>
                    <h4>2. Cơ Quan Bẫy Cổ Đại Khi Trả Lời Sai Tại Di Tích</h4>
                    <ul>
                        <li><strong>Sai ở Di tích Cấp 1 (Easy):</strong> Kích hoạt <strong>🏹 Bẫy Mũi Tên</strong> bắn xuống thuyền → Phạt <strong>-1 ❤️ HP</strong>.</li>
                        <li><strong>Sai ở Di tích Cấp 2 (Medium):</strong> Kích hoạt <strong>🪨 Bẫy Đá Lăn</strong> từ sườn núi → Phạt <strong>-2 ❤️ HP</strong>.</li>
                        <li><strong>Sai ở Di tích Cấp 3 (Hard):</strong> Kích hoạt <strong>⚡🪨 Bẫy Sét Đánh &amp; Đá Lăn</strong> → Phạt <strong>-3 ❤️ HP</strong> và bị sóng đẩy lùi ra biển!</li>
                    </ul>
                </div>
            `,
            weather_events: `
                <div class="rule-detail-section">
                    <h4>1. Đồng Hồ Thời Gian Thực &amp; 6 Pha Thời Tiết Trong Ván Đấu (45 Phút)</h4>
                    <ul>
                        <li><strong>Pha 1 (00:00 – 15:00) — ☀️ Nắng Biển Đông:</strong> Biển êm dịu, tầm nhìn xa, di chuyển tiêu chuẩn <code>1 AP = 2 ô</code>.</li>
                        <li><strong>Pha 2 (15:00 – 20:00) — 🌧️ Mưa Nhiệt Đới:</strong> Mây đen kéo tới, mưa rào báo hiệu cơn giông sắp đổ bộ.</li>
                        <li><strong>Pha 3 (20:00 – 27:00, kéo dài 7 phút) — ⛈️ Giông Bão:</strong>
                            <ul>
                                <li>Toàn bản đồ nhận cùng <strong>1 đoạn văn đọc hiểu Địa lý ngắn</strong>, nhưng mỗi người chơi nhận <strong>1 câu hỏi riêng biệt</strong> với đồng hồ đếm ngược <strong>1 phút 30 giây</strong>. Ai trả lời sai hoặc để hết giờ sẽ bị <strong>Sét Đánh (-2 ❤️ HP)</strong>!</li>
                                <li>Trong suốt 7 phút Giông Bão, <strong>4 ô khai thác tài nguyên bị phong tỏa (⛔ Bão Cấm Vào)</strong>, tàu thuyền không thể đi vào hay khai thác.</li>
                            </ul>
                        </li>
                        <li><strong>Pha 4 (27:00 – 29:00, 2 phút) — 🌅 Hoàng Hôn &amp; Pha 5 (29:00 – 34:00, 5 phút) — 🌌 Đêm Sao:</strong>
                            <ul>
                                <li>Biển lặng sau bão, việc khai thác tài nguyên thuận lợi hơn: <strong>Thời gian hồi (cooldown) của mọi ô tài nguyên giảm đi 1 vòng!</strong></li>
                            </ul>
                        </li>
                        <li><strong>Pha 6 (34:00 – 45:00) — 🌀 Siêu Bão Yagi (BÁO ĐỘNG ĐỎ):</strong>
                            <ul>
                                <li>Màn hình phát tín hiệu <strong>🚨 BÁO ĐỘNG ĐỎ — SIÊU BÃO YAGI</strong>.</li>
                                <li>Sóng dữ khiến <strong>1 AP chỉ di chuyển được 1 ô nước</strong> (tối đa 3 ô/lượt).</li>
                                <li>Sau khi sử dụng hết <strong>4 AP</strong> trong lượt, người chơi bắt buộc phải trả lời <strong>Câu Hỏi Tâm Bão Yagi</strong>: Trả lời ĐÚNG nhận <strong>+1 💰 Xu</strong>; trả lời SAI bị <strong>Sét Đánh cộng dồn</strong> (Sai lần 1: <code>-1 HP</code>, Sai lần 2: <code>-2 HP</code>, Sai lần 3 trở đi: tối đa <code>-3 HP</code>).</li>
                                <li>Trong Siêu Bão Yagi không cấm các ô khai thác tài nguyên, nhưng nếu trả lời <strong>SAI</strong> câu hỏi khai thác tài nguyên cũng sẽ bị <strong>Sét Đánh (-1 ❤️ HP)</strong>!</li>
                            </ul>
                        </li>
                    </ul>
                </div>
            `
        };

        const html = `
            <div class="modal-header-badge" style="background:#0284c733; border-color:#38bdf8">
                <span>📘 CẨM NANG LUẬT CHƠI CHI TIẾT TOÀN TẬP – THE GOLDEN JOURNEY V7.0</span>
                <span class="badge-tag">Phân Mục Đầy Đủ</span>
            </div>
            <h2 class="modal-title">Chi Tiết Toàn Bộ Cơ Chế, Bảng Giá, Kho Chứa &amp; Sự Kiện Thời Tiết</h2>
            <div class="rule-cat-tabs">
                ${tabs.map(t => `
                    <button class="rule-cat-tab ${category === t.id ? 'active' : ''}"
                            onclick="window.GAME.openRulebookModal('${t.id}')">
                        ${t.label}
                    </button>
                `).join("")}
            </div>
            ${sectionContent[category] || sectionContent.overview}
            <div class="modal-actions" style="justify-content:space-between">
                <button class="btn-secondary" onclick="window.GAME.openRulebookModal(null)">⬅️ Quay Lại Tóm Tắt Luật</button>
                <button class="btn-primary-gold" onclick="window.GAME.closeModal()">Đã Hiểu Toàn Bộ Luật</button>
            </div>
        `;
        this.showModal(html);
    }

    // ------------------------------------------------------------------------
    // MODAL SYSTEM WITH TOP-RIGHT CLOSE BUTTON ON EVERY WINDOW
    // ------------------------------------------------------------------------
    showModal(innerHTML) {
        clearInterval(this.quizAutoCloseInterval);
        const overlay = document.getElementById("modal-overlay");
        const content = document.getElementById("modal-content");
        const topRightCloseBtn = `<button type="button" class="modal-top-close-btn" onclick="window.GAME.handleTopRightModalClose()" title="Đóng cửa sổ (Góc phải đầu trang)">✕</button>`;
        content.innerHTML = topRightCloseBtn + innerHTML;
        content.style.transform = "translate(0px, 0px)";
        content.dataset.dragX = "0";
        content.dataset.dragY = "0";
        overlay.classList.remove("hidden");

        // Make the modal header badge draggable so players can move any modal window out of the way!
        const headerBadge = content.querySelector(".modal-header-badge") || content.querySelector(".spectator-quiz-banner");
        if (headerBadge) {
            headerBadge.style.cursor = "grab";
            headerBadge.title = "Giữ chuột trái để kéo di chuyển cửa sổ này sang vị trí khác";
            headerBadge.dataset.dragTarget = "modal-content";
            headerBadge.classList.add("draggable-handle");
        }
    }

    handleTopRightModalClose() {
        window.SFX.playClick();
        if (this.currentQuizCloseCallback) {
            this.closeQuizResultNow();
            return;
        }
        // If closing the Opening Speed Quiz modal with the top-right ✕ button,
        // immediately finalize and start Round 1 so the match never gets stuck in "turn_order_quiz"!
        if (this.isGameStarted && (this.roomState.status === "turn_order_quiz" || (this.openingQuizState && !this.openingQuizState.matchStarted))) {
            this.confirmStartMatchAfterOpeningQuiz();
            return;
        }
        if (!this.isMyTurn() && this.liveQuizState) {
            if (this.liveQuizState.phase === "asking") {
                this.spectatorCloseQuizDuringAsking(this.liveQuizState.id);
                return;
            }
            if (this.liveQuizState.phase === "answered") {
                this.spectatorHideAnsweredQuiz(this.liveQuizState.id);
                return;
            }
        }
        if (this.currentPortTile) {
            this.currentPortTile = null;
            this.finishPortVisit();
            return;
        }
        this.closeModal();
    }

    closeModal(fromSpectatorSync = false) {
        clearInterval(this.quizAutoCloseInterval);
        this.currentQuizCloseCallback = null;
        document.getElementById("modal-overlay").classList.add("hidden");
        // If active player closes their quiz modal, clear liveQuizState on server
        if (!fromSpectatorSync && this.isMyTurn() && this.liveQuizState) {
            this.liveQuizState = null;
            this.syncMultiplayerGameState();
        }
        // Check if active player now has 0 AP after closing modal -> Auto-end turn!
        if (!fromSpectatorSync && this.isMyTurn()) {
            this.checkAutoEndTurnIfNoAP();
        }
    }

    // ------------------------------------------------------------------------
    // MINECRAFT-STYLE SANDBOX / CREATIVE MODE CONTROLS (CHẾ ĐỘ SÁNG TẠO)
    // ------------------------------------------------------------------------
    enableSandboxCreativeMode(openPanel = true) {
        this.sandboxMode = true;
        this.sandboxInfiniteMove = true;
        const infBtn = document.getElementById("btn-sb-inf-move") || document.getElementById("sb-btn-inf-move");
        if (infBtn) {
            infBtn.classList.add("active");
            infBtn.innerHTML = "♾️ Di Chuyển &amp; AP Vô Hạn: <strong>BẬT</strong>";
        }
        const sbPanel = document.getElementById("sandbox-creative-panel");
        if (sbPanel && openPanel) {
            sbPanel.classList.remove("hidden");
        }
        this.refreshReachableHexes();
        this.updateUI();
    }

    toggleSandboxPanel() {
        window.SFX.playClick();
        const sbPanel = document.getElementById("sandbox-creative-panel");
        if (!sbPanel) return;
        const willOpen = sbPanel.classList.contains("hidden");
        if (willOpen) {
            sbPanel.classList.remove("hidden");
            if (!this.sandboxMode) {
                this.enableSandboxCreativeMode(true);
                this.showToast("🛠️ Đã bật Chế Độ Sáng Tạo (Sandbox)! Tự do di chuyển vô hạn & tùy chỉnh tài nguyên!");
            }
        } else {
            sbPanel.classList.add("hidden");
        }
    }

    toggleSandboxInfiniteMove() {
        window.SFX.playClick();
        this.sandboxMode = true;
        this.sandboxInfiniteMove = !this.sandboxInfiniteMove;
        const btn = document.getElementById("btn-sb-inf-move") || document.getElementById("sb-btn-inf-move");
        if (btn) {
            btn.classList.toggle("active", this.sandboxInfiniteMove);
            btn.innerHTML = `♾️ Di Chuyển &amp; AP Vô Hạn: <strong>${this.sandboxInfiniteMove ? 'BẬT' : 'TẮT'}</strong>`;
        }
        const p = this.getLocalPlayer() || this.getActivePlayer();
        if (p && this.sandboxInfiniteMove) {
            p.ap = 5;
            p.moveApSpent = 0;
        }
        this.refreshReachableHexes();
        this.updateUI();
        this.showToast(this.sandboxInfiniteMove
            ? "♾️ Đã BẬT Di Chuyển & AP Vô Hạn! Bạn có thể lái thuyền tới bất kỳ ô nước nào trên bản đồ!"
            : "⛵ Đã TẮT Di Chuyển Vô Hạn (Quay về luật 5 AP tiêu chuẩn).");
    }

    toggleSandboxTeleport() {
        window.SFX.playClick();
        this.sandboxMode = true;
        this.sandboxTeleport = !this.sandboxTeleport;
        const btn = document.getElementById("btn-sb-teleport") || document.getElementById("sb-btn-teleport");
        if (btn) {
            btn.classList.toggle("active", this.sandboxTeleport);
            btn.innerHTML = `⚡ Click Ô Để Dịch Chuyển: <strong>${this.sandboxTeleport ? 'BẬT' : 'TẮT'}</strong>`;
        }
        this.showToast(this.sandboxTeleport
            ? "⚡ Đã BẬT Dịch Chuyển Tức Thời! Bấm vào bất kỳ ô biển/cảng/di tích nào để bay tới ngay!"
            : "⛵ Đã TẮT Dịch Chuyển Tức Thời.");
    }

    sandboxTriggerInstantWin() {
        window.SFX.playRelicFanfare();
        const p = this.getLocalPlayer() || this.getActivePlayer();
        if (!p) return;
        const allMons = window.GAME_DATA.monuments || [];
        p.relics = allMons.slice(0, 3).map(m => ({
            id: m.id,
            name: m.relicName,
            icon: m.relicIcon,
            monumentName: m.name
        }));
        this.matchWinner = p;
        this.updateUI();
        this.syncMultiplayerGameState();
        this.showVictoryScreen(p);
    }

    sandboxAdjustStat(stat, delta) {
        window.SFX.playCoin();
        const p = this.getLocalPlayer() || this.getActivePlayer();
        if (!p) return;
        if (stat === "coins") {
            p.coins = Math.max(0, Math.min(15, (p.coins || 0) + delta));
        } else if (stat === "hp") {
            p.maxHp = Math.max(5, p.maxHp || 5);
            p.hp = Math.max(1, Math.min(20, (p.hp || 5) + delta));
            if (p.hp > p.maxHp) p.maxHp = p.hp;
            p.eliminated = false;
        } else if (stat === "ap") {
            p.ap = Math.max(0, (p.ap || 0) + delta);
            p.moveApSpent = 0;
        } else if (stat === "food" || stat === "wood" || stat === "iron") {
            p[stat] = Math.max(0, (p[stat] || 0) + delta);
        }
        this.refreshReachableHexes();
        this.updateUI();
        this.syncMultiplayerGameState();
    }

    sandboxAdjustKeys(delta) {
        window.SFX.playCoin();
        const p = this.getLocalPlayer() || this.getActivePlayer();
        if (!p) return;
        [1, 2, 3].forEach(k => {
            p.keys[k] = Math.max(0, Math.min(1, (p.keys[k] || 0) + delta));
        });
        this.updateUI();
        this.syncMultiplayerGameState();
        this.showToast(`🗝️ [Sáng Tạo] Key 1/2/3 hiện tại (Tối đa 1 mỗi loại): ${p.keys[1]}/${p.keys[2]}/${p.keys[3]}`);
    }

    sandboxGrantSerpentCoin() {
        window.SFX.playRelicFanfare();
        const p = this.getLocalPlayer() || this.getActivePlayer();
        if (!p) return;
        p.hasSerpentCoin = true;
        this.updateUI();
        this.syncMultiplayerGameState();
        this.showToast("🐍 [Sáng Tạo] Đã trang bị Đồng Xu Mãng Xà (Tự động hồi 2 HP khi máu về 0)!");
    }

    sandboxResetPortMarket() {
        window.SFX.playCoin();
        this.resetAllPortInventories(true);
        this.updateUI();
        this.syncMultiplayerGameState();
    }

    sandboxSetWeatherPhase(phaseKey) {
        window.SFX.playClick();
        const startSecondsMap = {
            sunny: 0,
            tropical_rain: 900,
            thunderstorm: 1200,
            sunset: 1620,
            night: 1740,
            super_typhoon_yagi: 2040
        };
        this.matchElapsedSec = startSecondsMap[phaseKey] !== undefined ? startSecondsMap[phaseKey] : 0;
        if (phaseKey === "thunderstorm") {
            this.thunderstormChallengeTriggered = false;
        }
        this.applyWeatherPhase(phaseKey, true);
        this.updateUI();
        this.syncMultiplayerGameState();
    }

    sandboxAdjustRelic(delta) {
        window.SFX.playRelicFanfare();
        const p = this.getLocalPlayer() || this.getActivePlayer();
        if (!p) return;
        if (delta > 0) {
            const nextMon = (window.GAME_DATA.monuments || []).find(m => !p.relics.some(r => r.id === m.id))
                || window.GAME_DATA.monuments[0];
            if (nextMon) {
                p.relics.push({
                    id: nextMon.id + "_" + Date.now(),
                    name: nextMon.relicName,
                    icon: nextMon.relicIcon,
                    monumentName: nextMon.name
                });
            }
            if (p.relics.length >= 3) {
                this.updateUI();
                this.syncMultiplayerGameState();
                this.showVictoryScreen(p);
                return;
            }
        } else if (delta < 0 && p.relics.length > 0) {
            p.relics.pop();
        }
        this.updateUI();
        this.syncMultiplayerGameState();
        this.showToast(`👑 [Sáng Tạo] Số Bảo Vật Hoàng Gia: ${p.relics.length}/3`);
    }

    sandboxResetCooldowns() {
        window.SFX.playMine();
        this.world.hexTiles.forEach(t => {
            t.resourceCooldown = 0;
            t.monumentLocked = false;
        });
        this.world.updateResourceVisuals();
        const p = this.getLocalPlayer() || this.getActivePlayer();
        if (p) {
            p.tier1Visited = 0;
            // Also grant 1 specialty from each region if cargo has space
            window.GAME_DATA.regions.forEach(reg => {
                if (p.specialties.length < 6 && !p.specialties.some(s => s.regionId === reg.id)) {
                    p.specialties.push({
                        regionId: reg.id,
                        name: reg.specialty.shortName,
                        icon: reg.specialty.icon
                    });
                }
            });
        }
        this.updateUI();
        this.syncMultiplayerGameState();
        this.showToast("🌱 [Sáng Tạo] Đã hồi 100% các Mỏ Tài Nguyên, mở khóa toàn bộ Di tích & tặng Đặc sản 6 Vùng!");
    }

    sandboxSpawnNPC() {
        window.SFX.playCoin();
        const tile = this.world.spawnRareNPCOnRandomSeaHex();
        if (tile) {
            this.updateUI();
            this.syncMultiplayerGameState();
            this.world.focusCameraOnHex(tile.q, tile.r);
            this.showToast(`🧙‍♂️ [Sáng Tạo] Đã triệu hồi Tiên Ông Rìu Vàng tại ô biển (${tile.q}, ${tile.r})!`);
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

    initDraggableWindows() {
        let activeTarget = null;
        let startPointerX = 0;
        let startPointerY = 0;
        let initialOffsetX = 0;
        let initialOffsetY = 0;

        window.addEventListener("pointerdown", (e) => {
            if (e.button !== 0) return;
            // Ignore clicks on buttons or inputs inside the header
            if (e.target.closest("button") || e.target.closest("input") || e.target.closest("select")) return;

            const handle = e.target.closest(".draggable-handle");
            if (!handle) return;

            const targetId = handle.dataset.dragTarget;
            const targetEl = targetId ? document.getElementById(targetId) : handle.closest(".glass-panel");
            if (!targetEl) return;

            activeTarget = targetEl;
            startPointerX = e.clientX;
            startPointerY = e.clientY;
            initialOffsetX = parseFloat(targetEl.dataset.dragX || "0") || 0;
            initialOffsetY = parseFloat(targetEl.dataset.dragY || "0") || 0;
            handle.style.cursor = "grabbing";
            e.preventDefault();
        });

        window.addEventListener("pointermove", (e) => {
            if (!activeTarget) return;
            const dx = e.clientX - startPointerX;
            const dy = e.clientY - startPointerY;
            const nextX = initialOffsetX + dx;
            const nextY = initialOffsetY + dy;
            activeTarget.dataset.dragX = String(nextX);
            activeTarget.dataset.dragY = String(nextY);
            activeTarget.style.transform = `translate(${nextX}px, ${nextY}px)`;
        });

        const stopDrag = () => {
            if (!activeTarget) return;
            const handles = activeTarget.querySelectorAll(".draggable-handle");
            handles.forEach(h => { h.style.cursor = "grab"; });
            activeTarget = null;
        };

        window.addEventListener("pointerup", stopDrag);
        window.addEventListener("pointercancel", stopDrag);
    }

    bindUIEvents() {
        this.initDraggableWindows();

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
        const marketBtn = document.getElementById("btn-open-market");
        if (marketBtn) {
            marketBtn.addEventListener("click", () => {
                window.SFX.playClick();
                this.openMaritimeMarketModal();
            });
        }
        const clockWeatherEl = document.getElementById("hud-clock-weather");
        if (clockWeatherEl) {
            clockWeatherEl.style.cursor = "pointer";
            clockWeatherEl.addEventListener("click", () => {
                window.SFX.playClick();
                this.openRulebookModal("weather_events");
            });
        }
        const tickerToggleBtn = document.getElementById("btn-toggle-ticker");
        if (tickerToggleBtn) {
            tickerToggleBtn.addEventListener("click", () => {
                this.toggleLiveTicker();
            });
        }
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
        const camLockBtn = document.getElementById("btn-camera-lock");
        if (camLockBtn) {
            camLockBtn.addEventListener("click", () => {
                window.SFX.playClick();
                const targetP = this.getLocalPlayer() || this.getActivePlayer();
                const locked = this.world.toggleCameraLock(targetP);
                camLockBtn.textContent = locked ? "🔒 Khóa Góc Nhìn: Bật" : "🔒 Khóa Góc Nhìn: Tắt";
                camLockBtn.classList.toggle("active-lock-btn", locked);
                this.showToast(locked
                    ? "🔒 Đã BẬT Khóa Góc Nhìn! Camera sẽ tự động di chuyển bám theo thuyền của bạn!"
                    : "🔓 Đã TẮT Khóa Góc Nhìn (Camera di chuyển tự do).");
            });
        }
        const minModeBtn = document.getElementById("btn-minimalist-mode");
        if (minModeBtn) {
            minModeBtn.addEventListener("click", () => {
                window.SFX.playClick();
                const minimal = this.world.toggleMinimalistMode();
                minModeBtn.textContent = minimal ? "🌿 Tối Giản: Bật" : "🌿 Tối Giản: Tắt";
                minModeBtn.classList.toggle("active-minimalist-btn", minimal);
                this.showToast(minimal
                    ? "🌿 Đã BẬT Chế Độ Tối Giản! Đã tắt chim, cá, thuyền nhỏ và các hiệu ứng đèn/khói phụ."
                    : "✨ Đã TẮT Chế Độ Tối Giản! Đã bật lại toàn bộ sinh vật biển, chim bay và hiệu ứng.");
            });
        }
        const cloudsBtn = document.getElementById("btn-toggle-clouds");
        if (cloudsBtn) {
            cloudsBtn.addEventListener("click", () => {
                window.SFX.playClick();
                const visible = this.world.toggleClouds();
                cloudsBtn.textContent = visible ? "☁️ Mây: Bật" : "☁️ Mây: Tắt";
                cloudsBtn.classList.toggle("active-cloud-btn", visible);
                this.showToast(visible ? "☁️ Đã BẬT hiển thị các đám mây trên bầu trời!" : "🌤️ Đã TẮT toàn bộ đám mây trên trời để nhìn bản đồ thoáng hơn!");
            });
        }
        const sandboxBtn = document.getElementById("btn-toggle-sandbox");
        if (sandboxBtn) {
            sandboxBtn.addEventListener("click", () => {
                this.toggleSandboxPanel();
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
    }
}

window.addEventListener("DOMContentLoaded", () => {
    window.GAME = new GoldenJourneyGame();
});
