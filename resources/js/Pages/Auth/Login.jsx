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

        // Determine if the credential looks like an NIK or an email
        const isNik = /^EMP\d+$/.test(data.credential) || /^\d+$/.test(data.credential);

        // Create a payload object dynamically based on the type of login
        let payload;
        let targetRoute;

        if (isNik) {
            console.log('Attempting NIK login');
            payload = {
                nik: data.credential,
                password: data.password,
                remember: data.remember,
            };
            targetRoute = route('employee.login'); // Use the specific employee login route
        } else {
            console.log('Attempting Email login');
            payload = {
                email: data.credential,
                password: data.password,
                remember: data.remember,
            };
            targetRoute = route('login'); // Use the standard login route
        }

        console.log('Sending payload:', payload);
        console.log('To route:', targetRoute);

        // Use the post method directly with the crafted payload
        // The second argument is the data to send, so no 'data: {}' wrapper needed here.
        post(targetRoute, payload, {
            onFinish: () => reset('password'),
            onError: (err) => {
                // Show NIK or email errors under 'credential' field
                if (err.nik) err.credential = err.nik;
                if (err.email) err.credential = err.email;
            
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

                <div className="mt-4 block">
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
                </div>

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
