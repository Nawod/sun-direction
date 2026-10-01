import { MetadataRoute } from 'next';
import { siteUrl } from '@/utils/site';

export default function sitemap(): MetadataRoute.Sitemap {

  return [
    {
      url: siteUrl,
      changeFrequency: 'weekly',
      priority: 1,
    },
    { url: `${siteUrl}/guide`, changeFrequency: 'monthly', priority: 0.6 },
  ];
}
