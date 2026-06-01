import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast, ToastContainer } from '../components/common/Toast';
import { createAsset, updateAsset, getAsset } from '../services/assetService';
import { getAllProductTypes } from '../services/productTypeService';
import { getAllVendors } from '../services/vendorService';
import { getAllAssetStates } from '../services/assetStateService';

const USERS        = ['nitin agarwal', 'praveen ranjan', 'rahul sharma', 'priya patel'];
const DEPARTMENTS  = ['IT', 'HR', 'Finance', 'Operations', 'Administration', 'Marketing', 'Sales'];
const SITES        = ['noida', 'NSEZ', 'nsez', 'delhi', 'mumbai'];
const DOMAINS      = ['WORKGROUP', 'domain.local', 'company.com'];
const DHCP_OPTIONS = ['Yes', 'No'];
const NET_TYPES    = ['LAN', 'WAN', 'WiFi', 'VPN'];

const PROC_TMPL = { processorInfo: '', manufacturer: '', clockSpeed: 0, numberOfCores: 0 };
const DISK_TMPL = { model: '', serialNumber: '', manufacturer: '', capacity: 0 };
const MON_TMPL  = { monitorType: '', serialNumber: '', manufacturer: '', maxResolution: '' };
const NET_TMPL  = { ipAddress: '', macAddress: '', nic: '', dnsServer: '', defaultGateway: '', dhcpEnabled: '', dhcpServer: '', dnsHostname: '', type: '' };

const EMPTY = {
  productTypeId: '', name: '', assetTag: '', orgSerialNumber: '',
  vendor: '', barcode: '', assetState: '', user: '', department: '',
  associatedToAssets: '', site: '', location: '',
  acquisitionDate: '', expiryDate: '', purchaseCost: '',
  warrantyExpiryDate: '', stateComments: '',
  description: '', partNumber: '', product: '', manufacturer: '',
  region: '', isLoanable: false, purchaseOrder: '', purchaseOrderNo: '',
  macAddress: '', serviceTag: '', domain: '', smbiosVersion: '',
  biosVersion: '', biosManufacturer: '', biosDate: '',
  osName: '', osVersion: '', osBuildNumber: '', osServicePack: '', osProductId: '',
  ram: '', virtualMemory: '', physicalMemory: '',
  processors: [],
  hardDisks: [],
  keyboardType: '', keyboardManufacturer: '', keyboardSerialNumber: '',
  mouseType: '', mouseSerialNumber: '', mouseManufacturer: '', mouseButtons: '',
  monitors: [],
  networks: [],
};

function fmt(date) {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
}

const ic = (err) =>
  `w-full px-3 py-2 text-sm rounded border ${
    err ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:ring-brand-500'
  } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 transition`;

const icSm = () =>
  'w-full px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-500 transition';

