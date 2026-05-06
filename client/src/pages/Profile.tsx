import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2 } from "lucide-react";

export default function Profile() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading, logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getProfileQuery = trpc.auth.getProfile.useQuery(undefined, {
    enabled: false, // Desabilitar query automática
  });
  // Usar logout do hook useAuth em vez de localLogout

  useEffect(() => {
    if (authLoading) return;

    // Se usuário está autenticado via OAuth, usar dados do hook
    if (user) {
      setProfile(user);
      setIsLoading(false);
    } else {
      // Caso contrário, tentar buscar perfil de autenticação local
      getProfileQuery.refetch().then(({ data, error }) => {
        if (data) {
          setProfile(data);
          setIsLoading(false);
        } else if (error) {
          toast.error("Você precisa estar logado para acessar esta página");
          navigate("/login");
        }
      });
    }
  }, [authLoading, user, navigate]);

  const handleLogout = async () => {
    try {
      // Se for autenticação local, chamar localLogout
      if (false) {
        // Usar logout do hook
      } else {
        // Se for OAuth, usar logout do hook
        await logout();
      }
      toast.success("Logout realizado com sucesso!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer logout");
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const createdAt = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("pt-BR")
    : "N/A";
  const lastSignedIn = profile.lastSignedIn
    ? new Date(profile.lastSignedIn).toLocaleDateString("pt-BR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Nunca";

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Meu Perfil</h1>
          <p className="text-muted-foreground">Informações da sua conta</p>
        </div>

        <Card className="bg-card border border-border p-8 shadow-lg">
          <div className="space-y-6">
            {/* Nome */}
            <div className="border-b border-border pb-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Nome</h3>
              <p className="text-lg font-semibold text-foreground">{profile.name}</p>
            </div>

            {/* Email */}
            <div className="border-b border-border pb-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Email</h3>
              <p className="text-lg font-semibold text-foreground">{profile.email}</p>
            </div>

            {/* Game ID */}
            {profile.gameId && (
              <div className="border-b border-border pb-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">ID do Jogador</h3>
                <p className="text-lg font-semibold text-foreground">{profile.gameId}</p>
              </div>
            )}

            {/* Data de Criação */}
            <div className="border-b border-border pb-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Conta Criada em</h3>
              <p className="text-lg font-semibold text-foreground">{createdAt}</p>
            </div>

            {/* Último Login */}
            <div className="pb-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Último Login</h3>
              <p className="text-lg font-semibold text-foreground">{lastSignedIn}</p>
            </div>

            {/* Tipo de Autenticação */}
            <div className="pb-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Tipo de Autenticação</h3>
              <p className="text-lg font-semibold text-foreground">
                {profile.openId ? "Manus OAuth" : "Email/Senha"}
              </p>
            </div>
          </div>

          {/* Ações */}
          <div className="mt-8 flex gap-4">
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="flex-1"
            >
              Voltar à Loja
            </Button>
            <Button
              onClick={() => navigate("/edit-profile")}
              className="flex-1 bg-primary hover:bg-orange-600 text-black font-semibold"
            >
              Editar Perfil
            </Button>
            <Button
              onClick={handleLogout}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              Sair
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
