import React, { useState, useEffect } from 'react';
import { Rating } from '@smastrom/react-rating';
import '@smastrom/react-rating/style.css';
import { Inertia } from '@inertiajs/inertia';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FaStar } from 'react-icons/fa';
import { BiCommentDetail } from 'react-icons/bi';
import { MdCheckCircleOutline } from 'react-icons/md';
import { ImSpinner8 } from 'react-icons/im';

export default function RateEmployee({ employee, requestId, ratingData, commentTemplates = [] }) {
    const { flash = {} } = usePage().props;
    const [rating, setRating] = useState(ratingData?.rating || 0);
    const [selectedTags, setSelectedTags] = useState(ratingData?.tags || []);
    const [customComment, setCustomComment] = useState(ratingData?.comment || '');
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const hasRated = ratingData?.rating !== null && ratingData?.rating !== undefined;

    useEffect(() => {
        if (flash.success) {
            setShowSuccess(true);
            const timer = setTimeout(() => setShowSuccess(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [flash.success]);

    const handleTagClick = (tag) => {
        setSelectedTags(prev => 
            prev.includes(tag) 
                ? prev.filter(t => t !== tag) 
                : [...prev, tag]
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        const combinedComment = [
            ...selectedTags,
            ...(customComment.trim() ? [customComment.trim()] : [])
        ].join(', ');

        const url = hasRated 
            ? `/ratings/${ratingData.id}`
            : '/ratings';

        const method = hasRated ? 'put' : 'post';

        router[method](url, {
            rating,
            comment: combinedComment,
            employee_id: employee.id,
            request_id: requestId,
            tags: selectedTags
        }, {
            onFinish: () => setIsSubmitting(false),
            onError: (errors) => {
                setErrors(errors);
                setIsSubmitting(false);
            }
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Rate ${employee.name}`} />
            <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8 bg-white dark:bg-[#282828] rounded-lg shadow-xl p-8">
                    <div>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                            {hasRated ? 'Update Your Rating' : `Rate ${employee.name}`}
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
                            Your feedback helps us improve our service.
                        </p>
                    </div>

                    {showSuccess && (
                        <div className="rounded-md bg-green-50 p-4 border border-green-200">
                            <div className="flex">
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-green-800">
                                        {flash.success}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    )}

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="rating" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    <FaStar className="inline-block mr-1 text-yellow-500" /> Select Rating
                                </label>
                                <Rating
                                    style={{ maxWidth: 250, margin: '0 auto' }}
                                    value={rating}
                                    onChange={setRating}
                                    precision={0.5}
                                    transition
                                    fillColor="#FBBF24"
                                    emptyColor="#D1D5DB"
                                />
                            </div>

                            <div>
                                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    <BiCommentDetail className="inline-block mr-1 text-gray-500 dark:text-gray-400" /> Select or Add Comments
                                </label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {commentTemplates.map((template, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            className={`rounded-full px-3 py-1 text-sm focus:outline-none ${
                                                selectedTags.includes(template)
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                            }`}
                                            onClick={() => handleTagClick(template)}
                                        >
                                            {template}
                                        </button>
                                    ))}
                                </div>
                                <textarea
                                    id="comment"
                                    rows="3"
                                    placeholder="Add your additional comments here (optional)"
                                    value={customComment}
                                    onChange={(e) => setCustomComment(e.target.value)}
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-[#1f1f1f] dark:text-gray-200 mt-2"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                                    rating === 0 || isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                                }`}
                                disabled={rating === 0 || isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <ImSpinner8 className="animate-spin h-5 w-5 mr-2" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                            <MdCheckCircleOutline className="h-5 w-5 text-blue-500 group-hover:text-blue-400" aria-hidden="true" />
                                        </span>
                                        {hasRated ? 'Update Rating' : 'Submit Rating'}
                                    </>
                                )}
                            </button>
                        </div>

                        {Object.keys(errors).length > 0 && (
                            <div className="rounded-md bg-red-50 p-4">
                                <div className="flex">
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800">
                                            There were errors with your submission
                                        </h3>
                                        <div className="mt-2 text-sm text-red-700">
                                            <ul className="list-disc pl-5">
                                                {Object.values(errors).map((error, index) => (
                                                    <li key={index}>{error}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}