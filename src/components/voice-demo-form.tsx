'use client'

import { useState, useEffect } from "react"
import { Button } from '@/components/ui/button'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import toast from 'react-hot-toast'
import axios from 'axios'
import { StatusModal } from "@/components/StatusModal"
import { useRouter } from 'next/navigation'

export function VoiceDemoForm() {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [callId, setCallId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState<boolean>(false)
  const router = useRouter()

  useEffect(() => {
    if (showModal) {
      const timer = setTimeout(() => {
        router.push('https://invocalize-app.vercel.app/')
      }, 10000) // Redirect after 10 seconds
      return () => clearTimeout(timer)
    }
  }, [showModal, router])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData(event.currentTarget);
      const data = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phoneNumber: formData.get('phoneNumber') as string,
        company: formData.get('company') as string,
        role: formData.get('role') as string,
        useCase: formData.get('useCase') as string
      };

      console.log('Sending form data:', data);

      const response = await axios.post('/api/send-call', data);

      console.log('Response from send-call:', response.data);

      const { callId } = response.data;
      setCallId(callId);

      toast.success('Call initiated successfully!');
      setIsLoading(false)
      setShowModal(true) // Show the modal after successful submission
    } catch (error: any) {
      console.error('Error sending call:', error.response?.data || error.message);
      setError('Failed to send call. Please try again.')
      setIsLoading(false)
      toast.error('Failed to initiate call. Please try again.');
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <img src="/logo.png" alt="Company Logo" className="mb-6 h-12 w-auto" />
      
      <h1 className="text-3xl font-bold">Ready to experience the future of AI-powered voice interactions?</h1>
      
      <p className="text-lg text-gray-600">
        Enter your details below, and our AI voice agent will call you shortly to demonstrate its capabilities in a real-world scenario.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" placeholder="Your full name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="Your email address" required />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input id="phoneNumber" name="phoneNumber" type="tel" placeholder="Your phone number" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input id="company" name="company" placeholder="Your company name" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Input id="role" name="role" placeholder="Your role in the company" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="useCase">Use Case</Label>
          <Textarea id="useCase" name="useCase" placeholder="Describe your use case" required />
        </div>
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Submitting...' : 'Submit'}
        </Button>
      </form>
      {showModal && <StatusModal isOpen={showModal} />}
    </div>
  )
}