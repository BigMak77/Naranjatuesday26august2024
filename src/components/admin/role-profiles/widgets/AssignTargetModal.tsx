import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";

// type: 'department' | 'role' | 'user'
export default function AssignTargetModal({ type, onClose, onSelect }: {
  type: 'department' | 'role' | 'user',
  onClose: () => void,
  onSelect: (item: { id: string, label: string }) => void
}) {
  const [items, setItems] = useState<{ id: string; label: string }[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    let query;
    if (type === "department") {
      query = supabase.from("departments").select("id, name");
    } else if (type === "role") {
      query = supabase.from("roles").select("id, title");
    } else {
      query = supabase.from("users").select("auth_id, first_name, last_name");
    }
    query
      .then(({ data, error }) => {
        if (error) {
          setError(error.message);
          setItems([]);
        } else if (data) {
          if (type === "department") {
            setItems(data.map((d: any) => ({ id: d.id, label: d.name })));
          } else if (type === "role") {
            setItems(data.map((r: any) => ({ id: r.id, label: r.title })));
          } else {
            setItems(data.map((u: any) => ({ id: u.auth_id, label: `${u.first_name} ${u.last_name}`.trim() })));
          }
        }
        setLoading(false);
      });
  }, [type]);

  const filtered = items.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="neon-modal-overlay">
      <div className="neon-modal">
        <div className="neon-modal-header">
          <span className="neon-modal-title">
            Select a {type.charAt(0).toUpperCase() + type.slice(1)}
          </span>
          <button className="neon-btn neon-btn-close" onClick={onClose}>&times;</button>
        </div>
        <div className="neon-modal-content">
          <input
            className="neon-input w-full mb-3"
            placeholder={`Search ${type}s...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : error ? (
            <div className="neon-message neon-message-error mb-2">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-4">No {type}s found.</div>
          ) : (
            <ul className="neon-list-select">
              {filtered.map(item => (
                <li key={item.id}>
                  <button
                    className="neon-btn neon-btn-list w-full text-left"
                    onClick={() => onSelect(item)}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
