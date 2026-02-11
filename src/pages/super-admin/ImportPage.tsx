import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, FileJson, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const ImportPage: React.FC = () => {
    const { token } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setResult(null);
            setError(null);

            // Read preview
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const json = JSON.parse(event.target?.result as string);
                    setPreview({
                        orgName: json.organization?.name,
                        userCount: json.users?.length || 0,
                        standardCount: json.standards?.length || 0,
                        curriculumCount: json.curriculums?.length || 0,
                        campaignCount: json.campaigns?.length || 0
                    });
                } catch (err) {
                    setError('Invalid JSON file format');
                    setPreview(null);
                }
            };
            reader.readAsText(selectedFile);
        }
    };

    const handleImport = async () => {
        if (!file || !preview) return;

        setIsLoading(true);
        setError(null);
        
        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const payload = JSON.parse(event.target?.result as string);
                    
                    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/super-admin/import`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(payload)
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.error?.message || 'Import failed');
                    }

                    setResult(data);
                    setFile(null);
                    setPreview(null);
                } catch (err: any) {
                    setError(err.message);
                } finally {
                    setIsLoading(false);
                }
            };
            reader.readAsText(file);
        } catch (err: any) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-8 max-w-3xl">
            <h1 className="text-3xl font-bold mb-8">Organization Import</h1>

            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Import Organization Data</CardTitle>
                    <CardDescription>
                        Upload a JSON file containing the organization structure, users, standards, and training data.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    
                    {/* File Upload Area */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                        <input 
                            type="file" 
                            accept=".json"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                            <Upload className="h-10 w-10 text-gray-400" />
                            <div className="text-sm text-gray-600 font-medium">
                                {file ? file.name : "Click to upload or drag and drop"}
                            </div>
                            <div className="text-xs text-gray-500">JSON files only</div>
                        </div>
                    </div>

                    {/* Preview Section */}
                    {preview && !error && (
                        <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                <FileJson className="h-4 w-4" /> 
                                File Preview: {preview.orgName || 'Unnamed Organization'}
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
                                <div>Users: {preview.userCount}</div>
                                <div>Standards: {preview.standardCount}</div>
                                <div>Curriculums: {preview.curriculumCount}</div>
                                <div>Campaigns: {preview.campaignCount}</div>
                            </div>
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Import Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Success Result */}
                    {result && (
                        <Alert className="bg-green-50 border-green-200 text-green-900">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertTitle className="text-green-800">Import Successful</AlertTitle>
                            <AlertDescription>
                                <div className="mt-2 space-y-1 text-sm">
                                    <p>Organization: {result.results.organization?.name}</p>
                                    <p>Users Created: {result.results.users.created} (Failed: {result.results.users.failed})</p>
                                    <p>Standards Created: {result.results.standards.created}</p>
                                    <p>Curriculums Created: {result.results.curriculums.created}</p>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="flex justify-end">
                        <Button 
                            onClick={handleImport} 
                            disabled={!file || isLoading || !!error}
                            className="w-full sm:w-auto"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Importing...
                                </>
                            ) : (
                                'Start Import'
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="font-semibold mb-2">JSON Format Guide</h3>
                <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded overflow-auto h-48">
{`{
  "organization": {
    "name": "Acme Aviation",
    "code": "ACME",
    "country": "US",
    "licenseType": "standard"
  },
  "users": [
    {
      "email": "admin@acme.com",
      "fullName": "Admin User",
      "role": "admin",
      "password": "SecurePassword123!"
    }
  ],
  "standards": [],
  "curriculums": [],
  "campaigns": []
}`}
                </pre>
            </div>
        </div>
    );
};

export default ImportPage;
