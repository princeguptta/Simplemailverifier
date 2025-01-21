import React, { useState } from 'react';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { verifyEmail } from './api';

function App() {
    const [email, setEmail] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleVerify = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await verifyEmail(email);
            console.log('Verification result:', data);
            setResult(data);
        } catch (err) {
            console.error('Verification error:', err);
            setError(err.message || 'Failed to verify email');
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        return status ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
        ) : (
            <XCircle className="w-5 h-5 text-red-500" />
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Email Verifier</h1>
                    <p className="mt-2 text-gray-600">Verify any email address instantly</p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex gap-4 mb-6">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter email address to verify"
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        <button
                            onClick={handleVerify}
                            disabled={loading || !email}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                'Verify'
                            )}
                        </button>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 rounded-md flex items-center gap-2 text-red-700">
                            <AlertCircle className="w-5 h-5" />
                            <p>{error}</p>
                        </div>
                    )}

                    {result && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                                <span className="font-medium">Overall Status</span>
                                <div className={`flex items-center gap-2 font-medium ${
                                    result.valid ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {result.valid ? 'Valid Email' : 'Invalid Email'}
                                    {getStatusIcon(result.valid)}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-medium mb-3">Verification Checks</h3>
                                <div className="space-y-2">
                                    {Object.entries(result.checks).map(([key, value]) => (
                                        <div 
                                            key={key}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                                        >
                                            <span className="capitalize">{key.replace('_', ' ')}</span>
                                            {getStatusIcon(value)}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {result.details.mx_records && (
                                <div>
                                    <h3 className="text-lg font-medium mb-3">MX Records</h3>
                                    <div className="bg-gray-50 rounded-md p-4">
                                        <div className="space-y-2">
                                            {result.details.mx_records.map((record, index) => (
                                                <div key={index} className="flex justify-between text-sm">
                                                    <span className="text-gray-600">{record.exchange}</span>
                                                    <span className="text-gray-500">Priority: {record.priority}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {result.details.smtp && (
                                <div>
                                    <h3 className="text-lg font-medium mb-3">SMTP Response</h3>
                                    <pre className="bg-gray-50 rounded-md p-4 text-sm text-gray-600 whitespace-pre-wrap">
                                        {result.details.smtp}
                                    </pre>
                                </div>
                            )}

                            <div className="text-sm text-gray-500 text-right">
                                Verified at: {new Date(result.timestamp).toLocaleString()}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;