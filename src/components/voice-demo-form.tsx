'use client'

import { useState, useEffect } from "react"
import { Button } from '@/components/ui/button'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
        router.push('https://invocalize-dash.vercel.app/')
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

  const analyzeCall = async (callId: string) => {
    try {
      const analysisResponse = await axios.post(
        `https://api.bland.ai/v1/calls/${callId}/analyze`,
        { goal: "Understand customer satisfaction and product feedback", questions: [
          ["Who answered the call?", "human or voicemail"],
          ["Positive feedback about the product: ", "string"],
          ["Negative feedback about the product: ", "string"],
          ["Customer confirmed they were satisfied", "boolean"]
        ] as [string, string][] },
        {
          headers: {
            'Authorization': `Bearer ${process.env.BLAND_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const callDetailsResponse = await axios.get(
        `https://api.bland.ai/v1/calls/${callId}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.BLAND_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        analysis: analysisResponse.data,
        callDetails: callDetailsResponse.data
      };
    } catch (error) {
      console.error('Error analyzing call:', error);
      throw error;
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
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" placeholder="First and Last Name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="Your Email" required />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input id="phoneNumber" name="phoneNumber" type="tel" placeholder="Your Phone Number with Country Code" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company Name</Label>
            <Input id="company" name="company" placeholder="Company Name" required />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select name="role" required>
            <SelectTrigger id="role">
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vp-sales">VP of Sales</SelectItem>
              <SelectItem value="ceo">CEO</SelectItem>
              <SelectItem value="cto">CTO</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="useCase">Use case</Label>
          <Textarea id="useCase" name="useCase" placeholder="Interview call screening" className="h-24" required />
        </div>
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Sending..." : "Call Me"}
        </Button>
        
        {error && <p className="text-red-500">{error}</p>}
        {callId && <p>Call ID: {callId}</p>}
      </form>
      <StatusModal isOpen={showModal} />
    </div>
  )
}