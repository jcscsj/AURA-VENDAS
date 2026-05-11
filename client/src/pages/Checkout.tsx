import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useShop } from "@/contexts/ShopContext";
import { ChevronLeft, ShieldCheck, CreditCard, User, ShoppingBag, Ticket } from "lucide-react";

const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value / 100);

export default function Checkout() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { cart, clearCart } = useShop();

  // States do formulário
  const [playerNick, setPlayerNick] = useState("");
  const [gameId, setGameId] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  // FATO TÉCNICO: Preenchimento Automático vindo do Perfil
  useEffect(() => {
    if (user) {
      if (user.characterName) setPlayerNick(user.characterName);
      if (user.gameId) setGameId(user.gameId);
    }
  }, [user]);

  // Cálculos
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const discount = appliedCoupon === "SP25" ? Math.round(subtotal * 0.25) : 0;
  const total = Math.max(subtotal - discount, 0);

  const createOrderMut = trpc.shop.orders.create.useMutation({
    onSuccess: () => {
      toast.success("Pedido gerado com sucesso! Verifique seu Discord.");
      clearCart();
      navigate("/orders");
    },
    onError: (err) => toast.error("Erro: " + err.message),
  });

  const handleProcessPayment = () => {
    if (!isAuthenticated) return toast.error("Você precisa estar logado com Discord.");
    if (!playerNick || !gameId) return toast.error("Preencha seu Nick e ID do jogo.");
    if (!termsAccepted) return toast.error("Aceite os termos para continuar.");
    if (cart.length === 0) return navigate("/");

    createOrderMut.mutate({
      playerNick,
      gameId,
      discord: user?.name,
      discordId: user?.discordId,
      items: cart.map(i => ({ productId: i.id, quantity: i.quantity, price: i.price, name: i.name })),
      subtotal,
      discount,
      total,
    });
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <ShoppingBag className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold">Seu carrinho está vazio</h2>
        <Button onClick={() => navigate("/")} className="mt-4 bg-primary text-black">Voltar para a loja</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <nav className="border-b border-border bg-card p-4 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/")} className="text-primary">
            <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-500" />
            <span className="text-sm font-bold uppercase tracking-widest">Checkout Seguro</span>
          </div>
        </div>
      </nav>

      <main className="container mx-auto py-8 px-4 grid lg:grid-cols-[1fr_400px] gap-8">
        {/* COLUNA ESQUERDA: Formas e Informações */}
        <div className="space-y-6">
          <Card className="p-6 border-border bg-card shadow-lg">
            <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
              <CreditCard className="text-primary w-6 h-6" />
              <h2 className="text-xl font-bold">Forma de Pagamento</h2>
            </div>
            <div className="p-4 border-2 border-primary rounded-xl bg-primary/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-black font-bold">PIX</div>
                <div>
                  <p className="font-bold">Pix <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded ml-2">MAIS RÁPIDO</span></p>
                  <p className="text-xs text-muted-foreground">Aprovação imediata e automática</p>
                </div>
              </div>
              <div className="w-6 h-6 border-4 border-primary rounded-full" />
            </div>
          </Card>

          <Card className="p-6 border-border bg-card shadow-lg">
            <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
              <User className="text-primary w-6 h-6" />
              <h2 className="text-xl font-bold">Informações do Jogador</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Nick no Personagem</label>
                <input 
                  value={playerNick} 
                  onChange={(e) => setPlayerNick(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:border-primary outline-none" 
                  placeholder="Ex: Maxzin_Aura"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">ID no Jogo (5M)</label>
                <input 
                  value={gameId} 
                  onChange={(e) => setGameId(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:border-primary outline-none" 
                  placeholder="Ex: 1234"
                />
              </div>
            </div>
            <div className="mt-6 p-4 bg-[#5865F2]/10 border border-[#5865F2]/30 rounded-xl flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="bg-[#5865F2] p-2 rounded-lg"><User className="text-white w-4 h-4" /></div>
                  <p className="text-sm font-medium">Logado como <span className="text-white font-bold">{user?.name}</span></p>
               </div>
               <span className="text-[10px] bg-[#5865F2] text-white px-2 py-0.5 rounded font-bold uppercase">Discord Vinculado</span>
            </div>
          </Card>
        </div>

        {/* COLUNA DIREITA: Resumo do Pedido */}
        <div className="space-y-6">
          <Card className="p-6 border-border bg-card shadow-xl sticky top-24">
            <h2 className="text-xl font-bold mb-6">Resumo do Pedido</h2>
            
            <div className="space-y-4 mb-6">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{item.quantity}x {item.name}</span>
                  <span className="font-bold">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mb-6">
              <input 
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="Cupom" 
                className="flex-1 bg-background border border-border rounded-lg px-3 text-sm outline-none focus:border-primary"
              />
              <Button 
                variant="outline" 
                className="border-primary text-primary"
                onClick={() => {
                  if (couponInput === "SP25") { setAppliedCoupon("SP25"); toast.success("Desconto aplicado!"); }
                  else toast.error("Cupom inválido.");
                }}
              >
                <Ticket className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3 border-t border-border pt-4 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              {appliedCoupon && <div className="flex justify-between text-green-500 font-bold"><span>Desconto (25%)</span><span>-{formatCurrency(discount)}</span></div>}
              <div className="flex justify-between text-xl font-bold text-primary pt-2 border-t border-border/50">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 accent-primary h-4 w-4" 
                />
                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                  Eu aceito os <strong>termos e condições</strong> desta compra e estou ciente da política de entrega da Aura City.
                </span>
              </label>

              <Button 
                className="w-full bg-primary hover:bg-orange-600 text-black font-extrabold py-8 text-lg shadow-lg shadow-primary/20"
                onClick={handleProcessPayment}
                disabled={createOrderMut.isPending}
              >
                {createOrderMut.isPending ? "PROCESSANDO..." : `PAGAR ${formatCurrency(total)}`}
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
