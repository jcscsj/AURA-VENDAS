import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useShop } from "@/contexts/ShopContext";
import { getLoginUrl } from "@/const";
import { 
  ChevronLeft, 
  ShieldCheck, 
  CreditCard, 
  User, 
  ShoppingBag, 
  Ticket, 
  LogIn, 
  AlertCircle,
  Heart
} from "lucide-react";

const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value / 100);

export default function Checkout() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { cart, clearCart } = useShop();
  const checkCoupon = trpc.shop.admin.coupons.check.useQuery(
    { code: couponInput },
    { enabled: false }
  );
  const { data: siteConfig = { couponBannerEnabled: false, couponBannerText: "" } } = trpc.shop.admin.config.get.useQuery();

  const [playerNick, setPlayerNick] = useState("");
  const [gameId, setGameId] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");

  useEffect(() => {
    if (user) {
      if (user.characterName) setPlayerNick(user.characterName);
      if (user.gameId) setGameId(user.gameId);
      if (user.email) setEmail(user.email);
    }
  }, [user]);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const discount = useMemo(() => {
    if (!appliedCoupon) return 0;
    // Se for porcentagem (ex: 25%), calcula sobre o subtotal
    if (appliedCoupon.type === 'percentage') {
      return Math.round(subtotal * (appliedCoupon.value / 100));
    }
    // Se for valor fixo, usa o valor direto (que já está em centavos)
    return appliedCoupon.value;
  }, [appliedCoupon, subtotal]);
  const total = Math.max(subtotal - discount, 0);

  const createOrderMut = trpc.shop.orders.create.useMutation({
    onSuccess: () => {
      toast.success("Pedido gerado com sucesso!");
      clearCart();
      navigate("/orders");
    },
    onError: (err) => toast.error("Erro: " + err.message),
  });

  const handleProcessPayment = () => {
    if (!isAuthenticated) return toast.error("Você precisa logar no Discord antes.");
    
    // VALIDAÇÃO OBRIGATÓRIA
    if (!playerNick.trim()) return toast.error("O Nick do personagem é obrigatório.");
    if (!gameId.trim()) return toast.error("O ID do jogo é obrigatório.");
    if (!email.trim() || !email.includes("@")) return toast.error("Informe um e-mail válido.");
    if (!cpf.trim() || cpf.length < 11) return toast.error("Informe um CPF válido.");
    if (!termsAccepted) return toast.error("Você precisa aceitar os termos.");
    
    createOrderMut.mutate({
      playerNick,
      gameId,
      email, // Novo campo
      cpf,   // Novo campo
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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* HEADER CENTRALIZADO */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center relative h-20">
          <Button variant="ghost" onClick={() => navigate("/")} className="text-muted-foreground hover:text-primary z-10">
            <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            <img src="/logo-home.webp" alt="Aura Logo" className="h-12 w-12 object-contain" />
          </div>

          <div className="ml-auto hidden md:flex items-center gap-2 text-green-500 font-bold text-[10px] tracking-widest border border-green-500/20 px-3 py-1.5 rounded-full bg-green-500/5">
            <ShieldCheck className="w-4 h-4" />
            CHECKOUT SEGURO
          </div>
        </div>
      </nav>

      {siteConfig?.couponBannerEnabled && siteConfig?.couponBannerText && (
        <div className="bg-primary py-3 shadow-lg shadow-primary/20 border-y border-white/10 overflow-hidden relative group">
          <div className="container mx-auto px-4">
            <p className="text-black font-black text-center text-sm md:text-base tracking-widest uppercase animate-pulse">
              {siteConfig.couponBannerText}
            </p>
          </div>
        </div>
      )}

      <main className="container mx-auto py-12 px-4 grid lg:grid-cols-[1fr_420px] gap-10 flex-grow">
        <div className="space-y-8">
          {/* FORMA DE PAGAMENTO */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="text-primary w-5 h-5" />
              <h2 className="text-lg font-bold uppercase tracking-tight">Formas de Pagamento</h2>
            </div>
            <div className="p-5 border-2 border-primary bg-primary/5 rounded-2xl flex items-center gap-4 transition-all shadow-[0_0_20px_-5px_rgba(255,125,0,0.1)]">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-black font-black text-xs shadow-lg">PIX</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-foreground">Pix</p>
                  <span className="text-[9px] bg-green-500/20 text-green-500 border border-green-500/30 px-2 py-0.5 rounded-full font-bold">MAIS RÁPIDO</span>
                </div>
                <p className="text-xs text-muted-foreground">Aprovação imediata e automática.</p>
              </div>
            </div>
          </section>

          {/* INFORMAÇÕES DO JOGADOR */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="text-primary w-5 h-5" />
              <h2 className="text-lg font-bold uppercase tracking-tight">Informações do Jogador</h2>
            </div>
            <Card className="p-6 border-border bg-card/30 backdrop-blur-sm space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Nick no Personagem</label>
                  <input 
                    value={playerNick} 
                    onChange={(e) => setPlayerNick(e.target.value)}
                    className="w-full bg-background/50 border border-border rounded-xl p-4 text-sm focus:border-primary outline-none transition-all" 
                    placeholder="Ex: Maxzin_Aura"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">ID no Jogo</label>
                  <input 
                    value={gameId} 
                    onChange={(e) => setGameId(e.target.value)}
                    className="w-full bg-background/50 border border-border rounded-xl p-4 text-sm focus:border-primary outline-none transition-all" 
                    placeholder="Ex: 1234"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 pt-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">E-mail para Contato</label>
                  <input 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-background/50 border border-border rounded-xl p-4 text-sm focus:border-primary outline-none transition-all" 
                    placeholder="seu@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">CPF (Para o Pagamento)</label>
                  <input 
                    value={cpf} 
                    onChange={(e) => setCpf(e.target.value)}
                    className="w-full bg-background/50 border border-border rounded-xl p-4 text-sm focus:border-primary outline-none transition-all" 
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>

              {/* BOX DE AUTENTICAÇÃO DINÂMICO */}
              {!isAuthenticated ? (
                <div className="space-y-4">
                  <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-2xl flex items-center gap-3">
                    <AlertCircle className="text-orange-500 w-5 h-5" />
                    <p className="text-sm text-muted-foreground">Você ainda não vinculou seu Discord.</p>
                  </div>
                  <Button
                    onClick={() => window.location.href = getLoginUrl()}
                    className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold h-14 text-lg gap-3 shadow-lg shadow-[#5865F2]/20"
                  >
                    <LogIn className="w-5 h-5" /> Entrar com o Discord
                  </Button>
                </div>
              ) : (
                <div className="bg-[#5865F2] text-white p-4 rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-[#5865F2]/20">
                  {/* FOTO DO DISCORD ARREDONDADA */}
                  <div className="relative">
                    <img 
                      src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.name}`} 
                      className="w-10 h-10 rounded-full border-2 border-white/30 shadow-md"
                      alt="Avatar"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#5865F2] rounded-full"></div>
                  </div>
                  <span className="font-bold text-lg tracking-tight">{user?.name}</span>
                </div>
              )}
            </Card>
          </section>
        </div>

        {/* RESUMO DO PEDIDO */}
        <aside>
          <Card className="p-8 border-border bg-card shadow-2xl sticky top-28 space-y-6 overflow-hidden">
            <div className="absolute top-0 right-0 p-1 bg-primary/10 rounded-bl-xl">
              <ShoppingBag className="w-4 h-4 text-primary" />
            </div>
            
            <h2 className="text-xl font-bold border-b border-border pb-4">Resumo do Pedido</h2>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">{item.quantity}x {item.name}</span>
                  <span className="font-bold text-foreground">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input 
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="Possui um cupom?" 
                className="flex-1 bg-background/50 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-all"
              />
              <Button 
                variant="outline" 
                className="border-primary text-primary rounded-xl px-4 hover:bg-primary hover:text-black transition-all"
                onClick={async () => {
                  if (!couponInput.trim()) return;
                  
                  const { data: coupon } = await checkCoupon.refetch();
                  
                  if (coupon && coupon.isActive) {
                    setAppliedCoupon(coupon);
                    toast.success(`Cupom ${coupon.code} aplicado com sucesso!`);
                  } else {
                    setAppliedCoupon(null);
                    toast.error("Cupom inválido ou expirado.");
                  }
                }}
              >
                <Ticket className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3 pt-4">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>

              {/* LÓGICA DINÂMICA: Mostra o cupom real e o valor real dele */}
              {appliedCoupon && (
                <div className="flex justify-between text-sm text-green-500 font-bold">
                  <span>
                    Cupom {appliedCoupon.code} 
                    ({appliedCoupon.type === 'percentage' ? `${appliedCoupon.value}%` : 'Fixo'})
                  </span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-2xl font-black text-primary pt-4 border-t border-border/50">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="pt-4 space-y-6">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 accent-primary h-5 w-5 rounded-md cursor-pointer" 
                />
                <span className="text-[11px] leading-relaxed text-muted-foreground group-hover:text-foreground transition-colors">
                  Eu aceito os <strong className="text-foreground">termos e condições</strong> desta compra e estou ciente da política de entrega da Aura City.
                </span>
              </label>

              <Button 
                className="w-full bg-primary hover:bg-orange-600 text-black font-black py-8 text-xl shadow-[0_10px_20px_-5px_rgba(255,125,0,0.3)] transition-all transform hover:-translate-y-1 active:scale-95"
                onClick={handleProcessPayment}
                disabled={createOrderMut.isPending}
              >
                {createOrderMut.isPending ? "PROCESSANDO..." : `PAGAR ${formatCurrency(total)}`}
              </Button>
            </div>
          </Card>
        </aside>
      </main>

      {/* RODAPÉ PROFISSIONAL */}
      <footer className="bg-card border-t border-border py-12 mt-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-5">
              <img src="/logo.webp" className="h-14 w-14 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all" />
              <div className="text-left border-l border-border/50 pl-5">
                <p className="text-sm font-black text-foreground tracking-tighter">AURA CITY RP <span className="font-medium text-muted-foreground ml-1">© 2026</span></p>
                {/*<p className="text-[10px] text-muted-foreground font-medium">Este site não possui afiliação com a Rockstar Games ou Take-Two Interactive.</p>*/}
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
              Desenvolvido com <Heart className="w-3 h-3 text-red-500 fill-red-500" /> para a comunidade <span className="text-foreground font-bold border-b border-primary/50">Aura City</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
