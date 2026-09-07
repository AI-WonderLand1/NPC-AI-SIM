# NPC white-screen recovery

The editor now guards the Three.js/WebGL viewport and the React application shell so browser-side WebGL failures no longer blank the entire app.

If WebGL is unavailable, the editor remains visible and reports that the 3D viewport could not initialize. A top-level application error boundary also replaces otherwise blank runtime crashes with a recovery screen.
