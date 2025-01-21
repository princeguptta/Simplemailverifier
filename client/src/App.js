import React, { useState } from 'react';
import { CheckCircle, XCircle, Loader2, AlertCircle, Upload, Download } from 'lucide-react';
import { verifyEmail } from './api.js';

function App() {
    const [activeTab, setActiveTab] = useState('single');
    const [email, setEmail] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const [file, setFile] = useState(null);
    const [bulkResults, setBulkResults] = useState([]);
    const [isBulkVerifying, setIsBulkVerifying] = useState(false);
    const [bulkProgress, setBulkProgress] = useState(0);

    const handleVerify = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await verifyEmail(email);
            setResult(data);
        } catch (err) {
            setError(err.message || 'Failed to verify email');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkVerify = async () => {
        if (!file) return;
        
        setIsBulkVerifying(true);
        setBulkProgress(0);
        setBulkResults([]);
        setError(null);

        try {
            const reader = new FileReader();
            
            reader.onload = async (event) => {
                const csvData = event.target.result;
                const emails = csvData.split('\n')
                    .map(line => line.trim())
                    .filter(line => line && line.includes('@'));
                
                console.log('Processing emails:', emails);
                const results = [];
                const totalEmails = emails.length;

                for (let i = 0; i < emails.length; i++) {
                    const email = emails[i];
                    try {
                        const result = await verifyEmail(email);
                        results.push({
                            email,
                            valid: result.valid,
                            details: result.details,
                            checks: result.checks
                        });
                    } catch (error) {
                        results.push({ 
                            email, 
                            valid: false,
                            error: error.message 
                        });
                    }

                    const progress = Math.round(((i + 1) / totalEmails) * 100);
                    setBulkProgress(progress);
                    setBulkResults([...results]);
                }
            };

            reader.readAsText(file);
        } catch (error) {
            setError('Failed to process file: ' + error.message);
        } finally {
            setIsBulkVerifying(false);
        }
    };

    const downloadResults = () => {
        const headers = ['Email', 'Status', 'Details'];
        const csvContent = [
            headers.join(','),
            ...bulkResults.map(result => [
                result.email,
                result.valid ? 'Valid' : 'Invalid',
                result.error || (result.details?.smtp ? 'SMTP Verified' : 'Check failed')
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.setAttribute('download', `email_verification_results_${timestamp}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                setFile(file);
                setError(null);
            } else {
                setError('Please upload a CSV file');
                setFile(null);
            }
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
                    <p className="mt-2 text-gray-600">Verify email addresses instantly</p>
                </div>

                <div className="flex border-b border-gray-200 mb-6">
                    <button
                        onClick={() => setActiveTab('single')}
                        className={`py-2 px-4 ${
                            activeTab === 'single'
                                ? 'border-b-2 border-blue-500 text-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Single Email
                    </button>
                    <button
                        onClick={() => setActiveTab('bulk')}
                        className={`py-2 px-4 ${
                            activeTab === 'bulk'
                                ? 'border-b-2 border-blue-500 text-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Bulk Verification
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    {activeTab === 'single' ? (
                        <div>
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
                                                    <span className="capitalize">
                                                        {key.replace('_', ' ')}
                                                    </span>
                                                    {getStatusIcon(value)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {result.details?.mx_records && (
                                        <div>
                                            <h3 className="text-lg font-medium mb-3">MX Records</h3>
                                            <div className="bg-gray-50 rounded-md p-4">
                                                <div className="space-y-2">
                                                    {result.details.mx_records.map((record, index) => (
                                                        <div key={index} className="flex justify-between text-sm">
                                                            <span className="text-gray-600">
                                                                {record.exchange}
                                                            </span>
                                                            <span className="text-gray-500">
                                                                Priority: {record.priority}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4">
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label
                                    htmlFor="file-upload"
                                    className="cursor-pointer flex flex-col items-center"
                                >
                                    <Upload className="w-12 h-12 text-gray-400" />
                                    <span className="mt-2 text-sm text-gray-600">
                                        Click to upload CSV file
                                    </span>
                                </label>
                                {file && (
                                    <div className="mt-4 text-sm text-gray-600">
                                        Selected file: {file.name}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleBulkVerify}
                                disabled={!file || isBulkVerifying}
                                className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 mb-4"
                            >
                                {isBulkVerifying ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Verifying...</span>
                                    </div>
                                ) : (
                                    'Start Verification'
                                )}
                            </button>

                            {isBulkVerifying && (
                                <div className="mb-4">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${bulkProgress}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Progress: {bulkProgress}%
                                    </p>
                                </div>
                            )}

                            {bulkResults.length > 0 && (
                                <div className="mt-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-medium">
                                            Verification Results ({bulkResults.length} emails)
                                        </h3>
                                        <button
                                            onClick={downloadResults}
                                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                        >
                                            <Download className="w-4 h-4" />
                                            Download CSV
                                        </button>
                                    </div>
                                    
                                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Email
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Status
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Details
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {bulkResults.map((result, index) => (
                                                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {result.email}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                                result.valid
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : 'bg-red-100 text-red-800'
                                                            }`}>
                                                                {result.valid ? 'Valid' : 'Invalid'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {result.error || 
                                                             (result.details?.smtp ? 'SMTP Verified' : 'Check failed')}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

{error && (
                        <div className="mt-4 p-4 bg-red-50 rounded-md flex items-center gap-2 text-red-700">
                            <AlertCircle className="w-5 h-5" />
                            <p>{error}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;