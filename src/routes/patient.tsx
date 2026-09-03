import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/qc/AppHeader";
import { HospitalCard } from "@/components/qc/HospitalCard";
import { RoleGuard } from "@/components/qc/RoleGuard";
import { FALLBACK_CENTER, rankHospitals, type Hospital } from "@/lib/qc/data";
import { useQc } from "@/lib/qc/store";

export const Route = createFileRoute("/patient")({
  head: () => ({
    meta: [
      { title: "Patient Dashboard | Queue Cue" },
      { name: "description", content: "Nearest hospitals ranked by distance, free beds and road conditions, with ambulance requests." },
      { property: "og:title", content: "Patient Dashboard | Queue Cue" },
      { property: "og:description", content: "Find the best hospital near you and request an ambulance." },
    ],
  }),
  component: () => (
    <RoleGuard role="patient">
      <PatientDashboard />
    </RoleGuard>
  ),
});

function PatientDashboard() {
  const { hospitals, requests, session, createRequest, t } = useQc();
  const [note, setNote] = useState("");
  const [flash, setFlash] = useState("");

  const ranked = useMemo(() => rankHospitals(hospitals, FALLBACK_CENTER), [hospitals]);
  const myRequests = requests.filter((r) => r.patientName === session?.name);

  function handleRequest(h: Hospital) {
    createRequest({
      patientName: session?.name ?? "Patient",
      note: note || "No details provided",
      hospitalId: h.id,
      patientLoc: FALLBACK_CENTER,
    });
    setNote("");
    setFlash(t(`Ambulance requested to ${h.name}. Central command will dispatch a unit.`, `${h.name} के लिए एम्बुलेंस अनुरोध भेजा गया। केंद्रीय नियंत्रण इकाई भेजेगा।`));
  }

  return (
    <div className="min-h-screen">
      <AppHeader
        subtitle={t("Patient view — live hospital availability", "मरीज़ दृश्य — लाइव अस्पताल उपलब्धता")}
        summary={t(
          `Nearest recommended hospital is ${ranked[0]?.hospital.name ?? ""}.`,
          `निकटतम अनुशंसित अस्पताल ${ranked[0]?.hospital.name ?? ""} है।`,
        )}
      />
      <main className="mx-auto max-w-6xl p-5">
        <section className="qc-card mb-5 p-4">
          <h2 className="text-xl font-bold">{t("Need an ambulance?", "एम्बुलेंस चाहिए?")}</h2>
          <p className="text-sm">
            {t(
              "Describe the emergency, then request an ambulance to your chosen hospital below.",
              "आपात स्थिति बताएँ, फिर नीचे अपने चुने अस्पताल के लिए एम्बुलेंस का अनुरोध करें।",
            )}
          </p>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("e.g. Chest pain, conscious", "उदा. सीने में दर्द, होश में")}
            className="mt-2 w-full rounded-md border border-input bg-card px-3 py-2"
          />
          {flash ? <p className="mt-2 rounded-md bg-pop px-3 py-2 text-sm text-pop-foreground">{flash}</p> : null}
        </section>

        {myRequests.length > 0 ? (
          <section className="mb-5">
            <h2 className="mb-2 border-b-2 border-secondary pb-1 text-xl font-bold">
              {t("My ambulance requests", "मेरे एम्बुलेंस अनुरोध")}
            </h2>
            <div className="space-y-2">
              {myRequests.map((r) => {
                const dest = hospitals.find((h) => h.id === r.hospitalId);
                return (
                  <div key={r.id} className="qc-card flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                    <span>
                      <b>{dest?.name}</b> · {r.note}
                    </span>
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-secondary-foreground">
                      {r.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        <h2 className="mb-3 border-b-2 border-secondary pb-1 text-xl font-bold">
          {t("Recommended hospitals near you", "आपके निकट अनुशंसित अस्पताल")}
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ranked.map(({ hospital, dist }) => (
            <HospitalCard key={hospital.id} hospital={hospital} dist={dist} onRequestAmbulance={handleRequest} />
          ))}
        </div>
      </main>
    </div>
  );
}
