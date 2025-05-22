import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const data = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [
        {
            label: 'Sales',
            data: [12, 19, 3, 5, 2],
            backgroundColor: 'rgba(59, 130, 246, 0.6)', // Tailwind blue-500 with opacity
        },
    ],
};

const options = {
    responsive: true,
    maintainAspectRatio: false, // Add this
    plugins: {
        legend: {
            position: 'top',
        },
        title: {
            display: true,
            text: 'Monthly Sales',
        },
    },
};



export default function Dashboard() {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-2xl font-semibold text-gray-800">
                    Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="p-4">
                <div className="px-16 grid grid-cols-4 gap-2">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            sample
                        </div>
                    </div>
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            sample
                        </div>
                    </div>
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            sample
                        </div>
                    </div>
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            sample
                        </div>
                    </div>
                </div>
                <div className="mx-auto max-w-7xl py-2">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg p-6 h-96">
                        <Bar data={data} options={options} className="h-full w-full" />
                    </div>
                </div>


            </div>
        </AuthenticatedLayout>
    );
}
