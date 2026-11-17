"use client";

import { ArrowLeft, ArrowRight, Check, ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "@/lib/router";
import { ConditionsSheet } from "../components/ConditionsSheet";
import { PlanExplorer } from "../components/FloorPlan";
import { PlanEditor } from "../components/PlanEditor";
import { Button, Container, Eyebrow, Folio, Segmented } from "../components/ui";
import { fieldClass } from "../components/WaitlistForm";
import { CONDITION_ORDER, CONDITIONS } from "../data/conditions";
import { ZONES } from "../data/listings";
import { area as roomArea, ROOM_TYPES } from "../data/rooms";
import type {
  Condition,
  ConditionStatus,
  Floor,
  Included,
  PropertyType,
} from "../data/types";
import { DURATIONS, type DurationKey } from "../lib/durations";
import { cx, isoDay, m2, money } from "../lib/format";
import { uploadPhoto } from "../lib/upload";
import { photoUrl } from "../lib/photos";
import { useStore } from "../lib/store";

type StepKey = "datos" | "plano" | "condiciones" | "precios" | "revisar";

const STEPS: { key: StepKey; n: string; label: string }[] = [
  { key: "datos", n: "01", label: "Datos básicos" },
  { key: "plano", n: "02", label: "Plano y fotos" },
  { key: "condiciones", n: "03", label: "Condiciones y reglas" },
  { key: "precios", n: "04", label: "Plazos y precios" },
  { key: "revisar", n: "05", label: "Revisar y enviar" },
];

const TYPES: PropertyType[] = ["Casa", "Apartamento", "Loft", "Cabaña", "Penthouse", "Estudio"];
const COVERS = [
  "laderaAgave",
  "casaPiscinaPatio",
  "patioVoladizo",
  "entradaPiedra",
  "edificioBalcones",
  "fachadaColonial",
];

/** Centro aproximado de cada departamento, para ubicar el anuncio en el mapa. */
const DEPARTMENTS: Record<string, [number, number]> = {
  Ahuachapán: [13.921, -89.845],
  Cabañas: [13.864, -88.749],
  Chalatenango: [14.04, -88.938],
  Cuscatlán: [13.718, -88.933],
  "La Libertad": [13.677, -89.29],
  "La Paz": [13.509, -88.868],
  "La Unión": [13.337, -87.844],
  Morazán: [13.697, -88.105],
  "San Miguel": [13.481, -88.178],
  "San Salvador": [13.699, -89.191],
  "San Vicente": [13.641, -88.785],
  "Santa Ana": [13.994, -89.557],
  Sonsonate: [13.719, -89.724],
  Usulután: [13.346, -88.44],
};

/** Zonas conocidas: su departamento y su punto en el mapa. */
const ZONE_INFO: Record<string, { region: string; at: [number, number] }> = {
  "Santa Tecla": { region: "La Libertad", at: [13.674, -89.29] },
  "San Salvador": { region: "San Salvador", at: [13.699, -89.191] },
  "San Benito": { region: "San Salvador", at: [13.692, -89.238] },
  "Antiguo Cuscatlán": { region: "La Libertad", at: [13.673, -89.24] },
  "Centro Histórico": { region: "San Salvador", at: [13.698, -89.191] },
  "El Tunco": { region: "La Libertad", at: [13.493, -89.382] },
  "Lago de Coatepeque": { region: "Santa Ana", at: [13.866, -89.553] },
  Suchitoto: { region: "Cuscatlán", at: [13.938, -89.028] },
  "Concepción de Ataco": { region: "Ahuachapán", at: [13.87, -89.848] },
};

const OTHER = "__otra__";

function starterFloors(): Floor[] {
  return [
    {
      id: "pb",
      name: "Planta única",
      width: 14,
      height: 10,
      rooms: [
        {
          id: "s1",
          type: "sala",
          name: "Sala",
          x: 0,
          y: 0,
          w: 5.5,
          h: 4.5,
          photos: [],
          features: ["Luz natural", "Ventilador de techo"],
        },
        {
          id: "s2",
          type: "comedor",
          name: "Comedor",
          x: 5.5,
          y: 0,
          w: 3.5,
          h: 4.5,
          photos: [],
          features: ["Mesa para 6"],
        },
        {
          id: "s3",
          type: "cocina",
          name: "Cocina",
          x: 9,
          y: 0,
          w: 5,
          h: 4.5,
          photos: [],
          features: ["Estufa de gas", "Refrigeradora"],
        },
        {
          id: "s4",
          type: "dormitorio",
          name: "Dormitorio principal",
          x: 0,
          y: 4.5,
          w: 4.5,
          h: 4,
          photos: [],
          features: ["Cama king", "Clóset", "Aire acondicionado"],
        },
        {
          id: "s5",
          type: "dormitorio",
          name: "Dormitorio 2",
          x: 4.5,
          y: 4.5,
          w: 4,
          h: 4,
          photos: [],
          features: ["Cama queen", "Clóset"],
        },
        {
          id: "s6",
          type: "bano",
          name: "Baño",
          x: 8.5,
          y: 4.5,
          w: 2.5,
          h: 2.5,
          photos: [],
          features: ["Ducha", "Agua caliente"],
        },
        {
          id: "s7",
          type: "terraza",
          name: "Terraza",
          x: 8.5,
          y: 7,
          w: 5.5,
          h: 3,
          photos: [],
          features: ["Techada", "Hamacas"],
          
        },
      ],
    },
  ];
}

function starterConditions(): Condition[] {
  return [
    {
      key: "amueblado",
      status: "si",
      value: "Amueblada",
      detail: "Lista para entrar, con cocina equipada y ropa de cama.",
    },
    { key: "mascotas", status: "si", value: "Sí, hasta 2", detail: "Perros o gatos bienvenidos." },
    { key: "invitados", status: "si", value: "Sí", detail: "Hasta 3 noches seguidas sin avisar." },
    {
      key: "fumar",
      status: "parcial",
      value: "Solo en la terraza",
      detail: "Dentro de la casa, no.",
    },
    {
      key: "negocio",
      status: "parcial",
      value: "Oficina en casa",
      detail: "Trabajo remoto sí; atención al público no.",
    },
    {
      key: "eventos",
      status: "parcial",
      value: "Reuniones pequeñas",
      detail: "Hasta 12 personas y hasta las 22:00.",
    },
    { key: "ninos", status: "si", value: "Sí" },
    { key: "silencio", status: "parcial", value: "22:00 – 7:00" },
    { key: "estacionamiento", status: "si", value: "2 vehículos", detail: "Cochera techada." },
    { key: "accesibilidad", status: "si", value: "Una sola planta" },
    { key: "subarriendo", status: "no", value: "No" },
  ];
}

export function Publish() {
  const { rememberMine } = useStore();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const stepParam = params.get("paso") as StepKey | null;
  const step: StepKey = STEPS.some((s) => s.key === stepParam) ? stepParam! : "datos";
  const stepIndex = STEPS.findIndex((s) => s.key === step);

  const [title, setTitle] = useState("");
  const [type, setType] = useState<PropertyType>("Casa");
  const [zone, setZone] = useState("Santa Tecla");
  const [otherZone, setOtherZone] = useState("");
  const [department, setDepartment] = useState("San Salvador");
  const [cover, setCover] = useState("laderaAgave");
  const [coverBusy, setCoverBusy] = useState(false);
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactWhatsapp, setContactWhatsapp] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [problems, setProblems] = useState<string[]>([]);
  const [floors, setFloors] = useState<Floor[]>(starterFloors);
  const [conditions, setConditions] = useState<Condition[]>(starterConditions);
  const [rules, setRules] = useState<string[]>([]);
  const [newRule, setNewRule] = useState("");
  const [prices, setPrices] = useState<Partial<Record<DurationKey, number>>>({ mes: 0 });
  const [deposit, setDeposit] = useState(0);
  const [includes, setIncludes] = useState<Included[]>([
    { label: "Agua", included: false },
    { label: "Luz", included: false },
    { label: "Internet", included: false },
    { label: "Vigilancia o cuota de la colonia", included: false },
    { label: "Muebles", included: false },
    { label: "Parqueo", included: false },
  ]);

  function go(next: StepKey) {
    setParams({ paso: next });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const allRooms = floors.flatMap((f) => f.rooms);
  const bedrooms = allRooms.filter((r) => r.type === "dormitorio").length;
  const bathrooms = Math.max(1, allRooms.filter((r) => r.type === "bano").length);
  const computedArea = Math.round(
    allRooms.reduce((s, r) => s + (ROOM_TYPES[r.type].outdoor ? 0 : roomArea(r)), 0),
  );

  function updateCondition(key: Condition["key"], patch: Partial<Condition>) {
    setConditions((list) =>
      list.map((c) => {
        if (c.key !== key) return c;
        const next = { ...c, ...patch };
        if (patch.status && !patch.value) next.value = CONDITIONS[key].defaults[patch.status];
        return next;
      }),
    );
  }

  function toggleDuration(k: DurationKey, enabled: boolean) {
    setPrices((p) => {
      const copy = { ...p };
      if (!enabled) delete copy[k];
      else copy[k] = 0;
      return copy;
    });
  }

  async function onCover(file: File | undefined) {
    if (!file) return;
    setCoverBusy(true);
    try {
      setCover(await uploadPhoto(file));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo subir la foto.");
    } finally {
      setCoverBusy(false);
    }
  }

  const zoneName = zone === OTHER ? otherZone.trim() : zone;
  const known = ZONE_INFO[zone];
  const region = known?.region ?? department;

  /** Lo que falta para poder enviar, en palabras de quien publica. */
  function missing() {
    const list: string[] = [];
    const offered = Object.values(prices);
    if (title.trim().length < 3) list.push("Ponle un nombre a la propiedad (paso 1).");
    if (zoneName.length < 2) list.push("Escribe la zona o el municipio (paso 1).");
    if (summary.trim().length < 10) list.push("Describe la propiedad en una frase (paso 1).");
    if (contactName.trim().length < 2) list.push("Escribe tu nombre de contacto (paso 1).");
    if (!/^\+?[0-9\s\-]{8,20}$/.test(contactWhatsapp.trim()))
      list.push("Escribe un WhatsApp válido para que te contacten (paso 1).");
    if (contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim()))
      list.push("Revisa el correo de contacto (paso 1).");
    if (offered.length === 0) list.push("Activa al menos un plazo con su precio (paso 4).");
    else if (offered.some((v) => !v || v < 1))
      list.push("Pon el precio de cada plazo que activaste (paso 4).");
    if (conditions.some((c) => !c.value.trim()))
      list.push("Responde las once condiciones (paso 3).");
    return list;
  }

  async function finish() {
    const list = missing();
    setProblems(list);
    if (list.length) {
      go("revisar");
      return;
    }
    const [lat, lng] = known?.at ?? DEPARTMENTS[department] ?? DEPARTMENTS["San Salvador"];
    const clean = (src: string) => !/^(blob:|data:)/.test(src);
    const payload = {
      title: title.trim(),
      type,
      zone: zoneName,
      region,
      lat: lat + (Math.random() - 0.5) * 0.012,
      lng: lng + (Math.random() - 0.5) * 0.012,
      cover: clean(cover) ? cover : "entradaPiedra",
      summary: summary.trim(),
      description: description.trim(),
      prices,
      deposit,
      includes: includes.filter((i) => i.label.trim()),
      conditions: conditions.map((c) => ({ ...c, detail: c.detail?.trim() || undefined })),
      rules,
      floors: floors.map((f) => ({
        ...f,
        rooms: f.rooms.map((r) => ({
          ...r,
          photos: r.photos.filter(clean),
          view: r.view
            ? { label: r.view.label, photo: r.view.photo && clean(r.view.photo) ? r.view.photo : undefined }
            : undefined,
        })),
      })),
      availableFrom: isoDay(new Date()),
      plan: "gratis",
      contact: {
        name: contactName.trim(),
        whatsapp: contactWhatsapp.trim(),
        email: contactEmail.trim(),
      },
    };

    setSending(true);
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as {
        id?: string;
        ownerToken?: string;
        error?: string;
      };
      if (!res.ok || !data.id || !data.ownerToken) {
        throw new Error(data.error ?? "No pudimos guardar tu anuncio. Intenta de nuevo.");
      }
      rememberMine({ id: data.id, token: data.ownerToken });
      toast.success("Anuncio enviado. Lo revisamos antes de publicarlo.");
      navigate(`/casa/${data.id}`);
    } catch (error) {
      setProblems([error instanceof Error ? error.message : "No pudimos guardar tu anuncio."]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      {/* Header band */}
      <section className="on-dark dots bg-negro pb-8 pt-8 text-crema-100">
        <Container>
          <Folio
            left="Publicar una propiedad"
            right="Publicar es gratis. Siempre."
            tone="dark"
          />
          <div className="mt-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <h1 className="serif text-[42px] leading-[0.98] sm:text-[54px]">
                Arma el plano, responde las condiciones y <em className="text-terracota-300">listo.</em>
              </h1>
            </div>
            <p className="shrink-0 text-[14px] tabular-nums text-piedra-300">
              Paso {STEPS[stepIndex].n} de 05 · {m2(computedArea)} en el plano
            </p>
          </div>

          <nav
            aria-label="Pasos para publicar"
            className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5"
          >
            {STEPS.map((s, i) => {
              const active = s.key === step;
              const done = i < stepIndex;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => go(s.key)}
                  aria-current={active ? "step" : undefined}
                  className={cx(
                    "flex flex-col rounded-ctl p-3 text-left ring-1 transition-colors",
                    active
                      ? "bg-crema-100 text-negro ring-crema-100"
                      : done
                        ? "bg-crema-100/[0.08] text-crema-100 ring-crema-100/25 hover:bg-crema-100/12"
                        : "bg-crema-100/[0.04] text-piedra-300 ring-crema-100/12 hover:text-crema-100",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cx(
                        "label-sm",
                        active ? "text-terracota-700" : "text-terracota-300",
                      )}
                    >
                      {s.n}
                    </span>
                    {done && <Check className="size-3.5" />}
                  </div>
                  <span className="mt-1 text-[14px] font-semibold">{s.label}</span>
                </button>
              );
            })}
          </nav>
        </Container>
      </section>

      <Container className="py-10 lg:py-14">
        {/* ——— STEP 1: BASIC DATA ——— */}
        {step === "datos" && (
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-14">
            <div className="space-y-6 rounded-card bg-crema-050 p-6 ring-1 ring-arena-200 sm:p-8">
              <Eyebrow index="01">Datos básicos</Eyebrow>
              <h2 className="head text-[28px]">Cómo se llama y dónde está.</h2>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="text-[14px] font-medium text-grafito-700">Nombre de la propiedad</span>
                  <input
                    type="text"
                    value={title}
                    maxLength={80}
                    placeholder="Ej.: Casa en Residencial Las Jacarandas"
                    onChange={(e) => setTitle(e.target.value)}
                    className={fieldClass}
                  />
                </label>

                <label className="block">
                  <span className="text-[14px] font-medium text-grafito-700">Tipo</span>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as PropertyType)}
                    className={fieldClass}
                  >
                    {TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-[14px] font-medium text-grafito-700">Zona</span>
                  <select value={zone} onChange={(e) => setZone(e.target.value)} className={fieldClass}>
                    {ZONES.map((z) => (
                      <option key={z} value={z}>
                        {z}
                      </option>
                    ))}
                    <option value={OTHER}>Otra zona o municipio…</option>
                  </select>
                </label>

                {zone === OTHER && (
                  <>
                    <label className="block">
                      <span className="text-[14px] font-medium text-grafito-700">
                        Zona, colonia o municipio
                      </span>
                      <input
                        type="text"
                        value={otherZone}
                        maxLength={60}
                        placeholder="Ej.: Colonia Escalón"
                        onChange={(e) => setOtherZone(e.target.value)}
                        className={fieldClass}
                      />
                    </label>
                    <label className="block">
                      <span className="text-[14px] font-medium text-grafito-700">Departamento</span>
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className={fieldClass}
                      >
                        {Object.keys(DEPARTMENTS).map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                )}

                <label className="block sm:col-span-2">
                  <span className="text-[14px] font-medium text-grafito-700">En una frase</span>
                  <input
                    type="text"
                    value={summary}
                    maxLength={200}
                    placeholder="Ej.: Casa de una planta con terraza y jardín cerrado."
                    onChange={(e) => setSummary(e.target.value)}
                    className={fieldClass}
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="text-[14px] font-medium text-grafito-700">
                    Descripción honesta (incluye lo que un inquilino agradecería saber antes)
                  </span>
                  <textarea
                    rows={4}
                    value={description}
                    maxLength={3000}
                    onChange={(e) => setDescription(e.target.value)}
                    className={`${fieldClass} h-auto py-3 leading-relaxed`}
                  />
                </label>
              </div>

              <div className="border-t border-arena-200 pt-6">
                <h3 className="head text-[22px]">Cómo te contactan.</h3>
                <p className="mt-1.5 text-[15px] leading-snug text-grafito-600">
                  Tu WhatsApp no aparece en el anuncio: solo lo ve quien ya te envió un mensaje
                  desde tu ficha.
                </p>
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-[14px] font-medium text-grafito-700">Tu nombre</span>
                    <input
                      type="text"
                      autoComplete="name"
                      value={contactName}
                      maxLength={80}
                      onChange={(e) => setContactName(e.target.value)}
                      className={fieldClass}
                    />
                  </label>
                  <label className="block">
                    <span className="text-[14px] font-medium text-grafito-700">WhatsApp</span>
                    <input
                      type="tel"
                      autoComplete="tel"
                      placeholder="+503 7000 0000"
                      value={contactWhatsapp}
                      onChange={(e) => setContactWhatsapp(e.target.value)}
                      className={fieldClass}
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="text-[14px] font-medium text-grafito-700">
                      Correo (opcional)
                    </span>
                    <input
                      type="email"
                      autoComplete="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className={fieldClass}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="rounded-card bg-crema-050 p-6 ring-1 ring-arena-200 sm:p-8">
              <div className="flex items-center justify-between">
                <Eyebrow>Foto principal</Eyebrow>
                <label className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 text-[14px] font-semibold text-terracota-700 underline underline-offset-4">
                  {coverBusy ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ImagePlus className="size-4" />
                  )}
                  {coverBusy ? "Subiendo…" : "Subir la mía"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={coverBusy}
                    onChange={(e) => {
                      onCover(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                    className="sr-only"
                  />
                </label>
              </div>
              <p className="mt-1 text-[14px] text-grafito-600">
                Sin texto ni filtros encima: la foto va limpia.
              </p>
              <div className="mt-4 aspect-[4/3] overflow-hidden rounded-card bg-arena-200">
                <img src={photoUrl(cover, 900, 675)} alt="" className="size-full object-cover" />
              </div>
              <p className="mt-4 text-[14px] text-grafito-600">O usa una foto de muestra mientras tanto</p>
              <div className="mt-2 grid grid-cols-6 gap-2">
                {COVERS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCover(c)}
                    className={cx(
                      "aspect-[4/3] overflow-hidden rounded-[3px] ring-offset-2 ring-offset-crema-050",
                      cover === c ? "ring-2 ring-negro" : "opacity-70 hover:opacity-100",
                    )}
                  >
                    <img src={photoUrl(c, 180, 135)} alt="" className="size-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ——— STEP 2: FLOOR PLAN EDITOR ——— */}
        {step === "plano" && (
          <div>
            <div className="mb-6">
              <Eyebrow index="02">El plano de la casa</Eyebrow>
              <h2 className="head mt-2 text-[32px]">
                Arrastra cada espacio, pon sus metros y sube sus fotos.
              </h2>
            </div>
            <PlanEditor
              floors={floors}
              onChange={setFloors}
              onReset={() => setFloors(starterFloors())}
              title={title}
            />
          </div>
        )}

        {/* ——— STEP 3: THE 11 CONDITIONS + HOUSE RULES ——— */}
        {step === "condiciones" && (
          <div className="space-y-12">
            <div>
              <Eyebrow index="03">Las once condiciones</Eyebrow>
              <h2 className="head mt-2 text-[32px]">Dilo todo desde el principio.</h2>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {CONDITION_ORDER.map((key) => {
                  const meta = CONDITIONS[key];
                  const current = conditions.find((c) => c.key === key)!;
                  return (
                    <div key={key} className="rounded-card bg-crema-050 p-5 ring-1 ring-arena-200">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="text-[14px] font-medium text-terracota-700">{meta.label}</span>
                          <p className="mt-0.5 text-[15px] font-semibold">{meta.question}</p>
                        </div>
                        <Segmented
                          label={meta.question}
                          size="sm"
                          value={current.status}
                          onChange={(status: ConditionStatus) =>
                            updateCondition(key, { status, value: meta.defaults[status] })
                          }
                          options={[
                            { value: "si", label: meta.options.si },
                            { value: "parcial", label: meta.options.parcial },
                            { value: "no", label: meta.options.no },
                          ]}
                        />
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-[0.42fr_0.58fr]">
                        <input
                          type="text"
                          value={current.value}
                          onChange={(e) => updateCondition(key, { value: e.target.value })}
                          placeholder="Resumen corto"
                          aria-label={`Resumen para ${meta.label}`}
                          className="h-11 rounded-ctl bg-crema-100 px-3 text-[15px] font-medium ring-1 ring-piedra-250 outline-none focus:ring-negro"
                        />
                        <input
                          type="text"
                          value={current.detail ?? ""}
                          onChange={(e) =>
                            updateCondition(key, { detail: e.target.value || undefined })
                          }
                          placeholder="Detalle o condición (opcional)"
                          aria-label={`Detalle para ${meta.label}`}
                          className="h-11 rounded-ctl bg-crema-100 px-3 text-[15px] ring-1 ring-piedra-250 outline-none focus:ring-negro"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-card bg-crema-050 p-6 ring-1 ring-arena-200 sm:p-8">
              <Eyebrow>Reglas de convivencia</Eyebrow>
              <h3 className="head mt-2 text-[24px]">Lo cotidiano que conviene saber antes.</h3>
              <ul className="mt-4 space-y-2">
                {rules.map((r, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-3 rounded-ctl bg-crema-100 px-3.5 py-2.5 text-[14px]"
                  >
                    <span>
                      <strong className="mono mr-2 text-[14px] text-terracota-700">{String(i + 1).padStart(2, "0")}</strong>
                      {r}
                    </span>
                    <button
                      type="button"
                      onClick={() => setRules(rules.filter((_, idx) => idx !== i))}
                      aria-label="Quitar regla"
                      className="text-grafito-600 hover:text-error"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  placeholder="Añadir una regla (ej.: días del camión de basura)…"
                  className="h-10 flex-1 rounded-ctl bg-crema-100 px-3.5 text-[14px] ring-1 ring-piedra-250 outline-none focus:ring-negro"
                />
                <Button
                  variant="ink"
                  size="sm"
                  onClick={() => {
                    if (!newRule.trim()) return;
                    setRules([...rules, newRule.trim()]);
                    setNewRule("");
                  }}
                >
                  <Plus className="size-4" /> Añadir
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ——— STEP 4: DURATIONS & PRICES ——— */}
        {step === "precios" && (
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-14">
            <div className="space-y-6 rounded-card bg-crema-050 p-6 ring-1 ring-arena-200 sm:p-8">
              <Eyebrow index="04">Duración y precios</Eyebrow>
              <h2 className="head text-[28px]">Elige qué plazos aceptas y pon el total.</h2>
              <p className="text-[16px] text-grafito-700">
                Pon el total que paga quien alquila. AlquilasYa no cobra comisión ni recibe el
                dinero: el pago lo acuerdas tú directamente.
              </p>

              <div className="space-y-3 border-t border-arena-200 pt-5">
                {DURATIONS.map((d) => {
                  const enabled = prices[d.key] !== undefined;
                  return (
                    <div
                      key={d.key}
                      className={cx(
                        "flex flex-wrap items-center justify-between gap-4 rounded-ctl p-4 ring-1",
                        enabled ? "bg-crema-100 ring-negro" : "bg-arena-200/60 ring-piedra-250",
                      )}
                    >
                      <label className="flex cursor-pointer items-center gap-3">
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={(e) => toggleDuration(d.key, e.target.checked)}
                          className="size-4 accent-negro"
                        />
                        <div>
                          <span className="text-[15px] font-semibold">{d.label}</span>
                          <span className="block text-[14px] text-grafito-600">{d.contract}</span>
                        </div>
                      </label>

                      {enabled ? (
                        <label className="inline-flex items-center gap-2">
                          <span className="text-[14px] text-grafito-600">USD por {d.unit}:</span>
                          <input
                            type="number"
                            min={1}
                            step={5}
                            value={prices[d.key] || ""}
                            placeholder="0"
                            onChange={(e) =>
                              setPrices({ ...prices, [d.key]: Number(e.target.value) || 0 })
                            }
                            className="h-10 w-28 rounded-ctl bg-crema-050 px-3 text-right text-[16px] font-semibold tabular-nums ring-1 ring-piedra-250"
                          />
                        </label>
                      ) : (
                        <span className="text-[14px] text-grafito-600">No se ofrece</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-arena-200 pt-5">
                <label className="block max-w-xs">
                  <span className="text-[14px] font-medium text-grafito-700">
                    Depósito reembolsable (USD)
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={25}
                    value={deposit || ""}
                    placeholder="0"
                    onChange={(e) => setDeposit(Number(e.target.value) || 0)}
                    className={`${fieldClass} font-semibold tabular-nums`}
                  />
                </label>
              </div>
            </div>

            <div className="rounded-card bg-crema-050 p-6 ring-1 ring-arena-200 sm:p-8">
              <Eyebrow>Qué incluye ese total</Eyebrow>
              <h3 className="head mt-2 text-[22px]">Marca lo que va dentro del precio.</h3>
              <ul className="mt-4 divide-y divide-arena-200 border-y border-arena-200">
                {includes.map((inc, i) => (
                  <li key={inc.label} className="flex items-center justify-between gap-3 py-3">
                    <label className="flex cursor-pointer items-center gap-2.5 text-[15px] font-medium">
                      <input
                        type="checkbox"
                        checked={inc.included}
                        onChange={(e) =>
                          setIncludes(
                            includes.map((x, idx) =>
                              idx === i ? { ...x, included: e.target.checked } : x,
                            ),
                          )
                        }
                        className="size-4 accent-negro"
                      />
                      {inc.label}
                    </label>
                    <input
                      type="text"
                      value={inc.note ?? ""}
                      onChange={(e) =>
                        setIncludes(
                          includes.map((x, idx) =>
                            idx === i ? { ...x, note: e.target.value || undefined } : x,
                          ),
                        )
                      }
                      placeholder="Nota (opcional)"
                      className="h-10 w-36 rounded-ctl bg-crema-100 px-2.5 text-[14px] ring-1 ring-piedra-250 sm:w-44"
                    />
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-[14px] leading-snug text-grafito-600">
                Lo que no marques aparece en la ficha como «No incluido». Decirlo evita visitas
                perdidas.
              </p>
            </div>
          </div>
        )}

        {/* ——— STEP 6: REVIEW & PUBLISH ——— */}
        {step === "revisar" && (
          <div className="space-y-12">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <Eyebrow index="05">Revisión final</Eyebrow>
                <h2 className="head mt-2 text-[34px]">Así se verá tu anuncio.</h2>
                <p className="mt-2 max-w-[56ch] text-[16px] leading-relaxed text-grafito-700">
                  Al enviarlo lo revisamos antes de mostrarlo al público. Te avisamos por WhatsApp.
                </p>
              </div>
            </div>

            {problems.length > 0 && (
              <div role="alert" className="rounded-card bg-error-bg p-5 text-error">
                <p className="text-[16px] font-semibold">Falta esto para poder enviarlo:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px]">
                  {problems.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-card bg-crema-050 p-6 ring-1 ring-arena-200 sm:p-8">
              <div className="grid gap-6 md:grid-cols-[260px_1fr]">
                <img
                  src={photoUrl(cover, 600, 450)}
                  alt=""
                  className="aspect-[4/3] w-full rounded-card object-cover"
                />
                <div>
                  <p className="text-[14px] font-medium text-terracota-700">
                    {type} · {zoneName || "Zona por definir"} · {bedrooms} hab · {bathrooms}{" "}
                    {bathrooms === 1 ? "baño" : "baños"} · {m2(computedArea)}
                  </p>
                  <h3 className="serif mt-2 text-[36px] leading-none">{title || "Sin nombre todavía"}</h3>
                  <p className="mt-3 text-[15.5px] text-grafito-700">{summary}</p>
                  <div className="mt-4 flex flex-wrap gap-3 border-t border-arena-200 pt-4 text-[14px] tabular-nums">
                    {DURATIONS.filter((d) => prices[d.key]).map((d) => (
                      <span key={d.key} className="rounded-ctl bg-arena-200 px-3 py-1.5">
                        <strong>{money(prices[d.key]!)}</strong> / {d.unit} ({d.label})
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-10 border-t border-arena-200 pt-8">
                <h4 className="head text-[22px]">El plano que van a recorrer.</h4>
                <PlanExplorer floors={floors} context={title} dense className="mt-5" />
              </div>

              <div className="mt-10 border-t border-arena-200 pt-8">
                <h4 className="head text-[22px]">Las once condiciones, por escrito.</h4>
                <ConditionsSheet conditions={conditions} columns={2} className="mt-4" />
              </div>
            </div>
          </div>
        )}

        {/* Step navigation bar */}
        <div className="mt-12 flex items-center justify-between gap-3 border-t border-piedra-250/80 pt-6">
          {stepIndex > 0 ? (
            <Button variant="outline" onClick={() => go(STEPS[stepIndex - 1].key)}>
              <ArrowLeft className="size-4" />
              <span className="sm:hidden">Anterior</span>
              <span className="hidden sm:inline">Anterior: {STEPS[stepIndex - 1].label}</span>
            </Button>
          ) : (
            <span />
          )}
          {stepIndex < STEPS.length - 1 ? (
            <Button variant="ink" size="lg" onClick={() => go(STEPS[stepIndex + 1].key)}>
              <span className="sm:hidden">Siguiente</span>
              <span className="hidden sm:inline">Siguiente: {STEPS[stepIndex + 1].label}</span>
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button variant="primary" size="lg" onClick={finish} disabled={sending}>
              {sending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Enviando…
                </>
              ) : (
                <>
                  Enviar a revisión <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </Container>
    </div>
  );
}
