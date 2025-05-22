import React from 'react';
import { usePage } from '@inertiajs/react';
import dayjs from 'dayjs';
import 'dayjs/locale/id'; // Impor lokal bahasa Indonesia
import localizedFormat from 'dayjs/plugin/localizedFormat'; // Plugin untuk format lokal
import isToday from 'dayjs/plugin/isToday'; // Plugin untuk mengecek apakah hari ini
import isTomorrow from 'dayjs/plugin/isTomorrow'; // Plugin untuk mengecek apakah besok

// Aktifkan plugin dayjs
dayjs.extend(localizedFormat);
dayjs.extend(isToday);
dayjs.extend(isTomorrow);
dayjs.locale('id'); // Set lokal ke bahasa Indonesia

const ScheduleSection = ({ title, schedulesBySubSection }) => (
  <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
    <h2 className="text-xl font-semibold mb-4 text-gray-800">{title}</h2>
    {Object.keys(schedulesBySubSection).length === 0 ? (
      <p className="text-gray-600 italic">Tidak ada penjadwalan di bagian ini.</p>
    ) : (
      Object.entries(schedulesBySubSection).map(([subSectionName, employees]) => (
        <div key={subSectionName} className="mb-6 border-b pb-4 last:border-b-0 last:pb-0">
          <h3 className="text-lg font-medium mb-3 text-blue-700">{subSectionName}</h3>
          <ul className="list-disc list-inside space-y-2">
            {employees.map((employee, index) => (
              <li key={index} className="text-gray-700">
                {employee.name || 'Nama Pegawai Tidak Diketahui'}
              </li>
            ))}
          </ul>
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
      // Untuk tanggal lain jika ada, bisa ditambahkan logika di sini
      return acc;
    }

    if (!acc[dayKey]) {
      acc[dayKey] = {};
    }

    const subSectionName = schedule.sub_section?.name || 'Lain-lain';
    if (!acc[dayKey][subSectionName]) {
      acc[dayKey][subSectionName] = [];
    }
    acc[dayKey][subSectionName].push(schedule.employee);

    return acc;
  }, {});

  const todaySchedules = groupedSchedules.today || {};
  const tomorrowSchedules = groupedSchedules.tomorrow || {};

  return (
    <div className="max-w-5xl mx-auto mt-10 p-4">
      <h1 className="text-3xl font-extrabold mb-8 text-center text-gray-900">Agenda Penjadwalan</h1>

      {Object.keys(todaySchedules).length === 0 && Object.keys(tomorrowSchedules).length === 0 ? (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4" role="alert">
          <p className="font-bold">Informasi:</p>
          <p>Belum ada penjadwalan untuk hari ini atau besok. Santai saja!</p>
        </div>
      ) : (
        <>
          {/* Hari Ini */}
          <ScheduleSection
            title={`Jadwal Hari Ini (${dayjs().format('dddd, DD MMMM YYYY')})`}
            schedulesBySubSection={todaySchedules}
          />
          <hr className="my-10 border-t-2 border-gray-200" />

          {/* Besok */}
          <ScheduleSection
            title={`Jadwal Besok (${dayjs().add(1, 'day').format('dddd, DD MMMM YYYY')})`}
            schedulesBySubSection={tomorrowSchedules}
          />
        </>
      )}
    </div>
  );
};

export default Index;