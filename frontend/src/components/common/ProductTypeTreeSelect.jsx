/**
 * Reusable hierarchical Product Type picker.
 * Renders a button that looks like a native select; clicking opens a floating
 * tree panel where the user can expand/collapse nodes and pick one.
 *
 * Props:
 *   value        — currently selected id (string or number), '' = nothing
 *   onChange     — (id: string, displayName: string) => void
 *   excludeId    — id to omit from the tree (used when editing a product type)
 *   hasError     — boolean, applies red ring
 *   placeholder  — string shown when nothing is selected
 */

import { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { getAllProductTypes } from '../../services/productTypeService';

// ── Build nested tree from flat list ──────────────────────────────────────
function buildTree(items, excludeId) {
  const map = {};
  items.forEach((item) => { map[item.id] = { ...item, children: [] }; });
  const roots = [];
  items.forEach((item) => {
    if (excludeId && item.id === excludeId) return;
    const node = map[item.id];
    if (!node) return;
    if (item.parentId == null) {
      roots.push(node);
    } else if (map[item.parentId]) {
      map[item.parentId].children.push(node);
    }
  });
  return roots;
}

// ── Single tree node ───────────────────────────────────────────────────────
function TreeNode({ node, selectedId, onSelect, level }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children?.length > 0;
  const isSelected  = String(selectedId) === String(node.id);

  return (
    <div>
      <div
        title={node.displayName}
        onClick={() => onSelect(String(node.id), node.displayName)}
        className={`flex items-center gap-1 py-1.5 pr-3 rounded cursor-pointer select-none text-sm transition-colors
          ${isSelected
            ? 'bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 font-medium'
            : 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        style={{ paddingLeft: `${8 + level * 18}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
            className="shrink-0 text-gray-500"
          >
            <ChevronRight
              size={13}
              className={`transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`}
            />
          </button>
        ) : (
          <span className="w-[18px] shrink-0" />
        )}
        <span className="truncate">{node.displayName}</span>
      </div>

      {expanded && hasChildren && node.children.map((child) => (
        <TreeNode
          key={child.id}
          node={child}
          selectedId={selectedId}
          onSelect={onSelect}
          level={level + 1}
        />
      ))}
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────
export default function ProductTypeTreeSelect({
  value,
  onChange,
  excludeId   = null,
  hasError    = false,
  placeholder = '-- Select Product Type --',
}) {
  const [open,       setOpen]       = useState(false);
  const [treeRoots,  setTreeRoots]  = useState([]);
  const [label,      setLabel]      = useState('');
  const ref = useRef(null);

  // Load and build tree once
  useEffect(() => {
    getAllProductTypes().then((data) => {
      setTreeRoots(buildTree(data, excludeId));
      // Resolve initial label
      if (value) {
        const found = data.find((d) => String(d.id) === String(value));
        if (found) setLabel(found.displayName);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [excludeId]);

  // Keep label in sync when value is set externally (e.g. edit mode)
  useEffect(() => {
    if (!value) { setLabel(''); return; }
    getAllProductTypes().then((data) => {
      const found = data.find((d) => String(d.id) === String(value));
      if (found) setLabel(found.displayName);
    });
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  function handleSelect(id, name) {
    setLabel(name);
    onChange(id, name);
    setOpen(false);
  }

  function handleClear(e) {
    e.stopPropagation();
    setLabel('');
    onChange('', '');
  }

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full px-3 py-2 text-sm text-left rounded-lg border flex items-center justify-between gap-2
          bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 transition
          ${hasError
            ? 'border-red-400 focus:ring-red-400'
            : open
              ? 'border-brand-500 ring-2 ring-brand-500/30'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
          }`}
      >
        <span className={label ? 'text-gray-900 dark:text-gray-100 truncate' : 'text-gray-400 dark:text-gray-500'}>
          {label || placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {value && (
            <span
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs px-1"
              title="Clear"
            >
              ✕
            </span>
          )}
          <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Floating tree panel */}
      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl z-50 overflow-y-auto"
          style={{ maxHeight: '280px' }}
        >
          {treeRoots.length === 0 ? (
            <p className="text-xs text-gray-400 px-4 py-3 italic">No product types available.</p>
          ) : (
            <div className="p-1.5">
              {treeRoots.map((root) => (
                <TreeNode
                  key={root.id}
                  node={root}
                  selectedId={value}
                  onSelect={handleSelect}
                  level={0}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
