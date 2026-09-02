import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { PageSizeFormat } from "../types";

/**
 * Mathematically exact OKLCH -> RGB / RGBA converter
 */
export function parseOklchToRgb(str: string): string {
  const m = str.match(
    /oklch\(\s*([\d.-]+%?|none)\s+([\d.-]+%?|none)\s+([\d.-]+(?:deg|rad|turn)?|none)(?:\s*(?:\/|\,)\s*([\d.-]+%?|none))?\s*\)/i
  );
  if (!m) return "rgb(15, 23, 42)";

  let l = m[1] === "none" ? 0 : parseFloat(m[1]);
  if (m[1].endsWith("%")) l /= 100;
  if (isNaN(l)) l = 0.5;

  let c = m[2] === "none" ? 0 : parseFloat(m[2]);
  if (m[2].endsWith("%")) c /= 100;
  if (isNaN(c)) c = 0;

  const hStr = m[3];
  let h = 0;
  if (hStr !== "none") {
    if (hStr.endsWith("deg")) h = parseFloat(hStr);
    else if (hStr.endsWith("rad")) h = (parseFloat(hStr) * 180) / Math.PI;
    else if (hStr.endsWith("turn")) h = parseFloat(hStr) * 360;
    else h = parseFloat(hStr);
  }
  if (isNaN(h)) h = 0;

  let a = 1;
  if (m[4] !== undefined && m[4] !== "none") {
    a = parseFloat(m[4]);
    if (m[4].endsWith("%")) a /= 100;
    if (isNaN(a)) a = 1;
  }

  const rad = (h * Math.PI) / 180;
  const a_lab = c * Math.cos(rad);
  const b_lab = c * Math.sin(rad);

  const l_ = l + 0.3963377774 * a_lab + 0.2158037573 * b_lab;
  const m_ = l - 0.1055613458 * a_lab - 0.0638541728 * b_lab;
  const s_ = l - 0.0894841775 * a_lab - 1.2914855480 * b_lab;

  const l_cube = l_ * l_ * l_;
  const m_cube = m_ * m_ * m_;
  const s_cube = s_ * s_ * s_;

  const r_lin = +4.0767416621 * l_cube - 3.3077115913 * m_cube + 0.2309699292 * s_cube;
  const g_lin = -1.2684380046 * l_cube + 2.6097574011 * m_cube - 0.3413193965 * s_cube;
  const b_lin = -0.0041960863 * l_cube - 0.7034186147 * m_cube + 1.7076147010 * s_cube;

  const toSrgb = (x: number) => {
    const clamped = Math.max(0, Math.min(1, x));
    return clamped <= 0.0031308
      ? Math.round(12.92 * clamped * 255)
      : Math.round((1.055 * Math.pow(clamped, 1 / 2.4) - 0.055) * 255);
  };

  const r = toSrgb(r_lin);
  const g = toSrgb(g_lin);
  const b = toSrgb(b_lin);

  return a < 1
    ? `rgba(${r}, ${g}, ${b}, ${Math.round(a * 1000) / 1000})`
    : `rgb(${r}, ${g}, ${b})`;
}

/**
 * Mathematically exact OKLAB -> RGB / RGBA converter
 */
export function parseOklabToRgb(str: string): string {
  const m = str.match(
    /oklab\(\s*([\d.-]+%?|none)\s+([\d.-]+%?|none)\s+([\d.-]+%?|none)(?:\s*(?:\/|\,)\s*([\d.-]+%?|none))?\s*\)/i
  );
  if (!m) return "rgb(15, 23, 42)";

  let l = m[1] === "none" ? 0 : parseFloat(m[1]);
  if (m[1].endsWith("%")) l /= 100;
  if (isNaN(l)) l = 0.5;

  let a_lab = m[2] === "none" ? 0 : parseFloat(m[2]);
  if (m[2] && m[2].endsWith("%")) a_lab /= 100;
  if (isNaN(a_lab)) a_lab = 0;

  let b_lab = m[3] === "none" ? 0 : parseFloat(m[3]);
  if (m[3] && m[3].endsWith("%")) b_lab /= 100;
  if (isNaN(b_lab)) b_lab = 0;

  let alpha = 1;
  if (m[4] !== undefined && m[4] !== "none") {
    alpha = parseFloat(m[4]);
    if (m[4].endsWith("%")) alpha /= 100;
    if (isNaN(alpha)) alpha = 1;
  }

  const l_ = l + 0.3963377774 * a_lab + 0.2158037573 * b_lab;
  const m_ = l - 0.1055613458 * a_lab - 0.0638541728 * b_lab;
  const s_ = l - 0.0894841775 * a_lab - 1.2914855480 * b_lab;

  const l_cube = l_ * l_ * l_;
  const m_cube = m_ * m_ * m_;
  const s_cube = s_ * s_ * s_;

  const r_lin = +4.0767416621 * l_cube - 3.3077115913 * m_cube + 0.2309699292 * s_cube;
  const g_lin = -1.2684380046 * l_cube + 2.6097574011 * m_cube - 0.3413193965 * s_cube;
  const b_lin = -0.0041960863 * l_cube - 0.7034186147 * m_cube + 1.7076147010 * s_cube;

  const toSrgb = (x: number) => {
    const clamped = Math.max(0, Math.min(1, x));
    return clamped <= 0.0031308
      ? Math.round(12.92 * clamped * 255)
      : Math.round((1.055 * Math.pow(clamped, 1 / 2.4) - 0.055) * 255);
  };

  const r = toSrgb(r_lin);
  const g = toSrgb(g_lin);
  const b = toSrgb(b_lin);

  return alpha < 1
    ? `rgba(${r}, ${g}, ${b}, ${Math.round(alpha * 1000) / 1000})`
    : `rgb(${r}, ${g}, ${b})`;
}

