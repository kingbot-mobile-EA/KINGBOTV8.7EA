// =====================================================================
//  KingBot V8.7 Platform — Runtime configuration
//  Load this BEFORE app.js on every page:  <script src="js/config.js"></script>
//  Set apiBase to your deployed Render backend URL.
// =====================================================================
window.KINGBOT_CONFIG = {
  // ---- Production backend (Render) ----
  // Replace with your Render URL after deploying the backend:
  apiBase: "https://kingbot-platform-backend.onrender.com",

  // ---- Local development ----
  // Uncomment the line below and comment the production line to test locally:
  // apiBase: "http://localhost:8080",

  // ---- Branding ----
  brand: "KingBot V8.7",
  company: "GIBSONFX TECH",
  eaVersion: "8.7.0",
  eaName: "MICRO-FLIP",

  // ---- Feature flags ----
  features: {
    aiChat: true,
    emailVerification: true,
    phoneOtp: true,
    matrixTheme: true,
  },
};
