import MasterTable, { YesNoBadge } from '../common/MasterTable';
import { getVendors, deleteVendor } from '../../services/vendorService';
import VendorForm from './VendorForm';

const COLUMNS = [
  { key: 'id',            label: 'ID',             sortable: true,  defaultHidden: true },
  {
    key: 'name', label: 'Name', sortable: true,
    render: (row) => <span className="font-medium text-gray-800 dark:text-gray-200">{row.name}</span>,
  },
  {
    key: 'currency', label: 'Currency', sortable: true, filterable: true, filterParam: 'currency',
    render: (row) => <span className="text-brand-600 dark:text-brand-400">{row.currency || '—'}</span>,
  },
  {
    key: 'contactPerson', label: 'Contact Person', sortable: false, filterable: true, filterParam: 'contactPerson',
    render: (row) => row.contactPerson || '—',
  },
  { key: 'email',   label: 'Email',   sortable: false, render: (row) => row.email   || '—' },
  { key: 'phone',   label: 'Phone',   sortable: false, render: (row) => row.phone   || '—' },
  {
    key: 'website', label: 'Website', sortable: false,
    render: (row) => row.website
      ? <a href={row.website} target="_blank" rel="noopener noreferrer" className="text-brand-600 dark:text-brand-400 hover:underline truncate max-w-xs block">{row.website}</a>
      : '—',
  },
  {
    key: 'isActive', label: 'Active', sortable: true, defaultHidden: true,
    render: (row) => <YesNoBadge value={row.isActive} />,
  },
];

export default function VendorTable() {
  return (
    <MasterTable
      columns={COLUMNS}
      fetchFn={getVendors}
      deleteFn={deleteVendor}
      FormComponent={VendorForm}
      entityName="Vendor"
      statusLabel="Vendors"
      lsKey="asset_vendor_columns"
      createTitle="Add Vendor"
    />
  );
}
