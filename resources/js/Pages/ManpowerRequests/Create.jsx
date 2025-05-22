import { useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

// Optional: Heroicons for a back button or other elements
// import { ArrowLeftIcon } from '@heroicons/react/24/solid';

export default function Create({ subSections }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    sub_section_id: '',
    date: '',
    requested_amount: '',
  });

  const submit = (e) => {
    e.preventDefault();
    post(route('manpower-requests.store'), {
      onSuccess: () => reset(), // Optionally reset form on success
    });
  };

  // Get today's date in YYYY-MM-DD format for min attribute on date input
  const today = new Date().toISOString().split('T')[0];

  return (
    <AuthenticatedLayout
      header={
        <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
          Request Man Power
        </h2>
      }
    >
      <div className="py-8">
        <div className="max-w-2xl mx-auto sm:px-6 lg:px-8"> {/* Adjusted max-width for a form */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg sm:rounded-lg">
            <div className="p-6 md:p-8 text-gray-900 dark:text-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                  Buat Request Man Power Baru
                </h1>
                <Link
                  href={route('manpower-requests.index')}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 inline-flex items-center"
                >
                  {/* <ArrowLeftIcon className="w-4 h-4 mr-1" /> */}
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" > <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /> </svg>
                  Kembali ke Daftar
                </Link>
              </div>

              <form onSubmit={submit} className="space-y-6">
                {/* Sub Section Field */}
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

                {/* Date Field */}
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
                    min={today} // Prevent selecting past dates
                    className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border ${errors.date ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100`}
                    required
                  />
                  {errors.date && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.date}</p>}
                </div>

                {/* Requested Amount Field */}
                <div>
                  <label htmlFor="requested_amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Jumlah Man Power <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="requested_amount"
                    name="requested_amount"
                    min="1"
                    value={data.requested_amount}
                    onChange={(e) => setData('requested_amount', e.target.value)}
                    placeholder="Contoh: 5"
                    className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border ${errors.requested_amount ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100`}
                    required
                  />
                  {errors.requested_amount && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.requested_amount}</p>}
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-end pt-2">
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 disabled:opacity-75 disabled:cursor-not-allowed"
                    disabled={processing}
                  >
                    {processing ? 'Menyimpan...' : 'Submit Request'}
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
