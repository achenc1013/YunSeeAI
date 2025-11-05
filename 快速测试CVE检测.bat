@echo off
chcp 65001 > nul
echo.
echo ========================================
echo   CVE检测功能快速测试
echo ========================================
echo.
echo 正在编译项目...
call npm run build
echo.
echo ========================================
echo 编译完成！
echo.
echo 现在将启动YunSeeAI...
echo 启动后，请输入以下命令测试：
echo.
echo   http://192.168.20.144/ 存在CVE漏洞吗
echo.
echo ========================================
echo.
pause
call npm start

