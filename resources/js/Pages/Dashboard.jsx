import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer } from '@/Animations';
import ErrorBoundary from '@/Components/Dashboard/ErrorBoundary';
import SummaryCards from '@/Components/Dashboard/SummaryCards';
import DateFilter from '@/Components/Dashboard/DateFilter';
import ManpowerChart from '@/Components/Dashboard/ManpowerChart';
import EmployeeChart from '@/Components/Dashboard/EmployeeChart';
import PendingRequestsTable from '@/Components/Dashboard/PendingRequestsTable';
import UpcomingSchedulesTable from '@/Components/Dashboard/UpcomingSchedulesTables';
import DetailModal from '@/Components/Dashboard/DetailModal';
import LunchCouponsCard from '@/Components/Dashboard/LunchCouponsCard';
import dayjs from 'dayjs';

export default function Dashboard() {
    const { props } = usePage();
    const {
        summary = {},
        manpowerRequestChartData: initialManpowerRequestChartData = { labels: [], datasets: [] },
        employeeAssignmentChartData: initialEmployeeAssignmentChartData = { labels: [], datasets: [] },
        recentPendingRequests = [],
        upcomingSchedules = [],
        sections = []
    } = props;

    const [componentHeights, setComponentHeights] = useState({
        chart1: 400,
        chart2: 400,
        table1: 400,
        table2: 400
    });

    const [filters, setFilters] = useState({
        dateRange: {
            from: dayjs().startOf('month').format('YYYY-MM-DD'),
            to: dayjs().endOf('month').format('YYYY-MM-DD')
        },
        section: null,
        subSection: null,
        shift: null
    });

    const [manpowerRequestChartData, setManpowerRequestChartData] = useState(initialManpowerRequestChartData);
    const [employeeAssignmentChartData, setEmployeeAssignmentChartData] = useState(initialEmployeeAssignmentChartData);
    const [modalState, setModalState] = useState({
        open: false,
        title: '',
        data: null,
        columns: [],
        url: ''
    });
    const [chartModalState, setChartModalState] = useState({
        open: false,
        title: '',
        data: null,
        columns: [],
        url: ''
    });

    const resetFilters = () => {
        setFilters({
            dateRange: {
                from: dayjs().startOf('month').format('YYYY-MM-DD'),
                to: dayjs().endOf('month').format('YYYY-MM-DD')
            },
            section: null,
            subSection: null,
            shift: null
        });

        setManpowerRequestChartData(initialManpowerRequestChartData);
        setEmployeeAssignmentChartData(initialEmployeeAssignmentChartData);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = dayjs(dateString);
        return date.isValid() ? date.format('DD MMMM YYYY') : 'N/A';
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        const date = dayjs(dateString);
        return date.isValid() ? date.format('DD MMMM HH:mm') : 'N/A';
    };

    const fetchModalData = async (url, query = '') => {
        try {
            const response = await fetch(query ? `${url}?${query}` : url);
            // Ensure response is OK before parsing
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Fetch error:', error);
            return { data: [], links: [] };
        }
    };

    const applyFilters = async (chartType) => {
        try {
            let url;
            const params = new URLSearchParams();

            params.append('from_date', filters.dateRange.from);
            params.append('to_date', filters.dateRange.to);

            if (chartType === 'manpowerRequests') {
                url = route('dashboard.manpower.requests.filtered');
                const response = await fetch(`${url}?${params.toString()}`);
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                setManpowerRequestChartData({
                    labels: data.labels,
                    datasets: data.datasets
                });
            } else { // chartType === 'employeeAssignments'
                url = route('dashboard.employee.assignments.filtered');
                // Always append section_id, use empty string if filters.section is null
                params.append('section_id', filters.section || '');
                const response = await fetch(`${url}?${params.toString()}`);
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                setEmployeeAssignmentChartData({
                    labels: data.labels,
                    datasets: data.datasets,
                    subSectionIds: data.subSectionIds
                });
            }
        } catch (error) {
            console.error('Error applying filters:', error);
            if (chartType === 'manpowerRequests') {
                setManpowerRequestChartData(initialManpowerRequestChartData);
            } else {
                setEmployeeAssignmentChartData(initialEmployeeAssignmentChartData);
            }
        }
    };

    const handleResize = (component) => (e) => {
        const newHeight = Math.max(200, e.target.value);
        setComponentHeights(prev => ({
            ...prev,
            [component]: newHeight
        }));
    };

    return (
        <ErrorBoundary>
            <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Dashboard</h2>}>
                <Head title="Dashboard" />

                <motion.div
                    initial="hidden"
                    animate="show"
                    variants={staggerContainer}
                    className="py-6 px-4 sm:px-6 lg:px-8"
                >
                    <SummaryCards
                        summary={summary}
                        setModalState={setModalState}
                        formatDate={formatDate}
                    />

                    <DateFilter
                        filters={filters}
                        setFilters={setFilters}
                        applyFilters={applyFilters}
                        resetFilters={resetFilters}
                    />

                    <div className="flex flex-col md:flex-row gap-6 mb-8">
                        <ManpowerChart
                            data={manpowerRequestChartData}
                            height={componentHeights.chart1}
                            handleResize={handleResize('chart1')}
                            setChartModalState={setChartModalState}
                            formatDate={formatDate}
                            fetchModalData={fetchModalData} 
                        />

                        <EmployeeChart
                            data={employeeAssignmentChartData}
                            height={componentHeights.chart2}
                            handleResize={handleResize('chart2')}
                            setChartModalState={setChartModalState}
                            sections={sections}
                            filters={filters}
                            setFilters={setFilters}
                            formatDate={formatDate}
                            fetchModalData={fetchModalData} 
                            applyFilters={applyFilters} 
                        />
                    </div>

                    <div className="flex flex-col md:flex-row gap-6">
                        <PendingRequestsTable
                            data={recentPendingRequests}
                            height={componentHeights.table1}
                            handleResize={handleResize('table1')}
                            formatDate={formatDate}
                        />

                        <UpcomingSchedulesTable
                            data={upcomingSchedules}
                            height={componentHeights.table2}
                            handleResize={handleResize('table2')}
                            formatDate={formatDate}
                        />
                    </div>

                    <div className="my-6">
                        <LunchCouponsCard   
                            formatDate={formatDate} 
                        />
                    </div>

                    <DetailModal
                        isOpen={modalState.open}
                        onClose={() => setModalState(prev => ({ ...prev, open: false }))}
                        title={modalState.title}
                        data={modalState.data}
                        columns={modalState.columns}
                        formatDate={formatDateTime}
                        onFilterOrPaginate={(url, query) => {
                            return fetchModalData(url, query).then(data => {
                                setModalState(prev => ({ ...prev, data }));
                            });
                        }}
                    />

                    <DetailModal
                        isOpen={chartModalState.open}
                        onClose={() => setChartModalState(prev => ({ ...prev, open: false }))}
                        title={chartModalState.title}
                        data={chartModalState.data}
                        columns={chartModalState.columns}
                        formatDate={formatDateTime}
                        onFilterOrPaginate={(url, query) => {
                            return fetchModalData(url, query).then(data => {
                                setChartModalState(prev => ({ ...prev, data }));
                            });
                        }}
                    />
                </motion.div>
            </AuthenticatedLayout>
        </ErrorBoundary>
    );
}