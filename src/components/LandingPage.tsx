'use client';

import React, { useState } from "react";
import WaitlistForm from "./WaitlistForm";
import { motion } from "framer-motion";

const CREAM = "#F5F2EB";
const BLACK = "#0A0A0A";
const ORANGE = "#D4541A";
const SAND = "#EDE9DF";
const GRAY = "#888888";

function Logo({ light = false }: { light?: boolean }) {
  return (
    <motion.span 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
      style={{ fontFamily: 'var(--font-playfair)', fontWeight: 900, fontSize: "22px", letterSpacing: "-0.03em" }}
    >
      <span style={{ color: light ? CREAM : BLACK }}>Alquilas</span>
      <span style={{ color: ORANGE }}>Ya</span>
    </motion.span>
  );
}

function Label({ children, color = ORANGE }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-dmsans)',
        fontSize: "10px",
        fontWeight: 600,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color,
      }}
    >
      {children}
    </span>
  );
}

function HeroSection() {
  return (
    <section style={{ background: BLACK, position: "relative", overflow: "hidden" }}>
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: "100%" }}
        transition={{ duration: 1, delay: 0.2 }}
        aria-hidden
        style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "5px", background: ORANGE }}
      />
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 0.035, y: 0 }}
        transition={{ duration: 1.5 }}
        aria-hidden
        style={{
          position: "absolute",
          right: "-40px",
          bottom: "-120px",
          fontFamily: 'var(--font-playfair)',
          fontWeight: 900,
          fontSize: "520px",
          lineHeight: 1,
          letterSpacing: "-0.05em",
          color: CREAM,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        AY
      </motion.div>

      <div className="max-w-[1240px] mx-auto px-8 md:px-16 pt-10 pb-24 md:pt-12 md:pb-32 relative">
        <nav className="flex items-center justify-between mb-20 md:mb-28">
          <Logo light />
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="hidden md:block"
          >
            <Label>El Salvador · 2026</Label>
          </motion.div>
        </nav>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <Label>Próximamente · Lista de espera</Label>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.7 }}
          style={{
            fontFamily: 'var(--font-playfair)',
            fontWeight: 900,
            letterSpacing: "-0.03em",
            color: CREAM,
            lineHeight: 0.95,
            fontSize: "clamp(56px, 9vw, 124px)",
            marginBottom: "32px",
            maxWidth: "1000px",
          }}
        >
          Alquilar en El Salvador,
          <br />
          <span style={{ fontStyle: "italic", fontWeight: 700, color: ORANGE }}>sin vueltas.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          style={{
            fontFamily: 'var(--font-dmsans)',
            fontSize: "18px",
            fontWeight: 400,
            lineHeight: 1.75,
            color: CREAM,
            maxWidth: "560px",
            opacity: 0.85,
          }}
        >
          Una plataforma honesta para encontrar y publicar alquileres en El
          Salvador. Hecha por salvadoreños, para salvadoreños. Sin comisiones
          escondidas. Sin trámites eternos.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 1 }}
          className="mt-16 grid grid-cols-3 gap-8 max-w-[680px]"
        >
          {[
            { n: "14", l: "Departamentos" },
            { n: "0%", l: "Comisión escondida" },
            { n: "100%", l: "Local" },
          ].map((item, i) => (
            <motion.div 
              key={item.l}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + (i * 0.1) }}
              style={{ borderTop: `1px solid rgba(245,242,235,0.18)`, paddingTop: "20px" }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-playfair)',
                  fontWeight: 900,
                  fontSize: "48px",
                  letterSpacing: "-0.03em",
                  color: CREAM,
                  lineHeight: 1,
                  marginBottom: "12px",
                }}
              >
                {item.n}
              </div>
              <Label color={CREAM}>{item.l}</Label>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function FormSection({
  submitted,
  count,
  onSubmit,
}: {
  submitted: boolean;
  count: number;
  onSubmit: () => void;
}) {
  return (
    <section style={{ background: CREAM, position: "relative", overflow: "hidden" }}>
      <motion.div
        initial={{ opacity: 0, x: -100 }}
        whileInView={{ opacity: 0.04, x: -60 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2 }}
        aria-hidden
        style={{
          position: "absolute",
          top: "40px",
          fontFamily: 'var(--font-playfair)',
          fontWeight: 900,
          fontSize: "440px",
          lineHeight: 1,
          letterSpacing: "-0.05em",
          color: BLACK,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        AY
      </motion.div>

      <div className="max-w-[1240px] mx-auto px-8 md:px-16 py-24 md:py-32 relative">
        <div className="grid md:grid-cols-12 gap-12 md:gap-16">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="md:col-span-5"
          >
            <div className="mb-5">
              <Label>02 · El Waitlist</Label>
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-playfair)',
                fontWeight: 900,
                letterSpacing: "-0.03em",
                color: BLACK,
                lineHeight: 1,
                fontSize: "clamp(40px, 5vw, 72px)",
                marginBottom: "24px",
              }}
            >
              Sé de los <span style={{ fontStyle: "italic", fontWeight: 700, color: ORANGE }}>primeros</span> en entrar.
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-dmsans)',
                fontSize: "15px",
                lineHeight: 1.75,
                color: BLACK,
                opacity: 0.75,
                maxWidth: "420px",
              }}
            >
              Estamos construyendo AlquilasYa con calma y con criterio. Apuntate
              a la lista y te avisamos por WhatsApp cuando abramos el acceso en
              tu departamento.
            </p>

            <div className="mt-12 pt-8" style={{ borderTop: `1px solid rgba(10,10,10,0.12)` }}>
              <div className="mb-3">
                <Label>Prueba social</Label>
              </div>
              <motion.p
                key={count} // Retriggers animation when count changes
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100 }}
                style={{
                  fontFamily: 'var(--font-playfair)',
                  fontWeight: 900,
                  fontSize: "32px",
                  letterSpacing: "-0.03em",
                  color: BLACK,
                  lineHeight: 1.1,
                }}
              >
                Ya somos <span style={{ color: ORANGE }}>{count.toLocaleString("es-SV")}</span> personas en la lista.
              </motion.p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="md:col-span-7"
          >
            <div
              style={{
                background: SAND,
                padding: "48px 40px",
                borderRadius: "2px",
                position: "relative",
              }}
            >
              {submitted ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="py-16 text-center"
                >
                  <div className="mb-4">
                    <Label>Confirmado</Label>
                  </div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-playfair)',
                      fontWeight: 900,
                      fontSize: "48px",
                      letterSpacing: "-0.03em",
                      color: BLACK,
                      lineHeight: 1,
                      marginBottom: "16px",
                    }}
                  >
                    Estás <span style={{ fontStyle: "italic", fontWeight: 700, color: ORANGE }}>adentro.</span>
                  </h3>
                  <p
                    style={{
                      fontFamily: 'var(--font-dmsans)',
                      fontSize: "15px",
                      lineHeight: 1.75,
                      color: BLACK,
                      opacity: 0.75,
                      maxWidth: "380px",
                      margin: "0 auto",
                    }}
                  >
                    Te escribimos por WhatsApp en cuanto abramos tu zona.
                    Gracias por confiar.
                  </p>
                </motion.div>
              ) : (
                <WaitlistForm onSuccess={onSubmit} />
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function PreviewCard({
  tag,
  zone,
  price,
  desc,
  bg,
}: {
  tag: string;
  zone: string;
  price: string;
  desc: string;
  bg: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -8, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
      transition={{ duration: 0.3 }}
      style={{
        background: "#FFFFFF",
        border: "1px solid rgba(10,10,10,0.12)",
        borderRadius: "2px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "relative",
          height: "220px",
          background: bg,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(10,10,10,0.45), rgba(212,84,26,0.35))",
            mixBlendMode: "multiply",
          }}
        />
        <span
          style={{
            position: "absolute",
            top: "16px",
            left: "16px",
            background: ORANGE,
            color: "#FFFFFF",
            fontFamily: 'var(--font-dmsans)',
            fontSize: "9px",
            fontWeight: 600,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            padding: "6px 10px",
            borderRadius: "2px",
          }}
        >
          {tag}
        </span>
      </div>
      <div style={{ padding: "24px" }}>
        <div
          style={{
            fontFamily: 'var(--font-dmsans)',
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: GRAY,
            marginBottom: "12px",
          }}
        >
          {zone}
        </div>
        <div className="flex items-baseline gap-2 mb-3">
          <span
            style={{
              fontFamily: 'var(--font-playfair)',
              fontWeight: 900,
              fontSize: "32px",
              letterSpacing: "-0.03em",
              color: BLACK,
              lineHeight: 1,
            }}
          >
            {price}
          </span>
          <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: "11px", color: GRAY }}>/ mes</span>
        </div>
        <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: "13px", lineHeight: 1.6, color: "#444" }}>{desc}</p>
      </div>
    </motion.div>
  );
}

