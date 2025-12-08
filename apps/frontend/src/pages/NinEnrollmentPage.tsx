import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle, User, CreditCard, Wallet, Camera, Fingerprint, FileSignature } from 'lucide-react';
import { api } from '@/lib/api';

interface EnrollmentData {
  firstName: string;
  lastName: string;
  middleName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE';
  phoneNumber: string;
  email: string;
  addressLine: string;
  town: string;
  lga: string;
  state: string;
  birthState: string;
  birthLGA: string;
  birthCountry: string;
  religion: string;
  profession: string;
  nextOfKinName: string;
  nextOfKinPhone: string;
  nextOfKinAddress: string;
}

interface BiometricData {
  fingerprintTemplates: string[];
  faceImage: string;
  signature: string;
}

interface ApiResponse<T = Record<string, unknown>> {
  success: boolean;
  data?: T;
  error?: string;
  trackingNumber?: string;
  enrollmentNumber?: string;
  pdfUrl?: string;
}

export default function NinEnrollmentPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enrollmentResult, setEnrollmentResult] = useState<ApiResponse | null>(null);
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  
  // Form data
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData>({
    firstName: '',
    lastName: '',
    middleName: '',
    dateOfBirth: '',
    gender: 'MALE',
    phoneNumber: '',
    email: '',
    addressLine: '',
    town: '',
    lga: '',
    state: '',
    birthState: '',
    birthLGA: '',
    birthCountry: 'Nigeria',
    religion: '',
    profession: '',
    nextOfKinName: '',
    nextOfKinPhone: '',
    nextOfKinAddress: ''
  });

  const [paymentMethod, setPaymentMethod] = useState<'WALLET' | 'CARD'>('WALLET');
  const [biometricData, setBiometricData] = useState<BiometricData>({
    fingerprintTemplates: [],
    faceImage: '',
    signature: ''
  });

  const handleInputChange = (field: keyof EnrollmentData, value: string) => {
    setEnrollmentData(prev => ({ ...prev, [field]: value }));
  };

  const calculateAge = (dob: string): number => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleCreateEnrollment = async () => {
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'dateOfBirth', 'phoneNumber', 'addressLine', 'town', 'lga', 'state', 'birthState', 'birthLGA'];
    for (const field of requiredFields) {
      if (!enrollmentData[field as keyof EnrollmentData].trim()) {
        alert(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return;
      }
    }

    // Validate age
    const age = calculateAge(enrollmentData.dateOfBirth);
    if (age < 16) {
      alert('Minimum age for NIN enrollment is 16 years');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post('/nin-enrollment/create', {
        ...enrollmentData,
        paymentMethod
      });

      if ((response.data as ApiResponse).success) {
        setEnrollmentResult(response.data as ApiResponse);
        setTrackingNumber((response.data as ApiResponse).trackingNumber || '');
        setCurrentStep(2);
      } else {
        alert((response.data as ApiResponse).error || 'Enrollment failed');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert('Enrollment failed: ' + error.message);
      } else {
        alert('Enrollment failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBiometricCapture = async (type: 'fingerprint' | 'face' | 'signature') => {
    // In a real implementation, this would interface with your biometric hardware
    // For now, we'll simulate the capture
    
    if (type === 'fingerprint') {
      // Simulate capturing all 10 fingerprints
      const mockFingerprints = Array(10).fill(0).map((_, i) => `mock_fingerprint_${i + 1}_base64`);
      setBiometricData(prev => ({ ...prev, fingerprintTemplates: mockFingerprints }));
      alert('Fingerprint capture simulated - 10 fingerprints captured');
    } else if (type === 'face') {
      // Simulate face capture
      setBiometricData(prev => ({ ...prev, faceImage: 'mock_face_image_base64' }));
      alert('Face capture simulated');
    } else if (type === 'signature') {
      // Simulate signature capture
      setBiometricData(prev => ({ ...prev, signature: 'mock_signature_base64' }));
      alert('Signature capture simulated');
    }
  };

  const handleSubmitBiometrics = async () => {
    if (biometricData.fingerprintTemplates.length < 10) {
      alert('Please capture all 10 fingerprints');
      return;
    }

    if (!biometricData.faceImage) {
      alert('Please capture face image');
      return;
    }

    if (!biometricData.signature) {
      alert('Please capture signature');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post(`/nin-enrollment/${trackingNumber}/biometrics`, biometricData as unknown as Record<string, unknown>);

      if ((response.data as ApiResponse).success) {
        setCurrentStep(3);
      } else {
        alert((response.data as ApiResponse).error || 'Biometric submission failed');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert('Biometric submission failed: ' + error.message);
      } else {
        alert('Biometric submission failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateSlip = async () => {
    setIsSubmitting(true);

    try {
      const response = await api.post(`/nin-enrollment/${trackingNumber}/generate-slip`);

      if ((response.data as ApiResponse).success) {
        // Open PDF in new tab
        window.open((response.data as ApiResponse).pdfUrl, '_blank');
      } else {
        alert((response.data as ApiResponse).error || 'Failed to generate acknowledgment slip');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert('Failed to generate acknowledgment slip: ' + error.message);
      } else {
        alert('Failed to generate acknowledgment slip');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: 'Personal Information', description: 'Fill in your details' },
    { number: 2, title: 'Biometric Capture', description: 'Capture biometrics' },
    { number: 3, title: 'Confirmation', description: 'Complete enrollment' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            NIN Enrollment Service
          </h1>
          <p className="text-gray-600">
            Complete your National Identity Number enrollment with biometric capture
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  currentStep >= step.number 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step.number}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{step.title}</p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-4 ${
                    currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6">
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Please provide your personal details for NIN enrollment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={enrollmentData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={enrollmentData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="middleName">Middle Name</Label>
                    <Input
                      id="middleName"
                      value={enrollmentData.middleName}
                      onChange={(e) => handleInputChange('middleName', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={enrollmentData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className="mt-1"
                    />
                    {enrollmentData.dateOfBirth && (
                      <p className="text-sm text-gray-500 mt-1">
                        Age: {calculateAge(enrollmentData.dateOfBirth)} years
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="gender">Gender *</Label>
                    <Select
                      value={enrollmentData.gender}
                      onValueChange={(value) => handleInputChange('gender', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="phoneNumber">Phone Number *</Label>
                    <Input
                      id="phoneNumber"
                      value={enrollmentData.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={enrollmentData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="profession">Profession</Label>
                    <Input
                      id="profession"
                      value={enrollmentData.profession}
                      onChange={(e) => handleInputChange('profession', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Address Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="addressLine">Address Line *</Label>
                      <Input
                        id="addressLine"
                        value={enrollmentData.addressLine}
                        onChange={(e) => handleInputChange('addressLine', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="town">Town/City *</Label>
                      <Input
                        id="town"
                        value={enrollmentData.town}
                        onChange={(e) => handleInputChange('town', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="lga">LGA *</Label>
                      <Input
                        id="lga"
                        value={enrollmentData.lga}
                        onChange={(e) => handleInputChange('lga', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        value={enrollmentData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Birth Information</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="birthState">Birth State *</Label>
                      <Input
                        id="birthState"
                        value={enrollmentData.birthState}
                        onChange={(e) => handleInputChange('birthState', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="birthLGA">Birth LGA *</Label>
                      <Input
                        id="birthLGA"
                        value={enrollmentData.birthLGA}
                        onChange={(e) => handleInputChange('birthLGA', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="birthCountry">Birth Country</Label>
                      <Input
                        id="birthCountry"
                        value={enrollmentData.birthCountry}
                        onChange={(e) => handleInputChange('birthCountry', e.target.value)}
                        className="mt-1"
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Next of Kin Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nextOfKinName">Next of Kin Name</Label>
                      <Input
                        id="nextOfKinName"
                        value={enrollmentData.nextOfKinName}
                        onChange={(e) => handleInputChange('nextOfKinName', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="nextOfKinPhone">Next of Kin Phone</Label>
                      <Input
                        id="nextOfKinPhone"
                        value={enrollmentData.nextOfKinPhone}
                        onChange={(e) => handleInputChange('nextOfKinPhone', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <Label htmlFor="nextOfKinAddress">Next of Kin Address</Label>
                      <Textarea
                        id="nextOfKinAddress"
                        value={enrollmentData.nextOfKinAddress}
                        onChange={(e) => handleInputChange('nextOfKinAddress', e.target.value)}
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
                  <div className="flex gap-4">
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

                <div className="mt-6 flex gap-3">
                  <Button
                    onClick={handleCreateEnrollment}
                    disabled={isSubmitting}
                    className="flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                    {isSubmitting ? 'Creating...' : 'Create Enrollment'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Biometric Capture */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Biometric Capture</CardTitle>
                <CardDescription>
                  Capture your biometric data using our secure hardware
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <Alert>
                    <AlertDescription>
                      <strong>Tracking Number:</strong> {trackingNumber}
                    </AlertDescription>
                  </Alert>

                  <div className="grid md:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Fingerprint className="h-5 w-5" />
                          Fingerprints
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-4">
                          Capture all 10 fingerprints using the fingerprint scanner
                        </p>
                        <Button
                          onClick={() => handleBiometricCapture('fingerprint')}
                          className="w-full"
                          variant={biometricData.fingerprintTemplates.length >= 10 ? 'default' : 'outline'}
                        >
                          {biometricData.fingerprintTemplates.length >= 10 ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Fingerprints Captured
                            </>
                          ) : (
                            'Capture Fingerprints'
                          )}
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Camera className="h-5 w-5" />
                          Face Capture
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-4">
                          Capture your facial image using the camera
                        </p>
                        <Button
                          onClick={() => handleBiometricCapture('face')}
                          className="w-full"
                          variant={biometricData.faceImage ? 'default' : 'outline'}
                        >
                          {biometricData.faceImage ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Face Captured
                            </>
                          ) : (
                            'Capture Face'
                          )}
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileSignature className="h-5 w-5" />
                          Signature
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-4">
                          Capture your signature using the signature pad
                        </p>
                        <Button
                          onClick={() => handleBiometricCapture('signature')}
                          className="w-full"
                          variant={biometricData.signature ? 'default' : 'outline'}
                        >
                          {biometricData.signature ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Signature Captured
                            </>
                          ) : (
                            'Capture Signature'
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleSubmitBiometrics}
                      disabled={isSubmitting}
                      className="flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      {isSubmitting ? 'Submitting...' : 'Submit Biometrics'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Enrollment Complete!</CardTitle>
                <CardDescription>
                  Your NIN enrollment has been submitted successfully
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="border-green-200 bg-green-50 mb-6">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Enrollment completed successfully! Your application will be processed within 5-7 working days.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4 mb-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Tracking Number</Label>
                      <p className="font-mono text-lg">{trackingNumber}</p>
                    </div>
                    
                    <div>
                      <Label>Enrollment Number</Label>
                      <p className="font-mono text-lg">{enrollmentResult?.enrollmentNumber}</p>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Estimated Processing Time</Label>
                    <p>5-7 working days</p>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <h4 className="font-semibold text-blue-900 mb-2">Next Steps</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Keep your tracking number safe for status checking</li>
                    <li>• You will receive SMS and email notifications</li>
                    <li>• Your NIN will be assigned within 5-7 working days</li>
                    <li>• Download your acknowledgment slip below</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleGenerateSlip}
                    disabled={isSubmitting}
                    className="flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileSignature className="h-4 w-4" />
                    )}
                    {isSubmitting ? 'Generating...' : 'Download Acknowledgment Slip'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCurrentStep(1);
                      setEnrollmentResult(null);
                      setTrackingNumber('');
                      setEnrollmentData({
                        firstName: '',
                        lastName: '',
                        middleName: '',
                        dateOfBirth: '',
                        gender: 'MALE',
                        phoneNumber: '',
                        email: '',
                        addressLine: '',
                        town: '',
                        lga: '',
                        state: '',
                        birthState: '',
                        birthLGA: '',
                        birthCountry: 'Nigeria',
                        religion: '',
                        profession: '',
                        nextOfKinName: '',
                        nextOfKinPhone: '',
                        nextOfKinAddress: ''
                      });
                      setBiometricData({
                        fingerprintTemplates: [],
                        faceImage: '',
                        signature: ''
                      });
                    }}
                  >
                    New Enrollment
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Information Section */}
          <Card>
            <CardHeader>
              <CardTitle>Enrollment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Requirements</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Minimum age: 16 years</li>
                    <li>• Valid phone number</li>
                    <li>• Birth certificate (recommended)</li>
                    <li>• Valid address</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Process</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Fill enrollment form</li>
                    <li>• Capture biometrics</li>
                    <li>• Pay enrollment fee</li>
                    <li>• Get acknowledgment slip</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Timeline</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Biometric capture: Instant</li>
                    <li>• Processing: 5-7 working days</li>
                    <li>• NIN assignment: Automatic</li>
                    <li>• Card printing: Available</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-900 mb-2">Important Notes</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Enrollment fee: ₦500</li>
                  <li>• Biometric capture is mandatory</li>
                  <li>• Keep your tracking number safe</li>
                  <li>• You will receive SMS/email notifications</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}