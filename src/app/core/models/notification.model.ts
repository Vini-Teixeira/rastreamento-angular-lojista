export type NotificationType = 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR'

export interface Notification {
  id: string; 
  tipo: string;
  titulo: string;
  mensagem: string;
  delivery?: any;
  socorro?: any;
  timestamp: Date;
  read: boolean;
}
