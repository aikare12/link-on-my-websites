import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import dns from "node:dns/promises";
import net from "node:net";

const app = express();
const PORT = Number(process.env.PORT || 3000);
const origins = (process.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({origin(origin, cb) {
  if (!origin || origins.length === 0 || origins.includes(origin)) return cb(null, true);
  return cb(new Error("Origin not allowed"));
}}));
app.use(express.json({limit:"10kb"}));
app.use(rateLimit({windowMs:60000, limit:30, standardHeaders:true, legacyHeaders:false}));

function privateIP(ip) {
  if (net.isIPv4(ip)) {
    const p = ip.split(".").map(Number);
    return p[0] === 10 || p[0] === 127 || p[0] === 0 ||
      (p[0] === 169 && p[1] === 254) ||
      (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
      (p[0] === 192 && p[1] === 168) || p[0] >= 224;
  }
  const x = ip.toLowerCase();
  return x === "::" || x === "::1" || x.startsWith("fc") ||
    x.startsWith("fd") || x.startsWith("fe80:") ||
    x.startsWith("::ffff:127.") || x.startsWith("::ffff:10.");
}
async function validateUrl(raw) {
  let u;
  try { u = new URL(raw); } catch { throw new Error("URL ntiyemewe."); }
  if (!["http:","https:"].includes(u.protocol)) throw new Error("Koresha HTTP cyangwa HTTPS.");
  if (u.username || u.password) throw new Error("URL irimo amakuru yo kwinjira ntiyemewe.");
  if (u.port && !["80","443"].includes(u.port)) throw new Error("Port ntiyemewe.");
  const host = u.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) throw new Error("Host ntiyemewe.");
  if (net.isIP(host)) {
    if (privateIP(host)) throw new Error("Private IP ntiyemewe.");
  } else {
    const records = await dns.lookup(host, {all:true});
    if (!records.length || records.some(r => privateIP(r.address))) throw new Error("Host ntiyemewe.");
  }
  return u;
}
app.get("/api/health", (_req,res) => res.json({ok:true, app:"@ikare"}));
app.post("/api/check-link", async (req,res) => {
  try {
    if (typeof req.body?.url !== "string" || req.body.url.length > 2048) return res.status(400).json({error:"Shyiramo link yemewe."});
    const u = await validateUrl(req.body.url);
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    const providers = [["youtube.com","YouTube"],["youtu.be","YouTube"],["tiktok.com","TikTok"],["instagram.com","Instagram"],["facebook.com","Facebook"],["fb.watch","Facebook"],["vimeo.com","Vimeo"],["x.com","X"],["twitter.com","X"]];
    const match = providers.find(([d]) => host === d || host.endsWith("." + d));
    res.json({ok:true, host, platform:match?.[1] || null, directVideo:/\.(mp4|webm|mov|m4v|ogv)$/i.test(u.pathname),
      message:match ? "Koresha uburyo bwemewe bwo kubika butangwa n'urubuga." : "Link yagenzuwe."});
  } catch (e) { res.status(400).json({error:e.message || "Link ntiyagenzuwe."}); }
});
app.use((err,_req,res,_next) => res.status(400).json({error:err.message || "Request ntiyemewe."}));
app.listen(PORT, () => console.log(`@ikare backend running on ${PORT}`));
