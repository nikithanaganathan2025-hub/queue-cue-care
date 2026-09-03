import { useState } from "react";
import { bedsAvailable, occupancyPct, riskModel, type Hospital } from "@/lib/qc/data";
import { useQc } from "@/lib/qc/store";

export function Bar({ pct, warn }: { pct: number; warn?: boolean }) {
  return (
    <div className="h-2.5 overflow-hidden rounded-md border border-border bg-accent">
      <div
        className={warn ? "h-full bg-risk-high" : "h-full bg-secondary"}
        style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
      />
    </div>
  );
}

export function RiskBadge({ level }: { level: "green" | "amber" | "red" }) {
  const { t } = useQc();
  const cls =
    level === "red"
      ? "bg-risk-high text-primary-foreground"
      : level === "amber"
        ? "bg-risk-mid text-primary"
        : "bg-risk-low text-primary-foreground";
  const label =
    level === "red" ? t("High risk", "उच्च जोखिम") : level === "amber" ? t("Medium risk", "मध्यम जोखिम") : t("Low risk", "कम जोखिम");
  return <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}>{label}</span>;
}

export function HospitalCard({
  hospital,
  dist,
  onRequestAmbulance,
}: {
  hospital: Hospital;
  dist: number;
  onRequestAmbulance?: (h: Hospital) => void;
}) {
  const { t } = useQc();
  const [showForecast, setShowForecast] = useState(false);
  const rm = riskModel(hospital);
  const occ = occupancyPct(hospital);
  const staffPct = Math.round((hospital.staffPresent / hospital.staffTotal) * 100);

  const road =
    hospital.roadStatus === "clear"
      ? t("Clear route", "साफ़ मार्ग")
      : hospital.roadStatus === "congested"
        ? t("Congested", "भीड़भाड़")
        : t("Blocked", "अवरुद्ध");

  return (
    <div className="qc-card flex flex-col gap-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-bold">{hospital.name}</h3>
        <RiskBadge level={rm.riskLevel} />
      </div>
      <p className="text-sm text-secondary">
        {dist.toFixed(1)} km · {road} ·{" "}
        {hospital.sector === "private" ? t("Private", "निजी") : t("Government", "सरकारी")}
      </p>
      <p className="text-sm italic">{t(hospital.specialty.en, hospital.specialty.hi)}</p>

      <div>
        <div className="flex justify-between text-sm">
          <span>{t("Beds available", "उपलब्ध बिस्तर")}</span>
          <span>
            {bedsAvailable(hospital)} / {hospital.bedsTotal}
          </span>
        </div>
        <Bar pct={occ} warn={occ >= 90} />
      </div>
      <div>
        <div className="flex justify-between text-sm">
          <span>{t("Staff on duty", "ड्यूटी पर स्टाफ")}</span>
          <span>
            {hospital.staffPresent} / {hospital.staffTotal} ({staffPct}%)
          </span>
        </div>
        <Bar pct={staffPct} warn={staffPct < 70} />
      </div>
      <div>
        <div className="flex justify-between text-sm">
          <span>{t("Supply stock", "सामग्री स्टॉक")}</span>
          <span>{hospital.stockPct}%</span>
        </div>
        <Bar pct={hospital.stockPct} warn={hospital.stockPct < 40} />
      </div>

      <div className="mt-1 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setShowForecast((v) => !v)}
          className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-secondary"
        >
          {showForecast ? t("Hide forecast", "पूर्वानुमान छिपाएँ") : t("AI forecast", "एआई पूर्वानुमान")}
        </button>
        {onRequestAmbulance ? (
          <button
            type="button"
            onClick={() => onRequestAmbulance(hospital)}
            className="rounded-md border border-primary bg-card px-3 py-1.5 text-sm hover:bg-accent"
          >
            {t("Request ambulance here", "यहाँ एम्बुलेंस बुक करें")}
          </button>
        ) : null}
      </div>

      {showForecast ? (
        <div className="mt-1 rounded-lg bg-accent p-3 text-sm text-accent-foreground">
          <p className="font-bold">
            {t("Risk score", "जोखिम स्कोर")}: {rm.riskScore}/100
          </p>
          <p>
            {rm.overcrowdingInHours === null
              ? t("Not expected to overcrowd in the next 24 hours", "अगले 24 घंटों में भीड़ की संभावना नहीं")
              : rm.overcrowdingInHours === 0
                ? t("Already overcrowded", "पहले से भीड़भाड़")
                : `${t("Overcrowding expected in", "भीड़ की संभावना")} ~${rm.overcrowdingInHours} h`}
          </p>
          <table className="mt-2 w-full text-center">
            <thead>
              <tr className="bg-border">
                {rm.bedForecast.map((f) => (
                  <th key={f.hour} className="p-1 font-normal">
                    +{f.hour}h
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {rm.bedForecast.map((f) => (
                  <td key={f.hour} className="p-1">
                    {f.beds}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          <ul className="mt-2 list-disc pl-5">
            {rm.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
