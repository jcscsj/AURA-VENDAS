import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useState } from "react";
import {
  Trash2,
  Plus,
  Save,
  LogOut,
  Home,
  Edit2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

export default function Admin() {
  const { user, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"products" | "categories" | "banners" | "orders" | "config" | "users" | "logs">("products");

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
  const { data: storeUsers = [], refetch: refetchUsers } = trpc.shop.users.list.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: serverLogs = [] } = trpc.shop.admin.logs.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: siteConfig, refetch: refetchConfig } = trpc.shop.admin.config.get.useQuery();

  // Mutations
  const createCategoryMut = trpc.shop.admin.categories.create.useMutation({
    onSuccess: () => {
      refetchCategories();
      toast.success("Categoria criada!");
      setNewCategoryName("");
    },
    onError: () => toast.error("Erro ao criar categoria"),
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

  const updateConfigMut = trpc.shop.admin.config.update.useMutation({
    onSuccess: () => {
      refetchConfig();
      toast.success("Configurações atualizadas!");
    },
    onError: () => toast.error("Erro ao atualizar configurações"),
  });

  // Local state
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newProduct, setNewProduct] = useState<any>({});
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [newBanner, setNewBanner] = useState<any>({});
  const [editingBannerId, setEditingBannerId] = useState<number | null>(null);

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
            <img src="/manus-storage/aura-city-logo_1da7d4d4.png" alt="Aura City" className="h-10 w-10 object-contain" />
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
          {(["products", "categories", "banners", "orders", "config", "users", "logs"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-semibold text-sm transition ${
                activeTab === tab
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
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
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="mt-1 w-full rounded border border-border bg-card px-3 py-2 text-foreground"
                    placeholder="Nome do produto"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground">Categoria</label>
                  <select
                    value={newProduct.categoryId || ""}
                    onChange={(e) => setNewProduct({ ...newProduct, categoryId: Number(e.target.value) })}
                    className="mt-1 w-full rounded border border-border bg-card px-3 py-2 text-foreground"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map((cat) => (
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
                    onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                    className="mt-1 w-full rounded border border-border bg-card px-3 py-2 text-foreground"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground">Preço Antigo (opcional)</label>
                  <input
                    type="number"
                    value={newProduct.oldPrice || 0}
                    onChange={(e) => setNewProduct({ ...newProduct, oldPrice: e.target.value ? Number(e.target.value) : undefined })}
                    className="mt-1 w-full rounded border border-border bg-card px-3 py-2 text-foreground"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground">URL da Imagem</label>
                  <input
                    type="text"
                    value={newProduct.image || ""}
                    onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
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
                {products.map((product) => (
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
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-4">Gerenciar Categorias</h2>
              <div className="flex gap-2 rounded-lg border border-border bg-background p-4">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 rounded border border-border bg-card px-3 py-2 text-foreground"
                  placeholder="Nome da categoria"
                />
                <Button className="gap-2 bg-primary hover:bg-orange-600 text-black font-semibold" onClick={() => {
                  if (newCategoryName.trim()) {
                    createCategoryMut.mutate({ name: newCategoryName });
                  }
                }}>
                  <Plus className="h-4 w-4" />
                  Adicionar
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4">Categorias Existentes</h3>
              <div className="grid gap-3">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
                    <h4 className="font-semibold text-foreground">{category.name}</h4>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveCategoryUpMut.mutate({ id: category.id })}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveCategoryDownMut.mutate({ id: category.id })}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => deleteCategoryMut.mutate({ id: category.id })}
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
                      onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                      className="mt-1 w-full rounded border border-border bg-card px-3 py-2 text-foreground"
                      placeholder="Título do banner"
                    />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground">URL da Imagem</label>
                  <input
                    type="text"
                    value={newBanner.imageUrl ?? ""}
                    onChange={(e) => setNewBanner({ ...newBanner, imageUrl: e.target.value })}
                    className="mt-1 w-full rounded border border-border bg-card px-3 py-2 text-foreground"
                    placeholder="https://..."
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
                  <div key={banner.id} className="rounded-lg border border-border bg-background p-4">
                    <img src={banner.imageUrl ?? ""} alt={banner.title ?? ""} className="h-32 w-full object-cover rounded mb-3" />
                    <h4 className="font-semibold text-foreground mb-2">{banner.title ?? ""}</h4>
                    <div className="flex gap-2">
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
                        onClick={() => deleteBannerMut.mutate({ id: banner.id })}
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

        {/* Pedidos */}
        {activeTab === "orders" && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Pedidos Recentes</h2>
            <div className="grid gap-4">
              {orders.map((order) => (
                <div key={order.id} className="rounded-lg border border-border bg-background p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-foreground">{order.playerNick}</h4>
                      <p className="text-sm text-muted-foreground">Discord: {order.discord || "N/A"}</p>
                    </div>
                    <span className={`px-3 py-1 rounded text-sm font-semibold ${
                      order.status === "completed" ? "bg-green-500/20 text-green-700" :
                      order.status === "cancelled" ? "bg-red-500/20 text-red-700" :
                      "bg-yellow-500/20 text-yellow-700"
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><strong>Total:</strong> R$ {(order.total ? order.total / 100 : 0).toFixed(2)}</p>
                    <p><strong>Itens:</strong> {order.items?.length || 0}</p>
                    <p className="text-muted-foreground text-xs">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString("pt-BR") : "N/A"}
                    </p>
                  </div>
                </div>
              ))}
             </div>
          </div>
        )}

        {activeTab === "config" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Configurações do Site</h2>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Título do Hero</label>
                <input
                  type="text"
                  defaultValue={siteConfig?.heroTitle || ""}
                  onChange={(e) => setNewBanner({ ...newBanner, heroTitle: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  placeholder="Eleve sua experiência no FiveM"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Subtítulo do Hero</label>
                <input
                  type="text"
                  defaultValue={siteConfig?.heroSubtitle || ""}
                  onChange={(e) => setNewBanner({ ...newBanner, heroSubtitle: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  placeholder="Bem-vindo à Aura City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Descrição do Hero</label>
                <textarea
                  defaultValue={siteConfig?.heroDescription || ""}
                  onChange={(e) => setNewBanner({ ...newBanner, heroDescription: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  placeholder="Descubra pacotes VIP, veículos premium..."
                  rows={3}
                />
              </div>
              <Button
                onClick={() => updateConfigMut.mutate(newBanner)}
                disabled={updateConfigMut.isPending}
                className="bg-primary hover:bg-orange-600 text-black font-semibold"
              >
                <Save className="mr-2 h-4 w-4" />
                Salvar Configurações
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
                    <span className="text-slate-600">[{new Date(log.createdAt).toLocaleTimeString()}]</span> 
                    <span className={log.type === 'error' ? 'text-red-500' : 'text-green-500'}> [{log.type?.toUpperCase()}]</span> {log.message}
                  </p>
                ))
              ) : (
                <p className="text-slate-500 italic">Aguardando novos eventos do servidor...</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Contas Logadas</h2>
            <div className="border border-border rounded p-4">
              {storeUsers.map((u: any) => (
                <div key={u.id} className="border-b py-2 flex justify-between items-center last:border-0">
                  <span>{u.name} - {u.email || "Sem e-mail"}</span>
                  <span className="text-xs text-muted-foreground font-mono">{u.discordId || "Sem ID"}</span>
                </div>
              ))}
              {storeUsers.length === 0 && <p className="text-center text-muted-foreground">Nenhum jogador logado ainda.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
