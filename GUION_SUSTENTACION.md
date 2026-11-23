# Guion Oficial de Sustentación — Proyecto 3: ¿Qué tan bueno es su integrador?

**Asignatura:** Ecuaciones Diferenciales Ordinarias (EDO) — Unidad 3  
**Institución:** Institución Universitaria Colegio Mayor del Cauca (UNIMAYOR)  
**Facultad:** Facultad de Ingeniería · Programa de Ingeniería Informática  
**Duración Total Estimada:** 12 – 15 Minutos  

---

## 👥 Equipo de Expositores y Roles

| Integrante | Rol en la Sustentación | Diapositivas a Cargo |
| :--- | :--- | :--- |
| **MAYA CRUZ ANA ROCIO** | **Apertura & Deducción Analítica:** Contextualización del oscilador armónico, clasificación de la EDO, ecuación característica, espacio vectorial de soluciones, determinante Wronskiano y Problema de Valor Inicial (PVI). | **Slide 1**, **Slide 3**, **Slide 4** |
| **ORDOÑEZ GOMEZ JHONNY ANDERSON** | **Modelado Numérico & Métodos Clásicos:** Agenda, reducción a sistema de 1.ᵉʳ orden, deducción analítica de conservación de energía ($dE/dt = 0$) y Runge-Kutta de Orden 4 (RK4). | **Slide 2**, **Slide 5**, **Slide 8** |
| **MARTINEZ MOSQUERA JOSE LUIS** | **Integración Geométrica & Análisis Experimental:** Euler explícito vs. Euler simpléctico, método predictor-corrector de Heun (RK2) con análisis vectorial, rectas de error log-log y conclusiones de ingeniería. | **Slide 6**, **Slide 7**, **Slide 9** |

---

## ⏱️ Mapa de Tiempo y Navegación

* **Atajos de teclado en vivo:**
  * `→` o `Espacio`: Avanzar diapositiva.
  * `←`: Retroceder diapositiva.
  * `1` a `9`: Salto directo a la diapositiva.
  * `F`: Pantalla completa.
  * `Esc`: Cerrar modales ampliados de gráficas.
* **Interactividad en vivo:**
  * Cada péndulo cuenta con selectores de **Paso $h$** y **Tiempo final $t_f$** con botón **🔄 Reset**.
  * Cada gráfica cuenta con el botón **`⛶ Agrandar`** para abrirla en modal de alta definición.

---

# 📑 Guion Diapositiva por Diapositiva

---

### Diapositiva 1 · Portada Institucional UNIMAYOR
* **Expositora:** **Ana Rocio Maya Cruz**
* **Tiempo sugerido:** 1:00 min
* **Qué mostrar en pantalla:**
  * Portada limpia oficial con escudo institucional UNIMAYOR, nombres del equipo y badges del stack tecnológico (React 19, Canvas 2D, FastAPI, NumPy).
* **Discurso del Expositor:**
  > *"Muy buenos días profesor y compañeros. A continuación presentamos la sustentación del Proyecto 3 de Ecuaciones Diferenciales Ordinarias: **'¿Qué tan bueno es su integrador?'**.  
  > Nuestro equipo de trabajo está conformado por mis compañeros Jhonny Anderson Ordoñez, José Luis Martínez y quien les habla, Ana Rocío Maya Cruz.  
  > El objetivo de este proyecto es estudiar computacional y analíticamente cómo influye la elección de un integrador numérico en la fidelidad física, la estabilidad y la conservación de la energía en simulaciones temporales, contrastando integradores explícitos frente a métodos simplécticos.  
  > Todo el sistema ha sido desarrollado de forma integral con una API REST en Python y FastAPI para el cómputo numérico riguroso, y una plataforma interactiva en React y Canvas para la experimentación en tiempo real."*

---

### Diapositiva 2 · Contenido & Estructura de la Sustentación
* **Expositor:** **Jhonny Anderson Ordoñez Gomez**
* **Tiempo sugerido:** 1:00 min
* **Qué mostrar en pantalla:**
  * La cuadrícula con los 8 módulos temáticos de la sustentación organizados metodológicamente.
