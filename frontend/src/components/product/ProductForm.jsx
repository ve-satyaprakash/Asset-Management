import { useState, useEffect, useRef } from 'react';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { getAllManufacturers } from '../../services/manufacturerService';
import { createProduct, updateProduct, uploadProductImage, deleteProductImage } from '../../services/productService';
import ProductTypeTreeSelect from '../common/ProductTypeTreeSelect';

const EMPTY = {
  name: '', productTypeId: '', manufacturerId: '',
  partNo: '', cost: '', description: '',
};

const IMG_BASE = 'http://localhost:5000/uploads/products/';

export default function ProductForm({ record, onSuccess, onCancel }) {
  const [form,          setForm]          = useState(EMPTY);
  const [mfList,        setMfList]        = useState([]);
  const [errors,        setErrors]        = useState({});
  const [saving,        setSaving]        = useState(false);
  // images already saved on the server (edit mode)
  const [savedImages,   setSavedImages]   = useState([]);
  // new files selected locally (not yet uploaded)
  const [pendingFiles,  setPendingFiles]  = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    getAllManufacturers().then(setMfList);
  }, []);

  useEffect(() => {
    if (record) {
      setForm({
        name:           record.name           ?? '',
        productTypeId:  record.productTypeId  ?? '',
        manufacturerId: record.manufacturerId ?? '',
        partNo:         record.partNo         ?? '',
        cost:           record.cost           ?? '',
        description:    record.description    ?? '',
      });
      setSavedImages(Array.isArray(record.images) ? record.images : []);
    } else {
      setForm(EMPTY);
      setSavedImages([]);
    }
    setPendingFiles([]);
    setErrors({});
  }, [record]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: '' }));
  }

  function handleFileSelect(e) {
    const files = Array.from(e.target.files || []);
    setPendingFiles((prev) => [...prev, ...files]);
    e.target.value = '';
  }

  function removePending(idx) {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function removeSaved(filename) {
    if (!record?.id) return;
    try {
      const updated = await deleteProductImage(record.id, filename);
      setSavedImages(Array.isArray(updated.images) ? updated.images : []);
    } catch {
      // silent — image stays in list if delete fails
    }
  }

  function validate() {
    const e = {};
    if (!form.name.trim())   e.name          = 'Required';
    if (!form.productTypeId) e.productTypeId = 'Required';
    return e;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      const payload = {
        name:           form.name.trim(),
        productTypeId:  form.productTypeId,
        manufacturerId: form.manufacturerId || null,
        partNo:         form.partNo.trim()      || null,
        cost:           form.cost !== '' ? form.cost : null,
        description:    form.description.trim() || null,
      };

      let saved;
      if (record?.id) {
        saved = await updateProduct(record.id, payload);
      } else {
        saved = await createProduct(payload);
      }

      // Upload any pending images
      for (const file of pendingFiles) {
        await uploadProductImage(saved.id, file);
      }

      onSuccess();
    } catch (err) {
      setErrors({ submit: err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Save failed.' });
    } finally {
      setSaving(false);
    }
  }

  const cls = (f) =>
    `w-full px-3 py-2 text-sm rounded-lg border ${
      errors[f] ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:ring-brand-500'
    } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 transition`;

  const lbl = (txt, req) => (
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
      {req && <span className="text-red-500 mr-0.5">*</span>}{txt}
    </label>
  );

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="px-6 pt-5 pb-4 space-y-4">

        {errors.submit && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-400">
            {errors.submit}
          </div>
        )}

        {/* Row 1: Name | Product Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            {lbl('Name', true)}
            <input name="name" value={form.name} onChange={handleChange}
              className={cls('name')} placeholder="e.g. iPhone 17 Pro" />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>
          <div>
            {lbl('Product Type', true)}
            <ProductTypeTreeSelect
              value={form.productTypeId}
              onChange={(id) => {
                setForm((p) => ({ ...p, productTypeId: id }));
                setErrors((p) => ({ ...p, productTypeId: '' }));
              }}
              hasError={!!errors.productTypeId}
              placeholder="Select Product Type"
            />
            {errors.productTypeId && <p className="mt-1 text-xs text-red-500">{errors.productTypeId}</p>}
          </div>
        </div>

        {/* Row 2: Manufacturer | Part No */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            {lbl('Manufacturer')}
            <select name="manufacturerId" value={form.manufacturerId} onChange={handleChange} className={cls('manufacturerId')}>
              <option value="">Select Manufacturer</option>
              {mfList.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            {lbl('Part No')}
            <input name="partNo" value={form.partNo} onChange={handleChange}
              className={cls('partNo')} placeholder="e.g. 00000-11" />
          </div>
        </div>

        {/* Row 3: Cost ($) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            {lbl('Cost ($)')}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
              <input
                type="number" name="cost" value={form.cost} onChange={handleChange}
                className={`${cls('cost')} pl-7`}
                placeholder="0.00" min="0" step="0.01"
              />
            </div>
          </div>
        </div>

        {/* Row 4: Description — full width */}
        <div>
          {lbl('Description')}
          <textarea name="description" value={form.description} onChange={handleChange}
            rows={4} className={`${cls('description')} resize-none`}
            placeholder="Enter product description" />
        </div>

        {/* Row 5: Images */}
        <div>
          {lbl('Images')}
          <div className="flex flex-wrap gap-3">
            {/* Existing saved images */}
            {savedImages.map((filename) => (
              <div key={filename} className="relative w-20 h-20 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden group">
                <img
                  src={`${IMG_BASE}${filename}`}
                  alt={filename}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeSaved(filename)}
                  className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove"
                >
                  <X size={10} />
                </button>
              </div>
            ))}

            {/* Pending (not yet uploaded) images */}
            {pendingFiles.map((file, idx) => (
              <div key={idx} className="relative w-20 h-20 rounded-lg border-2 border-dashed border-brand-300 dark:border-brand-600 overflow-hidden group">
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePending(idx)}
                  className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove"
                >
                  <X size={10} />
                </button>
              </div>
            ))}

            {/* Add Image button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-1 text-gray-400 dark:text-gray-500 hover:border-brand-400 hover:text-brand-500 transition-colors cursor-pointer"
            >
              <ImagePlus size={20} />
              <span className="text-xs">Add Image</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
          <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">JPEG, PNG, GIF or WebP · Max 5 MB each</p>
        </div>

      </div>

      {/* Footer */}
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
          {saving && <Loader2 size={14} className="animate-spin" />}
          Save
        </button>
      </div>
    </form>
  );
}
