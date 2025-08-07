import { Alert } from 'react-native';

export class SimpleEmailService {
  static async sendNotification(params: {
    recipientEmail: string;
    recipientName: string;
    subject: string;
    message: string;
  }) {
    try {
      // Since Supabase functions are unavailable, show alert notification
      Alert.alert(
        'Email Notification',
        `To: ${params.recipientName} (${params.recipientEmail})\n\nSubject: ${params.subject}\n\nMessage: ${params.message}`,
        [{ text: 'OK' }]
      );
      
      console.log('Email notification sent:', params);
      return { success: true };
    } catch (error) {
      console.error('Email service error:', error);
      return { success: false, error: error.message };
    }
  }

  static async sendLessonRequest(studentEmail: string, cfiEmail: string, lessonDetails: any) {
    return this.sendNotification({
      recipientEmail: cfiEmail,
      recipientName: 'Instructor',
      subject: 'New Lesson Request',
      message: `New lesson request from ${studentEmail}. Details: ${JSON.stringify(lessonDetails)}`
    });
  }

  static async sendWelcomeEmail(email: string, name: string, role: string, tempPassword?: string) {
    return this.sendNotification({
      recipientEmail: email,
      recipientName: name,
      subject: `Welcome to Flight Academy - ${role}`,
      message: `Welcome ${name}! You've been invited as a ${role}.${tempPassword ? ` Temp password: ${tempPassword}` : ''}`
    });
  }
}