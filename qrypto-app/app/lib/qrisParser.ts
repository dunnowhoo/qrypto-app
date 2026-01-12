/**
 * QRIS Parser - Parse Indonesian QRIS (Quick Response Code Indonesian Standard)
 * 
 * QRIS follows EMVCo QR Code specification with Indonesia-specific extensions.
 * Format: Tag-Length-Value (TLV) structure
 * 
 * Common QRIS Tags:
 * - 00: Payload Format Indicator
 * - 01: Point of Initiation Method (11=static, 12=dynamic)
 * - 26-51: Merchant Account Information
 * - 52: Merchant Category Code
 * - 53: Transaction Currency (360 = IDR)
 * - 54: Transaction Amount
 * - 58: Country Code (ID)
 * - 59: Merchant Name
 * - 60: Merchant City
 * - 61: Postal Code
 * - 62: Additional Data Field (contains bill number, reference, etc)
 * - 63: CRC (Checksum)
 */

export interface QrisData {
  isValid: boolean;
  payloadFormatIndicator?: string;
  pointOfInitiation?: "static" | "dynamic";
  merchantAccountInfo?: {
    globalId?: string;
    merchantPAN?: string;
    merchantId?: string;
    merchantCriteria?: string;
  };
  merchantCategoryCode?: string;
  transactionCurrency?: string;
  transactionAmount?: number;
  countryCode?: string;
  merchantName?: string;
  merchantCity?: string;
  postalCode?: string;
  additionalData?: {
    billNumber?: string;
    mobileNumber?: string;
    storeLabel?: string;
    loyaltyNumber?: string;
    referenceLabel?: string;
    customerLabel?: string;
    terminalLabel?: string;
    purposeOfTransaction?: string;
  };
  crc?: string;
  rawData: string;
  error?: string;
}

interface TLV {
  tag: string;
  length: number;
  value: string;
}

/**
 * Parse TLV (Tag-Length-Value) from QRIS string
 */
function parseTLV(data: string): TLV[] {
  const result: TLV[] = [];
  let position = 0;

  while (position < data.length) {
    // Tag is 2 digits
    if (position + 2 > data.length) break;
    const tag = data.substring(position, position + 2);
    position += 2;

    // Length is 2 digits
    if (position + 2 > data.length) break;
    const length = parseInt(data.substring(position, position + 2), 10);
    position += 2;

    // Value is 'length' characters
    if (position + length > data.length) break;
    const value = data.substring(position, position + length);
    position += length;

    result.push({ tag, length, value });
  }

  return result;
}

/**
 * Parse Merchant Account Information (Tag 26-51)
 */
function parseMerchantAccountInfo(value: string): QrisData["merchantAccountInfo"] {
  const tlvs = parseTLV(value);
  const result: QrisData["merchantAccountInfo"] = {};

  for (const tlv of tlvs) {
    switch (tlv.tag) {
      case "00":
        result.globalId = tlv.value;
        break;
      case "01":
        result.merchantPAN = tlv.value;
        break;
      case "02":
        result.merchantId = tlv.value;
        break;
      case "03":
        result.merchantCriteria = tlv.value;
        break;
    }
  }

  return result;
}

/**
 * Parse Additional Data Field (Tag 62)
 */
function parseAdditionalData(value: string): QrisData["additionalData"] {
  const tlvs = parseTLV(value);
  const result: QrisData["additionalData"] = {};

  for (const tlv of tlvs) {
    switch (tlv.tag) {
      case "01":
        result.billNumber = tlv.value;
        break;
      case "02":
        result.mobileNumber = tlv.value;
        break;
      case "03":
        result.storeLabel = tlv.value;
        break;
      case "04":
        result.loyaltyNumber = tlv.value;
        break;
      case "05":
        result.referenceLabel = tlv.value;
        break;
      case "06":
        result.customerLabel = tlv.value;
        break;
      case "07":
        result.terminalLabel = tlv.value;
        break;
      case "08":
        result.purposeOfTransaction = tlv.value;
        break;
    }
  }

  return result;
}

/**
 * Calculate CRC16-CCITT checksum for QRIS validation
 */
function calculateCRC16(data: string): string {
  let crc = 0xFFFF;
  const polynomial = 0x1021;

  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ polynomial) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Validate QRIS CRC checksum
 */
function validateCRC(qrisString: string): boolean {
  // CRC is the last 4 characters
  // The data to check is everything before the CRC value (excluding "63" + "04" + CRC)
  const dataWithoutCRC = qrisString.slice(0, -4);
  const providedCRC = qrisString.slice(-4);
  const calculatedCRC = calculateCRC16(dataWithoutCRC);
  
  return providedCRC.toUpperCase() === calculatedCRC;
}

