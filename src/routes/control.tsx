import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/qc/AppHeader";
import { RiskBadge } from "@/components/qc/HospitalCard";
import { RoleGuard } from "@/components/qc/RoleGuard";
import { bedsAvailable, haversine, occupancyPct, rankHospitals, riskModel } from "@/lib/qc/data";
import { useQc } from "@/lib/qc/store";

export const Route = createFileRoute("/control")({
  head: () => ({
    meta: [
      { title: "Central Command | Queue Cue" },
      { name: "description", content: "Monitor every ambulance, review pending calls and dispatch the nearest available unit." },
      { property: "og:title", content: "Central Command | Queue Cue" },
      { property: "og:description", content: "Citywide ambulance status and dispatch control." },
    ],
  }),
  component: () => (
    <RoleGuard role="central">
      <CentralDashboard />
    </RoleGuard>
  ),
});

function CentralDashboard() {
  const { hospitals, ambulances, requests, dispatchAmbulance, resetDemoData, t } = useQc();
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);

  const open = requests.filter((r) => r.status !== "completed");
  const pending = open.filter((r) => r.status === "pending");
  const available = ambulances.filter((a) => a.status === "available");
  const activeRequest = requests.find((r) => r.id === selectedRequest) ?? null;

  const suggestions = activeRequest
    ? ambulances
        .filter((a) => a.status === "available")
        .map((a) => ({
          amb: a,
          km: haversine(a.lat, a.lng, activeRequest.patientLoc.lat, activeRequest.patientLoc.lng),
        }))
        .sort((x, y) => x.km - y.km)
    : [];

  const critical = rankHospitals(hospitals, { lat: 28.6139, lng: 77.209 })
    .map(({ hospital }) => ({ hospital, rm: riskModel(hospital) }))
    .sort((a, b) => b.rm.riskScore - a.rm.riskScore);

  return (
    <div className="min-h-screen">
      <AppHeader
        subtitle={t("Central administrator — ambulance command", "केंद्रीय प्रशासक — एम्बुलेंस नियंत्रण")}
        summary={t(
          `${pending.length} calls waiting, ${available.length} ambulances available.`,
          `${pending.length} कॉल प्रतीक्षा में, ${available.length} एम्बुलेंस उपलब्ध।`,
        )}
      />
      <main className="mx-auto max-w-6xl p-5">
        <section className="mb-5 grid gap-3 sm:grid-cols-4">
          {[
            { label: t("Ambulances", "एम्बुलेंस"), value: ambulances.length },
            { label: t("Available", "उपलब्ध"), value: available.length },
            { label: t("Open calls", "खुली कॉल"), value: open.length },
            { label: t("Waiting", "प्रतीक्षारत"), value: pending.length },
          ].map((s) => (
            <div key={s.label} className="qc-card p-4">
              <p className="text-sm text-secondary">{s.label}</p>
              <p className="text-3xl font-bold">{s.value}</p>
            </div>
          ))}
        </section>

        <section className="mb-6">
          <h2 className="mb-2 border-b-2 border-secondary pb-1 text-xl font-bold">
            {t("Ambulance fleet status", "एम्बुलेंस बेड़े की स्थिति")}
          </h2>
          <div className="qc-card overflow-x-auto p-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-accent text-accent-foreground">
                  <th className="p-2 text-left">{t("Unit", "इकाई")}</th>
                  <th className="p-2 text-left">{t("Crew", "चालक")}</th>
                  <th className="p-2 text-left">{t("Status", "स्थिति")}</th>
                  <th className="p-2 text-left">{t("Location", "स्थान")}</th>
                  <th className="p-2 text-left">{t("Current call", "वर्तमान कॉल")}</th>
                </tr>
              </thead>
              <tbody>
                {ambulances.map((a) => {
                  const call = requests.find((r) => r.id === a.requestId);
                  const dest = hospitals.find((h) => h.id === call?.hospitalId);
                  return (
                    <tr key={a.id} className="border-b border-border">
                      <td className="p-2 font-bold">{a.code}</td>
                      <td className="p-2">{a.driver}</td>
                      <td className="p-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                            a.status === "available"
                              ? "bg-risk-low text-primary-foreground"
                              : a.status === "offline"
                                ? "bg-border text-foreground"
                                : "bg-risk-mid text-primary"
                          }`}
                        >
                          {a.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-2">
                        {a.lat.toFixed(4)}, {a.lng.toFixed(4)}
                      </td>
                      <td className="p-2">{call ? `${call.patientName} → ${dest?.name ?? ""}` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-6 grid gap-4 lg:grid-cols-2">
          <div>
            <h2 className="mb-2 border-b-2 border-secondary pb-1 text-xl font-bold">
              {t("Calls needing dispatch", "प्रेषण हेतु कॉल")}
            </h2>
            {open.length === 0 ? (
              <p className="qc-card p-4 text-sm">{t("No open calls.", "कोई खुली कॉल नहीं।")}</p>
            ) : (
              <div className="space-y-2">
                {open.map((r) => {
                  const dest = hospitals.find((h) => h.id === r.hospitalId);
                  const amb = ambulances.find((a) => a.id === r.ambulanceId);
                  return (
                    <div
                      key={r.id}
                      className={`qc-card p-3 text-sm ${selectedRequest === r.id ? "border-2 border-pop" : ""}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <b>{r.patientName}</b>
                        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-secondary-foreground">
                          {r.status}
                        </span>
                      </div>
                      <p>{r.note}</p>
                      <p>
                        {t("Destination", "गंतव्य")}: {dest?.name} ({bedsAvailable(dest ?? hospitals[0]!)}{" "}
                        {t("beds free", "बिस्तर खाली")})
                      </p>
                      <p>
                        {t("Assigned unit", "नियुक्त इकाई")}: {amb ? amb.code : t("none", "कोई नहीं")}
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedRequest(r.id)}
                        className="mt-2 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-secondary"
                      >
                        {amb ? t("Reassign unit", "इकाई बदलें") : t("Dispatch unit", "इकाई भेजें")}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-2 border-b-2 border-secondary pb-1 text-xl font-bold">
              {t("Dispatch panel", "प्रेषण पैनल")}
            </h2>
            {!activeRequest ? (
              <p className="qc-card p-4 text-sm">
                {t("Select a call on the left to dispatch an ambulance.", "एम्बुलेंस भेजने के लिए बाईं ओर से कॉल चुनें।")}
              </p>
            ) : (
              <div className="qc-card p-4 text-sm">
                <p className="font-bold">
                  {activeRequest.patientName} → {hospitals.find((h) => h.id === activeRequest.hospitalId)?.name}
                </p>
                {suggestions.length === 0 ? (
                  <p className="mt-2">{t("No available ambulances right now.", "अभी कोई एम्बुलेंस उपलब्ध नहीं है।")}</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {suggestions.map(({ amb, km }, i) => (
                      <li
                        key={amb.id}
                        className={`flex items-center justify-between gap-2 rounded-md border border-border p-2 ${
                          i === 0 ? "bg-accent" : ""
                        }`}
                      >
                        <span>
                          <b>{amb.code}</b> · {amb.driver} · {km.toFixed(1)} km
                          {i === 0 ? ` · ${t("nearest", "निकटतम")}` : ""}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            dispatchAmbulance(amb.id, activeRequest.id);
                            setSelectedRequest(null);
                          }}
                          className="rounded-md bg-pop px-3 py-1.5 font-bold text-pop-foreground"
                        >
                          {t("Dispatch", "भेजें")}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-2 border-b-2 border-secondary pb-1 text-xl font-bold">
            {t("Hospital load (highest risk first)", "अस्पताल भार (अधिक जोखिम पहले)")}
          </h2>
          <div className="qc-card overflow-x-auto p-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-accent text-accent-foreground">
                  <th className="p-2 text-left">{t("Hospital", "अस्पताल")}</th>
                  <th className="p-2 text-left">{t("Occupancy", "अधिग्रहण")}</th>
                  <th className="p-2 text-left">{t("Beds free", "खाली बिस्तर")}</th>
                  <th className="p-2 text-left">{t("Risk", "जोखिम")}</th>
                </tr>
              </thead>
              <tbody>
                {critical.map(({ hospital, rm }) => (
                  <tr key={hospital.id} className="border-b border-border">
                    <td className="p-2">{hospital.name}</td>
                    <td className="p-2">{occupancyPct(hospital)}%</td>
                    <td className="p-2">{bedsAvailable(hospital)}</td>
                    <td className="p-2">
                      <RiskBadge level={rm.riskLevel} /> <span className="ml-1">{rm.riskScore}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={resetDemoData}
            className="mt-4 rounded-md border border-primary bg-card px-3 py-1.5 text-sm hover:bg-accent"
          >
            {t("Reset demo data", "डेमो डेटा रीसेट करें")}
          </button>
        </section>
      </main>
    </div>
  );
}
