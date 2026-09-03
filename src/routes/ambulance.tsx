import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/qc/AppHeader";
import { RoleGuard } from "@/components/qc/RoleGuard";
import { haversine, type AmbulanceStatus } from "@/lib/qc/data";
import { useQc } from "@/lib/qc/store";

export const Route = createFileRoute("/ambulance")({
  head: () => ({
    meta: [
      { title: "Ambulance Crew Console | Queue Cue" },
      { name: "description", content: "Accept dispatched calls, see the destination hospital and complete trips." },
      { property: "og:title", content: "Ambulance Crew Console | Queue Cue" },
      { property: "og:description", content: "Live dispatch queue for ambulance crews." },
    ],
  }),
  component: () => (
    <RoleGuard role="ambulance">
      <AmbulanceDashboard />
    </RoleGuard>
  ),
});

const STATUSES: AmbulanceStatus[] = ["available", "en_route", "at_hospital", "offline"];

function AmbulanceDashboard() {
  const { session, ambulances, hospitals, requests, updateRequestStatus, setAmbulanceStatus, t } = useQc();
  const unit = ambulances.find((a) => a.id === session?.ambulanceId) ?? ambulances[0];
  const myCalls = requests.filter((r) => r.ambulanceId === unit?.id && r.status !== "completed");
  const history = requests.filter((r) => r.ambulanceId === unit?.id && r.status === "completed");

  if (!unit) return null;

  return (
    <div className="min-h-screen">
      <AppHeader
        subtitle={t(`Ambulance console — ${unit.code}`, `एम्बुलेंस कंसोल — ${unit.code}`)}
        summary={t(`You have ${myCalls.length} active calls.`, `आपके पास ${myCalls.length} सक्रिय कॉल हैं।`)}
      />
      <main className="mx-auto max-w-4xl p-5">
        <section className="qc-card mb-5 p-4">
          <h2 className="text-xl font-bold">{t("Unit status", "इकाई स्थिति")}</h2>
          <p className="text-sm">
            {unit.code} · {unit.driver} · {unit.lat.toFixed(4)}, {unit.lng.toFixed(4)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setAmbulanceStatus(unit.id, s)}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  unit.status === s
                    ? "bg-pop font-bold text-pop-foreground"
                    : "border border-primary bg-card hover:bg-accent"
                }`}
              >
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
        </section>

        <h2 className="mb-3 border-b-2 border-secondary pb-1 text-xl font-bold">
          {t("Assigned calls", "सौंपी गई कॉल")}
        </h2>
        {myCalls.length === 0 ? (
          <p className="qc-card p-4 text-sm">
            {t("No calls assigned yet. Central command will dispatch you.", "अभी कोई कॉल नहीं। केंद्रीय नियंत्रण आपको भेजेगा।")}
          </p>
        ) : (
          <div className="space-y-3">
            {myCalls.map((r) => {
              const dest = hospitals.find((h) => h.id === r.hospitalId);
              const km = dest ? haversine(unit.lat, unit.lng, dest.lat, dest.lng) : 0;
              const pickupKm = haversine(unit.lat, unit.lng, r.patientLoc.lat, r.patientLoc.lng);
              return (
                <div key={r.id} className="qc-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <b className="text-lg">{r.patientName}</b>
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-secondary-foreground">
                      {r.status}
                    </span>
                  </div>
                  <p className="text-sm">{r.note}</p>
                  <p className="mt-1 text-sm">
                    {t("Pickup", "पिकअप")}: {r.patientLoc.lat.toFixed(4)}, {r.patientLoc.lng.toFixed(4)} ·{" "}
                    {pickupKm.toFixed(1)} km
                  </p>
                  <p className="text-sm">
                    {t("Destination", "गंतव्य")}: {dest?.name} · {km.toFixed(1)} km ·{" "}
                    {t("road", "मार्ग")}: {dest?.roadStatus}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.status === "assigned" ? (
                      <button
                        type="button"
                        onClick={() => updateRequestStatus(r.id, "accepted")}
                        className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-secondary"
                      >
                        {t("Accept call", "कॉल स्वीकारें")}
                      </button>
                    ) : null}
                    {r.status === "accepted" ? (
                      <button
                        type="button"
                        onClick={() => updateRequestStatus(r.id, "completed")}
                        className="rounded-md bg-pop px-3 py-1.5 text-sm font-bold text-pop-foreground"
                      >
                        {t("Mark completed", "पूर्ण चिह्नित करें")}
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {history.length > 0 ? (
          <section className="mt-6">
            <h2 className="mb-2 border-b-2 border-secondary pb-1 text-xl font-bold">
              {t("Completed trips", "पूर्ण यात्राएँ")}
            </h2>
            <ul className="qc-card divide-y divide-border p-4 text-sm">
              {history.map((r) => (
                <li key={r.id} className="py-1.5">
                  {r.patientName} → {hospitals.find((h) => h.id === r.hospitalId)?.name}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </div>
  );
}
