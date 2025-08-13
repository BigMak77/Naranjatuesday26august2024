"use client";

import Link from "next/link";
import { ComponentProps, ReactElement } from "react";
import { FiLogIn, FiInfo, FiPlus, FiEye, FiTrash2, FiChevronRight, FiChevronLeft, FiArchive, FiCheck, FiSave, FiX, FiEdit2, FiDownload, FiUpload, FiSearch, FiRefreshCw } from "react-icons/fi";

const ICONS: Record<string, ReactElement> = {
  add: <FiPlus />,
  view: <FiEye />,
  delete: <FiTrash2 />,
  next: <FiChevronRight />,
  back: <FiChevronLeft />,
  archive: <FiArchive />,
  submit: <FiCheck />,
  save: <FiSave />,
  cancel: <FiX />,
  edit: <FiEdit2 />,
  download: <FiDownload />,
  upload: <FiUpload />,
  search: <FiSearch />,
  refresh: <FiRefreshCw />,
  info: <FiInfo />,
  login: <FiLogIn />,
};

type Variant = keyof typeof ICONS;

type BaseProps = {
  variant: Variant;
  icon?: ReactElement;           // optional, will use default if not provided
  title: string;                // tooltip + aria-label
  className?: string;           // optional extra classes
  children?: React.ReactNode;   // allow text if needed
};

type ButtonProps = BaseProps & { as?: "button" } & ComponentProps<"button">;
type AnchorProps = BaseProps & { as: "a" } & ComponentProps<"a">;
type NextLinkProps = BaseProps & { as: "link"; href: string };

export default function NeonIconButton(props: ButtonProps | AnchorProps | NextLinkProps) {
  const { variant, icon, title, className = "", children } = props;
  const classes = `neon-btn-square neon-btn-${variant} ${className}`.trim();
  const IconEl = icon || ICONS[variant] || <FiChevronRight />;

  if (props.as === "a") {
    const rest = props as AnchorProps;
    return (
      <a {...rest} className={classes} aria-label={title} title={title}>
        {IconEl}
        {children}
      </a>
    );
  }

  if (props.as === "link") {
    const { href, ...rest } = props as NextLinkProps;
    return (
      <Link href={href} className={classes} aria-label={title} title={title} {...(rest as Omit<NextLinkProps, 'href' | 'as' | 'variant' | 'icon' | 'title' | 'className' | 'children'>)}>
        {IconEl}
        {children}
      </Link>
    );
  }

  const rest = props as ButtonProps;
  return (
    <button {...rest} className={classes} aria-label={title} title={title}>
      {IconEl}
      {children}
    </button>
  );
}
