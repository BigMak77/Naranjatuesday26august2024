import React, { useState } from 'react'
import NeonPanel from '@/components/NeonPanel'
import { FiChevronRight, FiChevronLeft } from 'react-icons/fi'
import styles from '@/app/NeonDualListbox.module.css'

export interface NeonDualListboxProps {
  items: { id: string; label: string }[]
  selected: string[]
  onChange: (selected: string[]) => void
  titleLeft?: string
  titleRight?: string
}

export function getSelectedModuleObjects(items: { id: string; label: string }[], selected: string[]) {
  return items.filter((item) => selected.includes(item.id));
}

export default function NeonDualListbox({
  items,
  selected,
  onChange,
  titleLeft = 'Available',
  titleRight = 'Selected',
}: NeonDualListboxProps) {
  const [highlightedLeft, setHighlightedLeft] = useState<string[]>([])
  const [highlightedRight, setHighlightedRight] = useState<string[]>([])

  const available = items.filter((i) => !selected.includes(i.id))
  const selectedItems = items.filter((i) => selected.includes(i.id))

  const moveRight = () => {
    onChange([...selected, ...highlightedLeft])
    setHighlightedLeft([])
  }
  const moveLeft = () => {
    onChange(selected.filter((id) => !highlightedRight.includes(id)))
    setHighlightedRight([])
  }

  return (
    <NeonPanel className={`neon-panel neon-dual-listbox ${styles['neon-dual-listbox']}`}>
      <div className={styles['neon-dual-listbox-container']}>
        <div className={styles['neon-dual-listbox-panel']}>
          <div className={styles['neon-dual-listbox-title']}>{titleLeft}</div>
          <ul className={styles['neon-listbox']}>
            {available.map((item) => (
              <li
                key={item.id}
                className={
                  `${styles['neon-listbox-item']}${highlightedLeft.includes(item.id) ? ' ' + styles['neon-listbox-item-selected'] : ''}`
                }
                onClick={() =>
                  setHighlightedLeft((hl) =>
                    hl.includes(item.id)
                      ? hl.filter((id) => id !== item.id)
                      : [...hl, item.id]
                  )
                }
                tabIndex={0}
              >
                {item.label}
              </li>
            ))}
          </ul>
        </div>
        <div className={styles['neon-dual-listbox-actions']}>
          <button
            className="neon-btn neon-btn-edit"
            onClick={moveRight}
            disabled={highlightedLeft.length === 0}
            aria-label="Add selected"
            type="button"
          >
            <FiChevronRight />
          </button>
          <button
            className="neon-btn neon-btn-danger"
            onClick={moveLeft}
            disabled={highlightedRight.length === 0}
            aria-label="Remove selected"
            type="button"
          >
            <FiChevronLeft />
          </button>
        </div>
        <div className={styles['neon-dual-listbox-panel']}>
          <div className={styles['neon-dual-listbox-title']}>{titleRight}</div>
          <ul className={styles['neon-listbox']}>
            {selectedItems.map((item) => (
              <li
                key={item.id}
                className={
                  `${styles['neon-listbox-item']}${highlightedRight.includes(item.id) ? ' ' + styles['neon-listbox-item-selected'] : ''}`
                }
                onClick={() =>
                  setHighlightedRight((hl) =>
                    hl.includes(item.id)
                      ? hl.filter((id) => id !== item.id)
                      : [...hl, item.id]
                  )
                }
                tabIndex={0}
              >
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </NeonPanel>
  )
}
