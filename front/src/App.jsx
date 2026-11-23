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
import { pedir } from "./api";
import Pendulos from "./components/Pendulos";
import Presentacion from "./components/Presentacion";
import "./App.css";

// ------------------------------------------------------------
// Datos fijos
// ------------------------------------------------------------
const METODOS = [
  { id: "euler", nombre: "Euler" },
  { id: "heun", nombre: "Heun (RK2)" },
  { id: "rk4", nombre: "Runge-Kutta 4" },
  { id: "simplectico", nombre: "Euler simpléctico" },
];

// Colores de cada método (brillantes para tema claro)
const COLOR = {
  euler: "#fb923c",       // naranja
  heun: "#4ade80",        // verde
  rk4: "#38bdf8",         // celeste
  simplectico: "#a78bfa", // violeta
  exacta: "#ef4444",      // rojo brillante (curva exacta)
};

const ORDEN_TEORICO = { euler: 1, heun: 2, rk4: 4 };

// ------------------------------------------------------------
// Utilidades
// ------------------------------------------------------------
function useApi(ruta) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    pedir(ruta)
      .then((d) => {
        if (activo) {
          setDatos(d);
          setError(null);
        }
      })
      .catch((e) => {
        if (activo) setError(e.message);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [ruta]);

  return { datos, error, cargando };
}

function reducir(filas, max = 500) {
  const salto = Math.ceil(filas.length / max);
  return filas.filter((_, i) => i % salto === 0);
}

const exp = (v) => Number(v).toExponential(2);

const GRID = "#e2e8f0";
const TOOLTIP = {
  backgroundColor: "#ffffff",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  color: "#0f172a",
};

// ------------------------------------------------------------
// Componentes pequeños
// ------------------------------------------------------------
function Kpi({ etiqueta, valor, detalle }) {
  return (
    <div className="tarjeta kpi">
      <span className="kpi-etiqueta">{etiqueta}</span>
      <span className="kpi-valor">{valor}</span>
      <span className="kpi-detalle">{detalle}</span>
    </div>
  );
}

function Tarjeta({ titulo, subtitulo, ancho, estado, children }) {
  return (
    <section className={`tarjeta ${ancho ? "ancho" : ""}`}>
      <h2>{titulo}</h2>
      <p className="sub">{subtitulo}</p>
      {children}
      <div className="estado">{estado.cargando ? "Calculando…" : ""}</div>
      {estado.error && (
        <div className="error">
          No se pudo conectar con la API ({estado.error}). Revisa que el
          servidor esté encendido con <code>fastapi dev main.py</code>.
        </div>
      )}
    </section>
  );
}

function Deslizador({ etiqueta, valor, min, max, paso, onChange }) {
  return (
    <label className="control">
      <span>
        {etiqueta}: <b>{valor}</b>
      </span>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="range"
          min={min}
          max={max}
          step={paso}
          value={valor}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ flex: 1 }}
        />
        <input
          type="number"
          min={min}
          max={max}
          step={paso}
          value={valor}
          onChange={(e) => onChange(parseFloat(e.target.value) || min)}
          style={{ width: 70, padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 14 }}
        />
      </div>
    </label>
  );
}

