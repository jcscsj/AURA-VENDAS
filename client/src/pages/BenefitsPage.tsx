import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useShop } from "@/contexts/ShopContext";
import { ChevronLeft, Minus, Plus, Search, ShoppingCart, Trash2, X } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

type CartLine = { id: number; name: string; price: number; image: string; quantity: number; };
const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value / 100);

export default function BenefitsPage() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  
  // Queries
  const { data: categories =[] } = trpc.shop.categories.list.useQuery();
  const { data: products =[] } = trpc.shop.products.list.useQuery();

  // States
  const { cart, cartOpen, setCartOpen, addToCart, updateQuantity, removeItem, clearCart } = useShop();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [playerNick, setPlayerNick] = useState("");
  const[gameId, setGameId] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const[appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  // FATO TÉCNICO: Preenchimento Automático
  useEffect(() => {
    if (checkoutOpen && user) {
      if (playerNick === "" && user.characterName) setPlayerNick(user.characterName);
      if (gameId === "" && user.gameId) setGameId(user.gameId);
    }
  },[checkoutOpen, user, playerNick, gameId]);

  // Filtro
  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = activeCategory === null || product.categoryId === activeCategory;
      const matchesQuery = !normalizedQuery || (product.name?.toLowerCase().includes(normalizedQuery) ?? false) || (product.description?.toLowerCase().includes(normalizedQuery) ?? false);
      return matchesCategory && matchesQuery;
    });
  },[activeCategory, query, products]);

  // Cálculos
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const discount = appliedCoupon === "SP25" ? Math.round(subtotal * 0.25) : 0;
  const total = Math.max(subtotal - discount, 0);
  const cartQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  const createOrderMut = trpc.shop.orders.create.useMutation({
    onSuccess: () => {
      toast.success("Pedido realizado com sucesso!");
      setCheckoutOpen(false); setCartOpen(false); clearCart(); setPlayerNick(""); setGameId("");
    },
    onError: (error) => toast.error("Erro ao criar pedido: " + error.message),
  });

  const submitOrder = () => {
    if (!isAuthenticated) { toast.error("Logue no Discord para confirmar o pedido."); return; }
    if (!cart.length) return;
    
    createOrderMut.mutate({
      playerNick, gameId: gameId || "",
      discord: user?.name || "Não informado", discordId: user?.discordId || null,
      items: cart.map(item => ({ productId: item.id, quantity: item.quantity, price: item.price, name: item.name })),
      subtotal, discount, total,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header Focado */}
      <header className="sticky top-0 z-50 border-b border-border bg-card">
        <div className="container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/")} className="text-primary hover:bg-primary/10 px-2">
              <ChevronLeft className="h-5 w-5 mr-1" /> Voltar à Loja
            </Button>
            <h1 className="text-lg font-bold border-l border-border pl-4">Benefícios & VIPs</h1>
          </div>

          <Button className="relative bg-primary hover:bg-orange-600 text-black font-semibold" onClick={() => setCartOpen(true)}>
            <ShoppingCart className="mr-2 h-4 w-4" /> Carrinho
            {cartQuantity > 0 && <span className="absolute -right-2 -top-2 grid h-6 min-w-6 place-items-center rounded-full bg-black px-1 text-xs font-bold text-white">{cartQuantity}</span>}
          </Button>
        </div>
      </header>

      <main className="container py-12">
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-bold text-foreground">Catálogo de Benefícios</h2>
          <p className="mt-3 text-muted-foreground">Adquira VIPs, acesso ao Spotify e vantagens exclusivas na Aura City.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
          {/* Sidebar */}
          <aside className="h-fit space-y-6">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar benefício..." className="h-10 w-full bg-background border border-border rounded pl-10 pr-3 text-sm focus:outline-none focus:border-primary" />
              </div>
            </div>

            <div className="space-y-2 rounded-lg border border-border bg-card p-4">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Categorias</h3>
              <button onClick={() => setActiveCategory(null)} className={`w-full rounded-lg px-4 py-2 text-left text-sm font-semibold transition ${activeCategory === null ? "bg-primary text-black" : "hover:bg-background"}`}>
                Todos
              </button>
              {categories.map((category) => (
                <button key={category.id} onClick={() => setActiveCategory(category.id)} className={`w-full rounded-lg px-4 py-2 text-left text-sm font-semibold transition ${activeCategory === category.id ? "bg-primary text-black" : "hover:bg-background"}`}>
                  {category.name}
                </button>
              ))}
            </div>
          </aside>

          {/* Grid de Produtos */}
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <article key={product.id} className="overflow-hidden rounded-lg border border-border bg-card shadow-sm hover:shadow-md transition flex flex-col hover:border-primary/50">
                {product.image && (
                  <div className="relative w-full h-48 overflow-hidden bg-background flex-shrink-0">
                    <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                    <div className="absolute left-3 top-3 rounded bg-primary px-3 py-1 text-xs font-bold text-black">{product.tag || "Benefício"}</div>
                  </div>
                )}
                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="text-lg font-bold text-foreground">{product.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3 flex-grow">{product.description}</p>
                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <p className="text-2xl font-bold text-primary">{formatCurrency(product.price)}</p>
                    <Button 
                      className="bg-primary hover:bg-orange-600 text-black font-semibold disabled:opacity-50"
                      disabled={user?.role === "admin"}
                      onClick={() => addToCart(product)}
                    >
                      {user?.role === "admin" ? "Visualizando" : "Comprar"}
                    </Button>
                  </div>
                </div>
              </article>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed border-border rounded-lg">
                Nenhum benefício encontrado.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Carrinho (Mesma lógica segura da Home) */}
      {cartOpen && (
        <div className="fixed inset-0 z-[80] bg-black/50" onClick={() => setCartOpen(false)}>
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="text-xl font-bold">Carrinho</h2>
              <Button variant="ghost" size="icon" onClick={() => setCartOpen(false)}><X className="h-5 w-5" /></Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="grid h-full place-items-center text-center text-muted-foreground">
                  <p className="font-semibold">Seu carrinho está vazio</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-3 rounded-lg border border-border bg-background p-3">
                      {item.image && <img src={item.image} alt={item.name} className="h-16 w-20 object-cover rounded" />}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{item.name}</h3>
                        <p className="text-xs text-muted-foreground">{formatCurrency(item.price)}</p>
                        <div className="mt-2 flex items-center gap-1 border border-border w-fit rounded">
                          <button className="grid h-6 w-6 place-items-center hover:bg-gray-100/10" onClick={() => updateQuantity(item.id, "decrease")}><Minus className="h-3 w-3" /></button>
                          <span className="grid h-6 w-6 place-items-center text-xs font-semibold">{item.quantity}</span>
                          <button className="grid h-6 w-6 place-items-center hover:bg-gray-100/10" onClick={() => updateQuantity(item.id, "increase")}><Plus className="h-3 w-3" /></button>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-border p-4 space-y-4">
              <div className="flex gap-2">
                <input value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} placeholder="Cupom de desconto" className="flex-1 bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                <Button size="sm" variant="outline" className="border-primary text-primary" onClick={() => {
                  if (couponInput === "SP25") { setAppliedCoupon("SP25"); toast.success("Cupom aplicado!"); } 
                  else { toast.error("Cupom inválido."); }
                }}>Aplicar</Button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                {appliedCoupon && <div className="flex justify-between text-primary font-semibold"><span>Cupom {appliedCoupon}</span><span>- {formatCurrency(discount)}</span></div>}
                <div className="flex justify-between border-t border-border pt-2 font-bold"><span>Total</span><span>{formatCurrency(total)}</span></div>
              </div>

              {!checkoutOpen ? (
                <Button disabled={!cart.length} className="w-full bg-primary hover:bg-orange-600 text-black font-semibold disabled:opacity-50" onClick={() => setCheckoutOpen(true)}>Ir para checkout</Button>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold">Nick do jogador
                      <input value={playerNick} onChange={(e) => setPlayerNick(e.target.value)} placeholder="Ex.: João_Santos" className="mt-1 w-full rounded border border-border bg-background px-3 py-2" />
                    </label>
                    <label className="block text-sm font-semibold">ID do Jogo (5M)
                      <input value={gameId} onChange={(e) => setGameId(e.target.value)} placeholder="Ex.: 12345" className="mt-1 w-full rounded border border-border bg-background px-3 py-2" />
                    </label>
                  </div>
                  <Button className="w-full bg-primary hover:bg-orange-600 text-black font-semibold" onClick={submitOrder}>Confirmar Pedido</Button>
                  <Button variant="outline" className="w-full" onClick={() => setCheckoutOpen(false)}>Voltar</Button>
                </>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
