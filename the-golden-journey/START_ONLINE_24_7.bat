@echo off
chcp 65001 >nul
title THE GOLDEN JOURNEY - SERVER ONLINE 24/7 (KHONG TAT CUA SO NAY)
cd /d "%~dp0"

echo ============================================================================
echo   THE GOLDEN JOURNEY (HANH TRINH VANG SON) - SERVER ONLINE TU PHUC HOI 24/7
echo ============================================================================
echo.
echo [+] Dang khoi dong Server Game tren cong 8090 va Cloudflare Tunnel...
echo [+] Link Online se hien thi ngay ben duoi (va luu trong LINK_ONLINE_HIEN_TAI.txt)
echo.

:loop
node server.js
echo [!] Server vua tam dung, dang tu dong khoi dong lai sau 2 giay...
timeout /t 2 /nobreak >nul
goto loop
