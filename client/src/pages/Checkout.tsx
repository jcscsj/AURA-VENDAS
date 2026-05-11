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
  Heart,
  Minus,
  Plus,
  Trash2,
  X,
  Save
} from "lucide-react";

const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value / 100);

export default function Checkout() {
  const [, navigate] = useLocation(); // <--- ADICIONE ESTA LINHA TAMBÉM
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  // FATO TÉCNICO: Puxamos as funções de editar e remover do carrinho global
  const { cart, clearCart, updateQuantity, removeItem } = useShop();

  const [playerNick, setPlayerNick] = useState("");
  const [gameId, setGameId] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");

  // FUNÇÃO MESTRA: Formata CPF em tempo real (000.000.000-00)
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ""); // Remove letras
    if (value.length > 11) value = value.slice(0, 11); // Limita tamanho
    
    // Aplica a máscara visual
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    
    setCpf(value);
  }; // <--- VERIFIQUE SE ESTA CHAVE E PONTO E VÍRGULA ESTÃO AQUI

  // 2. DEPOIS: USAMOS AS CAIXAS NAS CONSULTAS (QUERIES)
  const checkCoupon = trpc.shop.admin.coupons.check.useQuery(
    { code: couponInput },
    { enabled: false }
  );

  const { data: siteConfig = { couponBannerEnabled: false, couponBannerText: "" } } = trpc.shop.admin.config.get.useQuery();

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
            <div className="p-5 border-2 border-primary bg-primary/5 rounded-2xl flex items-center gap-4 shadow-lg shadow-primary/5">
              {/* ÍCONE OFICIAL DO PIX */}
              <div className="w-12 h-12 bg-[#1a1b1e] rounded-xl flex items-center justify-center shadow-inner border border-white/5 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 316 316" fill="none">
                  <path d="M246.13 241.53C240.043 241.552 234.012 240.368 228.386 238.045C222.76 235.723 217.649 232.309 213.35 228L166 180.62C164.325 179.019 162.097 178.125 159.78 178.125C157.463 178.125 155.235 179.019 153.56 180.62L106.05 228.13C101.753 232.445 96.6444 235.866 91.018 238.195C85.3916 240.525 79.3594 241.716 73.27 241.7H64L124 301.7C132.999 310.68 145.192 315.723 157.905 315.723C170.618 315.723 182.811 310.68 191.81 301.7L251.93 241.57L246.13 241.53Z" fill="#32BCAD"/>
                  <path d="M73.28 74.09C79.3695 74.0737 85.4018 75.2646 91.0283 77.5938C96.6548 79.923 101.764 83.3443 106.06 87.66L153.57 135.18C155.221 136.826 157.458 137.751 159.79 137.751C162.122 137.751 164.359 136.826 166.01 135.18L213.35 87.84C217.643 83.5189 222.751 80.0934 228.378 77.7623C234.005 75.4311 240.039 74.2406 246.13 74.26H251.83L191.71 14.14C187.258 9.68647 181.972 6.15364 176.155 3.74332C170.337 1.33299 164.102 0.0923996 157.805 0.0923996C151.508 0.0923996 145.273 1.33299 139.455 3.74332C133.638 6.15364 128.352 9.68647 123.9 14.14L64 74.09H73.28Z" fill="#32BCAD"/>
                  <path d="M301.56 124.49L265.23 88.16C264.411 88.4949 263.535 88.6714 262.65 88.68H246.13C237.533 88.7015 229.293 92.1156 223.2 98.18L175.86 145.49C171.597 149.746 165.819 152.136 159.795 152.136C153.771 152.136 147.993 149.746 143.73 145.49L96.21 98C90.1187 91.9319 81.878 88.5142 73.28 88.49H53C52.1642 88.4712 51.3383 88.3053 50.56 88L14 124.49C5.02035 133.489 -0.0227661 145.682 -0.0227661 158.395C-0.0227661 171.108 5.02035 183.301 14 192.3L50.48 228.78C51.2566 228.469 52.0836 228.303 52.92 228.29H73.28C81.8778 228.265 90.1181 224.847 96.21 218.78L143.72 171.27C152.31 162.69 167.28 162.69 175.86 171.27L223.2 218.6C229.293 224.664 237.533 228.079 246.13 228.1H262.65C263.535 228.106 264.411 228.283 265.23 228.62L301.56 192.29C306.014 187.838 309.546 182.552 311.957 176.735C314.367 170.917 315.608 164.682 315.608 158.385C315.608 152.088 314.367 145.853 311.957 140.035C309.546 134.218 306.014 128.932 301.56 124.48" fill="#32BCAD"/>
                </svg>
              </div>
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
                    onChange={handleCpfChange} // <--- Ativa a máscara inteligente
                    className="w-full bg-background/50 border border-border rounded-xl p-4 text-sm focus:border-primary outline-none transition-all font-mono" 
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>

              {/* BOX DE AUTENTICAÇÃO UNIFICADO (BOTAO SEMPRE DISPONÍVEL) */}
              <div className="p-5 bg-background/50 border border-border rounded-2xl space-y-5">
                {isAuthenticated ? (
                  <div className="flex items-center justify-between border-b border-border/50 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img 
                          src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.name}`} 
                          className="w-10 h-10 rounded-full border-2 border-primary/30 shadow-md"
                          alt="Avatar"
                        />
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-[#1a1b1e] rounded-full"></div>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Sessão Ativa</p>
                        <p className="text-sm font-black text-white">{user?.name}</p>
                      </div>
                    </div>
                    <span className="text-[9px] bg-green-500/10 text-green-500 border border-green-500/30 px-2 py-0.5 rounded-full font-black uppercase">Vinculado</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-orange-500 bg-orange-500/5 p-3 rounded-lg border border-orange-500/20">
                    <AlertCircle className="w-4 h-4" />
                    <p className="text-xs font-bold">Você ainda não vinculou seu Discord.</p>
                  </div>
                )}

                {/* BOTÃO DE LOGIN/TROCA - SEMPRE DISPONÍVEL */}
                <Button
                  onClick={() => window.location.href = getLoginUrl()}
                  className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-black h-12 gap-2 shadow-lg shadow-[#5865F2]/20 transition-all active:scale-95"
                >
                  <LogIn className="w-4 h-4" /> 
                  {isAuthenticated ? "Trocar de Conta Discord" : "Entrar com o Discord"}
                </Button>
              </div>
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
                <div key={item.id} className="flex items-center gap-4 py-3 border-b border-border/50 last:border-0">
                  <div className="w-14 h-14 rounded-lg overflow-hidden border border-border flex-shrink-0 aspect-square">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs truncate">{item.name}</h4>
                    <p className="text-[10px] text-muted-foreground">{formatCurrency(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-background border border-border rounded-md p-0.5">
                      <button onClick={() => updateQuantity(item.id, "decrease")} className="w-5 h-5 hover:text-primary"><Minus className="h-3 w-3 mx-auto" /></button>
                      <span className="w-5 text-center text-xs font-bold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, "increase")} className="w-5 h-5 hover:text-primary"><Plus className="h-3 w-3 mx-auto" /></button>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                  <div className="text-right min-w-[70px]"><p className="font-bold text-sm text-primary">{formatCurrency(item.price * item.quantity)}</p></div>
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
