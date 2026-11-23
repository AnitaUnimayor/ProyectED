from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import numpy as np

# Importamos lo que ya hicimos en integradores.py:
#   f              -> el sistema u' = v, v' = -u
#   euler/heun/rk4 -> los métodos de integración
#   euler_simplectico, energia, solucion_exacta
from integradores import (
    f,
    solucion_exacta,
    euler,
    heun,
    rk4,
    
    euler_simplectico,
    energia,
)

app = FastAPI()

# CORS: permite que la página (front) llame a esta API desde otro puerto
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Condiciones iniciales del problema: y(0) = 1, y'(0) = 0
Y0 = [1.0, 0.0]

# Diccionario para elegir el método por nombre (lo manda el front)
# euler_simplectico no recibe f, así que lo envolvemos para que tenga la misma firma
def _simplectico(f, y0, t0, tf, h):
    t, Y = euler_simplectico(y0, t0, tf, h)
    return t, Y

METODOS = {"euler": euler, "heun": heun, "rk4": rk4, "simplectico": _simplectico}


@app.get("/")
def inicio():
    return {"mensaje": "Hola desde FastAPI"}


# ------------------------------------------------------------
# ENDPOINT 1: /solucion
# Devuelve la solución numérica y la exacta en cada instante.
# Ejemplo de uso: /solucion?metodo=rk4&h=0.1&tf=10
# ------------------------------------------------------------
@app.get("/solucion")
def solucion(metodo: str = "rk4", h: float = 0.1, tf: float = 10.0):
    # Elegimos el método (si el nombre no existe, usamos RK4)
    metodo_funcion = METODOS.get(metodo, rk4)

    # Integramos desde t=0 hasta tf con paso h
    t, Y = metodo_funcion(f, Y0, 0.0, tf, h)

    # Solución exacta cos(t) en los mismos instantes
    exacta = solucion_exacta(t)

    # Error final: |numérica - exacta| en el último punto
    error_final = abs(Y[-1, 0] - exacta[-1])

    return {
        "t": t.tolist(),          # tiempos
        "numerica": Y[:, 0].tolist(),  # posición u (la y numérica)
        "exacta": exacta.tolist(),     # cos(t)
        "error_final": error_final,
    }


# ------------------------------------------------------------
# ENDPOINT 2: /error-vs-h
# Calcula el error en t=10 para varios pasos h (h, h/2, h/4...)
# Sirve para estimar el ORDEN de cada método con la fórmula:
#   orden = log2( error(h) / error(h/2) )
# ------------------------------------------------------------
@app.get("/error-vs-h")
def error_vs_h(h0: float = 0.2, tf: float = 10.0):
    # Generamos los pasos: h0, h0/2, h0/4, h0/8, h0/16 (5 puntos)
    pasos = [h0 / 2**i for i in range(5)]

    resultado = {}
    for nombre, metodo_funcion in METODOS.items():
        # Error absoluto en t = tf para cada paso
        errores = []
        for h in pasos:
            t, Y = metodo_funcion(f, Y0, 0.0, tf, h)
            errores.append(abs(Y[-1, 0] - solucion_exacta(tf)))

        # Orden estimado comparando errores de pasos consecutivos
        ordenes = [
            float(np.log2(errores[i] / errores[i + 1]))
            for i in range(len(errores) - 1)
        ]
        orden_promedio = float(np.mean(ordenes))

        resultado[nombre] = {"errores": errores, "orden": orden_promedio}

    return {"pasos": pasos, "metodos": resultado}


# ------------------------------------------------------------
# ENDPOINT 3: /energia
# Compara la energía E = 1/2(u² + v²) con Euler explícito y
# Euler simpléctico. La exacta es constante e igual a 0.5.
# ------------------------------------------------------------
@app.get("/energia")
def energia_api(h: float = 0.05, T: float = 50.0):
    # Euler explícito (el de integradores.py, no conserva energía)
    t, Y_euler = euler(f, Y0, 0.0, T, h)
    E_euler = energia(Y_euler)

    # Euler simpléctico (conserva la energía acotada)
    t, Y_simp = euler_simplectico(Y0, 0.0, T, h)
    E_simp = energia(Y_simp)

    return {
        "t": t.tolist(),
        "euler": E_euler.tolist(),
        "simplectico": E_simp.tolist(),
    }
