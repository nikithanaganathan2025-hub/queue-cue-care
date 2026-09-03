import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ACCOUNTS, roleHome } from "@/lib/qc/data";
import { useQc } from "@/lib/qc/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Queue Cue — Hospital Overcrowding & Ambulance Command" },
      {
        name: "description",
        content:
          "Sign in to Queue Cue to view live hospital bed availability, risk forecasts and ambulance dispatch across Delhi.",
      },
      { property: "og:title", content: "Queue Cue — Hospital Overcrowding & Ambulance Command" },
      {
        property: "og:description",
        content: "Role-based dashboards for patients, ambulance crews, hospital admins and central command.",
      },
    ],
  }),
  component: WelcomePage,
});

function WelcomePage() {
  const { session, signIn, lang, toggleLang, t } = useQc();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (session) void navigate({ to: roleHome[session.role], replace: true });
  }, [session, navigate]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const result = signIn(username, password);
    if (!result.ok || !result.role) {
      setError(t("Invalid username or password", "गलत उपयोगकर्ता नाम या पासवर्ड"));
      return;
    }
    setError("");
    void navigate({ to: roleHome[result.role], replace: true });
  }

  return (
    <div className="min-h-screen">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-4 border-pop bg-primary px-5 py-3 text-primary-foreground">
        <h1 className="text-2xl font-bold tracking-wide">Queue Cue</h1>
        <button
          type="button"
          onClick={toggleLang}
          className="rounded-full bg-card px-3 py-1.5 text-sm font-bold text-card-foreground hover:bg-accent"
        >
          {lang === "en" ? "EN → हिंदी" : "हिंदी → EN"}
        </button>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 p-6 md:grid-cols-[1.1fr_1fr]">
        <section>
          <h2 className="text-3xl font-bold">
            {t("Welcome to Queue Cue", "क्यू क्यू में आपका स्वागत है")}
          </h2>
          <p className="mt-3 max-w-prose">
            {t(
              "Live hospital overcrowding intelligence and ambulance routing for Delhi. Sign in with your username and password to open your dashboard.",
              "दिल्ली के लिए अस्पताल भीड़भाड़ की लाइव जानकारी और एम्बुलेंस मार्गनिर्देशन। अपना डैशबोर्ड खोलने के लिए उपयोगकर्ता नाम और पासवर्ड से साइन इन करें।",
            )}
          </p>

          <div className="qc-card mt-5 p-4">
            <h3 className="font-bold">{t("Profiles", "प्रोफ़ाइल")}</h3>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• {t("Patient — find hospitals, forecasts, request an ambulance", "मरीज़ — अस्पताल खोजें, पूर्वानुमान, एम्बुलेंस बुक करें")}</li>
              <li>• {t("Ambulance crew — accept and complete assigned trips", "एम्बुलेंस चालक — सौंपे गए कॉल स्वीकार व पूर्ण करें")}</li>
              <li>• {t("Hospital administration — update bed availability in real time", "अस्पताल प्रशासन — बिस्तर उपलब्धता रीयल टाइम अपडेट करें")}</li>
              <li>• {t("Central administrator — monitor and dispatch ambulances", "केंद्रीय प्रशासक — एम्बुलेंस निगरानी व प्रेषण")}</li>
            </ul>
          </div>

          <div className="qc-card mt-4 p-4">
            <h3 className="font-bold">{t("Demo credentials", "डेमो लॉगिन")}</h3>
            <table className="mt-2 w-full text-sm">
              <thead>
                <tr className="bg-accent text-accent-foreground">
                  <th className="p-1.5 text-left">{t("Profile", "प्रोफ़ाइल")}</th>
                  <th className="p-1.5 text-left">{t("Username", "उपयोगकर्ता नाम")}</th>
                  <th className="p-1.5 text-left">{t("Password", "पासवर्ड")}</th>
                </tr>
              </thead>
              <tbody>
                {ACCOUNTS.map((a) => (
                  <tr key={a.username} className="border-b border-border">
                    <td className="p-1.5">{a.role}</td>
                    <td className="p-1.5">{a.username}</td>
                    <td className="p-1.5">{a.password}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="qc-card h-fit p-5">
          <h3 className="text-xl font-bold">{t("Sign in", "साइन इन")}</h3>
          <form onSubmit={handleSubmit} className="mt-3 space-y-3">
            <div>
              <label htmlFor="username" className="block text-sm">
                {t("Username", "उपयोगकर्ता नाम")}
              </label>
              <input
                id="username"
                value={username}
                autoComplete="username"
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm">
                {t("Password", "पासवर्ड")}
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2"
              />
            </div>
            {error ? (
              <p className="rounded-md bg-destructive px-3 py-2 text-sm text-destructive-foreground">{error}</p>
            ) : null}
            <button
              type="submit"
              className="w-full rounded-md bg-primary px-3 py-2.5 font-bold text-primary-foreground hover:bg-secondary"
            >
              {t("Sign in", "साइन इन")}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
