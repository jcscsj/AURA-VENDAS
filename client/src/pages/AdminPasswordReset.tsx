import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export default function AdminPasswordReset() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetKey, setResetKey] = useState("");
  const [loading, setLoading] = useState(false);

  const resetPasswordMutation = trpc.auth.resetAdminPassword.useMutation();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await resetPasswordMutation.mutateAsync({
        email,
        newPassword,
        resetKey,
      });
      
      if (result.success) {
        toast.success("Senha resetada com sucesso! Faça login novamente.");
        setTimeout(() => navigate("/admin-login"), 2000);
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao resetar senha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Resetar Senha do Admin</CardTitle>
          <CardDescription>
            Use esta página para resetar a senha de admin se tiver problemas de login
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Nova Senha</label>
              <Input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Chave de Reset</label>
              <Input
                type="password"
                placeholder="Chave de reset"
                value={resetKey}
                onChange={(e) => setResetKey(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Chave: AURACITY_RESET_2026
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Resetando..." : "Resetar Senha"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => navigate("/admin-login")}
            >
              Voltar ao Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
