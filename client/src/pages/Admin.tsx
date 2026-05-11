import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  Trash2,
  Plus,
  Save,
  LogOut,
  Home,
  Edit2,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
} from "lucide-react";

export default function Admin() {
  const { user, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"products" | "categories" | "banners" | "orders" | "config" | "users" | "logs">("products");
  const [visibleEmails, setVisibleEmails] = useState<Record<number, boolean>>({});
  const [newCoupon, setNewCoupon] = useState({ code: "", type: "percentage", value: 0 });

  // Proteger rota de admin
  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      toast.error("Acesso negado. Apenas administradores podem acessar esta página.");
      navigate("/admin-login");
    }
  }, [user, loading, navigate]);

  // Queries
  const { data: categories = [], refetch: refetchCategories } = trpc.shop.categories.list.useQuery();
  const { data: products = [], refetch: refetchProducts } = trpc.shop.products.list.useQuery();
  const { data: banners = [], refetch: refetchBanners } = trpc.shop.banners.list.useQuery();
  const { data: orders = [], refetch: refetchOrders } = trpc.shop.orders.list.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: storeUsers = [], refetch: refetchUsers } = trpc.shop.admin.users.list.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: serverLogs = [] } = trpc.shop.admin.logs.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: siteConfig, refetch: refetchConfig } = trpc.shop.admin.config.get.useQuery();
  const { data: coupons = [], refetch: refetchCoupons } = trpc.shop.admin.coupons.list.useQuery();

  // Mutations
  const createCategoryMut = trpc.shop.admin.categories.create.useMutation({
    onSuccess: () => {
      refetchCategories();
      toast.success("Categoria criada!");
      setNewCategoryName("");
    },
    onError: () => toast.error("Erro ao criar categoria"),
  });

  const updateCategoryMut = trpc.shop.admin.categories.update.useMutation({
    onSuccess: () => {
      refetchCategories();
      toast.success("Categoria renomeada!");
      setEditingCategoryId(null);
      setNewCategoryName("");
    },
    onError: () => toast.error("Erro ao renomear categoria"),
  });

  const deleteCategoryMut = trpc.shop.admin.categories.delete.useMutation({
    onSuccess: () => {
      refetchCategories();
      toast.success("Categoria removida!");
    },
    onError: () => toast.error("Erro ao remover categoria"),
  });

  const moveCategoryUpMut = trpc.shop.admin.categories.moveUp.useMutation({
    onSuccess: () => {
      refetchCategories();
      toast.success("Categoria movida para cima!");
    },
    onError: () => toast.error("Erro ao mover categoria"),
  });

  const moveCategoryDownMut = trpc.shop.admin.categories.moveDown.useMutation({
    onSuccess: () => {
      refetchCategories();
      toast.success("Categoria movida para baixo!");
    },
    onError: () => toast.error("Erro ao mover categoria"),
  });

  const createProductMut = trpc.shop.admin.products.create.useMutation({
    onSuccess: () => {
      refetchProducts();
      toast.success("Produto criado!");
      setNewProduct({});
    },
    onError: () => toast.error("Erro ao criar produto"),
  });

  const updateProductMut = trpc.shop.admin.products.update.useMutation({
    onSuccess: () => {
      refetchProducts();
      toast.success("Produto atualizado!");
      setEditingProductId(null);
      setNewProduct({});
    },
    onError: () => toast.error("Erro ao atualizar produto"),
  });

  const deleteProductMut = trpc.shop.admin.products.delete.useMutation({
    onSuccess: () => {
      refetchProducts();
      toast.success("Produto removido!");
    },
    onError: () => toast.error("Erro ao remover produto"),
  });

  const moveProductUpMut = trpc.shop.admin.products.moveUp.useMutation({
    onSuccess: () => {
      refetchProducts();
      toast.success("Produto movido para cima!");
    },
    onError: () => toast.error("Erro ao mover produto"),
  });

  const moveProductDownMut = trpc.shop.admin.products.moveDown.useMutation({
    onSuccess: () => {
      refetchProducts();
      toast.success("Produto movido para baixo!");
    },
    onError: () => toast.error("Erro ao mover produto"),
  });

  const createBannerMut = trpc.shop.admin.banners.create.useMutation({
    onSuccess: () => {
      refetchBanners();
      toast.success("Banner criado!");
      setNewBanner({});
    },
    onError: () => toast.error("Erro ao criar banner"),
  });

  const updateBannerMut = trpc.shop.admin.banners.update.useMutation({
    onSuccess: () => {
      refetchBanners();
      toast.success("Banner atualizado!");
      setEditingBannerId(null);
      setNewBanner({});
    },
    onError: () => toast.error("Erro ao atualizar banner"),
  });

  const deleteBannerMut = trpc.shop.admin.banners.delete.useMutation({
    onSuccess: () => {
      refetchBanners();
      toast.success("Banner removido!");
    },
    onError: () => toast.error("Erro ao remover banner"),
  });

  const moveBannerUpMut = trpc.shop.admin.banners.moveUp.useMutation({
    onSuccess: () => {
      refetchBanners();
      toast.success("Banner movido para cima!");
    },
    onError: () => toast.error("Erro ao mover banner"),
  });

  const moveBannerDownMut = trpc.shop.admin.banners.moveDown.useMutation({
    onSuccess: () => {
      refetchBanners();
      toast.success("Banner movido para baixo!");
    },
    onError: () => toast.error("Erro ao mover banner"),
  });

  const createCouponMut = trpc.shop.admin.coupons.create.useMutation({
    onSuccess: () => {
      refetchCoupons();
      toast.success("Cupom criado com sucesso!");
      setNewCoupon({ code: "", type: "percentage", value: 0 });
    },
    onError: (err: any) => toast.error("Erro: " + err.message),
  });

  const deleteCouponMut = trpc.shop.admin.coupons.delete.useMutation({
    onSuccess: () => {
      refetchCoupons();
      toast.success("Cupom removido!");
    },
    onError: (err: any) => toast.error("Erro ao remover: " + err.message),
  });

  const updateConfigMut = trpc.shop.admin.config.update.useMutation({
    onSuccess: () => {
      // FATO TÉCNICO: Isso obriga o site a buscar os dados novos do banco na hora
      refetchConfig(); 
      toast.success("Configurações atualizadas!");
    },
    onError: (error: any) => toast.error("Erro ao salvar: " + error.message),
  });
  const deleteUserMut = trpc.shop.admin.users.delete.useMutation({
    onSuccess: () => {
      refetchUsers();
      toast.success("Conta removida com sucesso!");
    },
    onError: (err) => toast.error("Erro ao remover: " + err.message),
  });
  const deleteOrderMut = trpc.shop.orders.delete.useMutation({
    onSuccess: () => {
      refetchOrders();
      toast.success("Pedido excluído permanentemente!");
    },
    onError: (err) => toast.error("Erro ao excluir: " + err.message),
  });

  // Local state
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [newProduct, setNewProduct] = useState<any>({});
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [newBanner, setNewBanner] = useState<any>({});
  const [editingBannerId, setEditingBannerId] = useState<number | null>(null);
  const [configForm, setConfigForm] = useState<any>({});
  const [newCategoryType, setNewCategoryType] = useState<"catalog" | "benefits">("catalog");

  // Redirect if not admin
  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  const handleSaveProduct = () => {
    if (!newProduct.name) {
      toast.error("Nome do produto é obrigatório");
      return;
    }
    if (!newProduct.categoryId) {
      toast.error("Categoria é obrigatória");
      return;
    }
    if (!newProduct.price) {
      toast.error("Preço é obrigatório");
      return;
    }

    // Preencher campos obrigatórios com valores padrão
    const productData = {
      ...newProduct,
      description: newProduct.description || "Produto sem descrição",
      tag: newProduct.tag || "Novo",
      rarity: newProduct.rarity || "Premium",
      image: newProduct.image || "",
      benefits: newProduct.benefits || [],
    };
    
    // Remover oldPrice se não estiver preenchido
    if (!newProduct.oldPrice) {
      delete productData.oldPrice;
    }

    if (editingProductId) {
      updateProductMut.mutate({ id: editingProductId, ...productData });
    } else {
      createProductMut.mutate(productData);
    }
  };

  const handleSaveBanner = () => {
    if (!newBanner.title || !newBanner.imageUrl) {
      toast.error("Título e URL da imagem são obrigatórios");
      return;
    }

    if (editingBannerId) {
      updateBannerMut.mutate({ id: editingBannerId, ...newBanner });
    } else {
      createBannerMut.mutate(newBanner);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.webp" alt="Aura City" className="h-10 w-10 object-contain" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Aura City</h1>
              <p className="text-xs text-muted-foreground">Painel Admin</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/")} className="gap-2 border-primary text-primary hover:bg-primary/10">
              <Home className="h-4 w-4" />
              Loja
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={async () => {
                try {
                  await logout();
                } catch (error) {
                  console.error("Erro ao fazer logout:", error);
                } finally {
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.href = "/";
                }
              }} 
              className="gap-2 text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-border mb-8">
          {(["products", "categories", "banners", "orders", "config", "users", "coupons", "logs"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-semibold text-sm transition ${
                activeTab === tab
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "users" ? "Contas Logadas" : tab === "logs" ? "Console" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Produtos */}
        {activeTab === "products" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-4">Gerenciar Produtos</h2>
              <div className="space-y-4 rounded-lg border border-border bg-background p-6">
                <div>
                  <label className="block text-sm font-semibold text-foreground">Nome</label>
                  <input
                    type="text"
                    value={newProduct.name || ""}
                    onChange={(e: any) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="mt-1 w-full rounded border border-border bg-card px-3 py-2 text-foreground"
                    placeholder="Nome do produto"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground">Categoria</label>
                  <select
                    value={newProduct.categoryId || ""}
                    onChange={(e: any) => setNewProduct({ ...newProduct, categoryId: Number(e.target.value) })}
                    className="mt-1 w-full rounded border border-border bg-card px-3 py-2 text-foreground"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground">Preço (em centavos)</label>
                  <input
                    type="number"
                    value={newProduct.price || 0}
                    onChange={(e: any) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                    className="mt-1 w-full rounded border border-border bg-card px-3 py-2 text-foreground"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground">Preço Antigo (opcional)</label>
                  <input
                    type="number"
                    value={newProduct.oldPrice || 0}
                    onChange={(e: any) => setNewProduct({ ...newProduct, oldPrice: e.target.value ? Number(e.target.value) : undefined })}
                    className="mt-1 w-full rounded border border-border bg-card px-3 py-2 text-foreground"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground">URL da Imagem</label>
                  <input
                    type="text"
                    value={newProduct.image || ""}
                    onChange={(e: any) => setNewProduct({ ...newProduct, image: e.target.value })}
                    className="mt-1 w-full rounded border border-border bg-card px-3 py-2 text-foreground"
                    placeholder="https://..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button className="gap-2 bg-primary hover:bg-orange-600 text-black font-semibold" onClick={handleSaveProduct}>
                    <Save className="h-4 w-4" />
                    {editingProductId ? "Atualizar" : "Criar"}
                  </Button>
                  {editingProductId && (
                    <Button variant="outline" onClick={() => { setEditingProductId(null); setNewProduct({}); }}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4">Produtos Existentes</h3>
              <div className="grid gap-3">
                {products.map((product: any) => (
                  <div key={product.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{product.name}</h4>
                      <p className="text-sm text-muted-foreground">R$ {(product.price ? product.price / 100 : 0).toFixed(2)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveProductUpMut.mutate({ id: product.id })}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveProductDownMut.mutate({ id: product.id })}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingProductId(product.id);
                          setNewProduct(product);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => deleteProductMut.mutate({ id: product.id })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Categorias */}
        {activeTab === "categories" && (
          <div className="space-y-8"> {/* ESTA DIV É O WRAPPER QUE RESOLVE O ERRO */}
            {/* 1. Formulário de Criação/Edição */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Gerenciar Categorias</h2>
              <div className="flex flex-col md:flex-row gap-2 rounded-lg border border-border bg-card p-6 shadow-md">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 rounded border border-border bg-background px-3 py-2 text-foreground focus:border-primary outline-none"
                  placeholder="Nome da categoria"
                />
                
                <select 
                  value={newCategoryType}
                  onChange={(e) => setNewCategoryType(e.target.value as any)}
                  className="rounded border border-border bg-background px-3 py-2 text-foreground outline-none font-semibold text-sm"
                >
                  <option value="catalog">📍 Catálogo (Home)</option>
                  <option value="benefits">⭐ Benefícios (Pág. Secundária)</option>
                </select>

                <Button 
                  className="gap-2 bg-primary hover:bg-orange-600 text-black font-bold px-6" 
                  onClick={() => {
                    if (!newCategoryName.trim()) return;
                    if (editingCategoryId) {
                      updateCategoryMut.mutate({ id: editingCategoryId, name: newCategoryName, type: newCategoryType });
                    } else {
                      createCategoryMut.mutate({ name: newCategoryName, type: newCategoryType });
                    }
                  }}
                >
                  {editingCategoryId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {editingCategoryId ? "Salvar" : "Adicionar"}
                </Button>
                {editingCategoryId && (
                  <Button variant="ghost" onClick={() => { setEditingCategoryId(null); setNewCategoryName(""); }}>
                    Cancelar
                  </Button>
                )}
              </div>
            </div>

            {/* 2. Listas Separadas (Onde dava o erro de "className") */}
            <div className="space-y-10">
              {/* CATÁLOGO PRINCIPAL */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-primary uppercase tracking-widest">
                  <div className="w-2 h-2 bg-primary rounded-full" /> Catálogo Principal (Home)
                </h3>
                <div className="grid gap-3">
                  {categories.filter(c => c.type === 'catalog' || !c.type).map((category) => (
                    <div key={category.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-4 hover:border-primary/20 transition-all">
                      <h4 className="font-semibold text-foreground">{category.name}</h4>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => moveCategoryUpMut.mutate({ id: category.id })}><ChevronUp className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => moveCategoryDownMut.mutate({ id: category.id })}><ChevronDown className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => { setEditingCategoryId(category.id); setNewCategoryName(category.name); setNewCategoryType('catalog'); }}><Edit2 className="h-4 w-4 text-primary" /></Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { if(confirm("Apagar?")) deleteCategoryMut.mutate({ id: category.id }) }}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* BENEFÍCIOS */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-orange-400 uppercase tracking-widest">
                  <div className="w-2 h-2 bg-orange-400 rounded-full" /> Benefícios do Jogo
                </h3>
                <div className="grid gap-3">
                  {categories.filter(c => c.type === 'benefits').map((category) => (
                    <div key={category.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-4 hover:border-orange-400/20 transition-all">
                      <h4 className="font-semibold text-foreground">{category.name}</h4>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => moveCategoryUpMut.mutate({ id: category.id })}><ChevronUp className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => moveCategoryDownMut.mutate({ id: category.id })}><ChevronDown className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => { setEditingCategoryId(category.id); setNewCategoryName(category.name); setNewCategoryType('benefits'); }}><Edit2 className="h-4 w-4 text-primary" /></Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { if(confirm("Apagar?")) deleteCategoryMut.mutate({ id: category.id }) }}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                  {categories.filter(c => c.type === 'benefits').length === 0 && (
                    <p className="text-muted-foreground text-sm italic pl-4">Nenhuma categoria de benefícios.</p>
                  )}
                </div>
              </div>
            </div>
          </div> /* FIM DA DIV PAI */
        )}
        {/* Banners */}
        {activeTab === "banners" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-4">Gerenciar Banners</h2>
              <div className="space-y-4 rounded-lg border border-border bg-background p-6">
                <div>
                  <label className="block text-sm font-semibold text-foreground">Título</label>
                  <input
                    type="text"
                    value={newBanner.title ?? ""}
                    onChange={(e: any) => setNewBanner({ ...newBanner, title: e.target.value })}
                    className="mt-1 w-full rounded border border-border bg-card px-3 py-2 text-foreground"
                    placeholder="Título do banner"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground">URL da Imagem</label>
                  <input
                    type="text"
                    value={newBanner.imageUrl ?? ""}
                    onChange={(e: any) => setNewBanner({ ...newBanner, imageUrl: e.target.value })}
                    className="mt-1 w-full rounded border border-border bg-card px-3 py-2 text-foreground"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground">Link de Destino (Opcional)</label>
                  <input
                    type="text"
                    value={newBanner.link ?? ""}
                    onChange={(e: any) => setNewBanner({ ...newBanner, link: e.target.value })}
                    className="mt-1 w-full rounded border border-border bg-card px-3 py-2 text-foreground"
                    placeholder="https://sua-loja.com/produto/1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button className="gap-2 bg-primary hover:bg-orange-600 text-black font-semibold" onClick={handleSaveBanner}>
                    <Save className="h-4 w-4" />
                    {editingBannerId ? "Atualizar" : "Criar"}
                  </Button>
                  {editingBannerId && (
                    <Button variant="outline" onClick={() => { setEditingBannerId(null); setNewBanner({}); }}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4">Banners Existentes</h3>
              <div className="grid gap-4">
                {banners.map((banner) => (
                  <div key={banner.id} className="rounded-lg border border-border bg-background p-4 flex flex-col md:flex-row gap-4 items-center">
                    <img src={banner.imageUrl ?? ""} alt={banner.title ?? ""} className="h-20 w-32 object-cover rounded border border-border" />
                    <div className="flex-1 text-center md:text-left">
                      <h4 className="font-semibold text-foreground">{banner.title || "Sem título"}</h4>
                      <p className="text-xs text-muted-foreground truncate max-w-xs">{banner.link || "Sem link"}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveBannerUpMut.mutate({ id: banner.id })}
                        title="Mover para cima"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveBannerDownMut.mutate({ id: banner.id })}
                        title="Mover para baixo"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingBannerId(banner.id);
                          setNewBanner(banner);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => {
                          if (window.confirm("Deseja apagar este banner?")) {
                            deleteBannerMut.mutate({ id: banner.id });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {banners.length === 0 && <p className="text-muted-foreground text-center py-4">Nenhum banner cadastrado.</p>}
              </div>
            </div>
          </div>
        )}

        {/* Pedidos */}
        {activeTab === "orders" && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Pedidos Recentes</h2>
            <div className="grid gap-4">
              {orders.map((order: any) => (
                <div key={order.id} className="rounded-lg border border-border bg-background p-4 hover:border-primary/30 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-foreground text-lg">{order.playerNick}</h4>
                      <p className="text-sm text-primary font-medium">Discord: {order.discord || "Não informado"}</p>
                      {order.discordId && (
                        <p className="text-[10px] text-muted-foreground font-mono">ID: {order.discordId}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                        order.status === "completed" ? "bg-green-500/20 text-green-500" :
                        order.status === "cancelled" ? "bg-red-500/20 text-red-500" :
                        "bg-orange-500/20 text-orange-500"
                      }`}>
                        {order.status === "pending" ? "⏳ Pendente" : order.status}
                      </span>
                      
                      {/* BOTÃO DE APAGAR PEDIDO */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (window.confirm(`VOCÊ DESEJA MESMO APAGAR O PEDIDO DE "${order.playerNick}"?`)) {
                            deleteOrderMut.mutate({ orderId: order.id });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm border-t border-border/50 pt-3 mt-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total do Pedido:</span>
                      <span className="font-bold text-primary">R$ {(order.total ? order.total / 100 : 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">ID do Jogo:</span>
                      <span className="text-foreground">{order.gameId || "N/A"}</span>
                    </div>
                    <p className="text-muted-foreground text-[10px] pt-2">
                      Realizado em: {order.createdAt ? new Date(order.createdAt).toLocaleString("pt-BR") : "N/A"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "config" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Configurações do Site</h2>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Título do Hero</label>
                <input
                  type="text"
                  defaultValue={siteConfig?.heroTitle || ""}
                  onChange={(e: any) => setConfigForm({ ...configForm, heroTitle: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  placeholder="Eleve sua experiência no FiveM"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Subtítulo do Hero</label>
                <input
                  type="text"
                  defaultValue={siteConfig?.heroSubtitle || ""}
                  onChange={(e: any) => setConfigForm({ ...configForm, heroSubtitle: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  placeholder="Bem-vindo à Aura City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Descrição do Hero</label>
                <textarea
                  defaultValue={siteConfig?.heroDescription || ""}
                  onChange={(e: any) => setConfigForm({ ...configForm, heroDescription: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  placeholder="Descubra pacotes VIP, veículos premium..."
                  rows={3}
                />
              </div>
              <Button
                onClick={() => {
                  const dataToSend = {
                    heroTitle: configForm.heroTitle ?? siteConfig?.heroTitle,
                    heroSubtitle: configForm.heroSubtitle ?? siteConfig?.heroSubtitle,
                    heroDescription: configForm.heroDescription ?? siteConfig?.heroDescription,
                  };
                  updateConfigMut.mutate(dataToSend);
                }}
                disabled={updateConfigMut.isPending}
                className="bg-primary hover:bg-orange-600 text-black font-semibold"
              >
                <Save className="mr-2 h-4 w-4" /> Salvar Configurações
              </Button>
            </div>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-orange-500">Console do Servidor</h2>
            <div className="bg-black text-green-400 font-mono p-4 rounded-lg h-96 overflow-y-auto border-2 border-slate-800 shadow-2xl">
              <p className="text-blue-400 mb-2">--- Sistema Aura City Inicializado ---</p>
              {serverLogs && serverLogs.length > 0 ? (
                serverLogs.map((log: any) => (
                  <p key={log.id} className="text-sm mb-1 leading-relaxed">
                    <span className="text-slate-600">[{new Date(log.createdAt).toLocaleTimeString()}]</span> {log.message}
                  </p>
                ))
              ) : (
                <p className="text-slate-500 italic">Aguardando novos eventos do servidor...</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "coupons" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-4 text-foreground">Gerenciar Cupons</h2>
              <div className="grid md:grid-cols-4 gap-4 rounded-lg border border-border bg-card p-6 shadow-md">
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Código</label>
                  <input
                    type="text"
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                    className="w-full rounded border border-border bg-background px-3 py-2 text-foreground focus:border-primary outline-none"
                    placeholder="EX: AURA10"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Tipo</label>
                  <select 
                    value={newCoupon.type}
                    onChange={(e) => setNewCoupon({ ...newCoupon, type: e.target.value as any })}
                    className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none"
                  >
                    <option value="percentage">Porcentagem (%)</option>
                    <option value="fixed">Valor Fixo (R$)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Valor</label>
                  <input
                    type="number"
                    value={newCoupon.value}
                    onChange={(e) => setNewCoupon({ ...newCoupon, value: Number(e.target.value) })}
                    className="w-full rounded border border-border bg-background px-3 py-2 text-foreground focus:border-primary outline-none"
                    placeholder={newCoupon.type === 'percentage' ? "Ex: 25" : "Ex: 1000 (R$10)"}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    className="w-full bg-primary hover:bg-orange-600 text-black font-bold h-10"
                    onClick={() => createCouponMut.mutate(newCoupon)}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Criar Cupom
                  </Button>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 px-1">
                * Valores fixos devem ser informados em centavos. Exemplo: R$ 10,00 = 1000.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4">Cupons Ativos</h3>
              <div className="grid gap-3">
                {coupons.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-4 hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <Ticket className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">{c.code}</h4>
                        <p className="text-xs text-muted-foreground">
                          {c.type === 'percentage' ? `${c.value}% de desconto` : `R$ ${(c.value/100).toFixed(2)} de desconto`}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:bg-destructive/10" 
                      onClick={() => { if(confirm(`Apagar cupom ${c.code}?`)) deleteCouponMut.mutate({ id: c.id }) }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {coupons.length === 0 && <p className="text-muted-foreground text-sm italic">Nenhum cupom cadastrado.</p>}
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Contas Logadas</h2>
            <div className="border border-border rounded p-4 bg-card">
              {storeUsers.filter((u: any) => u.name || u.email).map((u: any) => (
                <div key={u.id} className="border-b border-border/50 py-3 flex justify-between items-center last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{u.name}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setVisibleEmails(prev => ({ ...prev, [u.id]: !prev[u.id] }))}>
                      {visibleEmails[u.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                    <span className="font-mono text-xs text-muted-foreground">{visibleEmails[u.id] ? u.email : "••••@••••.com"}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* FATO TÉCNICO: Exibe a data e hora formatada do Brasil */}
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Último Acesso</p>
                      <p className="text-xs font-mono text-slate-300">
                        {u.lastSignedIn ? new Date(u.lastSignedIn).toLocaleString("pt-BR", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Sem registro"}
                      </p>
                    </div>

                    <span className="text-xs text-muted-foreground font-mono bg-background px-2 py-1 rounded border border-border">
                      {u.discordId}
                    </span>
                    
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => { if (window.confirm(`APAGAR CONTA DE ${u.name}?`)) deleteUserMut.mutate({ id: u.id }); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {storeUsers.length === 0 && <p className="text-center text-muted-foreground py-4">Nenhum jogador encontrado.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
