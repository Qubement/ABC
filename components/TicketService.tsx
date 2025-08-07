import { supabase } from '../app/lib/supabase';

interface LessonRequestData {
  id: string;
  student_id: string;
  cfi_id: string;
  aircraft_id: string;
  requested_date: string;
  requested_start_time: string;
  requested_end_time: string;
  status: string;
  student_message?: string;
  created_at: string;
}

interface LessonTicket {
  id: string;
  ticketNumber: string;
  studentName: string;
  cfiName: string;
  aircraftInfo: string;
  requestedDate: string;
  requestedTime: string;
  status: string;
  createdAt: string;
  studentMessage?: string;
}

export class TicketService {
  static generateTicketNumber(requestId: string): string {
    const timestamp = Date.now().toString().slice(-6);
    const shortId = requestId.slice(-4).toUpperCase();
    return `LR${timestamp}${shortId}`;
  }

  static async generateAndStoreTicket(requestData: LessonRequestData): Promise<{ success: boolean; error?: string; ticketNumber?: string }> {
    try {
      // Fetch student name
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('first_name, last_name, email')
        .eq('id', requestData.student_id)
        .single();

      if (studentError) {
        return { success: false, error: `Student lookup failed: ${studentError.message}` };
      }

      // Fetch CFI name
      const { data: cfiData, error: cfiError } = await supabase
        .from('cfis')
        .select('name, email')
        .eq('id', requestData.cfi_id)
        .single();

      if (cfiError) {
        return { success: false, error: `CFI lookup failed: ${cfiError.message}` };
      }

      // Fetch aircraft info
      const { data: aircraftData, error: aircraftError } = await supabase
        .from('aircraft')
        .select('tail_number, model')
        .eq('id', requestData.aircraft_id)
        .single();

      if (aircraftError) {
        return { success: false, error: `Aircraft lookup failed: ${aircraftError.message}` };
      }

      const ticketNumber = this.generateTicketNumber(requestData.id);
      
      const ticketData = {
        studentName: studentData ? `${studentData.first_name} ${studentData.last_name}` : 'Unknown Student',
        studentEmail: studentData?.email || '',
        cfiName: cfiData?.name || 'Unknown CFI',
        cfiEmail: cfiData?.email || '',
        aircraftInfo: aircraftData ? `${aircraftData.tail_number} (${aircraftData.model})` : 'Unknown Aircraft',
        requestedDate: requestData.requested_date,
        requestedTime: `${requestData.requested_start_time} - ${requestData.requested_end_time}`,
        createdAt: new Date().toISOString(),
        status: 'pending'
      };

      // Store ticket in database
      const { error: insertError } = await supabase
        .from('lesson_tickets')
        .insert({
          ticket_number: ticketNumber,
          lesson_request_id: requestData.id,
          student_id: requestData.student_id,
          cfi_id: requestData.cfi_id,
          aircraft_id: requestData.aircraft_id,
          status: 'pending',
          ticket_data: ticketData
        });

      if (insertError) {
        return { success: false, error: `Failed to store ticket: ${insertError.message}` };
      }

      return { success: true, ticketNumber };
    } catch (error: any) {
      return { success: false, error: `Unexpected error: ${error.message}` };
    }
  }

  static async generateTicketFromRequest(requestData: LessonRequestData): Promise<LessonTicket | null> {
    try {
      // Fetch student name
      const { data: studentData } = await supabase
        .from('students')
        .select('first_name, last_name')
        .eq('id', requestData.student_id)
        .single();

      // Fetch CFI name
      const { data: cfiData } = await supabase
        .from('cfis')
        .select('name')
        .eq('id', requestData.cfi_id)
        .single();

      // Fetch aircraft info
      const { data: aircraftData } = await supabase
        .from('aircraft')
        .select('tail_number, model')
        .eq('id', requestData.aircraft_id)
        .single();

      const ticket: LessonTicket = {
        id: requestData.id,
        ticketNumber: this.generateTicketNumber(requestData.id),
        studentName: studentData ? `${studentData.first_name} ${studentData.last_name}` : 'Unknown Student',
        cfiName: cfiData?.name || 'Unknown CFI',
        aircraftInfo: aircraftData ? `${aircraftData.tail_number} - ${aircraftData.model}` : 'Unknown Aircraft',
        requestedDate: requestData.requested_date,
        requestedTime: `${requestData.requested_start_time} - ${requestData.requested_end_time}`,
        status: requestData.status,
        createdAt: requestData.created_at,
        studentMessage: requestData.student_message
      };

      return ticket;
    } catch (error) {
      console.error('Error generating ticket:', error);
      return null;
    }
  }

  static async generateTicketsFromRequests(requests: LessonRequestData[]): Promise<LessonTicket[]> {
    const tickets: LessonTicket[] = [];
    
    for (const request of requests) {
      const ticket = await this.generateTicketFromRequest(request);
      if (ticket) {
        tickets.push(ticket);
      }
    }
    
    return tickets;
  }
}