/**
 * Main QRIS Parser function
 */
export function parseQRIS(qrisString: string): QrisData {
  const result: QrisData = {
    isValid: false,
    rawData: qrisString,
  };

  try {
    // Basic validation
    if (!qrisString || qrisString.length < 20) {
      result.error = "Invalid QRIS string: too short";
      return result;
    }

    // Validate CRC
    if (!validateCRC(qrisString)) {
      result.error = "Invalid QRIS: CRC checksum failed";
      return result;
    }

    // Parse TLV structure
    const tlvs = parseTLV(qrisString);

    for (const tlv of tlvs) {
      switch (tlv.tag) {
        case "00":
          result.payloadFormatIndicator = tlv.value;
          break;
        case "01":
          result.pointOfInitiation = tlv.value === "11" ? "static" : "dynamic";
          break;
        // Tags 26-51 are Merchant Account Information
        case "26":
        case "27":
        case "28":
        case "29":
        case "30":
        case "31":
        case "51":
          result.merchantAccountInfo = parseMerchantAccountInfo(tlv.value);
          break;
        case "52":
          result.merchantCategoryCode = tlv.value;
          break;
        case "53":
          result.transactionCurrency = tlv.value;
          break;
        case "54":
          result.transactionAmount = parseFloat(tlv.value);
          break;
        case "58":
          result.countryCode = tlv.value;
          break;
        case "59":
          result.merchantName = tlv.value;
          break;
        case "60":
          result.merchantCity = tlv.value;
          break;
        case "61":
          result.postalCode = tlv.value;
          break;
        case "62":
          result.additionalData = parseAdditionalData(tlv.value);
          break;
        case "63":
          result.crc = tlv.value;
          break;
      }
    }

    // Validate required fields for QRIS
    if (!result.merchantName) {
      result.error = "Invalid QRIS: missing merchant name";
      return result;
    }

    result.isValid = true;
    return result;
  } catch (error) {
    result.error = `Failed to parse QRIS: ${error instanceof Error ? error.message : "Unknown error"}`;
    return result;
  }
}

/**
 * Format amount to IDR currency string
 */
export function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Convert IDR to IDRX (1:1 ratio, but in proper decimal format)
 */
export function idrToIDRX(idrAmount: number): string {
  // IDRX has 2 decimals like IDR
  return idrAmount.toFixed(2);
}

/**
 * Check if a string is likely a QRIS code
 */
export function isQRISCode(data: string): boolean {
  // QRIS always starts with "00" (Payload Format Indicator)
  // and contains "ID" as country code and typically includes QRIS identifiers
  return (
    data.startsWith("00") &&
    data.includes("ID") &&
    (data.includes("A0000006160000") || // QRIS Global ID
      data.includes("ID.CO.") || // QRIS merchant ID format
      data.includes("93600")) // IDR currency code
  );
}

/**
 * Sample QRIS for testing
 */
export const SAMPLE_QRIS = {
  static: "00020101021126670016COM.NOBUBANK.WWW01444607889012003456789012362000000000012345678900000000011302141234567890123403005502015802ID5913TOKO SANJAYA6007JAKARTA61052010162070703A016304A1B2",
  dynamic: "00020101021226670016COM.NOBUBANK.WWW01444607889012003456789012362000000000012345678900000000011302141234567890123403005502015802ID5913TOKO SANJAYA6007JAKARTA610520101540750000062070703A016304B3C4",
};

/**
 * Extract NMID (National Merchant ID) from parsed QRIS data
 * NMID is the unique identifier for merchants in Indonesian payment system
 */
export function extractNMID(qrisData: QrisData): string | null {
  // NMID is typically in merchantAccountInfo.merchantId (Tag 02 inside Tag 26-51)
  if (qrisData.merchantAccountInfo?.merchantId) {
    return qrisData.merchantAccountInfo.merchantId;
  }
  
  // Fallback: try merchantPAN
  if (qrisData.merchantAccountInfo?.merchantPAN) {
    return qrisData.merchantAccountInfo.merchantPAN;
  }
  
  return null;
}

/**
 * Extract merchant identifier for database lookup
 * Returns NMID if available, otherwise uses merchantName for fuzzy matching
 */
export function getMerchantIdentifier(qrisData: QrisData): {
  nmid: string | null;
  merchantName: string | null;
} {
  return {
    nmid: extractNMID(qrisData),
    merchantName: qrisData.merchantName || null,
  };
}
