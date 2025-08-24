"use client";

import Link, { LinkProps } from "next/link";
import React, { ComponentProps, ReactElement } from "react";
import {
  FiLogIn, FiInfo, FiPlus, FiEye, FiTrash2, FiChevronRight, FiChevronLeft,
  FiArchive, FiCheck, FiSave, FiX, FiEdit, FiDownload, FiUpload, FiSearch, FiRefreshCw
} from "react-icons/fi";

const ICONS = {
  add: <FiPlus />,
  view: <FiEye />,
  delete: <FiTrash2 />,
  next: <FiChevronRight />,
  back: <FiChevronLeft />,
  archive: <FiArchive />,
  submit: <FiCheck />,
  save: <FiSave />,
  cancel: <FiX />,
  edit: <FiEdit />,
  download: <FiDownload />,
  upload: <FiUpload />,
  search: <FiSearch />,
  refresh: <FiRefreshCw />,
  info: <FiInfo />,
  login: <FiLogIn />,
} as const;

type Variant = keyof typeof ICONS;

type BaseProps = {
  variant: Variant;
  icon?: ReactElement;        // optional override
  title: string;              // tooltip + aria-label
  className?: string;
  children?: React.ReactNode;
};

type ButtonProps = BaseProps & { as?: "button" } & Omit<ComponentProps<"button">, "className" | "title">;
type AnchorProps = BaseProps & { as: "a" } & Omit<ComponentProps<"a">, "className" | "title">;
type NextLinkOwn = BaseProps & { as: "link" } & Omit<LinkProps, "href"> & { href: LinkProps["href"] };

type Props = ButtonProps | AnchorProps | NextLinkOwn;

export default function NeonIconButton(p: Props) {
  const { variant, icon, title, className = "", children } = p;
  const classes = `neon-btn neon-btn-${variant} ${className}`.trim();
  const IconEl = icon ?? ICONS[variant] ?? <FiChevronRight />;

  // <a> branch
  if (p.as === "a") {
    const { ...domProps } = p as AnchorProps & BaseProps;
    return (
      <a {...domProps} className={classes} title={title}>
        {IconEl}
        {children}
      </a>
    );
  }

  // Next <Link> branch
  if (p.as === "link") {
    const { href, ...linkProps } = p as NextLinkOwn & BaseProps;
    return (
      <Link href={href} {...linkProps} className={classes} title={title}>
        {IconEl}
        {children}
      </Link>
    );
  }

  // <button> branch (default)
  {
    const { type, ...domProps } = p as ButtonProps & BaseProps;
    return (
      <button
        {...domProps}
        type={type ?? "button"}
        className={classes}
        title={title}
      >
        {IconEl}
        {children}
      </button>
    );
  }
}