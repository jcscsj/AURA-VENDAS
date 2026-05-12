import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import cookieParser from "cookie-parser";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
// import { initializeDatabase } from "../initDb";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  // Initialize database tables
  // await initializeDatabase();

  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Parse cookies for local authentication
  app.use(cookieParser());
  // registerStorageProxy(app);
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // ROTA DO WEBHOOK DA CAKTO (PÚBLICA)
  app.post("/api/webhook/cakto", express.json(), async (req, res) => {
    // FATO TÉCNICO: A Cakto envia a assinatura para validação de segurança
    const signature = req.headers['x-cakto-signature'];
    
    if (signature !== process.env.CAKTO_WEBHOOK_SECRET) {
      console.warn("[Webhook] Assinatura inválida detectada.");
      return res.status(401).send("Unauthorized");
    }

    const { event, data } = req.body;
    console.log(`[Cakto Webhook] Evento recebido: ${event}`);

    // Na Cakto, o evento de sucesso é 'payment.approved'
    if (event === "payment.approved" || event === "purchase_approved") {
      const orderId = data.external_id;
      
      // 1. Atualiza no TiDB para 'completed'
      const updatedOrder = await db.updateOrderStatus(Number(orderId), "completed");
      
      if (updatedOrder) {
        // 2. Dispara a notificação de confirmação (Verde) no Discord
        const { notifyDiscordSuccess } = await import("../routers");
        await notifyDiscordSuccess(updatedOrder);
        console.log(`[Cakto] Pedido #${orderId} aprovado e notificado.`);
      }
    }
    
    // Respondemos sempre 200 para a Cakto não ficar reenviando o mesmo aviso
    res.status(200).send("OK");
  });

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
