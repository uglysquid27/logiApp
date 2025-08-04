import dayjs from 'dayjs';

export default function RequestDetails({ request, auth }) {
    return (
        <div className="bg-white shadow-md mb-6 p-4 rounded-lg">
            <h3 className="mb-3 font-bold text-lg">Detail Permintaan</h3>
            <p><strong>Tanggal:</strong> {dayjs(request.date).format('DD MMMM YYYY')}</p>
            <p><strong>Sub Section:</strong> {request.sub_section?.name}</p>
            <p><strong>Jumlah Diminta:</strong> {request.requested_amount}</p>
            <p><strong>Status:</strong> {request.status === 'fulfilled' ? 'Sudah dipenuhi' : 'Belum dipenuhi'}</p>
            <p><strong>Diproses oleh:</strong> {auth.user.name} ({auth.user.email})</p>
        </div>
    );
}