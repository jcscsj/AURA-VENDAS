import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2 } from "lucide-react";

export default function Orders() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  // FATO TÉCNICO: Usamos a nossa nova rota 'myOrders' que busca pelo Discord ID.
  const { data: orders =[], isLoading: ordersLoading } = trpc.shop.orders.myOrders.useQuery(undefined, {
    enabled: !!user, // Só busca se o usuário estiver logado
  });

  // Trava de Segurança
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.error("Você precisa estar logado para ver seus pedidos");
      navigate("/");
    }
  }, [authLoading, isAuthenticated, navigate]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending": return "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30";
      case "approved": return "bg-green-500/20 text-green-500 border border-green-500/30";
      case "rejected": return "bg-red-500/20 text-red-500 border border-red-500/30";
      case "completed": return "bg-blue-500/20 text-blue-500 border border-blue-500/30";
      default: return "bg-slate-500/20 text-slate-500 border border-slate-500/30";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending": return "⏳ Pendente";
      case "approved": return "✅ Aprovado";
      case "rejected": return "❌ Rejeitado";
      case "completed": return "🎉 Concluído";
      default: return status || "Desconhecido";
    }
  };

  // Se estiver verificando o login OU buscando os pedidos, mostra a bolinha girando.
  if (authLoading || (isAuthenticated && ordersLoading && orders.length === 0)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* HEADER COM BOTÃO VOLTAR */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center h-16">
          <Button variant="ghost" onClick={() => navigate("/")} className="text-muted-foreground hover:text-primary">
            <ChevronLeft className="mr-2 h-4 w-4" /> Voltar à Loja
          </Button>
        </div>
      </nav>

      <div className="container max-w-4xl mx-auto py-12 px-4 flex-grow">
        <div className="mb-8 border-b border-border pb-4">
          <h1 className="text-3xl font-bold text-foreground mb-2">Meus Pedidos</h1>
          <p className="text-muted-foreground">Histórico de compras e status dos seus pedidos na Aura City.</p>
        </div>

        {/* MENSAGEM SE NÃO TIVER PEDIDOS */}
        {orders.length === 0 ? (
          <Card className="bg-card border border-border p-12 text-center flex flex-col items-center">
            <h2 className="text-xl font-bold text-foreground mb-2">Nenhum pedido encontrado</h2>
            <p className="text-muted-foreground mb-6">Você ainda não fez nenhuma compra na nossa loja.</p>
            <Button onClick={() => navigate("/")} className="bg-primary hover:bg-orange-600 text-black font-semibold">
              Ir para Loja
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order: any) => (
              <Card key={order.id} className="bg-card border border-border p-6 shadow-md hover:border-primary/50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-start justify-between mb-4 gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      Pedido #{order.id}
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                {/* Itens do Pedido */}
                <div className="border-t border-border pt-4 mb-4">
                  <h4 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider">Produtos</h4>
                  <div className="space-y-2 bg-background p-4 rounded-md border border-border">
                    {order.items && order.items.map((item: any, idx: number) => {
                      // Pegamos o nome exato do produto para evitar undefined
                      const nomeProduto = item.name || item.productName || item.title || "Pacote da Loja";
                      return (
                        <div key={idx} className="flex justify-between text-sm text-muted-foreground">
                          <span><span className="text-primary font-bold">{item.quantity}x</span> {nomeProduto}</span>
                          <span className="font-mono">R$ {(item.price / 100).toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Resumo Financeiro e Info */}
                <div className="border-t border-border pt-4 grid md:grid-cols-2 gap-6">
                  {/* Dados do Jogador */}
                  <div className="space-y-3 bg-background p-4 rounded-md border border-border">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold">Nick no Jogo</p>
                      <p className="text-sm font-medium text-foreground">{order.playerNick}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold">ID no Jogo</p>
                      <p className="text-sm font-medium text-foreground">{order.gameId || "Não informado"}</p>
                    </div>
                  </div>

                  {/* Totais */}
                  <div className="space-y-2 flex flex-col justify-center bg-background p-4 rounded-md border border-border">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-foreground font-mono">R$ {(order.subtotal / 100).toFixed(2)}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Desconto</span>
                        <span className="text-green-500 font-mono">-R$ {(order.discount / 100).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t border-border/50 pt-2 mt-2">
                      <span className="text-foreground">Total</span>
                      <span className="text-primary font-mono">R$ {(order.total / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <Button onClick={() => navigate("/")} variant="outline" className="w-full md:w-auto border-border">
            Voltar para a Loja
          </Button>
        </div>
      </div>
    </div>
  );
}