* **Discurso del Expositor:**
  > *"Para abordar este problema con el máximo rigor académico, hemos estructurado nuestra defensa en tres grandes etapas:  
  > 1. **La Fundamentación Teórica y Analítica:** Donde mi compañera Ana deducirá a mano la solución exacta, la verificación por Wronskiano y el planteamiento del PVI.  
  > 2. **El Puente Computacional:** Donde explicaremos la reducción a un sistema autónomo de primer orden y demostraremos por qué la energía física debe permanecer estrictamente constante.  
  > 3. **La Fase Experimental y de Análisis de Error:** Donde José Luis y yo contrastaremos los integradores programados: Euler, Heun, RK4 y Euler Simpléctico, midiendo sus órdenes de convergencia empíricos mediante regresión logarítmica y observando la estabilidad a largo plazo en nuestros péndulos interactivos."*

---

### Diapositiva 3 · Contexto y Problema del Oscilador Armónico
* **Expositora:** **Ana Rocio Maya Cruz**
* **Tiempo sugerido:** 1:30 min
* **Qué mostrar en pantalla:**
  * La tarjeta del modelo matemático $y'' + y = 0$ y el primer péndulo en tiempo real oscilando de forma ideal.
* **Discurso del Expositor:**
  > *"Comencemos por el problema físico e ingenieril. En cualquier software de simulación —sea un motor de físicas de videojuegos como PhysX o un software de ingeniería aeroespacial— las leyes de la física vienen dadas por ecuaciones diferenciales continuas. Sin embargo, los procesadores no entienden el infinito continuo: se ven obligados a avanzar paso a paso mediante un incremento discreto de tiempo $h$.  
  > Si elegimos un método numérico inadecuado o un paso $h$ mal calibrado, la simulación colapsa: o se frena artificialmente o explota inyectando energía inexistente.  
  > Para medir qué tan bueno es cada integrador, usamos el estándar de oro: el **oscilador armónico simple**, modelado por la ecuación de segundo orden:  
  > $$y''(t) + y(t) = 0, \quad \text{con } y(0) = 1, \; y'(0) = 0$$  
  > Este sistema tiene la gran ventaja pedagógica de contar con una solución analítica cerrada y un valor de energía invariante, lo que nos permite auditar con precisión micrométrica el error de cada algoritmo."*

---

### Diapositiva 4 · Diapositiva A: Solución Analítica Exacta (Punto 1 de lo resuelto a mano)
* **Expositora:** **Ana Rocio Maya Cruz**
* **Tiempo sugerido:** 2:30 min
* **Qué mostrar en pantalla:**
  * Banner superior con los 4 Ejes Curriculares de la Unidad 3: **Generalidades**, **Homogénea con coeficientes constantes**, **Solución general & Wronskiano**, y **Problema de Valor Inicial (PVI)**.
* **Discurso del Expositor:**
  > *"Aquí resolvemos paso a paso el Punto 1 requerido a mano, respondiendo con rigor a los 4 temas del programa curricular:  
  > 1. **Generalidades:** La ecuación $y'' + y = 0$ es una EDO lineal, homogénea, de segundo orden y con coeficientes constantes ($a=1, b=0, c=1$).  
  > 2. **Homogénea con Coeficientes Constantes:** Proponemos la solución exponencial $y = e^{rt}$. Al derivar dos veces y sustituir, obtenemos la ecuación característica:  
  > $$r^2 + 1 = 0 \implies r = \pm i$$  
  > Al tratarse de raíces complejas imaginarias puras con $\alpha = 0$ y $\beta = 1$, la fórmula de Euler nos entrega funciones oscilatorias sinusoidales puras.  
  > 3. **Solución General & Wronskiano:** Las soluciones base son $y_1 = \cos t$ y $y_2 = \sin t$. Para demostrar formalmente que forman un conjunto fundamental linealmente independiente, calculamos su determinante Wronskiano:  
  > $$W(\cos t, \sin t) = \cos(t)\cos(t) - (\sin t)(-\sin t) = \cos^2 t + \sin^2 t = 1 \neq 0$$  
  > Como el Wronskiano nunca se anula, la solución general es la combinación lineal $y(t) = c_1\cos t + c_2\sin t$.  
  > 4. **Problema de Valor Inicial (PVI):** Aplicamos las condiciones de Cauchy. Evaluando la posición $y(0) = 1$, obtenemos $c_1 = 1$. Derivando y evaluando la velocidad inicial $y'(0) = 0$, obtenemos $c_2 = 0$.  
  > Por el Teorema de Existencia y Unicidad, queda demostrada la solución particular exacta: **$y(t) = \cos t$**."*

