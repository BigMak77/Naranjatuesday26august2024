import React, { useState } from "react";
import NeonPanel from "@/components/NeonPanel";
import { FiChevronRight, FiChevronLeft, FiChevronLeft as FiPageLeft, FiChevronRight as FiPageRight, FiCornerDownRight, FiCornerDownLeft } from "react-icons/fi";

export interface NeonDualListboxProps {
  items: { id: string; label: string }[];
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
  items,
  selected,
  onChange,
  titleLeft = "Available",
  titleRight = "Selected",
}: NeonDualListboxProps) {
  const [highlightedLeft, setHighlightedLeft] = useState<string[]>([]);
  const [highlightedRight, setHighlightedRight] = useState<string[]>([]);
  const [searchLeft, setSearchLeft] = useState("");
  const [searchRight, setSearchRight] = useState("");
  const [pageLeft, setPageLeft] = useState(0);
  const [pageRight, setPageRight] = useState(0);

  const available = items.filter((i) => !selected.includes(i.id));
  const selectedItems = items.filter((i) => selected.includes(i.id));

  const filteredAvailable = available.filter((item) =>
    item.label.toLowerCase().includes(searchLeft.toLowerCase())
  );
  const filteredSelected = selectedItems.filter((item) =>
    item.label.toLowerCase().includes(searchRight.toLowerCase())
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
    <NeonPanel className="neon-duallistbox">
      <div className="neon-duallistbox-flex">
        <div className="neon-duallistbox-panel">
          <div className="neon-duallistbox-title">{titleLeft}</div>
          <input
            className="neon-input"
            type="search"
            placeholder="Search..."
            value={searchLeft}
            onChange={(e) => setSearchLeft(e.target.value)}
            aria-label="Search available"
          />
          <ul className="neon-duallistbox-list">
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
              >
                {item.label}
              </li>
            ))}
          </ul>
          <div className="neon-duallistbox-pagination">
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
        <div className="neon-duallistbox-actions">
          <button
            className="neon-btn neon-btn-corner-down-right neon-btn-square"
            onClick={moveRight}
            disabled={highlightedLeft.length === 0}
            aria-label="Add selected"
            type="button"
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
        <div className="neon-duallistbox-panel">
          <div className="neon-duallistbox-title">{titleRight}</div>
          <input
            className="neon-input"
            type="search"
            placeholder="Search..."
            value={searchRight}
            onChange={(e) => setSearchRight(e.target.value)}
            aria-label="Search selected"
          />
          <ul className="neon-duallistbox-list">
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
              >
                {item.label}
              </li>
            ))}
          </ul>
          <div className="neon-duallistbox-pagination">
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
    </NeonPanel>
  );
}
