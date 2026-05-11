import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function Login() {
  const [, navigate] = useLocation();

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
            {/* ÍCONE DISCORD OFICIAL E BLINDADO */}
            <svg 
              viewBox="0 0 256 199" 
              xmlns="http://www.w3.org/2000/svg" 
              className="w-8 h-7 flex-shrink-0"
              fill="currentColor"
            >
              <path d="M216.856 16.597C196.012 7.019 173.741 0 150.273 0c-2.915 5.197-6.222 11.831-8.483 17.39-24.966-3.714-49.626-3.714-74.073 0-2.261-5.559-5.642-12.193-8.587-17.39-23.442 0-45.713 7.019-66.583 16.597C-10.026 51.986-1.574 125.753 18.333 158.463c13.256 9.877 46.108 30.647 78.435 40.536 3.109-4.226 5.86-8.775 8.163-13.627-11.264-4.238-21.91-9.527-31.782-15.787 2.658-1.944 5.215-3.993 7.625-6.14 63.818 29.356 133.526 29.356 196.536 0 2.41 2.147 4.967 4.196 7.625 6.14-9.872 6.26-20.518 11.549-31.782 15.787 2.303 4.852 5.054 9.401 8.163 13.627 32.327-9.889 65.179-30.659 78.435-40.536 24.368-45.02 18.06-118.803-2.613-141.866zM86.79 135.794c-15.21 0-27.753-13.918-27.753-31.066s12.222-31.066 27.753-31.066c15.65 0 28.01 14.041 27.753 31.066-.257 17.148-12.223 31.066-27.753 31.066zm106.42 0c-15.21 0-27.753-13.918-27.753-31.066s12.222-31.066 27.753-31.066c15.65 0 28.01 14.041 27.753 31.066-.257 17.148-12.223 31.066-27.753 31.066z" />
            </svg>
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
