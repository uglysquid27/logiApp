export default function GenderStats({ genderStats, request, selectedIds, allSortedEligibleEmployees }) {
    return (
        <>
            {(request.male_count > 0 || request.female_count > 0) && (
                <div className="bg-white dark:bg-gray-800 shadow-md mb-6 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="mb-3 font-bold text-lg text-gray-900 dark:text-gray-100">Persyaratan Gender</h3>
                    <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
                        {request.male_count > 0 && (
                            <div className={`p-4 rounded-lg border-2 transition-colors ${
                                genderStats.male < genderStats.required_male 
                                    ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-600' 
                                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600'
                            }`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-blue-900 dark:text-blue-300 text-sm font-medium">👨 Laki-laki Dibutuhkan</p>
                                        <p className="font-bold text-2xl text-gray-900 dark:text-gray-100">
                                            {genderStats.male} / {genderStats.required_male}
                                        </p>
                                    </div>
                                    <div className="text-3xl">
                                        {genderStats.male >= genderStats.required_male ? '✅' : '❌'}
                                    </div>
                                </div>
                                {genderStats.male < genderStats.required_male && (
                                    <p className="text-red-600 dark:text-red-400 text-xs mt-1">
                                        Kurang {genderStats.required_male - genderStats.male} orang
                                    </p>
                                )}
                            </div>
                        )}
                        {request.female_count > 0 && (
                            <div className={`p-4 rounded-lg border-2 transition-colors ${
                                genderStats.female < genderStats.required_female 
                                    ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-600' 
                                    : 'bg-pink-50 dark:bg-pink-900/20 border-pink-300 dark:border-pink-600'
                            }`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-pink-900 dark:text-pink-300 text-sm font-medium">👩 Perempuan Dibutuhkan</p>
                                        <p className="font-bold text-2xl text-gray-900 dark:text-gray-100">
                                            {genderStats.female} / {genderStats.required_female}
                                        </p>
                                    </div>
                                    <div className="text-3xl">
                                        {genderStats.female >= genderStats.required_female ? '✅' : '❌'}
                                    </div>
                                </div>
                                {genderStats.female < genderStats.required_female && (
                                    <p className="text-red-600 dark:text-red-400 text-xs mt-1">
                                        Kurang {genderStats.required_female - genderStats.female} orang
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 shadow-md mb-6 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="mb-3 font-bold text-lg text-gray-900 dark:text-gray-100">Distribusi Gender & Tipe</h3>
                <div className="gap-4 grid grid-cols-2 md:grid-cols-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 border border-blue-200 dark:border-blue-700 rounded-lg">
                        <div className="text-center">
                            <div className="text-2xl mb-1">👥</div>
                            <p className="text-blue-800 dark:text-blue-300 text-sm font-medium">Total Terpilih</p>
                            <p className="font-bold text-2xl text-gray-900 dark:text-gray-100">{genderStats.total}</p>
                        </div>
                    </div>

                    {request.male_count > 0 && (
                        <div className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800/20 dark:to-blue-700/20 p-4 border border-blue-300 dark:border-blue-600 rounded-lg">
                            <div className="text-center">
                                <div className="text-2xl mb-1">👨</div>
                                <p className="text-blue-900 dark:text-blue-300 text-sm font-medium">Laki-laki</p>
                                <p className="font-bold text-2xl text-gray-900 dark:text-gray-100">{genderStats.male}</p>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    {genderStats.male_bulanan > 0 && <span className="block">Bulanan: {genderStats.male_bulanan}</span>}
                                    {genderStats.male_harian > 0 && <span className="block">Harian: {genderStats.male_harian}</span>}
                                </div>
                            </div>
                        </div>
                    )}

                    {request.female_count > 0 && (
                        <div className="bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-800/20 dark:to-pink-700/20 p-4 border border-pink-300 dark:border-pink-600 rounded-lg">
                            <div className="text-center">
                                <div className="text-2xl mb-1">👩</div>
                                <p className="text-pink-900 dark:text-pink-300 text-sm font-medium">Perempuan</p>
                                <p className="font-bold text-2xl text-gray-900 dark:text-gray-100">{genderStats.female}</p>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    {genderStats.female_bulanan > 0 && <span className="block">Bulanan: {genderStats.female_bulanan}</span>}
                                    {genderStats.female_harian > 0 && <span className="block">Harian: {genderStats.female_harian}</span>}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 p-4 border border-gray-300 dark:border-gray-500 rounded-lg">
                        <div className="text-center">
                            <div className="text-2xl mb-1">📊</div>
                            <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">Status</p>
                            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 mt-2">
                                {genderStats.current_scheduled > 0 && (
                                    <div className="flex items-center justify-center gap-1">
                                        <span className="text-green-600 dark:text-green-400">📅</span>
                                        <span>Dijadwalkan: {genderStats.current_scheduled}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-center gap-1">
                                    <span className="text-blue-600 dark:text-blue-400">🆕</span>
                                    <span>Baru: {genderStats.total - genderStats.current_scheduled}</span>
                                </div>
                                {(genderStats.male_bulanan === 0 && genderStats.female_bulanan === 0 &&
                                    genderStats.male_harian === 0 && genderStats.female_harian === 0 &&
                                    genderStats.current_scheduled === 0) && (
                                    <p className="text-gray-400 dark:text-gray-500">Tidak ada data</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}