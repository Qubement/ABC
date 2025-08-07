import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#45B7D1', padding: 20, paddingTop: 60, flexDirection: 'row', alignItems: 'center' },
  title: { color: 'white', fontSize: 20, fontWeight: 'bold', marginLeft: 15 },
  buttonColumn: { padding: 20, gap: 15 },
  button: { backgroundColor: 'white', padding: 20, borderRadius: 10, borderWidth: 1, borderColor: '#ddd' },
  buttonText: { fontSize: 16, color: '#333', textAlign: 'center' },
  submitButton: { backgroundColor: '#45B7D1', padding: 20, borderRadius: 10, marginTop: 20 },
  disabledButton: { backgroundColor: '#ccc', opacity: 0.6 },
  submitText: { color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', padding: 30, borderRadius: 15, width: '85%', maxWidth: 400 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  statusContainer: { alignItems: 'center', gap: 15 },
  statusText: { fontSize: 14, textAlign: 'center', color: '#333' },
  successContainer: { alignItems: 'center', gap: 15 },
  successText: { fontSize: 16, textAlign: 'center', color: '#4CAF50', fontWeight: 'bold' },
  errorContainer: { alignItems: 'center', gap: 15 },
  errorText: { fontSize: 14, textAlign: 'center', color: '#f44336' },
  closeButton: { backgroundColor: '#45B7D1', padding: 12, borderRadius: 8, minWidth: 100 },
  closeButtonText: { color: 'white', fontWeight: 'bold', textAlign: 'center' }
});
