"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/fetch-api";
import { X, Loader2, CreditCard, Building2, CheckCircle, AlertCircle, ShieldCheck } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationDays: number;
  features: string[];
}

interface Props {
  plan: Plan;
  onClose: () => void;
  /**
   * Returns either:
   *  - { ok: true }                    → ONSITE request registered
   *  - { ok: true, paymentUrl: string } → ONLINE: caller should redirect
   *  - { ok: false }                   → failed, error already toasted by parent
   */
  onSubscribe: (
    planId: string,
    paymentMethod: "ONLINE" | "ONSITE"
  ) => Promise<{ ok: boolean; paymentUrl?: string }>;
}

export default function SubscribeModal({ plan, onClose, onSubscribe }: Props) {
  const [method, setMethod] = useState<"ONLINE" | "ONSITE">("ONLINE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await onSubscribe(plan.id, method);

      if (!result.ok) {
        setError("Impossible de finaliser la demande. Réessayez.");
        return;
      }

      if (method === "ONLINE" && result.paymentUrl) {
        setRedirecting(true);
        window.location.href = result.paymentUrl;
        return;
      }

      setSuccess(true);
      setTimeout(() => onClose(), 1800);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-primary">{plan.name}</h2>
            <p className="text-sm text-muted mt-0.5">
              {plan.price} TND • {plan.durationDays} jours
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {redirecting && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-xl text-[var(--primary)] text-sm animate-fade-in">
            <Loader2 size={16} className="flex-shrink-0 animate-spin" />
            Redirection vers la page de paiement sécurisée...
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-xl text-success text-sm animate-fade-in">
            <CheckCircle size={16} className="flex-shrink-0" />
            Demande enregistrée avec succès
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm animate-fade-in">
            <AlertCircle size={16} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {!success && !redirecting && (
          <>
            <p className="text-sm font-medium text-primary mb-3">Méthode de paiement</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => setMethod("ONLINE")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  method === "ONLINE"
                    ? "border-[var(--primary)] bg-[var(--primary)]/5"
                    : "border-border hover:bg-muted"
                }`}
              >
                <CreditCard
                  size={22}
                  className={method === "ONLINE" ? "text-[var(--primary)]" : "text-muted"}
                />
                <span className="text-sm font-medium text-primary">En ligne</span>
              </button>
              <button
                onClick={() => setMethod("ONSITE")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  method === "ONSITE"
                    ? "border-[var(--primary)] bg-[var(--primary)]/5"
                    : "border-border hover:bg-muted"
                }`}
              >
                <Building2
                  size={22}
                  className={method === "ONSITE" ? "text-[var(--primary)]" : "text-muted"}
                />
                <span className="text-sm font-medium text-primary">À l&apos;accueil</span>
              </button>
            </div>

            <p className="text-xs text-muted mb-6 flex items-start gap-1.5">
              {method === "ONLINE" ? (
                <>
                  <ShieldCheck size={14} className="flex-shrink-0 mt-0.5 text-[var(--primary)]" />
                  Vous serez redirigé vers une page de paiement sécurisée (carte bancaire,
                  e-DINAR ou wallet). Votre abonnement s&apos;active automatiquement dès la
                  confirmation du paiement.
                </>
              ) : (
                "Votre abonnement sera activé par l'équipe après réception du paiement à l'accueil."
              )}
            </p>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-border rounded-xl text-muted hover:bg-muted transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-[var(--primary)] text-white py-2.5 rounded-xl font-medium hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : method === "ONLINE" ? (
                  "Payer maintenant"
                ) : (
                  "Confirmer"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
