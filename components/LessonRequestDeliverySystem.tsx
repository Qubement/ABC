import { supabase } from '../app/lib/supabase';

interface LessonRequestData {
  studentId: string;
  cfiId: string;
  date: string;
  time: string;
  aircraftId: string;
  scheduleId: string;
}

export class LessonRequestDeliverySystem {
  static async submitRequest(requestData: LessonRequestData) {
    try {
      console.log('Submitting request:', requestData);
      
      // Get current user first
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Insert lesson request with proper error handling
      const { data: request, error: requestError } = await supabase
        .from('lesson_requests')
        .insert({
          student_id: user.id,
          cfi_id: requestData.cfiId,
          date: requestData.date,
          time: requestData.time,
          aircraft_id: requestData.aircraftId,
          schedule_id: requestData.scheduleId,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (requestError) {
        console.error('Database error:', requestError);
        throw requestError;
      }

      console.log('Request submitted successfully:', request);
      
      // Send notification (non-blocking)
      this.notifyCFI(requestData.cfiId, request.id).catch(console.error);

      return { success: true, requestId: request.id };
    } catch (error) {
      console.error('Error submitting request:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  static async notifyCFI(cfiId: string, requestId: string) {
    try {
      const channel = supabase.channel('lesson-requests');
      
      await channel.send({
        type: 'broadcast',
        event: 'new_request',
        payload: {
          cfi_id: cfiId,
          request_id: requestId,
          timestamp: new Date().toISOString()
        }
      });

      return true;
    } catch (error) {
      console.error('Error notifying CFI:', error);
      return false;
    }
  }

  static async approveRequest(requestId: string) {
    try {
      const { error } = await supabase
        .from('lesson_requests')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      await this.updateScheduleAvailability(requestId, false);
      return { success: true };
    } catch (error) {
      console.error('Error approving request:', error);
      return { success: false, error };
    }
  }

  static async rejectRequest(requestId: string) {
    try {
      const { error } = await supabase
        .from('lesson_requests')
        .update({ 
          status: 'rejected',
          rejected_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error rejecting request:', error);
      return { success: false, error };
    }
  }

  static async updateScheduleAvailability(requestId: string, isAvailable: boolean) {
    try {
      const { data: request } = await supabase
        .from('lesson_requests')
        .select('schedule_id')
        .eq('id', requestId)
        .single();

      if (request?.schedule_id) {
        await supabase
          .from('schedules')
          .update({ is_available: isAvailable })
          .eq('id', request.schedule_id);
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
    }
  }

  static subscribeToRequests(cfiId: string, callback: (payload: any) => void) {
    const channel = supabase.channel('lesson-requests');
    
    channel
      .on('broadcast', { event: 'new_request' }, (payload) => {
        if (payload.payload.cfi_id === cfiId) {
          callback(payload.payload);
        }
      })
      .subscribe();

    return channel;
  }
}

export default LessonRequestDeliverySystem;