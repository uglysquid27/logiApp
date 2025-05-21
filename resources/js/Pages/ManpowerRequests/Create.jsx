import { useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Create({ subSections }) {
  const { data, setData, post, processing, errors } = useForm({
    sub_section_id: '',
    date: '',
    requested_amount: '',
  });

  const submit = (e) => {
    e.preventDefault();
    post(route('manpower-requests.store'));
  };

  return (
    <AuthenticatedLayout
    header={
        <h2 className="text-xl font-semibold leading-tight text-gray-800">
            Request Man Power
        </h2>
    }
>
    <div>
      <h1 className="text-xl font-bold mb-4">Request Man Power</h1>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label>Sub Section</label>
          <select
            value={data.sub_section_id}
            onChange={(e) => setData('sub_section_id', e.target.value)}
            className="border rounded w-full"
          >
            <option value="">-- Pilih Sub Section --</option>
            {subSections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {errors.sub_section_id && <div className="text-red-500">{errors.sub_section_id}</div>}
        </div>

        <div>
          <label>Tanggal</label>
          <input
            type="date"
            value={data.date}
            onChange={(e) => setData('date', e.target.value)}
            className="border rounded w-full"
          />
          {errors.date && <div className="text-red-500">{errors.date}</div>}
        </div>

        <div>
          <label>Jumlah Man Power</label>
          <input
            type="number"
            min="1"
            value={data.requested_amount}
            onChange={(e) => setData('requested_amount', e.target.value)}
            className="border rounded w-full"
          />
          {errors.requested_amount && <div className="text-red-500">{errors.requested_amount}</div>}
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white py-2 px-4 rounded disabled:opacity-50"
          disabled={processing}
        >
          Submit
        </button>
      </form>
    </div>
    </AuthenticatedLayout>
  );
}
