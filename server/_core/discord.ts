import { ENV } from "./env";

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: DiscordEmbedField[];
  footer?: {
    text: string;
    icon_url?: string;
  };
  timestamp?: string;
}

export interface DiscordMessage {
  content?: string;
  embeds?: DiscordEmbed[];
  username?: string;
  avatar_url?: string;
}

/**
 * Send a message to Discord webhook
 */
export async function sendDiscordWebhook(message: DiscordMessage): Promise<boolean> {
  if (!ENV.discordWebhookUrl) {
    console.warn("[Discord] Webhook URL not configured");
    return false;
  }

  try {
    const response = await fetch(ENV.discordWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error(`[Discord] Webhook failed with status ${response.status}`);
      return false;
    }

    console.log("[Discord] Message sent successfully");
    return true;
  } catch (error) {
    console.error("[Discord] Error sending webhook:", error);
    return false;
  }
}

/**
 * Send order notification to Discord
 */
export async function notifyOrderCreated(order: {
  id: number;
  playerNick: string;
  gameId?: string;
  total: number;
  items: number;
  status: string;
}) {
  const embed: DiscordEmbed = {
    title: "🛒 Novo Pedido Recebido",
    color: 0xff9800, // Orange
    fields: [
      {
        name: "ID do Pedido",
        value: `#${order.id}`,
        inline: true,
      },
      {
        name: "Jogador",
        value: order.playerNick,
        inline: true,
      },
      {
        name: "Game ID",
        value: order.gameId || "Não informado",
        inline: true,
      },
      {
        name: "Itens",
        value: `${order.items} item(ns)`,
        inline: true,
      },
      {
        name: "Total",
        value: `R$ ${(order.total / 100).toFixed(2)}`,
        inline: true,
      },
      {
        name: "Status",
        value: order.status,
        inline: true,
      },
    ],
    footer: {
      text: "Aura City - Loja FiveM",
    },
    timestamp: new Date().toISOString(),
  };

  return sendDiscordWebhook({
    embeds: [embed],
    username: "Aura City Bot",
  });
}

/**
 * Send order status update to Discord
 */
export async function notifyOrderStatusChanged(order: {
  id: number;
  playerNick: string;
  oldStatus: string;
  newStatus: string;
}) {
  const statusEmojis: Record<string, string> = {
    pending: "⏳",
    approved: "✅",
    rejected: "❌",
    completed: "🎉",
  };

  const embed: DiscordEmbed = {
    title: "📝 Status do Pedido Atualizado",
    color: 0x2196f3, // Blue
    fields: [
      {
        name: "ID do Pedido",
        value: `#${order.id}`,
        inline: true,
      },
      {
        name: "Jogador",
        value: order.playerNick,
        inline: true,
      },
      {
        name: "Status Anterior",
        value: `${statusEmojis[order.oldStatus] || "❓"} ${order.oldStatus}`,
        inline: true,
      },
      {
        name: "Novo Status",
        value: `${statusEmojis[order.newStatus] || "❓"} ${order.newStatus}`,
        inline: true,
      },
    ],
    footer: {
      text: "Aura City - Loja FiveM",
    },
    timestamp: new Date().toISOString(),
  };

  return sendDiscordWebhook({
    embeds: [embed],
    username: "Aura City Bot",
  });
}
