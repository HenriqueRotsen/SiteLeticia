export function isDemoMode() {
  return process.env.DEMO_MODE === "true";
}

export function isPublicDemoMode() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

export const DEMO_ROLE_COOKIE = "demo_role";

export function getDemoRoleFromRequest(request) {
  return request.cookies.get(DEMO_ROLE_COOKIE)?.value || null;
}