function PreviewSection() {
  return (
    <section style={{ background: CREAM, paddingBottom: "120px" }}>
      <div className="max-w-[1240px] mx-auto px-8 md:px-16">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-end justify-between mb-12 flex-wrap gap-6"
        >
          <div>
            <div className="mb-4">
              <Label>03 · Vista previa</Label>
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-playfair)',
                fontWeight: 900,
                letterSpacing: "-0.03em",
                color: BLACK,
                lineHeight: 1,
                fontSize: "clamp(36px, 4vw, 56px)",
                maxWidth: "640px",
              }}
            >
              Así se va a ver. <span style={{ fontStyle: "italic", fontWeight: 700, color: ORANGE }}>Sin filtros.</span>
            </h2>
          </div>
          <p
            style={{
              fontFamily: 'var(--font-dmsans)',
              fontSize: "14px",
              lineHeight: 1.75,
              color: BLACK,
              opacity: 0.65,
              maxWidth: "320px",
            }}
          >
            Cada propiedad con precio claro, ubicación real y dueño verificado.
            Nada de fotos engañosas.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
            <PreviewCard
              tag="Nuevo"
              zone="Colonia Escalón · S.S."
              price="$650"
              desc="Apartamento 2 hab. amueblado, balcón con vista, parqueo techado. A 5 min del Paseo."
              bg="url('https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80')"
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
            <PreviewCard
              tag="Destacado"
              zone="Santa Tecla · La Libertad"
              price="$420"
              desc="Casa 3 hab. con jardín, zona tranquila. Cerca de comercios y transporte."
              bg="url('https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80')"
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
            <PreviewCard
              tag="Verificado"
              zone="El Tunco · La Libertad"
              price="$850"
              desc="Casa de playa, 2 hab., 3 min caminando al mar. Ideal para temporada o anual."
              bg="url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80')"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ background: BLACK, position: "relative" }}>
      <div
        aria-hidden
        style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "5px", background: ORANGE }}
      />
      <div className="max-w-[1240px] mx-auto px-8 md:px-16 py-16 flex flex-wrap items-center justify-between gap-8">
        <Logo light />
        <div className="flex gap-8 flex-wrap">
          <Label color={CREAM}>San Salvador · ES</Label>
          <Label color={CREAM}>hola@alquilasya.sv</Label>
          <Label color={CREAM}>© 2026</Label>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage({ initialCount }: { initialCount: number }) {
  // Using the DB-provided count as initial, but allowing it to increment locally on submit
  const [submitted, setSubmitted] = useState(false);
  const [count, setCount] = useState(initialCount);

  return (
    <div style={{ background: CREAM, minHeight: "100vh", fontFamily: 'var(--font-dmsans)', color: BLACK }}>
      <HeroSection />
      <FormSection
        submitted={submitted}
        count={count}
        onSubmit={() => {
          setSubmitted(true);
          setCount((c) => c + 1);
        }}
      />
      <PreviewSection />
      <Footer />
    </div>
  );
}