/**
 * Robust parenthesis-balanced CSS string sanitizer for html2canvas compatibility
 */
export function sanitizeCssText(text: string): string {
  if (!text || typeof text !== "string") return text;
  if (!/(oklch|oklab|color-mix|light-dark|lab|lch|color\()/i.test(text)) return text;

  const funcPrefixes = [
    { name: "color-mix(", type: "color-mix" },
    { name: "light-dark(", type: "light-dark" },
    { name: "oklch(", type: "oklch" },
    { name: "oklab(", type: "oklab" },
    { name: "lab(", type: "lab" },
    { name: "lch(", type: "lch" },
    { name: "color(", type: "color" }
  ];

  let result = "";
  let i = 0;
  while (i < text.length) {
    let matched: { name: string; type: string } | null = null;
    for (const p of funcPrefixes) {
      if (text.substring(i, i + p.name.length).toLowerCase() === p.name) {
        matched = p;
        break;
      }
    }

    if (matched) {
      const startIndex = i;
      i += matched.name.length;
      let depth = 1;
      while (i < text.length && depth > 0) {
        if (text[i] === "(") depth++;
        else if (text[i] === ")") depth--;
        i++;
      }
      const rawFunc = text.substring(startIndex, i);

      if (matched.type === "oklch") {
        result += parseOklchToRgb(rawFunc);
      } else if (matched.type === "oklab") {
        result += parseOklabToRgb(rawFunc);
      } else if (matched.type === "color-mix") {
        const inner = rawFunc.substring(matched.name.length, rawFunc.length - 1);
        const innerOklch = inner.match(/oklch\([^)]+\)/i);
        if (innerOklch) {
          result += parseOklchToRgb(innerOklch[0]);
        } else {
          result += "rgba(100, 116, 139, 0.2)";
        }
      } else {
        result += "rgb(15, 23, 42)";
      }
    } else {
      result += text[i];
      i++;
    }
  }

  // Ensure no remaining unsupported color functions exist
  if (/(oklch|oklab|color-mix|light-dark|lab|lch|color\()/i.test(result)) {
    result = result.replace(
      /(oklch|oklab|color-mix|light-dark|lab|lch|color)\s*\([^;{}]+?\)/gi,
      "rgb(15, 23, 42)"
    );
  }

  return result;
}

/**
 * Creates a proxied getComputedStyle that transparently replaces OKLCH/OKLAB/color-mix
 */
function createComputedStyleProxy(origGetComputedStyle: (elt: Element, pseudoElt?: string | null) => CSSStyleDeclaration) {
  return function (elt: Element, pseudoElt?: string | null): CSSStyleDeclaration {
    const style = origGetComputedStyle(elt, pseudoElt);
    return new Proxy(style, {
      get(target, prop, receiver) {
        if (prop === "getPropertyValue") {
          return function (propertyName: string) {
            const raw = target.getPropertyValue(propertyName);
            return sanitizeCssText(raw);
          };
        }
        const val = Reflect.get(target, prop, receiver);
        if (typeof val === "string" && /(oklch|oklab|color-mix|light-dark|lab|lch|color\()/i.test(val)) {
          return sanitizeCssText(val);
        }
        if (typeof val === "function") {
          return val.bind(target);
        }
        return val;
      }
    });
  };
}

export async function captureElementToCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
  const origWindowGetComputedStyle = window.getComputedStyle ? window.getComputedStyle.bind(window) : null;

  try {
    // Intercept host window getComputedStyle during html2canvas cloning phase
    if (origWindowGetComputedStyle) {
      window.getComputedStyle = createComputedStyleProxy(origWindowGetComputedStyle);
    }

    return await html2canvas(element, {
      scale: 2.5,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      onclone: (clonedDoc) => {
        // 1. Intercept getComputedStyle in cloned iframe window
        if (clonedDoc.defaultView) {
          const win = clonedDoc.defaultView;
          const origClonedGetComputedStyle = win.getComputedStyle.bind(win);
          win.getComputedStyle = createComputedStyleProxy(origClonedGetComputedStyle);
        }

        // 2. Sanitize all <style> elements in clonedDoc
        const styleElements = Array.from(clonedDoc.querySelectorAll("style"));
        styleElements.forEach((styleEl) => {
          const rawText = styleEl.textContent || styleEl.innerHTML || "";
          if (/(oklch|oklab|color-mix|light-dark|lab|lch|color\()/i.test(rawText)) {
            styleEl.textContent = sanitizeCssText(rawText);
          }
        });

        // 3. Sanitize inline styles and ensure Arabic text rendering
        const allElements = Array.from(clonedDoc.querySelectorAll("*"));
        allElements.forEach((node) => {
          const el = node as HTMLElement;
          if (el.getAttribute) {
            const styleAttr = el.getAttribute("style");
            if (styleAttr && /(oklch|oklab|color-mix|light-dark|lab|lch|color\()/i.test(styleAttr)) {
              el.setAttribute("style", sanitizeCssText(styleAttr));
            }
          }
          // Ensure letter spacing doesn't break Arabic cursive text in html2canvas
          if (/[\u0600-\u06FF]/.test(el.textContent || "")) {
            el.style.letterSpacing = "normal";
          }
        });

        // 4. Clean parsed CSS rules in document.styleSheets
        try {
          const sheets = Array.from(clonedDoc.styleSheets);
          sheets.forEach((sheet) => {
            try {
              const rules = Array.from(sheet.cssRules || []);
              rules.forEach((rule) => {
                if ("style" in rule && (rule as CSSStyleRule).style) {
                  const styleObj = (rule as CSSStyleRule).style;
                  if (styleObj && styleObj.cssText && /(oklch|oklab|color-mix|light-dark|lab|lch|color\()/i.test(styleObj.cssText)) {
                    styleObj.cssText = sanitizeCssText(styleObj.cssText);
                  }
                }
              });
            } catch (e) {
              // Ignore cross-origin stylesheet errors
            }
          });
        } catch (e) {
          // Ignore stylesheet iteration failures
        }
      }
    });
  } finally {
    // Restore original window getComputedStyle
    if (origWindowGetComputedStyle) {
      window.getComputedStyle = origWindowGetComputedStyle;
    }
  }
}

export async function captureElementToPdf(element: HTMLElement, pageSize: PageSizeFormat = "A4"): Promise<jsPDF | null> {
  try {
    const canvas = await captureElementToCanvas(element);
    const imgData = canvas.toDataURL("image/jpeg", 0.98);

    if (pageSize === "THERMAL_80MM" || pageSize === "THERMAL_58MM") {
      const widthMm = pageSize === "THERMAL_80MM" ? 80 : 58;
      const heightMm = (canvas.height * widthMm) / canvas.width;

      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: [widthMm, Math.max(heightMm, 100)]
      });

      pdf.addImage(imgData, "JPEG", 0, 0, widthMm, heightMm);
      return pdf;
    }

    let formatSpec: "a4" | "a5" | "letter" = "a4";
    if (pageSize === "A5") formatSpec = "a5";
    if (pageSize === "LETTER") formatSpec = "letter";

    const pdf = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: formatSpec
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    let finalWidth = pdfWidth;
    let finalHeight = (canvas.height * pdfWidth) / canvas.width;

    if (finalHeight > pdfHeight) {
      const scale = pdfHeight / finalHeight;
      finalHeight = pdfHeight;
      finalWidth = pdfWidth * scale;
    }

    const xOffset = (pdfWidth - finalWidth) / 2;
    pdf.addImage(imgData, "JPEG", xOffset, 0, finalWidth, finalHeight);

    return pdf;
  } catch (err) {
    console.error("captureElementToPdf error:", err);
    return null;
  }
}

export async function exportToPdf(elementId: string, filename: string, pageSize: PageSizeFormat = "A4"): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id #${elementId} not found`);
    return false;
  }

  try {
    const pdf = await captureElementToPdf(element, pageSize);
    if (!pdf) return false;
    pdf.save(`${filename}.pdf`);
    return true;
  } catch (error) {
    console.error("PDF Generation error:", error);
    return false;
  }
}

