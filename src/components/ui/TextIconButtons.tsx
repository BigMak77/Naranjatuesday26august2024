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
  FiAlertOctagon,
  FiList,
  FiClock,
  FiCheckCircle,
  FiCopy,
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
  assign: <FiCheckSquare />,
  copy: <FiCopy />,
  viewArchive: <FiServer />,
  submitApplication: <FiShare />,
  send: <FiSend />,
  list: <FiList />,
  clock: <FiClock />,
  checkCircle: <FiCheckCircle />,
  addUser: <FiUserPlus />,
  alert: <FiAlertOctagon />,
  // Form action variants (no icons by default)
  primary: null,
  secondary: null,
} as const;

type Variant = keyof typeof ICONS;

type BaseProps = {
  variant: Variant;
  icon?: ReactElement | null;
  label: string;
  title?: string;
  className?: string;
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

export default function TextIconButton(p: Props) {
  const { variant, icon, label, className = "" } = p;
  const classes = `text-icon-btn text-icon-btn-${variant} ${className}`.trim();
  const IconEl = icon !== undefined ? icon : ICONS[variant];
  const hasIcon = IconEl !== null && IconEl !== undefined;

  // <a> branch
  if (p.as === "a") {
    const { as: _as, variant: _variant, icon: _icon, label: _label, title: _title, className: _className, ...domProps } = p as AnchorProps;
    return (
      <a {...domProps} className={classes}>
        {hasIcon && <span className="text-icon-btn-icon">{IconEl}</span>}
        <span className="text-icon-btn-label">{label}</span>
      </a>
    );
  }

  // Next <Link> branch
  if (p.as === "link") {
    const { href, as: _as, variant: _variant, icon: _icon, label: _label, title: _title, className: _className, ...linkProps } = p as NextLinkOwn;
    return (
      <Link href={href} {...linkProps} className={classes}>
        {hasIcon && <span className="text-icon-btn-icon">{IconEl}</span>}
        <span className="text-icon-btn-label">{label}</span>
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
      >
        {hasIcon && <span className="text-icon-btn-icon">{IconEl}</span>}
        <span className="text-icon-btn-label">{label}</span>
      </button>
    );
  }
}

// Specialized button exports for backwards compatibility
export interface NeonSubmitApplicationButtonProps {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  title?: string;
  disabled?: boolean;
}

export function NeonSubmitApplicationButton({
  onClick,
  title = "Submit Application",
  disabled
}: NeonSubmitApplicationButtonProps) {
  return (
    <TextIconButton
      variant="submitApplication"
      label={title}
      onClick={onClick}
      disabled={disabled}
      className="neon-btn-submit-application"
      style={{
        background: "#19e68c",
        color: "#111",
        border: "none"
      }}
    />
  );
}
