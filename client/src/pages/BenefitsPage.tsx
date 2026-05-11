import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useShop } from "@/contexts/ShopContext"; // Carrinho Global
import { getLoginUrl } from "@/const"; // Importação que faltava
import { ChevronLeft, Minus, Plus, Search, ShoppingCart, Trash2, X, Menu, LogOut, Save } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value / 100);

export default function BenefitsPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  
  // FATO TÉCNICO: Puxamos as funções do Carrinho Global (ShopContext)
  const { cart, cartOpen, setCartOpen, addToCart, updateQuantity, removeItem, clearCart } = useShop();

  // Queries do Banco de Dados
  const { data: categories = [] } = trpc.shop.categories.list.useQuery();
  const { data: products = [] } = trpc.shop.products.list.useQuery();
  const { data: siteConfig } = trpc.shop.admin.config.get.useQuery();

  // States locais
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [playerNick, setPlayerNick] = useState("");
  const [gameId, setGameId] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // FATO TÉCNICO: Preenchimento Automático Inteligente
  useEffect(() => {
    if (checkoutOpen && user) {
      if (playerNick === "" && user.characterName) setPlayerNick(user.characterName);
      if (gameId === "" && user.gameId) setGameId(user.gameId);
    }
  }, [checkoutOpen, user, playerNick, gameId]);

  // Filtro de Produtos
  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = activeCategory === null || product.categoryId === activeCategory;
      const matchesQuery = !normalizedQuery || 
        (product.name?.toLowerCase().includes(normalizedQuery) ?? false) || 
        (product.description?.toLowerCase().includes(normalizedQuery) ?? false);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, query, products]);

  // Cálculos do Carrinho
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const discount = appliedCoupon === "SP25" ? Math.round(subtotal * 0.25) : 0;
  const total = Math.max(subtotal - discount, 0);
  const cartQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  const createOrderMut = trpc.shop.orders.create.useMutation({
    onSuccess: () => {
      toast.success("Pedido realizado com sucesso!");
      setCheckoutOpen(false); 
      setCartOpen(false); 
      clearCart(); // Limpa o carrinho global
      setPlayerNick(""); 
      setGameId("");
    },
    onError: (error) => toast.error("Erro ao criar pedido: " + error.message),
  });

  const submitOrder = () => {
    if (!isAuthenticated) { 
      toast.error("Você precisa estar logado com seu Discord."); 
      return; 
    }
    if (!cart.length) return;
    
    createOrderMut.mutate({
      playerNick, 
      gameId: gameId || "",
      discord: user?.name || "Não informado", 
      discordId: user?.discordId || null,
      items: cart.map(item => ({ productId: item.id, quantity: item.quantity, price: item.price, name: item.name })),
      subtotal, 
      discount, 
      total,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header com Login Mobile e Desktop */}
      <header className="sticky top-0 z-50 border-b border-border bg-card">
        <div className="container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/")} className="text-primary hover:bg-primary/10 px-2">
              <ChevronLeft className="h-5 w-5 mr-1" /> <span className="hidden sm:inline">Voltar</span>
            </Button>
            <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
            <h1 className="text-lg font-bold border-l border-border pl-4 hidden sm:block">Aura City</h1>
          </div>

          <div className="flex items-center gap-2">
            {!isAuthenticated ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = getLoginUrl()}
                className="hidden md:inline-flex border-primary text-primary hover:bg-primary/10"
              >
                Entrar com Discord
              </Button>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate("/orders")}>Pedidos</Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/profile")}>Perfil</Button>
              </div>
            )}

            <Button className="relative bg-primary hover:bg-orange-600 text-black font-semibold" onClick={() => setCartOpen(true)}>
              <ShoppingCart className="mr-2 h-4 w-4" /> 
              <span className="hidden sm:inline">Carrinho</span>
              {cartQuantity > 0 && <span className="absolute -right-2 -top-2 grid h-6 min-w-6 place-items-center rounded-full bg-black px-1 text-xs font-bold text-white">{cartQuantity}</span>}
            </Button>

            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Menu Mobile */}
        {mobileMenuOpen && (
          <div className="container grid gap-4 border-t border-border bg-card py-6 text-sm font-semibold lg:hidden">
            <button onClick={() => { setMobileMenuOpen(false); navigate("/"); }} className="text-left py-2 border-b border-border/50">Início</button>
            <div className="pt-2 space-y-3">
              {!isAuthenticated ? (
                <Button className="w-full bg-[#5865F2] text-white" onClick={() => window.location.href = getLoginUrl()}>Entrar com Discord</Button>
              ) : (
                <div className="grid gap-2">
                  <Button variant="outline" className="justify-start" onClick={() => navigate("/orders")}>Meus Pedidos</Button>
                  <Button variant="outline" className="justify-start" onClick={() => navigate("/profile")}>Meu Perfil</Button>
                  <Button variant="ghost" className="justify-start text-red-500" onClick={async () => { await logout(); localStorage.clear(); window.location.href = "/"; }}>Sair</Button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="container py-12">
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-bold text-foreground">Benefícios Aura City</h2>
          <p className="mt-3 text-muted-foreground text-lg">VIPs, Utilitários e Vantagens exclusivas para sua jornada.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
          <aside className="h-fit space-y-6">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar..." className="h-10 w-full bg-background border border-border rounded pl-10 pr-3 text-sm focus:outline-none focus:border-primary" />
              </div>
            </div>

            <div className="space-y-2 rounded-lg border border-border bg-card p-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase mb-3">Categorias</h3>
              <button onClick={() => setActiveCategory(null)} className={`w-full rounded-lg px-4 py-2 text-left text-sm font-semibold transition ${activeCategory === null ? "bg-primary text-black" : "hover:bg-background"}`}>Todos</button>
              {categories.map((category) => (
                <button key={category.id} onClick={() => setActiveCategory(category.id)} className={`w-full rounded-lg px-4 py-2 text-left text-sm font-semibold transition ${activeCategory === category.id ? "bg-primary text-black" : "hover:bg-background"}`}>{category.name}</button>
              ))}
            </div>
          </aside>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <article key={product.id} className="overflow-hidden rounded-lg border border-border bg-card shadow-sm hover:shadow-md transition flex flex-col hover:border-primary/50">
                {product.image && (
                  <div className="relative w-full h-48 overflow-hidden bg-background">
                    <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                    <div className="absolute left-3 top-3 rounded bg-primary px-3 py-1 text-[10px] font-bold text-black uppercase">{product.tag || "Novo"}</div>
                  </div>
                )}
                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="text-lg font-bold">{product.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3 flex-grow">{product.description}</p>
                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <p className="text-xl font-bold text-primary">{formatCurrency(product.price)}</p>
                    <Button 
                      className="bg-primary hover:bg-orange-600 text-black font-bold h-9"
                      disabled={user?.role === "admin"}
                      onClick={() => addToCart(product)}
                    >
                      {user?.role === "admin" ? "Admin" : "Comprar"}
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>

      {/* Carrinho Global */}
      {cartOpen && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm" onClick={() => setCartOpen(false)}>
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border p-5">
              <h2 className="text-xl font-bold">Seu Carrinho</h2>
              <Button variant="ghost" size="icon" onClick={() => setCartOpen(false)}><X className="h-5 w-5" /></Button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {cart.length === 0 ? (
                <div className="grid h-full place-items-center text-center text-muted-foreground"><p>O carrinho está vazio.</p></div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-4 p-3 rounded-lg border border-border bg-background">
                      {item.image && <img src={item.image} alt={item.name} className="h-14 w-20 object-cover rounded" />}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm truncate">{item.name}</h3>
                        <p className="text-xs text-primary font-mono">{formatCurrency(item.price)}</p>
                        <div className="mt-2 flex items-center gap-2 border border-border w-fit rounded bg-card">
                          <button className="px-2 py-1 hover:text-primary" onClick={() => updateQuantity(item.id, "decrease")}><Minus className="h-3 w-3" /></button>
                          <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                          <button className="px-2 py-1 hover:text-primary" onClick={() => updateQuantity(item.id, "increase")}><Plus className="h-3 w-3" /></button>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-border p-5 space-y-4 bg-muted/30">
              <div className="flex gap-2">
                <input value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} placeholder="Cupom" className="flex-1 bg-background border border-border rounded px-3 py-2 text-sm focus:border-primary outline-none" />
                <Button size="sm" variant="outline" className="border-primary text-primary" onClick={() => {
                  if (couponInput === "SP25") { setAppliedCoupon("SP25"); toast.success("Cupom ativado!"); } 
                  else { toast.error("Inválido."); }
                }}>Aplicar</Button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                {appliedCoupon && <div className="flex justify-between text-primary font-bold"><span>Cupom SP25</span><span>- {formatCurrency(discount)}</span></div>}
                <div className="flex justify-between border-t border-border pt-2 text-lg font-bold text-primary"><span>Total</span><span>{formatCurrency(total)}</span></div>
              </div>

              {!checkoutOpen ? (
                <Button disabled={!cart.length} className="w-full bg-primary hover:bg-orange-600 text-black font-bold py-6" onClick={() => setCheckoutOpen(true)}>Finalizar Compra</Button>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Nick do Jogador</label>
                    <input value={playerNick} onChange={(e) => setPlayerNick(e.target.value)} placeholder="Ex: Maxzin_Silva" className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">ID no Jogo</label>
                    <input value={gameId} onChange={(e) => setGameId(e.target.value)} placeholder="Ex: 1234" className="w-full rounded border border-border bg-background px-3 py-2 text-sm" />
                  </div>
                  <Button className="w-full bg-primary hover:bg-orange-600 text-black font-bold py-6" onClick={submitOrder} disabled={createOrderMut.isPending}>
                    {createOrderMut.isPending ? "Processando..." : "Confirmar Pedido"}
                  </Button>
                  <Button variant="ghost" className="w-full text-xs" onClick={() => setCheckoutOpen(false)}>Voltar ao carrinho</Button>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
