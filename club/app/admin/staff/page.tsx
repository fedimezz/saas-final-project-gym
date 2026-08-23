"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2, UserPlus, Trash2, Edit, ShieldCheck, ShieldAlert,
  Ban, UserCheck, X, Save, Lock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// This page manages ADMIN/OWNER accounts — distinct from /admin/members,
// which only ever touches MEMBER accounts. The backing API
// (/api/admin/staff) is already Owner-only server-side; this page adds the
// same boundary client-side so an Admin account never even sees the form.

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "ADMIN" | "OWNER";
  isActive: boolean;
  createdAt: string;
}

function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg border text-sm font-medium animate-fade-in max-w-sm ${
        type === "success"
          ? "bg-card border-green-500/30 text-green-600 dark:text-green-400"
          : "bg-card border-red-500/30 text-red-600 dark:text-red-400"
      }`}
    >
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100">✕</button>
    </div>
  );
}

export default function StaffPage() {
  const { userRole, user: currentUser } = useAuth();
  const isOwner = userRole?.toUpperCase() === "OWNER";

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [deleting, setDeleting] = useState<StaffMember | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role: "ADMIN" as "ADMIN" | "OWNER" });

  const showToast = useCallback((message: string, type: "success" | "error") => setToast({ message, type }), []);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/staff", { credentials: "include" });
      const data = await res.json();
      if (res.ok) setStaff(data);
      else showToast(data.error || "Erreur de chargement", "error");
    } catch {
      showToast("Erreur serveur", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (isOwner) fetchStaff();
    else setLoading(false);
  }, [isOwner, fetchStaff]);

  const openCreate = () => {
    setForm({ name: "", email: "", phone: "", password: "", role: "ADMIN" });
    setShowCreate(true);
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim() || form.password.length < 6) {
      showToast("Nom, email et mot de passe (6+ caractères) requis", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Membre du personnel créé", "success");
        setShowCreate(false);
        fetchStaff();
      } else {
        showToast(data.error || "Erreur", "error");
      }
    } catch {
      showToast("Erreur serveur", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (member: StaffMember, patch: Partial<{ role: "ADMIN" | "OWNER"; isActive: boolean }>) => {
    try {
      const res = await fetch(`/api/admin/staff/${member.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (res.ok) {
        setStaff((prev) => prev.map((s) => (s.id === member.id ? { ...s, ...data } : s)));
        showToast("Mis à jour", "success");
      } else {
        showToast(data.error || "Erreur", "error");
      }
    } catch {
      showToast("Erreur serveur", "error");
    }
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/staff/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: editing.name, phone: editing.phone ?? "" }),
      });
      const data = await res.json();
      if (res.ok) {
        setStaff((prev) => prev.map((s) => (s.id === editing.id ? { ...s, ...data } : s)));
        showToast("Profil mis à jour", "success");
        setEditing(null);
      } else {
        showToast(data.error || "Erreur", "error");
      }
    } catch {
      showToast("Erreur serveur", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/staff/${deleting.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setStaff((prev) => prev.filter((s) => s.id !== deleting.id));
        showToast("Compte supprimé", "success");
        setDeleting(null);
      } else {
        showToast(data.error || "Erreur", "error");
      }
    } catch {
      showToast("Erreur serveur", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Owner-only gate ──
  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
          <Lock size={28} className="text-amber-500" />
        </div>
        <div>
          <p className="font-semibold text-primary">Réservé au propriétaire</p>
          <p className="text-sm text-muted mt-1">
            La gestion des comptes administrateurs n&apos;est accessible qu&apos;au rôle OWNER.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Administrateurs</h1>
          <p className="text-muted mt-1">Gère les comptes ayant accès au tableau de bord admin.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white rounded-xl hover:bg-[var(--primary-dark)] transition-colors text-sm font-medium"
        >
          <UserPlus size={16} /> Ajouter un admin
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-[var(--primary)]" />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs text-muted uppercase">
                <tr>
                  <th className="px-5 py-3 font-medium">Nom</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Rôle</th>
                  <th className="px-5 py-3 font-medium">Statut</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => {
                  const isSelf = s.id === currentUser?.id;
                  return (
                    <tr key={s.id} className="border-t border-border">
                      <td className="px-5 py-3 font-medium text-primary">{s.name}</td>
                      <td className="px-5 py-3 text-muted">{s.email}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            s.role === "OWNER"
                              ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                              : "bg-blue-500/10 text-blue-600"
                          }`}
                        >
                          <ShieldCheck size={12} /> {s.role}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-medium ${s.isActive ? "text-emerald-600" : "text-red-500"}`}>
                          {s.isActive ? "Actif" : "Désactivé"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setEditing(s)} title="Modifier" className="p-1.5 rounded-lg hover:bg-[var(--primary)]/10">
                            <Edit size={15} className="text-[var(--primary)]" />
                          </button>
                          {!isSelf && (
                            <>
                              {s.isActive ? (
                                <button onClick={() => handleUpdate(s, { isActive: false })} title="Désactiver" className="p-1.5 rounded-lg hover:bg-amber-500/10">
                                  <Ban size={15} className="text-amber-500" />
                                </button>
                              ) : (
                                <button onClick={() => handleUpdate(s, { isActive: true })} title="Réactiver" className="p-1.5 rounded-lg hover:bg-emerald-500/10">
                                  <UserCheck size={15} className="text-emerald-500" />
                                </button>
                              )}
                              <button onClick={() => setDeleting(s)} title="Supprimer" className="p-1.5 rounded-lg hover:bg-red-500/10">
                                <Trash2 size={15} className="text-red-500" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {staff.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-muted">Aucun membre du personnel</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-primary text-lg">Nouvel administrateur</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-muted"><X size={18} /></button>
            </div>
            <input placeholder="Nom complet" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm" />
            <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm" />
            <input placeholder="Téléphone (optionnel)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm" />
            <input placeholder="Mot de passe (6+ caractères)" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm" />
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as "ADMIN" | "OWNER" })} className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm">
              <option value="ADMIN">Admin</option>
              <option value="OWNER">Owner</option>
            </select>
            <button onClick={handleCreate} disabled={saving} className="w-full flex items-center justify-center gap-2 bg-[var(--primary)] text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-60">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Créer le compte
            </button>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-primary text-lg">Modifier {editing.name}</h3>
              <button onClick={() => setEditing(null)} className="p-1 rounded-lg hover:bg-muted"><X size={18} /></button>
            </div>
            <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm" />
            <input value={editing.phone ?? ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} placeholder="Téléphone" className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm" />
            <button onClick={handleSaveEdit} disabled={saving} className="w-full flex items-center justify-center gap-2 bg-[var(--primary)] text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-60">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Enregistrer
            </button>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleting && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDeleting(null)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 space-y-4 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
              <ShieldAlert size={24} className="text-red-500" />
            </div>
            <p className="font-semibold text-primary">Supprimer {deleting.name} ?</p>
            <p className="text-sm text-muted">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleting(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium">Annuler</button>
              <button onClick={handleDelete} disabled={saving} className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-60">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
