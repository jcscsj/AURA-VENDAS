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
  Users,
} from "lucide-react";

export default function Admin() {
  const { user, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"products" | "categories" | "banners" | "orders" | "config" | "users">("products");

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
    enabled: user?.role === "admin",
  });
  const { data: siteConfig, refetch: refetchConfig } = trpc.shop.admin.config.get.useQuery();
  
  // NOVA QUERY: Lista de Usuários que logaram
  const { data: storeUsers = [] } = trpc.shop.users.list.useQuery(undefined, {
    enabled: true,
  });

  // Mutations
  const createCategoryMut = trpc.shop.admin.categories.create.useMutation({
    onSuccess: () => { refetchCategories(); toast.success("Categoria criada!"); setNewCategoryName(""); },
    onError: () => toast.error("Erro ao criar categoria. Verifique o routers.ts."),
  });

  const deleteCategoryMut = trpc.shop.admin.categories.delete.useMutation({
    onSuccess: () => { refetchCategories(); toast.success("Categoria removida!"); },
  });

  const createProductMut = trpc.shop.admin.products.create.useMutation({
    onSuccess: () => { refetchProducts(); toast.success("Produto criado!"); setNewProduct({}); },
  });

  const updateProductMut = trpc.shop.admin.products.update.useMutation({
    onSuccess: () => { refetchProducts(); toast.success("Produto atualizado!"); setEditingProductId(null); },
  });

  const deleteProductMut = trpc.shop.admin.products.delete.useMutation({
    onSuccess: () => { refetchProducts(); toast.success("Produto removido!"); },
  });

  const updateConfigMut = trpc.shop.admin.config.update.useMutation({
    onSuccess: () => { refetchConfig(); toast.success("Configurações atualizadas!"); },
  });

  // Local state
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newProduct, setNewProduct] = useState<any>({});
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [newBanner, setNewBanner] = useState<any>({});
  const [editingBannerId, setEditingBannerId] = useState<number | null>(null);

  // LOGOUT DEFINITIVO
  const handleLogout = async () => {
    try {
      await logout();
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/";
    } catch (e) {
      localStorage.clear();
      window.location.href = "/";
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen text-white">Carregando...</div>;
  if (!user || user.role !== "admin") return null;

  const handleSaveProduct = () => {
    if (!newProduct.name || !newProduct.categoryId || !newProduct.price) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    const productData = { ...newProduct, benefits: newProduct.benefits || [] };
    if (editingProductId) updateProductMut.mutate({ id: editingProductId, ...productData });
    else createProductMut.mutate(productData);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/manus-storage/aura-city-logo_1da7d4d4.png" alt="Logo" className="h-10 w-10 object-contain" />
            <div>
              <h1 className="text-xl font-bold">Aura City</h1>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest text-primary">Admin</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/")} className="gap-2 border-primary text-primary">
              <Home className="h-4 w-4" /> Loja
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-destructive hover:bg-destructive/10">
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Tabs de Navegação */}
        <div className="flex gap-2 border-b border-border mb-8 overflow-x-auto pb-1">
          {(["products", "categories", "banners", "orders", "config", "users"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-semibold text-sm transition whitespace-nowrap border-b-2 ${
                activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "users" ? "Contas Logadas" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* ABA DE USUÁRIOS */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Jogadores na Loja</h2>
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted text-muted-foreground border-b border-border">
                  <tr>
                    <th className="p-4">Nome Discord</th>
                    <th className="p-4">E-mail</th>
                    <th className="p-4">Discord ID</th>
                    <th className="p-4">Último Acesso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {storeUsers.map((u: any) => (
                    <tr key={u.id} className="hover:bg-muted/50 transition">
                      <td className="p-4 font-semibold">{u.name}</td>
                      <td className="p-4">{u.email || "N/A"}</td>
                      <td className="p-4 text-muted-foreground">{u.discordId || "N/A"}</td>
                      <td className="p-4 text-xs">
                        {u.lastSignedIn ? new Date(u.lastSignedIn).toLocaleString("pt-BR") : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PRODUTOS */}
        {activeTab === "products" && (
          <div className="space-y-8">
            <div className="space-y-4 rounded-lg border border-border bg-card p-6">
                <h2 className="text-xl font-bold">Adicionar Produto</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    <input type="text" placeholder="Nome" value={newProduct.name || ""} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="bg-background border border-border p-2 rounded" />
                    <select value={newProduct.categoryId || ""} onChange={e => setNewProduct({...newProduct, categoryId: Number(e.target.value)})} className="bg-background border border-border p-2 rounded">
                        <option value="">Categoria</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <input type="number" placeholder="Preço (Centavos)" value={newProduct.price || ""} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} className="bg-background border border-border p-2 rounded" />
                    <input type="text" placeholder="URL Imagem" value={newProduct.image || ""} onChange={e => setNewProduct({...newProduct, image: e.target.value})} className="bg-background border border-border p-2 rounded" />
                </div>
                <Button onClick={handleSaveProduct} className="bg-primary text-black font-bold">Salvar Produto</Button>
            </div>
            <div className="grid gap-4">
                {products.map(p => (
                    <div key={p.id} className="p-4 border border-border bg-card rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-bold">{p.name}</p>
                            <p className="text-xs text-muted-foreground">R$ {(p.price/100).toFixed(2)}</p>
                        </div>
                        <Button variant="ghost" onClick={() => deleteProductMut.mutate({id: p.id})} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                ))}
            </div>
          </div>
        )}

        {/* CATEGORIAS */}
        {activeTab === "categories" && (
          <div className="space-y-8">
            <div className="flex gap-2 p-6 border border-border bg-card rounded-lg">
                <input type="text" placeholder="Nova Categoria" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="flex-1 bg-background border border-border p-2 rounded" />
                <Button onClick={() => createCategoryMut.mutate({name: newCategoryName})} className="bg-primary text-black font-bold">Criar</Button>
            </div>
            <div className="grid gap-2">
                {categories.map(c => (
                    <div key={c.id} className="p-3 border border-border bg-card rounded flex justify-between items-center">
                        <span>{c.name}</span>
                        <Button variant="ghost" onClick={() => deleteCategoryMut.mutate({id: c.id})} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                ))}
            </div>
          </div>
        )}

        {/* PEDIDOS */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Pedidos Recentes</h2>
            <div className="grid gap-4">
              {orders.map((o: any) => (
                <div key={o.id} className="p-4 border border-border bg-card rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-bold">{o.playerNick}</p>
                    <p className="text-sm text-muted-foreground">Status: {o.status}</p>
                  </div>
                  <p className="font-bold text-primary">R$ {(o.total/100).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CONFIGURAÇÕES */}
        {activeTab === "config" && (
          <div className="p-6 border border-border bg-card rounded-lg">
            <h2 className="text-xl font-bold mb-4">Configurações Gerais</h2>
            <p className="text-muted-foreground mb-4">Ajuste os textos da página inicial.</p>
            <Button onClick={() => updateConfigMut.mutate(siteConfig)} className="bg-primary text-black font-bold">Salvar Mudanças</Button>
          </div>
        )}
      </div>
    </div>
  );
}
