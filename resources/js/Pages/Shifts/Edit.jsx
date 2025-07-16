import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import { useEffect } from 'react';

// Helper function to format time to HH:mm
const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
};

export default function Edit({ auth, shift }) {
    const { data, setData, put, processing, errors } = useForm({
        name: shift.name,
        start_time: formatTime(shift.start_time),
        end_time: formatTime(shift.end_time),
        hours: shift.hours,
    });

    // Calculate hours when start or end time changes
    useEffect(() => {
        if (data.start_time && data.end_time) {
            const start = new Date(`2000-01-01T${data.start_time}`);
            const end = new Date(`2000-01-01T${data.end_time}`);
            
            if (end > start) {
                const diffMs = end - start;
                const diffHours = diffMs / (1000 * 60 * 60);
                setData('hours', diffHours.toFixed(2));
            }
        }
    }, [data.start_time, data.end_time]);

    const submit = (e) => {
        e.preventDefault();
        put(route('shifts.update', shift.id));
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Edit Shift</h2>}
        >
            <Head title="Edit Shift" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            <form onSubmit={submit} className="space-y-6">
                                <div>
                                    <InputLabel htmlFor="name" value="Shift Name" />
                                    <TextInput
                                        id="name"
                                        className="mt-1 block w-full bg-gray-100 dark:bg-gray-700"
                                        value={data.name}
                                        readOnly
                                    />
                                </div>

                                <div>
                                    <InputLabel htmlFor="start_time" value="Start Time" />
                                    <TextInput
                                        id="start_time"
                                        type="time"
                                        className="mt-1 block w-full"
                                        value={data.start_time}
                                        onChange={(e) => setData('start_time', e.target.value)}
                                        required
                                    />
                                    <InputError className="mt-2" message={errors.start_time} />
                                </div>

                                <div>
                                    <InputLabel htmlFor="end_time" value="End Time" />
                                    <TextInput
                                        id="end_time"
                                        type="time"
                                        className="mt-1 block w-full"
                                        value={data.end_time}
                                        onChange={(e) => setData('end_time', e.target.value)}
                                        required
                                    />
                                    <InputError className="mt-2" message={errors.end_time} />
                                </div>

                                <div>
                                    <InputLabel htmlFor="hours" value="Total Hours" />
                                    <TextInput
                                        id="hours"
                                        type="number"
                                        className="mt-1 block w-full bg-gray-100 dark:bg-gray-700"
                                        value={data.hours}
                                        readOnly
                                    />
                                </div>

                                <div className="flex items-center gap-4">
                                    <PrimaryButton disabled={processing}>
                                        Save Changes
                                    </PrimaryButton>

                                    <Link
                                        href={route('shifts.index')}
                                        className="inline-flex items-center px-4 py-2 bg-gray-800 dark:bg-gray-200 border border-transparent rounded-md font-semibold text-xs text-white dark:text-gray-800 uppercase tracking-widest hover:bg-gray-700 dark:hover:bg-white focus:bg-gray-700 dark:focus:bg-white active:bg-gray-900 dark:active:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition ease-in-out duration-150"
                                    >
                                        Cancel
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}