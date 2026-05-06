import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Loader2 } from "lucide-react";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("categories");

  // Categorias
  const categoriesQuery = trpc.shop.admin.categories.list.useQuery();
  const createCategoryMutation = trpc.shop.admin.categories.create.useMutation();
  const deleteCategoryMutation = trpc.shop.admin.categories.delete.useMutation();

  // Produtos
  const productsQuery = trpc.shop.admin.products.list.useQuery();
  const deleteProductMutation = trpc.shop.admin.products.delete.useMutation();

  // Banners
  const bannersQuery = trpc.shop.admin.banners.list.useQuery();
  const deleteBannerMutation = trpc.shop.admin.banners.delete.useMutation();

  // Redirecionamento se não for admin
  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  const handleCreateCategory = async () => {
    const name = prompt("Nome da categoria:");
    if (!name) return;

    try {
      await createCategoryMutation.mutateAsync({ name });
      toast.success("Categoria criada com sucesso!");
      categoriesQuery.refetch();
    } catch (error) {
      toast.error("Erro ao criar categoria");
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Tem certeza que deseja deletar esta categoria?")) return;

    try {
      await deleteCategoryMutation.mutateAsync({ id });
      toast.success("Categoria deletada com sucesso!");
      categoriesQuery.refetch();
    } catch (error) {
      toast.error("Erro ao deletar categoria");
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Tem certeza que deseja deletar este produto?")) return;

    try {
      await deleteProductMutation.mutateAsync({ id });
      toast.success("Produto deletado com sucesso!");
      productsQuery.refetch();
    } catch (error) {
      toast.error("Erro ao deletar produto");
    }
  };

  const handleDeleteBanner = async (id: number) => {
    if (!confirm("Tem certeza que deseja deletar este banner?")) return;

    try {
      await deleteBannerMutation.mutateAsync({ id });
      toast.success("Banner deletado com sucesso!");
      bannersQuery.refetch();
    } catch (error) {
      toast.error("Erro ao deletar banner");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Painel Admin</h1>
          <p className="text-muted-foreground">Gerenciar categorias, produtos e banners</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="categories">Categorias</TabsTrigger>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="banners">Banners</TabsTrigger>
          </TabsList>

          {/* Categorias */}
          <TabsContent value="categories" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Gerenciar Categorias</h2>
              <Button onClick={handleCreateCategory} className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Categoria
              </Button>
            </div>

            <div className="grid gap-4">
              {categoriesQuery.data?.map((category: any) => (
                <Card key={category.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle>{category.name}</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/categories/${category.id}`)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Produtos */}
          <TabsContent value="products" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Gerenciar Produtos</h2>
              <Button onClick={() => navigate("/admin/products/new")} className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Produto
              </Button>
            </div>

            <div className="grid gap-4">
              {productsQuery.data?.map((product: any) => (
                <Card key={product.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle>{product.name}</CardTitle>
                      <CardDescription>R$ {(product.price / 100).toFixed(2)}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/products/${product.id}`)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Banners */}
          <TabsContent value="banners" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Gerenciar Banners</h2>
              <Button onClick={() => navigate("/admin/banners/new")} className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Banner
              </Button>
            </div>

            <div className="grid gap-4">
              {bannersQuery.data?.map((banner: any) => (
                <Card key={banner.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle>{banner.title}</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/banners/${banner.id}`)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteBanner(banner.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
