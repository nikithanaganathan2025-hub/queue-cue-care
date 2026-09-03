import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/qc/AppHeader";
import { Bar, RiskBadge } from "@/components/qc/HospitalCard";
import { RoleGuard } from "@/components/qc/RoleGuard";
import { bedsAvailable, occupancyPct, riskModel, type Hospital } from "@/lib/qc/data";
import { useQc } from "@/lib/qc/store";

export const Route = createFileRoute("/hospital")({
  head: () => ({
    meta: [
      { title: "Hospital Administration | Queue Cue" },
      { name: "description", content: "Update bed availability, staffing, supplies and road access in real time." },
      { property: "og:title", content: "Hospital Administration | Queue Cue" },
      { property: "og:description", content: "Real-time capacity control for hospital administrators." },
    ],
  }),
  component: () => (
    <RoleGuard role="hospital">
      <HospitalAdminDashboard />
    </RoleGuard>
  ),
});

function NumberField({
  label,
  value,
  min = 0,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="block">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        {...(max !== undefined ? { max } : {})}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2"
      />
    </label>
  );
}

function HospitalAdminDashboard() {
  const { session, hospitals, requests, updateHospital, t } = useQc();
  const hospital = hospitals.find((h) => h.id === session?.hospitalId) ?? hospitals[0];
  if (!hospital) return null;

  const rm = riskModel(hospital);
  const occ = occupancyPct(hospital);
  const incoming = requests.filter((r) => r.hospitalId === hospital.id && r.status !== "completed");

  const set = (patch: Partial<Hospital>) => updateHospital(hospital.id, patch);

  return (
    <div className="min-h-screen">
      <AppHeader
        subtitle={t(`Hospital administration — ${hospital.name}`, `अस्पताल प्रशासन — ${hospital.name}`)}
        summary={t(
          `${bedsAvailable(hospital)} beds free of ${hospital.bedsTotal}.`,
          `${hospital.bedsTotal} में से ${bedsAvailable(hospital)} बिस्तर खाली।`,
        )}
      />
      <main className="mx-auto max-w-5xl p-5">
        <section className="qc-card mb-5 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold">{hospital.name}</h2>
              <p className="text-sm text-secondary">
                {t("Occupancy", "अधिग्रहण")}: {occ}% · {t("Risk score", "जोखिम स्कोर")}: {rm.riskScore}/100
              </p>
            </div>
            <RiskBadge level={rm.riskLevel} />
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-sm">
              <span>{t("Beds available", "उपलब्ध बिस्तर")}</span>
              <span>
                {bedsAvailable(hospital)} / {hospital.bedsTotal}
              </span>
            </div>
            <Bar pct={occ} warn={occ >= 90} />
          </div>
        </section>

        <section className="qc-card mb-5 p-4">
          <h2 className="text-xl font-bold">{t("Update bed availability (live)", "बिस्तर उपलब्धता अपडेट करें (लाइव)")}</h2>
          <p className="text-sm">
            {t(
              "Changes are published instantly to patients, ambulance crews and central command.",
              "बदलाव तुरंत मरीज़ों, एम्बुलेंस चालकों और केंद्रीय नियंत्रण को दिखते हैं।",
            )}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => set({ bedsOccupied: Math.min(hospital.bedsTotal, hospital.bedsOccupied + 1) })}
              className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-secondary"
            >
              − {t("1 bed free (admission)", "1 बिस्तर कम (भर्ती)")}
            </button>
            <button
              type="button"
              onClick={() => set({ bedsOccupied: Math.max(0, hospital.bedsOccupied - 1) })}
              className="rounded-md bg-pop px-3 py-1.5 text-sm font-bold text-pop-foreground"
            >
              + {t("1 bed free (discharge)", "1 बिस्तर मुक्त (छुट्टी)")}
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <NumberField
              label={t("Total beds", "कुल बिस्तर")}
              value={hospital.bedsTotal}
              min={1}
              onChange={(v) => set({ bedsTotal: Math.max(1, v), bedsOccupied: Math.min(hospital.bedsOccupied, Math.max(1, v)) })}
            />
            <NumberField
              label={t("Occupied beds", "भरे बिस्तर")}
              value={hospital.bedsOccupied}
              max={hospital.bedsTotal}
              onChange={(v) => set({ bedsOccupied: Math.max(0, Math.min(hospital.bedsTotal, v)) })}
            />
            <NumberField
              label={t("Staff present", "उपस्थित स्टाफ")}
              value={hospital.staffPresent}
              max={hospital.staffTotal}
              onChange={(v) => set({ staffPresent: Math.max(0, Math.min(hospital.staffTotal, v)) })}
            />
            <NumberField
              label={t("Staff on roster", "कुल स्टाफ")}
              value={hospital.staffTotal}
              min={1}
              onChange={(v) => set({ staffTotal: Math.max(1, v) })}
            />
            <NumberField
              label={t("Supply stock %", "सामग्री स्टॉक %")}
              value={hospital.stockPct}
              max={100}
              onChange={(v) => set({ stockPct: Math.max(0, Math.min(100, v)) })}
            />
            <NumberField
              label={t("Admission queue length", "भर्ती कतार")}
              value={hospital.queueLength}
              onChange={(v) => set({ queueLength: Math.max(0, v) })}
            />
            <NumberField
              label={t("Arrivals per hour (now)", "प्रति घंटा आगमन (अब)")}
              value={hospital.arrivalsCurrent}
              onChange={(v) => set({ arrivalsCurrent: Math.max(0, v) })}
            />
            <NumberField
              label={t("Discharges per hour", "प्रति घंटा छुट्टी")}
              value={hospital.dischargesPerHr}
              onChange={(v) => set({ dischargesPerHr: Math.max(0, v) })}
            />
            <NumberField
              label={t("Discharge delay (hours)", "छुट्टी में देरी (घंटे)")}
              value={hospital.delayHrs}
              onChange={(v) => set({ delayHrs: Math.max(0, v) })}
            />
            <label className="block text-sm">
              <span className="block">{t("Road access", "मार्ग स्थिति")}</span>
              <select
                value={hospital.roadStatus}
                onChange={(e) => set({ roadStatus: e.target.value as Hospital["roadStatus"] })}
                className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2"
              >
                <option value="clear">{t("Clear", "साफ़")}</option>
                <option value="congested">{t("Congested", "भीड़भाड़")}</option>
                <option value="blocked">{t("Blocked", "अवरुद्ध")}</option>
              </select>
            </label>
          </div>
        </section>

        <section>
          <h2 className="mb-2 border-b-2 border-secondary pb-1 text-xl font-bold">
            {t("Incoming ambulances", "आने वाली एम्बुलेंस")}
          </h2>
          {incoming.length === 0 ? (
            <p className="qc-card p-4 text-sm">{t("No inbound ambulances right now.", "अभी कोई एम्बुलेंस आने वाली नहीं है।")}</p>
          ) : (
            <div className="space-y-2">
              {incoming.map((r) => (
                <div key={r.id} className="qc-card flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                  <span>
                    <b>{r.patientName}</b> · {r.note}
                  </span>
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-secondary-foreground">
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="qc-card mt-4 p-4 text-sm">
            <h3 className="font-bold">{t("Forecast drivers", "पूर्वानुमान कारण")}</h3>
            <ul className="mt-1 list-disc pl-5">
              {rm.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
