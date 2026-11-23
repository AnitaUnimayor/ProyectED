import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { pedir } from "../api";
import DoblePenduloSlide from "./DoblePenduloSlide";
import "./Presentacion.css";

// Componente para renderizar fracciones matemáticas verticales reales en JSX puro
export function Fraccion({ arriba, abajo }) {
  return (
    <span
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        verticalAlign: "middle",
        fontSize: "0.92em",
        lineHeight: 1.05,
        padding: "0 4px",
      }}
    >
      <span
        style={{
          borderBottom: "1.5px solid currentColor",
          paddingBottom: "1px",
          width: "100%",
          textAlign: "center",
        }}
      >
        {arriba}
      </span>
      <span
        style={{
          paddingTop: "2px",
          width: "100%",
          textAlign: "center",
        }}
      >
        {abajo}
      </span>
    </span>
  );
}

// Código real de los integradores de back/integradores.py
const CODE_EULER = `def euler(f, y0, t0, tf, h):
    n = int(round((tf - t0) / h))
    t = t0 + h * np.arange(n + 1)
    Y = np.zeros((n + 1, len(y0)))
    Y[0] = y0
    for i in range(n):
        # Pendiente evaluada solo al inicio del paso
        Y[i + 1] = Y[i] + h * f(t[i], Y[i])
    return t, Y`;

const CODE_SIMP = `def euler_simplectico(y0, t0, tf, h):
    n = int(round((tf - t0) / h))
    t = t0 + h * np.arange(n + 1)
    Y = np.zeros((n + 1, 2))
    Y[0] = y0
    for i in range(n):
        u, v = Y[i]
        v = v - h * u      # 1) actualiza la velocidad con el u viejo
        u = u + h * v      # 2) actualiza la posición con la velocidad NUEVA!
        Y[i + 1] = [u, v]
    return t, Y`;

const CODE_HEUN = `def heun(f, y0, t0, tf, h):
    n = int(round((tf - t0) / h))
    t = t0 + h * np.arange(n + 1)
    Y = np.zeros((n + 1, len(y0)))
    Y[0] = y0
    for i in range(n):
        k1 = f(t[i], Y[i])                   # 1) Pendiente al inicio
        k2 = f(t[i] + h, Y[i] + h * k1)      # 2) Pendiente estimada al final
        Y[i + 1] = Y[i] + h / 2 * (k1 + k2)  # Promedio predictor-corrector
    return t, Y`;

const CODE_RK4 = `def rk4(f, y0, t0, tf, h):
    n = int(round((tf - t0) / h))
    t = t0 + h * np.arange(n + 1)
    Y = np.zeros((n + 1, len(y0)))
    Y[0] = y0
    for i in range(n):
        k1 = f(t[i], Y[i])
        k2 = f(t[i] + h / 2, Y[i] + h / 2 * k1)
        k3 = f(t[i] + h / 2, Y[i] + h / 2 * k2)
        k4 = f(t[i] + h, Y[i] + h * k3)
        # Promedio ponderado (regla de Simpson)
        Y[i + 1] = Y[i] + h / 6 * (k1 + 2 * k2 + 2 * k3 + k4)
    return t, Y`;

// Colores institucionales UNIMAYOR para gráficas
const COLOR = {
  euler: "#DC2626",      // Rojo Alerta Inestabilidad
  heun: "#02468F",       // Azul Primario UNIMAYOR
  rk4: "#00A8E8",        // Cian Tecnológico
  simplectico: "#059669",// Verde Esmeralda Estabilidad
  exacta: "#FFCF01",     // Amarillo Oro Curva Exacta
};

const GRID = "#E2E8F0";
const TOOLTIP_STYLE = {
  backgroundColor: "#FFFFFF",
  border: "1px solid #D8E1EB",
  borderRadius: 8,
  fontSize: 12,
  color: "#080C31",
  boxShadow: "0 4px 12px rgba(8, 12, 49, 0.08)",
};

function reducir(filas, max = 300) {
  if (!filas) return [];
  const salto = Math.ceil(filas.length / max);
  return filas.filter((_, i) => i % salto === 0);
}

