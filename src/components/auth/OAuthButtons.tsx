import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable";

type Provider = "google" | "apple";

async function oauth(provider: Provider) {
  const result = await lovable.auth.signInWithOAuth(provider, {
    redirect_uri: window.location.origin,
  });
  if (result.error) {
    toast.error("Não foi possível iniciar o login social.");
    return;
  }
  if (result.redirected) return;
  window.location.href = "/";
}

export function OAuthButtons() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button variant="outline" onClick={() => oauth("google")}>
        Google
      </Button>
      <Button variant="outline" onClick={() => oauth("apple")}>
        Apple
      </Button>
    </div>
  );
}
