import { loadStripe, type Stripe } from "@stripe/stripe-js";

export type StripeEnv = "sandbox" | "live";

const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN;

export function getStripeEnvironment(): StripeEnv {
  if (typeof clientToken === "string" && clientToken.startsWith("pk_test_")) return "sandbox";
  if (typeof clientToken === "string" && clientToken.startsWith("pk_live_")) return "live";
  throw new Error(
    "Pagamentos ainda não estão configurados neste build. Conclua o go-live do Stripe no painel Lovable para receber pagamentos reais.",
  );
}

let stripePromise: Promise<Stripe | null> | null = null;
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    getStripeEnvironment();
    stripePromise = loadStripe(clientToken as string);
  }
  return stripePromise;
}

export function isPaymentsConfigured(): boolean {
  return (
    typeof clientToken === "string" &&
    (clientToken.startsWith("pk_test_") || clientToken.startsWith("pk_live_"))
  );
}
