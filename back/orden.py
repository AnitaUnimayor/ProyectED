import numpy as np
from integradores import f, solucion_exacta, euler, heun, rk4

# Condiciones iniciales: y(0) = 1, y'(0) = 0
y0 = np.array([1.0, 0.0])

# Los tres pasos que pide el ejercicio (cada uno es la mitad del anterior)
pasos = [0.1, 0.05, 0.025]

# Los métodos que vamos a comparar
metodos = {"Euler": euler, "Heun": heun, "RK4": rk4}


def error_en_t10(metodo, h):
    """Error absoluto |y_numérica(10) - cos(10)| con el paso h."""
    t, Y = metodo(f, y0, 0.0, 10.0, h)
    return abs(Y[-1, 0] - solucion_exacta(10.0))


for nombre, metodo in metodos.items():
    # Calculamos el error para cada valor de h
    errores = [error_en_t10(metodo, h) for h in pasos]

    print(f"--- {nombre} ---")
    for h, e in zip(pasos, errores):
        print(f"  h = {h:<6}  error = {e:.3e}")

    # Orden estimado: comparamos el error con h contra el error con h/2
    for i in range(len(pasos) - 1):
        orden = np.log2(errores[i] / errores[i + 1])
        print(f"  orden entre h={pasos[i]} y h={pasos[i + 1]}: {orden:.2f}")
    print()