// ------------------------------------------------------------
// Aplicación principal
// ------------------------------------------------------------
export default function App() {
  const [vista, setVista] = useState("presentacion");
  const [slideIndex, setSlideIndex] = useState(0);

  // ============================================================
  // CONTROLES
  // ============================================================
  const [metodo, setMetodo] = useState("rk4");
  const [h, setH] = useState(0.1);
  const [tf, setTf] = useState(10);

  const [hCmp, setHCmp] = useState(0.1);
  const [tfCmp, setTfCmp] = useState(10);

  const [h0, setH0] = useState(0.2);

  const [hE, setHE] = useState(0.05);
  const [TE, setTE] = useState(50);

  // ============================================================
  // DATOS DE LA API
  // ============================================================
  const sol = useApi(`/solucion?metodo=${metodo}&h=${h}&tf=${tf}`);
  const err = useApi(`/error-vs-h?h0=${h0}`);
  const ene = useApi(`/energia?h=${hE}&T=${TE}`);

  const cmpEuler = useApi(`/solucion?metodo=euler&h=${hCmp}&tf=${tfCmp}`);
  const cmpHeun = useApi(`/solucion?metodo=heun&h=${hCmp}&tf=${tfCmp}`);
  const cmpRk4 = useApi(`/solucion?metodo=rk4&h=${hCmp}&tf=${tfCmp}`);

  const datosSol = useMemo(() => {
    if (!sol.datos) return [];
    const { t, numerica, exacta } = sol.datos;
    return reducir(t.map((ti, i) => ({ t: ti, numerica: numerica[i], exacta: exacta[i] })));
  }, [sol.datos]);

  const datosErr = useMemo(() => {
    if (!err.datos) return [];
    const { pasos, metodos } = err.datos;
    return pasos
      .map((hi, i) => ({
        h: hi,
        euler: metodos.euler.errores[i],
        heun: metodos.heun.errores[i],
        rk4: metodos.rk4.errores[i],
      }))
      .sort((a, b) => a.h - b.h);
  }, [err.datos]);

  const datosEne = useMemo(() => {
    if (!ene.datos) return [];
    const { t, euler, simplectico } = ene.datos;
    return reducir(t.map((ti, i) => ({ t: ti, euler: euler[i], simplectico: simplectico[i] })));
  }, [ene.datos]);

  const datosCmp = useMemo(() => {
    if (!cmpEuler.datos || !cmpHeun.datos || !cmpRk4.datos) return null;
    const { t } = cmpEuler.datos;
    return t.map((ti, i) => ({
      t: ti,
      euler: cmpEuler.datos.numerica[i],
      heun: cmpHeun.datos.numerica[i],
      rk4: cmpRk4.datos.numerica[i],
      exacta: cmpEuler.datos.exacta[i],
    }));
  }, [cmpEuler.datos, cmpHeun.datos, cmpRk4.datos]);

  const erroresCmp = cmpEuler.datos && cmpHeun.datos && cmpRk4.datos
    ? {
        euler: cmpEuler.datos.error_final,
        heun: cmpHeun.datos.error_final,
        rk4: cmpRk4.datos.error_final,
      }
    : null;

  // ============================================================
  // KPIs ordenados y claros
  // ============================================================
  const nombreMetodo = METODOS.find((m) => m.id === metodo).nombre;
  const ordenes = err.datos
    ? ["euler", "heun", "rk4"].map((id) => err.datos.metodos[id].orden.toFixed(1)).join(" · ")
    : "—";
  const energiaEuler = ene.datos ? ene.datos.euler.at(-1).toFixed(2) : "—";
  const energiaSimp = ene.datos ? ene.datos.simplectico.at(-1).toFixed(3) : "—";

  const margen = { top: 10, right: 20, left: 10, bottom: 25 };

  if (vista === "presentacion") {
    return (
      <Presentacion
        slideActual={slideIndex}
        onCambiarSlide={setSlideIndex}
        onVolverAlSimulador={() => setVista("simulador")}
      />
    );
  }

  return (
    <div className="app">
      {/* ---------- Encabezado ---------- */}
      <header className="header">
        <div>
          <h1>¿Qué tan bueno es su integrador?</h1>
          <p>Ecuaciones diferenciales · Unidad 3 · Euler, Heun y Runge-Kutta 4</p>
        </div>
        <div className="chips">
          <button
            onClick={() => setVista("presentacion")}
            style={{
              background: "#421d24",
              color: "#ffffff",
              border: "none",
              padding: "6px 14px",
              borderRadius: "999px",
              fontSize: "12.5px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(66, 29, 36, 0.2)"
            }}
          >
            🎓 Modo Presentación Institucional
          </button>
          <span className="chip">
            <i className={`punto ${sol.error ? "mal" : "bien"}`} />
            {sol.error ? "API sin conexión" : "API conectada"}
          </span>
          <span className="chip">y″ + y = 0</span>
          <span className="chip">y(0) = 1 · y′(0) = 0</span>
          <span className="chip">Exacta: y(t) = cos t</span>
        </div>
      </header>

      {/* ---------- Indicadores KPI ---------- */}
      <div className="kpis">
        <Kpi
          etiqueta="Error final"
          valor={sol.datos ? exp(sol.datos.error_final) : "—"}
          detalle={`${nombreMetodo} · h = ${h} · t = ${tf}`}
        />
        <Kpi etiqueta="Orden estimado" valor={ordenes} detalle="Euler · Heun · RK4" />
        <Kpi etiqueta="Energía Euler" valor={energiaEuler} detalle="Exacta: 0.5" />
        <Kpi etiqueta="Energía simpléctico" valor={energiaSimp} detalle="Exacta: 0.5" />
      </div>

      <div className="grid">
        {/* ---------- 1. Numérica vs exacta ---------- */}
        <Tarjeta
          ancho
          titulo="1. Solución numérica vs solución exacta"
          subtitulo="Elige método y paso h. Con h grande, Euler se separa de cos(t)."
          estado={sol}
        >
          <div className="controles">
            <label className="control">
              <span>Método</span>
              <select value={metodo} onChange={(e) => setMetodo(e.target.value)}>
                {METODOS.map((m) => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            </label>
            <Deslizador etiqueta="Paso h [s]" valor={h} min={0.01} max={0.5} paso={0.01} onChange={setH} />
            <Deslizador etiqueta="Tiempo final [s]" valor={tf} min={2} max={50} paso={1} onChange={setTf} />
          </div>
          <div className="grafica">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={datosSol} margin={margen}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis
                  dataKey="t"
                  type="number"
                  domain={[0, "dataMax"]}
                  tickFormatter={(v) => +Number(v).toFixed(1)}
                  stroke={GRID}
                  label={{ value: "tiempo [s]", position: "insideBottom", offset: -12 }}
                />
                <YAxis
                  stroke={GRID}
                  label={{ value: "y(t)", angle: -90, position: "insideLeft" }}
                />
                <Tooltip
                  contentStyle={TOOLTIP}
                  formatter={(v) => Number(v).toFixed(4)}
                  labelFormatter={(t) => `t = ${Number(t).toFixed(2)} s`}
                />
                <Legend verticalAlign="top" height={30} />
                <Line
                  type="monotone"
                  dataKey="numerica"
                  name={`Numérica (${nombreMetodo})`}
                  stroke={COLOR[metodo]}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="exacta"
                  name="Exacta cos(t)"
                  stroke={COLOR.exacta}
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Tarjeta>

        {/* ---------- 2. Comparación de 3 métodos ---------- */}
        <Tarjeta
          ancho
          titulo="2. Comparación: 3 métodos en una sola gráfica"
          subtitulo="Mismos h y tf para los tres. Sube h para ver quién se desvía primero."
          estado={cmpEuler}
        >
          <div className="controles">
            <Deslizador etiqueta="Paso h [s]" valor={hCmp} min={0.01} max={0.5} paso={0.01} onChange={setHCmp} />
            <Deslizador etiqueta="Tiempo final [s]" valor={tfCmp} min={2} max={50} paso={1} onChange={setTfCmp} />
          </div>
          <div className="grafica">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={datosCmp || []} margin={margen}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis
                  dataKey="t"
                  type="number"
                  domain={[0, "dataMax"]}
                  tickFormatter={(v) => +Number(v).toFixed(1)}
                  stroke={GRID}
                  label={{ value: "tiempo [s]", position: "insideBottom", offset: -12 }}
                />
                <YAxis
                  stroke={GRID}
                  label={{ value: "y(t)", angle: -90, position: "insideLeft" }}
                />
                <Tooltip
                  contentStyle={TOOLTIP}
                  formatter={(v) => Number(v).toFixed(4)}
                  labelFormatter={(t) => `t = ${Number(t).toFixed(2)} s`}
                />
                <Legend verticalAlign="top" height={30} />
                <Line type="monotone" dataKey="euler" name="Euler" stroke={COLOR.euler} strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="heun" name="Heun (RK2)" stroke={COLOR.heun} strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="rk4" name="Runge-Kutta 4" stroke={COLOR.rk4} strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="exacta" name="Exacta cos(t)" stroke={COLOR.exacta} strokeWidth={2} strokeDasharray="6 4" dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {erroresCmp && (
            <div className="resumen-errores">
              <span><b>Error final en t = {tfCmp}:</b></span>
              <span style={{ color: COLOR.euler }}>Euler {erroresCmp.euler.toExponential(2)}</span>
              <span style={{ color: COLOR.heun }}>Heun {erroresCmp.heun.toExponential(2)}</span>
              <span style={{ color: COLOR.rk4 }}>RK4 {erroresCmp.rk4.toExponential(2)}</span>
            </div>
          )}
        </Tarjeta>

        {/* ---------- 3. Error vs h ---------- */}
        <Tarjeta
          titulo="3. Error vs paso h (escala log-log)"
          subtitulo="La pendiente de cada recta es el orden del método."
          estado={err}
        >
          <div className="controles">
            <Deslizador etiqueta="h inicial [s]" valor={h0} min={0.05} max={0.5} paso={0.05} onChange={setH0} />
          </div>
          <div className="grafica">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={datosErr} margin={margen}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis
                  dataKey="h"
                  type="number"
                  scale="log"
                  domain={["dataMin", "dataMax"]}
                  ticks={datosErr.map((d) => d.h)}
                  tickFormatter={(v) => +Number(v).toFixed(4)}
                  stroke={GRID}
                  label={{ value: "paso h [s]", position: "insideBottom", offset: -12 }}
                />
                <YAxis
                  stroke={GRID}
                  scale="log"
                  domain={["auto", "auto"]}
                  tickFormatter={(v) => Number(v).toExponential(0)}
                  label={{ value: "error en t = 10", angle: -90, position: "insideLeft", offset: 0 }}
                />
                <Tooltip contentStyle={TOOLTIP} formatter={(v) => exp(v)} labelFormatter={(v) => `h = ${v}`} />
                <Legend verticalAlign="top" height={30} />
                {["euler", "heun", "rk4"].map((id) => (
                  <Line
                    key={id}
                    type="linear"
                    dataKey={id}
                    name={METODOS.find((m) => m.id === id).nombre}
                    stroke={COLOR[id]}
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          {err.datos && (
            <table className="tabla">
              <thead>
                <tr>
                  <th>Método</th>
                  <th>Orden estimado</th>
                  <th>Orden teórico</th>
                </tr>
              </thead>
              <tbody>
                {["euler", "heun", "rk4"].map((id) => (
                  <tr key={id}>
                    <td>{METODOS.find((m) => m.id === id).nombre}</td>
                    <td>{err.datos.metodos[id].orden.toFixed(2)}</td>
                    <td>{ORDEN_TEORICO[id]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Tarjeta>

        {/* ---------- 4. Energía ---------- */}
        <Tarjeta
          titulo="4. Energía: Euler vs Euler simpléctico"
          subtitulo="E = ½(y² + y′²) debería ser constante e igual a 0.5."
          estado={ene}
        >
          <div className="controles">
            <Deslizador etiqueta="Paso h [s]" valor={hE} min={0.01} max={0.1} paso={0.01} onChange={setHE} />
            <Deslizador etiqueta="Tiempo total [s]" valor={TE} min={10} max={100} paso={10} onChange={setTE} />
          </div>
          <div className="grafica">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={datosEne} margin={margen}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis
                  dataKey="t"
                  type="number"
                  domain={[0, "dataMax"]}
                  tickFormatter={(v) => +Number(v).toFixed(0)}
                  stroke={GRID}
                  label={{ value: "tiempo [s]", position: "insideBottom", offset: -12 }}
                />
                <YAxis
                  stroke={GRID}
                  label={{ value: "energía E", angle: -90, position: "insideLeft" }}
                />
                <Tooltip
                  contentStyle={TOOLTIP}
                  formatter={(v) => Number(v).toFixed(4)}
                  labelFormatter={(t) => `t = ${Number(t).toFixed(1)} s`}
                />
                <Legend verticalAlign="top" height={30} />
                <ReferenceLine y={0.5} stroke="#94a3b8" strokeDasharray="4 4" />
                <Line
                  type="monotone"
                  dataKey="euler"
                  name="Euler explícito"
                  stroke={COLOR.euler}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="simplectico"
                  name="Euler simpléctico"
                  stroke={COLOR.simplectico}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Tarjeta>

        {/* ---------- 5. Animación de péndulos ---------- */}
        <Pendulos />

        {/* ---------- 6. Explicación ---------- */}
        <section className="tarjeta ancho">
          <h2>5. ¿Cómo funciona y para qué sirve?</h2>
          <div className="teoria">
            <div>
              <h3>Cómo funciona</h3>
              <p>
                La ecuación se convierte en un sistema de primer orden (u′ = v, v′ = −u).
                Cada método avanza paso a paso: Euler usa una pendiente, Heun dos y RK4 cuatro.
              </p>
            </div>
            <div>
              <h3>Qué muestran las gráficas</h3>
              <p>
                Si se reduce h a la mitad, el error se divide por 2^p. Euler explícito agrega
                energía en cada paso; el simpléctico la respeta.
              </p>
            </div>
            <div>
              <h3>Aplicaciones</h3>
              <p>
                Videojuegos, motores de física, simuladores de ingeniería y órbitas de largo
                plazo. Elegir bien el integrador decide si la simulación es fiel o se desarma.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
