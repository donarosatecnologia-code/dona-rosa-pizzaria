import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Remove tags HTML para títulos CMS que às vezes guardam &lt;h2&gt;... como texto. */
export function stripHtmlTags(value: string): string {
  if (!value) {
    return "";
  }
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .trim();
}
