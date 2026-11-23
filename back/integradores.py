import numpy as np

# ------------------------------------------------------------
# El problema: y'' + y = 0, con y(0) = 1 y y'(0) = 0
# Lo convertimos en un sistema de primer orden:
#   u' = v        (u es la posición y, v es la velocidad y')
#   v' = -u
# ------------------------------------------------------------
def f(t, estado):
    u, v = estado
    return np.array([v, -u])


def solucion_exacta(t):
    """La solución que dedujiste a mano: y(t) = cos(t)."""
    return np.cos(t)


# ------------------------------------------------------------
# MÉTODO 1: Euler
# Da un paso siguiendo la pendiente que hay AL INICIO del paso.
# ------------------------------------------------------------
def euler(f, y0, t0, tf, h):
    n = int(round((tf - t0) / h))        # cantidad de pasos
    t = t0 + h * np.arange(n + 1)        # vector de tiempos
    Y = np.zeros((n + 1, len(y0)))       # aquí guardamos [u, v] en cada instante
    Y[0] = y0
    for i in range(n):
        Y[i + 1] = Y[i] + h * f(t[i], Y[i])
    return t, Y


# ------------------------------------------------------------
# MÉTODO 2: Heun (Runge-Kutta de orden 2)
# Promedia la pendiente del inicio y la del final del paso.
# ------------------------------------------------------------
def heun(f, y0, t0, tf, h):
    n = int(round((tf - t0) / h))
    t = t0 + h * np.arange(n + 1)
    Y = np.zeros((n + 1, len(y0)))
    Y[0] = y0
    for i in range(n):
        k1 = f(t[i], Y[i])                   # pendiente al inicio
        k2 = f(t[i] + h, Y[i] + h * k1)      # pendiente al final (estimada)
        Y[i + 1] = Y[i] + h / 2 * (k1 + k2)  # promedio de las dos
    return t, Y


# ------------------------------------------------------------
# MÉTODO 3: Runge-Kutta de orden 4 (RK4)
# Promedia cuatro pendientes por paso. Es el más preciso de los tres.
# ------------------------------------------------------------
def rk4(f, y0, t0, tf, h):
    n = int(round((tf - t0) / h))
    t = t0 + h * np.arange(n + 1)
    Y = np.zeros((n + 1, len(y0)))
    Y[0] = y0
    for i in range(n):
        k1 = f(t[i], Y[i])
        k2 = f(t[i] + h / 2, Y[i] + h / 2 * k1)
        k3 = f(t[i] + h / 2, Y[i] + h / 2 * k2)
        k4 = f(t[i] + h, Y[i] + h * k3)
        Y[i + 1] = Y[i] + h / 6 * (k1 + 2 * k2 + 2 * k3 + k4)
    return t, Y


# ------------------------------------------------------------
# Prueba rápida: solo se ejecuta si corres este archivo directamente
# ------------------------------------------------------------
# ------------------------------------------------------------
# EULER SIMPLÉCTICO (solo para y'' + y = 0)
# Primero actualiza la velocidad y luego usa esa velocidad nueva
# para actualizar la posición.
# ------------------------------------------------------------
def euler_simplectico(y0, t0, tf, h):
    n = int(round((tf - t0) / h))
    t = t0 + h * np.arange(n + 1)
    Y = np.zeros((n + 1, 2))
    Y[0] = y0
    for i in range(n):
        u, v = Y[i]
        v = v - h * u      # 1) velocidad nueva
        u = u + h * v      # 2) posición con la velocidad nueva
        Y[i + 1] = [u, v]
    return t, Y


def energia(Y):
    """E = 1/2 (y^2 + y'^2) en cada instante. Exacta: siempre 0.5."""
    return 0.5 * (Y[:, 0] ** 2 + Y[:, 1] ** 2)
if __name__ == "__main__":
    y0 = np.array([1.0, 0.0])   # y(0) = 1, y'(0) = 0
    h = 0.1
    print(f"Valor exacto cos(10) = {solucion_exacta(10):.6f}\n")
    for nombre, metodo in [("Euler", euler), ("Heun", heun), ("RK4", rk4)]:
        t, Y = metodo(f, y0, 0.0, 10.0, h)
        error = abs(Y[-1, 0] - solucion_exacta(10))
        print(f"{nombre:6s} y(10) = {Y[-1, 0]:.6f}   error = {error:.2e}")