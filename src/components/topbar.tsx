import { logout } from "@/app/login/actions";

export function Topbar({
  userEmail,
  userRole,
}: {
  userEmail: string;
  userRole: string;
}) {
  return (
    <div className="flex items-center justify-between bg-primary-500 px-6 py-3 text-white">
      <div />
      <div className="flex items-center gap-4">
        <button
          aria-label="Notificaciones"
          className="rounded-full p-2 hover:bg-white/10"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>
        <div className="text-right text-sm leading-tight">
          <div className="font-medium">{userEmail}</div>
          <div className="text-xs capitalize text-white/80">{userRole}</div>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-sm font-medium hover:bg-white/20"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
