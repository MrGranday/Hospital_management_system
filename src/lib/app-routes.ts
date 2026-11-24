import type { PageKey } from "@/store/app-store";

export const APP_BASE = "/app";

export const PAGE_PATHS: Record<PageKey, string> = {
  dashboard: `${APP_BASE}/dashboard`,
  patients: `${APP_BASE}/patients`,
  appointments: `${APP_BASE}/appointments`,
  opd: `${APP_BASE}/opd`,
  emergency: `${APP_BASE}/emergency`,
  ipd: `${APP_BASE}/ipd`,
  emr: `${APP_BASE}/emr`,
  nursing: `${APP_BASE}/nursing`,
  billing: `${APP_BASE}/billing`,
  pharmacy: `${APP_BASE}/pharmacy`,
  lab: `${APP_BASE}/lab`,
  radiology: `${APP_BASE}/radiology`,
  inventory: `${APP_BASE}/inventory`,
  "blood-bank": `${APP_BASE}/blood-bank`,
  insurance: `${APP_BASE}/insurance`,
  finance: `${APP_BASE}/finance`,
  hr: `${APP_BASE}/hr`,
  reports: `${APP_BASE}/reports`,
  settings: `${APP_BASE}/settings`,
  "activity-log": `${APP_BASE}/activity-log`,
  services: `${APP_BASE}/services`,
  roles: `${APP_BASE}/roles`,
  purchases: `${APP_BASE}/purchases`,
  suppliers: `${APP_BASE}/suppliers`,
};

const PATH_PAGES = new Map<string, PageKey>(
  Object.entries(PAGE_PATHS).map(([page, path]) => [path, page as PageKey]),
);

export function pagePath(page: PageKey): string {
  return PAGE_PATHS[page];
}

export function isPageKey(value: string): value is PageKey {
  return Object.prototype.hasOwnProperty.call(PAGE_PATHS, value);
}

export function pageFromPath(pathname: string): PageKey | null {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return PATH_PAGES.get(clean) ?? null;
}

export function pageFromSlug(slug: string[] | undefined): PageKey {
  const first = slug?.[0];
  return slug?.length === 1 && first && isPageKey(first) ? first : "dashboard";
}
