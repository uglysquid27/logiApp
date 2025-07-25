import React, { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import localizedFormat from 'dayjs/plugin/localizedFormat';

dayjs.extend(localizedFormat);
dayjs.locale('id');

const LunchCouponsCard = ({ initialDate }) => {
    const [date, setDate] = useState(initialDate || dayjs().format('YYYY-MM-DD'));
    const [totalCoupons, setTotalCoupons] = useState(0);
    const [pendingCoupons, setPendingCoupons] = useState(0);
    const [claimedCoupons, setClaimedCoupons] = useState(0);
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

                    <div className="grid grid-cols-3 gap-4">
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

                    <div className="mt-4">
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default LunchCouponsCard;