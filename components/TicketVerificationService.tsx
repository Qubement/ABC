import { supabase } from '../app/lib/supabase';

export interface TicketVerificationResult {
  success: boolean;
  error?: string;
  ticketNumber?: string;
  details?: string;
}

export class TicketVerificationService {
  static async verifyAndGenerateTicket(
    lessonRequestId: string,
    studentId: string,
    cfiId: string,
    aircraftId: string,
    selectedDate: string,
    selectedTime: string,
    onStatusUpdate: (status: string) => void
  ): Promise<TicketVerificationResult> {
    try {
      // Step 1: Verify student exists
      onStatusUpdate('Verifying student information...');
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('name, email')
        .eq('id', studentId)
        .single();
      
      if (studentError) {
        return { success: false, error: `Student verification failed: ${studentError.message}` };
      }
      if (!studentData) {
        return { success: false, error: 'Student not found in database' };
      }
      
      // Step 2: Verify CFI exists
      onStatusUpdate('Verifying CFI information...');
      const { data: cfiData, error: cfiError } = await supabase
        .from('cfis')
        .select('name, email')
        .eq('id', cfiId)
        .single();
      
      if (cfiError) {
        return { success: false, error: `CFI verification failed: ${cfiError.message}` };
      }
      if (!cfiData) {
        return { success: false, error: 'Selected CFI not found in database' };
      }
      
      // Step 3: Verify aircraft exists
      onStatusUpdate('Verifying aircraft information...');
      const { data: aircraftData, error: aircraftError } = await supabase
        .from('aircraft')
        .select('tail_number, model')
        .eq('id', aircraftId)
        .single();
      
      if (aircraftError) {
        return { success: false, error: `Aircraft verification failed: ${aircraftError.message}` };
      }
      if (!aircraftData) {
        return { success: false, error: 'Selected aircraft not found in database' };
      }
      
      // Step 4: Generate unique ticket number
      onStatusUpdate('Generating unique ticket number...');
      const ticketNumber = `LR${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      
      // Step 5: Create ticket data
      onStatusUpdate('Preparing ticket data...');
      const ticketData = {
        studentName: studentData.name,
        studentEmail: studentData.email,
        cfiName: cfiData.name,
        cfiEmail: cfiData.email,
        aircraftInfo: `${aircraftData.tail_number} (${aircraftData.model})`,
        requestedDate: selectedDate,
        requestedTime: selectedTime,
        createdAt: new Date().toISOString(),
        status: 'pending'
      };

      // Step 6: Insert ticket into database
      onStatusUpdate('Storing ticket in database...');
      const { error: insertError } = await supabase
        .from('lesson_tickets')
        .insert({
          ticket_number: ticketNumber,
          lesson_request_id: lessonRequestId,
          student_id: studentId,
          cfi_id: cfiId,
          aircraft_id: aircraftId,
          status: 'pending',
          ticket_data: ticketData
        });

      if (insertError) {
        return { success: false, error: `Failed to store ticket: ${insertError.message}` };
      }
      
      // Step 7: Verify ticket was stored correctly
      onStatusUpdate('Verifying ticket storage...');
      const { data: verifyTicket, error: verifyError } = await supabase
        .from('lesson_tickets')
        .select('ticket_number, status, created_at')
        .eq('ticket_number', ticketNumber)
        .single();
        
      if (verifyError) {
        return { success: false, error: `Ticket verification failed: ${verifyError.message}` };
      }
      if (!verifyTicket) {
        return { success: false, error: 'Ticket was not properly stored in database' };
      }
      
      // Step 8: Final success verification
      onStatusUpdate('Ticket successfully generated and verified!');
      
      return { 
        success: true, 
        ticketNumber,
        details: `Ticket created for ${studentData.name} with CFI ${cfiData.name} on ${selectedDate} at ${selectedTime}`
      };
      
    } catch (error: any) {
      return { 
        success: false, 
        error: `Unexpected error during ticket generation: ${error.message}` 
      };
    }
  }

  static async checkTicketExists(ticketNumber: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('lesson_tickets')
        .select('id')
        .eq('ticket_number', ticketNumber)
        .single();
      
      return !error && !!data;
    } catch {
      return false;
    }
  }
}