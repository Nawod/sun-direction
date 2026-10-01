// Use one public origin for canonical URLs, social metadata, robots and sitemap.
export const siteUrl = new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://www.sundirection.nawodmadhuwantha.com').origin;
export const siteDescription = 'Find the shadier side of a bus or train using your route, departure time, and the sun’s position. Explore sunlight along your journey.';
