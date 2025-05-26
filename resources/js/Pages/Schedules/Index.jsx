import React from 'react';
import { usePage } from '@inertiajs/react';
import dayjs from 'dayjs';
import 'dayjs/locale/id'; // Impor lokal bahasa Indonesia
import localizedFormat from 'dayjs/plugin/localizedFormat'; // Plugin untuk format lokal
import isToday from 'dayjs/plugin/isToday'; // Plugin untuk mengecek apakah hari ini
import isTomorrow from 'dayjs/plugin/isTomorrow'; // Plugin untuk mengecek apakah besok
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

// Aktifkan plugin dayjs
dayjs.extend(localizedFormat);
dayjs.extend(isToday);
dayjs.extend(isTomorrow);
dayjs.locale('id'); // Set lokal ke bahasa Indonesia

const ScheduleSection = ({ title, schedulesBySubSection }) => (
  <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">{title}</h2>
    {Object.keys(schedulesBySubSection).length === 0 ? (
      <p className="text-gray-600 dark:text-gray-400 italic">Tidak ada penjadwalan di bagian ini.</p>
    ) : (
      Object.entries(schedulesBySubSection).map(([subSectionName, employeesWithDetails]) => (
        <div key={subSectionName} className="mb-6 border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0 last:pb-0">
          <h3 className="text-lg font-medium mb-3 text-blue-700 dark:text-blue-400">{subSectionName}</h3>
          <div className="overflow-x-auto rounded-lg shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Nama Pegawai
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    NIK
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tipe
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Sub-Section
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Section
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {employeesWithDetails.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {item.employee.name || 'Nama Pegawai Tidak Diketahui'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {item.employee.nik || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {item.employee.type || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {item.employee.status || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {item.sub_section?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {item.sub_section?.section?.name || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))
    )}
  </div>
);

const Index = () => {
  const { schedules } = usePage().props;

  // Kelompokkan jadwal berdasarkan hari dan sub-section
  const groupedSchedules = schedules.reduce((acc, schedule) => {
    const date = dayjs(schedule.date);
    let dayKey = '';

    if (date.isToday()) {
      dayKey = 'today';
    } else if (date.isTomorrow()) {
      dayKey = 'tomorrow';
    } else {
      // For other dates, you can add logic here if needed
      // For now, we'll only display today and tomorrow.
      return acc;
    }

    if (!acc[dayKey]) {
      acc[dayKey] = {};
    }

    const subSectionName = schedule.sub_section?.name || 'Lain-lain';
    if (!acc[dayKey][subSectionName]) {
      acc[dayKey][subSectionName] = [];
    }
    // Push an object containing both employee and sub_section details
    acc[dayKey][subSectionName].push({
      employee: schedule.employee,
      sub_section: schedule.sub_section // This will contain section if eager loaded
    });

    return acc;
  }, {});

  const todaySchedules = groupedSchedules.today || {};
  const tomorrowSchedules = groupedSchedules.tomorrow || {};

  return (
    <AuthenticatedLayout
    header={
      <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
        Agenda Penjadwalan
      </h2>
    }
  >
    <div className="max-w-5xl mx-auto mt-10 p-4">
      <h1 className="text-3xl font-extrabold mb-8 text-center text-gray-900 dark:text-gray-100">Agenda Penjadwalan</h1>

      {Object.keys(todaySchedules).length === 0 && Object.keys(tomorrowSchedules).length === 0 ? (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200 rounded-md" role="alert">
          <p className="font-bold">Informasi:</p>
          <p>Belum ada penjadwalan untuk hari ini atau besok. Santai saja!</p>
        </div>
      ) : (
        <>
          {/* Hari Ini */}
          <ScheduleSection
            title={`Jadwal Hari Ini (${dayjs().format('dddd, DD MMMMYYYY')})`}
            schedulesBySubSection={todaySchedules}
          />
          <hr className="my-10 border-t-2 border-gray-200 dark:border-gray-700" />

          {/* Besok */}
          <ScheduleSection
            title={`Jadwal Besok (${dayjs().add(1, 'day').format('dddd, DD MMMMYYYY')})`}
            schedulesBySubSection={tomorrowSchedules}
          />
        </>
      )}
    </div>
    </AuthenticatedLayout>
  );
};

export default Index;