function Field({ label, req, error, children }) {
  return (
    <div>
      <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
        {label}{req && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function SectionTitle({ title }) {
  return <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-5">{title}</h3>;
}

function RowBtn({ color, children, onClick }) {
  const base = 'w-6 h-6 text-white rounded flex items-center justify-center text-base font-bold leading-none shrink-0 transition';
  const cls = color === 'red'
    ? `${base} bg-red-500 hover:bg-red-600`
    : `${base} bg-green-500 hover:bg-green-600`;
  return <button type="button" onClick={onClick} className={cls}>{children}</button>;
}

export default function AssetFormPage() {
  const navigate       = useNavigate();
  const { id }         = useParams();
  const [searchParams] = useSearchParams();
  const defaultPtId    = searchParams.get('asset-product-type-id') || '';
  const isEdit         = Boolean(id);

  const [form,       setForm]      = useState({ ...EMPTY, productTypeId: defaultPtId });
  const [ptList,     setPtList]    = useState([]);
  const [vendorList, setVendorList]= useState([]);
  const [stateList,  setStateList] = useState([]);
  const [errors,     setErrors]    = useState({});
  const [savingMode, setSavingMode]= useState(null);
  const [loading,    setLoading]   = useState(isEdit);
  const { toasts, showToast, removeToast } = useToast();
  const savingRef = useRef(false);

  useEffect(() => {
    Promise.all([getAllProductTypes(), getAllVendors(), getAllAssetStates()])
      .then(([pts, vendors, states]) => {
        setPtList(pts); setVendorList(vendors); setStateList(states);
      });
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    getAsset(id)
      .then((rec) => setForm({
        productTypeId:        rec.productTypeId        ?? '',
        name:                 rec.name                 ?? '',
        assetTag:             rec.assetTag             ?? '',
        orgSerialNumber:      rec.orgSerialNumber       ?? '',
        description:          rec.description           ?? '',
        partNumber:           rec.partNumber            ?? '',
        product:              rec.product               ?? '',
        vendor:               rec.vendor                ?? '',
        barcode:              rec.barcode               ?? '',
        manufacturer:         rec.manufacturer          ?? '',
        assetState:           rec.assetState            ?? '',
        user:                 rec.user                  ?? '',
        department:           rec.department            ?? '',
        associatedToAssets:   rec.associatedToAssets    ?? '',
        site:                 rec.site                  ?? '',
        region:               rec.region                ?? '',
        location:             rec.location              ?? '',
        isLoanable:           rec.isLoanable            ?? false,
        acquisitionDate:      fmt(rec.acquisitionDate),
        expiryDate:           fmt(rec.expiryDate),
        purchaseCost:         rec.purchaseCost          ?? '',
        warrantyExpiryDate:   fmt(rec.warrantyExpiryDate),
        purchaseOrder:        rec.purchaseOrder         ?? '',
        purchaseOrderNo:      rec.purchaseOrderNo       ?? '',
        stateComments:        rec.stateComments         ?? '',
        macAddress:           rec.macAddress            ?? '',
        serviceTag:           rec.serviceTag            ?? '',
        domain:               rec.domain                ?? '',
        smbiosVersion:        rec.smbiosVersion         ?? '',
        biosVersion:          rec.biosVersion           ?? '',
        biosManufacturer:     rec.biosManufacturer      ?? '',
        biosDate:             rec.biosDate              ?? '',
        osName:               rec.osName                ?? '',
        osVersion:            rec.osVersion             ?? '',
        osBuildNumber:        rec.osBuildNumber         ?? '',
        osServicePack:        rec.osServicePack         ?? '',
        osProductId:          rec.osProductId           ?? '',
        ram:                  rec.ram                   ?? '',
        virtualMemory:        rec.virtualMemory         ?? '',
        physicalMemory:       rec.physicalMemory        ?? '',
        processors:           rec.processors            ?? [],
        hardDisks:            rec.hardDisks             ?? [],
        keyboardType:         rec.keyboardType          ?? '',
        keyboardManufacturer: rec.keyboardManufacturer  ?? '',
        keyboardSerialNumber: rec.keyboardSerialNumber  ?? '',
        mouseType:            rec.mouseType             ?? '',
        mouseSerialNumber:    rec.mouseSerialNumber     ?? '',
        mouseManufacturer:    rec.mouseManufacturer     ?? '',
        mouseButtons:         rec.mouseButtons          ?? '',
        monitors:             rec.monitors              ?? [],
        networks:             rec.networks              ?? [],
      }))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const isWorkstation = useMemo(() => {
    if (!ptList.length || !form.productTypeId) return false;
    const pt = ptList.find((p) => p.id === parseInt(form.productTypeId, 10));
    return pt?.displayName?.toLowerCase() === 'workstation';
  }, [ptList, form.productTypeId]);

  useEffect(() => {
    if (!isWorkstation || isEdit) return;
    setForm((prev) => ({
      ...prev,
      processors: prev.processors.length ? prev.processors : [{ ...PROC_TMPL }],
      hardDisks:  prev.hardDisks.length  ? prev.hardDisks  : [{ ...DISK_TMPL }],
      monitors:   prev.monitors.length   ? prev.monitors   : [{ ...MON_TMPL  }],
      networks:   prev.networks.length   ? prev.networks   : [{ ...NET_TMPL  }],
    }));
  }, [isWorkstation, isEdit]);

  function ch(e) {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    setErrors((p) => ({ ...p, [name]: '' }));
  }

  function addRow(field, tmpl) {
    setForm((prev) => ({ ...prev, [field]: [...prev[field], { ...tmpl }] }));
  }
  function removeRow(field, idx) {
    setForm((prev) => ({ ...prev, [field]: prev[field].filter((_, i) => i !== idx) }));
  }
  function updateRow(field, idx, key, value) {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].map((row, i) => (i === idx ? { ...row, [key]: value } : row)),
    }));
  }

  function validate() {
    const e = {};
    if (!form.name.trim())   e.name          = 'Required';
    if (!form.productTypeId) e.productTypeId = 'Required';
    return e;
  }

  function buildPayload() {
    return {
      ...form,
      productTypeId:      form.productTypeId ? parseInt(form.productTypeId, 10) : undefined,
      purchaseCost:       form.purchaseCost !== '' ? parseFloat(form.purchaseCost) : null,
      acquisitionDate:    form.acquisitionDate    || null,
      expiryDate:         form.expiryDate         || null,
      warrantyExpiryDate: form.warrantyExpiryDate || null,
    };
  }

  async function handleSave(continueEdit = false) {
    if (savingRef.current) return;
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    savingRef.current = true;
    setSavingMode(continueEdit ? 'continue' : 'save');
    try {
      const payload = buildPayload();
      if (isEdit) {
        await updateAsset(id, payload);
        showToast('Asset updated successfully!', 'success');
        if (!continueEdit) setTimeout(() => navigate(-1), 1000);
      } else {
        const created = await createAsset(payload);
        showToast('Asset created successfully!', 'success');
        if (continueEdit) {
          setTimeout(() => navigate(`/assets/edit/${created.id}`, { replace: true }), 1000);
        } else {
          const ptId = created.productTypeId || form.productTypeId;
          const dest = ptId ? `/assets/list?asset-product-type-id=${ptId}` : '/assets/list';
          setTimeout(() => navigate(dest, { replace: true }), 1000);
        }
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Save failed.';
      showToast(msg, 'error');
      setErrors({ submit: msg });
    } finally {
      savingRef.current = false;
      setSavingMode(null);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-brand-500" /></div>;
  }

  const divider = <div className="border-t border-gray-100 dark:border-gray-700" />;

  return (
    <div className="flex flex-col h-full overflow-auto bg-gray-50 dark:bg-gray-950">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="px-6 pt-4 pb-3">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 transition">
          <ArrowLeft size={14} /> Back To List
        </button>
      </div>

      <div className="px-6 pb-10">
        {errors.submit && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {errors.submit}
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">

          {/* ── Name | Asset Product ─────────────────────────────── */}
          <div className="grid grid-cols-2 gap-6 p-6">
            <Field label="Name" req error={errors.name}>
              <input name="name" value={form.name} onChange={ch}
                className={ic(errors.name)} placeholder="Enter asset name" />
            </Field>
            <Field label="Asset Product" req error={errors.productTypeId}>
              <select name="productTypeId" value={form.productTypeId} onChange={ch}
                className={ic(errors.productTypeId)}>
                <option value="">Select asset product</option>
                {ptList.map((pt) => <option key={pt.id} value={pt.id}>{pt.displayName}</option>)}
              </select>
            </Field>
          </div>

          {divider}

          {/* ── Asset Details ────────────────────────────────────── */}
          <div className="p-6">
            <SectionTitle title="Asset Details" />
            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
              <Field label="Serial Number">
                <input name="orgSerialNumber" value={form.orgSerialNumber} onChange={ch}
                  className={ic()} placeholder="enter serial number" />
              </Field>
              <Field label="Asset Tag">
                <input name="assetTag" value={form.assetTag} onChange={ch}
                  className={ic()} placeholder="enter asset tag" />
              </Field>
              <Field label="Vendor">
                <select name="vendor" value={form.vendor} onChange={ch} className={ic()}>
                  <option value="">Select asset product</option>
                  {vendorList.map((v) => <option key={v.id} value={v.name}>{v.name}</option>)}
                </select>
              </Field>
              <Field label="Barcode/QR Code">
                <input name="barcode" value={form.barcode} onChange={ch}
                  className={ic()} placeholder="enter barcode/qr code" />
              </Field>
              <Field label="Purchase Cost">
                <input type="number" name="purchaseCost" value={form.purchaseCost} onChange={ch}
                  className={ic()} placeholder="Enter purchase cost" min="0" step="0.01" />
              </Field>
              <Field label="Acquisition Date">
                <input type="date" name="acquisitionDate" value={form.acquisitionDate} onChange={ch} className={ic()} />
              </Field>
              <Field label="Expiry Date">
                <input type="date" name="expiryDate" value={form.expiryDate} onChange={ch} className={ic()} />
              </Field>
              <Field label="Warranty Expiry Date">
                <input type="date" name="warrantyExpiryDate" value={form.warrantyExpiryDate} onChange={ch} className={ic()} />
              </Field>
              <Field label="Location">
                <input name="location" value={form.location} onChange={ch}
                  className={ic()} placeholder="enter location" />
              </Field>
            </div>
          </div>

          {divider}

          {/* ── Asset State ──────────────────────────────────────── */}
          <div className="p-6">
            <SectionTitle title="Asset State" />
            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
              <Field label="Asset Is Currently">
                <select name="assetState" value={form.assetState} onChange={ch} className={ic()}>
                  <option value="">Select Asset State</option>
                  {stateList.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </Field>
              <Field label="User">
                <select name="user" value={form.user} onChange={ch} className={ic()}>
                  <option value="">Select user</option>
                  {USERS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </Field>
              <Field label="Department">
                <select name="department" value={form.department} onChange={ch} className={ic()}>
                  <option value="">Select department</option>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </Field>
              <Field label="Associated To">
                <select name="associatedToAssets" value={form.associatedToAssets} onChange={ch} className={ic()}>
                  <option value="">Select associated to</option>
                </select>
              </Field>
              <Field label="Site">
                <select name="site" value={form.site} onChange={ch} className={ic()}>
                  <option value="">Select siteInstance</option>
                  {SITES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <div />
              <div className="col-span-2">
                <Field label="State Comments">
                  <input name="stateComments" value={form.stateComments} onChange={ch}
                    className={ic()} placeholder="enter state comments" />
                </Field>
              </div>
            </div>
          </div>

          {/* ── Workstation-only sections ─────────────────────────── */}
          {isWorkstation && (
            <>
              {divider}

              {/* Computer */}
              <div className="p-6">
                <SectionTitle title="Computer" />
                <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                  <Field label="MacAddress">
                    <input name="macAddress" value={form.macAddress} onChange={ch}
                      className={ic()} placeholder="enter mac address" />
                  </Field>
                  <Field label="Service Tag">
                    <input name="serviceTag" value={form.serviceTag} onChange={ch}
                      className={ic()} placeholder="enter service tag" />
                  </Field>
                  <Field label="Manufacturer">
                    <input name="manufacturer" value={form.manufacturer} onChange={ch}
                      className={ic()} placeholder="enter product manufacturer" />
                  </Field>
                  <Field label="Bios Date">
                    <input type="date" name="biosDate" value={form.biosDate} onChange={ch} className={ic()} />
                  </Field>
                  <Field label="Domain">
                    <select name="domain" value={form.domain} onChange={ch} className={ic()}>
                      <option value="">Select domain</option>
                      {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </Field>
                  <Field label="SMBios Version">
                    <input name="smbiosVersion" value={form.smbiosVersion} onChange={ch}
                      className={ic()} placeholder="enter smbios version" />
                  </Field>
                  <Field label="Bios Version">
                    <input name="biosVersion" value={form.biosVersion} onChange={ch}
                      className={ic()} placeholder="enter bios version" />
                  </Field>
                  <Field label="Bios Manufacturer">
                    <input name="biosManufacturer" value={form.biosManufacturer} onChange={ch}
                      className={ic()} placeholder="enter bios manufacturer" />
                  </Field>
                </div>
              </div>

              {divider}

              {/* Operating System */}
              <div className="p-6">
                <SectionTitle title="Operating System" />
                <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                  <Field label="Name">
                    <input name="osName" value={form.osName} onChange={ch}
                      className={ic()} placeholder="enter operating system" />
                  </Field>
                  <Field label="Version">
                    <input name="osVersion" value={form.osVersion} onChange={ch}
                      className={ic()} placeholder="enter operating system version" />
                  </Field>
                  <Field label="Build Number">
                    <input name="osBuildNumber" value={form.osBuildNumber} onChange={ch}
                      className={ic()} placeholder="enter build number" />
                  </Field>
                  <Field label="Service Pack">
                    <input name="osServicePack" value={form.osServicePack} onChange={ch}
                      className={ic()} placeholder="enter service pack" />
                  </Field>
                  <Field label="Product Id">
                    <input name="osProductId" value={form.osProductId} onChange={ch}
                      className={ic()} placeholder="enter product id" />
                  </Field>
                </div>
              </div>

              {divider}

              {/* Memory Details */}
              <div className="p-6">
                <SectionTitle title="Memory Details" />
                <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                  <Field label="RAM">
                    <input type="number" name="ram" value={form.ram} onChange={ch}
                      className={ic()} placeholder="enter virtual memory" min="0" />
                  </Field>
                  <Field label="Virtual Memory">
                    <input name="virtualMemory" value={form.virtualMemory} onChange={ch}
                      className={ic()} placeholder="enter physical memory" />
                  </Field>
                </div>
              </div>

              {divider}

              {/* Processors */}
              <div className="p-6">
                <SectionTitle title="Processors" />
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-2 pr-3">Processor Info</th>
                        <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-2 pr-3">Manufacturer</th>
                        <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-2 pr-3 w-36">Clock Speed (MHz)</th>
                        <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-2 pr-3 w-36">Number Of Cores</th>
                        <th className="w-16 pb-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {form.processors.map((row, i) => (
                        <tr key={i}>
                          <td className="pr-2 pb-2"><input value={row.processorInfo} onChange={(e) => updateRow('processors', i, 'processorInfo', e.target.value)} className={icSm()} placeholder="Enter processor name" /></td>
                          <td className="pr-2 pb-2"><input value={row.manufacturer} onChange={(e) => updateRow('processors', i, 'manufacturer', e.target.value)} className={icSm()} placeholder="Enter manufacturer" /></td>
                          <td className="pr-2 pb-2"><input type="number" value={row.clockSpeed} onChange={(e) => updateRow('processors', i, 'clockSpeed', e.target.value)} className={icSm()} min="0" /></td>
                          <td className="pr-2 pb-2"><input type="number" value={row.numberOfCores} onChange={(e) => updateRow('processors', i, 'numberOfCores', e.target.value)} className={icSm()} min="0" /></td>
                          <td className="pb-2">
                            <div className="flex gap-1">
                              <RowBtn color="red"   onClick={() => removeRow('processors', i)}>−</RowBtn>
                              <RowBtn color="green" onClick={() => addRow('processors', { ...PROC_TMPL })}>+</RowBtn>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {form.processors.length === 0 && (
                    <RowBtn color="green" onClick={() => addRow('processors', { ...PROC_TMPL })}>+</RowBtn>
                  )}
                </div>
              </div>

              {divider}

              {/* Hard Disks */}
              <div className="p-6">
                <SectionTitle title="Hard Disks" />
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-2 pr-3">Model</th>
                        <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-2 pr-3">Serial Number</th>
                        <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-2 pr-3">Manufacturer</th>
                        <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-2 pr-3 w-36">Capacity (in GB)</th>
                        <th className="w-16 pb-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {form.hardDisks.map((row, i) => (
                        <tr key={i}>
                          <td className="pr-2 pb-2"><input value={row.model} onChange={(e) => updateRow('hardDisks', i, 'model', e.target.value)} className={icSm()} placeholder="enter harddisk name" /></td>
                          <td className="pr-2 pb-2"><input value={row.serialNumber} onChange={(e) => updateRow('hardDisks', i, 'serialNumber', e.target.value)} className={icSm()} placeholder="enter serial number" /></td>
                          <td className="pr-2 pb-2"><input value={row.manufacturer} onChange={(e) => updateRow('hardDisks', i, 'manufacturer', e.target.value)} className={icSm()} placeholder="enter manufacturer" /></td>
                          <td className="pr-2 pb-2"><input type="number" value={row.capacity} onChange={(e) => updateRow('hardDisks', i, 'capacity', e.target.value)} className={icSm()} min="0" /></td>
                          <td className="pb-2">
                            <div className="flex gap-1">
                              <RowBtn color="red"   onClick={() => removeRow('hardDisks', i)}>−</RowBtn>
                              <RowBtn color="green" onClick={() => addRow('hardDisks', { ...DISK_TMPL })}>+</RowBtn>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {form.hardDisks.length === 0 && (
                    <RowBtn color="green" onClick={() => addRow('hardDisks', { ...DISK_TMPL })}>+</RowBtn>
                  )}
                </div>
              </div>

              {divider}

              {/* Keyboard */}
              <div className="p-6">
                <SectionTitle title="Keyboard" />
                <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                  <Field label="Keyboard Type">
                    <input name="keyboardType" value={form.keyboardType} onChange={ch}
                      className={ic()} placeholder="enter name" />
                  </Field>
                  <Field label="Manufacturer">
                    <input name="keyboardManufacturer" value={form.keyboardManufacturer} onChange={ch}
                      className={ic()} placeholder="enter manufacturer" />
                  </Field>
                  <Field label="Serial Number">
                    <input name="keyboardSerialNumber" value={form.keyboardSerialNumber} onChange={ch}
                      className={ic()} placeholder="Enter serial number" />
                  </Field>
                </div>
              </div>

              {divider}

              {/* Mouse */}
              <div className="p-6">
                <SectionTitle title="Mouse" />
                <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                  <Field label="Mouse Type">
                    <input name="mouseType" value={form.mouseType} onChange={ch}
                      className={ic()} placeholder="enter name" />
                  </Field>
                  <Field label="Serial Number">
                    <input name="mouseSerialNumber" value={form.mouseSerialNumber} onChange={ch}
                      className={ic()} placeholder="enter serial number" />
                  </Field>
                  <Field label="Mouse Manufacturer">
                    <input name="mouseManufacturer" value={form.mouseManufacturer} onChange={ch}
                      className={ic()} placeholder="enter manufacturer" />
                  </Field>
                  <Field label="Mouse Buttons">
                    <input name="mouseButtons" value={form.mouseButtons} onChange={ch}
                      className={ic()} placeholder="Enter buttons" />
                  </Field>
                </div>
              </div>

              {divider}

              {/* Monitors */}
              <div className="p-6">
                <SectionTitle title="Monitors" />
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-2 pr-3">Monitor Type</th>
                        <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-2 pr-3">Serial Number</th>
                        <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-2 pr-3">Manufacturer</th>
                        <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-2 pr-3">Max Resolution</th>
                        <th className="w-16 pb-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {form.monitors.map((row, i) => (
                        <tr key={i}>
                          <td className="pr-2 pb-2"><input value={row.monitorType} onChange={(e) => updateRow('monitors', i, 'monitorType', e.target.value)} className={icSm()} placeholder="enter monitor type" /></td>
                          <td className="pr-2 pb-2"><input value={row.serialNumber} onChange={(e) => updateRow('monitors', i, 'serialNumber', e.target.value)} className={icSm()} placeholder="enter serial number" /></td>
                          <td className="pr-2 pb-2"><input value={row.manufacturer} onChange={(e) => updateRow('monitors', i, 'manufacturer', e.target.value)} className={icSm()} placeholder="enter manufacturer" /></td>
                          <td className="pr-2 pb-2"><input value={row.maxResolution} onChange={(e) => updateRow('monitors', i, 'maxResolution', e.target.value)} className={icSm()} placeholder="enter resolution" /></td>
                          <td className="pb-2">
                            <div className="flex gap-1">
                              <RowBtn color="red"   onClick={() => removeRow('monitors', i)}>−</RowBtn>
                              <RowBtn color="green" onClick={() => addRow('monitors', { ...MON_TMPL })}>+</RowBtn>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {form.monitors.length === 0 && (
                    <RowBtn color="green" onClick={() => addRow('monitors', { ...MON_TMPL })}>+</RowBtn>
                  )}
                </div>
              </div>

              {divider}

              {/* Networks */}
              <div className="p-6">
                <SectionTitle title="Networks" />
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-2 pr-2">IpAddress</th>
                        <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-2 pr-2">MacAddress</th>
                        <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-2 pr-2">NIC</th>
                        <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-2 pr-2">Dns Server</th>
                        <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-2 pr-2">Default Gateway</th>
                        <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-2 pr-2 w-28">DHCP Enabled</th>
                        <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-2 pr-2">DHCP Server</th>
                        <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-2 pr-2">DNS Hostname</th>
                        <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-2 pr-2 w-24">Type</th>
                        <th className="w-16 pb-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {form.networks.map((row, i) => (
                        <tr key={i}>
                          <td className="pr-1.5 pb-2"><input value={row.ipAddress}      onChange={(e) => updateRow('networks', i, 'ipAddress',      e.target.value)} className={icSm()} placeholder="enter ip address" /></td>
                          <td className="pr-1.5 pb-2"><input value={row.macAddress}     onChange={(e) => updateRow('networks', i, 'macAddress',     e.target.value)} className={icSm()} placeholder="enter mac address" /></td>
                          <td className="pr-1.5 pb-2"><input value={row.nic}            onChange={(e) => updateRow('networks', i, 'nic',            e.target.value)} className={icSm()} placeholder="enter name" /></td>
                          <td className="pr-1.5 pb-2"><input value={row.dnsServer}      onChange={(e) => updateRow('networks', i, 'dnsServer',      e.target.value)} className={icSm()} placeholder="enter dns server" /></td>
                          <td className="pr-1.5 pb-2"><input value={row.defaultGateway} onChange={(e) => updateRow('networks', i, 'defaultGateway', e.target.value)} className={icSm()} placeholder="enter gateway" /></td>
                          <td className="pr-1.5 pb-2">
                            <select value={row.dhcpEnabled} onChange={(e) => updateRow('networks', i, 'dhcpEnabled', e.target.value)} className={icSm()}>
                              <option value="">Select dhcp one</option>
                              {DHCP_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                            </select>
                          </td>
                          <td className="pr-1.5 pb-2"><input value={row.dhcpServer}  onChange={(e) => updateRow('networks', i, 'dhcpServer',  e.target.value)} className={icSm()} placeholder="enter dhcpServer" /></td>
                          <td className="pr-1.5 pb-2"><input value={row.dnsHostname} onChange={(e) => updateRow('networks', i, 'dnsHostname', e.target.value)} className={icSm()} placeholder="enter dns hostname" /></td>
                          <td className="pr-1.5 pb-2">
                            <select value={row.type} onChange={(e) => updateRow('networks', i, 'type', e.target.value)} className={icSm()}>
                              <option value="">Select type</option>
                              {NET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </td>
                          <td className="pb-2">
                            <div className="flex gap-1">
                              <RowBtn color="red"   onClick={() => removeRow('networks', i)}>−</RowBtn>
                              <RowBtn color="green" onClick={() => addRow('networks', { ...NET_TMPL })}>+</RowBtn>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {form.networks.length === 0 && (
                    <RowBtn color="green" onClick={() => addRow('networks', { ...NET_TMPL })}>+</RowBtn>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── Save buttons ─────────────────────────────────────── */}
          <div className="flex justify-center gap-4 py-6 border-t border-gray-100 dark:border-gray-700">
            <button type="button" onClick={() => handleSave(false)} disabled={savingMode !== null}
              className="px-10 py-2.5 text-sm font-semibold text-white bg-cyan-500 hover:bg-cyan-600 rounded-full disabled:opacity-50 flex items-center gap-2 transition shadow-sm">
              {savingMode === 'save' && <Loader2 size={14} className="animate-spin" />}
              Save
            </button>
            <button type="button" onClick={() => handleSave(true)} disabled={savingMode !== null}
              className="px-10 py-2.5 text-sm font-semibold text-white bg-cyan-500 hover:bg-cyan-600 rounded-full disabled:opacity-50 flex items-center gap-2 transition shadow-sm">
              {savingMode === 'continue' && <Loader2 size={14} className="animate-spin" />}
              Save and Continue Edit
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
