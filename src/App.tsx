import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const PixelHoverSVG: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [cols, setCols] = useState(0);
  const [rows, setRows] = useState(0);
  const [bgColor1, setBgColor1] = useState("#bef264");
  const [bgColor2, setBgColor2] = useState("#1f2937");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const BASE_PIXEL_SIZE = 40; // Dimensione base del pixel

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const calculateDimensions = () => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    const containerHeight = containerRef.current.offsetHeight;

    // Calcola il numero di colonne desiderato basato sulla dimensione base
    const desiredCols = Math.floor(containerWidth / BASE_PIXEL_SIZE);

    // Calcola la dimensione effettiva del pixel per riempire esattamente la larghezza
    const actualPixelWidth = containerWidth / desiredCols;

    // Usa la stessa dimensione per l'altezza per mantenere pixel quadrati
    const rows = Math.ceil(containerHeight / actualPixelWidth);
    const height = rows * actualPixelWidth;

    setDimensions({
      width: containerWidth,
      height: height,
    });
    setCols(desiredCols);
    setRows(rows);
  };

  useEffect(() => {
    const handleResize = () => {
      calculateDimensions();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        calculateDimensions();
      }
    };

    calculateDimensions();

    window.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (
      !svgRef.current ||
      dimensions.width === 0 ||
      dimensions.height === 0 ||
      cols === 0 ||
      rows === 0
    )
      return;

    const pixelWidth = dimensions.width / cols;
    const pixelHeight = dimensions.height / rows;
    console.log({ pixelWidth, pixelHeight });
    const fragment = document.createDocumentFragment();
    const timelines: gsap.core.Timeline[] = [];

    while (svgRef.current.firstChild) {
      svgRef.current.removeChild(svgRef.current.firstChild);
    }

    // Crea gruppo per ogni pixel
    const rects = Array.from({ length: rows * cols }, (_, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;

      // Crea un gruppo per contenere il rettangolo e l'ombra
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

      // Crea l'ombra (rettangolo più scuro sotto)
      const shadow = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
      );
      shadow.setAttribute("x", `${col * pixelWidth}`);
      shadow.setAttribute("y", `${row * pixelHeight}`);
      shadow.setAttribute("width", `${pixelWidth}`);
      shadow.setAttribute("height", `${pixelHeight}`);
      shadow.setAttribute("fill", "rgba(0,0,0,0.3)");
      shadow.setAttribute("transform", "translate(2, 2)");
      shadow.style.opacity = "0";

      // Crea il rettangolo principale
      const rect = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
      );
      rect.setAttribute("x", `${col * pixelWidth}`);
      rect.setAttribute("y", `${row * pixelHeight}`);
      rect.setAttribute("width", `${pixelWidth}`);
      rect.setAttribute("height", `${pixelHeight}`);
      rect.setAttribute("fill", "rgba(255,255,255,0.1)");
      rect.setAttribute("stroke", "rgba(255,255,255,0.2)");
      rect.setAttribute("stroke-width", "1");
      rect.setAttribute("rx", "4");

      group.appendChild(shadow);
      group.appendChild(rect);
      fragment.appendChild(group);

      // Animazione base
      const tl = gsap.timeline({ repeat: -1 });
      timelines.push(tl);

      // calcola la traslazione in base alla posizione del rettangolo
      // se il rettangolo è al centro allora non si muove
      // andando verso il basso e a destra la traslazione è positiva
      // andando verso l'alto e a sinistra la traslazione è negativa
      const translateX = col - cols / 2;
      const translateY = row - rows / 2;

      // Effetto hover
      group.addEventListener("mouseenter", () => {
        gsap.to(rect, {
          fill: "rgba(255,255,255,0.3)",
          transform: `translate(${translateX * 2}px, ${translateY * 2}px)`,
          duration: 0.3,
          ease: "power2.out",
        });
        gsap.to(shadow, {
          opacity: 1,
          duration: 0.3,
        });
      });

      group.addEventListener("mouseleave", () => {
        gsap.to(rect, {
          fill: "rgba(255,255,255,0.1)",
          transform: "translate(0, 0)",
          duration: 0.3,
          ease: "power2.in",
        });
        gsap.to(shadow, {
          opacity: 0,
          duration: 0.3,
        });
      });

      return group;
    });

    svgRef.current.appendChild(fragment);

    // Animazione random per ogni pixel
    rects.forEach((group, index) => {
      const rect = group.lastElementChild as SVGRectElement;
      timelines[index]
        .to(rect, {
          fill: "rgba(255,255,255,0.2)",
          delay: Math.random() * 2,
          duration: 1,
        })
        .to(rect, {
          fill: "rgba(255,255,255,0.1)",
          delay: Math.random(),
          duration: 1,
        });
    });

    return () => {
      timelines.forEach((tl) => tl.kill());
      if (svgRef.current) {
        svgRef.current.innerHTML = "";
      }
    };
  }, [dimensions, cols, rows]);

  useEffect(() => {
    // setBgColor1(isDarkMode ? "#1f2937" : "#bef264");
    // setBgColor2(isDarkMode ? "#111827" : "#1f2937");
    // change fill color of all rects
    const rects = svgRef.current?.querySelectorAll("rect");
    if (!rects) return;
    rects.forEach((rect) => {
      // rect.setAttribute(
      //   "fill",
      //   !isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"
      // );
      rect.setAttribute(
        "stroke",
        !isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"
      );
    });
  }, [isDarkMode]);

  return (
    <div
      ref={containerRef}
      className={`bg-gradient-to-br  min-h-screen w-screen relative overflow-hidden`}
      style={{
        background: `linear-gradient(to bottom right, ${bgColor1}, ${bgColor2})`,
      }}
    >
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        xmlns="http://www.w3.org/2000/svg"
        className="absolute top-0 left-0"
      />
      <div className="relative z-10 container mx-auto p-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg p-8">
          <h1 className="text-white text-4xl font-bold">
            {cols} x {rows} Pixel Hover Effect {dimensions.width}x
            {dimensions.height} px totali
          </h1>
          <p className="text-white/80 mt-4">
            La larghezza del pixel è di {BASE_PIXEL_SIZE}px,
          </p>
          <input
            type="color"
            className="mt-4"
            value={bgColor1}
            onChange={(e) => setBgColor1(e.target.value)}
          />
          <input
            type="color"
            className="mt-4"
            value={bgColor2}
            onChange={(e) => setBgColor2(e.target.value)}
          />
          {/* checkbox darkmode */}
          <div className="mt-4">
            <input
              type="checkbox"
              id="darkmode"
              name="darkmode"
              checked={isDarkMode}
              onChange={() => setIsDarkMode(!isDarkMode)}
            />
            <label htmlFor="darkmode" className="text-white/80">
              Dark mode
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PixelHoverSVG;
