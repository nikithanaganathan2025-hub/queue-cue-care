/**
 * Queue Cue client store (auth + live operational state).
 *
 * BACKEND HOOKUP GUIDE
 * --------------------
 * Every mutation below is a single function that currently updates local state
 * and persists it to localStorage. To attach your backend:
 *   1. signIn()          -> POST /auth/login, store the returned user/token.
 *   2. loadState()       -> GET /hospitals, /ambulances, /requests.
 *   3. updateHospital()  -> PATCH /hospitals/:id
 *   4. dispatchAmbulance / setAmbulanceStatus / createRequest / updateRequest
 *                        -> the matching POST/PATCH endpoint.
 * The UI only calls these functions, so nothing else has to change.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ACCOUNTS,
  FALLBACK_CENTER,
  SEED_AMBULANCES,
  SEED_HOSPITALS,
  SEED_REQUESTS,
  type Account,
  type Ambulance,
  type AmbulanceRequest,
  type AmbulanceStatus,
  type Hospital,
  type Lang,
  type RequestStatus,
} from "./data";

interface Session {
  username: string;
  role: Account["role"];
  name: string;
  hospitalId?: string;
  ambulanceId?: string;
}

interface QcState {
  hospitals: Hospital[];
  ambulances: Ambulance[];
  requests: AmbulanceRequest[];
}

interface QcContextValue extends QcState {
  session: Session | null;
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  t: (en: string, hi: string) => string;
  signIn: (username: string, password: string) => { ok: boolean; role?: Account["role"]; error?: string };
  signOut: () => void;
  updateHospital: (id: string, patch: Partial<Hospital>) => void;
  createRequest: (input: { patientName: string; note: string; hospitalId: string; patientLoc?: { lat: number; lng: number } }) => AmbulanceRequest;
  updateRequestStatus: (id: string, status: RequestStatus) => void;
  dispatchAmbulance: (ambulanceId: string, requestId: string) => void;
  setAmbulanceStatus: (ambulanceId: string, status: AmbulanceStatus) => void;
  resetDemoData: () => void;
}

const STATE_KEY = "queue-cue:state:v1";
const SESSION_KEY = "queue-cue:session:v1";
const LANG_KEY = "queue-cue:lang:v1";

const seed = (): QcState => ({
  hospitals: structuredClone(SEED_HOSPITALS),
  ambulances: structuredClone(SEED_AMBULANCES),
  requests: structuredClone(SEED_REQUESTS),
});

const QcContext = createContext<QcContextValue | null>(null);

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota errors */
  }
}

export function QcProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<QcState>(seed);
  const [session, setSession] = useState<Session | null>(null);
  const [lang, setLangState] = useState<Lang>("en");
  const hydrated = useRef(false);

  // Hydrate after mount so SSR and the first client render match.
  useEffect(() => {
    setState(read<QcState>(STATE_KEY, seed()));
    setSession(read<Session | null>(SESSION_KEY, null));
    setLangState(read<Lang>(LANG_KEY, "en"));
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (hydrated.current) write(STATE_KEY, state);
  }, [state]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    write(LANG_KEY, l);
  }, []);

  const toggleLang = useCallback(() => setLang(lang === "en" ? "hi" : "en"), [lang, setLang]);

  const t = useCallback((en: string, hi: string) => (lang === "hi" ? hi : en), [lang]);

  const signIn = useCallback((username: string, password: string) => {
    // BACKEND HOOKUP: replace with `await fetch('/api/auth/login', ...)`.
    const account = ACCOUNTS.find(
      (a) => a.username.toLowerCase() === username.trim().toLowerCase() && a.password === password,
    );
    if (!account) return { ok: false, error: "Invalid username or password" };
    const next: Session = {
      username: account.username,
      role: account.role,
      name: account.name,
      ...(account.hospitalId ? { hospitalId: account.hospitalId } : {}),
      ...(account.ambulanceId ? { ambulanceId: account.ambulanceId } : {}),
    };
    setSession(next);
    write(SESSION_KEY, next);
    return { ok: true, role: account.role };
  }, []);

  const signOut = useCallback(() => {
    setSession(null);
    write(SESSION_KEY, null);
  }, []);

  const updateHospital = useCallback((id: string, patch: Partial<Hospital>) => {
    // BACKEND HOOKUP: PATCH /hospitals/:id then refresh.
    setState((s) => ({
      ...s,
      hospitals: s.hospitals.map((h) => (h.id === id ? { ...h, ...patch } : h)),
    }));
  }, []);

  const createRequest = useCallback<QcContextValue["createRequest"]>((input) => {
    const request: AmbulanceRequest = {
      id: "req" + Date.now().toString(36),
      patientName: input.patientName,
      note: input.note,
      hospitalId: input.hospitalId,
      patientLoc: input.patientLoc ?? FALLBACK_CENTER,
      ambulanceId: null,
      status: "pending",
      createdAt: Date.now(),
    };
    // BACKEND HOOKUP: POST /requests
    setState((s) => ({ ...s, requests: [request, ...s.requests] }));
    return request;
  }, []);

  const updateRequestStatus = useCallback((id: string, status: RequestStatus) => {
    // BACKEND HOOKUP: PATCH /requests/:id
    setState((s) => {
      const requests = s.requests.map((r) => (r.id === id ? { ...r, status } : r));
      const target = requests.find((r) => r.id === id);
      const ambulances = s.ambulances.map((a) => {
        if (!target || a.id !== target.ambulanceId) return a;
        if (status === "accepted") return { ...a, status: "en_route" as AmbulanceStatus };
        if (status === "completed") return { ...a, status: "available" as AmbulanceStatus, requestId: null };
        return a;
      });
      return { ...s, requests, ambulances };
    });
  }, []);

  const dispatchAmbulance = useCallback((ambulanceId: string, requestId: string) => {
    // BACKEND HOOKUP: POST /dispatch { ambulanceId, requestId }
    setState((s) => ({
      ...s,
      ambulances: s.ambulances.map((a) =>
        a.id === ambulanceId ? { ...a, status: "dispatched", requestId } : a.requestId === requestId ? { ...a, requestId: null, status: "available" } : a,
      ),
      requests: s.requests.map((r) => (r.id === requestId ? { ...r, ambulanceId, status: "assigned" } : r)),
    }));
  }, []);

  const setAmbulanceStatus = useCallback((ambulanceId: string, status: AmbulanceStatus) => {
    // BACKEND HOOKUP: PATCH /ambulances/:id
    setState((s) => ({
      ...s,
      ambulances: s.ambulances.map((a) => (a.id === ambulanceId ? { ...a, status } : a)),
    }));
  }, []);

  const resetDemoData = useCallback(() => setState(seed()), []);

  const value = useMemo<QcContextValue>(
    () => ({
      ...state,
      session,
      lang,
      setLang,
      toggleLang,
      t,
      signIn,
      signOut,
      updateHospital,
      createRequest,
      updateRequestStatus,
      dispatchAmbulance,
      setAmbulanceStatus,
      resetDemoData,
    }),
    [
      state,
      session,
      lang,
      setLang,
      toggleLang,
      t,
      signIn,
      signOut,
      updateHospital,
      createRequest,
      updateRequestStatus,
      dispatchAmbulance,
      setAmbulanceStatus,
      resetDemoData,
    ],
  );

  return <QcContext.Provider value={value}>{children}</QcContext.Provider>;
}

export function useQc() {
  const ctx = useContext(QcContext);
  if (!ctx) throw new Error("useQc must be used inside <QcProvider>");
  return ctx;
}
