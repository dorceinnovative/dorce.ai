import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Download, Eye, Wallet, CreditCard } from 'lucide-react';
import { api } from '@/lib/api';

interface NinData {
  nin: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email?: string;
  address: string;
  photo: string;
  signature?: string;
}

interface VerificationResponse {
  success: boolean;
  data?: NinData;
  error?: string;
}

interface SlipResponse {
  success: boolean;
  pdfUrl?: string;
  error?: string;
}

export default function NinVerificationPage() {
  const [nin, setNin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isGeneratingSlip, setIsGeneratingSlip] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResponse | null>(null);
  const [slipResult, setSlipResult] = useState<SlipResponse | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'WALLET' | 'CARD'>('WALLET');

  const handleVerifyNin = async () => {
    if (!nin.trim()) {
      alert('Please enter your NIN');
      return;
    }

    if (!/^\d{11}$/.test(nin)) {
      alert('NIN must be exactly 11 digits');
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);
    setSlipResult(null);

    try {
      const response = await api.post('/nin-verification/verify', {
        nin: nin.trim(),
        paymentMethod
      });

      setVerificationResult(response.data as VerificationResponse);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setVerificationResult({
          success: false,
          error: error.message || 'Verification failed'
        });
      } else {
        setVerificationResult({
          success: false,
          error: 'Verification failed'
        });
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleGeneratePremiumSlip = async () => {
    if (!verificationResult?.data) {
      alert('Please verify NIN first');
      return;
    }

    setIsGeneratingSlip(true);

    try {
      const response = await api.post('/nin-verification/generate-slip', {
        nin: verificationResult.data.nin
      });

      setSlipResult(response.data as SlipResponse);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setSlipResult({
          success: false,
          error: error.message || 'Failed to generate slip'
        });
      } else {
        setSlipResult({
          success: false,
          error: 'Failed to generate slip'
        });
      }
    } finally {
      setIsGeneratingSlip(false);
    }
  };

  const handleDownloadSlip = () => {
    if (slipResult?.pdfUrl) {
      window.open(slipResult.pdfUrl, '_blank');
    }
  };

  const clearForm = () => {
    setNin('');
    setVerificationResult(null);
    setSlipResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            NIN Verification & Premium Slip Generation
          </h1>
          <p className="text-gray-600">
            Verify your National Identity Number and generate premium digital slips
          </p>
        </div>

        <div className="grid gap-6">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle>Enter NIN for Verification</CardTitle>
              <CardDescription>
                Enter your 11-digit National Identity Number to verify and generate premium slip
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nin">National Identity Number (NIN)</Label>
                  <Input
                    id="nin"
                    type="text"
                    placeholder="Enter 11-digit NIN"
                    value={nin}
                    onChange={(e) => setNin(e.target.value.replace(/\D/g, ''))}
                    maxLength={11}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Payment Method</Label>
                  <div className="flex gap-4 mt-2">
                    <Button
                      type="button"
                      variant={paymentMethod === 'WALLET' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('WALLET')}
                      className="flex items-center gap-2"
                    >
                      <Wallet className="h-4 w-4" />
                      Wallet Balance
                    </Button>
                    <Button
                      type="button"
                      variant={paymentMethod === 'CARD' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('CARD')}
                      className="flex items-center gap-2"
                    >
                      <CreditCard className="h-4 w-4" />
                      Pay with Card
                    </Button>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <p><strong>Verification Cost:</strong> ₦150</p>
                  <p><strong>Premium Slip:</strong> ₦50 (optional)</p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleVerifyNin}
                    disabled={isVerifying || !nin.trim()}
                    className="flex items-center gap-2"
                  >
                    {isVerifying ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    {isVerifying ? 'Verifying...' : 'Verify NIN'}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearForm}
                    disabled={isVerifying}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Verification Result */}
          {verificationResult && (
            <Card>
              <CardHeader>
                <CardTitle>Verification Result</CardTitle>
              </CardHeader>
              <CardContent>
                {verificationResult.success ? (
                  <div className="space-y-4">
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        NIN verification successful!
                      </AlertDescription>
                    </Alert>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div>
                          <Label>NIN</Label>
                          <p className="font-mono">{verificationResult.data?.nin}</p>
                        </div>
                        <div>
                          <Label>Full Name</Label>
                          <p>{`${verificationResult.data?.firstName} ${verificationResult.data?.middleName || ''} ${verificationResult.data?.lastName}`}</p>
                        </div>
                        <div>
                          <Label>Date of Birth</Label>
                          <p>{verificationResult.data?.dateOfBirth}</p>
                        </div>
                        <div>
                          <Label>Gender</Label>
                          <p>{verificationResult.data?.gender}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <Label>Phone Number</Label>
                          <p>{verificationResult.data?.phone}</p>
                        </div>
                        <div>
                          <Label>Email</Label>
                          <p>{verificationResult.data?.email || 'N/A'}</p>
                        </div>
                        <div>
                          <Label>Address</Label>
                          <p>{verificationResult.data?.address}</p>
                        </div>
                      </div>
                    </div>

                    {verificationResult.data?.photo && (
                      <div className="mt-4">
                        <Label>Photo</Label>
                        <div className="mt-2">
                          <img
                            src={`data:image/jpeg;base64,${verificationResult.data.photo}`}
                            alt="NIN Photo"
                            className="w-32 h-32 object-cover border rounded"
                          />
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t">
                      <Button
                        onClick={handleGeneratePremiumSlip}
                        disabled={isGeneratingSlip}
                        className="flex items-center gap-2"
                      >
                        {isGeneratingSlip ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        {isGeneratingSlip ? 'Generating...' : 'Generate Premium Slip (₦50)'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Alert className="border-red-200 bg-red-50">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      {verificationResult.error || 'NIN verification failed'}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Premium Slip Result */}
          {slipResult && (
            <Card>
              <CardHeader>
                <CardTitle>Premium Slip Generation</CardTitle>
              </CardHeader>
              <CardContent>
                {slipResult.success ? (
                  <div className="space-y-4">
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Premium slip generated successfully!
                      </AlertDescription>
                    </Alert>

                    <div className="flex gap-3">
                      <Button
                        onClick={handleDownloadSlip}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download Premium Slip
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => window.open(slipResult.pdfUrl, '_blank')}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Preview Slip
                      </Button>
                    </div>

                    <div className="text-sm text-gray-600">
                      <p><strong>Note:</strong> This premium slip contains your verified NIN information and can be used for official purposes.</p>
                    </div>
                  </div>
                ) : (
                  <Alert className="border-red-200 bg-red-50">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      {slipResult.error || 'Failed to generate premium slip'}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Information Section */}
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-blue-600 font-bold">1</span>
                    </div>
                    <h3 className="font-semibold mb-2">Enter NIN</h3>
                    <p className="text-sm text-gray-600">Input your 11-digit National Identity Number</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-blue-600 font-bold">2</span>
                    </div>
                    <h3 className="font-semibold mb-2">Verify & Pay</h3>
                    <p className="text-sm text-gray-600">Pay ₦150 for verification using wallet or card</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-blue-600 font-bold">3</span>
                    </div>
                    <h3 className="font-semibold mb-2">Get Premium Slip</h3>
                    <p className="text-sm text-gray-600">Generate premium PDF slip for ₦50 (optional)</p>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Features</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Instant NIN verification against government database</li>
                    <li>• High-quality premium slip generation</li>
                    <li>• Secure payment processing</li>
                    <li>• Download and print ready slips</li>
                    <li>• 24/7 service availability</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}