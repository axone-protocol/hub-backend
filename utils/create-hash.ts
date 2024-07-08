import { createHash } from "crypto";

export function hash(obj: unknown): string {
  return createHash("sha256").update(JSON.stringify(obj)).digest("hex");
}