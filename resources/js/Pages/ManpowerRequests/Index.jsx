import { Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index({ requests }) {
  return (
    <AuthenticatedLayout
      header={
        <h2 className="text-xl font-semibold leading-tight text-gray-800">
          Request Man Power
        </h2>
      }
    >
      <div>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Daftar Request Man Power</h1>
          <Link
            href={route('manpower-requests.create')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Request Man Power
          </Link>
        </div>

        <table className="table-auto w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1">Tanggal</th>
              <th className="border px-2 py-1">Section</th>
              <th className="border px-2 py-1">Sub Section</th>
              <th className="border px-2 py-1">Jumlah</th>
              <th className="border px-2 py-1">Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-4 text-gray-500">
                  Belum ada request.
                </td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id}>
                  <td className="border px-2 py-1">{req.date}</td>
                  <td className="border px-2 py-1">{req.sub_section?.section?.name ?? '-'}</td>
                  <td className="border px-2 py-1">{req.sub_section?.name}</td>
                  <td className="border px-2 py-1">{req.requested_amount}</td>
                  <td className="border px-2 py-1 capitalize">{req.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

      </div>
    </AuthenticatedLayout>
  );
}
