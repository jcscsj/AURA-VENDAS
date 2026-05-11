import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function Login() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Botão de Voltar */}
      <Button 
        variant="ghost" 
        className="absolute top-4 left-4 text-muted-foreground hover:text-primary"
        onClick={() => navigate("/")}
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Voltar para a loja
      </Button>

      <div className="text-center space-y-2">
          {/* FATO TÉCNICO: Mudamos o SRC para a pasta public e ajustamos o tamanho para consistência */}
          <img 
            src="/logo-home.webp" 
            alt="Aura City" 
            className="h-20 w-20 mx-auto mb-4 object-contain drop-shadow-lg" 
          />
          <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase tracking-widest">Aura City</h1>
          <p className="text-muted-foreground text-sm">
            Vincule sua conta para acessar produtos exclusivos.
          </p>
        </div>

        <div className="space-y-4">
          <Button
            className="w-full flex items-center justify-center gap-4 bg-[#5865F2] hover:bg-[#4752C4] text-white py-8 text-xl font-black transition-all shadow-lg shadow-[#5865F2]/20 active:scale-95"
            onClick={() => window.location.href = getLoginUrl()}
          >
            {/* ÍCONE DISCORD BLINDADO */}
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.515.069.069 0 0 0-.032.027C.533 9.048-.32 13.58 1.105 18.057a.082.082 0 0 0 .031.056 19.909 19.909 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.046 14.046 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993.023.032.057.046.09.028a19.836 19.836 0 0 0 6.002-3.03.085.085 0 0 0 .032-.054c1.614-5.11 1.052-9.604-1.076-13.684a.068.068 0 0 0-.032-.028z"/>
            </svg>
            Entrar com Discord
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          A Aura City não armazena sua senha do Discord. 
          O acesso é feito de forma segura via OAuth2.
        </p>
      </div>
    </div>
  );
}
