import React from 'react';
import { Link } from '@inertiajs/inertia-react';
// import Navbar from '@/Layouts/navbar';
// import Footer from '@/Layouts/footer';
import { FaCar, FaCalendarCheck, FaClock } from 'react-icons/fa';

export default function Home() {
    return (
        <div className="font-poppins max-sm:pt-20 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 transition-colors duration-500 ease-in-out">
            {/* Hero Section */}
            <section id="hero" className="relative min-h-screen flex items-center overflow-hidden">
                {/* <Navbar /> */}

                {/* Main Hero Content */}
                <div className="relative z-10 container mx-auto px-6 md:px-12 lg:px-20 py-16 flex flex-col lg:flex-row items-center justify-center lg:space-x-10">
                    {/* Text Content */}
                    <div className="lg:w-1/2 mb-10 lg:mb-0 text-center lg:text-left">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 dark:text-gray-100 mb-6">
                            Koordinasi <span className="text-blue-600 dark:text-blue-400">Transportasi</span> yang <span className="text-green-600 dark:text-green-400">Efisien</span>.
                        </h1>
                        <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8 italic">
                            Atur setiap perjalanan kantor dengan mulus dan efisien.
                        </p>
                        <p className="text-md md:text-lg text-gray-600 dark:text-gray-400 mb-8">
                            Tingkatkan produktivitas tim Anda dengan sistem pemesanan transportasi terpusat. Pantau lokasi kendaraan secara langsung, catat perjalanan secara otomatis, dan pastikan setiap penugasan sopir aman dan terkelola dengan baik.
                        </p>
                        <div className="flex justify-center lg:justify-start">
                            <Link
                                href={route('login')}
                                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-full shadow-lg transition duration-300 ease-in-out"
                            >
                                <span className="flex items-center">
                                    <FaCar className="mr-2" /> Pesan Perjalanan
                                </span>
                            </Link>
                        </div>
                    </div>

                    {/* Image Content */}
                    <div className="lg:w-1/2 flex items-center justify-center">
                        <img src="/img/vectorHero.png" alt="Ilustrasi Transportasi Korporat" className="max-w-md lg:max-w-xl rounded-lg w-full" />
                    </div>
                </div>

                {/* Cloud-like Wave SVG at Bottom */}
                {/* Cloud-like Wave SVG at Bottom */}
                <div className="absolute bottom-0 left-0 w-full z-0 overflow-hidden">
                    <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="w-full h-auto">
                        {/* Cloud Wave 1 - Light Blue (Dark Mode: Dark Blue) */}
                        <path
                            fill="#a9d7fc"
                            fillOpacity="1"
                            className="dark:fill-[#1e3a8a]"
                            d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,208C672,213,768,203,864,176C960,149,1056,107,1152,112C1248,117,1344,171,1392,197.3L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                        ></path>

                        {/* Cloud Wave 2 - Medium Blue (Dark Mode: Deeper Blue) */}
                        <path
                            fill="#bae6fd"
                            fillOpacity="1"
                            className="dark:fill-[#172554]"
                            d="M0,192L60,186.7C120,181,240,171,360,176C480,181,600,203,720,208C840,213,960,203,1080,192C1200,181,1320,171,1380,165.3L1440,160L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
                        ></path>

                        {/* Cloud Wave 3 - Soft Blue (Dark Mode: Even Deeper Blue) */}
                        <path
                            fill="#e0f2fe"
                            fillOpacity="1"
                            className="dark:fill-[#081630]"
                            d="M0,256L48,240C96,224,192,192,288,176C384,160,480,160,576,170.7C672,181,768,203,864,197.3C960,192,1056,160,1152,144C1248,128,1344,128,1392,128L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                        ></path>
                    </svg>
                </div>
            </section>



            {/* Services Section */}
            <section id="service" className="py-16 md:py-24 bg-[#e0f2fe] dark:bg-[#081630] min-h-screen flex items-center justify-center">
                <div className="container mx-auto px-6 md:px-12 lg:px-20 text-center flex flex-col items-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-10">Layanan Utama</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                        <div className="flex flex-col items-center bg-white dark:bg-gray-700 rounded-lg shadow-md dark:shadow-gray-600 p-6 md:p-8 hover:shadow-lg dark:hover:shadow-gray-500 transition duration-300">
                            <div className="w-14 h-14 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-2xl mb-4"> <FaCalendarCheck className="text-2xl md:text-3xl" /></div>
                            <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Permintaan Perjalanan Terstruktur</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">Karyawan dapat mengajukan permintaan perjalanan dengan detail lengkap, memudahkan perencanaan dan persetujuan.</p>
                        </div>
                        <div className="flex flex-col items-center bg-white dark:bg-gray-700 rounded-lg shadow-md dark:shadow-gray-600 p-6 md:p-8 hover:shadow-lg dark:hover:shadow-gray-500 transition duration-300">
                            <div className="w-14 h-14 rounded-full bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-300 font-bold flex items-center justify-center text-2xl mb-4"> <FaCar className="text-2xl md:text-3xl" /></div>
                            <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Penugasan Sopir Efisien</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">Admin GA dapat menugaskan sopir dan kendaraan yang sesuai dengan ketersediaan dan kebutuhan perjalanan.</p>
                        </div>
                        <div className="flex flex-col items-center bg-white dark:bg-gray-700 rounded-lg shadow-md dark:shadow-gray-600 p-6 md:p-8 hover:shadow-lg dark:hover:shadow-gray-500 transition duration-300">
                            <div className="w-14 h-14 rounded-full bg-yellow-200 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-300 font-bold flex items-center justify-center text-2xl mb-4"> <FaClock className="text-2xl md:text-3xl" /></div>
                            <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Pencatatan Waktu Otomatis</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">Sistem secara otomatis mencatat waktu keberangkatan dan kedatangan, mengurangi kebutuhan input manual.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how" className="py-16 md:py-24 bg-[#e0f2fe] dark:bg-[#081630] min-h-screen flex items-center justify-center">
                <div className="container mx-auto px-6 md:px-12 lg:px-20 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-8">Bagaimana Cara Kerjanya?</h2>
                    <p className="text-lg text-gray-700 dark:text-gray-300 mb-10">
                        Proses yang sederhana dan intuitif untuk manajemen transportasi yang efektif.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
                        <div className="flex flex-col items-center bg-white dark:bg-gray-700 rounded-lg shadow-md dark:shadow-gray-600 p-6 md:p-8 hover:shadow-lg dark:hover:shadow-gray-500 transition duration-300">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xl md:text-2xl mb-4">1</div>
                            <h4 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Pengajuan Permintaan</h4>
                            <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base text-center">Karyawan mengisi form permintaan perjalanan dengan detail yang diperlukan.</p>
                        </div>
                        <div className="flex flex-col items-center bg-white dark:bg-gray-700 rounded-lg shadow-md dark:shadow-gray-600 p-6 md:p-8 hover:shadow-lg dark:hover:shadow-gray-500 transition duration-300">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-300 font-bold flex items-center justify-center text-xl md:text-2xl mb-4">2</div>
                            <h4 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Persetujuan & Penugasan</h4>
                            <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base text-center">Admin GA meninjau, menyetujui, dan menugaskan sopir serta kendaraan.</p>
                        </div>
                        <div className="flex flex-col items-center bg-white dark:bg-gray-700 rounded-lg shadow-md dark:shadow-gray-600 p-6 md:p-8 hover:shadow-lg dark:hover:shadow-gray-500 transition duration-300">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-yellow-200 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-300 font-bold flex items-center justify-center text-xl md:text-2xl mb-4">3</div>
                            <h4 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Pelaksanaan Perjalanan</h4>
                            <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base text-center">Sopir melaksanakan perjalanan sesuai jadwal dan dapat memperbarui status.</p>
                        </div>
                        <div className="flex flex-col items-center bg-white dark:bg-gray-700 rounded-lg shadow-md dark:shadow-gray-600 p-6 md:p-8 hover:shadow-lg dark:hover:shadow-gray-500 transition duration-300">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-indigo-200 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xl md:text-2xl mb-4">4</div>
                            <h4 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Penyelesaian & Laporan</h4>
                            <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base text-center">Perjalanan selesai tercatat secara otomatis untuk keperluan pelaporan dan analisis.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* <Footer /> */}
        </div>
    );
}