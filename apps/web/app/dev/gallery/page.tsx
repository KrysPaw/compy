import { notFound } from 'next/navigation';
import { ComponentGallery } from '@/components/dev/component-gallery';

export default function DevGalleryPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return <ComponentGallery />;
}
