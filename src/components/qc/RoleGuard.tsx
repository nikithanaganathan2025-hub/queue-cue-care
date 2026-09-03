import { useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import type { Role } from "@/lib/qc/data";
import { roleHome } from "@/lib/qc/data";
import { useQc } from "@/lib/qc/store";

/**
 * Client-side role gate for the demo login. When you wire a real backend,
 * swap the session check for your auth session/JWT check — the routes stay
 * the same.
 */
export function RoleGuard({ role, children }: { role: Role; children: ReactNode }) {
  const { session } = useQc();
  const navigate = useNavigate();

  useEffect(() => {
    if (session === null) {
      void navigate({ to: "/", replace: true });
    } else if (session.role !== role) {
      void navigate({ to: roleHome[session.role], replace: true });
    }
  }, [session, role, navigate]);

  if (!session || session.role !== role) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm">Checking your access…</p>
      </div>
    );
  }
  return <>{children}</>;
}
