import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, MapPinOff } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      {/* FATO TÉCNICO: Usamos bg-card e border-border para manter o padrão Dark do site */}
      <Card className="w-full max-w-md shadow-2xl border border-border bg-card/50 backdrop-blur-md overflow-hidden">
        <CardContent className="pt-12 pb-12 text-center space-y-6">
          
          <div className="flex justify-center">
            <div className="relative">
              {/* Efeito de brilho laranja ao fundo do ícone */}
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <MapPinOff className="relative h-20 w-20 text-primary" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-7xl font-black text-primary tracking-tighter">404</h1>
            <h2 className="text-2xl font-bold text-foreground uppercase tracking-tight">
              Localização Inválida
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-[280px] mx-auto">
              Parece que você pegou um beco sem saída. Esta página não existe.
            </p>
          </div>

          <div className="pt-4">
            <Button
              onClick={() => setLocation("/")}
              className="bg-primary hover:bg-orange-600 text-black font-black px-8 py-6 rounded-xl transition-all duration-300 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 gap-2"
            >
              <Home className="w-5 h-5" />
              VOLTAR PARA A LOJA
            </Button>
          </div>

        </CardContent>
      </Card>
      
      {/* Detalhe estético: Marca d'água sutil ao fundo */}
      <div className="fixed bottom-8 text-[100px] font-black text-white/[0.02] pointer-events-none select-none">
        AURA CITY
      </div>
    </div>
  );
}
