import { useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import dayjs from 'dayjs';

export default function Edit({ manpowerRequestData, subSections, shifts }) {
  const { data, setData, put, processing, errors } = useForm({
    sub_section_id: manpowerRequestData.sub_section_id || '',
    date: manpowerRequestData.date || '',
    requested_amounts_by_shift: manpowerRequestData.requested_amounts_by_shift || {},
  });

  const submit = (e) => {
    e.preventDefault();
    const url = `/manpower-requests/${manpowerRequestData.id}`;
    console.log('Attempting to send PUT request to URL:', url); // Added for debugging

    put(url, {
      onSuccess: () => {
        console.log('Request berhasil diperbarui!');
        // Changed from route() to direct URL
        window.location.href = '/manpower-requests';
      },
      onError: (formErrors) => {
        console.error('Ada kesalahan saat memperbarui request:', formErrors);
        if (formErrors.status) {
            alert('Kesalahan: ' + formErrors.status);
        } else if (formErrors.requested_amounts_by_shift) {
            alert('Kesalahan jumlah man power: ' + formErrors.requested_amounts_by_shift);
        } else {
            alert('Terjadi kesalahan yang tidak diketahui. Silakan cek konsol.');
        }
      },
      onFinish: () => {
        console.log('Proses pembaruan form selesai.');
      }
    });
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <AuthenticatedLayout
      header={
        <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
          Edit Request Man Power
        </h2>
      }
    >
      <div className="py-8">
        <div className="max-w-2xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg sm:rounded-lg">
            <div className="p-6 md:p-8 text-gray-900 dark:text-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                  Edit Request Man Power
                </h1>
                <Link
                  href="/manpower-requests"
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 inline-flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" > <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /> </svg>
                  Kembali ke Daftar
                </Link>
              </div>

              <form onSubmit={submit} className="space-y-6">
                <div>
                  <label htmlFor="sub_section_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sub Section <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="sub_section_id"
                    name="sub_section_id"
                    value={data.sub_section_id}
                    onChange={(e) => setData('sub_section_id', e.target.value)}
                    className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border ${errors.sub_section_id ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100`}
                    required
                  >
                    <option value="">-- Pilih Sub Section --</option>
                    {subSections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  {errors.sub_section_id && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.sub_section_id}</p>}
                </div>

                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tanggal Dibutuhkan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={data.date}
                    onChange={(e) => setData('date', e.target.value)}
                    min={today}
                    className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border ${errors.date ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100`}
                    required
                  />
                  {errors.date && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.date}</p>}
                </div>

                {shifts && Array.isArray(shifts) && shifts.map((shift) => (
                  <div key={shift.id} className="pt-4 border-t mt-4">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">{shift.name}</h3>
                    <label htmlFor={`requested_amount_${shift.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Jumlah Man Power (Opsional)
                    </label>
                    <input
                      type="number"
                      id={`requested_amount_${shift.id}`}
                      name={`requested_amounts_by_shift[${shift.id}]`}
                      min="0"
                      value={data.requested_amounts_by_shift[shift.id] !== undefined ? data.requested_amounts_by_shift[shift.id] : ''}
                      onChange={(e) => setData('requested_amounts_by_shift', {
                        ...data.requested_amounts_by_shift,
                        [shift.id]: e.target.value ? parseInt(e.target.value, 10) : ''
                      })}
                      placeholder="Contoh: 3"
                      className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border ${errors && errors[`requested_amounts_by_shift.${shift.id}`] ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100`}
                    />
                    {errors && errors[`requested_amounts_by_shift.${shift.id}`] && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors[`requested_amounts_by_shift.${shift.id}`]}</p>
                    )}
                  </div>
                ))}

                <div className="flex items-center justify-end pt-2">
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 disabled:opacity-75 disabled:cursor-not-allowed"
                    disabled={processing}
                  >
                    {processing ? 'Memperbarui...' : 'Perbarui Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
