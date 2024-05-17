import pako from "pako";

export function textToBase64(text: string) {
  const buffer = new TextEncoder().encode(text);
  const deflated = pako.deflate(buffer);
  return btoa(String.fromCharCode(...deflated));
}

export function base64ToText(base64: string) {
  const data = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const inflated = pako.inflate(data);
  return new TextDecoder().decode(inflated);
}
