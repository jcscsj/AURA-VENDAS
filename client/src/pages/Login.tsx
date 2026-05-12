import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Login() {
  const [, navigate] = useLocation();
  // FATO TÉCNICO: Puxamos os dados para saber se o cara já está logado
  const { isAuthenticated, loading } = useAuth();

  // FATO TÉCNICO: O vigilante confere o login e te expulsa se você já entrou
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) return null; // Não mostra nada enquanto o site decide se você fica ou sai

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative">
      {/* Botão de Voltar com navegação SPA */}
      <Button 
        variant="ghost" 
        className="absolute top-8 left-8 text-muted-foreground hover:text-primary transition-colors"
        onClick={() => navigate("/")}
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Voltar para a loja
      </Button>

      <div className="w-full max-w-md space-y-8 bg-card p-10 rounded-[2rem] border border-border shadow-2xl">
        <div className="text-center space-y-4">
          {/* Logo Centralizada e com Sombra */}
          <img 
            src="/logo.webp" 
            alt="Aura City" 
            className="h-24 w-24 mx-auto mb-2 object-contain drop-shadow-[0_0_15px_rgba(255,125,0,0.3)]" 
          />
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase">Aura City</h1>
            <p className="text-muted-foreground text-sm font-medium">
              Vincule seu Discord para comprar e gerenciar pedidos.
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <Button
            className="w-full flex items-center justify-center gap-4 bg-[#5865F2] hover:bg-[#4752C4] text-white py-8 text-xl font-black transition-all shadow-lg shadow-[#5865F2]/20 active:scale-95 rounded-2xl"
            onClick={() => window.location.href = getLoginUrl()}
          >
            {/* LOGO EM WEBP - VINDO DA PASTA PUBLIC */}
            <img 
              src="/discord-logo.webp" 
              alt="Discord" 
              className="w-8 h-8 object-contain flex-shrink-0" 
            />
            ENTRAR COM DISCORD
          </Button>
        </div>

        <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
          <p className="text-center text-[10px] text-muted-foreground leading-relaxed uppercase font-bold tracking-tight">
            A Aura City não armazena sua senha. <br />
            O acesso é feito via protocolo OAuth2.
          </p>
        </div>
      </div>
    </div>
  );
}
