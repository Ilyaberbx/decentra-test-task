import { Hono } from "hono";
import { services } from "../services.js";

const app = new Hono();

app.post("/", async (context) => {
  if (services.cronService.isSyncing()) {
    return context.json(
      {
        success: false,
        error: "Synchronization already in progress",
        message: "Please wait for the current sync operation to complete before starting a new one",
      },
      409
    );
  }

  try {
    console.log("Manual sync triggered via API");
    services.cronService.syncCards();
    return context.json({ success: true, message: "Card synchronization triggerd successfully" });
  } catch (error) {
    console.error("Error during manual sync:", error);
    return context.json(
      { success: false, error: "Failed to synchronize cards", details: error instanceof Error ? error.message : String(error) },
      500
    );
  }
});

export default app;
