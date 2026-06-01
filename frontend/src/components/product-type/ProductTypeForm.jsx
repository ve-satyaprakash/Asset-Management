import { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { getAllProductTypes, createProductType, updateProductType } from '../../services/productTypeService';

const ASSET_TYPES      = ['Asset', 'Consumable', 'Component'];
const ASSET_CATEGORIES = ['IT', 'Non IT'];
const CATEGORIES       = ['Hardware', 'Software', 'Network', 'Peripheral', 'Furniture', 'Vehicle', 'Other'];

function toApiName(displayName) {
  return (
    'custom_asset_' +
    displayName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '')
  );
}

function toApiPluralName(apiName) {
  return apiName ? apiName + 's' : '';
}

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
  const isSelected  = selectedId === String(node.id);

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

// ── Parent dropdown with inline tree ─────────────────────────────────────
function ParentTreeDropdown({ value, displayLabel, treeRoots, onSelect, hasError }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  function handleSelect(id, label) {
    onSelect(id, label);
    setOpen(false);
  }

  function handleClear(e) {
    e.stopPropagation();
    onSelect('', '');
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full px-3 py-2 text-sm text-left rounded-lg border flex items-center justify-between gap-2 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 transition
          ${hasError
            ? 'border-red-400 focus:ring-red-400'
            : open
              ? 'border-brand-500 ring-2 ring-brand-500/30'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
          }`}
      >
        <span className={value ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}>
          {displayLabel || '-- Select Parent --'}
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

      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl z-50 overflow-y-auto"
          style={{ maxHeight: '260px' }}
        >
          <div
            onClick={() => handleSelect('', '')}
            className={`px-4 py-2 text-sm cursor-pointer border-b border-gray-100 dark:border-gray-700 transition-colors
              ${!value ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 font-medium' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 italic'}`}
          >
            — No parent (root level) —
          </div>

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

// ── Main form ─────────────────────────────────────────────────────────────
const EMPTY = {
  displayName: '', displayPluralName: '',
  apiName: '', apiPluralName: '',
  category: '', assetType: '', assetCategory: '',
  description: '', parentId: '', parentLabel: '',
};

export default function ProductTypeForm({ record, editingId, onSuccess, onCancel }) {
  const [form,           setForm]           = useState(EMPTY);
  const [treeRoots,      setTreeRoots]      = useState([]);
  const [errors,         setErrors]         = useState({});
  const [saving,         setSaving]         = useState(false);
  const [apiNameTouched,       setApiNameTouched]       = useState(false);
  const [apiPluralNameTouched, setApiPluralNameTouched] = useState(false);

  useEffect(() => {
    getAllProductTypes().then((data) => {
      setTreeRoots(buildTree(data, editingId));
      if (record?.parentId != null) {
        const found = data.find((d) => d.id === record.parentId);
        if (found) setForm((prev) => ({ ...prev, parentLabel: found.displayName }));
      }
    });
  }, [editingId, record?.parentId]);

  useEffect(() => {
    if (record) {
      setForm({
        displayName:       record.displayName       || '',
        displayPluralName: record.displayPluralName || '',
        apiName:           record.apiName           || '',
        apiPluralName:     record.apiPluralName     || '',
        category:          record.category          || '',
        assetType:         record.assetType         || '',
        assetCategory:     record.assetCategory     || '',
        description:       record.description       || '',
        parentId:          record.parentId != null ? String(record.parentId) : '',
        parentLabel:       '',
      });
      setApiNameTouched(true);
      setApiPluralNameTouched(true);
    } else {
      setForm(EMPTY);
      setApiNameTouched(false);
      setApiPluralNameTouched(false);
    }
    setErrors({});
  }, [record]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'displayName' && !apiNameTouched) {
        next.apiName = toApiName(value);
        if (!apiPluralNameTouched) next.apiPluralName = toApiPluralName(next.apiName);
      }
      if (name === 'displayName' && !prev.displayPluralName) {
        next.displayPluralName = value.trim() ? value.trim() + 's' : '';
      }
      if (name === 'apiName' && !apiPluralNameTouched) {
        next.apiPluralName = toApiPluralName(value);
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function handleParentSelect(id, label) {
    setForm((prev) => ({ ...prev, parentId: id, parentLabel: label }));
  }

  function validate() {
    const e = {};
    if (!form.displayName.trim())                              e.displayName       = 'Required';
    if (!form.displayPluralName.trim())                        e.displayPluralName = 'Required';
    if (!form.apiName.trim())                                  e.apiName           = 'Required';
    if (!/^[a-zA-Z0-9_-]+$/.test(form.apiName.trim()))        e.apiName           = 'Only letters, numbers, hyphens, underscores';
    if (!form.apiPluralName.trim())                            e.apiPluralName     = 'Required';
    if (!/^[a-zA-Z0-9_-]+$/.test(form.apiPluralName.trim()))  e.apiPluralName     = 'Only letters, numbers, hyphens, underscores';
    if (!form.category)                                        e.category          = 'Required';
    if (!form.assetType)                                       e.assetType         = 'Required';
    if (!form.assetCategory)                                   e.assetCategory     = 'Required';
    return e;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      const payload = {
        displayName:       form.displayName.trim(),
        displayPluralName: form.displayPluralName.trim(),
        apiName:           form.apiName.trim(),
        apiPluralName:     form.apiPluralName.trim(),
        category:          form.category,
        assetType:         form.assetType,
        assetCategory:     form.assetCategory,
        description:       form.description.trim() || null,
        parentId:          form.parentId ? parseInt(form.parentId, 10) : null,
      };
      if (editingId) await updateProductType(editingId, payload);
      else           await createProductType(payload);
      onSuccess();
    } catch (err) {
      setErrors({ submit: err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Something went wrong.' });
    } finally {
      setSaving(false);
    }
  }

  const cls = (f) =>
    `w-full px-3 py-2 text-sm rounded-lg border ${
      errors[f]
        ? 'border-red-400 focus:ring-red-400'
        : 'border-gray-300 dark:border-gray-600 focus:ring-brand-500'
    } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 transition`;

  const lbl = (txt, req) => (
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
      {req && <span className="text-red-500 mr-0.5">*</span>}{txt}
    </label>
  );

  return (
    <form onSubmit={handleSubmit} noValidate>

      <div className="px-6 pt-5 pb-4">

        {errors.submit && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-400">
            {errors.submit}
          </div>
        )}

        {/* Row 1: Display Name | API Name */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            {lbl('Display Name', true)}
            <input name="displayName" value={form.displayName} onChange={handleChange}
              className={cls('displayName')} placeholder="e.g. Smart Phone" />
            {errors.displayName && <p className="mt-1 text-xs text-red-500">{errors.displayName}</p>}
          </div>
          <div>
            {lbl('API Name', true)}
            <input
              name="apiName" value={form.apiName}
              onChange={(e) => { setApiNameTouched(true); handleChange(e); }}
              className={cls('apiName')} placeholder="e.g. custom_asset_smart-phone"
            />
            {errors.apiName
              ? <p className="mt-1 text-xs text-red-500">{errors.apiName}</p>
              : <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Auto-filled from Display Name</p>
            }
          </div>
        </div>

        {/* Row 2: Display Plural Name | API Plural Name */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            {lbl('Display Plural Name', true)}
            <input name="displayPluralName" value={form.displayPluralName} onChange={handleChange}
              className={cls('displayPluralName')} placeholder="e.g. Smart Phones" />
            {errors.displayPluralName && <p className="mt-1 text-xs text-red-500">{errors.displayPluralName}</p>}
          </div>
          <div>
            {lbl('API Plural Name', true)}
            <input
              name="apiPluralName" value={form.apiPluralName}
              onChange={(e) => { setApiPluralNameTouched(true); handleChange(e); }}
              className={cls('apiPluralName')} placeholder="e.g. custom_asset_smart-phones"
            />
            {errors.apiPluralName
              ? <p className="mt-1 text-xs text-red-500">{errors.apiPluralName}</p>
              : <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Auto-filled from API Name</p>
            }
          </div>
        </div>

        {/* Row 3: Category | Parent Product Type */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            {lbl('Category', true)}
            <select name="category" value={form.category} onChange={handleChange} className={cls('category')}>
              <option value="">-- Select Category --</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
          </div>
          <div>
            {lbl('Parent Product Type')}
            <ParentTreeDropdown
              value={form.parentId}
              displayLabel={form.parentLabel}
              treeRoots={treeRoots}
              onSelect={handleParentSelect}
              hasError={false}
            />
          </div>
        </div>

        {/* Row 4: Asset Type | Description */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            {lbl('Asset Type', true)}
            <select name="assetType" value={form.assetType} onChange={handleChange} className={cls('assetType')}>
              <option value="">-- Select Asset Type --</option>
              {ASSET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            {errors.assetType && <p className="mt-1 text-xs text-red-500">{errors.assetType}</p>}
          </div>
          <div>
            {lbl('Description')}
            <textarea name="description" value={form.description} onChange={handleChange}
              rows={3} className={`${cls('description')} resize-none`}
              placeholder="Optional description…" />
          </div>
        </div>

        {/* Row 5: Asset Category Type | (empty) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            {lbl('Asset Category Type', true)}
            <select name="assetCategory" value={form.assetCategory} onChange={handleChange} className={cls('assetCategory')}>
              <option value="">-- Select Asset Category --</option>
              {ASSET_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.assetCategory && <p className="mt-1 text-xs text-red-500">{errors.assetCategory}</p>}
          </div>
          <div />
        </div>

      </div>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <div className="flex justify-center gap-4 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button" onClick={onCancel} disabled={saving}
          className="px-8 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition"
        >
          Close
        </button>
        <button
          type="submit" disabled={saving}
          className="px-8 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg disabled:opacity-50 flex items-center gap-2 transition"
        >
          {saving && (
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          )}
          Save
        </button>
      </div>
    </form>
  );
}
