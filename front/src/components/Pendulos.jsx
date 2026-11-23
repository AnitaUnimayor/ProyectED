import { useEffect, useRef, useState } from "react";
import { pedir } from "../api";

// ------------------------------------------------------------
// Componente: animación de dos péndulos lado a lado
// - Izquierdo: el método que elijas (Euler, Heun, RK4 o Simpléctico)
// - Derecho: siempre Euler simpléctico (referencia estable)
// Un solo selector de método, un solo paso h y un solo tiempo tf.
// ------------------------------------------------------------
export default function Pendulos() {
  const canvasIzqRef = useRef(null);
  const canvasDerRef = useRef(null);

  // Controles del usuario (uno solo para ambos)
  const [h, setH] = useState(0.05);   // paso de tiempo
  const [tf, setTf] = useState(40);   // tiempo total de simulación
  const [metodo, setMetodo] = useState("euler"); // método del péndulo izquierdo

  // Estado de carga y errores
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Datos que vienen del back
  const [datosIzq, setDatosIzq] = useState(null);
  const [datosDer, setDatosDer] = useState(null);

  // ------------------------------------------------------------
  // Pide las trayectorias al back cada vez que cambie h, tf o método
  // ------------------------------------------------------------
  useEffect(() => {
    setCargando(true);
    setError(null);

    const p1 = pedir(`/solucion?metodo=${metodo}&h=${h}&tf=${tf}`);
    const p2 = pedir(`/solucion?metodo=simplectico&h=${h}&tf=${tf}`);

    Promise.all([p1, p2])
      .then(([d1, d2]) => {
        setDatosIzq(d1);
        setDatosDer(d2);
        setCargando(false);
      })
      .catch((e) => {
        setError(e.message);
        setCargando(false);
      });
  }, [h, tf, metodo]);

  // ------------------------------------------------------------
  // Anima un péndulo en un canvas dado.
  // Muestra el tiempo simulado actual para que se note el avance.
  // ------------------------------------------------------------
  function animar(canvas, t, u, color, nombre, tfTotal) {
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const centroX = canvas.width / 2;
    const centroY = 45;   // punto de pivote
    const largo = 120;    // largo de la vara
    let i = 0;

    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Ángulo del péndulo: la posición u (entre -1 y 1) se convierte en ángulo
      const angulo = u[i] * 0.9;

      // Posición de la masa (círculo al final de la vara)
      const x = centroX + largo * Math.sin(angulo);
      const y = centroY + largo * Math.cos(angulo);

      // Vara
      ctx.beginPath();
      ctx.moveTo(centroX, centroY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Masa
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Pivote
      ctx.beginPath();
      ctx.arc(centroX, centroY, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#64748b";
      ctx.fill();

      // Tiempo simulado actual (se nota el avance al cambiar tf)
      const tActual = t[i];
      ctx.fillStyle = "#475569";
      ctx.font = "bold 13px Segoe UI, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`t = ${tActual.toFixed(1)} s / ${tfTotal.toFixed(0)} s`, centroX, canvas.height - 30);

      // Nombre del método
      ctx.fillStyle = "#475569";
      ctx.font = "bold 14px Segoe UI, sans-serif";
      ctx.fillText(nombre, centroX, canvas.height - 10);

      // Avanza al siguiente frame (bucle sobre los datos)
      i = (i + 1) % t.length;
      requestAnimationFrame(frame);
    }

    frame();
  }

  // ------------------------------------------------------------
  // Cuando llegan los datos, lanza las animaciones
  // ------------------------------------------------------------
  useEffect(() => {
    if (!datosIzq || !datosDer) return;

    const colores = {
      euler: "#fb923c",
      heun: "#4ade80",
      rk4: "#38bdf8",
      simplectico: "#a78bfa",
    };

    animar(
      canvasIzqRef.current,
      datosIzq.t,
      datosIzq.numerica,
      colores[metodo] || colores.euler,
      metodo.toUpperCase(),
      tf
    );
    animar(
      canvasDerRef.current,
      datosDer.t,
      datosDer.numerica,
      colores.simplectico,
      "SIMPLÉCTICO",
      tf
    );
  }, [datosIzq, datosDer, metodo, tf]);

  // Lista de métodos disponibles
  const METODOS = [
    { id: "euler", nombre: "Euler (se descontrola con h grande)" },
    { id: "heun", nombre: "Heun (RK2)" },
    { id: "rk4", nombre: "Runge-Kutta 4" },
    { id: "simplectico", nombre: "Euler simpléctico (estable)" },
  ];

  if (cargando) {
    return (
      <div className="tarjeta ancho">
        <h2>Animación de péndulos <span>Exposición</span></h2>
        <p className="sub">Cargando animación…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tarjeta ancho">
        <h2>Animación de péndulos <span>Exposición</span></h2>
        <div className="error">No se pudo cargar la animación: {error}</div>
      </div>
    );
  }

  return (
    <div className="tarjeta ancho">
      <h2>Animación de péndulos <span>Exposición</span></h2>
      <p className="sub">
        Izquierda: método que elijas. Derecha: Euler simpléctico (referencia).
        Con h grande, Euler se acelera solo; el simpléctico se mantiene estable.
      </p>

      {/* Controles: h, tiempo y método (uno solo) */}
      <div className="controles">
        <div className="control" style={{ minWidth: 210 }}>
          <label>Paso h [s]</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="range"
              min={0.01}
              max={0.2}
              step={0.01}
              value={h}
              onChange={(e) => setH(Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <input
              type="number"
              min={0.01}
              max={1}
              step={0.01}
              value={h.toFixed(2)}
              onChange={(e) => setH(parseFloat(e.target.value) || 0.01)}
              style={{ width: 70, padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 14 }}
            />
          </div>
        </div>
        <div className="control" style={{ minWidth: 210 }}>
          <label>Tiempo total tf [s]</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="range"
              min={10}
              max={100}
              step={10}
              value={tf}
              onChange={(e) => setTf(Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <input
              type="number"
              min={10}
              max={200}
              step={10}
              value={tf}
              onChange={(e) => setTf(parseInt(e.target.value) || 10)}
              style={{ width: 70, padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 14 }}
            />
          </div>
        </div>
        <div className="control" style={{ minWidth: 260 }}>
          <label>Método (se aplica al péndulo izquierdo)</label>
          <select
            value={metodo}
            onChange={(e) => setMetodo(e.target.value)}
          >
            {METODOS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Canvas de los péndulos */}
      <div style={{ display: "flex", gap: 30, justifyContent: "center", alignItems: "center", marginBottom: 12 }}>
        <div style={{ textAlign: "center" }}>
          <canvas
            ref={canvasIzqRef}
            width={300}
            height={260}
            style={{ border: "2px solid #e2e8f0", borderRadius: 12, background: "#ffffff", boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}
          />
        </div>
        <div style={{ textAlign: "center" }}>
          <canvas
            ref={canvasDerRef}
            width={300}
            height={260}
            style={{ border: "2px solid #e2e8f0", borderRadius: 12, background: "#ffffff", boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}
          />
        </div>
      </div>
    </div>
  );
}
