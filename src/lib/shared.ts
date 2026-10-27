export const appName = 'HikariSub';
export const siteUrl = 'https://hikarisub.altqx.com';

export const gitConfig = {
  user: 'altqx',
  repo: 'hikari-site',
  branch: 'main',
};

export const appRepoUrl = 'https://github.com/altqx/hikari';

// Draft pages are built into PR previews only.
export const showDrafts = import.meta.env.VITE_SHOW_DRAFTS === '1';

export function editUrl(path: string) {
  return `https://github.com/${gitConfig.user}/${gitConfig.repo}/edit/${gitConfig.branch}/content/docs/${path}`;
}

export function reportUrl(pageUrl: string, title: string) {
  const params = new URLSearchParams({
    title: `Guide: ${title}`,
    labels: 'documentation',
    body: `Page: ${siteUrl}${pageUrl}\n\nWhat is wrong or missing?\n`,
  });
  return `${appRepoUrl}/issues/new?${params}`;
}
