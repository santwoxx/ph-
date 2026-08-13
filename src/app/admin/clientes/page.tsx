"use client";

import { useEffect, useMemo, useState } from "react";
import { Users, Search } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { subscribeToAllUsers } from "@/lib/data/users";
import { formatCPF } from "@/lib/cpf";
import { formatDate } from "@/lib/format";
import type { UserProfile } from "@/lib/types";

export default function AdminClientesPage() {
  const [users, setUsers] = useState<UserProfile[] | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const unsub = subscribeToAllUsers(setUsers, () => setUsers([]));
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    if (!users) return [];
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.cpf ?? "").includes(term.replace(/\D/g, ""))
    );
  }, [users, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-acai-950">Clientes</h1>
        <p className="text-sm text-acai-400">
          Todo mundo que já entrou com o Google, com os dados preenchidos no primeiro acesso.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-acai-300" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, e-mail ou CPF"
          className="w-full rounded-xl border-2 border-acai-100 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-acai-400"
        />
      </div>

      {users === null ? (
        <Spinner label="Carregando clientes..." />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-acai-200 bg-white py-20 text-center">
          <Users className="h-14 w-14 text-acai-200" />
          <p className="font-semibold text-acai-800">Nenhum cliente por aqui</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-acai-100 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-acai-100 bg-acai-50/50 text-left text-xs uppercase tracking-wide text-acai-400">
                  <th className="px-5 py-3 font-semibold">Nome</th>
                  <th className="px-5 py-3 font-semibold">Contato</th>
                  <th className="px-5 py-3 font-semibold">CPF</th>
                  <th className="px-5 py-3 font-semibold">Endereço</th>
                  <th className="px-5 py-3 font-semibold">Desde</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-acai-50">
                {filtered.map((u) => {
                  const main = u.addresses?.[0];
                  return (
                    <tr key={u.uid}>
                      <td className="px-5 py-3.5 font-semibold text-acai-900">
                        {u.name || <span className="font-normal text-acai-300">Sem nome</span>}
                      </td>
                      <td className="px-5 py-3.5 text-acai-600">
                        <p>{u.email}</p>
                        {u.phone && <p className="text-xs text-acai-400">{u.phone}</p>}
                      </td>
                      <td className="px-5 py-3.5 text-acai-600">
                        {u.cpf ? (
                          formatCPF(u.cpf)
                        ) : (
                          <span className="text-acai-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-acai-600">
                        {main ? (
                          <>
                            {main.street}, {main.number} — {main.district}
                            <br />
                            <span className="text-xs text-acai-400">{main.city}</span>
                          </>
                        ) : (
                          <span className="text-acai-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-acai-500">{formatDate(u.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
