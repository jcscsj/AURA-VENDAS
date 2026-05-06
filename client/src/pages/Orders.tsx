import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2, ChevronRight } from "lucide-react";

export default function Orders() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getOrdersQuery = trpc.shop.orders.getByGameId.useQuery(
    { gameId: user?.gameId || "" },
    { enabled: !!user?.gameId }
  );

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      toast.error("Você precisa estar logado para ver seus pedidos");
      navigate("/login");
      return;
    }

    if (getOrdersQuery.data) {
      setOrders(getOrdersQuery.data);
      setIsLoading(false);
    } else if (getOrdersQuery.error) {
      toast.error("Erro ao carregar pedidos");
      setIsLoading(false);
    }
  }, [authLoading, user, getOrdersQuery.data, getOrdersQuery.error, navigate]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "⏳ Pendente";
      case "approved":
        return "✅ Aprovado";
      case "rejected":
        return "❌ Rejeitado";
      case "completed":
        return "🎉 Concluído";
      default:
        return status || "Desconhecido";
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Meus Pedidos</h1>
          <p className="text-muted-foreground">Histórico de compras e status dos pedidos</p>
        </div>

        {orders.length === 0 ? (
          <Card className="bg-card border border-border p-8 shadow-lg text-center">
            <p className="text-muted-foreground mb-4">Você ainda não fez nenhuma compra</p>
            <Button
              onClick={() => navigate("/")}
              className="bg-primary hover:bg-orange-600 text-black font-semibold"
            >
              Ir para Loja
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="bg-card border border-border p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Pedido #{order.id}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>

                {/* Itens do Pedido */}
                <div className="border-t border-border pt-4 mb-4">
                  <h4 className="text-sm font-medium text-foreground mb-2">Itens:</h4>
                  <div className="space-y-2">
                    {order.items && order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm text-muted-foreground">
                        <span>{item.name} x{item.quantity}</span>
                        <span>R$ {(item.price / 100).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resumo Financeiro */}
                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="text-foreground">R$ {(order.subtotal / 100).toFixed(2)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Desconto:</span>
                      <span className="text-green-600">-R$ {(order.discount / 100).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-semibold border-t border-border pt-2">
                    <span className="text-foreground">Total:</span>
                    <span className="text-primary">R$ {(order.total / 100).toFixed(2)}</span>
                  </div>
                </div>

                {/* Informações do Jogador */}
                <div className="border-t border-border pt-4 mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Nick do Jogador</p>
                    <p className="text-sm font-medium text-foreground">{order.playerNick}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">ID do Jogo</p>
                    <p className="text-sm font-medium text-foreground">{order.gameId || "N/A"}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Botão Voltar */}
        <div className="mt-8">
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="w-full"
          >
            Voltar à Loja
          </Button>
        </div>
      </div>
    </div>
  );
}
