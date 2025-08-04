import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        credential: '', // This will hold either NIK or Email
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
    
        // Optionally log for debugging
        const isNik = /^EMP\d+$/.test(data.credential) || /^\d+$/.test(data.credential);
        const routeName = isNik ? 'employee.login' : 'login';
    
        // console.log('Attempting login to:', routeName, 'with:', data);
    
        post(route(routeName), {
            onFinish: () => reset('password'),
            onError: (err) => {
                if (err.nik) errors.credential = err.nik;
                if (err.email) errors.credential = err.email;
                console.error("Login submission error:", err);
            }
        });
    };
    

    return (
        <GuestLayout>
            <Head title="Log in" />

            {status && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="credential" value="Email / NIK" />

                    <TextInput
                        id="credential"
                        type="text"
                        name="credential"
                        value={data.credential}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        isFocused={true}
                        onChange={(e) => setData('credential', e.target.value)}
                    />

                    {/* Display errors for credential (will be either email or nik error) */}
                    <InputError message={errors.credential || errors.nik || errors.email} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password" value="Password" />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                {/* <div className="mt-4 block">
                    <label className="flex items-center">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) =>
                                setData('remember', e.target.checked)
                            }
                        />
                        <span className="ms-2 text-sm text-gray-600">
                            Remember me
                        </span>
                    </label>
                </div> */}

                <div className="mt-4 flex items-center justify-end">
                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            Forgot your password?
                        </Link>
                    )}

                    <PrimaryButton className="ms-4" disabled={processing}>
                        Log in
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
