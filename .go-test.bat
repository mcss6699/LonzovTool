@echo off
chcp 65001 >nul
echo ==========================================
echo 启动局域网Web服务器
call echo 端口: 6699
call echo 绑定地址: 0.0.0.0 (所有网络接口)
call echo 注意: 你可能需要注释掉html头部中的 http-equiv 声明才可使用
echo ==========================================
echo.
py -m http.server 6699 --bind 0.0.0.0
echo.
echo 服务器已停止运行
pause