import MasterTable from '../common/MasterTable';
import { getManufacturers, deleteManufacturer } from '../../services/manufacturerService';
import ManufacturerForm from './ManufacturerForm';

const COLUMNS = [
  { key: 'id',   label: 'ID',   sortable: true, defaultHidden: true },
  {
    key: 'name', label: 'Name', sortable: true,
    render: (row) => <span className="font-medium text-brand-600 dark:text-brand-400">{row.name}</span>,
  },
  {
    key: 'description', label: 'Description', sortable: false,
    render: (row) => (
      <span className="text-xs text-gray-500 dark:text-gray-400 max-w-sm truncate block">
        {row.description || '—'}
      </span>
    ),
  },
];

export default function ManufacturerTable() {
  return (
    <MasterTable
      columns={COLUMNS}
      fetchFn={getManufacturers}
      deleteFn={deleteManufacturer}
      FormComponent={ManufacturerForm}
      entityName="Manufacturer"
      statusLabel="manufacturers"
      lsKey="asset_manufacturer_columns"
    />
  );
}
