Unicode True
!include "MUI2.nsh"
Name "IL Bate Papo"
OutFile "../downloads/IL-Bate-Papo-Windows-1.0.4-Setup.exe"
InstallDir "$LOCALAPPDATA\Programs\IL Bate Papo"
RequestExecutionLevel user
SetCompressor /SOLID lzma
Icon "../favicon.ico"
UninstallIcon "../favicon.ico"
VIProductVersion "1.0.4.0"
VIAddVersionKey /LANG=1046 "ProductName" "IL Bate Papo"
VIAddVersionKey /LANG=1046 "FileDescription" "Instalador IL Bate Papo para Windows"
VIAddVersionKey /LANG=1046 "FileVersion" "1.0.4"
VIAddVersionKey /LANG=1046 "LegalCopyright" "IL Bate Papo"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_INSTFILES
!define MUI_FINISHPAGE_RUN
!define MUI_FINISHPAGE_RUN_FUNCTION OpenChat
!define MUI_FINISHPAGE_RUN_TEXT "Abrir IL Bate Papo"
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "PortugueseBR"
Var Edge
Function .onInit
 SetShellVarContext current
 StrCpy $Edge "$PROGRAMFILES64\Microsoft\Edge\Application\msedge.exe"
 IfFileExists "$Edge" done
 StrCpy $Edge "$PROGRAMFILES32\Microsoft\Edge\Application\msedge.exe"
 IfFileExists "$Edge" done
 StrCpy $Edge "$LOCALAPPDATA\Microsoft\Edge\Application\msedge.exe"
 IfFileExists "$Edge" done
 MessageBox MB_OK|MB_ICONINFORMATION "Instale ou atualize o Microsoft Edge antes de instalar o IL Bate Papo."
 Abort
 done:
FunctionEnd
Section "IL Bate Papo"
 SetOutPath "$INSTDIR"
 File /oname=IL-Bate-Papo.ico "../favicon.ico"
 CreateDirectory "$SMPROGRAMS\IL Bate Papo"
 CreateShortCut "$SMPROGRAMS\IL Bate Papo\IL Bate Papo.lnk" "$Edge" '--app=https://bate.papo.il-talk.com.br/' "$INSTDIR\IL-Bate-Papo.ico"
 CreateShortCut "$DESKTOP\IL Bate Papo.lnk" "$Edge" '--app=https://bate.papo.il-talk.com.br/' "$INSTDIR\IL-Bate-Papo.ico"
 WriteUninstaller "$INSTDIR\Desinstalar.exe"
 WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ILBatePapo" "DisplayName" "IL Bate Papo"
 WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ILBatePapo" "DisplayVersion" "1.0.4"
 WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ILBatePapo" "UninstallString" '$\"$INSTDIR\Desinstalar.exe$\"'
 WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ILBatePapo" "DisplayIcon" "$INSTDIR\IL-Bate-Papo.ico"
 WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ILBatePapo" "NoModify" 1
 WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ILBatePapo" "NoRepair" 1
SectionEnd
Function OpenChat
 Exec '$\"$Edge$\" --app=https://bate.papo.il-talk.com.br/'
FunctionEnd
Section "Uninstall"
 SetShellVarContext current
 Delete "$DESKTOP\IL Bate Papo.lnk"
 Delete "$SMPROGRAMS\IL Bate Papo\IL Bate Papo.lnk"
 RMDir "$SMPROGRAMS\IL Bate Papo"
 Delete "$INSTDIR\IL-Bate-Papo.ico"
 Delete "$INSTDIR\Desinstalar.exe"
 RMDir "$INSTDIR"
 DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ILBatePapo"
SectionEnd
