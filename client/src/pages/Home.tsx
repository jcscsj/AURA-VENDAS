import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useShop } from "@/contexts/ShopContext";
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
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

const heroImage = "/hero-banner.webp";

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
  const { cart, cartOpen, setCartOpen, addToCart, updateQuantity, removeItem, clearCart } = useShop();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [playerNick, setPlayerNick] = useState("");
  const [gameId, setGameId] = useState("");
  const [discord, setDiscord] = useState("");
  const [discordId, setDiscordId] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  useEffect(() => {
    if (checkoutOpen && user) {
      // Só preenche se o campo estiver vazio para não sobrescrever o que o usuário digitar
      if (playerNick === "" && user.characterName) {
        setPlayerNick(user.characterName);
      }
      if (gameId === "" && user.gameId) {
        setGameId(user.gameId);
      }
    }
  }, [checkoutOpen, user]);
  // Filtrar produtos
  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    
    // 1. Pegamos IDs das categorias de 'catalog' ou sem tipo (antigas)
    const catalogCategoryIds = categories
      .filter(c => c.type === 'catalog' || !c.type)
      .map(c => c.id);

    return products.filter((product) => {
      // 2. O produto SÓ aparece se a categoria dele for do catálogo principal
      const belongsToCatalog = catalogCategoryIds.includes(product.categoryId);
      
      const matchesCategory = activeCategory === null || product.categoryId === activeCategory;
      const matchesQuery = !normalizedQuery || 
        (product.name?.toLowerCase().includes(normalizedQuery) ?? false) || 
        (product.description?.toLowerCase().includes(normalizedQuery) ?? false);
      
      return belongsToCatalog && matchesCategory && matchesQuery;
    });
  }, [activeCategory, query, products, categories]);

  // Cálculos do carrinho
  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

    // O desconto agora só existe se o cupom "SP25" for validado
  const discount = appliedCoupon === "SP25" ? Math.round(subtotal * 0.25) : 0;
  const total = Math.max(subtotal - discount, 0);
  const cartQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  const createOrderMut = trpc.shop.orders.create.useMutation({
    onSuccess: () => {
      toast.success("Pedido realizado com sucesso! Você receberá uma mensagem no Discord em breve.");
      setCheckoutOpen(false);
      setCartOpen(false);
      clearCart();
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
    if (!isAuthenticated) {
      toast.error("Você precisa entrar com seu Discord para finalizar o pedido.");
      return;
    }

    if (!cart.length) {
      toast.error("Adicione pelo menos um item antes de finalizar.");
      return;
    }

    const items = cart.map(item => ({
      productId: item.id,
      quantity: item.quantity,
      price: item.price,
      name: item.name,
    }));

    // FATO TÉCNICO: Garantimos que o "user" (que tem o seu ID) seja empacotado aqui
    createOrderMut.mutate({
      playerNick,
      gameId: gameId || "",
      // Agora o 'user' já carregou o discordId do banco graças ao passo 1
      discord: user?.name || "Não informado",
      discordId: user?.discordId || null,
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
          <a href="" className="flex items-center gap-2" aria-label="Aura City">
            <img src="/logo-home.webp" alt="Aura City" className="h-10 w-10 object-contain" />
            <div>
              <p className="text-lg font-bold text-foreground">Aura City</p>
            </div>
          </a>

          <nav className="hidden items-center gap-8 text-sm font-semibold text-foreground lg:flex">
            {/* BOTÃO CORRIGIDO: Rola a tela suavemente até o catálogo */}
            <button 
              onClick={() => document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" })}
              className="hover:text-primary transition-colors"
            >
              Catálogo
            </button>
            <button onClick={() => navigate("/beneficios")} className="hover:text-primary transition-colors">Benefícios</button>
            <button onClick={() => navigate("/termos")} className="hover:text-primary transition-colors">Termos</button>
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
          <div className="container grid gap-4 border-t border-border bg-card py-6 text-sm font-semibold text-foreground lg:hidden">
            <button 
              onClick={() => {
                setMobileMenuOpen(false);
                document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });
              }} 
              className="text-left hover:text-primary py-2 border-b border-border/50"
            >
              Catálogo
            </button>
            <button 
              onClick={() => { setMobileMenuOpen(false); navigate("/beneficios"); }} 
              className="text-left hover:text-primary py-2 border-b border-border/50"
            >
              Benefícios
            </button>
            {/* NOVO BOTÃO DE TERMOS NO MOBILE */}
            <button 
              onClick={() => { setMobileMenuOpen(false); navigate("/termos"); }} 
              className="text-left hover:text-primary py-2 border-b border-border/50"
            >
              Termos
            </button>

            {/* SEÇÃO DE CONTA NO MOBILE */}
            <div className="pt-2 space-y-3">
              {!isAuthenticated ? (
                <Button
                  className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold"
                  onClick={() => { setMobileMenuOpen(false); window.location.href = getLoginUrl(); }}
                >
                  Entrar com Discord
                </Button>
              ) : (
                <div className="grid gap-2">
                  <p className="text-xs text-muted-foreground uppercase px-1">Minha Conta</p>
                  <Button variant="outline" className="justify-start border-border" onClick={() => { setMobileMenuOpen(false); navigate("/orders"); }}>
                    Meus Pedidos
                  </Button>
                  <Button variant="outline" className="justify-start border-border" onClick={() => { setMobileMenuOpen(false); navigate("/profile"); }}>
                    Meu Perfil
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="justify-start text-red-500 hover:bg-red-500/10" 
                    onClick={async () => {
                      setMobileMenuOpen(false);
                      await logout();
                      localStorage.clear();
                      window.location.href = "/";
                    }}
                  >
                    Sair da Conta
                  </Button>
                </div>
              )}
            </div>
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

        {/* Seção de Banners Dinâmicos - Modo Carrossel no Mobile */}
        {banners && banners.length > 0 && (
          <section className="container py-8 scroll-mt-20">
            <div className="flex lg:grid lg:grid-cols-3 gap-6 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 no-scrollbar flex-nowrap lg:flex-wrap">
              {banners.map((banner) => (
                <a 
                  key={banner.id} 
                  href={banner.link || "#"} 
                  target={banner.link ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  className="group relative h-56 w-[85vw] md:w-[45vw] lg:w-full flex-shrink-0 overflow-hidden rounded-2xl border border-orange-500/20 bg-card transition-all hover:border-primary block cursor-pointer"
                >
                  <img
                    src={banner.imageUrl}
                    alt={banner.title || "Destaque"}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {banner.title && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex items-end p-6">
                      <p className="text-white font-bold text-lg">{banner.title}</p>
                    </div>
                  )}
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Catálogo */}
        <section id="catalogo" className="bg-background py-16 scroll-mt-20">
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

                <div className="flex lg:flex-col gap-2 overflow-x-auto pb-3 lg:pb-0 no-scrollbar flex-nowrap">
                  <button
                    onClick={() => setActiveCategory(null)}
                    className={`whitespace-nowrap rounded-lg px-4 py-2 text-left text-sm font-semibold transition ${
                      activeCategory === null
                        ? "bg-primary text-black"
                        : "bg-card text-foreground hover:bg-card/80 border border-border"
                    }`}
                  >
                    Todos
                  </button>
                  {categories
                    .filter((category) => category.type === "catalog")
                    .map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setActiveCategory(category.id)}
                        className={`whitespace-nowrap rounded-lg px-4 py-2 text-left text-sm font-semibold transition ${
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
                      <img 
                        src={product.image} 
                        alt={product.name ?? ""} 
                        className="h-full w-full object-cover" 
                        onError={(e) => {
                          // 1. Trava de segurança para não dar loop infinito
                          e.currentTarget.onerror = null; 
                          // 2. FATO TÉCNICO: Se a foto original der erro/expirar, assume a logo padrão
                          // (Mude "/logo.png" para o nome exato do arquivo que você tem na pasta public)
                          (e.target as HTMLImageElement).src = "/logo-home.webp";
                        }}
                      />
                      <div className="absolute left-3 top-3 flex gap-1">
                        {/* FATO TÉCNICO: Só desenha na tela se 'showTag' for diferente de falso */}
                        {(product.showTag !== false) && (
                          <div className="rounded bg-primary px-3 py-1 text-xs font-bold text-black uppercase shadow-lg">
                            {product.tag || "Novo"}
                          </div>
                        )}
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
                        className="mt-4 w-full bg-primary hover:bg-orange-600 text-black font-semibold disabled:opacity-50"
                        // FATO TÉCNICO: Desativa o botão se for admin
                        disabled={user?.role === "admin"}
                        onClick={() => addToCart(product)}
                      >
                        {user?.role === "admin" ? "Modo Visualização" : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            Adicionar
                          </>
                        )}
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
              onClick={() => navigate("/beneficios")}
            >
              Ver Benefícios
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
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center py-2 font-bold text-foreground">
                  <span className="text-muted-foreground font-medium">Valor total:</span>
                  <span className="text-xl text-primary">{formatCurrency(subtotal)}</span>
                </div>
              </div>

              <Button 
                disabled={cart.length === 0}
                className="w-full bg-primary hover:bg-orange-600 text-black font-bold py-7 text-lg shadow-lg shadow-primary/10" 
                onClick={() => {
                  setCartOpen(false); // Fecha o menu lateral
                  navigate("/checkout"); // Manda para a nova página de pagamento
                }}
              >
                Ir para a compra
              </Button>

              <Button
                variant="ghost"
                className="w-full text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setCartOpen(false)}
              >
                Continuar comprando
              </Button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
