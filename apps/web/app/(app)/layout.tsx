import { AppSidebar } from '@/components/sidebar/app-sidebar';
import { SignInBanner } from '@/components/sidebar/sign-in-banner';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export default function AppLayout({ children }: LayoutProps<'/'>) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SignInBanner />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