export default function Presentacion({ slideActual = 0, onCambiarSlide, onVolverAlSimulador }) {
  const [slideInterno, setSlideInterno] = useState(slideActual);
  const slide = onCambiarSlide ? slideActual : slideInterno;
  const setSlide = onCambiarSlide ? onCambiarSlide : setSlideInterno;
  const totalSlides = 9;

  // Modos de vista alternativa en slides 6, 7 y 8 (Gráfica vs Péndulos)
  const [tabSlide6, setTabSlide6] = useState("pendulos"); // "pendulos" | "grafica"
  const [tabSlide7, setTabSlide7] = useState("pendulos");
  const [tabSlide8, setTabSlide8] = useState("pendulos");

  // Estado interactivo para el diagrama predictor-corrector de Heun (Slide 7)
  const [pasoHeunActivo, setPasoHeunActivo] = useState("todos"); // "todos" | "k1" | "k2" | "promedio"
  const [pasoHDemo, setPasoHDemo] = useState(0.1);

  // Estado de conexión con el Back-End
  const [apiConectada, setApiConectada] = useState(false);
  const [datosEne, setDatosEne] = useState(null);
  const [datosErr, setDatosErr] = useState(null);
  const [datosHeun, setDatosHeun] = useState(null);
  const [datosRk4, setDatosRk4] = useState(null);

  // Modal para agrandar gráficas en alta resolución
  const [modalGrafica, setModalGrafica] = useState(null);

  // Temas de las 9 diapositivas
  const temasDiapositiva = [
    "Portada Institucional UNIMAYOR",
    "Contenido & Estructura de la Sustentación",
    "Contexto & Modelo Físico Continuo",
    "Solución Analítica Exacta",
    "Sistema de 1.ᵉʳ Orden y Energía",
    "Euler Explícito vs. Simpléctico",
    "Método de Heun (RK2)",
    "Runge-Kutta 4 (RK4)",
    "Análisis de Error & Conclusiones",
  ];

  // Consumir datos reales del backend usando pedir()
  useEffect(() => {
    let activo = true;

    pedir("/energia?h=0.05&T=50")
      .then((d) => {
        if (activo) {
          setDatosEne(d);
          setApiConectada(true);
        }
      })
      .catch(() => {
        if (activo) setApiConectada(false);
      });

    pedir("/error-vs-h?h0=0.2")
      .then((d) => {
        if (activo) setDatosErr(d);
      })
      .catch(() => {});

    pedir("/solucion?metodo=heun&h=0.1&tf=10")
      .then((d) => {
        if (activo) setDatosHeun(d);
      })
      .catch(() => {});

    pedir("/solucion?metodo=rk4&h=0.1&tf=10")
      .then((d) => {
        if (activo) setDatosRk4(d);
      })
      .catch(() => {});

    return () => {
      activo = false;
    };
  }, []);

  // Navegación por teclado
  useEffect(() => {
    function handleKeyDown(e) {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) return;

      if (e.key === "Escape") {
        setModalGrafica(null);
        return;
      }
      if (modalGrafica) return;

      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        setSlide((s) => Math.min(s + 1, totalSlides - 1));
      } else if (e.key === "ArrowLeft" || e.key === "Backspace" || e.key === "PageUp") {
        e.preventDefault();
        setSlide((s) => Math.max(s - 1, 0));
      } else if (e.key >= "1" && e.key <= "9") {
        setSlide(parseInt(e.key, 10) - 1);
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalGrafica]);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  }

  // Preparación de datos de Recharts
  const chartEneData = useMemo(() => {
    if (!datosEne) return [];
    const { t, euler, simplectico } = datosEne;
    return reducir(t.map((ti, i) => ({ t: ti, euler: euler[i], simplectico: simplectico[i] })), 250);
  }, [datosEne]);

  const chartErrData = useMemo(() => {
    if (!datosErr) return [];
    const { pasos, metodos } = datosErr;
    return pasos
      .map((hi, i) => ({
        h: hi,
        euler: metodos.euler.errores[i],
        heun: metodos.heun.errores[i],
        rk4: metodos.rk4.errores[i],
      }))
      .sort((a, b) => a.h - b.h);
  }, [datosErr]);

  const chartHeunData = useMemo(() => {
    if (!datosHeun) return [];
    const { t, numerica, exacta } = datosHeun;
    return reducir(t.map((ti, i) => ({ t: ti, heun: numerica[i], exacta: exacta[i] })), 150);
  }, [datosHeun]);

  const chartRk4Data = useMemo(() => {
    if (!datosRk4) return [];
    const { t, numerica, exacta } = datosRk4;
    return reducir(t.map((ti, i) => ({ t: ti, rk4: numerica[i], exacta: exacta[i] })), 150);
  }, [datosRk4]);

  const progreso = ((slide + 1) / totalSlides) * 100;

  return (
    <div className="presentation-container">
      {/* Barra de progreso superior institucional */}
      <div className="pres-progress-bar-bg">
        <div className="pres-progress-bar-fill" style={{ width: `${progreso}%` }} />
      </div>

      {/* Header Institucional UNIMAYOR */}
      <header className="pres-header">
        <div className="pres-header-left">
          <img src="/col_mayor.png" alt="Colegio Mayor del Cauca" className="pres-logo" />
          <div className="pres-brand-text">
            <span className="pres-univ-title">Institución Universitaria Colegio Mayor del Cauca</span>
            <span className="pres-fac-title">Facultad de Ingeniería · Ingeniería Informática · EDO Unidad 3</span>
          </div>
        </div>

        <div className="pres-header-center">
          <span className="pres-speaker-pill">
            <span className="pres-speaker-dot" />
            Tema: <strong>{temasDiapositiva[slide]}</strong>
          </span>
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              padding: "4px 11px",
              borderRadius: 999,
              background: apiConectada ? "#DCFCE7" : "#FEE2E2",
              color: apiConectada ? "#166534" : "#991B1B",
              border: `1.5px solid ${apiConectada ? "#86EFAC" : "#FCA5A5"}`,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: apiConectada ? "#22C55E" : "#EF4444" }} />
            {apiConectada ? "API Backend Viva (FastAPI)" : "API sin conexión"}
          </span>
        </div>

        <div className="pres-header-right">
          <div style={{ display: "flex", gap: 4 }}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <button
                key={i}
                className={`pres-tab-btn ${slide === i ? "active" : ""}`}
                onClick={() => setSlide(i)}
                title={`Ir a diapositiva ${i + 1}: ${temasDiapositiva[i]}`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button className="pres-tab-btn" onClick={toggleFullscreen} title="Pantalla completa (F)">
            ⛶
          </button>

          {onVolverAlSimulador && (
            <button className="pres-switch-view-btn" onClick={onVolverAlSimulador}>
              📊 Simulador Completo
            </button>
          )}
        </div>
      </header>

      {/* Main Slide Stage con animaciones suaves */}
      <main className="pres-main-stage">
        {/* ======================================================== */}
        {/* SLIDE 1: PORTADA INSTITUCIONAL TECNOLÓGICA (UNIMAYOR) */}
        {/* ======================================================== */}
        {slide === 0 && (
          <div className="pres-card pres-cover-card-dark">
            <div className="pres-cover-layout">
              <div>
                <span className="pres-badge-header">
                  Sustentación Final · Ecuaciones Diferenciales Ordinarias
                </span>
                <h1 className="pres-cover-title">
                  Proyecto 3. <strong>¿Qué tan bueno es su integrador?</strong>
                </h1>
                <p className="pres-cover-desc">
                  Estudio computacional de estabilidad, orden de convergencia y conservación de energía
                  aplicado al oscilador armónico simple: integradores explícitos vs. métodos simplécticos.
                </p>

                <div className="pres-team-box">
                  <div className="pres-team-label">Integrantes del Proyecto</div>
                  <div className="pres-team-chips">
                    <span className="pres-team-chip">
                      <span>👤</span> MAYA CRUZ ANA ROCIO
                    </span>
                    <span className="pres-team-chip">
                      <span>👤</span> ORDOÑEZ GOMEZ JHONNY ANDERSON
                    </span>
                    <span className="pres-team-chip">
                      <span>👤</span> MARTINEZ MOSQUERA JOSE LUIS
                    </span>
                  </div>
                </div>
              </div>

              <div className="pres-cover-crest-col">
                <div className="pres-crest-capsule">
                  <img src="/col_mayor.png" alt="Escudo Oficial UNIMAYOR" className="pres-crest-img" />
                </div>
                <div className="pres-stack-box">
                  <div className="pres-stack-title">Tecnologías Utilizadas (Full-Stack)</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: 800, color: "#B45309", marginBottom: "4px", letterSpacing: "0.5px" }}>
                        ⚡ FRONT-END
                      </div>
                      <div className="pres-stack-badges">
                        <span className="pres-badge front">React 19</span>
                        <span className="pres-badge front">Vite</span>
                        <span className="pres-badge front">Recharts 3</span>
                        <span className="pres-badge front">HTML5 Canvas 2D</span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--uni-blue)", marginBottom: "4px", letterSpacing: "0.5px" }}>
                        🐍 BACK-END (Cálculo Científico)
                      </div>
                      <div className="pres-stack-badges">
                        <span className="pres-badge back">Python 3.12+</span>
                        <span className="pres-badge back">FastAPI (API REST)</span>
                        <span className="pres-badge back">Uvicorn</span>
                        <span className="pres-badge back">NumPy</span>
                        <span className="pres-badge back">Matplotlib</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SLIDE 2: CONTENIDO & AGENDA DE LA SUSTENTACIÓN */}
        {/* ======================================================== */}
        {slide === 1 && (
          <div className="pres-card">
            <div className="pres-slide-header">
              <div>
                <div className="pres-slide-category">Estructura Académica</div>
                <h2 className="pres-slide-title">
                  Contenido &amp; <strong>Estructura de la Sustentación</strong>
                </h2>
              </div>
              <span className="pres-slide-speaker-tag">Agenda del Proyecto</span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "16px",
                marginTop: "10px",
              }}
            >
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1.5px solid var(--uni-border)",
                  borderTop: "4px solid var(--uni-blue)",
                  borderRadius: 12,
                  padding: "16px",
                  boxShadow: "0 2px 8px rgba(8, 12, 49, 0.03)",
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--uni-blue)", letterSpacing: "0.5px" }}>
                  MÓDULO 01
                </div>
                <h3 style={{ fontSize: "15px", fontWeight: 800, color: "var(--uni-night)", margin: "6px 0" }}>
                  Contexto &amp; Modelo Físico
                </h3>
                <p style={{ fontSize: "12.5px", color: "var(--uni-text-muted)", lineHeight: 1.45, margin: 0 }}>
                  Por qué importa el integrador en motores físicos y videojuegos. Definición del oscilador armónico simple
                  y el dilema del paso de tiempo <em>h</em>.
                </p>
              </div>

              <div
                style={{
                  background: "#FFFFFF",
                  border: "1.5px solid var(--uni-border)",
                  borderTop: "4px solid var(--uni-gold)",
                  borderRadius: 12,
                  padding: "16px",
                  boxShadow: "0 2px 8px rgba(8, 12, 49, 0.03)",
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--uni-blue-med)", letterSpacing: "0.5px" }}>
                  MÓDULO 02
                </div>
                <h3 style={{ fontSize: "15px", fontWeight: 800, color: "var(--uni-night)", margin: "6px 0" }}>
                  Deducción Analítica Exacta
                </h3>
                <p style={{ fontSize: "12.5px", color: "var(--uni-text-muted)", lineHeight: 1.45, margin: 0 }}>
                  Resolución formal a mano con ecuación característica, raíces complejas <em>r = ±i</em> y condiciones iniciales
                  hasta comprobar <em>y(t) = cos(t)</em>.
                </p>
              </div>

              <div
                style={{
                  background: "#FFFFFF",
                  border: "1.5px solid var(--uni-border)",
                  borderTop: "4px solid var(--uni-blue)",
                  borderRadius: 12,
                  padding: "16px",
                  boxShadow: "0 2px 8px rgba(8, 12, 49, 0.03)",
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--uni-blue)", letterSpacing: "0.5px" }}>
                  MÓDULO 03
                </div>
                <h3 style={{ fontSize: "15px", fontWeight: 800, color: "var(--uni-night)", margin: "6px 0" }}>
                  Sistema 1.ᵉʳ Orden &amp; Energía
                </h3>
                <p style={{ fontSize: "12.5px", color: "var(--uni-text-muted)", lineHeight: 1.45, margin: 0 }}>
                  Transformación al espacio de fases <em>[u, v]<sup>T</sup></em> para la computadora y demostración matemática
                  de energía constante <em>E = 0.5</em>.
                </p>
              </div>

              <div
                style={{
                  background: "#FFFFFF",
                  border: "1.5px solid var(--uni-border)",
                  borderTop: "4px solid var(--uni-cyan)",
                  borderRadius: 12,
                  padding: "16px",
                  boxShadow: "0 2px 8px rgba(8, 12, 49, 0.03)",
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--uni-cyan)", letterSpacing: "0.5px" }}>
                  MÓDULO 04
                </div>
                <h3 style={{ fontSize: "15px", fontWeight: 800, color: "var(--uni-night)", margin: "6px 0" }}>
                  Integradores en Vivo &amp; Péndulos
                </h3>
                <p style={{ fontSize: "12.5px", color: "var(--uni-text-muted)", lineHeight: 1.45, margin: 0 }}>
                  Implementación en Python de Euler, Heun (RK2), RK4 y Euler Simpléctico, comparados en tiempo real con
                  animaciones físicas de péndulos dobles.
                </p>
              </div>

              <div
                style={{
                  background: "#FFFFFF",
                  border: "1.5px solid var(--uni-border)",
                  borderTop: "4px solid var(--uni-gold)",
                  borderRadius: 12,
                  padding: "16px",
                  boxShadow: "0 2px 8px rgba(8, 12, 49, 0.03)",
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--uni-blue-med)", letterSpacing: "0.5px" }}>
                  MÓDULO 05
                </div>
                <h3 style={{ fontSize: "15px", fontWeight: 800, color: "var(--uni-night)", margin: "6px 0" }}>
                  Análisis de Error &amp; Criterio
                </h3>
                <p style={{ fontSize: "12.5px", color: "var(--uni-text-muted)", lineHeight: 1.45, margin: 0 }}>
                  Gráficas log-log de pendientes 1, 2 y 4, cálculo experimental del orden <em>p</em> y criterios profesionales
                  para seleccionar el integrador en software real.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SLIDE 3: CONTEXTO Y PROBLEMA DEL OSCILADOR */}
        {/* ======================================================== */}
        {slide === 2 && (
          <div className="pres-card">
            <div className="pres-slide-header">
              <div>
                <div className="pres-slide-category">Fundamentación de Ingeniería</div>
                <h2 className="pres-slide-title">
                  Contexto y Problema del <strong>Oscilador Armónico</strong>
                </h2>
              </div>
              <span className="pres-slide-speaker-tag">Modelo Físico Continuo</span>
            </div>

            <div className="pres-split-grid">
              <div className="pres-col">
                <div className="pres-highlight">
                  <strong>El dilema en la simulación:</strong> Todo simulador (un videojuego, un software de ingeniería,
                  un motor de física como Box2D o PhysX) resuelve ecuaciones diferenciales paso a paso.
                  El método que se elija decide si la simulación es fiel o si se desarma después de un rato.
                </div>

                <ul className="pres-feature-list">
                  <li className="pres-feature-item">
                    <span className="pres-bullet">›</span>
                    <div>
                      <strong>Discretización temporal:</strong> El tiempo continuo se divide en pequeños pasos discretos{" "}
                      <em>h</em>, avanzando en instantes <em>t</em><sub>i+1</sub> = <em>t</em><sub>i</sub> + <em>h</em>.
                    </div>
                  </li>
                  <li className="pres-feature-item">
                    <span className="pres-bullet">›</span>
                    <div>
                      <strong>El compromiso de ingeniería:</strong> Un paso <em>h</em> grande ahorra cómputo pero
                      puede inducir inestabilidades numéricas; un paso diminuto eleva la carga computacional.
                    </div>
                  </li>
                  <li className="pres-feature-item">
                    <span className="pres-bullet">›</span>
                    <div>
                      <strong>El oscilador armónico simple:</strong> Es el sistema físico de referencia porque posee
                      una solución analítica cerrada y conserva rigurosamente la energía.
                    </div>
                  </li>
                </ul>
              </div>

              <div className="pres-col">
                <div className="pres-math-box">
                  <div className="pres-math-title">📐 El Modelo Físico Base</div>
                  <div
                    style={{
                      fontSize: "22px",
                      textAlign: "center",
                      padding: "10px 0",
                      color: "var(--uni-blue)",
                      fontWeight: 800,
                      fontFamily: "Georgia, serif",
                    }}
                  >
                    y″(t) + y(t) = 0
                  </div>
                  <div style={{ textAlign: "center", fontSize: "14px", color: "var(--uni-text-muted)" }}>
                    Condiciones iniciales: <strong>y(0) = 1</strong> &nbsp;·&nbsp; <strong>y′(0) = 0</strong>
                  </div>
                  <div style={{ textAlign: "center", fontSize: "15px", marginTop: "8px", color: "var(--uni-blue-med)", fontWeight: 700 }}>
                    → Solución analítica esperada: <em>y(t) = cos(t)</em>
                  </div>
                </div>

                {/* Péndulo de demostración física en vivo */}
                <DoblePenduloSlide
                  metodo="rk4"
                  nombreMetodo="OSCILADOR IDEAL (EXACTO)"
                  colorMetodo="#02468F"
                  hInicial={0.05}
                  tfInicial={30}
                  altura={160}
                  anchura={190}
                />
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SLIDE 4: DIAPOSITIVA A - SOLUCIÓN ANALÍTICA EXACTA */}
        {/* ======================================================== */}
        {slide === 3 && (
          <div className="pres-card">
            <div className="pres-slide-header">
              <div>
                <div className="pres-slide-category">Unidad 3 · Lo que se resuelve a mano · Punto 1</div>
                <h2 className="pres-slide-title">
                  Solución Analítica Exacta: <strong>Fundamentos de la EDO Homogénea</strong>
                </h2>
              </div>
              <span className="pres-slide-speaker-tag">Ejes Curriculares EDO</span>
            </div>

            {/* Banner de los 4 Pilares Curriculares de la Unidad 3 */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                gap: "8px",
                marginBottom: "14px",
              }}
            >
              <div
                style={{
                  background: "#F8FAFC",
                  border: "1px solid var(--uni-border)",
                  borderLeft: "3.5px solid var(--uni-blue)",
                  padding: "6px 10px",
                  borderRadius: 6,
                  fontSize: "11px",
                }}
              >
                <strong style={{ color: "var(--uni-blue)", display: "block" }}>
                  1. Generalidades
                </strong>
                <span>EDO 2.° orden lineal homogénea (a=1, b=0, c=1)</span>
              </div>
              <div
                style={{
                  background: "#F8FAFC",
                  border: "1px solid var(--uni-border)",
                  borderLeft: "3.5px solid var(--uni-gold)",
                  padding: "6px 10px",
                  borderRadius: 6,
                  fontSize: "11px",
                }}
              >
                <strong style={{ color: "var(--uni-blue-med)", display: "block" }}>
                  2. Homogénea Coef. Constantes
                </strong>
                <span>Ecuación característica: r² + 1 = 0 → r = ± i</span>
              </div>
              <div
                style={{
                  background: "#F8FAFC",
                  border: "1px solid var(--uni-border)",
                  borderLeft: "3.5px solid var(--uni-cyan)",
                  padding: "6px 10px",
                  borderRadius: 6,
                  fontSize: "11px",
                }}
              >
                <strong style={{ color: "var(--uni-night)", display: "block" }}>
                  3. Solución General
                </strong>
                <span>Base {"{cos t, sin t}"} · Wronskiano W = 1 ≠ 0</span>
              </div>
              <div
                style={{
                  background: "#F8FAFC",
                  border: "1px solid var(--uni-border)",
                  borderLeft: "3.5px solid #059669",
                  padding: "6px 10px",
                  borderRadius: 6,
                  fontSize: "11px",
                }}
              >
                <strong style={{ color: "#059669", display: "block" }}>
                  4. Problema Valor Inicial (PVI)
                </strong>
                <span>Condiciones Cauchy y(0)=1, y′(0)=0 → y(t)=cos t</span>
              </div>
            </div>

            <div className="pres-split-grid">
              <div className="pres-col">
                <div className="pres-math-box">
                  <div className="pres-math-title">1. Ecuación Característica (Coeficientes Constantes)</div>
                  <p style={{ fontSize: "13.5px", lineHeight: "1.5" }}>
                    Partimos de la EDO homogénea de segundo orden: <strong>y″ + y = 0</strong>
                  </p>
                  <p style={{ fontSize: "13px", color: "var(--uni-text-muted)", margin: "4px 0" }}>
                    Proponemos la solución exponencial <em>y = e<sup>rt</sup></em> y calculamos sus derivadas:
                  </p>
                  <div
                    style={{
                      background: "#F8FAFC",
                      padding: "8px 12px",
                      borderRadius: 6,
                      fontSize: "13.5px",
                      fontFamily: "Georgia, serif",
                      margin: "4px 0",
                      border: "1px solid var(--uni-border)",
                    }}
                  >
                    y′ = r·e<sup>rt</sup>
                    <br />
                    y″ = r²·e<sup>rt</sup>
                  </div>
                  <p style={{ fontSize: "13px", margin: "4px 0" }}>
                    Sustituyendo en la EDO original:
                  </p>
                  <div
                    style={{
                      background: "#F8FAFC",
                      padding: "8px 12px",
                      borderRadius: 6,
                      fontSize: "13px",
                      fontFamily: "Georgia, serif",
                      margin: "4px 0",
                      border: "1px solid var(--uni-border)",
                    }}
                  >
                    r²·e<sup>rt</sup> + e<sup>rt</sup> = 0 &nbsp;→&nbsp; (r² + 1)·e<sup>rt</sup> = 0
                  </div>
                  <p style={{ fontSize: "13px", margin: "4px 0" }}>
                    Como <em>e<sup>rt</sup> ≠ 0</em> para todo <em>t</em>, se deduce el polinomio característico:
                  </p>
                  <div
                    style={{
                      background: "#FFFFFF",
                      padding: "8px 12px",
                      borderRadius: 6,
                      fontSize: "14px",
                      fontWeight: 800,
                      color: "var(--uni-blue)",
                      border: "1.5px solid var(--uni-blue)",
                      fontFamily: "Georgia, serif",
                    }}
                  >
                    r² + 1 = 0 &nbsp;→&nbsp; r² = -1 &nbsp;→&nbsp; r = ± i
                  </div>
                  <span style={{ fontSize: "12px", color: "var(--uni-text-muted)" }}>
                    (Raíces complejas conjugadas α ± βi con α = 0 y β = 1)
                  </span>
                </div>

                <div className="pres-math-box">
                  <div className="pres-math-title">2. Estructura de la Solución General &amp; Wronskiano</div>
                  <p style={{ fontSize: "13.5px", lineHeight: "1.5" }}>
                    Al tener raíces imaginarias puras (α = 0, β = 1), la solución es oscilatoria armónica:
                  </p>
                  <div
                    style={{
                      background: "#F8FAFC",
                      padding: "8px 12px",
                      borderRadius: 6,
                      fontSize: "14px",
                      fontWeight: 700,
                      fontFamily: "Georgia, serif",
                      color: "var(--uni-night)",
                      border: "1px solid var(--uni-border)",
                    }}
                  >
                    y(t) = e<sup>0t</sup>·( c₁·cos t + c₂·sin t ) = c₁·cos t + c₂·sin t
                  </div>
                  <div style={{ marginTop: "6px", fontSize: "11.5px", color: "var(--uni-text-muted)", lineHeight: 1.4 }}>
                    <strong>Comprobación del Wronskiano W(y₁, y₂):</strong>
                    <br />
                    <em>W(cos t, sin t) = (cos t)(cos t) - (sin t)(-sin t) = cos² t + sin² t = <strong>1 ≠ 0</strong></em>
                    <br />
                    El Wronskiano no nulo demuestra que {"{cos t, sin t}"} forman un conjunto fundamental de soluciones linealmente independientes.
                  </div>
                </div>
              </div>

              <div className="pres-col">
                <div className="pres-math-box" style={{ borderLeftColor: "var(--uni-gold)" }}>
                  <div className="pres-math-title" style={{ color: "var(--uni-blue)" }}>
                    3. El Problema de Valor Inicial (PVI - Condiciones de Cauchy)
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <strong style={{ fontSize: "13.5px", color: "var(--uni-night)" }}>
                      A) Posición inicial y(0) = 1:
                    </strong>
                    <div
                      style={{
                        background: "#F8FAFC",
                        padding: "7px 12px",
                        borderRadius: 6,
                        fontSize: "13.5px",
                        marginTop: 4,
                        fontFamily: "Georgia, serif",
                        border: "1px solid var(--uni-border)",
                      }}
                    >
                      y(0) = c₁·cos(0) + c₂·sin(0) = 1
                      <br />
                      c₁·(1) + c₂·(0) = 1 &nbsp;→&nbsp; <strong style={{ color: "var(--uni-blue)" }}>c₁ = 1</strong>
                    </div>
                  </div>

                  <div>
                    <strong style={{ fontSize: "13.5px", color: "var(--uni-night)" }}>
                      B) Velocidad inicial y′(0) = 0:
                    </strong>
                    <p style={{ fontSize: "12.5px", color: "var(--uni-text-muted)", margin: "4px 0" }}>
                      Derivamos: <em>y′(t) = -c₁·sin t + c₂·cos t</em> y evaluamos en <em>t = 0</em>:
                    </p>
                    <div
                      style={{
                        background: "#F8FAFC",
                        padding: "7px 12px",
                        borderRadius: 6,
                        fontSize: "13.5px",
                        marginTop: 4,
                        fontFamily: "Georgia, serif",
                        border: "1px solid var(--uni-border)",
                      }}
                    >
                      y′(0) = -c₁·sin(0) + c₂·cos(0) = 0
                      <br />
                      -c₁·(0) + c₂·(1) = 0 &nbsp;→&nbsp; <strong style={{ color: "var(--uni-blue)" }}>c₂ = 0</strong>
                    </div>
                  </div>
                </div>

                {/* Solución particular exacta resaltada con acento Oro UNIMAYOR */}
                <div
                  style={{
                    background: "var(--uni-blue)",
                    color: "#FFFFFF",
                    padding: "18px 22px",
                    borderRadius: 12,
                    textAlign: "center",
                    boxShadow: "0 6px 16px rgba(2, 70, 143, 0.2)",
                    borderBottom: "4px solid var(--uni-gold)",
                  }}
                >
                  <div style={{ fontSize: "11.5px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--uni-gold)", marginBottom: 4, fontWeight: 700 }}>
                    Solución Particular Única (Teorema de Existencia y Unicidad)
                  </div>
                  <div style={{ fontSize: "28px", fontWeight: 800, fontFamily: "Georgia, serif", letterSpacing: "1px" }}>
                    y(t) = cos t
                  </div>
                  <div style={{ fontSize: "13px", opacity: 0.95, marginTop: 4 }}>
                    Velocidad: y′(t) = -sin t &nbsp;·&nbsp; Aceleración: y″(t) = -cos t
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SLIDE 5: DIAPOSITIVA B - SISTEMA 1ER ORDEN Y ENERGÍA */}
        {/* ======================================================== */}
        {slide === 4 && (
          <div className="pres-card">
            <div className="pres-slide-header">
              <div>
                <div className="pres-slide-category">Lo que se resuelve a mano · Puntos 2 y 3</div>
                <h2 className="pres-slide-title">
                  Diapositiva B: <strong>Sistema de Primer Orden</strong> y Conservación de Energía
                </h2>
              </div>
              <span className="pres-slide-speaker-tag">Puente al Código Python</span>
            </div>

            <div className="pres-split-grid">
              <div className="pres-col">
                <div className="pres-math-box">
                  <div className="pres-math-title">Tarjeta Izquierda: De 2.º Orden a Sistema de 1.ᵉʳ Orden</div>
                  <p style={{ fontSize: "13.5px", lineHeight: "1.5" }}>
                    <strong>¿Por qué se hace?</strong> Los integradores numéricos (Euler, Heun, RK4) solo resuelven ecuaciones
                    diferenciales de <em>primer orden</em>: <em>Y′ = F(t, Y)</em>.
                  </p>

                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--uni-blue)" }}>
                      1. Cambio de variables (Vector de estado w = [u, v]<sup>T</sup>):
                    </div>
                    <ul style={{ paddingLeft: "18px", fontSize: "13px", margin: "4px 0" }}>
                      <li><em>u = y</em> (posición)</li>
                      <li><em>v = y′</em> (velocidad)</li>
                    </ul>
                  </div>

                  <div style={{ marginTop: 6 }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--uni-blue)" }}>
                      2. Derivamos ambas variables:
                    </div>
                    <div
                      style={{
                        background: "#F8FAFC",
                        padding: "8px 12px",
                        borderRadius: 6,
                        fontSize: "13.5px",
                        margin: "4px 0",
                        fontFamily: "Georgia, serif",
                        border: "1px solid var(--uni-border)",
                      }}
                    >
                      u′ = y′ = <strong>v</strong>
                      <br />
                      v′ = y″ = -y = <strong>-u</strong> &nbsp;(despejando y″ = -y de la EDO original)
                    </div>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--uni-blue)" }}>
                      3. Sistema resultante (lo que programa <code>def f(t, estado)</code>):
                    </div>
                    <div
                      style={{
                        background: "#FFFFFF",
                        padding: "10px 14px",
                        borderRadius: 8,
                        fontSize: "14px",
                        border: "1.5px solid var(--uni-blue)",
                        marginTop: 4,
                        fontFamily: "Georgia, serif",
                      }}
                    >
                      ⎧ u′ = v
                      <br />
                      ⎩ v′ = -u
                      <br />
                      con condición inicial: <strong>w(0) = [1, 0]<sup>T</sup></strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pres-col">
                <div className="pres-math-box" style={{ borderLeftColor: "var(--uni-gold)" }}>
                  <div className="pres-math-title">Tarjeta Derecha: Demostración de Energía Constante</div>
                  <p style={{ fontSize: "13.5px", lineHeight: "1.5" }}>
                    Definición de energía del oscilador armónico:
                  </p>
                  <div
                    style={{
                      background: "#F8FAFC",
                      padding: "8px 12px",
                      borderRadius: 6,
                      fontSize: "14px",
                      margin: "4px 0",
                      border: "1px solid var(--uni-border)",
                      fontFamily: "Georgia, serif",
                    }}
                  >
                    E(t) = <Fraccion arriba="1" abajo="2" />·( y² + (y′)² ) = <Fraccion arriba="1" abajo="2" />·( u² + v² )
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--uni-blue)" }}>
                      Derivamos E(t) respecto al tiempo t (Regla de la cadena):
                    </div>
                    <div
                      style={{
                        background: "#F8FAFC",
                        padding: "8px 12px",
                        borderRadius: 6,
                        fontSize: "13.5px",
                        margin: "4px 0",
                        border: "1px solid var(--uni-border)",
                        fontFamily: "Georgia, serif",
                      }}
                    >
                      <Fraccion arriba="dE" abajo="dt" /> = <Fraccion arriba="1" abajo="2" />·( 2y·y′ + 2y′·y″ ) = y·y′ + y′·y″
                    </div>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--uni-blue)" }}>
                      Factorizamos y′ y sustituimos la EDO (y″ + y = 0):
                    </div>
                    <div
                      style={{
                        background: "#F8FAFC",
                        padding: "8px 12px",
                        borderRadius: 6,
                        fontSize: "14px",
                        margin: "4px 0",
                        border: "1px solid var(--uni-border)",
                        fontFamily: "Georgia, serif",
                      }}
                    >
                      <Fraccion arriba="dE" abajo="dt" /> = y′·( y + y″ ) = y′·( 0 ) = <strong>0</strong>
                    </div>
                  </div>

                  <div
                    style={{
                      background: "var(--uni-night)",
                      color: "#FFFFFF",
                      padding: "10px 14px",
                      borderRadius: 8,
                      marginTop: 10,
                      fontSize: "13px",
                      lineHeight: "1.4",
                      borderLeft: "4px solid var(--uni-gold)",
                    }}
                  >
                    <strong>Conclusión física demostrada:</strong> Como su derivada temporal es idénticamente cero (<em>dE/dt = 0</em>),
                    la energía es estrictamente constante en todo instante <em>t</em>:
                    <br />
                    <span style={{ fontSize: "14.5px", fontWeight: 700, fontFamily: "Georgia, serif", color: "var(--uni-gold)" }}>
                      E(t) = E(0) = <Fraccion arriba="1" abajo="2" />·( 1² + 0² ) = 0.5
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SLIDE 6: EULER EXPLÍCITO VS SIMPLÉCTICO (CON PÉNDULO EN VIVO) */}
        {/* ======================================================== */}
        {slide === 5 && (
          <div className="pres-card">
            <div className="pres-slide-header">
              <div>
                <div className="pres-slide-category">Integración Geométrica · Lo que programan (Punto 4)</div>
                <h2 className="pres-slide-title">
                  Euler Explícito vs. <strong>Euler Simpléctico</strong>
                </h2>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  className={`pres-tab-btn ${tabSlide6 === "pendulos" ? "active" : ""}`}
                  onClick={() => setTabSlide6("pendulos")}
                >
                  ⚖️ Péndulos en Vivo
                </button>
                <button
                  className={`pres-tab-btn ${tabSlide6 === "grafica" ? "active" : ""}`}
                  onClick={() => setTabSlide6("grafica")}
                >
                  📈 Gráfica de Energía (API)
                </button>
                <span className="pres-slide-speaker-tag">Conservación de Energía</span>
              </div>
            </div>

            <div className="pres-split-grid uneven-left">
              {/* Código real a la izquierda */}
              <div className="pres-col">
                <div className="pres-code-card">
                  <div className="pres-code-header">
                    <span className="pres-code-filename">back/integradores.py</span>
                    <span className="pres-code-tag" style={{ color: "#FCA5A5" }}>Euler Explícito</span>
                  </div>
                  <pre className="pres-code-body">{CODE_EULER}</pre>
                </div>

                <div className="pres-code-card">
                  <div className="pres-code-header">
                    <span className="pres-code-filename">back/integradores.py</span>
                    <span className="pres-code-tag" style={{ color: "var(--uni-gold)" }}>
                      Euler Simpléctico
                    </span>
                  </div>
                  <pre className="pres-code-body">{CODE_SIMP}</pre>
                </div>

                <div className="pres-highlight">
                  <strong>La diferencia crucial:</strong> Euler explícito usa el estado viejo para ambas variables
                  y se sale tangencialmente hacia afuera del círculo de fase (inyecta energía espuria de 0.5 a más de 6 en 50 s).
                  El Simpléctico actualiza primero <em>v</em><sub>i+1</sub> y la usa de inmediato para <em>u</em><sub>i+1</sub>,
                  preservando la 2-forma simpléctica.
                </div>
              </div>

              {/* Péndulos lado a lado o Gráfica viva a la derecha */}
              <div className="pres-col">
                {tabSlide6 === "pendulos" ? (
                  <DoblePenduloSlide
                    metodo="euler"
                    nombreMetodo="EULER (SE DESCONTROLARÁ SOLO)"
                    colorMetodo="#DC2626"
                    hInicial={0.05}
                    tfInicial={40}
                    altura={200}
                    anchura={220}
                  />
                ) : (
                  <div className="pres-img-card" style={{ height: 260 }}>
                    <button
                      className="pres-expand-chart-btn"
                      onClick={() =>
                        setModalGrafica({
                          tipo: "energia",
                          titulo: "Conservación de Energía: Euler Explícito vs. Simpléctico",
                          subtitulo: "Comportamiento energético a lo largo de 50 segundos en el oscilador armónico",
                          caption: `Euler explícito inyecta energía artificial y se desborda hasta ${datosEne ? Number(datosEne.euler.at(-1)).toFixed(2) : "6.94"}, mientras el Euler Simpléctico preserva la estructura hamiltoniana y se mantiene estrictamente acotado en torno a 0.500.`,
                        })
                      }
                      title="Agrandar gráfica en modal de alta definición"
                    >
                      <span>⛶</span> Agrandar
                    </button>
                    <div style={{ width: "100%", height: "100%" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartEneData} margin={{ top: 5, right: 15, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                          <XAxis dataKey="t" tickFormatter={(v) => +Number(v).toFixed(0)} stroke="#64748B" />
                          <YAxis stroke="#64748B" />
                          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => Number(v).toFixed(3)} />
                          <Legend verticalAlign="top" height={24} />
                          <ReferenceLine y={0.5} stroke="#02468F" strokeDasharray="3 3" />
                          <Line type="monotone" dataKey="euler" name="Euler Explícito (diverge)" stroke={COLOR.euler} strokeWidth={2} dot={false} isAnimationActive={false} />
                          <Line type="monotone" dataKey="simplectico" name="Euler Simpléctico (acotado)" stroke={COLOR.simplectico} strokeWidth={2} dot={false} isAnimationActive={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <span className="pres-img-caption">
                      Datos en vivo desde <code>GET /energia?h=0.05&T=50</code>: Euler sube a{" "}
                      <strong>{datosEne ? Number(datosEne.euler.at(-1)).toFixed(2) : "6.94"}</strong> mientras Simpléctico se mantiene acotado en{" "}
                      <strong>{datosEne ? Number(datosEne.simplectico.at(-1)).toFixed(3) : "0.50"}</strong>.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SLIDE 7: MÉTODO DE HEUN / RK2 (CON PÉNDULO EN VIVO) */}
        {/* ======================================================== */}
        {slide === 6 && (
          <div className="pres-card">
            <div className="pres-slide-header">
              <div>
                <div className="pres-slide-category">Método Predictor-Corrector · Lo que programan (Punto 1)</div>
                <h2 className="pres-slide-title">
                  Método de <strong>Heun (Runge-Kutta Orden 2)</strong>
                </h2>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  className={`pres-tab-btn ${tabSlide7 === "pendulos" ? "active" : ""}`}
                  onClick={() => setTabSlide7("pendulos")}
                >
                  ⚖️ Péndulos en Vivo
                </button>
                <button
                  className={`pres-tab-btn ${tabSlide7 === "grafica" ? "active" : ""}`}
                  onClick={() => setTabSlide7("grafica")}
                >
                  📈 Gráfica vs Exacta
                </button>
                <span className="pres-slide-speaker-tag">Orden O(h²)</span>
              </div>
            </div>

            <div className="pres-split-grid uneven-left">
              {/* Código real a la izquierda */}
              <div className="pres-col">
                <div className="pres-code-card">
                  <div className="pres-code-header">
                    <span className="pres-code-filename">back/integradores.py</span>
                    <span className="pres-code-tag">Algoritmo Heun</span>
                  </div>
                  <pre className="pres-code-body">{CODE_HEUN}</pre>
                </div>

                <div className="pres-math-box">
                  <div className="pres-math-title">Estructura Predictor-Corrector</div>
                  <div style={{ fontSize: "13.5px", margin: "4px 0", lineHeight: "1.6", fontFamily: "Georgia, serif" }}>
                    • <strong>Predictor (Euler):</strong> <em>k₁ = f(t<sub>i</sub>, y<sub>i</sub>)</em>
                    <br />
                    • <strong>Corrector (Trapecio):</strong> <em>k₂ = f(t<sub>i</sub> + h, y<sub>i</sub> + h·k₁)</em>
                    <br />
                    • <strong>Promedio:</strong> <em>y<sub>i+1</sub> = y<sub>i</sub> + h·</em><Fraccion arriba="k₁ + k₂" abajo="2" />
                  </div>
                </div>

                <div className="pres-highlight">
                  <strong>Orden de Convergencia O(h²):</strong> Al promediar la pendiente al inicio y al final del paso,
                  Heun sigue la curvatura del círculo. Al reducir el paso a la mitad (<em>h → h/2</em>),
                  el error global se divide entre <strong>4</strong> (2²).
                </div>
              </div>

              {/* Péndulos lado a lado o Gráfica viva a la derecha */}
              <div className="pres-col">
                {tabSlide7 === "pendulos" ? (
                  <>
                    <DoblePenduloSlide
                      metodo="heun"
                      nombreMetodo="HEUN (ESTABLE, NO SE DESBORDA)"
                      colorMetodo="#02468F"
                      hInicial={0.05}
                      tfInicial={40}
                      altura={175}
                      anchura={220}
                    />

                    {/* Diagrama Interactivo Predictor-Corrector (k1 vs k2) con Explicación de Colores */}
                    <div
                      style={{
                        marginTop: "10px",
                        padding: "12px 14px",
                        background: "#FFFFFF",
                        border: "1.5px solid var(--uni-border)",
                        borderRadius: 12,
                        boxShadow: "0 2px 10px rgba(8, 12, 49, 0.05)",
                      }}
                    >
                      {/* Cabecera interactiva con selector de pasos y paso h */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: 6,
                          marginBottom: "8px",
                          borderBottom: "1.5px solid #E2E8F0",
                          paddingBottom: "6px",
                        }}
                      >
                        <div>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 800,
                              color: "var(--uni-blue)",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            📐 Geometría Predictor-Corrector: k₁ vs k₂
                          </span>
                          <span style={{ fontSize: "10px", color: "var(--uni-text-muted)", marginLeft: "6px" }}>
                            (Interactivo)
                          </span>
                        </div>

                        {/* Botones de Pasos */}
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {[
                            { id: "todos", label: "🔘 Todos", color: "#080C31" },
                            { id: "k1", label: "🔴 1. k₁ (Euler)", color: "#DC2626" },
                            { id: "k2", label: "🟣 2. k₂ (Estimado)", color: "#7C3AED" },
                            { id: "promedio", label: "🔵 3. ½(k₁+k₂)", color: "#02468F" },
                          ].map((btn) => (
                            <button
                              key={btn.id}
                              onClick={() => setPasoHeunActivo(btn.id)}
                              style={{
                                padding: "2px 7px",
                                borderRadius: 5,
                                fontSize: "10px",
                                fontWeight: 700,
                                cursor: "pointer",
                                border: `1.5px solid ${pasoHeunActivo === btn.id ? btn.color : "#CBD5E1"}`,
                                background: pasoHeunActivo === btn.id ? btn.color : "#F8FAFC",
                                color: pasoHeunActivo === btn.id ? "#FFFFFF" : "#475569",
                                transition: "all 0.15s ease",
                              }}
                            >
                              {btn.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Disposición en 2 columnas: SVG a la izquierda + Explicación de colores a la derecha */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1.15fr 0.85fr",
                          gap: "12px",
                          alignItems: "center",
                        }}
                      >
                        {/* Columna Izquierda: Diagrama Vectorial SVG */}
                        <div style={{ background: "#F8FAFC", padding: "6px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
                          <svg viewBox="0 0 350 115" style={{ width: "100%", height: "auto", display: "block" }}>
                            <defs>
                              <marker
                                id="arr-blue"
                                viewBox="0 0 10 10"
                                refX="6"
                                refY="5"
                                markerWidth="6"
                                markerHeight="6"
                                orient="auto-start-reverse"
                              >
                                <path d="M 0 1 L 10 5 L 0 9 z" fill="#02468F" />
                              </marker>
                              <marker
                                id="arr-red"
                                viewBox="0 0 10 10"
                                refX="6"
                                refY="5"
                                markerWidth="6"
                                markerHeight="6"
                                orient="auto-start-reverse"
                              >
                                <path d="M 0 1 L 10 5 L 0 9 z" fill="#DC2626" />
                              </marker>
                              <marker
                                id="arr-purple"
                                viewBox="0 0 10 10"
                                refX="6"
                                refY="5"
                                markerWidth="6"
                                markerHeight="6"
                                orient="auto-start-reverse"
                              >
                                <path d="M 0 1 L 10 5 L 0 9 z" fill="#7C3AED" />
                              </marker>
                            </defs>

                            {/* Curva teórica exacta de cos(t) */}
                            <path d="M 30 95 Q 160 62 320 20" fill="none" stroke="#E2E8F0" strokeWidth="6" />
                            <path d="M 30 95 Q 160 62 320 20" fill="none" stroke="#FFCF01" strokeWidth="3" strokeDasharray="4 3" />

                            {/* Flecha k1: Tangente inicial Euler */}
                            <line
                              x1="30"
                              y1="95"
                              x2="175"
                              y2="52"
                              stroke="#DC2626"
                              strokeWidth={pasoHeunActivo === "k1" ? 3.5 : 2}
                              strokeDasharray={pasoHeunActivo === "k1" ? "none" : "3 2"}
                              opacity={pasoHeunActivo === "todos" || pasoHeunActivo === "k1" ? 1 : 0.2}
                              markerEnd="url(#arr-red)"
                            />

                            {/* Flecha k2: Tangente estimada en el punto predictor */}
                            <line
                              x1="175"
                              y1="52"
                              x2="310"
                              y2="40"
                              stroke="#7C3AED"
                              strokeWidth={pasoHeunActivo === "k2" ? 3.5 : 2}
                              strokeDasharray={pasoHeunActivo === "k2" ? "none" : "3 2"}
                              opacity={pasoHeunActivo === "todos" || pasoHeunActivo === "k2" ? 1 : 0.2}
                              markerEnd="url(#arr-purple)"
                            />

                            {/* Flecha resultante promediada: ½(k1 + k2) */}
                            <line
                              x1="30"
                              y1="95"
                              x2="315"
                              y2="24"
                              stroke="#02468F"
                              strokeWidth={pasoHeunActivo === "promedio" ? 4 : 3}
                              opacity={pasoHeunActivo === "todos" || pasoHeunActivo === "promedio" ? 1 : 0.2}
                              markerEnd="url(#arr-blue)"
                            />

                            {/* Puntos y Vértices */}
                            <circle cx="30" cy="95" r="4.5" fill="#02468F" />
                            <circle
                              cx="175"
                              cy="52"
                              r={pasoHeunActivo === "k1" ? 5 : 4}
                              fill="#DC2626"
                              opacity={pasoHeunActivo === "todos" || pasoHeunActivo === "k1" || pasoHeunActivo === "k2" ? 1 : 0.2}
                            />
                            <circle
                              cx="315"
                              cy="24"
                              r={pasoHeunActivo === "promedio" ? 5.5 : 4.5}
                              fill="#059669"
                              opacity={pasoHeunActivo === "todos" || pasoHeunActivo === "promedio" ? 1 : 0.2}
                            />

                            {/* Textos dentro del SVG */}
                            <text x="22" y="108" fill="#1D1D1B" fontSize="9.5" fontWeight="bold">
                              y(tᵢ)
                            </text>
                            {(pasoHeunActivo === "todos" || pasoHeunActivo === "k1") && (
                              <text x="100" y="58" fill="#DC2626" fontSize="9.5" fontWeight="bold">
                                k₁
                              </text>
                            )}
                            {(pasoHeunActivo === "todos" || pasoHeunActivo === "k2") && (
                              <text x="200" y="60" fill="#7C3AED" fontSize="9.5" fontWeight="bold">
                                k₂
                              </text>
                            )}
                            {(pasoHeunActivo === "todos" || pasoHeunActivo === "promedio") && (
                              <text x="140" y="86" fill="#02468F" fontSize="10" fontWeight="bold">
                                Promedio ½(k₁+k₂)
                              </text>
                            )}
                            {(pasoHeunActivo === "todos" || pasoHeunActivo === "promedio") && (
                              <text x="305" y="38" fill="#059669" fontSize="9.5" fontWeight="bold">
                                y(tᵢ₊₁)
                              </text>
                            )}
                          </svg>

                          <div style={{ marginTop: "4px", fontSize: "10px", color: "#64748B", textAlign: "center" }}>
                            {pasoHeunActivo === "k1" && (
                              <span style={{ color: "#DC2626", fontWeight: 700 }}>
                                Paso 1: Euler proyecta ỹ = yᵢ + h·k₁ usando la pendiente al inicio.
                              </span>
                            )}
                            {pasoHeunActivo === "k2" && (
                              <span style={{ color: "#7C3AED", fontWeight: 700 }}>
                                Paso 2: Evalúa k₂ = f(tᵢ+h, ỹ) para medir cómo cambió la curvatura.
                              </span>
                            )}
                            {pasoHeunActivo === "promedio" && (
                              <span style={{ color: "#02468F", fontWeight: 700 }}>
                                Paso 3: Promedia ½(k₁+k₂); la trayectoria se curva hacia la solución exacta.
                              </span>
                            )}
                            {pasoHeunActivo === "todos" && (
                              <span>Haz clic en los botones superiores para aislar cada vector.</span>
                            )}
                          </div>
                        </div>

                        {/* Columna Derecha: Explicación de Colores y Vectores */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "5px",
                            fontSize: "10.5px",
                            lineHeight: "1.3",
                          }}
                        >
                          <div
                            style={{
                              padding: "4px 7px",
                              borderRadius: 6,
                              background: "#FEFCE8",
                              borderLeft: "3px solid #FFCF01",
                            }}
                          >
                            <strong style={{ color: "#854D0E" }}>🟡 Curva Dorada:</strong>
                            <span style={{ color: "#713F12", marginLeft: 4 }}>
                              Solución exacta <em>y = cos(t)</em>. Trayectoria real cóncava.
                            </span>
                          </div>

                          <div
                            style={{
                              padding: "4px 7px",
                              borderRadius: 6,
                              background: pasoHeunActivo === "k1" ? "#FEE2E2" : "#F8FAFC",
                              borderLeft: "3px solid #DC2626",
                            }}
                          >
                            <strong style={{ color: "#DC2626" }}>🔴 Flecha Roja (k₁):</strong>
                            <span style={{ color: "#475569", marginLeft: 4 }}>
                              Pendiente inicial (Euler). Sin corrección se sale por la tangente exterior.
                            </span>
                          </div>

                          <div
                            style={{
                              padding: "4px 7px",
                              borderRadius: 6,
                              background: pasoHeunActivo === "k2" ? "#F3E8FF" : "#F8FAFC",
                              borderLeft: "3px solid #7C3AED",
                            }}
                          >
                            <strong style={{ color: "#7C3AED" }}>🟣 Flecha Morada (k₂):</strong>
                            <span style={{ color: "#475569", marginLeft: 4 }}>
                              Pendiente proyectada al final. Anticipa la desaceleración del oscilador.
                            </span>
                          </div>

                          <div
                            style={{
                              padding: "4px 7px",
                              borderRadius: 6,
                              background: pasoHeunActivo === "promedio" ? "#EFF6FF" : "#F8FAFC",
                              borderLeft: "3px solid #02468F",
                            }}
                          >
                            <strong style={{ color: "#02468F" }}>🔵 Flecha Azul:</strong>
                            <span style={{ color: "#475569", marginLeft: 4 }}>
                              Promedio <em>½(k₁+k₂)</em>. Neutraliza la curvatura y alcanza orden <strong>O(h²)</strong>.
                            </span>
                          </div>

                          <div
                            style={{
                              padding: "4px 7px",
                              borderRadius: 6,
                              background: "#F0FDF4",
                              borderLeft: "3px solid #059669",
                            }}
                          >
                            <strong style={{ color: "#059669" }}>🟢 Punto Verde (yᵢ₊₁):</strong>
                            <span style={{ color: "#166534", marginLeft: 4 }}>
                              Punto numérico exacto de Heun sin deriva descontrolada de energía.
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="pres-img-card" style={{ height: 260 }}>
                    <button
                      className="pres-expand-chart-btn"
                      onClick={() =>
                        setModalGrafica({
                          tipo: "heun",
                          titulo: "Convergencia de Heun (RK2) vs. Curva Exacta cos(t)",
                          subtitulo: "Aproximación numérica de 2.º orden en el intervalo t ∈ [0, 10] s",
                          caption: `El método de Heun promedia pendientes inicial y estimada, eliminando el sesgo de curvatura y logrando un error en t = 10s de apenas ${datosHeun ? Number(datosHeun.error_final).toExponential(2) : "8.12e-3"}.`,
                        })
                      }
                      title="Agrandar gráfica en modal de alta definición"
                    >
                      <span>⛶</span> Agrandar
                    </button>
                    <div style={{ width: "100%", height: "100%" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartHeunData} margin={{ top: 5, right: 15, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                          <XAxis dataKey="t" tickFormatter={(v) => +Number(v).toFixed(0)} stroke="#64748B" />
                          <YAxis stroke="#64748B" />
                          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => Number(v).toFixed(4)} />
                          <Legend verticalAlign="top" height={24} />
                          <Line type="monotone" dataKey="heun" name="Heun (RK2)" stroke={COLOR.heun} strokeWidth={2} dot={false} isAnimationActive={false} />
                          <Line type="monotone" dataKey="exacta" name="Exacta cos(t)" stroke={COLOR.exacta} strokeWidth={2} strokeDasharray="5 5" dot={false} isAnimationActive={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <span className="pres-img-caption">
                      Cálculo en vivo (<code>GET /solucion?metodo=heun</code>): Error final en t = 10 s es{" "}
                      <strong>{datosHeun ? Number(datosHeun.error_final).toExponential(2) : "8.12e-3"}</strong>.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SLIDE 8: RUNGE-KUTTA DE ORDEN 4 / RK4 (CON PÉNDULO EN VIVO) */}
        {/* ======================================================== */}
        {slide === 7 && (
          <div className="pres-card">
            <div className="pres-slide-header">
              <div>
                <div className="pres-slide-category">Máxima Precisión · Lo que programan (Punto 1)</div>
                <h2 className="pres-slide-title">
                  Runge-Kutta de <strong>Orden 4 (RK4)</strong>
                </h2>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  className={`pres-tab-btn ${tabSlide8 === "pendulos" ? "active" : ""}`}
                  onClick={() => setTabSlide8("pendulos")}
                >
                  ⚖️ Péndulos en Vivo
                </button>
                <button
                  className={`pres-tab-btn ${tabSlide8 === "grafica" ? "active" : ""}`}
                  onClick={() => setTabSlide8("grafica")}
                >
                  📈 Gráfica vs Exacta
                </button>
                <span className="pres-slide-speaker-tag">Orden O(h⁴)</span>
              </div>
            </div>

            <div className="pres-split-grid uneven-left">
              {/* Código real a la izquierda */}
              <div className="pres-col">
                <div className="pres-code-card">
                  <div className="pres-code-header">
                    <span className="pres-code-filename">back/integradores.py</span>
                    <span className="pres-code-tag">RK4 Clásico</span>
                  </div>
                  <pre className="pres-code-body">{CODE_RK4}</pre>
                </div>

                <div className="pres-highlight">
                  <strong>Poder de Convergencia O(h⁴):</strong> Evalúa 4 pendientes y aplica la ponderación de Simpson:
                  <div style={{ margin: "6px 0", textAlign: "center", fontSize: "14px", fontFamily: "Georgia, serif" }}>
                    <em>y<sub>i+1</sub> = y<sub>i</sub> + h·</em><Fraccion arriba="k₁ + 2k₂ + 2k₃ + k₄" abajo="6" />
                  </div>
                  Al dividir el paso a la mitad, el error decrece por un factor de <strong>16</strong> (2⁴).
                </div>
              </div>

              {/* Péndulos lado a lado o Gráfica viva a la derecha */}
              <div className="pres-col">
                {tabSlide8 === "pendulos" ? (
                  <DoblePenduloSlide
                    metodo="rk4"
                    nombreMetodo="RUNGE-KUTTA 4 (SINCRONIZACIÓN PURA)"
                    colorMetodo="#00A8E8"
                    hInicial={0.05}
                    tfInicial={40}
                    altura={200}
                    anchura={220}
                  />
                ) : (
                  <div className="pres-img-card" style={{ height: 260 }}>
                    <button
                      className="pres-expand-chart-btn"
                      onClick={() =>
                        setModalGrafica({
                          tipo: "rk4",
                          titulo: "Precisión de Runge-Kutta 4 (RK4) vs. Curva Exacta cos(t)",
                          subtitulo: "Integrador clásico de 4.º orden con evaluación de 4 pendientes intermedias (Regla de Simpson)",
                          caption: `El error final en t = 10s es de apenas ${datosRk4 ? Number(datosRk4.error_final).toExponential(2) : "3.94e-6"}, haciendo que la trayectoria numérica coincida con extrema fidelidad sobre cos(t).`,
                        })
                      }
                      title="Agrandar gráfica en modal de alta definición"
                    >
                      <span>⛶</span> Agrandar
                    </button>
                    <div style={{ width: "100%", height: "100%" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartRk4Data} margin={{ top: 5, right: 15, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                          <XAxis dataKey="t" tickFormatter={(v) => +Number(v).toFixed(0)} stroke="#64748B" />
                          <YAxis stroke="#64748B" />
                          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => Number(v).toFixed(5)} />
                          <Legend verticalAlign="top" height={24} />
                          <Line type="monotone" dataKey="rk4" name="RK4 Numérico" stroke={COLOR.rk4} strokeWidth={2} dot={false} isAnimationActive={false} />
                          <Line type="monotone" dataKey="exacta" name="Exacta cos(t)" stroke={COLOR.exacta} strokeWidth={2} strokeDasharray="5 5" dot={false} isAnimationActive={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <span className="pres-img-caption">
                      Cálculo en vivo (<code>GET /solucion?metodo=rk4</code>): Error en t = 10 s es de apenas{" "}
                      <strong>{datosRk4 ? Number(datosRk4.error_final).toExponential(2) : "3.94e-6"}</strong> (coincidencia analítica casi indistinguible).
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SLIDE 9: ANÁLISIS DE ERROR Y CRITERIO DE INGENIERÍA */}
        {/* ======================================================== */}
        {slide === 8 && (
          <div className="pres-card">
            <div className="pres-slide-header">
              <div>
                <div className="pres-slide-category">Resultados Numéricos &amp; Conclusiones · Puntos 2 y 3</div>
                <h2 className="pres-slide-title">
                  Análisis de Error, Orden Experimental y <strong>Decisión de Ingeniería</strong>
                </h2>
              </div>
              <span className="pres-slide-speaker-tag">Criterio Profesional</span>
            </div>

            <div className="pres-split-grid">
              {/* Tabla y gráfica log-log viva alimentada por FastAPI a la izquierda */}
              <div className="pres-col">
                <table className="pres-table">
                  <thead>
                    <tr>
                      <th>Método</th>
                      <th>Orden Teórico</th>
                      <th>Orden Estimado (API)</th>
                      <th>Error final (h = 0.025)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <strong style={{ color: "#DC2626" }}>Euler</strong>
                      </td>
                      <td>O(h) = 1</td>
                      <td>
                        <strong>{datosErr ? datosErr.metodos.euler.orden.toFixed(2) : "1.17"}</strong>
                      </td>
                      <td>1.13 × 10⁻¹</td>
                    </tr>
                    <tr>
                      <td>
                        <strong style={{ color: "#02468F" }}>Heun (RK2)</strong>
                      </td>
                      <td>O(h²) = 2</td>
                      <td>
                        <strong>{datosErr ? datosErr.metodos.heun.orden.toFixed(2) : "1.94"}</strong>
                      </td>
                      <td>5.51 × 10⁻⁴</td>
                    </tr>
                    <tr>
                      <td>
                        <strong style={{ color: "#00A8E8" }}>RK4</strong>
                      </td>
                      <td>O(h⁴) = 4</td>
                      <td>
                        <strong>{datosErr ? datosErr.metodos.rk4.orden.toFixed(2) : "3.92"}</strong>
                      </td>
                      <td>1.71 × 10⁻⁸</td>
                    </tr>
                  </tbody>
                </table>

                <div className="pres-img-card" style={{ height: 210 }}>
                  <button
                    className="pres-expand-chart-btn"
                    onClick={() =>
                      setModalGrafica({
                        tipo: "error",
                        titulo: "Error Numérico vs. Paso h (Escala Log-Log) & Órdenes Observados",
                        subtitulo: "Comprobación experimental de pendientes log₂ (e(h) / e(h/2)) para Euler, Heun y RK4",
                        caption: `Las tres rectas de pendientes distintas confirman empíricamente los órdenes asintóticos: Euler (p ≈ 1.0), Heun (p ≈ 2.0) y RK4 (p ≈ 3.9), tal como predice la teoría de convergencia numérica.`,
                      })
                    }
                    title="Agrandar gráfica en modal de alta definición"
                  >
                    <span>⛶</span> Agrandar
                  </button>
                  <div style={{ width: "100%", height: "100%" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartErrData} margin={{ top: 5, right: 15, left: -5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                        <XAxis dataKey="h" scale="log" domain={["dataMin", "dataMax"]} tickFormatter={(v) => +Number(v).toFixed(3)} stroke="#64748B" />
                        <YAxis scale="log" domain={["auto", "auto"]} tickFormatter={(v) => Number(v).toExponential(0)} stroke="#64748B" />
                        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => Number(v).toExponential(2)} />
                        <Legend verticalAlign="top" height={22} />
                        <Line type="linear" dataKey="euler" name="Euler (Pendiente ≈ 1)" stroke={COLOR.euler} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                        <Line type="linear" dataKey="heun" name="Heun (Pendiente ≈ 2)" stroke={COLOR.heun} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                        <Line type="linear" dataKey="rk4" name="RK4 (Pendiente ≈ 4)" stroke={COLOR.rk4} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <span className="pres-img-caption">
                    Gráfica log-log viva desde <code>GET /error-vs-h</code> con fórmula de estimación:{" "}
                    <em>orden ≈ log₂</em>(<Fraccion arriba="e(h)" abajo="e(h/2)" />).
                  </span>
                </div>
              </div>

              {/* Conclusiones de ingeniería a la derecha */}
              <div className="pres-col">
                <div className="pres-criteria-grid">
                  <div className="pres-criterion">
                    <div className="pres-criterion-header">
                      <span className="pres-criterion-name">Runge-Kutta 4</span>
                      <span className="pres-criterion-badge">Alta Precisión</span>
                    </div>
                    <p className="pres-criterion-desc">
                      Recomendado para trayectorias de alta precisión en ventanas de tiempo cortas o medianas donde el error
                      debe ser prácticamente nulo.
                    </p>
                  </div>

                  <div className="pres-criterion">
                    <div className="pres-criterion-header">
                      <span className="pres-criterion-name">Heun / RK2</span>
                      <span className="pres-criterion-badge">Costo-Beneficio</span>
                    </div>
                    <p className="pres-criterion-desc">
                      Ideal cuando la evaluación de la función <em>f</em> tiene costo moderado y se necesita más fidelidad que Euler
                      sin el costo de 4 evaluaciones de RK4.
                    </p>
                  </div>

                  <div className="pres-criterion highlight">
                    <div className="pres-criterion-header">
                      <span className="pres-criterion-name">Euler Simpléctico</span>
                      <span className="pres-criterion-badge" style={{ background: "rgba(255, 207, 1, 0.25)", color: "#92400E" }}>
                        Física y Videojuegos
                      </span>
                    </div>
                    <p className="pres-criterion-desc">
                      Estándar de la industria en motores físicos (Box2D, PhysX). Aunque su orden es 1,
                      conserva la energía y <strong>garantiza que la simulación no explote</strong>.
                    </p>
                  </div>
                </div>

                <div className="pres-highlight" style={{ marginTop: 4 }}>
                  <strong>Conclusión del Proyecto:</strong> En ingeniería informática aplicada a la simulación física,
                  un método que preserve los invariantes físicos del sistema (método simpléctico) es superior a un método
                  de alto orden que introduzca disipación o inyección espuria de energía a largo plazo.
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Barra de control inferior (Dock Flotante) */}
      <nav className="pres-nav-dock">
        <button
          className="pres-nav-btn"
          disabled={slide === 0}
          onClick={() => setSlide((s) => Math.max(s - 1, 0))}
        >
          ← Anterior
        </button>

        <span className="pres-nav-counter">
          {String(slide + 1).padStart(2, "0")} / {String(totalSlides).padStart(2, "0")}
        </span>

        <button
          className="pres-nav-btn"
          disabled={slide === totalSlides - 1}
          onClick={() => setSlide((s) => Math.min(s + 1, totalSlides - 1))}
        >
          Siguiente →
        </button>

        <div className="pres-nav-hint">
          <span className="pres-kbd">←</span> <span className="pres-kbd">→</span> Navegar
          &nbsp;·&nbsp; <span className="pres-kbd">1-9</span> Salto
          &nbsp;·&nbsp; <span className="pres-kbd">F</span> Pantalla completa
        </div>
      </nav>
      {/* Modal Moderno y Suave para Gráficas Ampliadas en Alta Resolución */}
      {modalGrafica && (
        <div className="pres-modal-backdrop" onClick={() => setModalGrafica(null)}>
          <div className="pres-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="pres-modal-header">
              <div>
                <span className="pres-modal-tag">Vista Ampliada de Alta Definición · Proyecto EDO</span>
                <h2 className="pres-modal-title">{modalGrafica.titulo}</h2>
                <p className="pres-modal-sub">{modalGrafica.subtitulo}</p>
              </div>
              <button
                className="pres-modal-close-btn"
                onClick={() => setModalGrafica(null)}
                title="Cerrar modal (Esc)"
              >
                ✕ Cerrar
              </button>
            </div>

            <div className="pres-modal-chart-body">
              {modalGrafica.tipo === "energia" && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartEneData} margin={{ top: 15, right: 30, left: 10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                    <XAxis
                      dataKey="t"
                      tickFormatter={(v) => `${+Number(v).toFixed(0)} s`}
                      stroke="#64748B"
                      label={{ value: "Tiempo t (segundos)", position: "insideBottom", offset: -12, fill: "#475569", fontSize: 13, fontWeight: 700 }}
                    />
                    <YAxis
                      stroke="#64748B"
                      label={{ value: "Energía E(t) = ½(u² + v²)", angle: -90, position: "insideLeft", offset: 10, fill: "#475569", fontSize: 13, fontWeight: 700 }}
                    />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => Number(v).toFixed(4)} />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 13, fontWeight: 700 }} />
                    <ReferenceLine y={0.5} stroke="#02468F" strokeDasharray="4 4" label={{ value: "E₀ = 0.500 (Teórica)", fill: "#02468F", fontWeight: 700 }} />
                    <Line type="monotone" dataKey="euler" name="Euler Explícito (Inyección espuria de energía hasta ~7)" stroke={COLOR.euler} strokeWidth={3} dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="simplectico" name="Euler Simpléctico (Energía acotada estrictamente en ~0.500)" stroke={COLOR.simplectico} strokeWidth={3} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {modalGrafica.tipo === "heun" && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartHeunData} margin={{ top: 15, right: 30, left: 10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                    <XAxis
                      dataKey="t"
                      tickFormatter={(v) => `${+Number(v).toFixed(0)} s`}
                      stroke="#64748B"
                      label={{ value: "Tiempo t (segundos)", position: "insideBottom", offset: -12, fill: "#475569", fontSize: 13, fontWeight: 700 }}
                    />
                    <YAxis
                      stroke="#64748B"
                      label={{ value: "Posición y(t)", angle: -90, position: "insideLeft", offset: 10, fill: "#475569", fontSize: 13, fontWeight: 700 }}
                    />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => Number(v).toFixed(5)} />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 13, fontWeight: 700 }} />
                    <Line type="monotone" dataKey="heun" name="Heun (RK2) - Predictor-Corrector" stroke={COLOR.heun} strokeWidth={3} dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="exacta" name="Solución Exacta cos(t)" stroke={COLOR.exacta} strokeWidth={2.5} strokeDasharray="5 5" dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {modalGrafica.tipo === "rk4" && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartRk4Data} margin={{ top: 15, right: 30, left: 10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                    <XAxis
                      dataKey="t"
                      tickFormatter={(v) => `${+Number(v).toFixed(0)} s`}
                      stroke="#64748B"
                      label={{ value: "Tiempo t (segundos)", position: "insideBottom", offset: -12, fill: "#475569", fontSize: 13, fontWeight: 700 }}
                    />
                    <YAxis
                      stroke="#64748B"
                      label={{ value: "Posición y(t)", angle: -90, position: "insideLeft", offset: 10, fill: "#475569", fontSize: 13, fontWeight: 700 }}
                    />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => Number(v).toFixed(6)} />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 13, fontWeight: 700 }} />
                    <Line type="monotone" dataKey="rk4" name="Runge-Kutta 4 (RK4) - Cuarto Orden" stroke={COLOR.rk4} strokeWidth={3} dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="exacta" name="Solución Exacta cos(t)" stroke={COLOR.exacta} strokeWidth={2.5} strokeDasharray="5 5" dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {modalGrafica.tipo === "error" && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartErrData} margin={{ top: 15, right: 30, left: 15, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                    <XAxis
                      dataKey="h"
                      scale="log"
                      domain={["dataMin", "dataMax"]}
                      tickFormatter={(v) => +Number(v).toFixed(3)}
                      stroke="#64748B"
                      label={{ value: "Paso de tiempo h (Escala Logarítmica)", position: "insideBottom", offset: -12, fill: "#475569", fontSize: 13, fontWeight: 700 }}
                    />
                    <YAxis
                      scale="log"
                      domain={["auto", "auto"]}
                      tickFormatter={(v) => Number(v).toExponential(0)}
                      stroke="#64748B"
                      label={{ value: "Error Absoluto |ynum(10) - cos(10)|", angle: -90, position: "insideLeft", offset: 15, fill: "#475569", fontSize: 13, fontWeight: 700 }}
                    />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => Number(v).toExponential(3)} />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 13, fontWeight: 700 }} />
                    <Line type="linear" dataKey="euler" name="Euler (Pendiente experimental ≈ 1.0) → O(h)" stroke={COLOR.euler} strokeWidth={3} dot={{ r: 5 }} isAnimationActive={false} />
                    <Line type="linear" dataKey="heun" name="Heun (Pendiente experimental ≈ 2.0) → O(h²)" stroke={COLOR.heun} strokeWidth={3} dot={{ r: 5 }} isAnimationActive={false} />
                    <Line type="linear" dataKey="rk4" name="RK4 (Pendiente experimental ≈ 3.9) → O(h⁴)" stroke={COLOR.rk4} strokeWidth={3} dot={{ r: 5 }} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="pres-modal-footer">
              <span style={{ maxWidth: "80%" }}>{modalGrafica.caption}</span>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--uni-blue)" }}>
                Presiona <strong>Esc</strong> para cerrar
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
