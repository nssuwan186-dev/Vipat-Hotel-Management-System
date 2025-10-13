import React from 'react';

interface LoginProps {
    onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="p-8 bg-white rounded-lg shadow-md text-center">
                <h1 className="text-2xl font-bold mb-4">Hotel Management System</h1>
                <p className="mb-6">Please log in to continue</p>
                <button
                    onClick={onLoginSuccess}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    Login with Google (Simulated)
                </button>
            </div>
        </div>
    );
};

export default Login;
