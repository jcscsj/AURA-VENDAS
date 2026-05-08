import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Check,
  ChevronRight,
  Menu,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

const heroImage =
  "/manus-storage/Designsemnome(3)_4e329477.png";

// Textos da página (podem ser editados)
const SITE_TEXTS = {
  hero: {
    badge: "Bem-vindo à Aura City",
    title: "Eleve sua experiência no FiveM",
    description: "Descubra pacotes VIP, veículos premium, organizações e muito mais para sua jornada no servidor.",
  },
  benefits: [
    { title: "Entrega Rápida", desc: "Receba seus itens na hora" },
    { title: "100% Seguro", desc: "Transações protegidas" },
    { title: "Suporte 24/7", desc: "Sempre disponível" },
  ],
};

type CartLine = {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value / 100);

export default function Home() {
  const { user, loading, error, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  
  // Queries do banco
  const { data: categories = [] } = trpc.shop.categories.list.useQuery();
  const { data: products = [] } = trpc.shop.products.list.useQuery();
  const { data: banners = [] } = trpc.shop.banners.list.useQuery();
  const { data: siteConfig } = trpc.shop.admin.config.get.useQuery();

  // Local state
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [playerNick, setPlayerNick] = useState("");
  const [gameId, setGameId] = useState("");
  const [discord, setDiscord] = useState("");
  const [discordId, setDiscordId] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  // Filtrar produtos
  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = activeCategory === null || product.categoryId === activeCategory;
      const matchesQuery =
        !normalizedQuery ||
        (product.name?.toLowerCase().includes(normalizedQuery) ?? false) ||
        (product.description?.toLowerCase().includes(normalizedQuery) ?? false);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, query, products]);

  // Cálculos do carrinho
  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );
  // O desconto agora só existe se o cupom "SP25" for validado
  const discount = appliedCoupon === "SP25" ? Math.round(subtotal * 0.25) : 0;
  const total = Math.max(subtotal - discount, 0);
  const cartQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = (product: any) => {
    setCart((current) => {
      const exists = current.find((item) => item.id === product.id);
      if (exists) {
        return current.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...current, { ...product, quantity: 1 }];
    });
    setCartOpen(true);
    toast.success(`${product.name} adicionado ao carrinho.`);
  };

  const updateQuantity = (productId: number, direction: "increase" | "decrease") => {
    setCart((current) =>
      current
        .map((item) => {
          if (item.id !== productId) return item;
          const nextQuantity = direction === "increase" ? item.quantity + 1 : item.quantity - 1;
          return { ...item, quantity: nextQuantity };
        })
        .filter((item) => item.quantity > 0),
    );
  };

  const removeItem = (productId: number) => {
    setCart((current) => current.filter((item) => item.id !== productId));
    toast.info("Item removido do carrinho.");
  };

  const createOrderMut = trpc.shop.orders.create.useMutation({
    onSuccess: () => {
      toast.success("Pedido realizado com sucesso! Você receberá uma mensagem no Discord em breve.");
      setCheckoutOpen(false);
      setCartOpen(false);
      setCart([]);
      setPlayerNick("");
      setGameId("");
      setDiscord("");
      setDiscordId("");
    },
    onError: (error) => {
      toast.error("Erro ao criar pedido: " + error.message);
    },
  });

  const submitOrder = () => {
    // FATO TÉCNICO: Impede que o comando seja enviado se não houver usuário logado
    if (!isAuthenticated) {
      toast.error("Você precisa estar logado com seu Discord para finalizar o pedido.");
      // Opcional: Redireciona para o login após 2 segundos
      setTimeout(() => { window.location.href = getLoginUrl(); }, 2000);
      return;
    }
    if (!cart.length) {
      toast.error("Adicione pelo menos um item antes de finalizar.");
      return;
    }
    if (!cart.length) {
      toast.error("Adicione pelo menos um item antes de finalizar.");
      return;
    }
    if (!playerNick.trim()) {
      toast.error("Informe o nick do jogador para prosseguir.");
      return;
    }

    const items = cart.map(item => ({
      productId: item.id,
      quantity: item.quantity,
      price: item.price,
      name: item.name,
    }));

    createOrderMut.mutate({
      playerNick,
      gameId: gameId || "",
      // Enviamos os dados que o hook useAuth pegou do Discord
      discord: user?.name || "", 
      discordId: user?.discordId || "",
      items,
      subtotal,
      discount,
      total,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card">
        <div className="container flex h-16 items-center justify-between gap-4">
          <a href="#" className="flex items-center gap-2" aria-label="Aura City">
            <img src="/manus-storage/aura-city-logo_1da7d4d4.png" alt="Aura City" className="h-10 w-10 object-contain" />
            <div>
              <p className="text-lg font-bold text-foreground">Aura City</p>
            </div>
          </a>

          <nav className="hidden items-center gap-8 text-sm font-semibold text-foreground lg:flex">
            <a href="#catalogo" className="hover:text-primary">Catálogo</a>
            <a href="#beneficios" className="hover:text-primary">Benefícios</a>
          </nav>

          <div className="flex items-center gap-2">
            {!isAuthenticated ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/login")}
                  className="hidden md:inline-flex border-primary text-primary hover:bg-primary/10"
                >
                  Login
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/orders")}
                  className="hidden md:inline-flex border-primary text-primary hover:bg-primary/10"
                >
                  Meus Pedidos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/profile")}
                  className="hidden md:inline-flex border-primary text-primary hover:bg-primary/10"
                >
                  Meu Perfil
                </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        await logout();
                      } catch (error) {
                        console.error("Erro ao fazer logout:", error);
                      } finally {
                        // O FINALLY garante que o cache do navegador será limpo sempre!
                        localStorage.clear();
                        sessionStorage.clear();
                        window.location.href = "/";
                      }
                    }}
                    className="hidden md:inline-flex border-red-600 text-red-600 hover:bg-red-600/10"
                  >
                    Sair
                  </Button>
              </>
            )}
            <Button
              className="relative bg-primary hover:bg-orange-600 text-black font-semibold"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Carrinho
              {cartQuantity > 0 && (
                <span className="absolute -right-2 -top-2 grid h-6 min-w-6 place-items-center rounded-full bg-black px-1 text-xs font-bold text-white">
                  {cartQuantity}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-foreground lg:hidden"
              onClick={() => setMobileMenuOpen((value) => !value)}
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="container grid gap-3 border-t border-border bg-card py-4 text-sm font-semibold text-foreground lg:hidden">
            <a href="#catalogo" onClick={() => setMobileMenuOpen(false)}>Catálogo</a>
            <a href="#beneficios" onClick={() => setMobileMenuOpen(false)}>Benefícios</a>

          </div>
        )}
      </header>

      <main>
        {/* Hero Conectado ao Banco */}
        <section className="relative bg-background py-20 text-white md:py-32">
          <img
            src={heroImage}
            alt="Aura City"
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />

          <div className="container relative">
            <div className="max-w-2xl">
              {/* 1. Badge Dinâmico */}
            <div className="mb-6 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-black">
              {siteConfig?.heroSubtitle || (siteConfig === undefined ? "Carregando..." : SITE_TEXTS.hero.badge)}
            </div>
            
            {/* 2. Título Dinâmico */}
            <h1 className="text-5xl font-bold md:text-6xl">
              {siteConfig?.heroTitle || (siteConfig === undefined ? "" : SITE_TEXTS.hero.title)}
            </h1>
            
            {/* 3. Descrição Dinâmica */}
            <p className="mt-6 max-w-xl text-lg text-gray-400">
              {siteConfig?.heroDescription || (siteConfig === undefined ? "" : SITE_TEXTS.hero.description)}
            </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-orange-600 text-black font-semibold"
                  onClick={() => document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" })}
                >
                  Ver catálogo
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Benefícios */}
        <section id="beneficios" className="container py-16">
          <div className="grid gap-6 md:grid-cols-3">
            {SITE_TEXTS.benefits.map((item) => (
              <div key={item.title} className="rounded-lg border border-border bg-card p-6">
                <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
                <p className="mt-2 text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Catálogo */}
        <section id="catalogo" className="bg-background py-16">
          <div className="container">
            <div className="mb-10">
              <h2 className="text-4xl font-bold text-foreground">Catálogo de Produtos</h2>
              <p className="mt-3 text-muted-foreground">
                Filtre por categoria e encontre o pacote perfeito para você
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
              {/* Sidebar */}
              <aside className="h-fit">
                <div className="mb-4 rounded-lg border border-border bg-background p-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Buscar..."
                      className="h-10 w-full bg-transparent pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => setActiveCategory(null)}
                    className={`w-full rounded-lg px-4 py-2 text-left text-sm font-semibold transition ${
                      activeCategory === null
                        ? "bg-primary text-black"
                        : "bg-card text-foreground hover:bg-card/80 border border-border"
                    }`}
                  >
                    Todos
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`w-full rounded-lg px-4 py-2 text-left text-sm font-semibold transition ${
                        activeCategory === category.id
                          ? "bg-primary text-black"
                          : "bg-card text-foreground hover:bg-card/80 border border-border"
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </aside>

              {/* Products Grid */}
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product) => (
                  <article
                    key={product.id}
                    className="overflow-hidden rounded-lg border border-border bg-card shadow-sm hover:shadow-md transition flex flex-col"
                  >
                    <div className="relative w-full aspect-[1590/2158] overflow-hidden bg-gray-200 flex-shrink-0">
                      <img src={product.image ?? ""} alt={product.name ?? ""} className="h-full w-full object-cover" />
                      <div className="absolute left-3 top-3 rounded bg-primary px-3 py-1 text-xs font-bold text-black">
                        {product.tag ?? "Novo"}
                      </div>
                    </div>

                    <div className="p-4 flex flex-col flex-grow">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Produto</p>
                      <h3 className="mt-1 text-lg font-bold text-foreground">{product.name}</h3>
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-3 flex-grow">{product.description}</p>

                      <div className="mt-3 flex items-baseline gap-2">
                        {product.oldPrice && (
                          <p className="text-sm text-muted-foreground line-through">
                            {formatCurrency(product.oldPrice)}
                          </p>
                        )}
                        <p className="text-2xl font-bold text-primary">{formatCurrency(product.price ?? 0)}</p>
                      </div>

                      <Button
                        className="mt-4 w-full bg-primary hover:bg-orange-600 text-black font-semibold"
                        onClick={() => addToCart(product)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-background py-16 text-white">
          <div className="container text-center">
            <h2 className="text-3xl font-bold">Pronto para começar?</h2>
            <p className="mt-3 text-gray-300">Explore nosso catálogo completo de produtos premium</p>
            <Button
              size="lg"
              className="mt-6 bg-primary hover:bg-orange-600 text-black font-semibold"
              onClick={() => document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" })}
            >
              Ver Catálogo
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>Aura City © 2026. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* Cart Sidebar */}
      {cartOpen && (
        <div className="fixed inset-0 z-[80] bg-black/50" onClick={() => setCartOpen(false)}>
          <aside
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="text-xl font-bold text-foreground">Carrinho</h2>
              <Button variant="ghost" size="icon" onClick={() => setCartOpen(false)} aria-label="Fechar">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="grid h-full place-items-center text-center">
                  <div>
                    <ShoppingCart className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                    <p className="text-foreground font-semibold">Seu carrinho está vazio</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-3 rounded-lg border border-border bg-background p-3">
                      <img src={item.image ?? ""} alt={item.name} className="h-16 w-20 object-cover rounded" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-sm">{item.name}</h3>
                        <p className="text-xs text-muted-foreground">{formatCurrency(item.price)}</p>
                        <div className="mt-2 flex items-center gap-1 border border-border w-fit rounded">
                          <button
                            className="grid h-6 w-6 place-items-center hover:bg-gray-100"
                            onClick={() => updateQuantity(item.id, "decrease")}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="grid h-6 w-6 place-items-center text-xs font-semibold">{item.quantity}</span>
                          <button
                            className="grid h-6 w-6 place-items-center hover:bg-gray-100"
                            onClick={() => updateQuantity(item.id, "increase")}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-border p-4 space-y-4">
              {/* CAMPO DE CUPOM DINÂMICO */}
              <div className="flex gap-2">
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Cupom de desconto"
                  className="flex-1 bg-background border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                />
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-primary text-primary"
                  onClick={() => {
                    if (couponInput === "SP25") {
                      setAppliedCoupon("SP25");
                      toast.success("Cupom aplicado!");
                    } else {
                      toast.error("Cupom inválido.");
                    }
                  }}
                >
                  Aplicar
                </Button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                
                {/* O cupom só aparece se 'appliedCoupon' não for nulo */}
                {appliedCoupon && (
                  <div className="flex justify-between text-primary font-semibold">
                    <span>Cupom {appliedCoupon}</span>
                    <span>- {formatCurrency(discount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between border-t border-border pt-2 font-bold text-foreground">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              {!checkoutOpen ? (
                <Button
                  disabled={!cart.length}
                  className="w-full bg-primary hover:bg-orange-600 text-white font-semibold disabled:opacity-50"
                  onClick={() => setCheckoutOpen(true)}
                >
                  Ir para checkout
                </Button>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-foreground">
                      Nick do jogador
                      <input
                        value={playerNick}
                        onChange={(e) => setPlayerNick(e.target.value)}
                        placeholder="Ex.: João_Santos"
                        className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-foreground"
                      />
                    </label>
                    <label className="block text-sm font-semibold text-foreground">
                      ID do Jogo (5M)
                      <input
                        value={gameId}
                        onChange={(e) => setGameId(e.target.value)}
                        placeholder="Ex.: 12345"
                        className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-foreground"
                      />
                    </label>
                    {isAuthenticated && user?.discordId && (
                      <div className="rounded border border-border bg-background px-3 py-2">
                        <p className="text-xs text-muted-foreground">Discord ID</p>
                        <p className="text-sm font-semibold text-foreground">{user.discordId}</p>
                      </div>
                    )}
                  </div>
                  <Button
                    className="w-full bg-primary hover:bg-orange-600 text-white font-semibold"
                    onClick={submitOrder}
                  >
                    Confirmar Pedido
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setCheckoutOpen(false)}
                  >
                    Voltar
                  </Button>
                </>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
