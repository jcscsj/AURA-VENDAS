import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { ENV } from "./_core/env";
import crypto from "crypto";

// Função para enviar notificação Discord com @mention
async function notifyDiscordOrder(order: any, items: any[]) {
  if (!ENV.discordWebhookUrl) return;
  
  try {
    const itemsText = items.map(item => `- ${item.name} x${item.quantity} - R$ ${(item.price / 100).toFixed(2)}`).join("\n");
    
    // Criar mention se tiver discordId
    let mention = "";
    if (order.discordId) {
      mention = `<@${order.discordId}>`;
    }
    
    const embed = {
      title: "🛒 Novo Pedido Realizado!",
      color: 16744192, // Laranja
      fields: [
        { name: "Jogador", value: `${mention} ${order.playerNick}`, inline: true },
        { name: "ID do Jogo", value: order.gameId || "Não informado", inline: true },
        { name: "Discord", value: order.discord || "Não informado", inline: true },
        { name: "Produtos", value: itemsText || "N/A", inline: false },
        { name: "Subtotal", value: `R$ ${(order.subtotal / 100).toFixed(2)}`, inline: true },
        { name: "Desconto", value: `R$ ${(order.discount / 100).toFixed(2)}`, inline: true },
        { name: "Total", value: `R$ ${(order.total / 100).toFixed(2)}`, inline: true },
        { name: "Status", value: "⏳ Pendente", inline: false },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: "Aura City - Sistema de Vendas" },
    };
    
    await fetch(ENV.discordWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        content: mention ? `${mention}` : undefined,
        embeds: [embed] 
      }),
    });
  } catch (error) {
    console.error("[Discord] Erro ao enviar notificação:", error);
  }
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(async ({ ctx }) => {
      return ctx.user || null;
    }),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      // Garante que apaga todas as chaves possíveis do site
      ctx.res.clearCookie("app_session_id");
      ctx.res.clearCookie("adminSession"); 
      ctx.res.clearCookie("localSession");
      return { success: true };
    }),
    register: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(6),
          name: z.string().min(1),
          gameId: z.string().min(1),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const existing = await db.getLocalAccountByEmail(input.email);
        if (existing) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Email já cadastrado",
          });
        }

        const passwordHash = crypto
          .createHash("sha256")
          .update(input.password)
          .digest("hex");

        const account = await db.createLocalAccount({
          email: input.email,
          passwordHash,
          name: input.name,
          gameId: input.gameId,
        });

        if (!account) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erro ao criar conta",
          });
        }

        const sessionData = JSON.stringify({
          id: account.id,
          email: account.email,
          name: account.name,
          gameId: account.gameId,
        });
        const sessionCookie = Buffer.from(sessionData).toString("base64");

        ctx.res.cookie("localSession", sessionCookie);

        return {
          id: account.id,
          email: account.email,
          name: account.name,
          gameId: account.gameId,
        };
      }),
    login: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(6),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const account = await db.getLocalAccountByEmail(input.email);
        if (!account) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Email ou senha incorretos",
          });
        }

        const passwordHash = crypto
          .createHash("sha256")
          .update(input.password)
          .digest("hex");

        if (passwordHash !== account.passwordHash) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Email ou senha incorretos",
          });
        }

        // Update last signed in timestamp

        const sessionData = JSON.stringify({
          id: account.id,
          email: account.email,
          name: account.name,
          gameId: account.gameId,
        });
        const sessionCookie = Buffer.from(sessionData).toString("base64");

        ctx.res.cookie("localSession", sessionCookie);

        return {
          id: account.id,
          email: account.email,
          name: account.name,
          gameId: account.gameId,
        };
      }),
    getProfile: publicProcedure.query(async ({ ctx }) => {
      if (ctx.user) {
        return ctx.user;
      }
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Não autenticado",
      });
    }),
    updateProfile: publicProcedure
      .input(
        z.object({
          name: z.string().optional(),
          gameId: z.string().optional(),
          characterName: z.string().optional(),
          profilePicture: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Não autenticado",
          });
        }

        const updates: any = {};
        if (input.name) updates.name = input.name;
        if (input.gameId) updates.gameId = input.gameId;
        if (input.characterName) updates.characterName = input.characterName;
        if (input.profilePicture) updates.profilePicture = input.profilePicture;

        await db.updateUserProfile(ctx.user.id, updates);

        return {
          ...ctx.user,
          ...updates,
        };
      }),
    adminLogin: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(6),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const admin = await db.getAdminByEmail(input.email);
        if (!admin) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Email ou senha incorretos",
          });
        }

        const passwordHash = crypto
          .createHash("sha256")
          .update(input.password)
          .digest("hex");

        if (passwordHash !== admin.passwordHash) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Email ou senha incorretos",
          });
        }

        await db.updateAdminLastSignedIn(admin.id);

        const sessionData = JSON.stringify({
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: "admin",
        });
        const sessionCookie = Buffer.from(sessionData).toString("base64");

        ctx.res.cookie("adminSession", sessionCookie);

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: "admin",
        };
      }),
    adminLogout: publicProcedure.mutation(async ({ ctx }) => {
      ctx.res.clearCookie("adminSession");
      return { success: true };
    }),
    resetAdminPassword: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          newPassword: z.string().min(6),
          resetKey: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        if (input.resetKey !== "AURACITY_RESET_2026") {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Chave de reset invalida",
          });
        }

        const admin = await db.getAdminByEmail(input.email);
        if (!admin) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Admin nao encontrado",
          });
        }

        const newPasswordHash = crypto
          .createHash("sha256")
          .update(input.newPassword)
          .digest("hex");

        await db.updateAdminPassword(admin.id, newPasswordHash);

        return { success: true, message: "Senha resetada com sucesso" };
      }),
    createAdmin: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(6),
          name: z.string().min(1),
          setupKey: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (input.setupKey !== "AURACITY_SETUP_2026") {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Chave de setup inválida",
          });
        }

        const existing = await db.getAdminByEmail(input.email);
        if (existing) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Email já cadastrado",
          });
        }

        const passwordHash = crypto
          .createHash("sha256")
          .update(input.password)
          .digest("hex");

        const admin = await db.createAdmin({
          email: input.email,
          passwordHash,
          name: input.name,
        } as any);

        if (!admin) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erro ao criar admin",
          });
        }

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: "admin",
        };
      }),
  }),
  shop: router({
    users: router({
      list: publicProcedure.query(async ({ ctx }) => {
        if (ctx.user?.role !== "admin" && !ctx.adminSession) throw new TRPCError({ code: "FORBIDDEN" });
        return db.getUsers(); 
      }),
    }),
    categories: router({
      list: publicProcedure.query(async () => {
        return db.getCategories();
      }),
    }),
    products: router({
      list: publicProcedure.query(async () => {
        return db.getProducts();
      }),
    }),
    banners: router({
      list: publicProcedure.query(async () => {
        return db.getBanners();
      }),
    }),
    orders: router({
      create: publicProcedure
        .input(
          z.object({
            playerNick: z.string(),
            gameId: z.string(),
            discord: z.string().optional(),
            discordId: z.string().optional(),
            items: z.array(
              z.object({
                productId: z.number(),
                quantity: z.number(),
                price: z.number(),
              })
            ),
            subtotal: z.number(),
            discount: z.number(),
            total: z.number(),
          })
        )
        .mutation(async ({ input }) => {
          const order = await db.createOrder({
            playerNick: input.playerNick,
            gameId: input.gameId,
            discord: input.discord,
            discordId: input.discordId,
            items: input.items,
            subtotal: input.subtotal,
            discount: input.discount,
            total: input.total,
            status: "pending",
          });

          if (order) {
            await notifyDiscordOrder(order, input.items);
          }

          return order;
        }),
      list: publicProcedure.query(async () => {
        return db.getOrders();
      }),
      getByGameId: publicProcedure
        .input(z.object({ gameId: z.string() }))
        .query(async ({ input }) => {
          return db.getOrdersByGameId(input.gameId);
        }),
      updateStatus: publicProcedure
        .input(z.object({ orderId: z.number(), status: z.string() }))
        .mutation(async ({ input, ctx }) => {
          if (ctx.user?.role !== "admin" && !ctx.adminSession) throw new TRPCError({ code: "FORBIDDEN" });
          return db.updateOrderStatus(input.orderId, input.status);
        }),
    }),
    admin: router({
      categories: router({
        list: publicProcedure.query(async () => {
          return db.getCategories();
        }),
        create: publicProcedure
          .input(z.object({ name: z.string().min(1) }))
          .mutation(async ({ input, ctx }) => {
            // Checagem de admin (E-mail ou Discord)
            if (ctx.user?.role !== "admin" && !ctx.adminSession) {
              throw new TRPCError({ code: "FORBIDDEN" });
            }
            // Chama a nossa nova função de SQL Puro
            return db.createCategory(input);
          }),
        update: publicProcedure
          .input(z.object({ id: z.number(), name: z.string().min(1) }))
          .mutation(async ({ input, ctx }) => {
            if (ctx.user?.role !== "admin" && !ctx.adminSession) throw new TRPCError({ code: "FORBIDDEN" });
            return db.updateCategory(input.id, { name: input.name });
          }),
        delete: publicProcedure
          .input(z.object({ id: z.number() }))
          .mutation(async ({ input, ctx }) => {
            if (ctx.user?.role !== "admin" && !ctx.adminSession) throw new TRPCError({ code: "FORBIDDEN" });
            return db.deleteCategory(input.id);
          }),
        moveUp: publicProcedure
          .input(z.object({ id: z.number() }))
          .mutation(async ({ input, ctx }) => {
            if (ctx.user?.role !== "admin" && !ctx.adminSession) throw new TRPCError({ code: "FORBIDDEN" });
            return db.moveCategoryUp(input.id);
          }),
        moveDown: publicProcedure
          .input(z.object({ id: z.number() }))
          .mutation(async ({ input, ctx }) => {
            if (ctx.user?.role !== "admin" && !ctx.adminSession) throw new TRPCError({ code: "FORBIDDEN" });
            return db.moveCategoryDown(input.id);
          }),
      }),
      products: router({
        list: publicProcedure.query(async () => {
          return db.getProducts();
        }),
        uploadImage: publicProcedure
          .input(z.object({
            image: z.string(),
          }))
          .mutation(async ({ input, ctx }) => {
            if (ctx.user?.role !== "admin" && !ctx.adminSession) throw new TRPCError({ code: "FORBIDDEN" });
            
            const { resizeProductImage } = await import("../server/_core/imageResize");
            const { storagePut } = await import("../server/storage");
            
            try {
              const imageBuffer = Buffer.from(input.image.replace(/^data:image\/\w+;base64,/, ''), 'base64');
              const resizedBuffer = await resizeProductImage(imageBuffer);
              const result = await storagePut(`products/product-${Date.now()}.webp`, resizedBuffer, 'image/webp');
              
              return { url: result.url, key: result.key };
            } catch (error) {
              throw new TRPCError({ code: "BAD_REQUEST", message: "Erro ao processar imagem" });
            }
          }),
        create: publicProcedure
          .input(z.object({
            name: z.string().min(1),
            categoryId: z.number(),
            description: z.string(),
            price: z.number(),
            oldPrice: z.number().optional(),
            image: z.string(),
            tag: z.string(),
            rarity: z.string(),
            benefits: z.array(z.string()),
          }))
          .mutation(async ({ input, ctx }) => {
            if (ctx.user?.role !== "admin" && !ctx.adminSession) throw new TRPCError({ code: "FORBIDDEN" });
            return db.createProduct(input);
          }),
        update: publicProcedure
          .input(z.object({
            id: z.number(),
            name: z.string().min(1),
            categoryId: z.number(),
            description: z.string(),
            price: z.number(),
            oldPrice: z.number().optional(),
            image: z.string(),
            tag: z.string(),
            rarity: z.string(),
            benefits: z.array(z.string()),
          }))
          .mutation(async ({ input, ctx }) => {
            if (ctx.user?.role !== "admin" && !ctx.adminSession) throw new TRPCError({ code: "FORBIDDEN" });
            const { id, ...data } = input;
            return db.updateProduct(id, data);
          }),
        delete: publicProcedure
          .input(z.object({ id: z.number() }))
          .mutation(async ({ input, ctx }) => {
            if (ctx.user?.role !== "admin" && !ctx.adminSession) throw new TRPCError({ code: "FORBIDDEN" });
            return db.deleteProduct(input.id);
          }),
        moveUp: publicProcedure
          .input(z.object({ id: z.number() }))
          .mutation(async ({ input, ctx }) => {
            if (ctx.user?.role !== "admin" && !ctx.adminSession) throw new TRPCError({ code: "FORBIDDEN" });
            return db.moveProductUp(input.id);
          }),
        moveDown: publicProcedure
          .input(z.object({ id: z.number() }))
          .mutation(async ({ input, ctx }) => {
            if (ctx.user?.role !== "admin" && !ctx.adminSession) throw new TRPCError({ code: "FORBIDDEN" });
            return db.moveProductDown(input.id);
          }),
      }),
      banners: router({
        list: publicProcedure.query(async () => {
          return db.getBanners();
        }),
        create: publicProcedure
          .input(z.object({
            title: z.string().min(1),
            imageUrl: z.string(),
          }))
          .mutation(async ({ input, ctx }) => {
            if (ctx.user?.role !== "admin" && !ctx.adminSession) throw new TRPCError({ code: "FORBIDDEN" });
            return db.createBanner(input as any);
          }),
        update: publicProcedure
          .input(z.object({
            id: z.number(),
            title: z.string().min(1),
            imageUrl: z.string(),
          }))
          .mutation(async ({ input, ctx }) => {
            if (ctx.user?.role !== "admin" && !ctx.adminSession) throw new TRPCError({ code: "FORBIDDEN" });
            const { id, ...data } = input;
            return db.updateBanner(id, data);
          }),
        delete: publicProcedure
          .input(z.object({ id: z.number() }))
          .mutation(async ({ input, ctx }) => {
            if (ctx.user?.role !== "admin" && !ctx.adminSession) throw new TRPCError({ code: "FORBIDDEN" });
            return db.deleteBanner(input.id);
          }),
        moveUp: publicProcedure
          .input(z.object({ id: z.number() }))
          .mutation(async ({ input, ctx }) => {
            if (ctx.user?.role !== "admin" && !ctx.adminSession) throw new TRPCError({ code: "FORBIDDEN" });
            return db.moveBannerUp(input.id);
          }),
        moveDown: publicProcedure
          .input(z.object({ id: z.number() }))
          .mutation(async ({ input, ctx }) => {
            if (ctx.user?.role !== "admin" && !ctx.adminSession) throw new TRPCError({ code: "FORBIDDEN" });
            return db.moveBannerDown(input.id);
          }),
      }),
      payment: router({
        createCheckoutSession: publicProcedure
          .input(z.object({
            items: z.array(z.object({
              productId: z.number(),
              productName: z.string(),
              quantity: z.number(),
              price: z.number(),
            })),
            total: z.number(),
            successUrl: z.string(),
            cancelUrl: z.string(),
          }))
          .mutation(async ({ input, ctx }) => {
            if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
            
            const { createCheckoutSession } = await import("../server/_core/stripe");
            
            const session = await createCheckoutSession({
              userId: ctx.user.id.toString(),
              userEmail: ctx.user.email ?? "",
              userName: ctx.user.name ?? undefined,
              items: input.items,
              total: input.total,
              successUrl: input.successUrl,
              cancelUrl: input.cancelUrl,
            });
            
            return {
              sessionId: session.id,
              url: session.url,
            };
          }),
      }),
      config: router({
        get: publicProcedure.query(async () => {
          const config = await db.getSiteConfig();
          // Retorna um objeto vazio em vez de dar erro 500 se não houver config
          return config || { heroTitle: "", heroSubtitle: "", heroDescription: "" };
        }),
        update: publicProcedure
          .input(z.object({
            heroTitle: z.string().optional(),
            heroSubtitle: z.string().optional(),
            heroDescription: z.string().optional(),
            welcomeText: z.string().optional(),
            catalogTitle: z.string().optional(),
            benefitsTitle: z.string().optional(),
          }))
          .mutation(async ({ input, ctx }) => {
            if (ctx.user?.role !== "admin" && !ctx.adminSession) throw new TRPCError({ code: "FORBIDDEN" });
            return db.updateSiteConfig(input);
          }),
      }),
    }),
  }),
});

export type AppRouter = typeof appRouter;

// Exportar função para testes
export { notifyDiscordOrder };
