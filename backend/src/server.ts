import { createApp } from "./app.js";
import { config } from "./config.js";
import { logEvent } from "./utils/log.js";

const app = createApp();

app.listen(config.port, () => {
  logEvent("info", "backend_started", {
    port: config.port,
    appUrl: config.appUrl,
    allowedOrigins: config.allowedOrigins
  });
});
