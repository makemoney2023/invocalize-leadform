import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface StatusModalProps {
  isOpen: boolean;
}

export function StatusModal({ isOpen }: StatusModalProps) {
  return (
    <Dialog open={isOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Processing Data</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Progress value={33} className="w-full" />
          <p className="mt-2 text-center">Redirecting to Dashboard...</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
