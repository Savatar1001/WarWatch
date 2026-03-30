@echo off
echo ========================================
echo  WarIntel -- Push to DEV
echo  Branch: dev
echo  Target: github.com/Savatar1001/WarIntel
echo ========================================
set /p DESC="Change description: "
D:
cd "D:\_Development\Projects\Repos\WarIntel\WarIntel.info.dev"
git add .
git commit -m "%DESC%"
git pull --rebase origin dev
git push origin dev
echo ========================================
echo  Done. Pushed to DEV branch.
echo ========================================
pause
