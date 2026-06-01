import MasterTable, { YesNoBadge } from '../common/MasterTable';
import { getSoftwareTypes, deleteSoftwareType } from '../../services/softwareTypeService';
import SoftwareTypeForm from './SoftwareTypeForm';

const COLUMNS = [
  { key: 'id',   label: 'ID',   sortable: true, defaultHidden: true },
  {
    key: 'name', label: 'Name', sortable: true,
    render: (row) => <span className="font-medium text-gray-800 dark:text-gray-200">{row.name}</span>,
  },
  {
    key: 'description', label: 'Description', sortable: false,
    render: (row) => (
      <span className="text-xs text-gray-500 dark:text-gray-400 max-w-sm truncate block">
        {row.description || '—'}
      </span>
    ),
  },
  {
    key: 'enableCompliance', label: 'Enable Compliance', sortable: true,
    render: (row) => <YesNoBadge value={row.enableCompliance} />,
  },
  {
    key: 'isActive', label: 'Active', sortable: true, defaultHidden: true,
    render: (row) => <YesNoBadge value={row.isActive} />,
  },
];

export default function SoftwareTypeTable() {
  return (
    <MasterTable
      columns={COLUMNS}
      fetchFn={getSoftwareTypes}
      deleteFn={deleteSoftwareType}
      FormComponent={SoftwareTypeForm}
      entityName="Software Type"
      statusLabel="Software Types"
      lsKey="asset_softwaretype_columns"
      createTitle="Add Software Type"
    />
  );
}
