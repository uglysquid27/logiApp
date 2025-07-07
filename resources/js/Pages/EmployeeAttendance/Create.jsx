import React, { useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Create() {
  const { uniqueSections, uniqueSubSections } = usePage().props;
  const [selectedSubSections, setSelectedSubSections] = useState([]);

  const { data, setData, post, processing, errors } = useForm({
    name: '',
    nik: '',
    password: '',
    password_confirmation: '',
    type: 'harian',
    status: 'available',
    cuti: 'no',
    gender: 'male',
    sub_sections: [],
  });

  const handleSubSectionToggle = (subSectionId) => {
    const updatedSubSections = selectedSubSections.includes(subSectionId)
      ? selectedSubSections.filter(id => id !== subSectionId)
      : [...selectedSubSections, subSectionId];
    
    setSelectedSubSections(updatedSubSections);
    setData('sub_sections', updatedSubSections);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('employee-attendance.store'), {
      onSuccess: () => {
        // Reset form on success
        setSelectedSubSections([]);
      },
    });
  };

  return (
    <AuthenticatedLayout
      header={
        <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-xl leading-tight">
          Tambah Pegawai Baru
        </h2>
      }
    >
      <div className="py-4 sm:py-8">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="bg-white dark:bg-gray-800 shadow-lg sm:rounded-lg overflow-hidden">
            <div className="p-4 sm:p-6 md:p-8 text-gray-900 dark:text-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h1 className="font-bold text-gray-700 dark:text-gray-300 text-xl sm:text-2xl">
                  Formulir Pegawai Baru
                </h1>
                <Link
                  href={route('employee-attendance.index')}
                  className="bg-gray-600 hover:bg-gray-700 px-3 py-2 sm:px-4 sm:py-2 rounded-md font-medium text-white text-sm transition-colors duration-200"
                >
                  Kembali ke Daftar
                </Link>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 sm:p-6 rounded-lg">
                  <h3 className="font-medium text-gray-700 dark:text-gray-300 text-lg mb-4">
                    Informasi Dasar
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div>
                      <label htmlFor="name" className="block mb-2 font-medium text-gray-700 dark:text-gray-300 text-sm">
                        Nama Lengkap <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        className="w-full bg-white dark:bg-gray-600 shadow-sm px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-gray-100 text-sm"
                        placeholder="Masukkan nama lengkap"
                        required
                      />
                      {errors.name && <p className="mt-1 text-red-500 text-sm">{errors.name}</p>}
                    </div>

                    {/* NIK */}
                    <div>
                      <label htmlFor="nik" className="block mb-2 font-medium text-gray-700 dark:text-gray-300 text-sm">
                        NIK <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="nik"
                        value={data.nik}
                        onChange={(e) => setData('nik', e.target.value)}
                        className="w-full bg-white dark:bg-gray-600 shadow-sm px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-gray-100 text-sm"
                        placeholder="Masukkan NIK"
                        required
                      />
                      {errors.nik && <p className="mt-1 text-red-500 text-sm">{errors.nik}</p>}
                    </div>

                    {/* Gender */}
                    <div>
                      <label htmlFor="gender" className="block mb-2 font-medium text-gray-700 dark:text-gray-300 text-sm">
                        Jenis Kelamin <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="gender"
                        value={data.gender}
                        onChange={(e) => setData('gender', e.target.value)}
                        className="w-full bg-white dark:bg-gray-600 shadow-sm px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-gray-100 text-sm"
                        required
                      >
                        <option value="male">Laki-laki</option>
                        <option value="female">Perempuan</option>
                      </select>
                      {errors.gender && <p className="mt-1 text-red-500 text-sm">{errors.gender}</p>}
                    </div>

                    {/* Type */}
                    <div>
                      <label htmlFor="type" className="block mb-2 font-medium text-gray-700 dark:text-gray-300 text-sm">
                        Tipe Pegawai <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="type"
                        value={data.type}
                        onChange={(e) => setData('type', e.target.value)}
                        className="w-full bg-white dark:bg-gray-600 shadow-sm px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-gray-100 text-sm"
                        required
                      >
                        <option value="harian">Harian</option>
                        <option value="bulanan">Bulanan</option>
                      </select>
                      {errors.type && <p className="mt-1 text-red-500 text-sm">{errors.type}</p>}
                    </div>
                  </div>
                </div>

                {/* Password Section */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 sm:p-6 rounded-lg">
                  <h3 className="font-medium text-gray-700 dark:text-gray-300 text-lg mb-4">
                    Kata Sandi
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Password */}
                    <div>
                      <label htmlFor="password" className="block mb-2 font-medium text-gray-700 dark:text-gray-300 text-sm">
                        Kata Sandi <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        id="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        className="w-full bg-white dark:bg-gray-600 shadow-sm px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-gray-100 text-sm"
                        placeholder="Masukkan kata sandi"
                        required
                      />
                      {errors.password && <p className="mt-1 text-red-500 text-sm">{errors.password}</p>}
                    </div>

                    {/* Password Confirmation */}
                    <div>
                      <label htmlFor="password_confirmation" className="block mb-2 font-medium text-gray-700 dark:text-gray-300 text-sm">
                        Konfirmasi Kata Sandi <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        id="password_confirmation"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        className="w-full bg-white dark:bg-gray-600 shadow-sm px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-gray-100 text-sm"
                        placeholder="Ulangi kata sandi"
                        required
                      />
                      {errors.password_confirmation && <p className="mt-1 text-red-500 text-sm">{errors.password_confirmation}</p>}
                    </div>
                  </div>
                </div>

                {/* Status Section */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 sm:p-6 rounded-lg">
                  <h3 className="font-medium text-gray-700 dark:text-gray-300 text-lg mb-4">
                    Status
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Status */}
                    <div>
                      <label htmlFor="status" className="block mb-2 font-medium text-gray-700 dark:text-gray-300 text-sm">
                        Status Pegawai
                      </label>
                      <select
                        id="status"
                        value={data.status}
                        onChange={(e) => setData('status', e.target.value)}
                        className="w-full bg-white dark:bg-gray-600 shadow-sm px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-gray-100 text-sm"
                      >
                        <option value="available">Available</option>
                        <option value="assigned">Assigned</option>
                        <option value="on leave">On Leave</option>
                      </select>
                      {errors.status && <p className="mt-1 text-red-500 text-sm">{errors.status}</p>}
                    </div>

                    {/* Cuti */}
                    <div>
                      <label htmlFor="cuti" className="block mb-2 font-medium text-gray-700 dark:text-gray-300 text-sm">
                        Status Cuti
                      </label>
                      <select
                        id="cuti"
                        value={data.cuti}
                        onChange={(e) => setData('cuti', e.target.value)}
                        className="w-full bg-white dark:bg-gray-600 shadow-sm px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-gray-100 text-sm"
                      >
                        <option value="no">Tidak</option>
                        <option value="yes">Ya</option>
                      </select>
                      {errors.cuti && <p className="mt-1 text-red-500 text-sm">{errors.cuti}</p>}
                    </div>
                  </div>
                </div>

                {/* Sub Sections */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 sm:p-6 rounded-lg">
                  <h3 className="font-medium text-gray-700 dark:text-gray-300 text-lg mb-4">
                    Sub Section
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {uniqueSubSections?.filter(subSection => subSection !== 'All').map((subSection) => (
                      <label
                        key={subSection}
                        className="flex items-center p-3 bg-white dark:bg-gray-600 rounded-md border border-gray-200 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500 cursor-pointer transition-colors duration-200"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSubSections.includes(subSection)}
                          onChange={() => handleSubSectionToggle(subSection)}
                          className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <span className="ml-2 text-sm text-gray-900 dark:text-gray-100">{subSection}</span>
                      </label>
                    ))}
                  </div>
                  {errors.sub_sections && <p className="mt-2 text-red-500 text-sm">{errors.sub_sections}</p>}
                </div>

                {/* Submit Button */}
                <div className="flex flex-col sm:flex-row gap-3 justify-end">
                  <Link
                    href={route('employee-attendance.index')}
                    className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-md font-medium text-white text-sm transition-colors duration-200 text-center"
                  >
                    Batal
                  </Link>
                  <button
                    type="submit"
                    disabled={processing}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-4 py-2 rounded-md font-medium text-white text-sm transition-colors duration-200"
                  >
                    {processing ? 'Menyimpan...' : 'Simpan Pegawai'}
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