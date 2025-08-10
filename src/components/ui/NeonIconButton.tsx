"use client";

import Link from "next/link";
import { ComponentProps, ReactElement } from "react";

type Variant =
  | "add" | "view" | "delete" | "next" | "back" | "archive"
  | "submit" | "save" | "cancel" | "edit" | "download"
  | "upload" | "search" | "refresh";

type As = "button" | "a" | "link";

type BaseProps = {
  variant: Variant;
  icon: ReactElement;           // e.g. <FiPlus />
  title: string;                // tooltip + aria-label
  className?: string;           // optional extra classes
};

type ButtonProps = BaseProps & { as?: "button" } & ComponentProps<"button">;
type AnchorProps = BaseProps & { as: "a" } & ComponentProps<"a">;
type NextLinkProps = BaseProps & { as: "link"; href: string };

export default function NeonIconButton(props: ButtonProps | AnchorProps | NextLinkProps) {
  const { variant, icon, title, className = "" } = props;
  const classes = `neon-btn-square neon-btn-${variant} ${className}`.trim();

  if (props.as === "a") {
    const { as, ...rest } = props as AnchorProps;
    return (
      <a {...rest} className={classes} aria-label={title} title={title}>
        {icon}
      </a>
    );
  }

  if (props.as === "link") {
    const { href, as, ...rest } = props as NextLinkProps;
    return (
      <Link href={href} className={classes} aria-label={title} title={title} {...rest as any}>
        {icon}
      </Link>
    );
  }

  const { as, ...rest } = props as ButtonProps;
  return (
    <button {...rest} className={classes} aria-label={title} title={title}>
      {icon}
    </button>
  );
}