---

### Diapositiva 5 · Diapositiva B: Sistema de 1.ᵉʳ Orden y Conservación de Energía (Puntos 2 y 3)
* **Expositor:** **Jhonny Anderson Ordoñez Gomez**
* **Tiempo sugerido:** 2:00 min
* **Qué mostrar en pantalla:**
  * Columna izquierda con el vector de estado $w = [u, v]^T$ y columna derecha con la demostración formal de $dE/dt = 0$.
* **Discurso del Expositor:**
  > *"Una vez conocida la solución exacta, nos enfrentamos a la realidad computacional: las computadoras no integran derivadas de segundo orden directamente; trabajan con sistemas acoplados de primer orden.  
  > 1. **Transformación a Sistema de Primer Orden:**  
  > Definimos las variables de estado: $u = y$ (posición) y $v = y'$ (velocidad). Al derivar respecto al tiempo:  
  > $$u' = v$$  
  > $$v' = y'' = -y = -u$$  
  > Obtenemos el sistema autónomo matricial $W' = F(t, W)$ con condición inicial $W(0) = [1, 0]^T$. Esta es exactamente la función `def f(t, estado)` que programamos en Python.  
  > 2. **Conservación de la Energía del Oscilador (Punto 3):**  
  > Definimos la energía mecánica como la suma de potencial y cinética: $E(t) = \frac{1}{2}(u^2 + v^2) = \frac{1}{2}(y^2 + (y')^2)$.  
  > Para demostrar que es constante, derivamos $E(t)$ respecto al tiempo aplicando la regla de la cadena:  
  > $$\frac{dE}{dt} = \frac{1}{2}(2y y' + 2y' y'') = y y' + y' y'' = y'(y + y'')$$  
  > Pero como la EDO exige que $y'' + y = 0$, sustituimos ese término y obtenemos:  
  > $$\frac{dE}{dt} = y' \cdot (0) = 0$$  
  > Al ser su derivada cero en todo instante, la energía inicial $E(0) = \frac{1}{2}(1^2 + 0^2) = 0.5$ **debe conservarse inmutable para siempre**. Este valor de 0.5 será nuestra prueba de fuego para los integradores."*

---

### Diapositiva 6 · Euler Explícito vs. Euler Simpléctico (Punto 4 de lo programado)
* **Expositor:** **José Luis Martinez Mosquera**
* **Tiempo sugerido:** 2:30 min
* **Qué interactividad accionar:**
  * Subir el paso a $h = 0.10$ en el control superior y dar clic en **🔄 Reset**.
  * Mostrar cómo el péndulo rojo de Euler se acelera solo y dar clic en **`⛶ Agrandar`** sobre la gráfica de energía.
* **Discurso del Expositor:**
  > *"Aquí presenciamos el hallazgo más contundente del proyecto: el contraste entre la integración clásica y la integración simpléctica.  
  > En el código de Python de la izquierda observamos la diferencia matemática:  
  > - **Euler Explícito:** Actualiza $u_{i+1}$ y $v_{i+1}$ usando los valores viejos del inicio del paso. Geométricamente, cada paso sale disparado por la recta tangente al círculo de fase. En 50 segundos, la energía no se conserva en 0.5: **¡se dispara de 0.5 a más de 6.94!** En el péndulo de la derecha podemos ver cómo el péndulo de Euler se acelera solo sin ninguna fuerza externa.  
  > - **Euler Simpléctico:** Tiene un cambio sutil de una sola línea en el código: actualiza primero la velocidad $v_{i+1} = v_i - h u_i$ y **usa esa velocidad nueva** para actualizar la posición: $u_{i+1} = u_i + h v_{i+1}$.  
  > Esta ligera modificación preserva la estructura simpléctica del espacio de fases (el Teorema de Liouville). Aunque comete un error local de orden 1, la energía permanece rígidamente **acotada en torno a 0.500** durante cientos de oscilaciones.  
  > Esto demuestra que un método de orden bajo que respeta la geometría del problema supera ampliamente a integradores que violan las leyes de conservación."*

---

### Diapositiva 7 · Método de Heun / Runge-Kutta 2 (Punto 1 de lo programado)
* **Expositor:** **José Luis Martinez Mosquera**
* **Tiempo sugerido:** 2:30 min
* **Qué interactividad accionar:**
  * Dar clic en los botones del diagrama: primero `[🔴 1. k₁]`, luego `[🟣 2. k₂]`, y finalmente `[🔵 3. Promedio]`.
  * Señalar el panel lateral de explicación de colores.
  * Mostrar la telemetría en vivo del péndulo de Heun: $E \approx 0.499$.
* **Discurso del Expositor:**
  > *"Para elevar la precisión a segundo orden $O(h^2)$, implementamos el **Método de Heun** (o Runge-Kutta de orden 2).  
  > Heun es un método **predictor-corrector** fundamentado en la Regla del Trapecio:  
  > Miremos el diagrama interactivo de la derecha y su guía de colores:  
  > 1. Primero calcula **$k_1$ (flecha roja):** Es la pendiente al inicio del paso (el predictor de Euler).  
  > 2. Da un paso tentativo al final del intervalo y calcula **$k_2$ (flecha morada):** La pendiente estimada al final.  
  > 3. Finalmente, calcula el avance promediando ambas inclinaciones: $\frac{1}{2}(k_1 + k_2)$ **(flecha azul):**  
  > Miren cómo la flecha azul dobla exactamente en la misma dirección en que se curva la trayectoria teórica dorada de $\cos(t)$.  
  > Al promediar el inicio y el final, se cancela el error cuadrático. Al reducir el paso a la mitad ($h \to h/2$), el error se divide entre 4 ($2^2$).  
  > Debajo del péndulo podemos comprobar la telemetría en vivo: la energía marca $E = 0.499$, prácticamente clavada en 0.500, confirmando que Heun no explota como Euler, sino que sufre una disipación imperceptible de cuarto orden ($1 - h^4/4$)."*

---

### Diapositiva 8 · Runge-Kutta de Orden 4 (RK4) (Punto 1 de lo programado)
* **Expositor:** **Jhonny Anderson Ordoñez Gomez**
* **Tiempo sugerido:** 2:00 min
* **Qué interactividad accionar:**
  * Dar clic en la pestaña **'📈 Gráfica vs Exacta'** y luego presionar el botón **`⛶ Agrandar`**.
  * Mostrar que la curva numérica azul y la curva exacta roja están superpuestas sin separación visible.
* **Discurso del Expositor:**
  > *"Llegamos al integrador clásico de máxima precisión: **Runge-Kutta de Orden 4 (RK4)**.  
  > En lugar de dos evaluaciones como Heun, RK4 muestrea cuatro pendientes a lo largo del intervalo:  
  > - $k_1$ al inicio del paso.  
  > - $k_2$ en el punto medio usando $k_1$.  
  > - $k_3$ en el punto medio refinado con $k_2$.  
  > - $k_4$ en el extremo final usando $k_3$.  
  > Y promedia las cuatro mediante los coeficientes de la **Regla de Simpson**:  
  > $$Y_{i+1} = Y_i + \frac{h}{6}(k_1 + 2k_2 + 2k_3 + k_4)$$  
  > Al presionar el botón para agrandar la gráfica, podemos apreciar que la trayectoria de RK4 y la solución analítica $\cos(t)$ son completamente indistinguibles.  
  > En $t = 10$ segundos, el error numérico es de apenas **$3.94 \times 10^{-6}$** (menos de 4 millonésimas). Al dividir el paso a la mitad, el error global disminuye en un factor de $2^4 = 16$, alcanzando una fidelidad casi perfecta."*

---

### Diapositiva 9 · Análisis de Error, Órdenes Observados y Criterio de Ingeniería (Puntos 2 y 3)
* **Expositor:** **José Luis Martinez Mosquera**
* **Tiempo sugerido:** 2:30 min
* **Qué interactividad accionar:**
  * Presionar el botón **`⛶ Agrandar`** sobre la gráfica de error en escala Log-Log.
  * Señalar las 3 rectas con pendientes 1, 2 y 4.
* **Discurso del Expositor:**
  > *"Cerramos la sustentación con la comprobación cuantitativa del Punto 2 y 3: la medición del error y estimación del orden de cada método.  
  > En la tabla comparativa medimos el error absoluto en $t = 10$ s para pasos $h = 0.1$, $0.05$ y $0.025$, aplicando la fórmula experimental:  
  > $$\text{orden} \approx \log_2 \left(\frac{e(h)}{e(h/2)}\right)$$  
  > Los resultados arrojados por nuestro backend en Python son contundentes:  
  > - **Euler:** Orden empírico **$1.01 \approx 1$**.  
  > - **Heun:** Orden empírico **$1.99 \approx 2$**.  
  > - **RK4:** Orden empírico **$3.92 \approx 4$**.  
  > Al abrir la gráfica en escala log-log, observamos con absoluta claridad las **tres rectas de pendientes diferenciadas**:  
  > Como el error sigue la ley de potencia $e(h) \approx C h^p$, al aplicar logaritmos $\log e = p \log h + \log C$. La pendiente de cada recta es exactamente el orden teórico $p$.  
  > 
  > **Conclusiones de Ingeniería:**  
  > 1. Para trayectorias de alta fidelidad en ventanas cortas (como cálculo orbital o robótica de precisión), **RK4** es insuperable por su tasa de convergencia cuártica.  
  > 2. Sin embargo, para simulaciones de larga duración (motores de física de videojuegos o dinámica molecular durante miles de segundos), **el Euler Simpléctico es superior a métodos de orden alto no conservativos**, porque garantiza que la energía se quede acotada y que el sistema jamás explote.  
  > Muchas gracias por su atención, quedamos atentos a cualquier pregunta del docente."*

---

# 🛡️ Banco de Preguntas Típicas del Docente y Respuestas Blindadas

### Pregunta 1: *"¿Por qué el orden observado de RK4 dio 3.92 y no 4.00 exacto?"*
* **Respuesta del Equipo (Jhonny Anderson):**
  > *"El orden teórico $p=4$ es un límite asintótico para $h \to 0$. Para pasos finitos como $h=0.1$, existen términos de orden superior en la serie de Taylor ($O(h^5)$ y $O(h^6)$) que aún tienen una contribución residual pequeña. Además, el oscilador tiene una solución trigonométrica periódica donde el error en un punto específico como $t=10$ depende de la fase local de la onda. Si refinamos $h$ a $0.005$, el orden observado converge asintóticamente a 3.999."*

### Pregunta 2: *"¿Por qué el Euler explícito inyecta energía al sistema y el simpléctico no?"*
* **Respuesta del Equipo (José Luis):**
  > *"Euler explícito actualiza ambas variables con el estado viejo $Y_i$. Matemáticamente, la matriz de amplificación del paso tiene un determinante mayor a 1: $\det(A) = 1 + h^2 > 1$. Cada paso multiplica el radio en el plano de fase por un factor $\sqrt{1+h^2}$, inyectando energía en cada iteración.  
  > En cambio, el Euler simpléctico tiene una matriz de transición con determinante idénticamente 1 ($\det(A_{simp}) = 1$). Es una transformación canónica que conserva exactamente un Hamiltoniano modificado cercano, manteniendo la energía estrictamente en una órbita elíptica cerrada."*

### Pregunta 3: *"¿Qué papel jugó el Wronskiano en la deducción de la solución?"*
* **Respuesta del Equipo (Ana Rocio):**
  > *"El Wronskiano $W(y_1, y_2)(t)$ es el determinante que evalúa la matriz fundamental de soluciones. Si $W = 0$, las soluciones serían linealmente dependientes y no podrían generar todo el espacio de soluciones de dimensión 2. Como obtuvimos $W(\cos t, \sin t) = \cos^2 t + \sin^2 t = 1 \neq 0$ para todo $t$, queda matemáticamente probado que $\{\cos t, \sin t\}$ es una base fundamental y que cualquier solución particular es expresable unívocamente como combinación lineal de ellas."*

### Pregunta 4: *"¿Por qué en Heun la energía oscila alrededor de 0.499 en lugar de subir como en Euler?"*
* **Respuesta del Equipo (José Luis):**
  > *"Porque el factor de amplificación de Heun es $1 - h^4/4$. A diferencia de Euler que amplifica por $(1 + h^2)$, Heun tiene un término de cuarto orden que amortigua de forma casi imperceptible ($0.5 \to 0.499$) en lugar de amplificar. Su error local de segundo orden neutraliza la curvatura y cancela la divergencia hacia afuera del espacio de fases."*
