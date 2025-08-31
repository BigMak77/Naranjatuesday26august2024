import React from "react";

export interface MultiselectCheckboxesProps {
  options: Array<{ [key: string]: any }>;
  selected: string[];
  onChange: (selected: string[]) => void;
  labelKey: string;
  valueKey: string;
  className?: string;
}

export default function MultiselectCheckboxes({
  options,
  selected,
  onChange,
  labelKey,
  valueKey,
  className = "",
}: MultiselectCheckboxesProps) {
  const handleChange = (value: string, checked: boolean) => {
    if (checked) {
      onChange([...selected, value]);
    } else {
      onChange(selected.filter((v) => v !== value));
    }
  };

  return (
    <div className={`multiselect-checkboxes ${className}`.trim()}>
      {options.map((opt) => (
        <label key={opt[valueKey]} className="multiselect-checkbox-label">
          <input
            type="checkbox"
            value={opt[valueKey]}
            checked={selected.includes(opt[valueKey])}
            onChange={(e) => handleChange(opt[valueKey], e.target.checked)}
          />
          <span>{opt[labelKey]}</span>
        </label>
      ))}
    </div>
  );
}
