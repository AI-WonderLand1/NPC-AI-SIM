# AAA Viewport HUD Visual QA

Check at 1920x1080 and 1366x768:

- character name remains readable over bright and dark environments
- HUD corners do not block orbit controls
- Training Lab badge is visible but secondary to character presentation
- runtime status truncates instead of overflowing
- bottom-right quality/stat block remains inside viewport
- software preview fallback still renders the HUD cleanly
- no pointer events from HUD interfere with Three.js interaction
- no white-screen failure if WebGL/model/environment loading fails
