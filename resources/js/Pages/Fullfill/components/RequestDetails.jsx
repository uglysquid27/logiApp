import dayjs from 'dayjs';

export default function RequestDetails({ request, auth }) {
    return (
        <div className="bg-white dark:bg-gray-800 shadow-md dark:shadow-gray-700/50 mb-6 p-4 rounded-lg">
            <h3 className="mb-3 font-bold text-lg text-gray-900 dark:text-gray-100">Detail Permintaan</h3>
            <div className="space-y-2 text-gray-700 dark:text-gray-300">
                <p>
                    <strong className="text-gray-900 dark:text-gray-200">Tanggal:</strong> {dayjs(request.date).format('DD MMMM YYYY')}
                </p>
                <p>
                    <strong className="text-gray-900 dark:text-gray-200">Sub Section:</strong> {request.sub_section?.name}
                </p>
                <p>
                    <strong className="text-gray-900 dark:text-gray-200">Jumlah Diminta:</strong> {request.requested_amount}
                </p>
                <p>
                    <strong className="text-gray-900 dark:text-gray-200">Status:</strong> 
                    <span className={`ml-1 px-2 py-1 text-xs rounded-full ${
                        request.status === 'fulfilled' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                    }`}>
                        {request.status === 'fulfilled' ? 'Sudah dipenuhi' : 'Belum dipenuhi'}
                    </span>
                </p>
                <p>
                    <strong className="text-gray-900 dark:text-gray-200">Diproses oleh:</strong> 
                    <span className="text-gray-600 dark:text-gray-400">
                        {auth.user.name} ({auth.user.email})
                    </span>
                </p>
            </div>
        </div>
    );
}