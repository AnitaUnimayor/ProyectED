import { useEffect, useRef, useState } from "react";
import { pedir } from "../api";

export default function DoblePenduloSlide({
  metodo = "euler",
  nombreMetodo = "EULER",
  colorMetodo = "#DC2626",
  hInicial = 0.05,
  tfInicial = 40,
  altura = 200,
  anchura = 220,
}) {
  const canvasIzqRef = useRef(null);
  const canvasDerRef = useRef(null);

  const [h, setH] = useState(hInicial);
  const [tf, setTf] = useState(tfInicial);
  const [cargando, setCargando] = useState(true);
  const [contadorReset, setContadorReset] = useState(0);

  // Estados de telemetría en vivo para la sustentación
  const [telemetriaIzq, setTelemetriaIzq] = useState({ t: 0, u: 1, v: 0, E: 0.5, error: 0 });
  const [telemetriaDer, setTelemetriaDer] = useState({ t: 0, u: 1, v: 0, E: 0.5, error: 0 });

  // Simulación local idéntica al backend si la API tardara en responder
  function simularLocal(tipo, paso, total) {
    const n = Math.round(total / paso);
    const t = [];
    const numerica = [];
    const velocidades = [];
    let u = 1.0;
    let v = 0.0;

    for (let i = 0; i <= n; i++) {
      t.push(i * paso);
      numerica.push(u);
      velocidades.push(v);

      if (tipo === "simplectico") {
        v = v - paso * u;
        u = u + paso * v;
      } else if (tipo === "heun") {
        const k1u = v;
        const k1v = -u;
        const uTent = u + paso * k1u;
        const vTent = v + paso * k1v;
        const k2u = vTent;
        const k2v = -uTent;
        u = u + (paso / 2) * (k1u + k2u);
        v = v + (paso / 2) * (k1v + k2v);
      } else if (tipo === "rk4") {
        const k1u = v;
        const k1v = -u;
        const k2u = v + (paso / 2) * k1v;
        const k2v = -(u + (paso / 2) * k1u);
        const k3u = v + (paso / 2) * k2v;
        const k3v = -(u + (paso / 2) * k2u);
        const k4u = v + paso * k3v;
        const k4v = -(u + paso * k3u);
        u = u + (paso / 6) * (k1u + 2 * k2u + 2 * k3u + k4u);
        v = v + (paso / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
      } else {
        // euler explícito
        const unuevo = u + paso * v;
        const vnuevo = v + paso * -u;
        u = unuevo;
        v = vnuevo;
      }
    }
    return { t, numerica, velocidades };
  }

  useEffect(() => {
    let activo = true;
    setCargando(true);

    const p1 = pedir(`/solucion?metodo=${metodo}&h=${h}&tf=${tf}`).catch(() =>
      simularLocal(metodo, h, tf)
    );
    const p2 = pedir(`/solucion?metodo=simplectico&h=${h}&tf=${tf}`).catch(() =>
      simularLocal("simplectico", h, tf)
    );

    Promise.all([p1, p2]).then(([dIzq, dDer]) => {
      if (!activo) return;
      setCargando(false);

      // Si vienen del backend, calculamos las velocidades aproximadas u' = (u[i+1]-u[i-1])/2h o usamos u' = -sin(t)
      const lenIzq = dIzq.t.length;
      const lenDer = dDer.t.length;

      let frameId;
      let idx = 0;

      function loop() {
        if (!activo) return;

        // 1. Renderizar Canvas Izquierdo
        const canvasIzq = canvasIzqRef.current;
        if (canvasIzq) {
          const ctx = canvasIzq.getContext("2d");
          const cx = canvasIzq.width / 2;
          const cy = 28;
          const largo = altura * 0.52;

          ctx.clearRect(0, 0, canvasIzq.width, canvasIzq.height);

          // Fondo cuadriculado sutil técnico
          ctx.strokeStyle = "rgba(2, 70, 143, 0.05)";
          ctx.lineWidth = 1;
          for (let x = 0; x < canvasIzq.width; x += 16) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvasIzq.height);
            ctx.stroke();
          }

          const uAct = dIzq.numerica[idx] || 0;
          const tAct = dIzq.t[idx] || 0;
          // Derivada discreta centrada o hacia atrás para calcular energía real
          const uPrev = idx > 0 ? dIzq.numerica[idx - 1] : uAct;
          const uNext = idx < lenIzq - 1 ? dIzq.numerica[idx + 1] : uAct;
          const vAct = (uNext - uPrev) / (2 * h);
          const EAct = 0.5 * (uAct * uAct + vAct * vAct);
          const errAct = Math.abs(uAct - Math.cos(tAct));

          const angulo = uAct * 0.85;
          const x = cx + largo * Math.sin(angulo);
          const y = cy + largo * Math.cos(angulo);

          // Eje de referencia punteado
          ctx.setLineDash([3, 3]);
          ctx.strokeStyle = "rgba(100, 116, 139, 0.3)";
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx, cy + largo);
          ctx.stroke();
          ctx.setLineDash([]);

          // Vara metálica
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(x, y);
          ctx.strokeStyle = "#475569";
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Masa circular
          ctx.beginPath();
          ctx.arc(x, y, 11, 0, Math.PI * 2);
          ctx.fillStyle = colorMetodo;
          ctx.fill();
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 2;
          ctx.stroke();

          // Pivote superior
          ctx.beginPath();
          ctx.arc(cx, cy, 4, 0, Math.PI * 2);
          ctx.fillStyle = "#02468F";
          ctx.fill();

          ctx.fillStyle = colorMetodo;
          ctx.font = "bold 11px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(nombreMetodo, cx, canvasIzq.height - 8);

          // Actualizar telemetría reactiva para las cajas de datos (cada 4 frames)
          if (idx % 4 === 0) {
            setTelemetriaIzq({ t: tAct, u: uAct, v: vAct, E: EAct, error: errAct });
          }
        }

        // 2. Renderizar Canvas Derecho (Simpléctico)
        const canvasDer = canvasDerRef.current;
        if (canvasDer) {
          const ctx = canvasDer.getContext("2d");
          const cx = canvasDer.width / 2;
          const cy = 28;
          const largo = altura * 0.52;

          ctx.clearRect(0, 0, canvasDer.width, canvasDer.height);

          ctx.strokeStyle = "rgba(2, 70, 143, 0.05)";
          ctx.lineWidth = 1;
          for (let x = 0; x < canvasDer.width; x += 16) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvasDer.height);
            ctx.stroke();
          }

          const uAct = dDer.numerica[idx] || 0;
          const tAct = dDer.t[idx] || 0;
          const uPrev = idx > 0 ? dDer.numerica[idx - 1] : uAct;
          const uNext = idx < lenDer - 1 ? dDer.numerica[idx + 1] : uAct;
          const vAct = (uNext - uPrev) / (2 * h);
          const EAct = 0.5 * (uAct * uAct + vAct * vAct);
          const errAct = Math.abs(uAct - Math.cos(tAct));

          const angulo = uAct * 0.85;
          const x = cx + largo * Math.sin(angulo);
          const y = cy + largo * Math.cos(angulo);

          ctx.setLineDash([3, 3]);
          ctx.strokeStyle = "rgba(100, 116, 139, 0.3)";
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx, cy + largo);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(x, y);
          ctx.strokeStyle = "#475569";
          ctx.lineWidth = 2.5;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(x, y, 11, 0, Math.PI * 2);
          ctx.fillStyle = "#059669";
          ctx.fill();
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(cx, cy, 4, 0, Math.PI * 2);
          ctx.fillStyle = "#02468F";
          ctx.fill();

          ctx.fillStyle = "#059669";
          ctx.font = "bold 11px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("SIMPLÉCTICO (REFERENCIA)", cx, canvasDer.height - 8);

          if (idx % 4 === 0) {
            setTelemetriaDer({ t: tAct, u: uAct, v: vAct, E: EAct, error: errAct });
          }
        }

        idx = (idx + 1) % lenIzq;
        frameId = requestAnimationFrame(loop);
      }

      frameId = requestAnimationFrame(loop);

      return () => {
        if (frameId) cancelAnimationFrame(frameId);
      };
    });

    return () => {
      activo = false;
    };
  }, [metodo, h, tf, colorMetodo, nombreMetodo, altura, contadorReset]);

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1.5px solid #D8E1EB",
        borderRadius: 14,
        padding: "12px 16px",
        boxShadow: "0 4px 16px rgba(2, 70, 143, 0.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 10,
          borderBottom: "1.5px solid #E2E8F0",
          paddingBottom: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#02468F" }} />
          <span style={{ fontSize: 11.5, fontWeight: 800, color: "#02468F", letterSpacing: "0.4px" }}>
            {nombreMetodo} VS. SIMPLÉCTICO
          </span>
        </div>

        {/* Controles interactivos de h y tf ajustables en vivo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 11 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ color: "#475569", fontWeight: 700 }}>Paso h:</span>
            <select
              value={h}
              onChange={(e) => setH(Number(e.target.value))}
              style={{
                padding: "2px 6px",
                borderRadius: 6,
                border: "1.5px solid #CBD5E1",
                fontSize: 11,
                fontWeight: 700,
                color: "#080C31",
                background: "#F8FAFC",
                cursor: "pointer",
              }}
            >
              <option value={0.01}>0.010 s</option>
              <option value={0.025}>0.025 s</option>
              <option value={0.05}>0.050 s</option>
              <option value={0.1}>0.100 s</option>
              <option value={0.15}>0.150 s</option>
              <option value={0.2}>0.200 s</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ color: "#475569", fontWeight: 700 }}>Tiempo tf:</span>
            <select
              value={tf}
              onChange={(e) => setTf(Number(e.target.value))}
              style={{
                padding: "2px 6px",
                borderRadius: 6,
                border: "1.5px solid #CBD5E1",
                fontSize: 11,
                fontWeight: 700,
                color: "#080C31",
                background: "#F8FAFC",
                cursor: "pointer",
              }}
            >
              <option value={10}>10 s (error)</option>
              <option value={20}>20 s</option>
              <option value={30}>30 s</option>
              <option value={40}>40 s</option>
              <option value={50}>50 s (energía)</option>
              <option value={100}>100 s (largo)</option>
            </select>
          </div>

          <button
            onClick={() => setContadorReset((c) => c + 1)}
            title="Reiniciar animación desde t = 0"
            style={{
              padding: "2px 7px",
              borderRadius: 6,
              border: "1px solid #CBD5E1",
              background: "#FFFFFF",
              color: "#02468F",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            🔄 Reset
          </button>
        </div>
      </div>

      {/* Los dos Canvas lado a lado */}
      <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
        <div style={{ textAlign: "center", flex: 1, maxWidth: anchura }}>
          <canvas
            ref={canvasIzqRef}
            width={anchura}
            height={altura}
            style={{
              border: "1px solid #E2E8F0",
              borderRadius: 10,
              background: "#F8FAFC",
              display: "block",
              width: "100%",
            }}
          />
          {/* Telemetría debajo del péndulo izquierdo */}
          <div
            style={{
              marginTop: 6,
              padding: "6px 8px",
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 8,
              fontSize: "11px",
              lineHeight: 1.35,
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748B" }}>Tiempo t:</span>
              <strong>{telemetriaIzq.t.toFixed(1)} s</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748B" }}>Energía E(t):</span>
              <strong
                style={{
                  color:
                    telemetriaIzq.E > 0.6
                      ? "#DC2626"
                      : telemetriaIzq.E < 0.45
                      ? "#D97706"
                      : "#059669",
                }}
              >
                {telemetriaIzq.E.toFixed(3)}
              </strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748B" }}>Error |y-cos|:</span>
              <span style={{ fontFamily: "monospace", fontWeight: 700 }}>
                {telemetriaIzq.error.toExponential(2)}
              </span>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", flex: 1, maxWidth: anchura }}>
          <canvas
            ref={canvasDerRef}
            width={anchura}
            height={altura}
            style={{
              border: "1px solid #E2E8F0",
              borderRadius: 10,
              background: "#F8FAFC",
              display: "block",
              width: "100%",
            }}
          />
          {/* Telemetría debajo del péndulo derecho (Simpléctico) */}
          <div
            style={{
              marginTop: 6,
              padding: "6px 8px",
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 8,
              fontSize: "11px",
              lineHeight: 1.35,
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748B" }}>Tiempo t:</span>
              <strong>{telemetriaDer.t.toFixed(1)} s</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748B" }}>Energía E(t):</span>
              <strong style={{ color: "#059669" }}>
                {telemetriaDer.E.toFixed(3)} (Acotada)
              </strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748B" }}>Error |y-cos|:</span>
              <span style={{ fontFamily: "monospace", fontWeight: 700 }}>
                {telemetriaDer.error.toExponential(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
