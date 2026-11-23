import numpy as np
import matplotlib.pyplot as plt
from integradores import f, solucion_exacta, euler, heun, rk4

# Condiciones iniciales: y(0) = 1, y'(0) = 0
y0 = np.array([1.0, 0.0])

# Varios pasos h, cada uno la mitad del anterior
pasos = np.array([0.2, 0.1, 0.05, 0.025, 0.0125])

metodos = {"Euler": euler, "Heun": heun, "RK4": rk4}


def error_en_t10(metodo, h):
    """Error absoluto |y_numérica(10) - cos(10)| con el paso h."""
    t, Y = metodo(f, y0, 0.0, 10.0, h)
    return abs(Y[-1, 0] - solucion_exacta(10.0))


plt.figure(figsize=(8, 6))

for nombre, metodo in metodos.items():
    errores = np.array([error_en_t10(metodo, h) for h in pasos])

    # En escala log-log una ley error = C * h^p es una RECTA con pendiente p.
    # polyfit ajusta esa recta y nos da la pendiente (el orden del método).
    pendiente = np.polyfit(np.log(pasos), np.log(errores), 1)[0]

    plt.loglog(pasos, errores, "o-", label=f"{nombre} (pendiente ≈ {pendiente:.2f})")
    print(f"{nombre}: pendiente = {pendiente:.2f}")

plt.xlabel("paso h [s]")
plt.ylabel("error |y(10) - cos(10)|")
plt.title("Error vs paso h (escala log-log)")
plt.legend()
plt.grid(True, which="both", alpha=0.3)
plt.savefig("error_vs_h.png", dpi=150)
plt.show()