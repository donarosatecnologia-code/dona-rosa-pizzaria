import { useLocation } from "react-router-dom";
import { isAdminChatRoute, isAdminMirrorRoute } from "@/lib/adminNavigation";

export function useAdminShellRoutes() {
  const { pathname } = useLocation();
  const isChatRoute = isAdminChatRoute(pathname);
  const isMirrorRoute = isAdminMirrorRoute(pathname);

  return {
    pathname,
    isChatRoute,
    isMirrorRoute,
    hideBottomNav: isChatRoute,
    hideMobileHeader: isChatRoute,
    fullBleedMobile: isChatRoute || isMirrorRoute,
  };
}
