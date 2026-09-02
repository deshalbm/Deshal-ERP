export type SupportedCurrency =
  | "OMR"
  | "SAR"
  | "AED"
  | "KWD"
  | "BHD"
  | "QAR"
  | "USD"
  | "EUR"
  | "GBP"
  | "CAD"
  | "AUD"
  | "INR"
  | "JPY"
  | "CHF";

// ----------------------------------------------------
// ENGLISH NUMBER TO WORDS
// ----------------------------------------------------
const onesEn = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen"
];

const tensEn = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
];

function convertGroupEn(num: number): string {
  let str = "";
  if (num >= 100) {
    str += onesEn[Math.floor(num / 100)] + " Hundred ";
    num %= 100;
  }
  if (num >= 20) {
    str += tensEn[Math.floor(num / 10)] + (num % 10 !== 0 ? "-" + onesEn[num % 10] : "") + " ";
  } else if (num > 0) {
    str += onesEn[num] + " ";
  }
  return str;
}

export function numberToEnglishWords(amount: number, currencyCode: string = "OMR"): string {
  if (isNaN(amount) || amount === null) return "Zero Omani Rials Only";
  
  const curr = currencyCode.toUpperCase();
  const { major, minor } = getCurrencyNamesEn(curr);

  if (amount === 0) return `Zero ${major} Only`;

  const absAmount = Math.abs(amount);
  const integerPart = Math.floor(absAmount);
  
  const isThreeDecimals = curr === "OMR" || curr === "KWD" || curr === "BHD";
  const decimalMultiplier = isThreeDecimals ? 1000 : 100;
  const decimalPart = Math.round((absAmount - integerPart) * decimalMultiplier);

  let result = "";

  if (integerPart === 0) {
    result = "Zero " + major;
  } else {
    let num = integerPart;
    const billions = Math.floor(num / 1000000000);
    num %= 1000000000;
    const millions = Math.floor(num / 1000000);
    num %= 1000000;
    const thousands = Math.floor(num / 1000);
    num %= 1000;
    const remainder = num;

    if (billions > 0) {
      result += convertGroupEn(billions) + "Billion ";
    }
    if (millions > 0) {
      result += convertGroupEn(millions) + "Million ";
    }
    if (thousands > 0) {
      result += convertGroupEn(thousands) + "Thousand ";
    }
    if (remainder > 0) {
      result += convertGroupEn(remainder);
    }

    result = result.trim() + " " + (integerPart === 1 ? major.replace(/s$/, '') : major);
  }

  if (decimalPart > 0) {
    result += ` and ${decimalPart}/${decimalMultiplier} ${minor}`;
  } else {
    result += " Only";
  }

  return result.replace(/\s+/g, " ").trim();
}

function getCurrencyNamesEn(currency: string): { major: string; minor: string } {
  switch (currency.toUpperCase()) {
    case "OMR":
      return { major: "Omani Rials", minor: "Baisa" };
    case "KWD":
      return { major: "Kuwaiti Dinars", minor: "Fils" };
    case "BHD":
      return { major: "Bahraini Dinars", minor: "Fils" };
    case "QAR":
      return { major: "Qatari Riyals", minor: "Dirhams" };
    case "EUR":
      return { major: "Euros", minor: "Cents" };
    case "GBP":
      return { major: "Pounds Sterling", minor: "Pence" };
    case "AED":
      return { major: "UAE Dirhams", minor: "Fils" };
    case "SAR":
      return { major: "Saudi Riyals", minor: "Halalas" };
    case "CAD":
      return { major: "Canadian Dollars", minor: "Cents" };
    case "AUD":
      return { major: "Australian Dollars", minor: "Cents" };
    case "INR":
      return { major: "Indian Rupees", minor: "Paise" };
    case "JPY":
      return { major: "Japanese Yen", minor: "Sen" };
    case "CHF":
      return { major: "Swiss Francs", minor: "Rappen" };
    case "USD":
    default:
      return { major: "US Dollars", minor: "Cents" };
  }
}

