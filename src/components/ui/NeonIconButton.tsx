"use client";

import Link, { LinkProps } from "next/link";
import React, { ComponentProps, ReactElement } from "react";
import {
  FiLogIn,
  FiInfo,
  FiPlus,
  FiEye,
  FiTrash2,
  FiChevronRight,
  FiChevronLeft,
  FiArchive,
  FiCheck,
  FiSave,
  FiX,
  FiEdit,
  FiDownload,
  FiUpload,
  FiSearch,
  FiRefreshCw,
  FiCheckSquare,
  FiServer,
  FiUserPlus,
  FiShare,
  FiSend,
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
  close: <FiX />,
  assign: <FiCheckSquare style={{ color: "#d9ed92" }} />,
  viewArchive: <FiServer />,
  submitApplication: <FiShare />, // new green submit application button
  send: <FiSend />,
} as const;

type Variant = keyof typeof ICONS;

type BaseProps = {
  variant: Variant;
  icon?: ReactElement; // optional override
  title: string; // tooltip + aria-label
  className?: string;
  children?: React.ReactNode;
};

type ButtonProps = BaseProps & { as?: "button" } & Omit<
    ComponentProps<"button">,
    "className" | "title"
  >;
type AnchorProps = BaseProps & { as: "a" } & Omit<
    ComponentProps<"a">,
    "className" | "title"
  >;
type NextLinkOwn = BaseProps & { as: "link" } & Omit<LinkProps, "href"> & {
    href: LinkProps["href"];
  };

type Props = ButtonProps | AnchorProps | NextLinkOwn;

export default function NeonIconButton(p: Props) {
  const { variant, icon, title, className = "" } = p;
  // Remove all spacing/padding from button and icon
  const classes = `neon-btn neon-btn-${variant} ${className}`.trim();
  const IconEl = icon ?? ICONS[variant] ?? <FiChevronRight />;

  // <a> branch
  if (p.as === "a") {
    const { children, ...domProps } = p as AnchorProps & BaseProps;
    return (
      <a {...domProps} className={classes} title={title}>
        <span>{IconEl}</span>
        {children}
      </a>
    );
  }

  // Next <Link> branch
  if (p.as === "link") {
    const { children, href, as, variant, icon, title, className, ...linkProps } = p as NextLinkOwn & BaseProps;
    return (
      <Link href={href} {...linkProps} className={classes} title={title}>
        <span>{IconEl}</span>
        {children}
      </Link>
    );
  }

  // <button> branch (default)
  {
    const { children, type, ...domProps } = p as ButtonProps & BaseProps;
    return (
      <button
        {...domProps}
        type={type ?? "button"}
        className={classes}
        title={title}
      >
        <span>{IconEl}</span>
        {children}
      </button>
    );
  }
}

export interface NeonAddPeopleButtonProps {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  title?: string;
}

export function NeonAddPeopleButton({ onClick, title = "Add People" }: NeonAddPeopleButtonProps) {
  return (
    <button
      className="neon-btn neon-btn-add-people"
      title={title}
      aria-label={title}
      onClick={onClick}
      type="button"
    >
      <FiUserPlus />
    </button>
  );
}

export interface NeonSubmitApplicationButtonProps {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  title?: string;
  disabled?: boolean;
}

export function NeonSubmitApplicationButton({ onClick, title = "Submit Application", disabled }: NeonSubmitApplicationButtonProps) {
  return (
    <button
      className="neon-btn neon-btn-submit-application"
      title={title}
      aria-label={title}
      onClick={onClick}
      type="submit"
      disabled={disabled}
      style={{ background: "#19e68c", color: "#111", border: "none" }}
    >
      <FiShare style={{ marginRight: 8, verticalAlign: "middle" }} />
      {title}
    </button>
  );
}
