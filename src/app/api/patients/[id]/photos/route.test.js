import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireNutritionist: vi.fn(),
  writeAuditLog: vi.fn(),
  createSignedUrl: vi.fn(),
  patient: { id: "p1", full_name: "Maria" },
  photos: []
}));

vi.mock("@/lib/auth", () => ({ requireNutritionist: mocks.requireNutritionist }));
vi.mock("@/lib/audit", () => ({
  writeAuditLog: mocks.writeAuditLog,
  getClientIp: () => "127.0.0.1"
}));
vi.mock("@/lib/supabaseAdmin", () => {
  function query(table) {
    const chain = {
      select: () => chain,
      eq: () => chain,
      order: async () => ({ data: table === "progress_photos" ? mocks.photos : [], error: null }),
      maybeSingle: async () => ({ data: table === "patients" ? mocks.patient : null, error: null })
    };
    return chain;
  }
  return {
    createSupabaseAdmin: () => ({
      from: query,
      storage: { from: () => ({ createSignedUrl: mocks.createSignedUrl }) }
    })
  };
});

const { GET } = await import("./route");

function call(id = "p1") {
  return GET(new Request(`http://localhost/api/patients/${id}/photos`), {
    params: Promise.resolve({ id })
  });
}

describe("GET /api/patients/[id]/photos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.patient = { id: "p1", full_name: "Maria" };
    mocks.photos = [{ id: "f1", patient_id: "p1", storage_path: "p1/a.jpg", taken_at: "2026-11-01" }];
    mocks.requireNutritionist.mockResolvedValue({ ctx: { user: { id: "nutri-1" } } });
    mocks.createSignedUrl.mockResolvedValue({ data: { signedUrl: "https://signed/a.jpg" }, error: null });
  });

  it("bloqueia quem não é nutricionista", async () => {
    const denied = new Response(JSON.stringify({ message: "Acesso negado." }), { status: 403 });
    mocks.requireNutritionist.mockResolvedValue({ error: denied });
    const res = await call();
    expect(res.status).toBe(403);
    expect(mocks.writeAuditLog).not.toHaveBeenCalled();
  });

  it("retorna 404 para paciente inexistente", async () => {
    mocks.patient = null;
    const res = await call("x");
    expect(res.status).toBe(404);
  });

  it("lista fotos com URL assinada curta, sem expor o caminho, e registra auditoria", async () => {
    const res = await call();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(body.photos).toEqual([
      { id: "f1", patient_id: "p1", taken_at: "2026-11-01", url: "https://signed/a.jpg" }
    ]);
    expect(body.expiresInSeconds).toBe(300);
    expect(mocks.createSignedUrl).toHaveBeenCalledWith("p1/a.jpg", 300);
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "nutri-1",
        action: "progress_photos_view",
        resourceType: "patient",
        resourceId: "p1"
      })
    );
  });
});
