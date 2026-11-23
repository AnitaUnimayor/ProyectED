document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelectorAll(".slide");
  const totalSlides = slides.length;
  let currentSlideIndex = 0;

  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const slideCounter = document.getElementById("slideCounter");
  const progressBar = document.getElementById("progressBar");
  const dotBtns = document.querySelectorAll(".dot-btn");
  const currentSpeakerBadge = document.getElementById("currentSpeakerBadge");
  const fullscreenBtn = document.getElementById("fullscreenBtn");

  const speakers = [
    "Equipo",          // Slide 1
    "Ana",             // Slide 2
    "Ana",             // Slide 3
    "Anderson",        // Slide 4
    "José Luis",       // Slide 5
    "Ana",             // Slide 6
    "José Luis & Equipo" // Slide 7
  ];

  function showSlide(index) {
    if (index < 0) index = 0;
    if (index >= totalSlides) index = totalSlides - 1;

    currentSlideIndex = index;

    // Actualizar clases de las diapositivas
    slides.forEach((slide, i) => {
      if (i === currentSlideIndex) {
        slide.classList.add("active");
      } else {
        slide.classList.remove("active");
      }
    });

    // Actualizar botones de dots
    dotBtns.forEach((dot, i) => {
      if (i === currentSlideIndex) {
        dot.classList.add("active");
      } else {
        dot.classList.remove("active");
      }
    });

    // Actualizar contador y progreso
    slideCounter.textContent = `${String(currentSlideIndex + 1).padStart(2, "0")} / ${String(totalSlides).padStart(2, "0")}`;
    const progressPercent = ((currentSlideIndex + 1) / totalSlides) * 100;
    progressBar.style.width = `${progressPercent}%`;

    // Actualizar expositor actual en el header
    if (currentSpeakerBadge) {
      currentSpeakerBadge.textContent = speakers[currentSlideIndex] || "Equipo";
    }

    // Estado de botones prev / next
    prevBtn.disabled = currentSlideIndex === 0;
    nextBtn.disabled = currentSlideIndex === totalSlides - 1;

    // Scroll to top of window suavemente si la pantalla es pequeña
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Renderizar KaTeX si está disponible en el scope
    if (window.renderMathInElement) {
      renderMathInElement(slides[currentSlideIndex], {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
          { left: "\\[", right: "\\]", display: true },
          { left: "\\(", right: "\\)", display: false }
        ],
        throwOnError: false
      });
    }

    // Resaltar sintaxis de código
    if (window.Prism) {
      Prism.highlightAllUnder(slides[currentSlideIndex]);
    }
  }

  // Event Listeners de navegación básica
  prevBtn.addEventListener("click", () => showSlide(currentSlideIndex - 1));
  nextBtn.addEventListener("click", () => showSlide(currentSlideIndex + 1));

  dotBtns.forEach((dot) => {
    dot.addEventListener("click", () => {
      const targetIndex = parseInt(dot.getAttribute("data-index"), 10);
      showSlide(targetIndex);
    });
  });

  // Atajos de teclado para la sustentación
  document.addEventListener("keydown", (e) => {
    // Evitar interceptar si está escribiendo en un input
    if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
      return;
    }

    switch (e.key) {
      case "ArrowRight":
      case " ":
      case "PageDown":
        e.preventDefault();
        showSlide(currentSlideIndex + 1);
        break;
      case "ArrowLeft":
      case "Backspace":
      case "PageUp":
        e.preventDefault();
        showSlide(currentSlideIndex - 1);
        break;
      case "Home":
        e.preventDefault();
        showSlide(0);
        break;
      case "End":
        e.preventDefault();
        showSlide(totalSlides - 1);
        break;
      case "1":
      case "2":
      case "3":
      case "4":
      case "5":
      case "6":
      case "7":
        showSlide(parseInt(e.key, 10) - 1);
        break;
      case "f":
      case "F":
        toggleFullscreen();
        break;
      default:
        break;
    }
  });

  // Modo Pantalla Completa
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn(`Error al intentar pantalla completa: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  if (fullscreenBtn) {
    fullscreenBtn.addEventListener("click", toggleFullscreen);
  }

  // Inicializar en Slide 1 y renderizar matemáticas iniciales
  setTimeout(() => {
    showSlide(0);
    if (window.renderMathInElement) {
      renderMathInElement(document.body, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
          { left: "\\[", right: "\\]", display: true },
          { left: "\\(", right: "\\)", display: false }
        ],
        throwOnError: false
      });
    }
  }, 100);
});
