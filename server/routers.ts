import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { ENV } from "./_core/env";
import crypto from "crypto";

// Função para enviar notificação Discord com @mention
async function notifyDiscordOrder(order: any, items: any[]) {
  if (!ENV.discordWebhookUrl) return;
  try {
    const itemsText = items.map(item => {
      const n = item.name || item.productName || item.title || "Pacote";
      return `- ${n} x${item.quantity} - R$ ${(item.price / 100).toFixed(2)}`;
    }).join("\n");
    
    // FATO TÉCNICO: A Menção oficial do Discord
    let mention = order.discordId ? `<@${order.discordId}>` : "Não informado";
    
    const embed = {
      title: "🛒 Novo Pedido Realizado!", color: 16744192,
      fields:[
        { name: "Discord (Menção)", value: mention, inline: true },
        { name: "Nick no Jogo", value: order.playerNick || "N/A", inline: true },
        { name: "ID do Jogo", value: order.gameId || "N/A", inline: true },
        { name: "Produtos", value: itemsText || "N/A", inline: false },
        { name: "Total", value: `R$ ${(order.total / 100).toFixed(2)}`, inline: true },
        { name: "Status", value: "⏳ Pendente", inline: true },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: "Aura City - Vendas" },
    };
    
    await fetch(ENV.discordWebhookUrl, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds:[embed] }),
    });
  } catch (e) { console.error("[Discord Error]:", e); }
}

// Notificação de PAGAMENTO CONFIRMADO
async function notifyDiscordSuccess(order: any) {
  if (!ENV.discordWebhookUrl) return;
  try {
    const embed = {
      title: "✅ PAGAMENTO CONFIRMADO!",
      color: 65280, // Verde
      fields: [
        { name: "Jogador", value: `<@${order.discordId}> ${order.playerNick}`, inline: true },
        { name: "Valor Pago", value: `R$ ${(order.total / 100).toFixed(2)}`, inline: true },
        { name: "Status", value: "🚀 Aprovado / Entregar", inline: false },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: "Aura City - Sistema de Vendas" },
    };
    await fetch(ENV.discordWebhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ embeds: [embed] }) });
  } catch (e) { console.error(e); }
}

