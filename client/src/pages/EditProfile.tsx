import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2, Upload } from "lucide-react";

export default function EditProfile() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    gameId: "",
    characterName: "",
    profilePicture: "",
  });

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      toast.error("Você precisa estar logado para editar seu perfil");
      navigate("/login");
      return;
    }

    setFormData({
      name: user.name || "",
      gameId: user.gameId || "",
      characterName: user.characterName || "",
      profilePicture: user.profilePicture || "",
    });
  }, [authLoading, user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Aqui você poderia fazer upload para S3 ou outro serviço
      // Por enquanto, vamos usar uma URL local
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData((prev) => ({
          ...prev,
          profilePicture: event.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const updateProfileMutation = trpc.auth.updateProfile.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    setIsLoading(true);
    try {
      await updateProfileMutation.mutateAsync({
        name: formData.name,
        gameId: formData.gameId,
        characterName: formData.characterName,
        profilePicture: formData.profilePicture,
      });
      toast.success("Perfil atualizado com sucesso!");
      navigate("/profile");
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar perfil");
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Editar Perfil</h1>
          <p className="text-muted-foreground">Atualize suas informações de perfil</p>
        </div>

        <Card className="bg-card border border-border p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Foto de Perfil */}
            <div className="flex flex-col items-center gap-4">
              {formData.profilePicture && (
                <img
                  src={formData.profilePicture}
                  alt="Foto de Perfil"
                  className="w-24 h-24 rounded-full object-cover border-2 border-primary"
                />
              )}
              <label className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-orange-600 text-black font-semibold rounded-lg cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                Alterar Foto
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Nome Completo
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Seu nome completo"
              />
            </div>

            {/* ID do Jogo */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                ID do Jogo (FiveM)
              </label>
              <input
                type="text"
                name="gameId"
                value={formData.gameId}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Seu ID no servidor FiveM"
              />
            </div>

            {/* Nome do Personagem */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Nome do Personagem
              </label>
              <input
                type="text"
                name="characterName"
                value={formData.characterName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Nome do seu personagem no jogo"
              />
            </div>

            {/* Botões */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                onClick={() => navigate("/profile")}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-primary hover:bg-orange-600 text-black font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
