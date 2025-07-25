import React, { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import localizedFormat from 'dayjs/plugin/localizedFormat';

dayjs.extend(localizedFormat);
dayjs.locale('id');

const LunchCouponsCard = ({ initialDate, formatDate }) => {
    const [date, setDate] = useState(initialDate || dayjs().format('YYYY-MM-DD'));
    const [totalCoupons, setTotalCoupons] = useState(0);
    const [pendingCoupons, setPendingCoupons] = useState(0);
    const [claimedCoupons, setClaimedCoupons] = useState(0);
    const [todayCouponsData, setTodayCouponsData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchCouponData();
    }, [date]);

    const fetchCouponData = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(route('dashboard.lunch-coupons.by-date', { date }));
            const data = await response.json();
            
            setTotalCoupons(data.total);
            setPendingCoupons(data.pending);
            setClaimedCoupons(data.claimed);
            setTodayCouponsData(data.details || []);
        } catch (error) {
            console.error('Error fetching lunch coupons data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formattedDate = dayjs(date).format('dddd, D MMMM YYYY');

    return (
        <div className="bg-white p-4 rounded-lg shadow relative">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Today's Lunch Coupons</h3>
                <Link 
                    href={route('lunch-coupons.index')} 
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                    View All
                </Link>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
            ) : (
                <>
                    <div className="mb-2 text-sm text-gray-600">
                        <span className="font-medium">Date:</span> {formattedDate}
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-800">{totalCoupons}</div>
                            <div className="text-sm text-gray-500">Total</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">{pendingCoupons}</div>
                            <div className="text-sm text-gray-500">Pending</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{claimedCoupons}</div>
                            <div className="text-sm text-gray-500">Claimed</div>
                        </div>
                    </div>

                    <div className="mt-4 mb-4">
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        />
                    </div>

                    <div className="mt-6">
                        <h4 className="text-md font-medium mb-3">Coupon Details</h4>
                        <div className="overflow-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sub-Section</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {todayCouponsData.length > 0 ? (
                                        todayCouponsData.map((coupon, index) => (
                                            <tr key={index}>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm">
                                                    {coupon.date ? formatDate(coupon.date) : 'N/A'}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm">
                                                    {coupon.employee?.name || 'N/A'}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm">
                                                    {coupon.section?.name || 'N/A'}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm">
                                                    {coupon.sub_section?.name || 'N/A'}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm">
                                                    {coupon.status ? (
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            coupon.status === 'claimed' 
                                                                ? 'bg-green-100 text-green-800' 
                                                                : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                            {coupon.status === 'claimed' ? 'Claimed' : 'Pending'}
                                                        </span>
                                                    ) : 'N/A'}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-4 text-center text-sm text-gray-500">
                                                No lunch coupons for selected date
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default LunchCouponsCard;