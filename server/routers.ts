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
  // Adicionamos "users" ao tipo da aba ativa
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
  
  // NOVA QUERY: Lista de Usuários que logaram (Contas)
  const { data: storeUsers = [] } = trpc.shop.users.list.useQuery(undefined, {
    enabled: true, // Habilitado para quem estiver no admin
  });

  // Mutations
  const createCategoryMut = trpc.shop.admin.categories.create.useMutation({
    onSuccess: () => {
      refetchCategories();
      toast.success("Categoria criada!");
      setNewCategoryName("");
    },
    onError: () => toast.error("Erro ao criar categoria. Verifique as permissões."),
  });

  const deleteCategoryMut = trpc.shop.admin.categories.delete.useMutation({
    onSuccess: () => { refetchCategories(); toast.success("Categoria removida!"); },
  });

  const createProductMut = trpc.shop.admin.products.create.useMutation({
    onSuccess: () => { refetchProducts(); toast.success("Produto criado!"); setNewProduct({}); },
    onError: () => toast.error("Erro ao criar produto"),
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

  // FUNÇÃO DE LOGOUT CORRIGIDA (Limpa Cookies e LocalStorage)
  const handleLogout = async () => {
    try {
      await logout();
      localStorage.clear();
      sessionStorage.clear();
      toast.success("Saindo...");
      setTimeout(() => { window.location.href = "/"; }, 500);
    } catch (e) {
      localStorage.clear();
      window.location.href = "/";
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
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
    <div className="min-h-screen bg-background">
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
              <Home className="h-4 w-4" /> Loja
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-destructive">
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Tabs - Incluindo Usuários */}
        <div className="flex gap-2 border-b border-border mb-8 overflow-x-auto">
          {(["products", "categories", "banners", "orders", "config", "users"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-semibold text-sm transition whitespace-nowrap ${
                activeTab === tab ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "users" ? "Contas Logadas" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* ABA DE USUÁRIOS (CONTAS) */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Jogadores Registrados</h2>
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted text-muted-foreground font-medium border-b border-border">
                  <tr>
                    <th className="p-4">Nome/Discord</th>
                    <th className="p-4">E-mail</th>
                    <th className="p-4">Método</th>
                    <th className="p-4">Discord ID</th>
                    <th className="p-4">Último Acesso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {storeUsers.map((u: any) => (
                    <tr key={u.id} className="hover:bg-muted/50 transition">
                      <td className="p-4 font-semibold">{u.name}</td>
                      <td className="p-4">{u.email || "N/A"}</td>
                      <td className="p-4 uppercase text-xs font-bold text-primary">{u.loginMethod}</td>
                      <td className="p-4 text-muted-foreground">{u.discordId || "N/A"}</td>
                      <td className="p-4 text-xs text-muted-foreground">
                        {u.lastSignedIn ? new Date(u.lastSignedIn).toLocaleString("pt-BR") : "Nunca"}
                      </td>
                    </tr>
                  ))}
                  {storeUsers.length === 0 && (
                    <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">Nenhum jogador logou ainda.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ... (Manter o código de Produtos, Categorias, Banners, Pedidos e Config igual ao que você já tem abaixo) ... */}
        {activeTab === "products" && (
          <div className="space-y-8">
             {/* O conteúdo de produtos que você já tem... */}
             <div className="bg-card p-6 rounded-lg border border-border">
                <h3 className="text-lg font-bold mb-4 text-primary">Dica de Especialista</h3>
                <p className="text-sm text-muted-foreground">Agora você pode gerenciar seus produtos e ver quem está acessando sua loja na aba de Contas.</p>
             </div>
             {/* Aqui continua o seu código original de produtos... */}
          </div>
        )}
        
        {/* Adicione o restante do seu código original (Categorias, Banners, etc) aqui para baixo */}
      </div>
    </div>
  );
}
