import React, { useState } from 'react';
import { storage } from '../firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

export function StorageTest() {
    const [testResult, setTestResult] = useState<string>('');
    const [error, setError] = useState<string>('');

    const testStorage = async () => {
        setTestResult('Testing...');
        setError('');

        try {
            // Create a test file in storage
            const testRef = ref(storage, 'test/connection_test.txt');
            const testContent = 'Test content ' + new Date().toISOString();
            
            // Try to upload
            await uploadString(testRef, testContent);
            
            // Try to get the download URL
            const url = await getDownloadURL(testRef);
            
            setTestResult(`Storage test successful! URL: ${url}`);
            console.log('Test passed, URL:', url);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(`Storage test failed: ${errorMessage}`);
            console.error('Storage test error:', err);
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Firebase Storage Connection Test</h2>
            <button
                onClick={testStorage}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
                Test Storage Connection
            </button>
            {testResult && (
                <div className="mt-4 p-4 bg-green-100 text-green-700 rounded">
                    {testResult}
                </div>
            )}
            {error && (
                <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
                    {error}
                </div>
            )}
        </div>
    );
}