// ----------------------------------------------------
// ARABIC NUMBER TO WORDS (TAFQEET تفقيط معتمد ودقيق)
// ----------------------------------------------------
const unitsAr = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"];
const teensAr = ["عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
const tensAr = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
const hundredsAr = ["", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];

function convertGroupAr(num: number): string {
  if (num === 0) return "";
  let parts: string[] = [];

  // Hundreds
  const h = Math.floor(num / 100);
  const rem = num % 100;
  if (h > 0) {
    parts.push(hundredsAr[h]);
  }

  // Tens and units
  if (rem > 0) {
    if (rem < 10) {
      parts.push(unitsAr[rem]);
    } else if (rem >= 10 && rem < 20) {
      parts.push(teensAr[rem - 10]);
    } else {
      const u = rem % 10;
      const t = Math.floor(rem / 10);
      if (u > 0) {
        parts.push(`${unitsAr[u]} و${tensAr[t]}`);
      } else {
        parts.push(tensAr[t]);
      }
    }
  }

  return parts.join(" و");
}

export function numberToArabicWords(amount: number, currencyCode: string = "OMR"): string {
  if (isNaN(amount) || amount === null) return "فقط صفر ريال عماني لا غير";
  
  const curr = currencyCode.toUpperCase();
  const { major, majorSingle, minor } = getCurrencyNamesAr(curr);

  if (amount === 0) return `فقط صفر ${majorSingle} لا غير`;

  const absAmount = Math.abs(amount);
  const integerPart = Math.floor(absAmount);
  
  const isThreeDecimals = curr === "OMR" || curr === "KWD" || curr === "BHD";
  const decimalMultiplier = isThreeDecimals ? 1000 : 100;
  const decimalPart = Math.round((absAmount - integerPart) * decimalMultiplier);

  let resultWords = "";

  if (integerPart === 0) {
    resultWords = `صفر ${majorSingle}`;
  } else {
    let num = integerPart;
    const billions = Math.floor(num / 1000000000);
    num %= 1000000000;
    const millions = Math.floor(num / 1000000);
    num %= 1000000;
    const thousands = Math.floor(num / 1000);
    num %= 1000;
    const remainder = num;

    const sections: string[] = [];

    if (billions > 0) {
      if (billions === 1) sections.push("مليار");
      else if (billions === 2) sections.push("ملياران");
      else if (billions >= 3 && billions <= 10) sections.push(`${convertGroupAr(billions)} مليارات`);
      else sections.push(`${convertGroupAr(billions)} مليار`);
    }

    if (millions > 0) {
      if (millions === 1) sections.push("مليون");
      else if (millions === 2) sections.push("مليونان");
      else if (millions >= 3 && millions <= 10) sections.push(`${convertGroupAr(millions)} ملايين`);
      else sections.push(`${convertGroupAr(millions)} مليون`);
    }

    if (thousands > 0) {
      if (thousands === 1) sections.push("ألف");
      else if (thousands === 2) sections.push("ألفان");
      else if (thousands >= 3 && thousands <= 10) sections.push(`${convertGroupAr(thousands)} آلاف`);
      else sections.push(`${convertGroupAr(thousands)} ألف`);
    }

    if (remainder > 0) {
      sections.push(convertGroupAr(remainder));
    }

    const words = sections.join(" و");
    resultWords = `${words} ${integerPart === 1 ? majorSingle : integerPart === 2 ? majorSingle : major}`;
  }

  let finalOutput = `فقط ${resultWords}`;

  if (decimalPart > 0) {
    const decWords = convertGroupAr(decimalPart);
    finalOutput += ` و${decWords} ${minor}`;
  }

  finalOutput += " لا غير";
  return finalOutput.replace(/\s+/g, " ").trim();
}

function getCurrencyNamesAr(currency: string): { major: string; majorSingle: string; minor: string } {
  switch (currency.toUpperCase()) {
    case "OMR":
      return { major: "ريال عماني", majorSingle: "ريال عماني", minor: "بيسة" };
    case "SAR":
      return { major: "ريال سعودي", majorSingle: "ريال سعودي", minor: "هللة" };
    case "AED":
      return { major: "درهم إماراتي", majorSingle: "درهم إماراتي", minor: "فلس" };
    case "KWD":
      return { major: "دينار كويتي", majorSingle: "دينار كويتي", minor: "فلس" };
    case "BHD":
      return { major: "دينار بحريني", majorSingle: "دينار بحريني", minor: "فلس" };
    case "QAR":
      return { major: "ريال قطري", majorSingle: "ريال قطري", minor: "درهم" };
    case "USD":
      return { major: "دولار أمريكي", majorSingle: "دولار أمريكي", minor: "سنت" };
    case "EUR":
      return { major: "يورو", majorSingle: "يورو", minor: "سنت" };
    case "GBP":
      return { major: "جنيه إسترليني", majorSingle: "جنيه إسترليني", minor: "بنس" };
    case "CAD":
      return { major: "دولار كندي", majorSingle: "دولار كندي", minor: "سنت" };
    case "AUD":
      return { major: "دولار أسترالي", majorSingle: "دولار أسترالي", minor: "سنت" };
    case "INR":
      return { major: "روبية هندية", majorSingle: "روبية هندية", minor: "بيزة" };
    case "JPY":
      return { major: "ين ياباني", majorSingle: "ين ياباني", minor: "سن" };
    case "CHF":
      return { major: "فرنك سويسري", majorSingle: "فرنك سويسري", minor: "رابن" };
    default:
      return { major: "ريال عماني", majorSingle: "ريال عماني", minor: "بيسة" };
  }
}

// ----------------------------------------------------
// DYNAMIC DISPATCHER BASED ON LANGUAGE
// ----------------------------------------------------
export function numberToWords(amount: number, currencyCode: string = "OMR", lang: "ar" | "en" = "ar"): string {
  if (lang === "ar") {
    return numberToArabicWords(amount, currencyCode);
  }
  return numberToEnglishWords(amount, currencyCode);
}
