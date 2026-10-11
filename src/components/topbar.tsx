import { logout } from "@/app/login/actions";
import { NotificationBell, type NotificacionItem } from "@/components/notification-bell";
import { PushSubscribeButton } from "@/components/push-subscribe-button";

export function Topbar({
  userEmail,
  userRole,
  notificaciones = [],
}: {
  userEmail: string;
  userRole: string;
  notificaciones?: NotificacionItem[];
}) {
  return (
    <div className="flex items-center justify-between bg-primary-500 px-6 py-3 text-white">
      <div>{userRole === "apoderado" && <PushSubscribeButton />}</div>
      <div className="flex items-center gap-4">
        <NotificationBell notificaciones={notificaciones} />
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
