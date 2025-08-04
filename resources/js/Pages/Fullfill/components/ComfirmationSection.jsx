export default function ConfirmationSection({ auth, processing }) {
    return (
        <div className="bg-white shadow-md mb-6 p-4 rounded-lg">
            <h3 className="mb-3 font-bold text-lg">Konfirmasi</h3>
            <p className="text-gray-600 mb-4">Anda akan mengirim permintaan ini sebagai: {auth.user.name}</p>
            <button
                type="submit"
                disabled={processing}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 px-6 py-3 rounded-lg text-white transition duration-200"
            >
                {processing ? 'Menyimpan...' : 'Submit Permintaan'}
            </button>
        </div>
    );
}