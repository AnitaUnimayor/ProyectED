import numpy as np
import matplotlib.pyplot as plt

# Condiciones iniciales: y(0) = 1, y'(0) = 0
# u = posición (y), v = velocidad (y')
u0, v0 = 1.0, 0.0

h = 0.05          # tamaño del paso (segundos)
T = 50.0          # tiempo total de simulación
n = int(T / h)    # cantidad de pasos


def energia(u, v):
    """E = 1/2 (y^2 + y'^2). En la solución exacta vale siempre 0.5."""
    return 0.5 * (u**2 + v**2)


# ------------------------------------------------------------
# EULER EXPLÍCITO
# Usa los valores VIEJOS de u y v para calcular los nuevos.
#   u_nuevo = u + h * v
#   v_nuevo = v + h * (-u)
# ------------------------------------------------------------
def euler_explicito():
    u, v = u0, v0
    E = [energia(u, v)]
    for _ in range(n):
        u_nuevo = u + h * v
        v_nuevo = v + h * (-u)      # aquí se usa el u VIEJO
        u, v = u_nuevo, v_nuevo
        E.append(energia(u, v))
    return np.array(E)


# ------------------------------------------------------------
# EULER SIMPLÉCTICO
# Primero actualiza la velocidad y luego usa esa velocidad NUEVA
# para actualizar la posición. Es la única diferencia.
#   v_nuevo = v + h * (-u)
#   u_nuevo = u + h * v_nuevo      <- velocidad nueva
# ------------------------------------------------------------
def euler_simplectico():
    u, v = u0, v0
    E = [energia(u, v)]
    for _ in range(n):
        v = v + h * (-u)            # 1) actualiza la velocidad
        u = u + h * v               # 2) usa la velocidad nueva
        E.append(energia(u, v))
    return np.array(E)


t = np.arange(n + 1) * h
E_euler = euler_explicito()
E_simp = euler_simplectico()

print(f"Energía inicial:                  {energia(u0, v0):.4f}")
print(f"Energía final, Euler explícito:   {E_euler[-1]:.4f}")
print(f"Energía final, Euler simpléctico: {E_simp[-1]:.4f}")
print(f"Energía máxima simpléctico:       {E_simp.max():.4f}")
print(f"Energía mínima simpléctico:       {E_simp.min():.4f}")

# ------------------------------------------------------------
# Gráfica
# ------------------------------------------------------------
plt.figure(figsize=(9, 5))
plt.plot(t, E_euler, label="Euler explícito")
plt.plot(t, E_simp, label="Euler simpléctico")
plt.axhline(0.5, color="gray", linestyle="--", label="Energía exacta (0.5)")
plt.xlabel("tiempo [s]")
plt.ylabel("energía E (adimensional)")
plt.title(f"Energía del oscilador y'' + y = 0 (h = {h})")
plt.legend()
plt.grid(alpha=0.3)
plt.savefig("energia.png", dpi=150)
plt.show()