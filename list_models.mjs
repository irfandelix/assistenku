import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from "fs";

// Read env variables from .env.local
const envFile = fs.readFileSync(".env.local", "utf-8");
const envVars = {};
envFile.split("\n").forEach(line => {
  if (line && line.includes("=")) {
    const [key, val] = line.split("=");
    envVars[key.trim()] = val.trim();
  }
});

const apiKey = envVars.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("GEMINI_API_KEY not found in .env.local");
  process.exit(1);
}

// In standard @google/generative-ai SDK, there's no direct listModels method exposed on the main class
// But we can just use fetch to hit the REST API directly to be safe
async function listModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.models) {
    console.log("Available models:");
    data.models.forEach(m => {
      // only print models that support generateContent
      if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
         console.log(`- ${m.name}`);
      }
    });
  } else {
    console.log("Response:", data);
  }
}

listModels().catch(console.error);
