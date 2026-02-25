import type { CodeType } from "react-native-vision-camera";

export const SCAN_BOX_SIZE = 240;
export const CORNER_SIZE = 34;
export const CORNER_THICKNESS = 4;

export const CODE_TYPE_LABELS: Record<string, string> = {
  qr: "QR Code",
  "ean-13": "EAN-13",
  "ean-8": "EAN-8",
  "code-128": "Code 128",
  "code-39": "Code 39",
  "upc-e": "UPC-E",
  "data-matrix": "Data Matrix",
  "pdf-417": "PDF417",
  unknown: "Unknown",
};

export const SUPPORTED_CODE_TYPES: CodeType[] = [
  "qr",
  "ean-13",
  "ean-8",
  "code-128",
  "code-39",
  "upc-e",
  "data-matrix",
  "pdf-417",
];
