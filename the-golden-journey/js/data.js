// ============================================================================
// THE GOLDEN JOURNEY (HÀNH TRÌNH VÀNG SON) — V3.0 MATURE EDITION
// - Mature Cartographic & Historical Color Palette (Earth, Ochre, Slate, Terracotta)
// - Exact Author/License/URL Copyright Citations for all Photos & Articles
// - Visual Memory Cards (Illustrative Image + Caption + Source) on EVERY Quiz!
// ============================================================================

window.GAME_DATA = {
    // 6 FIXED ECONOMIC REGIONS (Mature, Historical Cartographic Palette)
    regions: [
        {
            id: 0,
            code: "TDMNBB",
            name: "Trung du & Miền núi Bắc Bộ",
            enName: "Northern Midlands & Mountains",
            color: "#2d7a36", // Lush Forest Emerald Green (matches reference map)
            accent: "#1b5222",
            terrainDesc: "Địa hình núi cao hùng vĩ (Hoàng Liên Sơn), khối núi đá vôi Karst (Hà Giang, Cao Bằng, Hạ Long) và đồi bát úp trung du.",
            climateDesc: "Nhiệt đới ẩm gió mùa có mùa đông lạnh nhất cả nước do gió mùa Đông Bắc và độ cao địa hình.",
            strengths: "Khai thác khoáng sản số 1 cả nước (than Quảng Ninh, apatit Lào Cai, sắt Thái Nguyên), thủy điện trữ năng lớn nhất (Sơn La, Hòa Bình, Lai Châu), cây công nghiệp cận nhiệt (Chè) và du lịch sinh thái biển đảo.",
            specialty: {
                id: "spec_0",
                name: "Chè Shan Tuyết Cổ Thụ & Than Đá Quảng Ninh",
                shortName: "Chè Shan & Than Quảng Ninh",
                icon: "🍃",
                baseCost: 2,
                desc: "Búp chè tuyết trắng trên đỉnh núi mù sương Tây Bắc kết hợp nguồn 'vàng đen' than Antraxit tốt nhất Đông Nam Á."
            }
        },
        {
            id: 1,
            code: "DBSH",
            name: "Đồng bằng Sông Hồng",
            enName: "Red River Delta",
            color: "#f5b81c", // Bright Golden Harvest Yellow (matches reference map)
            accent: "#c98a09",
            terrainDesc: "Đồng bằng châu thổ do phù sa hệ thống sông Hồng và sông Thái Bình bồi đắp, có hệ thống đê ngăn lũ lịch sử hàng ngàn năm.",
            climateDesc: "Nhiệt đới ẩm gió mùa có mùa đông lạnh, tạo lợi thế độc nhất để phát triển vụ Đông thành vụ sản xuất chính.",
            strengths: "Trình độ thâm canh lúa nước dẫn đầu cả nước (năng suất lúa tạ/ha cao nhất), trung tâm kinh tế - tài chính - khoa học công nghệ Hà Nội - Hải Phòng - Bắc Ninh.",
            specialty: {
                id: "spec_1",
                name: "Gốm Sứ Bát Tràng & Lụa Tơ Tằm Vạn Phúc",
                shortName: "Gốm Bát Tràng & Lụa Cổ",
                icon: "🏺",
                baseCost: 2,
                desc: "Tinh hoa làng nghề thủ công mỹ nghệ ngàn năm văn hiến bên bờ sông Hồng."
            }
        },
        {
            id: 2,
            code: "BTBDHMT",
            name: "Bắc Trung Bộ & Duyên hải Miền Trung",
            enName: "North Central & Central Coast",
            color: "#5a7f91", // Coastal Citadel Slate Teal (matches reference map)
            accent: "#3b5968",
            terrainDesc: "Lãnh thổ hẹp ngang, kéo dài dọc bờ biển; phía Tây là dãy Trường Sơn hùng vĩ, phía Đông là dải đồng bằng ven biển và nhiều vũng vịnh nước sâu.",
            climateDesc: "Mùa hạ có gió Phơn Tây Nam khô nóng; mùa mưa lệch về thu - đông kèm theo bão nhiệt đới từ Biển Đông.",
            strengths: "Kinh tế biển tổng hợp (hệ thống cảng nước sâu Nghi Sơn, Vũng Áng, Đà Nẵng, Dung Quất, Vân Phong, Cam Ranh; nghề cá, nghề muối Cà Ná - Sa Huỳnh) và Con đường Di sản Thế giới.",
            specialty: {
                id: "spec_2",
                name: "Yến Sào Đảo Yến & Muối Tinh Khiết Sa Huỳnh",
                shortName: "Yến Sào & Muối Biển",
                icon: "🕊️",
                baseCost: 2,
                desc: "Báu vật dinh dưỡng từ những vách đá đảo khơi xa Khánh Hòa và cánh đồng muối trắng miền Trung."
            }
        },
        {
            id: 3,
            code: "TN",
            name: "Tây Nguyên",
            enName: "Central Highlands",
            color: "#994920", // Rich Basalt Earth Brown-Sienna (matches reference map)
            accent: "#6b3012",
            terrainDesc: "Các cao nguyên xếp tầng bề mặt rộng lớn (Kon Tum, Pleiku, Đắk Lắk, Mơ Nông, Lâm Viên, Di Linh) phủ lớp đất đỏ bazan dày màu mỡ.",
            climateDesc: "Cận xích đạo gió mùa phân hóa hai mùa mưa - khô rõ rệt; khí hậu mát mẻ trên các cao nguyên cao.",
            strengths: "Vùng chuyên canh cây công nghiệp lâu năm lớn nhất Việt Nam (Cà phê số 1 cả nước, hồ tiêu, cao su, chè Lâm Đồng), thủy điện bậc thang và trữ lượng quặng Bô-xít hàng tỷ tấn.",
            specialty: {
                id: "spec_3",
                name: "Cà Phê Buôn Ma Thuột & Hồ Tiêu Đất Đỏ",
                shortName: "Cà Phê Đất Đỏ Bazan",
                icon: "☕",
                baseCost: 2,
                desc: "Hạt cà phê Robusta thơm nồng trứ danh thế giới kết tinh từ tầng đất đỏ bazan núi lửa cổ."
            }
        },
        {
            id: 4,
            code: "DNB",
            name: "Đông Nam Bộ",
            enName: "Southeastern Region",
            color: "#8a2430", // Deep Imperial Crimson-Burgundy (matches reference map)
            accent: "#5e141d",
            terrainDesc: "Địa hình bán bình nguyên chuyển tiếp từ cao nguyên xuống đồng bằng, độ cao 20–200m, giàu đất đỏ bazan và đất xám phù sa cổ.",
            climateDesc: "Cận xích đạo nóng ẩm quanh năm, nền nhiệt cao ổn định, rất ít chịu ảnh hưởng trực tiếp của bão.",
            strengths: "Đầu tàu kinh tế số 1 Việt Nam (dẫn đầu GDP, công nghiệp công nghệ cao, xuất nhập khẩu và thu hút FDI), khai thác dầu khí thềm lục địa (Bạch Hổ, Rồng, Lan Tây) và thủ phủ cây Cao su.",
            specialty: {
                id: "spec_4",
                name: "Mủ Cao Su Tự Nhiên & Dầu Thô Thềm Lục Địa",
                shortName: "Vàng Trắng Cao Su & Dầu Khí",
                icon: "🛢️",
                baseCost: 2,
                desc: "Nguồn nguyên liệu chiến lược từ những cánh rừng cao su bạt ngàn Bình Phước - Đồng Nai và giàn khoan dầu khí Vũng Tàu."
            }
        },
        {
            id: 5,
            code: "DBSCL",
            name: "Đồng bằng Sông Cửu Long",
            enName: "Mekong River Delta",
            color: "#659b38", // Vibrant Alluvial Lime-Olive Green (matches reference map)
            accent: "#446e22",
            terrainDesc: "Đồng bằng châu thổ rộng lớn nhất (~40.000 km²), địa hình thấp phẳng, mạng lưới sông Tiền - sông Hậu và kênh rạch chằng chịt.",
            climateDesc: "Cận xích đạo nóng ẩm, chế độ nước điều hòa kết hợp mùa nước nổi mang phù sa và nguồn lợi thủy sản phong phú.",
            strengths: "Vựa lúa số 1 Việt Nam (>50% sản lượng lúa và >90% xuất khẩu gạo cả nước), dẫn đầu về nuôi trồng & đánh bắt thủy sản (cá tra, tôm) và vựa trái cây nhiệt đới.",
            specialty: {
                id: "spec_5",
                name: "Gạo Thơm ST25 & Trái Cây Miệt Vườn Chín Rồng",
                shortName: "Ngọc Thực Gạo ST25",
                icon: "🌾",
                baseCost: 2,
                desc: "Hạt gạo ngon nhất thế giới và nông sản trù phú từ vùng châu thổ Cửu Long."
            }
        }
    ],

    // ========================================================================
    // 9 RELIC MONUMENTS WITH EXACT PHOTO AUTHOR ATTRIBUTION & TIERED QUIZZES
    // ========================================================================
    monuments: [
        {
            id: "mon_halong",
            name: "Vịnh Hạ Long",
            enName: "Ha Long Bay",
            regionId: 0,
            province: "Quảng Ninh",
            modelType: "karst_archipelago",
            image: "assets/monuments/halong.jpg",
            photoAuthor: "Tác giả ảnh: NKSTTSSHNVN (Wikimedia Commons)",
            photoLicense: "Giấy phép: CC BY-SA 4.0",
            photoSourceUrl: "https://commons.wikimedia.org/wiki/File:V%E1%BB%8Bnh_H%E1%BA%A1_Long_-_NKS.jpg",
            articleSourceCite: "Tham khảo học thuật: Hồ sơ Di sản Thế giới UNESCO (Ref. 672bis), Cổng TTĐT tỉnh Quảng Ninh & Chuyên trang Địa lý Báo Nhân Dân.",
            npcName: "Lão Ngư Truyền Thuyết Hạ Long",
            npcRole: "Người Gác Đảo Đá Vôi",
            relicName: "Ngọc Châu Rồng Thiêng Hạ Long",
            relicIcon: "🐉",
            geographyLesson: {
                headline: "Kỳ quan Địa mạo Karst ngập nước độc nhất vô nhị trên thế giới",
                summary: "Vịnh Hạ Long có diện tích 1.553 km² với 1.969 hòn đảo đá vôi lớn nhỏ. Đây là kết quả của quá trình kiến tạo địa chất kéo dài hơn 500 triệu năm kết hợp với quá trình biển tiến Holocen làm ngập chìm địa hình Karst trưởng thành.",
                keyFacts: [
                    "Địa chất - Địa mạo: Hội tụ đầy đủ các dạng Karst hình chóp (fengcong) và Karst hình tháp (fenglin) ngập trong làn nước biển xanh ngọc.",
                    "Giá trị Kinh tế Vùng: Quảng Ninh là tỉnh duy nhất của vùng Trung du & Miền núi Bắc Bộ có biển, nổi tiếng với du lịch di sản, cảng Cái Lân và bể than Antraxit lớn nhất Đông Nam Á.",
                    "Đa dạng sinh học: Bảo tồn hệ sinh thái rừng thường xanh trên đảo đá vôi, hệ sinh thái tùng - áng (hồ nước mặn kín giữa đảo đá) và rạn san hô."
                ]
            },
            tieredQuizzes: {
                1: [
                    {
                        q: "[Cấp 1 - Dễ] Vịnh Hạ Long thuộc tỉnh nào và nằm trong vùng kinh tế nào của Việt Nam?",
                        options: [
                            "Tỉnh Quảng Ninh – Vùng Trung du và Miền núi Bắc Bộ",
                            "Thành phố Hải Phòng – Vùng Đồng bằng Sông Hồng",
                            "Tỉnh Thanh Hóa – Vùng Bắc Trung Bộ",
                            "Tỉnh Khánh Hòa – Vùng Duyên hải Nam Trung Bộ"
                        ],
                        correct: 0,
                        explanation: "Vịnh Hạ Long thuộc tỉnh Quảng Ninh — tỉnh ven biển duy nhất nằm trong vùng kinh tế Trung du và Miền núi Bắc Bộ.",
                        visualImg: "assets/monuments/halong.jpg",
                        visualCaption: "Quần thể đảo đá vôi Vịnh Hạ Long tại tỉnh Quảng Ninh (Vùng Trung du & Miền núi Bắc Bộ).",
                        visualCredit: "Ảnh: NKSTTSSHNVN / Wikimedia Commons (CC BY-SA 4.0) • Nguồn: UNESCO World Heritage Centre"
                    },
                    {
                        q: "[Cấp 1 - Dễ] Khoáng sản nhiên liệu nào nổi tiếng nhất được khai thác với trữ lượng lớn nhất cả nước tại tỉnh Quảng Ninh (quê hương Vịnh Hạ Long)?",
                        options: [
                            "Than đá (Than Antraxit)",
                            "Quặng Bô-xít",
                            "Dầu mỏ ngoài khơi",
                            "Đá đỏ Ruby"
                        ],
                        correct: 0,
                        explanation: "Bể than Đông Bắc tại Quảng Ninh chiếm trên 90% trữ lượng than đá của toàn Việt Nam, cung cấp nhiên liệu cho nhiệt điện và xuất khẩu.",
                        visualImg: "assets/monuments/halong.jpg",
                        visualCaption: "Quảng Ninh vừa sở hữu Di sản Vịnh Hạ Long vừa có bể than đá Antraxit lớn nhất Đông Nam Á.",
                        visualCredit: "Ảnh: NKSTTSSHNVN / Wikimedia Commons (CC BY-SA 4.0) • Nguồn: Cổng TTĐT tỉnh Quảng Ninh"
                    }
                ],
                2: [
                    {
                        q: "[Cấp 2 - Trung bình] Đặc trưng địa chất - địa mạo nổi bật nhất giúp Vịnh Hạ Long hai lần được UNESCO vinh danh là Di sản Thiên nhiên Thế giới là gì?",
                        options: [
                            "Địa hình Karst (đá vôi) trưởng thành trong điều kiện nhiệt đới ẩm bị biển tiến làm ngập chìm",
                            "Địa hình miệng núi lửa cổ phun trào bazan dưới đáy biển",
                            "Địa hình vịnh hẹp (Fjord) do băng hà cổ bào mòn",
                            "Đồng bằng châu thổ hình thành từ phù sa sông Thái Bình"
                        ],
                        correct: 0,
                        explanation: "Vịnh Hạ Long là mẫu hình tiêu biểu toàn cầu về quá trình tiến hóa địa hình Karst đá vôi qua hàng trăm triệu năm và bị biển tiến làm ngập chìm.",
                        visualImg: "assets/monuments/halong.jpg",
                        visualCaption: "Các tháp và chóp đá vôi Karst ngập chìm trong nước biển tại Vịnh Hạ Long.",
                        visualCredit: "Ảnh: NKSTTSSHNVN / Wikimedia Commons (CC BY-SA 4.0) • Nguồn: UNESCO Ref. 672bis"
                    },
                    {
                        q: "[Cấp 2 - Trung bình] Vì sao vùng biển Vịnh Hạ Long có điều kiện rất thuận lợi để phát triển giao thông hàng hải, cảng nước sâu và nuôi trồng thủy sản lồng bè?",
                        options: [
                            "Do có hàng ngàn đảo đá vôi bao bọc tạo thành vùng vịnh kín gió, sóng êm và nhiều luồng lạch sâu",
                            "Do nằm ở vùng biển hoàn toàn không có thủy triều",
                            "Do nước biển ở đây là nước ngọt hoàn toàn quanh năm",
                            "Do không bao giờ có tàu thuyền quốc tế đi qua"
                        ],
                        correct: 0,
                        explanation: "Hệ thống gần 2.000 đảo đá vôi đóng vai trò như bức tường chắn sóng gió tự nhiên khổng lồ, tạo mặt nước tĩnh lặng lý tưởng cho cảng biển và nuôi thủy sản.",
                        visualImg: "assets/monuments/halong.jpg",
                        visualCaption: "Mặt nước êm ả được che chắn bởi hàng ngàn đảo đá vôi trên Vịnh Hạ Long.",
                        visualCredit: "Ảnh: NKSTTSSHNVN / Wikimedia Commons (CC BY-SA 4.0) • Nguồn: Báo Nhân Dân"
                    }
                ],
                3: [
                    {
                        q: "[Cấp 3 - Khó] Trong địa mạo Karst tại Vịnh Hạ Long, hai thuật ngữ khoa học 'Fengcong' và 'Fenglin' dùng để chỉ hai dạng địa hình đặc trưng nào?",
                        options: [
                            "Các cụm đảo đá vôi hình chóp nối liền chân (Fengcong) và các tháp đá vôi cô lập vách dựng đứng (Fenglin) ngập nước",
                            "Các rạn san hô hóa thạch và các đầm lầy rừng ngập mặn",
                            "Các dòng hải lưu nóng và dòng hải lưu lạnh gặp nhau",
                            "Các tầng than đá lộ thiên và các mỏ quặng sắt"
                        ],
                        correct: 0,
                        explanation: "Theo hồ sơ địa chất UNESCO của Vịnh Hạ Long, Fengcong (cụm chóp đá vôi chung chân đế) và Fenglin (tháp đá vôi vách đứng cô lập) là hai giai đoạn tiến hóa Karst đỉnh cao hiếm có trên thế giới.",
                        visualImg: "assets/monuments/halong.jpg",
                        visualCaption: "Sự giao thoa giữa cụm đảo chóp nón (Fengcong) và đảo tháp vách đứng (Fenglin) trên Vịnh Hạ Long.",
                        visualCredit: "Ảnh: NKSTTSSHNVN / Wikimedia Commons (CC BY-SA 4.0) • Nguồn: Ban Quản lý Vịnh Hạ Long"
                    },
                    {
                        q: "[Cấp 3 - Khó] Hệ sinh thái độc đáo 'Tùng' và 'Áng' nằm bên trong lòng các đảo đá vôi ở Vịnh Hạ Long – Cát Bà thực chất là dạng địa hình thủy văn gì?",
                        options: [
                            "Các hố sụt Karst (dolines) bị ngập nước biển, thông với biển bên ngoài qua các hang ngầm hoặc khe hẹp",
                            "Các hồ băng hà trên đỉnh núi cao trên 2.000m",
                            "Các nhánh sông phù sa ngọt chảy từ đất liền ra đảo",
                            "Các hồ nhân tạo do thợ mỏ đào khi khai thác than"
                        ],
                        correct: 0,
                        explanation: "Áng là các hồ nước mặn nằm khép kín giữa lòng đảo đá vôi (hố sụt Karst ngập nước), còn Tùng là các vụng biển hẹp ăn sâu vào đảo, nơi lưu giữ hệ sinh thái đặc hữu nguyên sơ.",
                        visualImg: "assets/monuments/halong.jpg",
                        visualCaption: "Cấu trúc đảo đá vôi rỗng với các hồ nước mặn kín (Áng) và vụng kín (Tùng).",
                        visualCredit: "Ảnh: NKSTTSSHNVN / Wikimedia Commons (CC BY-SA 4.0) • Nguồn: Viện Địa chất & Khoáng sản Việt Nam"
                    }
                ]
            }
        },
        {
            id: "mon_sapa",
            name: "Đỉnh Fansipan & Ruộng Bậc Thang Sa Pa",
            enName: "Fansipan Peak & Muong Hoa Terraces",
            regionId: 0,
            province: "Lào Cai",
            modelType: "terraced_peak",
            image: "assets/monuments/sapa.jpg",
            photoAuthor: "Tác giả ảnh: Bùi Thụy Đào Nguyên (Wikimedia Commons)",
            photoLicense: "Giấy phép: Public Domain (Phạm vi công cộng)",
            photoSourceUrl: "https://commons.wikimedia.org/wiki/File:Sa_Pa.jpg",
            articleSourceCite: "Tham khảo học thuật: Viện Địa lý - Viện Hàn lâm KH&CN Việt Nam, Cổng TTĐT tỉnh Lào Cai & Báo VnExpress.",
            npcName: "Già Làng Bản Mây Hoàng Liên",
            npcRole: "Bậc Thầy Canh Tác Sườn Núi",
            relicName: "Khèn Bạc Đỉnh Hoàng Liên",
            relicIcon: "🏔️",
            geographyLesson: {
                headline: "Nóc nhà Đông Dương (3.147,3m) & Nghệ thuật trị thủy ruộng bậc thang",
                summary: "Dãy Hoàng Liên Sơn chạy theo hướng Tây Bắc – Đông Nam là dãy núi cao và đồ sộ nhất Việt Nam với đỉnh Fansipan cao 3.147,3m. Dưới chân núi là hệ thống ruộng bậc thang Mường Hoa — Di tích Quốc gia Đặc biệt minh chứng cho phương thức canh tác bền vững trên đất dốc.",
                keyFacts: [
                    "Quy luật Đai cao: Hoàng Liên Sơn là nơi duy nhất ở Việt Nam có đủ 3 đai tự nhiên, bao gồm Đai ôn đới gió mùa trên núi (từ độ cao 2.600m trở lên).",
                    "Bức chắn Địa hình: Dãy Hoàng Liên Sơn ngăn cản gió mùa Đông Bắc tràn sâu sang Tây Bắc, giúp vùng Tây Bắc có mùa đông ấm và khô hơn Đông Bắc.",
                    "Khoáng sản Lào Cai: Nổi tiếng với mỏ Apatit Cam Đường (nguyên liệu sản xuất phân lân số 1 cả nước) và mỏ đồng Sin Quyền."
                ]
            },
            tieredQuizzes: {
                1: [
                    {
                        q: "[Cấp 1 - Dễ] Đỉnh núi Fansipan ('Nóc nhà Đông Dương', cao 3.147,3m) nằm trên dãy núi nào của nước ta?",
                        options: [
                            "Dãy Hoàng Liên Sơn",
                            "Dãy Trường Sơn Bắc",
                            "Dãy núi Đông Triều",
                            "Dãy Bạch Mã"
                        ],
                        correct: 0,
                        explanation: "Đỉnh Fansipan nằm trên dãy Hoàng Liên Sơn thuộc vùng núi Tây Bắc (giáp ranh hai tỉnh Lào Cai và Lai Châu).",
                        visualImg: "assets/monuments/sapa.jpg",
                        visualCaption: "Cảnh quan núi cao dãy Hoàng Liên Sơn và thung lũng ruộng bậc thang Sa Pa (Lào Cai).",
                        visualCredit: "Ảnh: Bùi Thụy Đào Nguyên / Wikimedia Commons (Public Domain) • Nguồn: Cổng TTĐT tỉnh Lào Cai"
                    },
                    {
                        q: "[Cấp 1 - Dễ] Tác dụng quan trọng nhất của việc làm ruộng bậc thang trên các sườn đồi núi dốc ở Sa Pa (Lào Cai) là gì?",
                        options: [
                            "Giữ nước để trồng lúa và hạn chế xói mòn, rửa trôi đất màu trên sườn dốc",
                            "Làm tăng tốc độ dòng chảy lũ quét xuống thung lũng",
                            "Biến đất núi cao thành đất ngập mặn ven biển",
                            "Thu hút gió bão từ biển thổi vào"
                        ],
                        correct: 0,
                        explanation: "Ruộng bậc thang chia sườn núi dốc thành các mặt phẳng bậc thang có bờ giữ nước, giảm tốc độ dòng chảy mặt và chống xói mòn đất.",
                        visualImg: "assets/monuments/sapa.jpg",
                        visualCaption: "Hệ thống ruộng bậc thang giữ nước và chống xói mòn đất trên sườn núi dốc Sa Pa.",
                        visualCredit: "Ảnh: Bùi Thụy Đào Nguyên / Wikimedia Commons (Public Domain) • Nguồn: Cục Di sản Văn hóa"
                    }
                ],
                2: [
                    {
                        q: "[Cấp 2 - Trung bình] Vì sao vùng núi Tây Bắc (như Điện Biên, Sơn La) lại có mùa đông ngắn hơn và ấm hơn so với vùng núi Đông Bắc ở cùng vĩ độ?",
                        options: [
                            "Do dãy Hoàng Liên Sơn cao đồ sộ đóng vai trò bức chắn địa hình ngăn gió mùa Đông Bắc lạnh giá",
                            "Do vùng Tây Bắc nằm gần biển hơn vùng Đông Bắc",
                            "Do vùng Tây Bắc có độ cao trung bình thấp hơn mực nước biển",
                            "Do gió mùa Đông Bắc chỉ thổi từ phía Nam lên"
                        ],
                        correct: 0,
                        explanation: "Vùng Đông Bắc có các cánh cung mở rộng đón gió mùa Đông Bắc, trong khi vùng Tây Bắc được bức tường thành Hoàng Liên Sơn che chắn nên mùa đông bớt lạnh hơn.",
                        visualImg: "assets/monuments/sapa.jpg",
                        visualCaption: "Dãy Hoàng Liên Sơn chạy hướng Tây Bắc – Đông Nam tạo bức tường chắn gió mùa Đông Bắc.",
                        visualCredit: "Ảnh: Bùi Thụy Đào Nguyên / Wikimedia Commons (Public Domain) • Nguồn: Viện Địa lý Việt Nam"
                    },
                    {
                        q: "[Cấp 2 - Trung bình] Tỉnh Lào Cai (nơi có thị xã du lịch Sa Pa) sở hữu mỏ khoáng sản phi kim loại nào lớn nhất Việt Nam, dùng làm nguyên liệu sản xuất phân bón?",
                        options: [
                            "Quặng Apatit (dùng sản xuất phân lân)",
                            "Dầu mỏ và khí đốt tự nhiên",
                            "Cát trắng thủy tinh",
                            "Muối mỏ Kali"
                        ],
                        correct: 0,
                        explanation: "Mỏ Apatit Lào Cai (Cam Đường) có trữ lượng lớn nhất Việt Nam, là nguồn nguyên liệu trụ cột cho ngành công nghiệp hóa chất sản xuất phân lân.",
                        visualImg: "assets/monuments/sapa.jpg",
                        visualCaption: "Lào Cai nổi tiếng với cả du lịch sinh thái Sa Pa và mỏ quặng Apatit Cam Đường lớn nhất nước.",
                        visualCredit: "Ảnh: Bùi Thụy Đào Nguyên / Wikimedia Commons (Public Domain) • Nguồn: Cổng TTĐT Lào Cai"
                    }
                ],
                3: [
                    {
                        q: "[Cấp 3 - Khó] Theo quy luật phân hóa theo độ cao (đai cao) ở miền Bắc Việt Nam, 'Đai ôn đới gió mùa trên núi' chỉ xuất hiện ở độ cao nào và có đặc điểm sinh vật - thổ nhưỡng gì?",
                        options: [
                            "Từ độ cao trên 2.600m (chỉ có ở Hoàng Liên Sơn), đất chủ yếu là đất mùn thô và thực vật ôn đới như đỗ quyên, trúc lùn, thiết sam",
                            "Từ độ cao 100m đến 500m, đất phù sa ngọt và rừng ngập mặn",
                            "Từ độ cao 600m đến 1.000m, đất đỏ bazan và rừng cao su",
                            "Ở mọi vùng đồng bằng ven biển miền Trung"
                        ],
                        correct: 0,
                        explanation: "Đai ôn đới gió mùa trên núi ở Việt Nam bắt đầu từ độ cao 2.600m trở lên (nhiệt độ quanh năm dưới 15°C), chỉ xuất hiện duy nhất trên khối núi Hoàng Liên Sơn với đất mùn thô và hệ thực vật ôn đới (đỗ quyên, lãnh sam, trúc lùn).",
                        visualImg: "assets/monuments/sapa.jpg",
                        visualCaption: "Phân hóa đai cao tự nhiên trên dãy Hoàng Liên Sơn (Lào Cai).",
                        visualCredit: "Ảnh: Bùi Thụy Đào Nguyên / Wikimedia Commons (Public Domain) • Nguồn: Sách giáo khoa Địa lý 12 – NXB Giáo dục"
                    }
                ]
            }
        },
        {
            id: "mon_vanmieu",
            name: "Văn Miếu – Quốc Tử Giám",
            enName: "Temple of Literature (Hanoi)",
            regionId: 1,
            province: "Thủ đô Hà Nội",
            modelType: "khue_van_cac",
            image: "assets/monuments/vanmieu.jpg",
            photoAuthor: "Tác giả ảnh: Chuoibk (English Wikipedia / Wikimedia Commons)",
            photoLicense: "Giấy phép: CC BY-SA 3.0",
            photoSourceUrl: "https://commons.wikimedia.org/wiki/File:Hanoi_Temple_of_Literature_(cropped).jpg",
            articleSourceCite: "Tham khảo học thuật: Trung tâm Hoạt động VHKH Văn Miếu - Quốc Tử Giám, Hồ sơ Di sản Tư liệu UNESCO & Thông tấn xã Việt Nam (TTXVN).",
            npcName: "Quan Tư Nghiệp Quốc Tử Giám",
            npcRole: "Học Giả Châu Thổ Sông Hồng",
            relicName: "Ấn Vàng Khuê Văn Các",
            relicIcon: "📜",
            geographyLesson: {
                headline: "Trái tim Văn hiến & Trung tâm Kinh tế - Khoa học vùng Đồng bằng Sông Hồng",
                summary: "Được xây dựng năm 1070 tại kinh thành Thăng Long, Văn Miếu - Quốc Tử Giám là trường đại học quốc gia đầu tiên của Việt Nam. Khuê Văn Các và 82 bia Tiến sĩ là biểu tượng cho thế mạnh nguồn nhân lực trình độ cao của vùng Đồng bằng Sông Hồng.",
                keyFacts: [
                    "Địa lý Dân cư: Đồng bằng sông Hồng có mật độ dân số cao nhất cả nước (>1.000 người/km²), mạng lưới đô thị và làng nghề dày đặc.",
                    "Đặc điểm Địa hình Đê điều: Hệ thống đê sông Hồng chia đồng bằng thành vùng trong đê (không còn được bồi phù sa tự nhiên hàng năm, có nhiều ô trũng) và vùng ngoài đê.",
                    "Thế mạnh Vụ Đông: Nhờ mùa đông lạnh kết hợp đất phù sa, vùng phát triển mạnh cây ưa lạnh vụ Đông mang lại hiệu quả kinh tế xuất khẩu cao."
                ]
            },
            tieredQuizzes: {
                1: [
                    {
                        q: "[Cấp 1 - Dễ] Đồng bằng Sông Hồng được bồi đắp chủ yếu bởi phù sa của hai hệ thống sông lớn nào?",
                        options: [
                            "Hệ thống sông Hồng và hệ thống sông Thái Bình",
                            "Hệ thống sông Tiền và hệ thống sông Hậu",
                            "Hệ thống sông Mã và hệ thống sông Cả",
                            "Hệ thống sông Đồng Nai và sông Sài Gòn"
                        ],
                        correct: 0,
                        explanation: "Đồng bằng châu thổ sông Hồng (rộng khoảng 15.000 km²) được hình thành do phù sa của hệ thống sông Hồng và hệ thống sông Thái Bình bồi tụ.",
                        visualImg: "assets/monuments/vanmieu.jpg",
                        visualCaption: "Văn Miếu – Quốc Tử Giám tại Thủ đô Hà Nội, trung tâm vùng châu thổ sông Hồng – Thái Bình.",
                        visualCredit: "Ảnh: Chuoibk / Wikimedia Commons (CC BY-SA 3.0) • Nguồn: TTXVN"
                    },
                    {
                        q: "[Cấp 1 - Dễ] Về mặt dân cư và nguồn lao động, vùng Đồng bằng Sông Hồng có đặc điểm nổi bật nào sau đây?",
                        options: [
                            "Mật độ dân số cao nhất cả nước, nguồn lao động dồi dào và có trình độ khoa học - kỹ thuật hàng đầu",
                            "Mật độ dân số thưa thớt nhất cả nước, thiếu hụt lao động trầm trọng",
                            "Chỉ có lao động làm nghề rừng, không có các trường đại học",
                            "Dân cư chỉ sinh sống trên các đảo xa bờ"
                        ],
                        correct: 0,
                        explanation: "ĐBSH có mật độ dân số cao gấp hơn 3 lần trung bình cả nước, tập trung đội ngũ trí thức, kỹ sư và lao động lành nghề đông đảo nhất.",
                        visualImg: "assets/monuments/vanmieu.jpg",
                        visualCaption: "Truyền thống hiếu học ngàn năm tại Văn Miếu – Quốc Tử Giám tạo nền tảng nhân lực chất lượng cao cho vùng ĐBSH.",
                        visualCredit: "Ảnh: Chuoibk / Wikimedia Commons (CC BY-SA 3.0) • Nguồn: Trung tâm VHKH Văn Miếu - Quốc Tử Giám"
                    }
                ],
                2: [
                    {
                        q: "[Cấp 2 - Trung bình] Sự tồn tại của hệ thống đê điều ven sông Hồng từ hàng trăm năm qua đã dẫn đến hệ quả địa lý tự nhiên nào đối với vùng đất 'trong đê'?",
                        options: [
                            "Đất trong đê không được bồi đắp phù sa tự nhiên hàng năm nữa, bề mặt bị chia cắt thành nhiều ô trũng và đất dễ bị bạc màu nếu không bón phân hợp lý",
                            "Đất trong đê luôn ngập nước biển mặn quanh năm",
                            "Đất trong đê biến thành đá vôi Karst",
                            "Đất trong đê cao thêm 10 mét mỗi năm do lũ"
                        ],
                        correct: 0,
                        explanation: "Hệ thống đê ngăn lũ giúp bảo vệ dân cư và mùa màng, nhưng làm vùng đất trong đê không còn nhận được lớp phù sa mới hàng năm, đòi hỏi kỹ thuật thâm canh và cải tạo đất cao.",
                        visualImg: "assets/monuments/vanmieu.jpg",
                        visualCaption: "Văn minh châu thổ sông Hồng gắn liền với hệ thống đê điều trị thủy và thâm canh nông nghiệp.",
                        visualCredit: "Ảnh: Chuoibk / Wikimedia Commons (CC BY-SA 3.0) • Nguồn: Viện Địa lý Việt Nam"
                    },
                    {
                        q: "[Cấp 2 - Trung bình] Nhờ yếu tố khí hậu đặc trưng nào mà Đồng bằng Sông Hồng có thể đưa 'Vụ Đông' (trồng ngô đông, khoai tây, su hào, bắp cải...) trở thành vụ sản xuất chính?",
                        options: [
                            "Nhờ có một mùa đông lạnh kéo dài khoảng 3 tháng do ảnh hưởng của gió mùa Đông Bắc",
                            "Nhờ khí hậu nóng bức quanh năm không có mùa đông",
                            "Nhờ lượng mưa tập trung hoàn toàn vào tháng 1",
                            "Nhờ gió Phơn Tây Nam khô nóng thổi suốt mùa đông"
                        ],
                        correct: 0,
                        explanation: "Mùa đông lạnh ở Bắc Bộ kết hợp đất phù sa sau khi gặt lúa mùa tạo điều kiện sinh thái lý tưởng cho các loại cây rau màu ôn đới và cận nhiệt vụ Đông.",
                        visualImg: "assets/monuments/vanmieu.jpg",
                        visualCaption: "Khí hậu có mùa đông lạnh tạo lợi thế độc đáo cho nông nghiệp Vụ Đông vùng Đồng bằng Sông Hồng.",
                        visualCredit: "Ảnh: Chuoibk / Wikimedia Commons (CC BY-SA 3.0) • Nguồn: Bộ Nông nghiệp & PTNT"
                    }
                ],
                3: [
                    {
                        q: "[Cấp 3 - Khó] Vì sao Đồng bằng Sông Hồng đứng đầu cả nước về 'năng suất lúa' (tạ/ha), nhưng lại đứng sau Đồng bằng Sông Cửu Long về 'tổng sản lượng lúa' và 'khối lượng gạo xuất khẩu'?",
                        options: [
                            "Do ĐBSH có trình độ thâm canh rất cao nên năng suất/ha cao nhất, nhưng diện tích đất trồng lúa nhỏ hơn nhiều và dân số quá đông nên nhu cầu tiêu thụ tại chỗ lớn",
                            "Do ĐBSH chỉ trồng 1 vụ lúa mỗi 5 năm",
                            "Do người dân ĐBSH không sử dụng giống lúa mới hay thủy lợi",
                            "Do đất ở ĐBSH hoàn toàn là đất cát biển không giữ được nước"
                        ],
                        correct: 0,
                        explanation: "ĐBSH có diện tích (~1,5 triệu ha) nhỏ hơn nhiều so với ĐBSCL (~4 triệu ha) nhưng dân số lại rất đông. Nhờ trình độ thâm canh và thủy lợi hoàn chỉnh, năng suất lúa (tạ/ha) của ĐBSH cao nhất nước, song bình quân lương thực đầu người và lượng gạo dư thừa để xuất khẩu vẫn thấp hơn ĐBSCL.",
                        visualImg: "assets/monuments/vanmieu.jpg",
                        visualCaption: "Đồng bằng Sông Hồng dẫn đầu cả nước về trình độ thâm canh và năng suất lúa trên một đơn vị diện tích.",
                        visualCredit: "Ảnh: Chuoibk / Wikimedia Commons (CC BY-SA 3.0) • Nguồn: Tổng cục Thống kê Việt Nam"
                    }
                ]
            }
        },
        {
            id: "mon_phongnha",
            name: "Vườn Quốc Gia Phong Nha – Kẻ Bàng",
            enName: "Phong Nha - Ke Bang National Park",
            regionId: 2,
            province: "Quảng Bình",
            modelType: "limestone_cavern",
            image: "assets/monuments/phongnha.jpg",
            photoAuthor: "Tác giả ảnh: Genghiskhanviet (Wikimedia Commons)",
            photoLicense: "Giấy phép: Public Domain (Phạm vi công cộng)",
            photoSourceUrl: "https://commons.wikimedia.org/wiki/File:Phongnhakebang6.jpg",
            articleSourceCite: "Tham khảo học thuật: Ban Quản lý VQG Phong Nha - Kẻ Bàng, Hồ sơ Di sản Thiên nhiên UNESCO (Ref. 951bis) & Tạp chí Địa chất Việt Nam.",
            npcName: "Nhà Thám Hiểm Hang Sơn Đoòng",
            npcRole: "Chuyên Gia Địa Chất Trường Sơn",
            relicName: "Thạch Nhũ Ngọc Bích Kẻ Bàng",
            relicIcon: "💎",
            geographyLesson: {
                headline: "Vương quốc Hang động trên khối núi đá vôi cổ nhất châu Á (400 triệu năm)",
                summary: "Nằm ở dãy Trường Sơn Bắc thuộc tỉnh Quảng Bình, khối núi đá vôi Phong Nha - Kẻ Bàng có tuổi địa chất từ kỷ Ordovic - Silur (~400 triệu năm). Hệ thống sông ngầm Son - Chày đã kiến tạo hơn 400 hang động kỳ vĩ, bao gồm Sơn Đoòng — hang động tự nhiên lớn nhất thế giới.",
                keyFacts: [
                    "Hình thể Địa lý Quảng Bình: Là nơi hẹp ngang nhất Việt Nam (từ biên giới Việt - Lào ra Biển Đông chỉ khoảng 50km), địa hình dốc từ Tây sang Đông.",
                    "Cơ chế Gió Phơn Tây Nam: Vào mùa hạ, gió Tây Nam vượt dãy Trường Sơn trút mưa ở sườn Tây, khi tràn xuống sườn Đông (Quảng Bình, Nghệ An, Hà Tĩnh) trở nên khô và nóng.",
                    "Lát cắt Địa hình Bắc Trung Bộ: Đi từ Tây sang Đông đều trải qua: Núi cao biên giới → Đồi trung du → Đồng bằng hẹp ven biển → Cồn cát & Biển đảo."
                ]
            },
            tieredQuizzes: {
                1: [
                    {
                        q: "[Cấp 1 - Dễ] Hang Sơn Đoòng (hang động tự nhiên lớn nhất thế giới) nằm trong Vườn Quốc gia Phong Nha – Kẻ Bàng thuộc tỉnh nào?",
                        options: [
                            "Tỉnh Quảng Bình",
                            "Tỉnh Nghệ An",
                            "Tỉnh Quảng Ninh",
                            "Tỉnh Lâm Đồng"
                        ],
                        correct: 0,
                        explanation: "Vườn Quốc gia Phong Nha - Kẻ Bàng và hang Sơn Đoòng nằm tại huyện Bố Trạch và Minh Hóa, tỉnh Quảng Bình.",
                        visualImg: "assets/monuments/phongnha.jpg",
                        visualCaption: "Hệ thống thạch nhũ kỳ vĩ bên trong động Phong Nha (VQG Phong Nha – Kẻ Bàng, Quảng Bình).",
                        visualCredit: "Ảnh: Genghiskhanviet / Wikimedia Commons (Public Domain) • Nguồn: BQL VQG Phong Nha - Kẻ Bàng"
                    },
                    {
                        q: "[Cấp 1 - Dễ] Tỉnh Quảng Bình có kỷ lục địa lý nào về hình dáng lãnh thổ trên bản đồ Việt Nam?",
                        options: [
                            "Là tỉnh có chiều ngang Đông – Tây hẹp nhất Việt Nam (nơi hẹp nhất chưa đầy 50 km)",
                            "Là tỉnh có diện tích lớn nhất Việt Nam",
                            "Là tỉnh nằm hoàn toàn trên đảo xa bờ",
                            "Là tỉnh duy nhất giáp với 3 quốc gia"
                        ],
                        correct: 0,
                        explanation: "Từ biên giới Việt - Lào ra tới bờ Biển Đông tại Quảng Bình chỉ khoảng 40–50 km, là phần eo đất hẹp nhất dải đất hình chữ S.",
                        visualImg: "assets/monuments/phongnha.jpg",
                        visualCaption: "Quảng Bình nằm ở phần eo đất hẹp ngang nhất Việt Nam, lưng tựa dãy Trường Sơn Bắc, mặt hướng ra Biển Đông.",
                        visualCredit: "Ảnh: Genghiskhanviet / Wikimedia Commons (Public Domain) • Nguồn: Cổng TTĐT tỉnh Quảng Bình"
                    }
                ],
                2: [
                    {
                        q: "[Cấp 2 - Trung bình] Quá trình tự nhiên chủ đạo nào đã hình thành nên hệ thống hang động khổng lồ và thạch nhũ kỳ ảo tại Phong Nha – Kẻ Bàng?",
                        options: [
                            "Quá trình phong hóa hóa học (hòa tan đá vôi CaCO3 bởi nước mưa và sông ngầm giàu khí CO2) qua hàng triệu năm",
                            "Quá trình dung nham núi lửa phun trào tạo ống rỗng",
                            "Quá trình gió thổi cát biển bào mòn đá granit",
                            "Quá trình băng hà tan chảy vào mùa hè"
                        ],
                        correct: 0,
                        explanation: "Phong Nha - Kẻ Bàng là khối đá vôi cổ. Nước mưa và dòng sông ngầm chứa axit cacbonic yếu hòa tan đá vôi tạo hang rỗng và kết tủa thành thạch nhũ, măng đá.",
                        visualImg: "assets/monuments/phongnha.jpg",
                        visualCaption: "Thạch nhũ và măng đá hình thành do quá trình hòa tan và kết tủa Canxi Cacbonat (CaCO3) trong hang đá vôi.",
                        visualCredit: "Ảnh: Genghiskhanviet / Wikimedia Commons (Public Domain) • Nguồn: UNESCO Ref. 951bis"
                    },
                    {
                        q: "[Cấp 2 - Trung bình] Vì sao vào đầu và giữa mùa hạ, vùng đồng bằng ven biển Bắc Trung Bộ (như Quảng Bình, Hà Tĩnh) thường chịu hiện tượng 'Gió Lào' (gió Phơn Tây Nam) rất khô và nóng?",
                        options: [
                            "Do khối khí nhiệt đới ẩm từ Ấn Độ Dương – Vịnh Bengan thổi theo hướng Tây Nam bị dãy Trường Sơn chắn lại, gây mưa ở sườn Tây rồi vượt núi trườn xuống sườn Đông bị biến tính trở nên khô nóng",
                            "Do gió thổi trực tiếp từ Biển Đông vào mang theo hơi nóng của nước biển",
                            "Do gió mùa Đông Bắc bị đốt nóng khi đi qua đồng bằng sông Hồng",
                            "Do khu vực này không có sông ngòi hay biển"
                        ],
                        correct: 0,
                        explanation: "Theo hiệu ứng Phơn (Foehn), không khí ẩm vượt dãy Trường Sơn đã trút hết mưa ở sườn Tây (Lào); khi vượt đỉnh núi tràn xuống sườn Đông Việt Nam, cứ xuống thấp 100m nhiệt độ lại tăng khoảng 1°C khiến gió trở nên cực kỳ khô và nóng.",
                        visualImg: "assets/monuments/phongnha.jpg",
                        visualCaption: "Dãy Trường Sơn Bắc đóng vai trò bức chắn địa hình tạo hiệu ứng gió Phơn Tây Nam khô nóng vào mùa hạ.",
                        visualCredit: "Ảnh: Genghiskhanviet / Wikimedia Commons (Public Domain) • Nguồn: Trung tâm Dự báo KTTV Quốc gia"
                    }
                ],
                3: [
                    {
                        q: "[Cấp 3 - Khó] Vì sao cơ cấu nông – lâm – ngư nghiệp của các tỉnh Bắc Trung Bộ luôn được quy hoạch theo mô hình 'Lát cắt lãnh thổ từ Tây sang Đông'?",
                        options: [
                            "Do mọi tỉnh trong vùng đều có cấu trúc địa hình chuyển tiếp tuần tự từ Tây sang Đông: Vùng núi Trường Sơn (lâm nghiệp, thủy điện) → Đồi gò trước núi (chăn nuôi đại gia súc, cây công nghiệp) → Đồng bằng hẹp (lúa, cây hàng năm) → Vùng biển đầm phá (thủy sản, cảng biển)",
                            "Do tất cả các con sông ở đây đều chảy từ Đông sang Tây",
                            "Do vùng này chỉ có một dạng địa hình duy nhất là cao nguyên bazan",
                            "Do khí hậu ở phía Tây là khí hậu hàn đới còn phía Đông là xích đạo"
                        ],
                        correct: 0,
                        explanation: "Cấu trúc địa hình dải hẹp phân bậc từ Tây sang Đông là đặc trưng cốt lõi của Bắc Trung Bộ. Khai thác liên hoàn 'Rừng – Đồi – Đồng bằng – Biển' trên cùng một tỉnh giúp vừa phát triển kinh tế tổng hợp vừa bảo vệ môi trường sinh thái chống thiên tai.",
                        visualImg: "assets/monuments/phongnha.jpg",
                        visualCaption: "Mô hình kinh tế liên hoàn từ rừng đầu nguồn Trường Sơn (Phong Nha) xuống đồng bằng và biển Đông.",
                        visualCredit: "Ảnh: Genghiskhanviet / Wikimedia Commons (Public Domain) • Nguồn: Sách giáo khoa Địa lý 12"
                    }
                ]
            }
        },
        {
            id: "mon_hue",
            name: "Quần Thể Di Tích Cố Đô Huế",
            enName: "Complex of Hue Monuments",
            regionId: 2,
            province: "Thừa Thiên Huế",
            modelType: "imperial_citadel",
            image: "assets/monuments/hue.jpg",
            photoAuthor: "Tác giả ảnh: NguyenThanhBac123 (Wikimedia Commons)",
            photoLicense: "Giấy phép: CC0 1.0 (Hiến tặng phạm vi công cộng)",
            photoSourceUrl: "https://commons.wikimedia.org/wiki/File:%C4%90%E1%BA%A1i_n%E1%BB%99i.jpg",
            articleSourceCite: "Tham khảo học thuật: Trung tâm Bảo tồn Di tích Cố đô Huế, Hồ sơ Di sản Thế giới UNESCO (Ref. 678) & Báo Tuổi Trẻ.",
            npcName: "Quan Thái Sử Hoàng Triều",
            npcRole: "Kiến Trúc Sư Phong Thủy Sông Hương",
            relicName: "Cửu Đỉnh Hoàng Kim Ấn",
            relicIcon: "👑",
            geographyLesson: {
                headline: "Đô thị Di sản bên dòng Sông Hương, Đèo Hải Vân & Hệ Đầm phá Tam Giang",
                summary: "Là Di sản Văn hóa Thế giới đầu tiên của Việt Nam (1993), Cố đô Huế được quy hoạch gắn liền với tự nhiên: núi Ngự Bình làm tiền án, sông Hương làm minh đường. Thừa Thiên Huế còn nằm ngay sát bức chắn khí hậu Đèo Hải Vân (dãy Bạch Mã) và sở hữu đầm phá Tam Giang – Cầu Hai lớn nhất Đông Nam Á.",
                keyFacts: [
                    "Ranh giới Khí hậu Tự nhiên: Dãy Bạch Mã – Đèo Hải Vân (giữa Huế và Đà Nẵng) là ranh giới tự nhiên phân chia miền khí hậu phía Bắc (có mùa đông lạnh) và miền khí hậu phía Nam (nóng quanh năm).",
                    "Mưa Thu - Đông cực đại: Huế là một trong những tâm mưa lớn nhất cả nước vào mùa Thu - Đông (tháng 9–12) do địa hình đón gió Đông Bắc thổi qua biển kết hợp dải hội tụ nhiệt đới.",
                    "Hệ đầm phá Tam Giang - Cầu Hai: Rộng hơn 216 km², là vùng nước lợ nuôi trồng thủy sản đặc sản giá trị cao."
                ]
            },
            tieredQuizzes: {
                1: [
                    {
                        q: "[Cấp 1 - Dễ] Quần thể Di tích Cố đô Huế được xây dựng bên bờ con sông nổi tiếng nào?",
                        options: [
                            "Sông Hương",
                            "Sông Hồng",
                            "Sông Hàn",
                            "Sông Tiền"
                        ],
                        correct: 0,
                        explanation: "Sông Hương chảy qua trung tâm Kinh thành Huế là trục cảnh quan thiên nhiên và phong thủy quan trọng nhất của Cố đô.",
                        visualImg: "assets/monuments/hue.jpg",
                        visualCaption: "Ngọ Môn – Đại Nội Kinh thành Huế tọa lạc bên bờ bắc sông Hương.",
                        visualCredit: "Ảnh: NguyenThanhBac123 / Wikimedia Commons (CC0) • Nguồn: Trung tâm Bảo tồn Di tích Cố đô Huế"
                    },
                    {
                        q: "[Cấp 1 - Dễ] Hệ thống đầm phá nước lợ lớn nhất Đông Nam Á nằm dọc ven biển tỉnh Thừa Thiên Huế có tên là gì?",
                        options: [
                            "Hệ đầm phá Tam Giang – Cầu Hai",
                            "Biển Hồ T'Nưng",
                            "Hồ Ba Bể",
                            "Hồ Dầu Tiếng"
                        ],
                        correct: 0,
                        explanation: "Hệ đầm phá Tam Giang - Cầu Hai dài gần 70km dọc bờ biển Thừa Thiên Huế là đầm phá nước lợ lớn nhất khu vực Đông Nam Á.",
                        visualImg: "assets/monuments/hue.jpg",
                        visualCaption: "Thừa Thiên Huế sở hữu Quần thể Di tích Cố đô Huế và hệ đầm phá Tam Giang – Cầu Hai rộng hơn 216 km².",
                        visualCredit: "Ảnh: NguyenThanhBac123 / Wikimedia Commons (CC0) • Nguồn: Cổng TTĐT Thừa Thiên Huế"
                    }
                ],
                2: [
                    {
                        q: "[Cấp 2 - Trung bình] Dãy núi Bạch Mã (nơi có đèo Hải Vân nằm giữa Thừa Thiên Huế và TP. Đà Nẵng) giữ vai trò địa lý tự nhiên đặc biệt nào đối với khí hậu Việt Nam?",
                        options: [
                            "Là bức chắn địa hình tạo ranh giới tự nhiên giữa miền khí hậu phía Bắc (có mùa đông lạnh) và miền khí hậu phía Nam (nóng ẩm quanh năm)",
                            "Là nơi duy nhất ở Việt Nam có băng tuyết vĩnh cửu quanh năm",
                            "Là ranh giới giữa vùng đồng bằng sông Cửu Long và Tây Nguyên",
                            "Là nơi ngăn cản hoàn toàn mưa bão trên Biển Đông"
                        ],
                        correct: 0,
                        explanation: "Dãy Bạch Mã đâm ngang ra biển tại đèo Hải Vân (~16°B) chặn các đợt gió mùa Đông Bắc suy yếu cuối cùng; vì vậy phía Bắc đèo Hải Vân (Huế) vẫn có mùa đông se lạnh, còn phía Nam đèo (Đà Nẵng trở vào) nắng ấm quanh năm.",
                        visualImg: "assets/monuments/haivan_pass.jpg",
                        visualCaption: "Đèo Hải Vân trên dãy Bạch Mã đâm ngang ra Biển Đông — ranh giới khí hậu Bắc – Nam của Việt Nam.",
                        visualCredit: "Ảnh: Viethavvh / Vietnamese Wikipedia (Public Domain) • Nguồn: Viện Địa lý Việt Nam"
                    },
                    {
                        q: "[Cấp 2 - Trung bình] Khác với Bắc Bộ và Nam Bộ mưa nhiều vào mùa hạ (tháng 5–10), mùa mưa ở khu vực Huế và Trung Trung Bộ tập trung chủ yếu vào thời gian nào trong năm?",
                        options: [
                            "Mùa Thu – Đông (từ tháng 9 đến tháng 12)",
                            "Mùa Xuân (từ tháng 1 đến tháng 3)",
                            "Chỉ mưa duy nhất vào tháng 4",
                            "Mưa đều nhau ở tất cả 12 tháng không có mùa khô"
                        ],
                        correct: 0,
                        explanation: "Vào thu - đông, gió mùa Đông Bắc và Tín phong Đông Bắc thổi qua Biển Đông mang nhiều hơi ẩm đập trực tiếp vào bức chắn địa hình Trường Sơn kết hợp bão và dải hội tụ nhiệt đới, gây mưa lớn tập trung vào tháng 9–12.",
                        visualImg: "assets/monuments/hue.jpg",
                        visualCaption: "Khu vực Huế và Trung Trung Bộ có chế độ mưa lệch về Thu – Đông đặc trưng.",
                        visualCredit: "Ảnh: NguyenThanhBac123 / Wikimedia Commons (CC0) • Nguồn: Trung tâm Dự báo KTTV Quốc gia"
                    }
                ],
                3: [
                    {
                        q: "[Cấp 3 - Khó] Vì sao các con sông ở Thừa Thiên Huế và Duyên hải Miền Trung (như sông Hương, sông Bồ, sông Thu Bồn) thường làm mực nước lũ dâng lên rất nhanh khi có mưa bão nhưng cũng rút nhanh?",
                        options: [
                            "Do lãnh thổ hẹp ngang, dãy Trường Sơn sát biển nên sông ngắn, độ dốc lòng sông lớn, lưu vực hình nan quạt tụ nước nhanh",
                            "Do các con sông ở đây dài hàng chục ngàn km và chảy qua địa hình bằng phẳng tuyệt đối",
                            "Do sông không đổ ra biển mà chảy ngược lên đỉnh núi",
                            "Do băng tuyết từ thượng nguồn tan chảy đột ngột"
                        ],
                        correct: 0,
                        explanation: "Do địa hình Miền Trung hẹp ngang và núi cao sát biển, các con sông đều ngắn và rất dốc. Khi mưa lớn ở sườn Đông Trường Sơn, nước từ các nhánh dồn về hạ lưu cực nhanh gây lũ lên đột ngột.",
                        visualImg: "assets/monuments/haivan_pass.jpg",
                        visualCaption: "Địa hình núi cao đâm sát biển khiến mạng lưới sông ngòi miền Trung ngắn và dốc.",
                        visualCredit: "Ảnh: Viethavvh / Vietnamese Wikipedia (Public Domain) • Nguồn: Sách giáo khoa Địa lý 12"
                    }
                ]
            }
        },
        {
            id: "mon_myson",
            name: "Thánh Địa Mỹ Sơn",
            enName: "My Son Sanctuary",
            regionId: 2,
            province: "Quảng Nam",
            modelType: "cham_tower",
            image: "assets/monuments/myson.jpg",
            photoAuthor: "Tác giả ảnh: Chainwit. (Wikimedia Commons)",
            photoLicense: "Giấy phép: CC BY 4.0",
            photoSourceUrl: "https://commons.wikimedia.org/wiki/File:2024_-_M%E1%BB%B9_S%C6%A1n_Group_B,_C_and_D_-_img_23.jpg",
            articleSourceCite: "Tham khảo học thuật: Ban Quản lý Di sản Văn hóa Mỹ Sơn, Hồ sơ Di sản Thế giới UNESCO (Ref. 949) & Báo Thanh Niên.",
            npcName: "Nghệ Nhân Tháp Chăm Cổ",
            npcRole: "Bậc Thầy Giao Thương Đường Biển",
            relicName: "Phù Điêu Thần Siva Bằng Vàng",
            relicIcon: "🏛️",
            geographyLesson: {
                headline: "Thung lũng Di sản & Hệ thống Cảng Nước Sâu Duyên hải Nam Trung Bộ",
                summary: "Tọa lạc trong thung lũng kín bao quanh bởi núi đồi tại huyện Duy Xuyên (Quảng Nam), Thánh địa Mỹ Sơn kết nối theo dòng sông Thu Bồn ra thương cảng cổ Hội An. Vùng Duyên hải Nam Trung Bộ nổi bật với đường bờ biển khúc khuỷu, nhiều vịnh nước sâu lý tưởng cho kinh tế hàng hải.",
                keyFacts: [
                    "Cảng biển nước sâu: Nhờ thềm lục địa hẹp và sâu cùng nhiều bán đảo che chắn, vùng sở hữu các cảng nước sâu hàng đầu: Đà Nẵng (Tiên Sa), Quảng Nam (Kỳ Hà), Quảng Ngãi (Dung Quất), Bình Định (Quy Nhơn), Khánh Hòa (Vân Phong, Cam Ranh).",
                    "Nghề muối & Đánh bắt xa bờ: Vùng biển cực Nam Trung Bộ (Ninh Thuận, Bình Thuận) có số giờ nắng cao nhất cả nước, rất thuận lợi sản xuất muối công nghiệp (Cà Ná, Sa Huỳnh).",
                    "Hiện tượng Nước trồi: Vùng biển Ninh Thuận - Bình Thuận có hiện tượng nước biển trồi tầng sâu giàu dinh dưỡng, tạo ngư trường cá nổi lớn."
                ]
            },
            tieredQuizzes: {
                1: [
                    {
                        q: "[Cấp 1 - Dễ] Thánh địa Mỹ Sơn và Đô thị cổ Hội An cùng nằm trên lưu vực con sông lớn nào của tỉnh Quảng Nam?",
                        options: [
                            "Sông Thu Bồn",
                            "Sông Hồng",
                            "Sông Đà Rằng",
                            "Sông Vàm Cỏ Đông"
                        ],
                        correct: 0,
                        explanation: "Sông Thu Bồn chảy từ miền núi Quảng Nam qua vùng phụ cận Mỹ Sơn và đổ ra biển tại Cửa Đại (Hội An), kết nối giao thương đường thủy từ thời cổ đại.",
                        visualImg: "assets/monuments/myson.jpg",
                        visualCaption: "Quần thể đền tháp Champa cổ tại Thánh địa Mỹ Sơn nằm trong thung lũng bên lưu vực sông Thu Bồn (Quảng Nam).",
                        visualCredit: "Ảnh: Chainwit. / Wikimedia Commons (CC BY 4.0) • Nguồn: Ban Quản lý Di sản Văn hóa Mỹ Sơn"
                    },
                    {
                        q: "[Cấp 1 - Dễ] Ngành kinh tế nào được xem là thế mạnh mũi nhọn gắn với điều kiện tự nhiên của tất cả các tỉnh Duyên hải Nam Trung Bộ?",
                        options: [
                            "Kinh tế biển tổng hợp (Cảng biển nước sâu, đánh bắt & nuôi trồng hải sản, du lịch biển đảo, làm muối)",
                            "Khai thác than đá hầm lò quy mô lớn",
                            "Trồng cây ôn đới ưa lạnh như táo, lê, đào",
                            "Canh tác lúa trên đất phù sa sông Hồng"
                        ],
                        correct: 0,
                        explanation: "Tất cả các tỉnh Duyên hải Nam Trung Bộ đều giáp biển với bờ biển dài, nhiều vịnh nước sâu, bãi biển đẹp và ngư trường lớn.",
                        visualImg: "assets/monuments/myson.jpg",
                        visualCaption: "Duyên hải Nam Trung Bộ kết hợp du lịch Con đường Di sản Thế giới với kinh tế hàng hải và thủy sản.",
                        visualCredit: "Ảnh: Chainwit. / Wikimedia Commons (CC BY 4.0) • Nguồn: UNESCO Ref. 949"
                    }
                ],
                2: [
                    {
                        q: "[Cấp 2 - Trung bình] Nhờ điều kiện địa hình bờ biển như thế nào mà Duyên hải Nam Trung Bộ là vùng có nhiều địa điểm thuận lợi nhất cả nước để xây dựng các 'Cảng biển nước sâu' (như Đà Nẵng, Dung Quất, Vân Phong, Cam Ranh)?",
                        options: [
                            "Đường bờ biển khúc khuỷu, thềm lục địa hẹp và sâu, có nhiều vũng vịnh nước sâu được các bán đảo và đảo che chắn gió",
                            "Thềm lục địa cực kỳ nông và bằng phẳng kéo dài hàng trăm km",
                            "Có nhiều phù sa sông lớn bồi tụ lấp đầy các vịnh",
                            "Bờ biển hoàn toàn thẳng tắp không có vũng vịnh"
                        ],
                        correct: 0,
                        explanation: "Dãy Trường Sơn Nam có nhiều nhánh núi đâm sát ra biển tạo nên bờ biển khúc khuỷu với các vịnh nước sâu kín gió và ít bị phù sa bồi lắng, cực kỳ thuận lợi cho tàu trọng tải lớn cập cảng.",
                        visualImg: "assets/monuments/haivan_pass.jpg",
                        visualCaption: "Địa hình bán đảo và núi đâm ra biển tạo nên các vịnh nước sâu kín gió dọc Duyên hải Miền Trung.",
                        visualCredit: "Ảnh: Viethavvh / Vietnamese Wikipedia (Public Domain) • Nguồn: Cục Hàng hải Việt Nam"
                    },
                    {
                        q: "[Cấp 2 - Trung bình] Vì sao vùng ven biển cực Nam Trung Bộ (như Sa Huỳnh - Quảng Ngãi, Cà Ná - Ninh Thuận) lại là nơi sản xuất muối biển nổi tiếng nhất Việt Nam?",
                        options: [
                            "Do có nhiệt độ cao, số giờ nắng nhiều nhất cả nước, ít mưa, gió mạnh thúc đẩy bốc hơi nhanh và ít sông lớn đổ nước ngọt ra pha loãng độ mặn nước biển",
                            "Do ở đây mưa lớn quanh năm suốt 12 tháng",
                            "Do nước biển ở đây đóng băng vào mùa đông",
                            "Do nằm sâu trong lục địa cách biển 500km"
                        ],
                        correct: 0,
                        explanation: "Ninh Thuận và Bình Thuận là vùng khô hạn nhất cả nước (lượng mưa chỉ 700–1.100 mm/năm), nắng bức xạ dồi dào và độ mặn nước biển cao nên muối kết tinh nhanh, hạt muối trắng và tinh khiết.",
                        visualImg: "assets/monuments/myson.jpg",
                        visualCaption: "Khí hậu nhiều nắng và độ mặn nước biển cao giúp Duyên hải Nam Trung Bộ dẫn đầu cả nước về nghề muối.",
                        visualCredit: "Ảnh: Chainwit. / Wikimedia Commons (CC BY 4.0) • Nguồn: Bộ Nông nghiệp & PTNT"
                    }
                ],
                3: [
                    {
                        q: "[Cấp 3 - Khó] Giải thích nguyên nhân tự nhiên khiến vùng biển cực Nam Trung Bộ (Ninh Thuận – Bình Thuận) lại có lượng mưa thấp nhất Việt Nam (chỉ khoảng 700–800 mm/năm)?",
                        options: [
                            "Do dãy núi Trường Sơn Nam và khối núi cực Nam Trung Bộ chạy song song với hướng gió mùa Tây Nam vào mùa hạ và che khuất gió mùa Đông Bắc vào mùa đông, gây hiệu ứng khuất gió",
                            "Do vùng này nằm ở vĩ độ Bắc Cực nên không khí không bốc hơi được",
                            "Do rừng ngập mặn hút hết hơi ẩm trong không khí",
                            "Do không có biển tiếp giáp"
                        ],
                        correct: 0,
                        explanation: "Hướng đường bờ biển và các khối núi ở Ninh Thuận - Bình Thuận gần như song song với luồng gió mùa hạ Tây Nam và nằm ở sườn khuất của cả hai mùa gió, tạo nên tiểu vùng khí hậu khô hạn đặc thù giữa vùng nhiệt đới.",
                        visualImg: "assets/monuments/myson.jpg",
                        visualCaption: "Địa hình song song với hướng gió tạo nên tiểu vùng khí hậu khô hạn đặc trưng ở cực Nam Trung Bộ.",
                        visualCredit: "Ảnh: Chainwit. / Wikimedia Commons (CC BY 4.0) • Nguồn: Viện Địa lý Việt Nam"
                    }
                ]
            }
        },
        {
            id: "mon_taynguyen",
            name: "Nhà Rông & Không Gian Văn Hóa Cồng Chiêng Tây Nguyên",
            enName: "Central Highlands Rong House & Gong Culture",
            regionId: 3,
            province: "Đắk Lắk – Gia Lai – Kon Tum",
            modelType: "rong_house",
            image: "assets/monuments/taynguyen.jpg",
            photoAuthor: "Tác giả ảnh: Bùi Thụy Đào Nguyên (Wikimedia Commons)",
            photoLicense: "Giấy phép: CC BY-SA 3.0",
            photoSourceUrl: "https://commons.wikimedia.org/wiki/File:B%E1%BB%99_c%E1%BB%93ng_chi%C3%AAng.jpg",
            articleSourceCite: "Tham khảo học thuật: Bộ Văn hóa, Thể thao & Du lịch, Hồ sơ Di sản Phi vật thể UNESCO & Báo Điện tử Chính phủ.",
            npcName: "Già Làng Đam San Đại Ngàn",
            npcRole: "Thủ Lĩnh Cao Nguyên Đất Đỏ",
            relicName: "Chiêng Thần Đại Ngàn Tây Nguyên",
            relicIcon: "🥁",
            geographyLesson: {
                headline: "Cao nguyên Xếp tầng Đất đỏ Bazan & Thủ phủ Cây công nghiệp Việt Nam",
                summary: "Tây Nguyên gồm 5 tỉnh (Kon Tum, Gia Lai, Đắk Lắk, Đắk Nông, Lâm Đồng) là vùng kinh tế duy nhất ở Việt Nam không giáp biển. Địa hình đặc trưng bởi các cao nguyên xếp tầng phủ lớp đất đỏ bazan màu mỡ, đưa Tây Nguyên thành thủ phủ Cà phê số 1 cả nước.",
                keyFacts: [
                    "Đất đỏ Bazan: Hình thành từ phong hóa đá bazan núi lửa cổ, tầng phong hóa sâu, giàu dinh dưỡng, diện tích lớn nhất cả nước (~1,36 triệu ha).",
                    "Khí hậu Cận xích đạo: Chia làm 2 mùa mưa - khô tương phản sâu sắc. Mùa khô kéo dài thuận lợi cho phơi sấy cà phê nhưng đòi hỏi công trình thủy lợi tưới tiêu.",
                    "Trữ năng Thủy điện & Khoáng sản: Thượng nguồn các sông Sê San, Srêpốk, Đồng Nai có trữ năng thủy điện lớn thứ 2 cả nước; trữ lượng quặng Bô-xít hàng tỷ tấn."
                ]
            },
            tieredQuizzes: {
                1: [
                    {
                        q: "[Cấp 1 - Dễ] Trong 6 vùng kinh tế của Việt Nam, vùng nào là vùng DUY NHẤT hoàn toàn không giáp biển?",
                        options: [
                            "Vùng Tây Nguyên",
                            "Vùng Trung du và Miền núi Bắc Bộ",
                            "Vùng Đông Nam Bộ",
                            "Vùng Đồng bằng Sông Hồng"
                        ],
                        correct: 0,
                        explanation: "Tây Nguyên (gồm Kon Tum, Gia Lai, Đắk Lắk, Đắk Nông, Lâm Đồng) nằm trên các cao nguyên nội địa, tiếp giáp Lào, Campuchia, Duyên hải Miền Trung và Đông Nam Bộ, không có đường bờ biển.",
                        visualImg: "assets/monuments/taynguyen.jpg",
                        visualCaption: "Không gian văn hóa Cồng chiêng Tây Nguyên — vùng kinh tế duy nhất của Việt Nam không giáp biển.",
                        visualCredit: "Ảnh: Bùi Thụy Đào Nguyên / Wikimedia Commons (CC BY-SA 3.0) • Nguồn: Bộ Văn hóa, Thể thao & Du lịch"
                    },
                    {
                        q: "[Cấp 1 - Dễ] Loại đất quý giá nhất chiếm diện tích rộng lớn ở Tây Nguyên, cực kỳ thích hợp để trồng Cà phê, Hồ tiêu, Cao su là đất gì?",
                        options: [
                            "Đất đỏ bazan (hình thành trên đá mẹ bazan núi lửa)",
                            "Đất cát biển mặn",
                            "Đất phèn ngập nước",
                            "Đất băng tuyết vĩnh cửu"
                        ],
                        correct: 0,
                        explanation: "Đất đỏ bazan ở Tây Nguyên có tầng phong hóa dày, tơi xốp, giàu khoáng chất dinh dưỡng, là 'mỏ vàng nâu' cho cây công nghiệp lâu năm.",
                        visualImg: "assets/monuments/taynguyen.jpg",
                        visualCaption: "Vùng cao nguyên đất đỏ bazan Tây Nguyên là thủ phủ cà phê số 1 Việt Nam.",
                        visualCredit: "Ảnh: Bùi Thụy Đào Nguyên / Wikimedia Commons (CC BY-SA 3.0) • Nguồn: Báo Điện tử Chính phủ"
                    }
                ],
                2: [
                    {
                        q: "[Cấp 2 - Trung bình] Sự phân hóa khí hậu thành 2 mùa Mưa – Khô rõ rệt ở Tây Nguyên mang lại thuận lợi và thách thức gì cho sản xuất Cà phê?",
                        options: [
                            "Mùa khô nắng nhiều rất thuận lợi để thu hoạch, phơi sấy và bảo quản hạt cà phê, nhưng mùa khô kéo dài 4–5 tháng làm mực nước ngầm hạ thấp, gây thiếu nước tưới nghiêm trọng",
                            "Mùa khô có băng tuyết giúp bảo quản cà phê đông lạnh tự nhiên",
                            "Mùa mưa kéo dài 12 tháng khiến không bao giờ thiếu nước",
                            "Khí hậu Tây Nguyên không ảnh hưởng gì đến cây trồng"
                        ],
                        correct: 0,
                        explanation: "Khí hậu cận xích đạo ở Tây Nguyên có mùa khô sâu sắc: nắng khô giúp phơi sấy cà phê chất lượng cao và kích thích cây phân hóa mầm hoa, nhưng việc xây dựng hồ chứa thủy lợi và tưới tiết kiệm nước vào mùa khô là yếu tố sống còn.",
                        visualImg: "assets/monuments/taynguyen.jpg",
                        visualCaption: "Hai mùa mưa – khô tương phản sâu sắc định hình nhịp điệu sản xuất nông nghiệp và lễ hội ở Tây Nguyên.",
                        visualCredit: "Ảnh: Bùi Thụy Đào Nguyên / Wikimedia Commons (CC BY-SA 3.0) • Nguồn: Viện KHKT Nông Lâm nghiệp Tây Nguyên"
                    },
                    {
                        q: "[Cấp 2 - Trung bình] Vì sao các con sông bắt nguồn từ Tây Nguyên (như sông Sê San, sông Srêpốk, thượng nguồn sông Đồng Nai) lại có trữ năng thủy điện lớn thứ hai cả nước (chỉ sau vùng Tây Bắc)?",
                        options: [
                            "Do sông chảy qua địa hình các cao nguyên xếp tầng có độ chênh lệch độ cao lớn (nhiều thác ghềnh) và lưu lượng nước mùa mưa rất dồi dào",
                            "Do sông ở Tây Nguyên chảy trên địa hình bằng phẳng tuyệt đối như đồng bằng",
                            "Do nước sông ở đây chảy từ biển ngược lên núi",
                            "Do sử dụng sức đẩy của thủy triều biển"
                        ],
                        correct: 0,
                        explanation: "Địa hình cao nguyên xếp tầng tạo ra các bậc thác lớn trên sông Sê San (nhà máy thủy điện Ialy), sông Srêpốk và sông Đồng Nai, cho phép xây dựng hệ thống thủy điện bậc thang công suất lớn.",
                        visualImg: "assets/monuments/taynguyen.jpg",
                        visualCaption: "Địa hình cao nguyên xếp tầng tạo trữ năng thủy điện bậc thang dồi dào cho vùng Tây Nguyên.",
                        visualCredit: "Ảnh: Bùi Thụy Đào Nguyên / Wikimedia Commons (CC BY-SA 3.0) • Nguồn: Tập đoàn Điện lực Việt Nam (EVN)"
                    }
                ],
                3: [
                    {
                        q: "[Cấp 3 - Khó] Ngoài cây cà phê ở các cao nguyên thấp và trung bình (Đắk Lắk, Gia Lai), vì sao tỉnh Lâm Đồng (cao nguyên Lâm Viên – Đà Lạt) lại có thể chuyên canh mạnh Chè, Rau và Hoa ôn đới chất lượng cao quanh năm?",
                        options: [
                            "Do cao nguyên Lâm Viên có độ cao lớn (~1.500m) làm nền nhiệt độ giảm theo quy luật đai cao, tạo khí hậu mát mẻ như mùa thu ôn đới ngay giữa vĩ độ cận xích đạo",
                            "Do Lâm Đồng nằm ở vĩ độ cao nhất miền Bắc Việt Nam",
                            "Do Lâm Đồng chịu ảnh hưởng trực tiếp của gió mùa Đông Bắc lạnh buốt",
                            "Do địa hình Lâm Đồng thấp hơn mực nước biển"
                        ],
                        correct: 0,
                        explanation: "Dù nằm ở vĩ độ nam (cận xích đạo), nhưng nhờ độ cao ~1.500m trên mực nước biển của cao nguyên Lâm Viên, nhiệt độ trung bình năm tại Đà Lạt chỉ khoảng 18°C, rất lý tưởng cho cây chè, rau và hoa ôn đới.",
                        visualImg: "assets/monuments/taynguyen.jpg",
                        visualCaption: "Quy luật đai cao trên các cao nguyên trên 1.000m (như Lâm Viên) tạo khí hậu mát mẻ quanh năm.",
                        visualCredit: "Ảnh: Bùi Thụy Đào Nguyên / Wikimedia Commons (CC BY-SA 3.0) • Nguồn: Cổng TTĐT tỉnh Lâm Đồng"
                    }
                ]
            }
        },
        {
            id: "mon_bennharong",
            name: "Bến Nhà Rồng – Thương Cảng Sài Gòn",
            enName: "Dragon House Wharf (Ho Chi Minh City)",
            regionId: 4,
            province: "TP. Hồ Chí Minh",
            modelType: "dragon_wharf",
            image: "assets/monuments/bennharong.jpg",
            photoAuthor: "Tác giả ảnh: Dr. Gary Todd (WorldHistoryPics / Wikimedia Commons)",
            photoLicense: "Giấy phép: CC0 1.0 (Hiến tặng phạm vi công cộng)",
            photoSourceUrl: "https://commons.wikimedia.org/wiki/File:Ho_Chi_Minh_Museum,_Saigon.jpg",
            articleSourceCite: "Tham khảo học thuật: Bảo tàng Hồ Chí Minh - Chi nhánh TP.HCM, Cổng TTĐT TP.HCM & Báo Sài Gòn Giải Phóng.",
            npcName: "Hoa Tiêu Thương Cảng Sài Gòn",
            npcRole: "Tổng Thương Gia Đông Nam Bộ",
            relicName: "La Bàn Vàng Viễn Dương",
            relicIcon: "🧭",
            geographyLesson: {
                headline: "Cửa ngõ Hàng hải Quốc tế & Đầu tàu Kinh tế vùng Đông Nam Bộ",
                summary: "Tọa lạc bên sông Sài Gòn từ năm 1863, Bến Nhà Rồng là di tích lịch sử thiêng liêng gắn với hành trình tìm đường cứu nước của Chủ tịch Hồ Chí Minh (5/6/1911). Ngày nay, cụm cảng Sài Gòn – Cái Mép Thị Vải và vùng Đông Nam Bộ là đầu tàu kinh tế số 1 của cả nước.",
                keyFacts: [
                    "Đầu tàu Kinh tế: Đông Nam Bộ dẫn đầu cả nước về quy mô GDP, giá trị sản xuất công nghiệp, xuất khẩu và thu hút vốn FDI (tập trung ở tứ giác TP.HCM - Bình Dương - Đồng Nai - Bà Rịa Vũng Tàu).",
                    "Khoáng sản Dầu khí: Thềm lục địa Đông Nam Bộ có bể trầm tích Cửu Long và Nam Côn Sơn giàu dầu mỏ và khí đốt nhất Việt Nam.",
                    "Thủ phủ Cây Cao su: Nhờ đất đỏ bazan, đất xám phù sa cổ trên địa hình bán bình nguyên thoải và khí hậu cận xích đạo ít bão, vùng đứng số 1 cả nước về diện tích và sản lượng Cao su."
                ]
            },
            tieredQuizzes: {
                1: [
                    {
                        q: "[Cấp 1 - Dễ] Vùng kinh tế Đông Nam Bộ (với hạt nhân là TP. Hồ Chí Minh) dẫn đầu cả nước về chỉ số kinh tế nào sau đây?",
                        options: [
                            "Tổng sản phẩm trên địa bàn (GRDP), giá trị sản xuất công nghiệp, xuất khẩu và thu hút vốn đầu tư nước ngoài (FDI)",
                            "Sản lượng khai thác than đá hầm lò",
                            "Diện tích rừng ngập mặn tự nhiên",
                            "Diện tích trồng lúa nước"
                        ],
                        correct: 0,
                        explanation: "Đông Nam Bộ là vùng kinh tế phát triển năng động nhất Việt Nam, đóng góp tỷ trọng lớn nhất vào GDP, công nghiệp chế biến chế tạo và ngân sách quốc gia.",
                        visualImg: "assets/monuments/bennharong.jpg",
                        visualCaption: "Di tích Bến Nhà Rồng bên sông Sài Gòn (TP. Hồ Chí Minh) — trung tâm vùng kinh tế Đông Nam Bộ.",
                        visualCredit: "Ảnh: Gary Todd / Wikimedia Commons (CC0) • Nguồn: Bảo tàng Hồ Chí Minh - Chi nhánh TP.HCM"
                    },
                    {
                        q: "[Cấp 1 - Dễ] Khoáng sản chiến lược quan trọng nhất đang được khai thác ở thềm lục địa vùng Đông Nam Bộ (tỉnh Bà Rịa – Vũng Tàu) là gì?",
                        options: [
                            "Dầu mỏ và Khí tự nhiên (tại các mỏ Bạch Hổ, Rồng, Đại Hùng, Lan Tây - Lan Đỏ...)",
                            "Quặng Apatit",
                            "Than đá Antraxit",
                            "Quặng Sắt"
                        ],
                        correct: 0,
                        explanation: "Thềm lục địa phía Nam thuộc vùng Đông Nam Bộ là trung tâm khai thác dầu thô và khí đốt lớn nhất Việt Nam, phục vụ lọc hóa dầu và tổ hợp điện - đạm Phú Mỹ.",
                        visualImg: "assets/monuments/bennharong.jpg",
                        visualCaption: "Cụm cảng biển và thềm lục địa Đông Nam Bộ là tâm điểm kinh tế hàng hải và dầu khí của cả nước.",
                        visualCredit: "Ảnh: Gary Todd / Wikimedia Commons (CC0) • Nguồn: Cổng TTĐT TP. Hồ Chí Minh"
                    }
                ],
                2: [
                    {
                        q: "[Cấp 2 - Trung bình] Vì sao vùng Đông Nam Bộ trở thành vùng chuyên canh cây Cao su lớn nhất Việt Nam (chiếm hơn 50% diện tích cao su cả nước)?",
                        options: [
                            "Do có diện tích rộng lớn đất đỏ bazan và đất xám phù sa cổ thoát nước tốt trên địa hình bán bình nguyên thoải, kết hợp khí hậu cận xích đạo nóng ẩm ổn định và rất ít gió bão (cây cao su thân giòn dễ gãy khi gặp bão)",
                            "Do có mùa đông lạnh giá kéo dài giúp cây cao su tiết nhiều mủ",
                            "Do toàn bộ vùng bị ngập lũ sâu 3 mét suốt 6 tháng trong năm",
                            "Do chỉ có đất cát trắng ven biển"
                        ],
                        correct: 0,
                        explanation: "Cây cao su ưa nhiệt ẩm ổn định, đất tơi xốp tầng dày (đất bazan và đất xám) và đặc biệt kỵ gió bão. Đông Nam Bộ hội tụ trọn vẹn các điều kiện tự nhiên này cùng truyền thống canh tác, chế biến mủ cao su lâu đời.",
                        visualImg: "assets/monuments/rubber_latex.jpg",
                        visualCaption: "Thu hoạch mủ cao su ('vàng trắng') — cây công nghiệp chủ lực số 1 của vùng Đông Nam Bộ.",
                        visualCredit: "Ảnh: AxelBoldt / Wikimedia Commons (Public Domain) • Nguồn: Hiệp hội Cao su Việt Nam"
                    },
                    {
                        q: "[Cấp 2 - Trung bình] Hồ thủy lợi nhân tạo lớn nhất Việt Nam nằm ở thượng nguồn sông Sài Gòn (tỉnh Tây Ninh – Bình Dương), đóng vai trò cung cấp nước tưới và nước sinh hoạt cho vùng Đông Nam Bộ là hồ nào?",
                        options: [
                            "Hồ Dầu Tiếng",
                            "Hồ Hòa Bình",
                            "Hồ Thác Bà",
                            "Hồ Ba Bể"
                        ],
                        correct: 0,
                        explanation: "Công trình thủy lợi Hồ Dầu Tiếng (rộng 270 km² mặt nước) là hồ thủy lợi nhân tạo lớn nhất nước ta, giúp giải quyết bài toán nước tưới mùa khô và đẩy mặn cho hạ lưu sông Sài Gòn - Vàm Cỏ.",
                        visualImg: "assets/monuments/bennharong.jpg",
                        visualCaption: "Hệ thống sông Sài Gòn được điều tiết nguồn nước ngọt từ hồ thủy lợi Dầu Tiếng ở thượng nguồn.",
                        visualCredit: "Ảnh: Gary Todd / Wikimedia Commons (CC0) • Nguồn: Bộ Nông nghiệp & PTNT"
                    }
                ],
                3: [
                    {
                        q: "[Cấp 3 - Khó] Trong quy hoạch giao thông hàng hải vùng Đông Nam Bộ, cụm cảng nước sâu Cái Mép – Thị Vải (Bà Rịa – Vũng Tàu) có lợi thế địa lý vượt trội gì so với các bến cảng nằm sâu trong sông Sài Gòn?",
                        options: [
                            "Nằm ngay sát cửa biển với luồng hàng hải tự nhiên rất sâu (-14m đến -16m), ngắn và ổn định, cho phép siêu tàu container quốc tế trên 100.000–200.000 DWT cập cảng đi thẳng châu Âu, châu Mỹ mà không phải trung chuyển",
                            "Nằm trên đỉnh núi cao nên không bị ảnh hưởng bởi nước biển",
                            "Chỉ dành cho ghe thuyền nhỏ dưới 5 tấn đi lại",
                            "Nằm trong vùng nước ngọt hoàn toàn cách biển 300km"
                        ],
                        correct: 0,
                        explanation: "Các cảng trong nội đô sông Sài Gòn bị giới hạn bởi độ sâu luồng sông uốn khúc và tĩnh không cầu, trong khi cụm cảng Cái Mép - Thị Vải nằm sát biển Đông có độ sâu tự nhiên lý tưởng để đón siêu tàu mẹ quốc tế.",
                        visualImg: "assets/monuments/mangrove_cangio.jpg",
                        visualCaption: "Hệ thống sông và cửa biển qua rừng ngập mặn Cần Giờ – Thị Vải mở ra tuyến hàng hải quốc tế của Đông Nam Bộ.",
                        visualCredit: "Ảnh: Tho nau / Wikimedia Commons (CC BY-SA 3.0) • Nguồn: Cục Hàng hải Việt Nam"
                    }
                ]
            }
        },
        {
            id: "mon_cairang",
            name: "Chợ Nổi Cái Răng – Văn Minh Sông Nước Cửu Long",
            enName: "Cai Rang Floating Market (Can Tho)",
            regionId: 5,
            province: "TP. Cần Thơ",
            modelType: "floating_market",
            image: "assets/monuments/cairang.jpg",
            photoAuthor: "Tác giả ảnh: Bùi Thụy Đào Nguyên (Wikimedia Commons)",
            photoLicense: "Giấy phép: CC BY-SA 3.0",
            photoSourceUrl: "https://commons.wikimedia.org/wiki/File:M%E1%BB%99t_c%E1%BA%A3nh_%E1%BB%9F_ch%E1%BB%A3_n%E1%BB%95i_C%C3%A1i_R%C4%83ng.jpg",
            articleSourceCite: "Tham khảo học thuật: Cục Di sản Văn hóa, Cổng TTĐT TP. Cần Thơ & Báo Nông Nghiệp Việt Nam.",
            npcName: "Thương Hồ Cây Bẹo Cần Thơ",
            npcRole: "Chủ Vựa Nông Sản Chín Rồng",
            relicName: "Ấn Ngọc Phù Sa Chín Rồng",
            relicIcon: "🛶",
            geographyLesson: {
                headline: "Văn hóa Giao thương Trên sông & Vựa Lúa - Thủy sản - Trái cây số 1 Việt Nam",
                summary: "Chợ nổi Cái Răng trên sông Cần Thơ là biểu tượng sống động cho sự thích ứng của cư dân Đồng bằng Sông Cửu Long với mạng lưới sông rạch chằng chịt. Với diện tích khoảng 40.000 km², đây là vùng trọng điểm sản xuất lương thực, thực phẩm lớn nhất Việt Nam.",
                keyFacts: [
                    "Ba nhóm Đất chính: (1) Đất phù sa ngọt (~1,2 triệu ha dọc sông Tiền, sông Hậu - màu mỡ nhất); (2) Đất phèn (~1,6 triệu ha ở Đồng Tháp Mười, Tứ giác Long Xuyên); (3) Đất mặn (~75 vạn ha dọc vành đai ven biển Đông và vịnh Thái Lan).",
                    "Vị thế An ninh Lương thực: Chiếm hơn 50% diện tích và sản lượng lúa cả nước, đóng góp trên 90% sản lượng gạo xuất khẩu và gần 60% sản lượng thủy sản.",
                    "Thích ứng Biến đổi Khí hậu: Chuyển dịch cơ cấu kinh tế 'thuận thiên' (mô hình Tôm - Lúa luân canh, rừng ngập mặn kết hợp nuôi thủy sản sinh thái)."
                ]
            },
            tieredQuizzes: {
                1: [
                    {
                        q: "[Cấp 1 - Dễ] Hai nhánh sông chính của sông Mê Công khi chảy vào lãnh thổ vùng Đồng bằng Sông Cửu Long Việt Nam có tên là gì?",
                        options: [
                            "Sông Tiền và Sông Hậu",
                            "Sông Hồng và Sông Đà",
                            "Sông Đồng Nai và Sông Bé",
                            "Sông Hương và Sông Hàn"
                        ],
                        correct: 0,
                        explanation: "Sông Mê Công khi vào địa phận Đồng bằng sông Cửu Long chia thành 2 nhánh lớn là sông Tiền và sông Hậu, đổ ra biển qua 9 cửa sông (Cửu Long).",
                        visualImg: "assets/monuments/mekong_basin.png",
                        visualCaption: "Bản đồ lưu vực sông Mê Công chảy vào Việt Nam qua hai nhánh sông Tiền và sông Hậu.",
                        visualCredit: "Bản đồ: Shannon1 / Wikimedia Commons (CC BY-SA 4.0) • Nguồn: Ủy hội Sông Mê Công Việt Nam"
                    },
                    {
                        q: "[Cấp 1 - Dễ] Trên các ghe thuyền tại Chợ nổi Cái Răng (Cần Thơ), các thương hồ thường dựng một cây sào tre cao treo các loại trái cây, nông sản lên trên. Cây sào đó được gọi là gì và có tác dụng gì?",
                        options: [
                            "Gọi là 'Cây Bẹo' – dùng để quảng cáo từ xa cho người mua biết ghe thuyền đang bán mặt hàng nông sản gì ('treo gì bán nấy')",
                            "Gọi là cột thu lôi để chống sét trên sông",
                            "Gọi là cột mốc biên giới quốc gia",
                            "Chỉ dùng để phơi lưới đánh cá biển khơi"
                        ],
                        correct: 0,
                        explanation: "Trên mặt sông rộng và ồn ào tiếng máy ghe, tiếng rao hàng khó nghe rõ, nên thương hồ dùng 'Cây bẹo' treo mẫu nông sản lên cao để người mua nhận biết từ xa.",
                        visualImg: "assets/monuments/cairang.jpg",
                        visualCaption: "Ghe thuyền tấp nập giao thương nông sản tại Chợ nổi Cái Răng (TP. Cần Thơ).",
                        visualCredit: "Ảnh: Bùi Thụy Đào Nguyên / Wikimedia Commons (CC BY-SA 3.0) • Nguồn: Cục Di sản Văn hóa"
                    }
                ],
                2: [
                    {
                        q: "[Cấp 2 - Trung bình] Trong 3 nhóm đất chính ở Đồng bằng Sông Cửu Long (Đất phù sa ngọt, Đất phèn, Đất mặn), nhóm đất nào có diện tích lớn nhất và phân bố tập trung ở đâu?",
                        options: [
                            "Đất phèn (chiếm hơn 40% diện tích đồng bằng, khoảng 1,6 triệu ha), tập trung ở vùng trũng Đồng Tháp Mười, Tứ giác Long Xuyên và bán đảo Cà Mau",
                            "Đất đỏ bazan núi lửa tập trung ở giữa đồng bằng",
                            "Đất xám bạc màu trên núi đá vôi",
                            "Đất mùn núi cao ôn đới"
                        ],
                        correct: 0,
                        explanation: "Đất phù sa ngọt (~1,2 triệu ha) phân bố thành dải dọc sông Tiền và sông Hậu; trong khi đất phèn có diện tích lớn nhất (~1,6 triệu ha) nằm ở các vùng trũng phèn cần nước ngọt thau chua rửa mặn.",
                        visualImg: "assets/monuments/cairang.jpg",
                        visualCaption: "Hệ thống sông rạch ở ĐBSCL đóng vai trò dẫn nước ngọt phù sa để thau chua rửa mặn cho đất phèn.",
                        visualCredit: "Ảnh: Bùi Thụy Đào Nguyên / Wikimedia Commons (CC BY-SA 3.0) • Nguồn: Viện Lúa Đồng bằng Sông Cửu Long"
                    },
                    {
                        q: "[Cấp 2 - Trung bình] 'Mùa nước nổi' hàng năm ở Đồng bằng Sông Cửu Long (từ tháng 8 đến tháng 11) mang lại những lợi ích tự nhiên và kinh tế to lớn nào cho vùng?",
                        options: [
                            "Bồi đắp lượng phù sa màu mỡ khổng lồ, thau chua rửa mặn cho đất phèn - đất mặn, diệt sâu bệnh hại đồng ruộng và mang về nguồn lợi thủy sản nước ngọt vô cùng phong phú",
                            "Làm toàn bộ đồng bằng đóng băng giúp diệt cỏ dại",
                            "Làm tăng độ mặn của đất ở thượng nguồn",
                            "Chỉ gây thiệt hại chứ không có bất kỳ lợi ích nào"
                        ],
                        correct: 0,
                        explanation: "Khác với lũ ống lũ quét miền núi, mùa nước nổi ở ĐBSCL dâng lên từ từ qua hệ thống kênh rạch và vùng trũng, mang lại phù sa, tôm cá tự nhiên và nguồn nước ngọt rửa phèn quý giá.",
                        visualImg: "assets/monuments/mekong_basin.png",
                        visualCaption: "Hồ Biển Hồ (Tonlé Sap) và hạ lưu sông Mê Công điều tiết dòng chảy tạo nên mùa nước nổi trù phú ở ĐBSCL.",
                        visualCredit: "Bản đồ: Shannon1 / Wikimedia Commons (CC BY-SA 4.0) • Nguồn: Báo Nông Nghiệp Việt Nam"
                    }
                ],
                3: [
                    {
                        q: "[Cấp 3 - Khó] Trước thách thức xâm nhập mặn sâu vào mùa khô và biến đổi khí hậu tại các tỉnh ven biển Đồng bằng Sông Cửu Long, mô hình canh tác nông - thủy sản thông minh 'Thuận thiên' nào dưới đây mang lại hiệu quả kinh tế và sinh thái bền vững nhất?",
                        options: [
                            "Mô hình luân canh 'Một vụ Tôm (mùa khô nước mặn/lợ) – Một vụ Lúa chịu mặn (mùa mưa nước ngọt rửa mặn)', giúp tận dụng chất thải hữu cơ của tôm làm phân bón tự nhiên cho lúa",
                            "Đắp đê bê tông ngăn kín toàn bộ 9 cửa sông Cửu Long không cho nước chảy ra biển",
                            "Bơm nước biển mặn vào ngập đồng ruộng quanh năm để chỉ trồng lúa truyền thống",
                            "Phá bỏ toàn bộ rừng ngập mặn ven biển để trồng cây thông ôn đới"
                        ],
                        correct: 0,
                        explanation: "Mô hình luân canh Tôm - Lúa ('con tôm ôm cây lúa') là giải pháp thích ứng biến đổi khí hậu kiểu mẫu ở ĐBSCL: mùa khô đón nước lợ nuôi tôm giá trị cao, mùa mưa dùng nước mưa và nước ngọt rửa mặn để trồng lúa hữu cơ chất lượng cao (như ST24, ST25).",
                        visualImg: "assets/monuments/cairang.jpg",
                        visualCaption: "Mô hình kinh tế nông – thủy sản thuận thiên giúp ĐBSCL giữ vững vị thế vựa lúa và thủy sản số 1 Việt Nam.",
                        visualCredit: "Ảnh: Bùi Thụy Đào Nguyên / Wikimedia Commons (CC BY-SA 3.0) • Nguồn: Nghị quyết 120/NQ-CP về phát triển bền vững ĐBSCL"
                    }
                ]
            }
        }
    ],

    // ========================================================================
    // EXPANDED RESOURCE NODE QUIZZES (With Visual Illustration + Source Citation!)
    // ========================================================================
    resourceQuizzes: {
        food: [
            {
                q: "Hai đồng bằng châu thổ lớn nhất đảm bảo an ninh lương thực (lúa gạo) cho Việt Nam là?",
                options: [
                    "Đồng bằng sông Cửu Long & Đồng bằng sông Hồng",
                    "Đồng bằng Thanh - Nghệ - Tĩnh & Đồng bằng Tuy Hòa",
                    "Cao nguyên Lâm Viên & Cao nguyên Đắk Lắk",
                    "Bán bình nguyên Đông Nam Bộ & Trung du Bắc Bộ"
                ],
                correct: 0,
                explanation: "Đồng bằng sông Cửu Long (~40.000 km²) và Đồng bằng sông Hồng (~15.000 km²) là hai vựa lúa trụ cột của quốc gia.",
                visualImg: "assets/monuments/cairang.jpg",
                visualCaption: "Đồng bằng sông Cửu Long và Đồng bằng sông Hồng cung cấp hơn 70% tổng sản lượng lúa cả nước.",
                visualCredit: "Ảnh: Bùi Thụy Đào Nguyên / Wikimedia Commons (CC BY-SA 3.0) • Nguồn: Tổng cục Thống kê"
            },
            {
                q: "Bốn ngư trường trọng điểm của Việt Nam bao gồm: Hải Phòng - Quảng Ninh, Hoàng Sa - Trường Sa, Ninh Thuận - Bình Thuận - Bà Rịa Vũng Tàu và ngư trường nào?",
                options: [
                    "Ngư trường Cà Mau – Kiên Giang (ngư trường vịnh Thái Lan)",
                    "Ngư trường Lào Cai – Yên Bái",
                    "Ngư trường Gia Lai – Kon Tum",
                    "Ngư trường Hòa Bình – Sơn La"
                ],
                correct: 0,
                explanation: "Ngư trường Cà Mau - Kiên Giang nằm ở vùng biển Tây Nam ấm và nông, giàu nguồn lợi tôm cá bậc nhất cả nước.",
                visualImg: "assets/monuments/halong.jpg",
                visualCaption: "Việt Nam có 4 ngư trường trọng điểm trải dài từ Vịnh Bắc Bộ (Hải Phòng – Quảng Ninh) đến vùng biển Cà Mau – Kiên Giang.",
                visualCredit: "Ảnh: NKSTTSSHNVN / Wikimedia Commons (CC BY-SA 4.0) • Nguồn: Bộ Nông nghiệp & PTNT"
            },
            {
                q: "Vì sao vùng Đồng bằng Sông Cửu Long dẫn đầu cả nước về diện tích và sản lượng nuôi trồng thủy sản (đặc biệt là cá tra, cá basa và tôm)?",
                options: [
                    "Nhờ mạng lưới sông ngòi kênh rạch chằng chịt (nuôi cá nước ngọt), diện tích rừng ngập mặn và bãi triều ven biển rộng lớn (nuôi tôm nước lợ) cùng khí hậu ấm áp quanh năm",
                    "Nhờ có nhiều hồ băng hà trên núi cao",
                    "Nhờ không có bất kỳ con sông nào chảy qua",
                    "Nhờ khí hậu lạnh dưới 0°C vào mùa đông"
                ],
                correct: 0,
                explanation: "ĐBSCL hội tụ đủ 3 hệ sinh thái nước ngọt, nước lợ và nước mặn diện tích lớn cùng nguồn thức ăn tự nhiên phong phú.",
                visualImg: "assets/monuments/mekong_basin.png",
                visualCaption: "Mạng lưới sông Tiền, sông Hậu và bờ biển dài giúp ĐBSCL chiếm gần 60% sản lượng thủy sản cả nước.",
                visualCredit: "Bản đồ: Shannon1 / Wikimedia Commons (CC BY-SA 4.0) • Nguồn: Hiệp hội Chế biến & Xuất khẩu Thủy sản Việt Nam (VASEP)"
            },
            {
                q: "Giống lúa ST25 (từng đạt giải Gạo ngon nhất thế giới) được lai tạo và phát triển đầu tiên tại tỉnh nào thuộc vùng Đồng bằng Sông Cửu Long?",
                options: [
                    "Tỉnh Sóc Trăng",
                    "Tỉnh Lạng Sơn",
                    "Tỉnh Điện Biên",
                    "Tỉnh Quảng Trị"
                ],
                correct: 0,
                explanation: "Chữ 'ST' trong gạo ST24, ST25 là viết tắt của Sóc Trăng — nơi kỹ sư Hồ Quang Cua và nhóm nghiên cứu lai tạo thành công giống lúa thơm trứ danh này.",
                visualImg: "assets/monuments/cairang.jpg",
                visualCaption: "Gạo thơm ST25 của tỉnh Sóc Trăng là niềm tự hào của nông nghiệp vùng Đồng bằng Sông Cửu Long.",
                visualCredit: "Ảnh: Bùi Thụy Đào Nguyên / Wikimedia Commons (CC BY-SA 3.0) • Nguồn: Báo Nông Nghiệp Việt Nam"
            }
        ],
        wood: [
            {
                q: "Hệ sinh thái rừng ngập mặn ven biển có diện tích lớn nhất Việt Nam nằm ở vùng nào?",
                options: [
                    "Đồng bằng Sông Cửu Long (đặc biệt là Mũi Cà Mau) và Cần Giờ (Đông Nam Bộ)",
                    "Vùng núi cao Tây Bắc",
                    "Cao nguyên đá Đồng Văn (Hà Giang)",
                    "Thung lũng Điện Biên"
                ],
                correct: 0,
                explanation: "Rừng ngập mặn Cà Mau và Khu dự trữ sinh quyển rừng ngập mặn Cần Giờ giúp chắn sóng bảo vệ bờ biển, cố định phù sa và nuôi dưỡng tôm cá.",
                visualImg: "assets/monuments/mangrove_cangio.jpg",
                visualCaption: "Hệ sinh thái rừng ngập mặn ven biển Cần Giờ (Đông Nam Bộ) – Khu dự trữ sinh quyển thế giới được UNESCO công nhận.",
                visualCredit: "Ảnh: Tho nau / Wikimedia Commons (CC BY-SA 3.0) • Nguồn: UNESCO Man and the Biosphere Programme"
            },
            {
                q: "Theo mục đích sử dụng, hệ thống rừng ở Việt Nam được phân chia thành 3 loại rừng chính nào?",
                options: [
                    "Rừng đặc dụng (vườn quốc gia, khu bảo tồn), Rừng phòng hộ (đầu nguồn, chắn sóng/cát ven biển) và Rừng sản xuất (cung cấp gỗ, nguyên liệu giấy)",
                    "Rừng chỉ để lấy củi, Rừng băng tuyết và Rừng sa mạc",
                    "Rừng cao su, Rừng cà phê và Rừng lúa nước",
                    "Rừng dưới đáy biển sâu và Rừng trên mây"
                ],
                correct: 0,
                explanation: "Luật Lâm nghiệp Việt Nam quy hoạch 3 loại rừng: Rừng đặc dụng (bảo tồn sinh thái), Rừng phòng hộ (chống thiên tai, giữ nước) và Rừng sản xuất (khai thác gỗ bền vững).",
                visualImg: "assets/monuments/mangrove_cangio.jpg",
                visualCaption: "Phát triển lâm nghiệp bền vững kết hợp chặt chẽ giữa bảo tồn Rừng đặc dụng, Rừng phòng hộ và Rừng sản xuất.",
                visualCredit: "Ảnh: Tho nau / Wikimedia Commons (CC BY-SA 3.0) • Nguồn: Luật Lâm nghiệp Việt Nam"
            },
            {
                q: "Loại cây công nghiệp lấy mủ và gỗ nào có diện tích lớn nhất ở vùng Đông Nam Bộ và Tây Nguyên, được mệnh danh là 'Vàng trắng'?",
                options: [
                    "Cây Cao su",
                    "Cây Lúa nước",
                    "Cây Đước ngập mặn",
                    "Cây Thông đỏ"
                ],
                correct: 0,
                explanation: "Cây cao su phát triển mạnh trên đất đỏ bazan và đất xám phù sa cổ ở Đông Nam Bộ và Tây Nguyên, vừa cho mủ cao su tự nhiên ('vàng trắng') vừa cung cấp gỗ chế biến xuất khẩu.",
                visualImg: "assets/monuments/rubber_latex.jpg",
                visualCaption: "Khai thác mủ cao su tự nhiên tại vùng chuyên canh cây công nghiệp Đông Nam Bộ.",
                visualCredit: "Ảnh: AxelBoldt / Wikimedia Commons (Public Domain) • Nguồn: Hiệp hội Cao su Việt Nam"
            }
        ],
        iron: [
            {
                q: "Vùng nào ở nước ta tập trung đa dạng và giàu có nhất các loại khoáng sản kim loại và năng lượng (than đá, sắt, thiếc, chì - kẽm, đồng, apatit)?",
                options: [
                    "Trung du và Miền núi Bắc Bộ",
                    "Đồng bằng Sông Cửu Long",
                    "Đồng bằng Sông Hồng",
                    "Đông Nam Bộ"
                ],
                correct: 0,
                explanation: "Do lịch sử kiến tạo địa chất lâu dài với nhiều đứt gãy và xâm nhập magma, vùng Trung du và Miền núi Bắc Bộ giàu khoáng sản nội sinh và ngoại sinh bậc nhất.",
                visualImg: "assets/monuments/sapa.jpg",
                visualCaption: "Cấu trúc địa chất kiến tạo phức tạp giúp vùng Trung du & Miền núi Bắc Bộ giàu khoáng sản nhất cả nước.",
                visualCredit: "Ảnh: Bùi Thụy Đào Nguyên / Wikimedia Commons (Public Domain) • Nguồn: Tổng cục Địa chất và Khoáng sản Việt Nam"
            },
            {
                q: "Mỏ sắt Trại Cau (Thái Nguyên), Quý Xa (Lào Cai) và mỏ sắt Thạch Khê (Hà Tĩnh) cung cấp nguyên liệu chính cho ngành công nghiệp nào?",
                options: [
                    "Công nghiệp luyện kim đen (sản xuất gang thép, cơ khí và đóng tàu)",
                    "Công nghiệp dệt may thời trang",
                    "Công nghiệp chế biến sữa",
                    "Công nghiệp sản xuất đường mía"
                ],
                correct: 0,
                explanation: "Quặng sắt là nguyên liệu cốt lõi của ngành công nghiệp luyện kim đen để sản xuất gang thép và vật liệu đóng tàu.",
                visualImg: "assets/monuments/phongnha.jpg",
                visualCaption: "Khoáng sản kim loại ở Bắc Bộ và Bắc Trung Bộ là nguồn nguyên liệu trụ cột cho ngành luyện kim và cơ khí đóng tàu.",
                visualCredit: "Ảnh: Genghiskhanviet / Wikimedia Commons (Public Domain) • Nguồn: Bộ Công Thương"
            },
            {
                q: "Khoáng sản Bô-xít (nguyên liệu chính để luyện nhôm - Alumina) có trữ lượng hàng tỷ tấn tập trung nhiều nhất ở vùng nào của Việt Nam?",
                options: [
                    "Vùng Tây Nguyên (đặc biệt tại Đắk Nông, Lâm Đồng, Gia Lai)",
                    "Vùng Đồng bằng Sông Hồng",
                    "Vùng Đồng bằng Sông Cửu Long",
                    "Vịnh Hạ Long"
                ],
                correct: 0,
                explanation: "Vỏ phong hóa bazan ở Tây Nguyên chứa trữ lượng quặng Bô-xít khổng lồ (khoảng 5,4 tỷ tấn), tập trung ở Đắk Nông và Lâm Đồng.",
                visualImg: "assets/monuments/taynguyen.jpg",
                visualCaption: "Tây Nguyên sở hữu trữ lượng quặng Bô-xít hàng tỷ tấn nằm trong lớp vỏ phong hóa đá bazan.",
                visualCredit: "Ảnh: Bùi Thụy Đào Nguyên / Wikimedia Commons (CC BY-SA 3.0) • Nguồn: Viện Địa chất và Khoáng sản"
            }
        ]
    },

    // ========================================================================
    // GOLDEN / SILVER AXE NPC MINIGAME EVENTS (With Visual Memory Card!)
    // ========================================================================
    npcEvents: [
        {
            title: "Thử Thách Rìu Vàng – Rìu Bạc Trên Sông",
            npcName: "Tiên Ông Sông Nước Việt",
            story: "Từ làn sương huyền ảo trên mặt nước, Tiên Ông hiện lên tay cầm chiếc Rìu Vàng lấp lánh, Rìu Bạc sáng ngời và Rìu Sắt giản dị. Tiên Ông chỉ xuất hiện mỗi 4–5 vòng một lần để thử lòng trung thực và trí tuệ Địa lý của người đi biển!",
            q: "Để nhận phần thưởng cao nhất của Tiên Ông (+3 Xu Vàng), hãy chọn chiếc rìu trung thực VÀ trả lời đúng: Hệ thống sông nào có tổng lượng nước lớn nhất Việt Nam?",
            options: [
                "Nhận Rìu Sắt của mình & trả lời: Hệ thống sông Mê Công (Sông Cửu Long - chiếm hơn 60% tổng lượng nước cả nước)",
                "Tham lam nhận Rìu Vàng & trả lời: Sông Tô Lịch có lưu lượng lớn nhất",
                "Nhận Rìu Bạc & trả lời: Sông Hương là sông dài nhất châu Á",
                "Nhận Rìu Sắt & trả lời: Việt Nam không có con sông nào đổ ra Biển Đông"
            ],
            correct: 0,
            explanation: "Trung thực là phẩm chất vàng của người đi biển! Hệ thống sông Mê Công (chảy vào Việt Nam qua sông Tiền và sông Hậu) có tổng lượng nước khoảng 507 tỷ m³/năm, chiếm hơn 60% tổng lượng nước sông ngòi toàn quốc.",
            visualImg: "assets/monuments/mekong_basin.png",
            visualCaption: "Lưu vực sông Mê Công (Cửu Long) đóng góp hơn 60% tổng lượng nước mặt của toàn bộ hệ thống sông ngòi Việt Nam.",
            visualCredit: "Bản đồ: Shannon1 / Wikimedia Commons (CC BY-SA 4.0) • Nguồn: Ủy hội Sông Mê Công Việt Nam"
        },
        {
            title: "Hội Thề Thương Hồ & Bài Toán Gió Mùa Biển Đông",
            npcName: "Lão Tiên Tri Khí Tượng Biển Đông",
            story: "Lão Tiên Tri nắm giữ chiếc Rìu Vàng và Rìu Bạc của các bậc thầy đóng thuyền cổ. Ông mỉm cười khảo nghiệm đoàn thuyền về quy luật gió mùa trên Biển Đông.",
            q: "Vào mùa đông (từ tháng 11 đến tháng 4 năm sau), loại gió thịnh hành trên vùng biển Việt Nam thổi theo hướng chính nào, giúp thuyền buồm cổ xuôi dòng từ Bắc vào Nam?",
            options: [
                "Hướng Đông Bắc (Gió mùa Đông Bắc và Tín phong bán cầu Bắc)",
                "Hướng Tây Nam thổi ngược từ vịnh Thái Lan lên suốt mùa đông",
                "Hướng từ Nam Cực thổi thẳng lên xích đạo",
                "Biển Đông hoàn toàn đứng gió suốt 6 tháng mùa đông"
            ],
            correct: 0,
            explanation: "Chính xác! Mùa đông trên Biển Đông thịnh hành gió hướng Đông Bắc, tạo dòng hải lưu chảy theo hướng Đông Bắc – Tây Nam dọc bờ biển Việt Nam.",
            visualImg: "assets/monuments/haivan_pass.jpg",
            visualCaption: "Gió mùa Đông Bắc và Tín phong bán cầu Bắc thổi qua Biển Đông định hình dòng chảy hàng hải mùa đông.",
            visualCredit: "Ảnh: Viethavvh / Vietnamese Wikipedia (Public Domain) • Nguồn: Trung tâm Dự báo KTTV Quốc gia"
        },
        {
            title: "Báu Vật Thềm Lục Địa & Chủ Quyền Biển Đảo",
            npcName: "Thần Giữ Mỏ Rìu Bạc",
            story: "Một thợ đóng tàu đánh rơi búa sắt xuống vùng biển sâu. Thần Biển hiện lên cùng chiếc Rìu Vàng và đặt câu hỏi về Địa lý Biển Đảo Việt Nam.",
            q: "Vùng biển Việt Nam thuộc Biển Đông có diện tích khoảng bao nhiêu km² và hai quần đảo tiền tiêu xa bờ thuộc chủ quyền thiêng liêng của Tổ quốc là gì?",
            options: [
                "Khoảng 1 triệu km²; hai quần đảo Hoàng Sa (TP. Đà Nẵng) và Trường Sa (tỉnh Khánh Hòa)",
                "Khoảng 10.000 km²; chỉ có đảo Phú Quốc",
                "Khoảng 50 triệu km²; nằm ở Đại Tây Dương",
                "Việt Nam không có vùng đặc quyền kinh tế biển"
            ],
            correct: 0,
            explanation: "Vùng biển Việt Nam rộng khoảng 1 triệu km² trên Biển Đông (gấp 3 lần diện tích đất liền) với hàng ngàn đảo lớn nhỏ, trong đó quần đảo Hoàng Sa (Đà Nẵng) và quần đảo Trường Sa (Khánh Hòa) giữ vị trí chiến lược tối quan trọng.",
            visualImg: "assets/monuments/halong.jpg",
            visualCaption: "Biển Đông của Việt Nam rộng khoảng 1 triệu km² với hàng ngàn đảo ven bờ và hai quần đảo Hoàng Sa, Trường Sa.",
            visualCredit: "Ảnh: NKSTTSSHNVN / Wikimedia Commons (CC BY-SA 4.0) • Nguồn: Luật Biển Việt Nam 2012"
        }
    ],

    // 5 DISTINCT SHIP ARCHETYPES (Ultra-Clear High-Contrast Fleet Colors for Easy Identification)
    shipArchetypes: [
        {
            id: 0,
            name: "Hải Đội Hồng Hà",
            vesselTitle: "Chiến Thuyền Lưỡng Long (Đỏ Rực)",
            color: "#ff2424", // Vivid Crimson Red
            sailColor: "#ff5252",
            trimColor: "#ffd700",
            style: "dragon_junk",
            desc: "Thuyền buồm cánh dơi đỏ rực mũi chạm đầu Rồng uy nghiêm của vùng châu thổ Bắc Bộ."
        },
        {
            id: 1,
            name: "Hải Đội Hạ Long",
            vesselTitle: "Thương Thuyền Ngọc Lục Bảo (Xanh Lá)",
            color: "#00e676", // Vivid Emerald Green
            sailColor: "#69f0ae",
            trimColor: "#ffd700",
            style: "emerald_catamaran",
            desc: "Thuyền hai thân xanh ngọc lục bảo nổi bật giữa hàng ngàn đảo đá vôi kỳ vĩ."
        },
        {
            id: 2,
            name: "Hải Đội Trường Sơn",
            vesselTitle: "Hải Thuyền Đại Dương (Xanh Lam Sáng)",
            color: "#00b0ff", // Electric Sky Cyan-Blue
            sailColor: "#40c4ff",
            trimColor: "#ffffff",
            style: "ocean_clipper",
            desc: "Thuyền đi biển xanh lam rực sáng vượt sóng cả Duyên hải Miền Trung."
        },
        {
            id: 3,
            name: "Hải Đội Cửu Long",
            vesselTitle: "Ghe Ngo Hoàng Kim (Vàng Kim)",
            color: "#ffea00", // Sunburst Golden Yellow
            sailColor: "#ffee58",
            trimColor: "#ff6d00",
            style: "golden_galley",
            desc: "Thuyền hoàng kim rực rỡ, linh hoạt luồn lách qua mọi vùng biển Nam Bộ."
        },
        {
            id: 4,
            name: "Hải Đội Sài Gòn",
            vesselTitle: "Viễn Dương Hạm Tím Huế (Tím Hồng)",
            color: "#e040fb", // Vivid Royal Magenta-Purple
            sailColor: "#ea80fc",
            trimColor: "#ffd700",
            style: "imperial_bark",
            desc: "Thương thuyền viễn dương sắc tím ánh kim nổi bật kết nối các thương cảng quốc tế."
        }
    ],

    // SHARED GEOGRAPHY READING PASSAGES FOR "GIÔNG BÃO" (1m30s Timer, Same Passage + Unique Question per Player!)
    stormReadingPassages: [
        {
            id: "storm_passage_1",
            title: "Quy Luật Bão Biển Đông & Phòng Chống Thiên Tai Dọc Dải Đất Hình Chữ S",
            passage: "Biển Đông là một biển nửa kín rộng khoảng 3,447 triệu km² (trong đó vùng biển Việt Nam rộng khoảng 1 triệu km²), nằm trong vùng nhiệt đới gió mùa Đông Nam Á. Trung bình mỗi năm có từ 9 đến 10 cơn bão xuất hiện trên Biển Đông, trong đó có khoảng 3 đến 4 cơn bão đổ bộ trực tiếp vào bờ biển Việt Nam. Mùa bão ở nước ta có quy luật chậm dần từ Bắc vào Nam: vùng biển Bắc Bộ và Bắc Trung Bộ chịu ảnh hưởng mạnh nhất vào các tháng 6, 7, 8 và 9; trong khi vùng Duyên hải Miền Trung và Nam Bộ mùa bão dịch chuyển muộn hơn vào các tháng 9, 10, 11 và 12. Vùng ven biển Bắc Trung Bộ và Đồng bằng sông Hồng là nơi chịu tác động dữ dội nhất của bão kèm mưa lớn, nước dâng và lũ quét ở sườn Đông dãy Trường Sơn. Để giảm nhẹ thiệt hại do bão biển, giải pháp sinh thái bền vững nhất ở ven bờ là bảo vệ và trồng mới hệ thống rừng ngập mặn, rừng phòng hộ ven biển kết hợp củng cố đê biển và hệ thống cảnh báo sớm.",
            questions: [
                {
                    q: "Theo bài đọc, trung bình mỗi năm có khoảng bao nhiêu cơn bão đổ bộ trực tiếp vào bờ biển Việt Nam?",
                    options: [
                        "Khoảng 3 đến 4 cơn bão trực tiếp (trên tổng số 9–10 cơn bão xuất hiện ở Biển Đông)",
                        "Khoảng 25 đến 30 cơn bão trực tiếp mỗi tháng",
                        "Không có cơn bão nào đổ bộ vào Việt Nam",
                        "Chỉ có đúng 1 cơn bão duy nhất trong 10 năm"
                    ],
                    correct: 0,
                    explanation: "Trung bình mỗi năm Biển Đông có 9–10 cơn bão, trong đó 3–4 cơn đổ bộ trực tiếp qua bờ biển nước ta."
                },
                {
                    q: "Theo bài đọc, mùa bão dọc bờ biển Việt Nam di chuyển theo quy luật thời gian nào từ Bắc vào Nam?",
                    options: [
                        "Chậm dần từ Bắc vào Nam (Bắc Bộ tập trung tháng 6–9, Miền Trung & Nam Bộ muộn hơn vào tháng 9–12)",
                        "Chậm dần từ Nam ra Bắc (Nam Bộ đón bão vào tháng 1, Bắc Bộ đón bão vào tháng 12)",
                        "Tất cả các vùng đều chỉ có bão vào đúng tháng 1 âm lịch",
                        "Bão chỉ xuất hiện ở vùng núi Tây Nguyên, không bao giờ xuất hiện ở ven biển"
                    ],
                    correct: 0,
                    explanation: "Do sự dịch chuyển của dải hội tụ nhiệt đới, mùa bão ở Việt Nam chậm dần từ Bắc vào Nam (từ tháng 6 đến tháng 12)."
                },
                {
                    q: "Theo bài đọc, vùng biển Việt Nam chiếm diện tích khoảng bao nhiêu km² trong tổng diện tích Biển Đông?",
                    options: [
                        "Khoảng 1 triệu km² (trên tổng diện tích khoảng 3,447 triệu km² của Biển Đông)",
                        "Khoảng 100 km²",
                        "Khoảng 50 triệu km²",
                        "Bằng một nửa diện tích đất liền"
                    ],
                    correct: 0,
                    explanation: "Vùng biển Việt Nam rộng khoảng 1 triệu km² trên Biển Đông (gấp khoảng 3 lần diện tích đất liền)."
                },
                {
                    q: "Theo bài đọc, khu vực nào ở nước ta thường chịu tác động dữ dội nhất của bão kèm mưa lớn và nước biển dâng?",
                    options: [
                        "Vùng ven biển Bắc Trung Bộ và Đồng bằng sông Hồng",
                        "Vùng núi cao Tây Bắc giáp biên giới Lào",
                        "Vùng cao nguyên Lâm Viên ở Tây Nguyên",
                        "Vùng nội địa sâu trong đất liền không giáp biển"
                    ],
                    correct: 0,
                    explanation: "Ven biển Bắc Trung Bộ và Đồng bằng sông Hồng là hai khu vực đón bão tần suất cao và chịu thiệt hại nặng nề nhất."
                },
                {
                    q: "Theo bài đọc, giải pháp sinh thái bền vững nhất để chắn sóng và bảo vệ bờ biển trước giông bão là gì?",
                    options: [
                        "Bảo vệ và trồng mới hệ thống rừng ngập mặn, rừng phòng hộ ven biển kết hợp củng cố đê biển",
                        "Chặt bỏ toàn bộ cây xanh ven biển để gió thổi nhanh hơn",
                        "Khai thác hết cát ven biển để làm sâu bờ biển",
                        "Xây nhà cao tầng sát mép nước thay cho đê biển"
                    ],
                    correct: 0,
                    explanation: "Rừng ngập mặn và rừng phòng hộ ven biển là 'bức tường xanh' tự nhiên giúp triệt tiêu năng lượng sóng bão và chống xói lở bờ biển."
                }
            ]
        },
        {
            id: "storm_passage_2",
            title: "Chế Độ Nước Sông Ngòi & Đặc Trưng Thủy Văn 3 Miền Việt Nam",
            passage: "Mạng lưới sông ngòi Việt Nam dày đặc với 2.360 con sông dài trên 10 km, chảy chủ yếu theo hai hướng chính là Tây Bắc – Đông Nam và hướng vòng cung, đổ ra Biển Đông. Chế độ nước sông phụ thuộc chặt chẽ vào chế độ mưa gió mùa: mùa lũ tương ứng với mùa mưa và mùa cạn tương ứng với mùa khô. Tại Bắc Bộ, hệ thống sông Hồng có mùa lũ kéo dài từ tháng 6 đến tháng 10 (đỉnh lũ vào tháng 8) do mưa mùa hạ. Tại Duyên hải Miền Trung, sông ngòi ngắn và dốc nên lũ lên rất nhanh và đột ngột vào mùa Thu – Đông (từ tháng 9 đến tháng 12, đỉnh lũ vào tháng 10–11). Trong khi đó, hệ thống sông Mê Công (Cửu Long) ở Nam Bộ có lòng sông rộng, điều hòa bởi Biển Hồ (Campuchia) nên lũ lên và rút chậm từ tháng 7 đến tháng 11, mang lại lượng phù sa màu mỡ và nguồn thủy sản dồi dào cho Đồng bằng sông Cửu Long.",
            questions: [
                {
                    q: "Theo bài đọc, cả nước Việt Nam có khoảng bao nhiêu con sông có chiều dài trên 10 km và chảy theo hai hướng chính nào?",
                    options: [
                        "2.360 con sông; chảy theo hai hướng chính là Tây Bắc – Đông Nam và hướng vòng cung",
                        "Chỉ có 12 con sông; chảy hoàn toàn từ Đông sang Tây",
                        "50.000 con sông; chảy từ Nam ra Bắc",
                        "100 con sông; không đổ ra Biển Đông"
                    ],
                    correct: 0,
                    explanation: "Địa hình Việt Nam nghiêng theo hướng Tây Bắc – Đông Nam quy định mạng lưới 2.360 con sông chảy theo hướng Tây Bắc – Đông Nam và vòng cung."
                },
                {
                    q: "Theo bài đọc, vì sao sông ngòi ở khu vực Duyên hải Miền Trung thường có lũ lên rất nhanh và đột ngột?",
                    options: [
                        "Do địa hình hẹp ngang, dãy Trường Sơn sát biển làm sông ngòi ngắn và rất dốc, kết hợp mưa lớn tập trung vào Thu – Đông",
                        "Do băng tuyết từ đỉnh núi tan chảy đột ngột",
                        "Do sông ở Miền Trung dài hàng chục ngàn km",
                        "Do không có cửa biển thoát nước"
                    ],
                    correct: 0,
                    explanation: "Sông ngòi Miền Trung ngắn, độ dốc lớn, lưu vực nhỏ nên khi có mưa bão Thu – Đông nước dồn về cực nhanh gây lũ quét, lũ ống."
                },
                {
                    q: "Theo bài đọc, mùa lũ trên các con sông ở Duyên hải Miền Trung diễn ra vào thời gian nào (lệch pha so với Bắc Bộ và Nam Bộ)?",
                    options: [
                        "Vào mùa Thu – Đông (từ tháng 9 đến tháng 12, đỉnh lũ tháng 10–11)",
                        "Vào giữa mùa xuân (tháng 2 – tháng 3)",
                        "Vào đầu mùa hạ (tháng 5 – tháng 6)",
                        "Quanh năm không bao giờ có mùa lũ"
                    ],
                    correct: 0,
                    explanation: "Khác với Bắc Bộ và Nam Bộ mưa vào mùa hạ, Miền Trung mưa lớn vào Thu – Đông nên mùa lũ sông ngòi ở đây rơi vào tháng 9–12."
                },
                {
                    q: "Theo bài đọc, yếu tố tự nhiên nào giúp lũ trên hệ thống sông Cửu Long (Mê Công) lên êm và rút chậm hơn so với các vùng khác?",
                    options: [
                        "Nhờ lòng sông rộng, địa hình bằng phẳng và sự điều tiết nước tự nhiên của Biển Hồ (Tonlé Sap) ở Campuchia",
                        "Nhờ dãy núi Hoàng Liên Sơn chắn ngang cửa sông",
                        "Nhờ không có mưa vào mùa hạ",
                        "Nhờ nước sông chảy ngược lên phía Bắc"
                    ],
                    correct: 0,
                    explanation: "Biển Hồ (Campuchia) đóng vai trò hồ điều hòa khổng lồ giúp mùa nước nổi ở ĐBSCL lên từ từ và rút êm dịu từ tháng 7 đến tháng 11."
                },
                {
                    q: "Theo bài đọc, hệ thống sông Hồng ở Bắc Bộ có mùa lũ kéo dài trong khoảng thời gian nào và đạt đỉnh lũ vào tháng mấy?",
                    options: [
                        "Mùa lũ từ tháng 6 đến tháng 10, đỉnh lũ cao nhất vào tháng 8",
                        "Mùa lũ từ tháng 11 đến tháng 3 năm sau, đỉnh lũ vào tháng 1",
                        "Mùa lũ chỉ diễn ra trong 3 ngày của tháng 12",
                        "Sông Hồng không có mùa lũ và mùa cạn"
                    ],
                    correct: 0,
                    explanation: "Trùng với mùa mưa gió mùa mùa hạ ở Bắc Bộ, sông Hồng có mùa lũ từ tháng 6–10 và đỉnh lũ rơi vào tháng 8."
                }
            ]
        }
    ]
};
