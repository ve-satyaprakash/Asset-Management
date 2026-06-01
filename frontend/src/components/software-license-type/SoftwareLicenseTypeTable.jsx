import MasterTable, { YesNoBadge } from '../common/MasterTable';
import { getSoftwareLicenseTypes, deleteSoftwareLicenseType } from '../../services/softwareLicenseTypeService';
import SoftwareLicenseTypeForm from './SoftwareLicenseTypeForm';

function TextBadge({ value }) {
  return (
    <span className={value ? 'text-gray-800 dark:text-gray-200 font-medium' : 'text-red-500 font-medium'}>
      {value ? 'Yes' : 'No'}
    </span>
  );
}

const COLUMNS = [
  { key: 'id', label: 'ID', sortable: true, defaultHidden: true },
  {
    key: 'name', label: 'License Type', sortable: true,
    render: (row) => <span className="font-medium text-gray-800 dark:text-gray-200">{row.name}</span>,
  },
  {
    key: 'trackBy', label: 'Track By', sortable: true, filterable: true, filterParam: 'trackBy',
    render: (row) => row.trackBy
      ? <span className={['User', 'CAL'].includes(row.trackBy) ? 'text-brand-600 dark:text-brand-400' : 'text-gray-700 dark:text-gray-300'}>{row.trackBy}</span>
      : '—',
  },
  {
    key: 'installationsAllowed', label: 'Installation Allowed', sortable: false,
    render: (row) => <span className="text-gray-700 dark:text-gray-300">{row.installationsAllowed || '—'}</span>,
  },
  {
    key: 'isPerpetual', label: 'Is Perpetual', sortable: true,
    render: (row) => <TextBadge value={row.isPerpetual} />,
  },
  {
    key: 'isFreeLicense', label: 'Is Free License', sortable: true,
    render: (row) => <TextBadge value={row.isFreeLicense} />,
  },
  {
    key: 'licenseOption', label: 'License Option', sortable: false, defaultHidden: true,
    render: (row) => row.licenseOption || '—',
  },
  {
    key: 'manufacturer', label: 'Manufacturer', sortable: false, defaultHidden: true,
    render: (row) => row.manufacturer?.name || '—',
  },
  {
    key: 'isActive', label: 'Active', sortable: true, defaultHidden: true,
    render: (row) => <YesNoBadge value={row.isActive} />,
  },
];

export default function SoftwareLicenseTypeTable() {
  return (
    <MasterTable
      columns={COLUMNS}
      fetchFn={getSoftwareLicenseTypes}
      deleteFn={deleteSoftwareLicenseType}
      FormComponent={SoftwareLicenseTypeForm}
      entityName="Software License Type"
      statusLabel="Software License Types"
      lsKey="asset_softwarelicensetype_columns_v2"
      createTitle="Add Software License Type"
    />
  );
}
