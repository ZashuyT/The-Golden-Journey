@echo off
chcp 65001 >nul
echo ============================================================================
echo   THE GOLDEN JOURNEY (HÀNH TRÌNH VÀNG SON) - KHỞI TẠO LINK CHƠI ONLINE
echo ============================================================================
echo.
echo [1/2] Đang khởi động Máy chủ Game + Hệ thống Phòng Chơi (Cổng 8090)...
start "Golden Journey Server" cmd /c "node server.js"
timeout /t 2 >nul
echo.
echo [2/2] Đang tạo đường dẫn Online (HTTPS) qua Internet để gửi cho bạn bè...
echo (Hãy copy đường link https://....lhr.life hoặc https://....trycloudflare.com hiện ra bên dưới và gửi cho bạn bè!)
echo.
ssh -o StrictHostKeyChecking=no -R 80:localhost:8090 nokey@localhost.run
pause
