@echo off
chcp 65001 >nul
echo ========================================================
echo  💎 正在启动 Crystal Studio (KIP Protocol Workbench)    
echo ========================================================
echo 🌐 专属端口: http://localhost:5773 运行，即将自动打开浏览器...

cd /d "%~dp0\crystal-studio"
npm run dev -- --open
pause
