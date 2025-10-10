import React, { useState } from "react";
import { FiChevronRight, FiChevronLeft, FiChevronLeft as FiPageLeft, FiChevronRight as FiPageRight, FiCornerDownRight, FiCornerDownLeft } from "react-icons/fi";

export interface NeonDualListboxProps {
  items?: { id: string; label: string }[]; // Make items optional
  selected: string[];
  onChange: (selected: string[]) => void;
  titleLeft?: string;
  titleRight?: string;
}

export function getSelectedModuleObjects(
  items: { id: string; label: string }[],
  selected: string[],
) {
  return items.filter((item) => selected.includes(item.id));
}

const PAGE_SIZE = 8;

export default function NeonDualListbox({
  items = [], // Default to empty array
  selected,
  onChange,
  titleLeft = "Available",
  titleRight = "Selected",
  className = "",
}: {
  items?: { id: string; label: string }[]; // Make items optional
  selected: string[];
  onChange: (next: string[]) => void;
  titleLeft?: string;
  titleRight?: string;
  className?: string;
}) {
  const [highlightedLeft, setHighlightedLeft] = useState<string[]>([]);
  const [highlightedRight, setHighlightedRight] = useState<string[]>([]);
  const [searchLeft, setSearchLeft] = useState("");
  const [searchRight, setSearchRight] = useState("");
  const [pageLeft, setPageLeft] = useState(0);
  const [pageRight, setPageRight] = useState(0);

  const available = items.filter((i) => !selected.includes(i.id));
  const selectedItems = items.filter((i) => selected.includes(i.id));

  const filteredAvailable = available.filter(
    (item) => item && item.label && item.label.toLowerCase().includes(searchLeft.toLowerCase())
  );
  const filteredSelected = selectedItems.filter(
    (item) => item && item.label && item.label.toLowerCase().includes(searchRight.toLowerCase())
  );

  // Pagination logic
  const totalPagesLeft = Math.max(1, Math.ceil(filteredAvailable.length / PAGE_SIZE));
  const totalPagesRight = Math.max(1, Math.ceil(filteredSelected.length / PAGE_SIZE));
  const pagedAvailable = filteredAvailable.slice(pageLeft * PAGE_SIZE, (pageLeft + 1) * PAGE_SIZE);
  const pagedSelected = filteredSelected.slice(pageRight * PAGE_SIZE, (pageRight + 1) * PAGE_SIZE);

  // Reset page if search changes
  React.useEffect(() => { setPageLeft(0); }, [searchLeft]);
  React.useEffect(() => { setPageRight(0); }, [searchRight]);

  const moveRight = () => {
    onChange([...selected, ...highlightedLeft]);
    setHighlightedLeft([]);
  };
  const moveLeft = () => {
    onChange(selected.filter((id) => !highlightedRight.includes(id)));
    setHighlightedRight([]);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "300px 40px 300px", gap: 2 }}>
      <div className="neon-duallistbox-panel" style={{ padding: 0 }}>
        <div className="neon-duallistbox-title" style={{ marginBottom: 1 }}>{titleLeft}</div>
        <input
          className="neon-input"
          type="search"
          placeholder="Search..."
          value={searchLeft}
          onChange={(e) => setSearchLeft(e.target.value)}
          aria-label="Search available"
          style={{ marginBottom: 1 }}
        />
        <ul className="neon-duallistbox-list" style={{ minHeight: 200, marginBottom: 2, padding: 0 }}>
          {pagedAvailable.map((item) => (
            <li
              key={item.id}
              className={
                "neon-duallistbox-list-item" +
                (highlightedLeft.includes(item.id) ? " selected" : "")
              }
              onClick={() =>
                setHighlightedLeft((hl) =>
                  hl.includes(item.id)
                    ? hl.filter((id) => id !== item.id)
                    : [...hl, item.id],
                )
              }
              tabIndex={0}
              style={{ padding: "3px 5px", borderRadius: 2, marginBottom: 1 }}
            >
              {item.label}
            </li>
          ))}
        </ul>
        <div className="neon-duallistbox-pagination" style={{ marginBottom: 1 }}>
          <button
            className="neon-btn neon-btn-square"
            onClick={() => setPageLeft((p) => Math.max(0, p - 1))}
            disabled={pageLeft === 0}
            aria-label="Previous page"
            type="button"
          >
            <FiPageLeft />
          </button>
          <span>
            {pageLeft + 1} / {totalPagesLeft}
          </span>
          <button
            className="neon-btn neon-btn-square"
            onClick={() => setPageLeft((p) => Math.min(totalPagesLeft - 1, p + 1))}
            disabled={pageLeft >= totalPagesLeft - 1}
            aria-label="Next page"
            type="button"
          >
            <FiPageRight />
          </button>
        </div>
      </div>
      <div className="neon-duallistbox-actions" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 2, padding: 0 }}>
        <button
          className="neon-btn neon-btn-corner-down-right neon-btn-square"
          onClick={moveRight}
          disabled={highlightedLeft.length === 0}
          aria-label="Add selected"
          type="button"
          style={{ marginBottom: 1 }}
        >
          <FiCornerDownRight />
        </button>
        <button
          className="neon-btn neon-btn-corner-down-right neon-btn-square"
          onClick={moveLeft}
          disabled={highlightedRight.length === 0}
          aria-label="Remove selected"
          type="button"
        >
          <FiCornerDownLeft />
        </button>
      </div>
      <div className="neon-duallistbox-panel right" style={{ padding: 0 }}>
        <div className="neon-duallistbox-title" style={{ marginBottom: 1 }}>{titleRight}</div>
        <input
          className="neon-input"
          type="search"
          placeholder="Search..."
          value={searchRight}
          onChange={(e) => setSearchRight(e.target.value)}
          aria-label="Search selected"
          style={{ marginBottom: 1, background: '#2a3d4d', color: '#fff' }}
        />
        <ul className="neon-duallistbox-list" style={{ minHeight: 200, marginBottom: 2, padding: 0 }}>
          {pagedSelected.map((item) => (
            <li
              key={item.id}
              className={
                "neon-duallistbox-list-item" +
                (highlightedRight.includes(item.id) ? " selected" : "")
              }
              onClick={() =>
                setHighlightedRight((hl) =>
                  hl.includes(item.id)
                    ? hl.filter((id) => id !== item.id)
                    : [...hl, item.id],
                )
              }
              tabIndex={0}
              style={{ padding: "3px 5px", borderRadius: 2, marginBottom: 1 }}
            >
              {item.label}
            </li>
          ))}
        </ul>
        <div className="neon-duallistbox-pagination" style={{ marginBottom: 1 }}>
          <button
            className="neon-btn neon-btn-square"
            onClick={() => setPageRight((p) => Math.max(0, p - 1))}
            disabled={pageRight === 0}
            aria-label="Previous page"
            type="button"
          >
            <FiPageLeft />
          </button>
          <span>
            {pageRight + 1} / {totalPagesRight}
          </span>
          <button
            className="neon-btn neon-btn-square"
            onClick={() => setPageRight((p) => Math.min(totalPagesRight - 1, p + 1))}
            disabled={pageRight >= totalPagesRight - 1}
            aria-label="Next page"
            type="button"
          >
            <FiPageRight />
          </button>
        </div>
      </div>
    </div>
  );
}
