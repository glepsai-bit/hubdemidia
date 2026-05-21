// Link textual com o acento da marca. `linkClass` serve para <a> externos.
import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "./cn";

export const linkClass = "font-medium text-brand underline-offset-2 hover:underline";

export function TextLink({ className, ...props }: ComponentProps<typeof Link>) {
  return <Link className={cn(linkClass, className)} {...props} />;
}
