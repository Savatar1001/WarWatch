@echo off
echo ========================================
echo  WarIntel -- Push to PROD
echo  Branch: prod
echo  Target: github.com/Savatar1001/WarIntel
echo  WARNING: This pushes to production!
echo ========================================
set /p DESC="Change description: "
D:
cd "D:\_Development\Projects\Repos\WarIntel\WarIntel.info.dev"
git add .
git commit -m "%DESC%"
git pull --rebase origin prod
git push origin prod
echo ========================================
echo  Done. Pushed to PROD branch.
echo ========================================
pause
