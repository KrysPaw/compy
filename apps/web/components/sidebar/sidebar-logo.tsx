'use client';

import Image from 'next/image';
import { SidebarMenu } from '@/components/ui/sidebar';

export function SidebarLogo() {
  return (
    <SidebarMenu>
      <div className="flex items-center gap-4 min-h-14 px-2">
        <Image src="/logo.png" alt="Compy" width={48} height={48} />
        <div className="flex flex-col gap-0.5 leading-none">
          <span className="font-bold text-xl">Compy</span>
        </div>
      </div>
    </SidebarMenu>
  );
}
