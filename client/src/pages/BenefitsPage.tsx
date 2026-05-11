import { Button } from "@/components/ui/button";
import { ChevronLeft, CheckCircle2, Star, Shield, Zap, Clock, Trophy } from "lucide-react";
import { useLocation } from "wouter";

const BENEFITS = [
  { title: "Entrega Rápida", desc: "Receba seus itens automaticamente no jogo após a confirmação.", icon: <Zap className="w-8 h-8 text-orange-500" /> },
  { title: "100% Seguro", desc: "Processamento de dados criptografado e pagamentos protegidos.", icon: <Shield className="w-8 h-8 text-orange-500" /> },
  { title: "Suporte 24/7", desc: "Nossa equipe está sempre online para tirar suas dúvidas no Discord.", icon: <Clock className="w-8 h-8 text-orange-500" /> },
  { title: "Qualidade Premium", desc: "Veículos e VIPS testados e otimizados para não pesar no seu PC.", icon: <Star className="w-8 h-8 text-orange-500" /> },
  { title: "Vantagens Exclusivas", desc: "Acesso a áreas vips e comandos especiais dentro da Aura City.", icon: <Trophy className="w-8 h-8 text-orange-500" /> },
  { title: "Garantia de Satisfação", desc: "Seu benefício entregue ou seu dinheiro de volta.", icon: <CheckCircle2 className="w-8 h-8 text-orange-500" /> },
];

export default function BenefitsPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header Simples */}
      <nav className="border-b border-border bg-card p-4">
        <div className="container mx-auto flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Voltar à Loja
          </Button>
          <h1 className="text-xl font-bold text-primary">Nossos Benefícios</h1>
        </div>
      </nav>

      <main className="container mx-auto py-16 px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl font-bold mb-4">Por que comprar na Aura City?</h2>
          <p className="text-muted-foreground">Oferecemos a melhor experiência de compra para jogadores de FiveM, com foco em rapidez e segurança total.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b, i) => (
            <div key={i} className="p-8 rounded-2xl border border-border bg-card hover:border-primary/50 transition-all shadow-lg group">
              <div className="mb-4 transform group-hover:scale-110 transition-transform">
                {b.icon}
              </div>
              <h3 className="text-xl font-bold mb-2">{b.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