// Exportamos para o index.js usar no webhook da Cakto
export { notifyDiscordSuccess };

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(async ({ ctx }) => {
      if (ctx.adminSession) return ctx.adminSession;

      if (ctx.user?.openId) {
        const dbUser = await db.getUserByOpenId(ctx.user.openId);
        if (!dbUser) {
          // Se o usuário não existe mais no banco (foi deletado), limpa o cookie
          ctx.res.clearCookie("app_session_id");
          return null;
        }
        return dbUser;
      }
      return null;
    }),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      ctx.res.clearCookie("app_session_id", { path: '/' });
      ctx.res.clearCookie("adminSession", { path: '/' });
      ctx.res.clearCookie("localSession", { path: '/' });
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
            email: z.string().optional().nullable(), 
            cpf: z.string().optional().nullable(),
            discord: z.string().optional().nullable(),
            discordId: z.string().optional().nullable(),
            items: z.array(z.any()),
            subtotal: z.number(),
            discount: z.number(),
            total: z.number(),
          })
        )
        .mutation(async ({ input, ctx }) => {
          // Busca o usuário no banco para garantir que temos os dados reais do Discord
          const userRecord = await db.getUserByOpenId(ctx.user?.openId || "");
          
          const orderData = {
            ...input,
            // Sincroniza o ID do Discord do banco com o pedido
            discordId: userRecord?.discordId || ctx.user?.discordId || null,
            discord: userRecord?.name || ctx.user?.name || "Não informado",
            // Prioriza o e-mail que o cara digitou no checkout
            email: input.email || userRecord?.email || null,
            cpf: input.cpf || null,
            status: "pending",
          };

          const order = await db.createOrder(orderData);
          if (order) {
            // 1. Avisa o seu Discord do pedido novo (Pendente)
            await notifyDiscordOrder(order, input.items);

            // 2. FATO TÉCNICO: Gera o QR Code usando a sua chave direta
            const pixData = await db.createManualPix(order);

            return {
              ...order,
              pix: pixData
            };
          }
          return order;
        }),
      list: publicProcedure.query(async () => {
        return db.getOrders();
      }),
      myOrders: publicProcedure.query(async ({ ctx }) => {
        // Se não estiver logado, retorna vazio direto (mata o loading infinito)
        if (!ctx.user || !ctx.user.discordId) return[]; 
        
        const db_instance = await db.getDb();
        if (!db_instance) return[];
        
        // Busca no banco apenas onde o discordId for igual ao do jogador logado
        const [rows] = await db_instance.execute(sql`SELECT * FROM \`orders\` WHERE \`discordId\` = ${ctx.user.discordId} ORDER BY id DESC`);
        
        // FATO TÉCNICO: O banco salva os itens como "texto". 
        // Aqui transformamos em "lista" de novo para o site conseguir ler o nome e preço.
        return (rows as any[]).map(row => ({
          ...row,
          items: typeof row.items === 'string' ? JSON.parse(row.items) : (row.items ||[])
        }));
      }),
      getByGameId: publicProcedure
        .input(z.object({ gameId: z.string() }))
        .query(async ({ input }) => {
          return db.getOrdersByGameId(input.gameId);
        }),
      updateStatus: publicProcedure
        .input(z.object({ orderId: z.number(), status: z.string() }))
        .mutation(async ({ input, ctx }) => {
          // TRAVA DE SEGURANÇA UNIFICADA
          if (ctx.user?.role !== "admin" && !ctx.adminSession) {
            throw new TRPCError({ code: "FORBIDDEN" });
          }
          
          const updatedOrder = await db.updateOrderStatus(input.orderId, input.status);
          
          // FATO TÉCNICO: Se você aprovou o pedido, disparar a mensagem VERDE no Discord
          if (updatedOrder && input.status === 'completed') {
            await notifyDiscordSuccess(updatedOrder);
          }
          
          return updatedOrder;
        }),
      delete: publicProcedure
        .input(z.object({ orderId: z.number() }))
        .mutation(async ({ input, ctx }) => {
          // TRAVA DE SEGURANÇA: Só admin (E-mail ou Discord) pode apagar
          if (ctx.user?.role !== "admin" && !ctx.adminSession) throw new TRPCError({ code: "FORBIDDEN" });
          return db.deleteOrder(input.orderId);
        }),
    }),
    admin: router({
      // ROTA DE USUÁRIOS (Precisa estar exatamente aqui para o caminho ser shop.admin.users)
      users: router({
        list: publicProcedure.query(async ({ ctx }) => {
          if (ctx.user?.role !== "admin" && !ctx.adminSession) throw new TRPCError({ code: "FORBIDDEN" });
          return db.getUsers(); 
        }),
        delete: publicProcedure
          .input(z.object({ id: z.number() }))
          .mutation(async ({ input, ctx }) => {
            if (ctx.user?.role !== "admin" && !ctx.adminSession) throw new TRPCError({ code: "FORBIDDEN" });
            return db.deleteUser(input.id);
          }),
      }),

      // 2. ROTA DE LOGS
      logs: publicProcedure.query(async ({ ctx }) => {
        if (ctx.user?.role !== "admin" && !ctx.adminSession) throw new TRPCError({ code: "FORBIDDEN" });
        const db_i = await db.getDb(); if (!db_i) return [];
        const [rows] = await db_i.execute(sql`SELECT * FROM \`system_logs\` ORDER BY id DESC LIMIT 50`);
        return rows as any[];
      }),
      categories: router({
        list: publicProcedure.query(async () => {
          return db.getCategories();
        }),
        create: publicProcedure
          .input(z.object({ 
            name: z.string().min(1),
            // FATO TÉCNICO: Avisamos ao segurança para aceitar apenas 'catalog' ou 'benefits'
            type: z.enum(['catalog', 'benefits']).default('catalog') 
          }))
          .mutation(async ({ input, ctx }) => {
            if (ctx.user?.role !== "admin" && !ctx.adminSession) throw new TRPCError({ code: "FORBIDDEN" });

            // 1. Verificar se o nome já existe
            const existing = await db.getCategories();
            if (existing.some(c => c.name.toLowerCase() === input.name.toLowerCase())) {
              throw new TRPCError({ 
                code: "BAD_REQUEST", 
                message: "Já existe uma categoria com este nome." 
              });
            }

            // 2. Criar a categoria (Agora o 'input' contém o Nome e o Tipo)
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
            description: z.string().optional(),
            price: z.number(),
            oldPrice: z.number().optional(),
            image: z.string().optional(),
            tag: z.string().optional(),
            // FATO TÉCNICO: Sem essa linha abaixo, o servidor deleta a informação da Tag antes de salvar
            showTag: z.boolean().optional(), 
            benefits: z.any().optional(), 
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
        list: publicProcedure.query(async () => db.getBanners()),
        create: publicProcedure
          .input(z.object({ title: z.string().optional(), imageUrl: z.string(), link: z.string().optional() }))
          .mutation(async ({ input, ctx }) => {
            if (ctx.user?.role !== "admin" && !ctx.adminSession) throw new TRPCError({ code: "FORBIDDEN" });
            return db.createBanner(input);
          }),
        update: publicProcedure
          .input(z.object({ id: z.number(), title: z.string().optional(), imageUrl: z.string().optional(), link: z.string().optional() }))
          .mutation(async ({ input, ctx }) => {
            if (ctx.user?.role !== "admin" && !ctx.adminSession) throw new TRPCError({ code: "FORBIDDEN" });
            return db.updateBanner(input.id, input);
          }),
        delete: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
            if (ctx.user?.role !== "admin" && !ctx.adminSession) throw new TRPCError({ code: "FORBIDDEN" });
            return db.deleteBanner(input.id);
        }),
        moveUp: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
            if (ctx.user?.role !== "admin" && !ctx.adminSession) throw new TRPCError({ code: "FORBIDDEN" });
            return db.moveBannerUp(input.id);
        }),
        moveDown: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
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

      coupons: router({
        list: publicProcedure.query(async ({ ctx }) => {
          if (ctx.user?.role !== "admin" && !ctx.adminSession) throw new TRPCError({ code: "FORBIDDEN" });
          return db.getCoupons();
        }),
        create: publicProcedure.input(z.any()).mutation(async ({ input, ctx }) => {
          if (ctx.user?.role !== "admin" && !ctx.adminSession) throw new TRPCError({ code: "FORBIDDEN" });
          return db.createCoupon(input);
        }),
        delete: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
          if (ctx.user?.role !== "admin" && !ctx.adminSession) throw new TRPCError({ code: "FORBIDDEN" });
          return db.deleteCoupon(input.id);
        }),
        // Rota pública para o Checkout validar o cupom
        check: publicProcedure.input(z.object({ code: z.string() })).query(async ({ input }) => {
          return db.getCouponByCode(input.code);
        }),
      }),
      
      config: router({
        get: publicProcedure.query(async () => {
          const config = await db.getSiteConfig();
          return config || { heroTitle: "", heroSubtitle: "", heroDescription: "" };
        }),
        update: publicProcedure
          .input(z.any())
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
