import { Button } from "@/components/ui/button";
import { ChevronLeft, ScrollText, ShieldAlert, Zap, RotateCcw } from "lucide-react";
import { useLocation } from "wouter";

export default function TermsPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <header className="container mx-auto py-8 flex items-center gap-4 border-b border-border mb-10">
        <Button variant="ghost" onClick={() => navigate("/")} className="text-primary hover:bg-primary/10">
          <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ScrollText className="text-primary w-6 h-6" /> Termos e Condições
        </h1>
      </header>

      <main className="container mx-auto max-w-3xl space-y-12">
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-primary uppercase tracking-wider">1. Aceitação dos Termos</h2>
          <p className="text-muted-foreground leading-relaxed">
            Ao realizar uma compra na loja oficial da <strong>Aura City</strong>, você concorda automaticamente com todas as regras aqui listadas. A não leitura destes termos não o isenta de suas responsabilidades.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-primary uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-5 h-5" /> 2. Entrega de Produtos
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Nossos produtos são digitais. A entrega ocorre de forma automática ou via suporte no Discord após a confirmação do pagamento. O tempo de processamento pode variar de acordo com o método de pagamento escolhido (Pix é imediato).
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-primary uppercase tracking-wider flex items-center gap-2">
            <RotateCcw className="w-5 h-5" /> 3. Reembolsos e Devoluções
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Por se tratar de bens digitais e de consumo imediato, <strong>não efetuamos reembolsos</strong> após o item ter sido entregue ou o VIP ter sido ativado, exceto em casos de erro comprovado no sistema da loja.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-primary uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" /> 4. Banimentos e Conduta
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            O porte de um plano VIP ou Veículo Premium não concede imunidade às regras do servidor. Caso o usuário seja banido por descumprimento das regras de Roleplay, os benefícios <strong>não serão reembolsados</strong> nem transferidos para outras contas.
          </p>
        </section>

        <div className="p-6 bg-card border border-border rounded-2xl text-center">
          <p className="text-sm text-muted-foreground">
            Dúvidas? Entre em contato com nossa equipe através do nosso{" "}
            <a 
              href="https://discord.gg/auracity" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary font-bold hover:underline transition-all"
            >
              Discord
            </a>{" "}
            oficial.
          </p>
        </div>
      </main>
    </div>
  );
}
