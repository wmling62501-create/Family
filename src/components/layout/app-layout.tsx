import { Outlet } from "react-router-dom";

import { RecoveryRedirect } from "@/components/layout/recovery-redirect";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const AppLayout = () => (
  <div className="flex min-h-screen flex-col bg-background">
    <RecoveryRedirect />
    <SiteHeader />
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 md:px-8 md:py-12">
      <Outlet />
    </main>
    <SiteFooter />
  </div>
);
