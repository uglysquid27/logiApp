export default function GenderStats({ genderStats, request, selectedIds, allSortedEligibleEmployees }) {
    return (
        <>
            {(request.male_count > 0 || request.female_count > 0) && (
                <div className="bg-white shadow-md mb-6 p-4 rounded-lg">
                    <h3 className="mb-3 font-bold text-lg">Persyaratan Gender</h3>
                    <div className="gap-4 grid grid-cols-2">
                        {request.male_count > 0 && (
                            <div className={`bg-blue-100 p-3 rounded-lg border ${genderStats.male < genderStats.required_male ? 'border-red-500' : 'border-blue-200'}`}>
                                <p className="text-blue-900 text-sm">Laki-laki Dibutuhkan</p>
                                <p className="font-bold text-xl">{genderStats.male} / {genderStats.required_male}</p>
                            </div>
                        )}
                        {request.female_count > 0 && (
                            <div className={`bg-pink-100 p-3 rounded-lg border ${genderStats.female < genderStats.required_female ? 'border-red-500' : 'border-pink-200'}`}>
                                <p className="text-pink-900 text-sm">Perempuan Dibutuhkan</p>
                                <p className="font-bold text-xl">{genderStats.female} / {genderStats.required_female}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="bg-white shadow-md mb-6 p-4 rounded-lg">
                <h3 className="mb-3 font-bold text-lg">Distribusi Gender</h3>
                <div className="gap-4 grid grid-cols-2 md:grid-cols-4">
                    <div className="bg-blue-50 p-3 border border-blue-100 rounded-lg">
                        <p className="text-blue-800 text-sm">Total Terpilih</p>
                        <p className="font-bold text-xl">{genderStats.total}</p>
                    </div>
                    {request.male_count > 0 && (
                        <div className="bg-blue-100 p-3 border border-blue-200 rounded-lg">
                            <p className="text-blue-900 text-sm">Laki-laki</p>
                            <p className="font-bold text-xl">{genderStats.male}</p>
                        </div>
                    )}
                    {request.female_count > 0 && (
                        <div className="bg-pink-100 p-3 border border-pink-200 rounded-lg">
                            <p className="text-pink-900 text-sm">Perempuan</p>
                            <p className="font-bold text-xl">{genderStats.female}</p>
                        </div>
                    )}
                    <div className="bg-gray-50 p-3 border border-gray-200 rounded-lg">
                        {genderStats.male_bulanan > 0 && <p className="text-sm">Laki Bulanan: {genderStats.male_bulanan}</p>}
                        {genderStats.female_bulanan > 0 && <p className="text-sm">Perempuan Bulanan: {genderStats.female_bulanan}</p>}
                        {genderStats.male_harian > 0 && <p className="text-sm">Laki Harian: {genderStats.male_harian}</p>}
                        {genderStats.female_harian > 0 && <p className="text-sm">Perempuan Harian: {genderStats.female_harian}</p>}
                        {genderStats.current_scheduled > 0 && <p className="text-sm text-green-600">Sudah dijadwalkan: {genderStats.current_scheduled}</p>}
                        {(genderStats.male_bulanan === 0 && genderStats.female_bulanan === 0 &&
                            genderStats.male_harian === 0 && genderStats.female_harian === 0) && (
                                <p className="text-gray-400 text-sm">Tidak ada data</p>
                            )}
                    </div>
                </div>
            </div>
        </>
    );
}