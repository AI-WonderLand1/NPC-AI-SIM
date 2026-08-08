import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";

// Vite middleware for development or static serving for production
async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for large base64 image/video payloads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Helper to initialize Gemini Client
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  // API 1: NPC Gemini Intelligence / Tactical Reasoning Tool
  app.post("/api/gemini/npc-intelligence", async (req, res) => {
    try {
      const { prompt, npcStats, behaviorNodes } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.status(400).json({
          error: "GEMINI_API_KEY is not configured in environment.",
          fallback: true,
        });
      }

      const systemInstruction = `You are the AI Behavior Core engine for an NPC in a 3D video game studio.
Analyze the user's natural language input, current NPC stats (HP: ${npcStats?.health || 200}/${npcStats?.maxHealth || 200}, AI Mode: ${npcStats?.aiMode || 'Patrol'}, Speed: ${npcStats?.walkSpeed || 1.8}m/s), and active behavior tree state.
Determine how the NPC should react by selecting an event action, animation, updated AI mode, and command.

Possible event actions: 'player_spotted', 'player_lost', 'take_damage', 'receive_command', 'heal', 'stun'.
Possible commands: 'Guard Post', 'Patrol Route', 'Charge Attack', 'Retreat / Fallback'.
Possible animations: 'anim_idle', 'anim_patrol', 'anim_run', 'anim_attack_1', 'anim_shield', 'anim_death'.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt || "Analyze target environment and execute optimal behavior.",
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              action: {
                type: Type.STRING,
                description: "Event action to trigger on NPC Behavior Tree",
              },
              commandName: {
                type: Type.STRING,
                description: "Specific tactical command",
              },
              aiThought: {
                type: Type.STRING,
                description: "Short internal AI monologue/thought process of the NPC",
              },
              recommendedAnim: {
                type: Type.STRING,
                description: "Animation ID to switch to",
              },
              updatedAiMode: {
                type: Type.STRING,
                description: "Updated AI Mode: 'Aggressive', 'Patrol', 'Guard', 'Passive'",
              },
              logMessage: {
                type: Type.STRING,
                description: "Professional console log output describing the NPC reaction",
              },
            },
            required: ["action", "aiThought", "recommendedAnim", "updatedAiMode", "logMessage"],
          },
        },
      });

      const responseText = response.text || "{}";
      const result = JSON.parse(responseText);
      res.json({ success: true, ...result });
    } catch (err: any) {
      console.error("Gemini Intelligence API Error:", err);
      res.status(500).json({ error: err?.message || "Failed to query Gemini Intelligence" });
    }
  });

  // API 2: NPC Image Perception / Target Visual Analysis Tool
  app.post("/api/gemini/npc-vision", async (req, res) => {
    try {
      const { imageBase64, mimeType = "image/png", prompt, npcStats } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.status(400).json({
          error: "GEMINI_API_KEY is not configured in environment.",
          fallback: true,
        });
      }

      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

      const imagePart = {
        inlineData: {
          mimeType,
          data: cleanBase64,
        },
      };

      const userText = prompt || "Analyze this camera frame from the NPC's vision sensor. Identify entities, threat level, and determine behavior tree trigger.";

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: {
          parts: [
            imagePart,
            { text: userText }
          ]
        },
        config: {
          systemInstruction: "You are the optical sight sensor analyzer for an NPC in a 3D game engine. Evaluate the input image, detect hostiles/friendlies/obstacles, estimate threat level (0-100), and return a behavior event trigger.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              detectedObjects: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of identified entities in the frame",
              },
              threatLevel: {
                type: Type.NUMBER,
                description: "Threat rating from 0 (safe) to 100 (extreme danger)",
              },
              targetType: {
                type: Type.STRING,
                description: "Type: 'Hostile', 'Friendly', 'Neutral', 'Obstacle', 'Unknown'",
              },
              description: {
                type: Type.STRING,
                description: "Visual analysis summary",
              },
              triggeredEvent: {
                type: Type.STRING,
                description: "Behavior event: 'player_spotted', 'player_lost', 'take_damage', 'receive_command', 'heal', 'stun'",
              },
              suggestedAction: {
                type: Type.STRING,
                description: "Action recommendation for NPC",
              },
            },
            required: ["detectedObjects", "threatLevel", "targetType", "description", "triggeredEvent", "suggestedAction"],
          },
        },
      });

      const responseText = response.text || "{}";
      const result = JSON.parse(responseText);
      res.json({ success: true, ...result });
    } catch (err: any) {
      console.error("Gemini Vision API Error:", err);
      res.status(500).json({ error: err?.message || "Failed to process image with Gemini Vision" });
    }
  });

  // API 3: NPC Video Reconnaissance / Surveillance Analysis Tool
  app.post("/api/gemini/npc-video", async (req, res) => {
    try {
      const { videoBase64, mimeType = "video/mp4", prompt } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.status(400).json({
          error: "GEMINI_API_KEY is not configured in environment.",
          fallback: true,
        });
      }

      const cleanBase64 = videoBase64.replace(/^data:video\/\w+;base64,/, "");

      const videoPart = {
        inlineData: {
          mimeType,
          data: cleanBase64,
        },
      };

      const userText = prompt || "Analyze this surveillance video clip for NPC tactical reconnaissance. Detect motion, suspicious hostiles, and security breaches.";

      // Use gemini-3.1-pro-preview for advanced video analysis as required
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: {
          parts: [
            videoPart,
            { text: userText }
          ]
        },
        config: {
          systemInstruction: "You are an automated military surveillance & video reconnaissance AI system for an NPC patrol squad. Analyze video frames, detect key movements, hostiles, and determine security response.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              surveillanceSummary: {
                type: Type.STRING,
                description: "High-level summary of video events",
              },
              detectedMovements: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Observed movement behaviors or patterns",
              },
              threatLevel: {
                type: Type.NUMBER,
                description: "Threat rating 0-100",
              },
              keyEvents: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    timestamp: { type: Type.STRING },
                    event: { type: Type.STRING },
                    threat: { type: Type.STRING },
                  },
                },
              },
              behaviorTreeAction: {
                type: Type.STRING,
                description: "Behavior event: 'player_spotted', 'player_lost', 'take_damage', 'receive_command', 'heal', 'stun'",
              },
              tacticalCommand: {
                type: Type.STRING,
                description: "Command recommendation: 'Guard Post', 'Patrol Route', 'Charge Attack', 'Retreat / Fallback'",
              },
            },
            required: ["surveillanceSummary", "detectedMovements", "threatLevel", "behaviorTreeAction", "tacticalCommand"],
          },
        },
      });

      const responseText = response.text || "{}";
      const result = JSON.parse(responseText);
      res.json({ success: true, ...result });
    } catch (err: any) {
      console.error("Gemini Video API Error:", err);
      res.status(500).json({ error: err?.message || "Failed to process video with Gemini Pro" });
    }
  });

   // Health check endpoint
   app.get("/api/health", (req, res) => {
     res.json({ status: "ok", time: new Date().toISOString() });
   });

   // Contact form endpoint
   app.post("/api/contact", async (req, res) => {
     try {
       const { name, email, message } = req.body;
       
       // Basic validation
       if (!name || !email || !message) {
         return res.status(400).json({ 
           error: "Name, email, and message are required" 
         });
       }
       
       // In a real application, you would:
       // 1. Send an email using a service like SendGrid, Mailgun, etc.
       // 2. Store the message in a database
       // 3. Possibly trigger a notification
       
       // For now, we'll just log the contact form submission
       console.log("Contact form submission:", { name, email, message });
       
       // Simulate processing delay
       await new Promise(resolve => setTimeout(resolve, 1000));
       
       res.json({ 
         success: true,
         message: "Thank you for your message! We'll get back to you soon."
       });
     } catch (err: any) {
       console.error("Contact form error:", err);
       res.status(500).json({ 
         error: err?.message || "Failed to process contact form" 
       });
     }
   });

   // Vite middleware for development or static serving for production
   if (process.env.NODE_ENV !== "production") {
     const { createServer: createViteServer } = await import("vite");
     const vite = await createViteServer({
       server: { middlewareMode: true },
       appType: "spa",
     });
     app.use(vite.middlewares);
   } else {
     const distPath = path.join(process.cwd(), "dist/client");
     app.use(express.static(distPath));
      app.get("/*splat", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
   }

   app.listen(PORT, "0.0.0.0", () => {
     console.log(`Server running on http://0.0.0.0:${PORT}`);
   });
}

startServer();
