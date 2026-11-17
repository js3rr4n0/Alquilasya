"use client";

import { Clock, Copy, Eye, Lock } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "@/lib/router";
import {
  Avatar,
  Badge,
  Button,
  Container,
  Eyebrow,
  Folio,
  Segmented,
  Switch,
} from "../components/ui";
import { PEOPLE } from "../data/people";
import { RENTER } from "../data/renter";
import { money } from "../lib/format";
import { useStore } from "../lib/store";

export function Expediente() {
  const { privacy, setPrivacy, conversations, examples: listings } = useStore();
  const [params, setParams] = useSearchParams();
  const view = params.get("vista") === "propietario" ? "propietario" : "mia";
  const [copied, setCopied] = useState(false);
  const [revoked, setRevoked] = useState<string[]>([]);
  const sampleRent = 1250;
  const ratio = Math.round((sampleRent / RENTER.income.monthly) * 100);

  function setView(v: "mia" | "propietario") {
    if (v === "propietario") setParams({ vista: "propietario" }, { replace: true });
    else setParams({}, { replace: true });
  }

  function copyLink() {
    const url = `${window.location.origin}${window.location.pathname}?vista=propietario`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  const sharedWith = conversations.filter((c) => c.expedienteShared && !revoked.includes(c.id));

  return (
    <div>
      <div className="border-b border-piedra-250/80 bg-arena-200 px-5 py-2.5 text-center text-[14px] text-grafito-700">
        <strong className="font-semibold text-negro">Próximamente · demostración.</strong> Así será
        el perfil de inquilino. Daniela y sus datos son un ejemplo; hoy AlquilasYa no verifica
        documentos.
      </div>
      <section className="on-dark dots bg-negro pb-10 pt-8 text-crema-100">
        <Container>
          <Folio
            left="Perfil de inquilino"
            right="Datos de ejemplo"
            tone="dark"
          />

          <div className="mt-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <Avatar
                src={RENTER.photo}
                name={RENTER.name}
                size={76}
                className="ring-2 ring-crema-100/25"
              />
              <div>
                <p className="text-[14px] text-piedra-300">Lo que tú decides contar</p>
                <h1 className="serif mt-2 text-[42px] leading-[0.98] sm:text-[54px]">
                  {RENTER.name}
                </h1>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 sm:items-end">
              <Segmented
                label="Vista del expediente"
                tone="dark"
                value={view}
                onChange={setView}
                options={[
                  { value: "mia", label: "Mi vista" },
                  {
                    value: "propietario",
                    label: (
                      <span className="inline-flex items-center gap-1.5">
                        <Eye className="size-3.5" /> Vista del propietario
                      </span>
                    ),
                  },
                ]}
              />
            </div>
          </div>

          <p className="mt-8 max-w-[60ch] border-t border-crema-100/12 pt-6 text-[16px] leading-relaxed text-piedra-300">
            {RENTER.headline}
          </p>
        </Container>
      </section>

      {view === "propietario" && (
        <div className="border-b border-piedra-250/80 bg-arena-200">
          <Container className="flex flex-wrap items-center justify-between gap-3 py-3 text-[14px]">
            <p className="text-grafito-700">
              <strong className="font-semibold text-negro">Vista del propietario.</strong> Solo
              aparece lo que dejaste activo en tus controles de privacidad.
            </p>
            <button
              type="button"
              onClick={() => setView("mia")}
              className="font-semibold text-terracota-700 underline underline-offset-4"
            >
              Volver a mis controles
            </button>
          </Container>
        </div>
      )}

      <Container className="py-12 lg:py-16">
        <div className="grid items-start gap-12 lg:grid-cols-[1.35fr_0.85fr] lg:gap-14">
          {/* ——— MAIN DOSSIER ——— */}
          <div className="space-y-12">
            {/* 01 · Trabajo e ingresos */}
            <section
              aria-labelledby="trabajo-h"
              className="rounded-card bg-crema-050 p-6 ring-1 ring-arena-200 sm:p-7"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Eyebrow index="01">Trabajo e ingresos</Eyebrow>
                <Badge tone="neutral">Declarado por la inquilina</Badge>
              </div>
              <h2 id="trabajo-h" className="head mt-3 text-[26px]">
                A qué se dedica y cuánto gana.
              </h2>

              <dl className="mt-6 grid gap-6 border-t border-arena-200 pt-5 sm:grid-cols-2">
                <div>
                  <dt className="text-[14px] font-medium text-grafito-600">Puesto</dt>
                  <dd className="mt-1 text-[16px] font-semibold">{RENTER.work.role}</dd>
                  <dd className="mt-0.5 text-[14px] text-grafito-600">
                    {privacy.showCompany
                      ? RENTER.work.company
                      : "Empresa (nombre oculto)"}{" "}
                    · {RENTER.work.mode}
                  </dd>
                </div>
                <div>
                  <dt className="text-[14px] font-medium text-grafito-600">Antigüedad</dt>
                  <dd className="mt-1 text-[16px] font-semibold">{RENTER.work.tenure}</dd>
                  <dd className="mt-0.5 text-[14px] text-grafito-600">Desde {RENTER.work.since}</dd>
                </div>
                <div>
                  <dt className="text-[14px] font-medium text-grafito-600">Ingresos mensuales netos</dt>
                  <dd className="mt-1 text-[22px] font-semibold tabular-nums tracking-[-0.025em]">
                    {privacy.incomeAsRange
                      ? `${money(RENTER.income.range[0])} – ${money(RENTER.income.range[1])} / mes`
                      : `${money(RENTER.income.monthly)} / mes`}
                  </dd>
                  <dd className="mt-0.5 text-[14px] text-grafito-600">{RENTER.income.source}</dd>
                </div>
                <div>
                  <dt className="text-[14px] font-medium text-grafito-600">Relación alquiler / ingreso</dt>
                  <dd className="mt-1 text-[22px] font-semibold tabular-nums tracking-[-0.025em]">
                    {ratio} %
                  </dd>
                  <dd className="mt-0.5 text-[14px] text-grafito-600">
                    Sobre un alquiler de {money(sampleRent)} al mes
                  </dd>
                </div>
              </dl>

            </section>

            {/* 02 · Historia de alquileres */}
            <section
              aria-labelledby="historia-h"
              className="rounded-card bg-crema-050 p-6 ring-1 ring-arena-200 sm:p-7"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Eyebrow index="02">Historia de alquileres</Eyebrow>
                <Badge tone="neutral">Declarado por la inquilina</Badge>
              </div>
              <h2 id="historia-h" className="head mt-3 text-[26px]">
                Dónde ha vivido.
              </h2>

              <ol className="mt-6 divide-y divide-arena-200 border-t border-arena-200">
                {RENTER.history.map((h) => (
                  <li key={h.place} className="py-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-[16px] font-semibold">{h.place}</p>
                        <p className="mt-0.5 text-[14px] text-grafito-600">
                          {h.period} ({h.length}) · Propietario: {h.owner}
                        </p>
                      </div>
                    </div>

                  </li>
                ))}
              </ol>
            </section>

            {/* 03 · Referencias */}
            <section
              aria-labelledby="calif-h"
              className="rounded-card bg-crema-050 p-6 ring-1 ring-arena-200 sm:p-7"
            >
              <Eyebrow index="03">Referencias</Eyebrow>
              <h2 id="calif-h" className="head mt-3 text-[24px]">
                A quién puede preguntar el propietario.
              </h2>
              <ul className="mt-4 divide-y divide-arena-200 border-t border-arena-200 text-[15px]">
                {RENTER.references.map((ref) => (
                  <li key={ref.name} className="py-3.5">
                    <span className="font-semibold">{ref.name}</span>
                    <p className="text-[14px] text-grafito-600">{ref.relation}</p>
                    {privacy.directReferences && (
                      <p className="mt-1 text-[14px] text-grafito-700">
                        Teléfono visible para el propietario
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            {/* 05 · Quiénes van a vivir */}
            {privacy.showHousehold && (
              <section
                aria-labelledby="hogar-h"
                className="rounded-card bg-crema-050 p-6 ring-1 ring-arena-200 sm:p-7"
              >
                <Eyebrow index="04">Quiénes van a vivir</Eyebrow>
                <h2 id="hogar-h" className="head mt-3 text-[24px]">
                  {RENTER.household.summary}.
                </h2>
                <div className="mt-5 grid gap-4 border-t border-arena-200 pt-5 sm:grid-cols-2">
                  <div>
                    <p className="text-[14px] font-medium text-grafito-600">Personas</p>
                    <ul className="mt-2 space-y-2 text-[15px]">
                      {RENTER.household.people.map((p) => (
                        <li key={p.name}>
                          <strong className="font-semibold">{p.name}</strong> ·{" "}
                          <span className="text-grafito-600">{p.note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-grafito-600">Mascotas</p>
                    <ul className="mt-2 space-y-2 text-[15px]">
                      {RENTER.household.pets.map((p) => (
                        <li key={p.name}>
                          <strong className="font-semibold">
                            {p.name} ({p.kind}, {p.weight})
                          </strong>
                          <span className="block text-[14px] text-grafito-600">{p.note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* ——— SIDEBAR: PRIVACY + DOCUMENTS + SHARE ——— */}
          <aside aria-label="Privacidad y documentos" className="space-y-6 lg:sticky lg:top-[88px]">
            {view === "mia" ? (
              <>
                <div className="rounded-card bg-crema-050 p-6 ring-1 ring-piedra-250">
                  <Eyebrow>Tú decides qué se ve</Eyebrow>
                  <h2 className="head mt-2 text-[22px]">Controles de privacidad.</h2>

                  <div className="mt-5 space-y-4 border-t border-arena-200 pt-4">
                    <Switch
                      checked={privacy.incomeAsRange}
                      onChange={(incomeAsRange) => setPrivacy({ incomeAsRange })}
                      label="Mostrar mi sueldo como rango"
                      description={
                        privacy.incomeAsRange
                          ? "El propietario ve $3000 – $3500 / mes."
                          : `El propietario ve el monto exacto (${money(RENTER.income.monthly)}).`
                      }
                    />
                    <Switch
                      checked={privacy.showCompany}
                      onChange={(showCompany) => setPrivacy({ showCompany })}
                      label="Mostrar el nombre de mi empresa"
                      description="Si lo apagas, solo se muestra tu puesto."
                    />
                    <Switch
                      checked={privacy.directReferences}
                      onChange={(directReferences) => setPrivacy({ directReferences })}
                      label="Permitir que llamen a mis referencias"
                      description="Actívalo solo si quieres que el propietario pueda llamarles."
                    />
                    <Switch
                      checked={privacy.showHousehold}
                      onChange={(showHousehold) => setPrivacy({ showHousehold })}
                      label="Mostrar con quién vivo y mi mascota"
                      description="Recomendado para filtrar casas que aceptan mascotas grandes."
                    />
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2 border-t border-arena-200 pt-5">
                    <Button variant="ink" size="sm" onClick={copyLink} className="flex-1">
                      <Copy className="size-3.5" />{" "}
                      {copied ? "Enlace copiado (caduca en 14 días)" : "Copiar enlace de 14 días"}
                    </Button>
                  </div>
                </div>

                <div className="rounded-card bg-crema-050 p-6 ring-1 ring-arena-200">
                  <Eyebrow>Quién tiene acceso hoy</Eyebrow>
                  {sharedWith.length === 0 ? (
                    <p className="mt-2 text-[14px] text-grafito-600">
                      Nadie tiene acceso activo a tu perfil.
                    </p>
                  ) : (
                    <ul className="mt-3 divide-y divide-arena-200 text-[14px]">
                      {sharedWith.map((c) => {
                        const owner = PEOPLE[c.ownerId] ?? PEOPLE.andres;
                        const l = listings.find((x) => x.id === c.listingId);
                        return (
                          <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                            <div>
                              <p className="font-semibold">{owner.name}</p>
                              <p className="text-[14px] text-grafito-600">
                                {l?.title} · caduca en 14 días
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setRevoked((r) => [...r, c.id])}
                              className="text-[14px] font-medium text-error underline underline-offset-4"
                            >
                              Revocar
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </>
            ) : (
              <div className="rounded-card bg-crema-050 p-6 ring-1 ring-piedra-250">
                <Eyebrow>Para el propietario</Eyebrow>
                <h2 className="head mt-2 text-[24px]">Lo que {RENTER.firstName} decidió contarte.</h2>
                <p className="mt-2 text-[15px] leading-relaxed text-grafito-700">
                  Esta información la declara la inquilina. Antes de firmar, pídele los documentos
                  que necesites y habla con sus referencias.
                </p>
                <ul className="mt-5 space-y-2 border-t border-arena-200 pt-4 text-[14px] text-grafito-700">
                  <li className="flex items-center gap-2">
                    <Clock className="size-4 text-negro" /> Este enlace caduca en 14 días
                  </li>
                  <li className="flex items-center gap-2">
                    <Lock className="size-4 text-negro" /> Solo lo ve quien recibe el enlace
                  </li>
                </ul>
              </div>
            )}
          </aside>
        </div>
      </Container>
    </div>
  );
}
