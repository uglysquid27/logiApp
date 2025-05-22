import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Fulfill({ request, employees }) {
  // Take only the number of employees requested
  const initialSelectedEmployees = employees.slice(0, request.requested_amount);
  const initialSelectedEmployeeIds = initialSelectedEmployees.map((emp) => emp.id);

  const { data, setData, post, processing } = useForm({
    employee_ids: initialSelectedEmployeeIds, // Automatically select on initial load
  });

  // State for modal
  const [showModal, setShowModal] = useState(false);
  // State to track which slot (index in data.employee_ids) is being changed
  const [changingEmployeeIndex, setChangingEmployeeIndex] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('manpower-requests.fulfill.store', request.id));
  };

  // Function to open the modal and set the index of the employee to change
  const openChangeModal = (index) => {
    setChangingEmployeeIndex(index);
    setShowModal(true);
  };

  // Function to handle selecting a new employee from the modal
  const selectNewEmployee = (newEmployeeId) => {
    if (changingEmployeeIndex !== null) {
      const currentEmployeeIds = [...data.employee_ids];
      const oldEmployeeId = currentEmployeeIds[changingEmployeeIndex];

      // Check if the new employee is already selected in another slot
      if (currentEmployeeIds.includes(newEmployeeId) && newEmployeeId !== oldEmployeeId) {
        alert('Karyawan ini sudah dipilih untuk slot lain.');
        return; // Prevent selecting the same employee twice
      }

      currentEmployeeIds[changingEmployeeIndex] = newEmployeeId;
      setData('employee_ids', currentEmployeeIds);
      setShowModal(false);
      setChangingEmployeeIndex(null);
    }
  };

  // Helper to get employee details by ID for display
  const getEmployeeDetails = (id) => employees.find(emp => emp.id === id);

  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Penuhi Request Man Power</h2>}
    >
      <div className="max-w-4xl mx-auto mt-6">
        {/* Request Details Card */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
          <h3 className="text-lg font-bold mb-3">Detail Permintaan</h3>
          <p><strong>Tanggal:</strong> {request.date}</p>
          <p><strong>Sub Section:</strong> {request.sub_section?.name}</p>
          <p><strong>Section:</strong> {request.sub_section?.section?.name}</p>
          <p><strong>Jumlah Diminta:</strong> {request.requested_amount}</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Automatically Selected Employees Card */}
          <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-bold mb-3">Karyawan Terpilih Otomatis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.employee_ids.map((employeeId, index) => {
                const employee = getEmployeeDetails(employeeId);
                return (
                  <div key={index} className="bg-gray-100 p-3 rounded-md flex justify-between items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={true} // Always checked as they are selected
                        readOnly
                        className="form-checkbox h-5 w-5 text-green-600"
                      />
                      <span>
                        <strong>{employee?.name || 'N/A'}</strong> ({employee?.nik || 'N/A'})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => openChangeModal(index)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                    >
                      Ubah
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={processing}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition duration-300 ease-in-out"
          >
            {processing ? 'Menyimpan...' : 'Submit Permintaan'}
          </button>
        </form>
      </div>

      {/* Employee Selection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Pilih Karyawan Baru</h3>
            {/* --- Perubahan di sini: Menggunakan 4 kolom pada layar besar --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {employees.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => selectNewEmployee(emp.id)}
                  className={`block w-full text-left p-3 rounded-md text-sm transition duration-200
                              ${data.employee_ids.includes(emp.id)
                                ? 'bg-blue-100 text-blue-700 cursor-not-allowed opacity-70'
                                : 'hover:bg-gray-100'
                              }`}
                  disabled={data.employee_ids.includes(emp.id)} // Disable if already selected
                >
                  <strong>{emp.name}</strong> ({emp.nik})
                </button>
              ))}
            </div>
            {/* --- Akhir perubahan --- */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}